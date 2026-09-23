"use client";

import { useState } from "react";
import { REASON_LABELS } from "./constants";

export type RevisionItemSnapshot = {
  name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export type OrderRevision = {
  id: string;
  created_at: string;
  reason_code: string;
  reason_note: string | null;
  customer_confirmed: boolean;
  old_items: RevisionItemSnapshot[];
  new_items: RevisionItemSnapshot[];
  old_total: number;
  new_total: number;
  old_comment: string | null;
  new_comment: string | null;
  changed_by_name: string | null;
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function ItemList({ items, muted }: { items: RevisionItemSnapshot[]; muted?: boolean }) {
  if (!items.length) return <p className="text-[#0A0A0A]/35 text-xs font-body">—</p>;
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, i) => (
        <div key={i} className={`flex justify-between gap-3 text-xs font-body ${muted ? "text-[#0A0A0A]/45" : "text-[#0A0A0A]/70"}`}>
          <span className="min-w-0 truncate">
            {item.name} × {item.quantity}
          </span>
          <span className="shrink-0">{item.subtotal} ₽</span>
        </div>
      ))}
    </div>
  );
}

export default function OrderRevisionHistory({ revisions }: { revisions: OrderRevision[] }) {
  const [open, setOpen] = useState(false);

  if (!revisions.length) return null;

  return (
    <div className="mt-4 border-t border-[#0A0A0A]/8 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="label-refined text-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
        style={{ fontSize: "0.625rem" }}
      >
        {open ? "Скрыть историю изменений" : `История изменений (${revisions.length})`}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          {revisions.map((rev) => (
            <div key={rev.id} className="rounded-[10px] border border-[#0A0A0A]/10 bg-[#0A0A0A]/[0.02] p-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                <span className="text-[#0A0A0A]/70 text-xs font-body font-medium">
                  {REASON_LABELS[rev.reason_code] ?? rev.reason_code}
                </span>
                <span className="text-[#0A0A0A]/40 text-xs font-body">{formatDateTime(rev.created_at)}</span>
                {rev.changed_by_name && (
                  <span className="text-[#0A0A0A]/40 text-xs font-body">· {rev.changed_by_name}</span>
                )}
                {rev.customer_confirmed && (
                  <span
                    className="label-refined px-2 py-0.5 rounded-full bg-[#3F6B4F]/12 text-[#3F6B4F]"
                    style={{ fontSize: "0.5625rem" }}
                  >
                    Согласовано с клиентом
                  </span>
                )}
              </div>

              {rev.reason_note && (
                <p className="text-[#0A0A0A]/55 text-xs font-body italic mb-2">«{rev.reason_note}»</p>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <span className="label-refined text-[#0A0A0A]/35 block mb-1" style={{ fontSize: "0.5625rem" }}>
                    Было · {rev.old_total} ₽
                  </span>
                  <ItemList items={rev.old_items} muted />
                </div>
                <div>
                  <span className="label-refined text-[#8C7355] block mb-1" style={{ fontSize: "0.5625rem" }}>
                    Стало · {rev.new_total} ₽
                  </span>
                  <ItemList items={rev.new_items} />
                </div>
              </div>

              {(rev.old_comment ?? "") !== (rev.new_comment ?? "") && (
                <p className="text-[#0A0A0A]/45 text-xs font-body mt-2">
                  Комментарий: «{rev.old_comment ?? "—"}» → «{rev.new_comment ?? "—"}»
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
