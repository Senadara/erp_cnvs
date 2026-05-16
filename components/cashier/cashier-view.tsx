"use client";

import * as React from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatCurrencyIdr, toDecimal } from "@/lib/money";
import { processSale } from "@/lib/actions/sale";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { printReceipt, type ReceiptTx } from "@/lib/receipt-print";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: string;
  imageUrl: string | null;
};

export function CashierView({
  outletId,
  products,
  stockMap,
  shiftId,
}: {
  outletId: string;
  products: ProductRow[];
  stockMap: Record<string, number>;
  shiftId: string;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<string>("Semua");
  const [cartOpen, setCartOpen] = React.useState(false);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [cashReceived, setCashReceived] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [unpaidOnly, setUnpaidOnly] = React.useState(false);

  const items = useCartStore((s) => s.items);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);

  const categories = React.useMemo(() => {
    const s = new Set(products.map((p) => p.category));
    return ["Semua", ...[...s].sort()];
  }, [products]);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return products.filter((p) => {
      const okCat = cat === "Semua" || p.category === cat;
      const okQ =
        !qq || p.name.toLowerCase().includes(qq) || p.category.toLowerCase().includes(qq);
      return okCat && okQ;
    });
  }, [products, q, cat]);

  const total = getTotal();

  const onPay = async () => {
    setBusy(true);
    try {
      const paymentStatus = unpaidOnly ? "UNPAID" : "PAID";
      const created = await processSale({
        outletId,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          pricePerPorsi: i.pricePerPorsi,
          qtyPorsi: i.qtyPorsi,
          note: i.note,
        })),
        paymentStatus,
        paymentMethod: unpaidOnly ? null : paymentMethod,
        cashReceived: unpaidOnly ? null : paymentMethod === "CASH" ? cashReceived : null,
        note: note.trim() || null,
      });
      toast.success(unpaidOnly ? "Order tercatat (belum lunas)" : "Transaksi berhasil");
      const rx: ReceiptTx = {
        outletName: created.outlet.name,
        invoiceNumber: created.invoiceNumber,
        createdAt: created.createdAt.toISOString(),
        paymentStatus: created.paymentStatus,
        paymentMethod: created.paymentMethod,
        totalAmount: created.totalAmount.toString(),
        cashReceived: created.cashReceived?.toString() ?? null,
        changeAmount: created.changeAmount?.toString() ?? null,
        note: created.note,
        items: created.items.map((it) => ({
          productName: it.productName,
          qtyPorsi: it.qtyPorsi,
          pricePerPorsi: it.pricePerPorsi.toString(),
          subtotal: it.subtotal.toString(),
        })),
      };
      if (!printReceipt(rx)) {
        toast.message("Popup diblokir", { description: "Struk tidak dicetak. Buka menu Struk untuk cetak ulang." });
      }
      clearCart();
      setCashReceived("");
      setNote("");
      setUnpaidOnly(false);
      setCheckoutOpen(false);
      setCartOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memproses transaksi");
    } finally {
      setBusy(false);
    }
  };

  const CartBody = (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Keranjang kosong</p>
          ) : (
            items.map((i) => (
              <div
                key={i.productId}
                className="bg-card flex flex-col gap-2 rounded-xl border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{i.productName}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatCurrencyIdr(i.pricePerPorsi)} / porsi
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(i.productId)}>
                    Hapus
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-12 min-w-12"
                    onClick={() => updateQty(i.productId, i.qtyPorsi - 1)}
                  >
                    −
                  </Button>
                  <span className="w-10 text-center font-semibold tabular-nums">
                    {i.qtyPorsi}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-12 min-w-12"
                    onClick={() => updateQty(i.productId, i.qtyPorsi + 1)}
                  >
                    +
                  </Button>
                  <div className="ml-auto text-sm font-semibold tabular-nums">
                    {formatCurrencyIdr(toDecimal(i.pricePerPorsi).times(i.qtyPorsi))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Separator className="shrink-0" />

        <div className="shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="unpaid">Catat belum lunas</Label>
              <p className="text-muted-foreground text-xs">
                Struk tetap terbit; pembayaran bisa dilakukan nanti di menu Struk.
              </p>
            </div>
            <Switch id="unpaid" checked={unpaidOnly} onCheckedChange={setUnpaidOnly} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label>Pembayaran</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Tunai</span>
                <Switch
                  checked={paymentMethod === "QRIS"}
                  onCheckedChange={(v) => setPaymentMethod(v ? "QRIS" : "CASH")}
                  disabled={unpaidOnly}
                />
                <span className="text-muted-foreground text-sm">QRIS</span>
              </div>
            </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Total</p>
            <p className="text-xl font-semibold tabular-nums">{formatCurrencyIdr(total)}</p>
          </div>
        </div>

        <Button
          type="button"
          className="min-h-12 w-full"
          disabled={items.length === 0}
          onClick={() => setCheckoutOpen(true)}
        >
          Bayar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4 pb-24 lg:flex-row lg:items-start lg:pb-0">
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Kasir</h1>
            <p className="text-muted-foreground text-sm">Pilih produk dan bayar</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (confirm("Apakah Anda yakin ingin menutup shift ini?")) {
                try {
                  const { closeShift } = await import("@/lib/actions/shift");
                  await closeShift(shiftId);
                  toast.success("Shift berhasil ditutup");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Gagal menutup shift");
                }
              }
            }}
          >
            Tutup Shift
          </Button>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari produk..."
            className="h-12 pl-10"
          />
        </div>

        <Tabs value={cat} onValueChange={setCat} className="w-full">
          <TabsList className="h-auto w-full justify-start overflow-x-auto">
            {categories.map((c) => (
              <TabsTrigger key={c} value={c} className="min-h-10 shrink-0">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const stok = stockMap[p.id] ?? 0;
            const limitless = stok >= 999999;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (!limitless && stok <= 0) {
                    toast.error("Stok habis untuk produk ini");
                    return;
                  }
                  addItem({ id: p.id, name: p.name, price: p.price });
                }}
                className="bg-card hover:border-primary/40 flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors"
              >
                <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-lg">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 45vw, 220px"
                    />
                  ) : (
                    <div className="text-muted-foreground flex size-full items-center justify-center text-xs">
                      Tanpa gambar
                    </div>
                  )}
                </div>
                <div className="flex w-full items-start justify-between gap-2">
                  <p className="line-clamp-2 font-medium leading-snug">{p.name}</p>
                  <Badge variant={!limitless && stok <= 0 ? "destructive" : "secondary"} className="shrink-0">
                    {limitless ? "∞" : `${stok} porsi`}
                  </Badge>
                </div>
                <p className="text-primary font-semibold tabular-nums">
                  {formatCurrencyIdr(p.price)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="bg-card hidden w-full max-w-md shrink-0 flex-col rounded-xl border p-4 lg:flex lg:max-w-[360px] lg:sticky lg:top-4 lg:max-h-[calc(100dvh-7rem)] lg:min-h-0 lg:self-start lg:overflow-hidden">
        <h2 className="mb-3 shrink-0 text-lg font-semibold">Keranjang</h2>
        <div className="flex min-h-0 flex-1 flex-col">{CartBody}</div>
      </aside>

      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 border-t bg-background/95 p-3 backdrop-blur-md lg:hidden">
        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">Keranjang</p>
              <p className="truncate font-semibold">
                {items.length} item · {formatCurrencyIdr(total)}
              </p>
            </div>
            <SheetTrigger className={cn(buttonVariants(), "min-h-12 shrink-0")}>
              Lihat
            </SheetTrigger>
          </div>
          <SheetContent side="bottom" className="h-[85dvh] p-4">
            <SheetHeader>
              <SheetTitle>Keranjang</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex h-[calc(85dvh-5rem)] flex-col">{CartBody}</div>
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {unpaidOnly && (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                Order akan tercatat sebagai <strong>belum lunas</strong>. Cetak struk tetap jalan.
              </p>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold tabular-nums">{formatCurrencyIdr(total)}</span>
            </div>
            {!unpaidOnly && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="font-medium">{paymentMethod}</span>
                </div>
                {paymentMethod === "CASH" && (
                  <div className="space-y-2">
                    <Label htmlFor="cash">Uang diterima</Label>
                    <Input
                      id="cash"
                      inputMode="decimal"
                      className="h-12"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0"
                    />
                    {cashReceived && (
                      <p className="text-muted-foreground text-sm">
                        Kembalian:{" "}
                        {formatCurrencyIdr(
                          (() => {
                            const cr = toDecimal(cashReceived || 0);
                            const ch = cr.minus(total);
                            return ch.lt(0) ? 0 : ch;
                          })()
                        )}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="note">Catatan (opsional)</Label>
              <Input
                id="note"
                className="h-12"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} disabled={busy}>
              Batal
            </Button>
            <Button onClick={onPay} disabled={busy}>
              {busy ? "Memproses..." : unpaidOnly ? "Simpan order" : "Selesaikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
