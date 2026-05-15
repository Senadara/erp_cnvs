"use client";

import { formatCurrencyIdr } from "@/lib/money";

export type ReceiptTx = {
  outletName: string;
  outletAddress?: string | null;
  outletPhone?: string | null;
  invoiceNumber: string;
  createdAt: string;
  paymentStatus: string;
  paymentMethod: string | null;
  totalAmount: string;
  cashReceived?: string | null;
  changeAmount?: string | null;
  note?: string | null;
  items: {
    productName: string;
    qtyPorsi: number;
    pricePerPorsi: string;
    subtotal: string;
  }[];
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printReceipt(tx: ReceiptTx) {
  const rows = tx.items
    .map(
      (it) =>
        `<tr><td>${esc(it.productName)}</td><td class="r">${it.qtyPorsi}</td><td class="r">${formatCurrencyIdr(it.subtotal)}</td></tr>`
    )
    .join("");
  const statusLabel = tx.paymentStatus === "PAID" ? "Lunas" : "Belum lunas";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Struk</title>
<style>
  body{font-family:system-ui,sans-serif;padding:12px;max-width:320px;margin:0 auto;font-size:13px;}
  h1{font-size:16px;margin:0 0 4px;}
  .muted{color:#666;font-size:11px;}
  table{width:100%;border-collapse:collapse;margin:10px 0;}
  th,td{padding:4px 0;border-bottom:1px solid #eee;font-size:12px;}
  th{text-align:left;font-size:11px;color:#666;}
  .r{text-align:right;}
  .total{font-weight:700;font-size:15px;margin-top:8px;}
  .badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;margin-top:6px;background:#eee;}
  @media print{body{max-width:none}}
</style></head><body>
  <h1>${esc(tx.outletName)}</h1>
  <div class="muted">${esc(tx.invoiceNumber)}</div>
  <div class="muted">${new Date(tx.createdAt).toLocaleString("id-ID")}</div>
  <span class="badge">${esc(statusLabel)}</span>
  ${tx.paymentMethod ? `<div class="muted" style="margin-top:6px">Bayar: ${esc(tx.paymentMethod)}</div>` : ""}
  <table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="total r">Total: ${formatCurrencyIdr(tx.totalAmount)}</div>
  ${tx.cashReceived ? `<div class="muted r">Tunai: ${formatCurrencyIdr(tx.cashReceived)}</div>` : ""}
  ${tx.changeAmount ? `<div class="muted r">Kembali: ${formatCurrencyIdr(tx.changeAmount)}</div>` : ""}
  ${tx.note ? `<div class="muted" style="margin-top:8px">${esc(tx.note)}</div>` : ""}
  <p class="muted" style="margin-top:16px;text-align:center">Terima kasih</p>
</body></html>`;

  const w = window.open("", "_blank", "width=380,height=720");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  w.close();
  return true;
}
