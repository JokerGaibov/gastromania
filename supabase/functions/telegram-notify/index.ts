// Supabase Edge Function — sends a Telegram message to the staff chat when a
// new row lands in `reservations`, or when an order's payment is confirmed
// (see formatOrder below). Triggered by a Supabase Database Webhook
// (Database → Webhooks in the dashboard, or an equivalent
// `supabase_functions.http_request`/pg_net trigger in a migration — see
// the 20260822090000 migration for why pg_net, not
// `supabase_functions.http_request`, is what actually works on this
// project), not called directly by the website.
//
// Orders notify on UPDATE, not INSERT — see formatMessage: a new order
// isn't real until it's paid (customer could abandon checkout, or payment
// could fail), so this only fires exactly at the payment_status
// pending→paid transition, per gastromania-spec.md Этап 5 / the owner's
// explicit "Telegram должен отправляться ТОЛЬКО после подтверждённой
// online payment". That transition can only happen via the payment
// webhook, never a normal client update — see the
// orders_guard_payment_status trigger, 20260911230000 migration — so by
// the time this function runs the order is genuinely paid.
//
// Not wired to any trigger yet (Блок 6 hasn't shipped, orders_items has no
// real data) — this file is prepared ahead of time so wiring it up later
// is "add one migration", not "rewrite this function".
//
// Required secrets (set via `supabase secrets set`, never committed):
//   TELEGRAM_BOT_TOKEN — from @BotFather
//   TELEGRAM_CHAT_ID   — the staff group's chat id
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are NOT something to set
// manually — every Supabase Edge Function gets them injected automatically
// at runtime. Using them here (to read order_items, a related table the
// Database Webhook payload itself doesn't include) is safe specifically
// because this is a trusted server-side Edge Function environment with its
// own secrets, never reachable from the browser — categorically different
// from the Next.js app, where service_role must never appear (see
// gastromania-tasks.md rule 8 and main.md v0.1.10's incident).

import { createClient } from "npm:@supabase/supabase-js@2";

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

function formatMoney(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : String(value ?? "—");
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

type OrderItemRow = { name: string; quantity: number; subtotal: number };

// order_items lives in its own table (20260911230000) — a Database Webhook
// payload only ever carries the `orders` row itself, never joined child
// rows, so the line items need their own round-trip query.
async function fetchOrderItems(orderId: string): Promise<OrderItemRow[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("telegram-notify: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not available");
    return [];
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("order_items")
    .select("name, quantity, subtotal")
    .eq("order_id", orderId);

  if (error) {
    console.error("telegram-notify: failed to fetch order_items", error);
    return [];
  }
  return (data ?? []) as OrderItemRow[];
}

// Prepared for Блок 6 — not exercised by any real data yet. Fields match
// the orders schema from the 20260911230000 migration: order_status and
// payment_status are separate columns (not conflated), delivery_fee is a
// checkout-time snapshot, comment mirrors the same field on reservations.
async function formatOrder(record: Record<string, unknown>): Promise<string> {
  const items = await fetchOrderItems(String(record.id));
  const itemLines = items.map(
    (item) => `  • ${escapeHtml(item.name)} × ${escapeHtml(item.quantity)} — ${formatMoney(item.subtotal)} ₽`
  );

  const deliveryFee = Number(record.delivery_fee ?? 0);
  const total = Number(record.total_amount ?? 0);

  const lines = [
    "🛵 <b>Оплаченный заказ на доставку</b>",
    "",
    `№ ${escapeHtml(record.id)}`,
    `👤 ${escapeHtml(record.guest_name)}`,
    `📞 ${escapeHtml(record.guest_phone)}`,
    `📍 ${escapeHtml(record.delivery_address)}`,
    `🕐 ${escapeHtml(formatDateTime(record.created_at))}`,
    "",
    "<b>Состав:</b>",
    ...itemLines,
    "",
    `Блюда: ${formatMoney(total - deliveryFee)} ₽`,
    `Доставка: ${formatMoney(deliveryFee)} ₽`,
    `💰 <b>Итого: ${formatMoney(total)} ₽</b>`,
    "✅ Оплата подтверждена",
  ];
  if (record.comment) lines.push(`📝 ${escapeHtml(record.comment)}`);
  return lines.join("\n");
}

async function formatMessage(payload: WebhookPayload): Promise<string | null> {
  if (payload.table === "reservations" && payload.type === "INSERT" && payload.record) {
    return formatReservation(payload.record);
  }

  if (
    payload.table === "orders" &&
    payload.type === "UPDATE" &&
    payload.record?.payment_status === "paid" &&
    payload.old_record?.payment_status !== "paid"
  ) {
    return await formatOrder(payload.record);
  }

  return null;
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

  const message = await formatMessage(payload);
  if (!message) {
    // Not an event we notify on (e.g. an order UPDATE that isn't the
    // pending→paid transition, or an unrecognized table) — acknowledge
    // without erroring so Supabase doesn't retry pointlessly.
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
