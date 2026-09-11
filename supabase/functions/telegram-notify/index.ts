// Supabase Edge Function — sends a Telegram message to the staff chat when a
// new row lands in `reservations` (and, later, `orders` — see formatOrder
// below). Triggered by a Supabase Database Webhook (Database → Webhooks in
// the dashboard, or an equivalent `supabase_functions.http_request` trigger
// in a migration), not called directly by the website.
//
// Scalable-by-design: a Database Webhook payload always carries `table` and
// `record`, so adding Telegram notifications for a new table later (orders,
// once Блок 6 delivery ships) means adding one more webhook pointed at this
// same function — not writing a second function. See formatOrder for the
// shape that's already prepared (untested until real orders exist).
//
// Required secrets (set via `supabase secrets set`, never committed):
//   TELEGRAM_BOT_TOKEN — from @BotFather
//   TELEGRAM_CHAT_ID   — the staff group's chat id

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}

function formatDateTime(iso: unknown): string {
  if (typeof iso !== "string") return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatReservation(record: Record<string, unknown>): string {
  const lines = [
    "🆕 <b>Новая бронь</b>",
    "",
    `👤 ${escapeHtml(record.guest_name)}`,
    `📞 ${escapeHtml(record.guest_phone)}`,
    `🕐 ${escapeHtml(formatDateTime(record.reserved_at))}`,
    `👥 ${escapeHtml(record.party_size)} гостей`,
  ];
  if (record.guest_email) lines.push(`✉️ ${escapeHtml(record.guest_email)}`);
  if (record.comment) lines.push(`📝 ${escapeHtml(record.comment)}`);
  return lines.join("\n");
}

// Prepared for Блок 6 (Доставка и заказы) — not exercised by any real data
// yet, since the delivery order flow isn't built. `items` mirrors the shape
// documented in gastromania-spec.md: [{menu_item_id, name, price, qty}].
function formatOrder(record: Record<string, unknown>): string {
  const items = Array.isArray(record.items) ? record.items : [];
  const itemLines = items.map((item) => {
    const i = item as Record<string, unknown>;
    return `  • ${escapeHtml(i.name)} × ${escapeHtml(i.qty)}`;
  });

  const lines = [
    "🛵 <b>Новый заказ на доставку</b>",
    "",
    `👤 ${escapeHtml(record.guest_name)}`,
    `📞 ${escapeHtml(record.guest_phone)}`,
    `📍 ${escapeHtml(record.delivery_address)}`,
    "",
    "<b>Состав:</b>",
    ...itemLines,
    "",
    `💰 ${escapeHtml(record.total_amount)} ₽`,
  ];
  return lines.join("\n");
}

function formatMessage(payload: WebhookPayload): string | null {
  if (payload.type !== "INSERT" || !payload.record) return null;
  switch (payload.table) {
    case "reservations":
      return formatReservation(payload.record);
    case "orders":
      return formatOrder(payload.record);
    default:
      return null;
  }
}

async function sendTelegramMessage(text: string): Promise<void> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!botToken || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured");
  }

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API responded ${res.status}: ${body}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  // Basic shape validation — this function is reachable by anyone who has
  // the project's anon key (Supabase JWT verification alone doesn't
  // distinguish "the real database webhook" from "someone with the public
  // anon key"), so we don't blindly forward arbitrary text to the chat.
  if (typeof payload?.table !== "string" || typeof payload?.type !== "string") {
    return new Response("Malformed webhook payload", { status: 400 });
  }

  const message = formatMessage(payload);
  if (!message) {
    // Not an event we notify on (e.g. UPDATE, or an unrecognized table) —
    // acknowledge without erroring so Supabase doesn't retry pointlessly.
    return new Response(JSON.stringify({ skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await sendTelegramMessage(message);
  } catch (err) {
    console.error("telegram-notify: failed to send message", err);
    return new Response(JSON.stringify({ error: "Failed to send Telegram message" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
