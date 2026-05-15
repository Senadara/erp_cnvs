"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { markTransactionPaid } from "@/lib/actions/transaction";
import { formatCurrencyIdr } from "@/lib/money";
import { printReceipt, type ReceiptTx } from "@/lib/receipt-print";
import { useRouter } from "next/navigation";
import { Eye, Printer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export type ReceiptRow = {
  id: string;
  outletName: string;
  invoiceNumber: string;
  totalAmount: string;
  paymentMethod: string | null;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
  note: string | null;
  cashReceived: string | null;
  changeAmount: string | null;
  items: {
    productName: string;
    qtyPorsi: number;
    pricePerPorsi: string;
    subtotal: string;
  }[];
};

export function ReceiptsManager({ rows }: { rows: ReceiptRow[] }) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const filtered = React.useMemo(() => {
    if (tab === "PAID") return rows.filter((r) => r.paymentStatus === "PAID");
    if (tab === "UNPAID") return rows.filter((r) => r.paymentStatus === "UNPAID");
    return rows;
  }, [rows, tab]);

  const toReceipt = (r: ReceiptRow): ReceiptTx => ({
    outletName: r.outletName,
    invoiceNumber: r.invoiceNumber,
    createdAt: r.createdAt,
    paymentStatus: r.paymentStatus,
    paymentMethod: r.paymentMethod,
    totalAmount: r.totalAmount,
    cashReceived: r.cashReceived,
    changeAmount: r.changeAmount,
    note: r.note,
    items: r.items,
  });

  const [payOpen, setPayOpen] = React.useState(false);
  const [payRow, setPayRow] = React.useState<ReceiptRow | null>(null);
  const [payCash, setPayCash] = React.useState("");
  const [payMethod, setPayMethod] = React.useState<"CASH" | "QRIS">("CASH");
  const [busy, setBusy] = React.useState(false);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<ReceiptRow | null>(null);

  const openDetail = (r: ReceiptRow) => {
    setDetailRow(r);
    setDetailOpen(true);
  };

  const openPay = (r: ReceiptRow) => {
    setPayRow(r);
    setPayCash("");
    setPayMethod("CASH");
    setPayOpen(true);
  };

  const submitPay = async () => {
    if (!payRow) return;
    setBusy(true);
    try {
      await markTransactionPaid(
        payRow.id,
        payMethod,
        payMethod === "CASH" ? payCash || 0 : null
      );
      toast.success("Ditandai lunas");
      setPayOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="ALL">Semua</TabsTrigger>
          <TabsTrigger value="PAID">Lunas</TabsTrigger>
          <TabsTrigger value="UNPAID">Belum lunas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-card overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-xs">
                  {new Date(r.createdAt).toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="font-mono text-xs">{r.invoiceNumber}</TableCell>
                <TableCell>
                  <Badge variant={r.paymentStatus === "PAID" ? "secondary" : "destructive"}>
                    {r.paymentStatus === "PAID" ? "Lunas" : "Belum lunas"}
                  </Badge>
                  {r.paymentMethod && (
                    <span className="text-muted-foreground ml-2 text-xs">{r.paymentMethod}</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrencyIdr(r.totalAmount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-9"
                      title="Detail pesanan"
                      onClick={() => openDetail(r)}
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-9"
                      onClick={() => {
                        if (!printReceipt(toReceipt(r))) {
                          toast.error("Izinkan popup untuk mencetak struk.");
                        }
                      }}
                    >
                      <Printer className="size-4" />
                    </Button>
                    {r.paymentStatus === "UNPAID" && (
                      <Button
                        type="button"
                        size="sm"
                        className="min-h-9"
                        variant="default"
                        onClick={() => openPay(r)}
                      >
                        Bayar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detail pesanan</DialogTitle>
          </DialogHeader>
          {detailRow && (
            <ScrollArea className="max-h-[65dvh] pr-3">
              <div className="space-y-4 py-1">
                <div className="grid gap-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Outlet:</span> {detailRow.outletName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Invoice:</span>{" "}
                    <span className="font-mono">{detailRow.invoiceNumber}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Waktu:</span>{" "}
                    {new Date(detailRow.createdAt).toLocaleString("id-ID")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <Badge
                      variant={detailRow.paymentStatus === "PAID" ? "secondary" : "destructive"}
                      className="ml-1"
                    >
                      {detailRow.paymentStatus === "PAID" ? "Lunas" : "Belum lunas"}
                    </Badge>
                    {detailRow.paymentMethod && (
                      <span className="text-muted-foreground ml-2">{detailRow.paymentMethod}</span>
                    )}
                  </p>
                  {detailRow.paidAt && (
                    <p>
                      <span className="text-muted-foreground">Dibayar:</span>{" "}
                      {new Date(detailRow.paidAt).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="mb-2 font-medium">Item pesanan</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailRow.items.map((it, idx) => (
                        <TableRow key={`${detailRow.id}-${idx}`}>
                          <TableCell className="font-medium">{it.productName}</TableCell>
                          <TableCell className="text-right tabular-nums">{it.qtyPorsi}</TableCell>
                          <TableCell className="text-right tabular-nums text-xs">
                            {formatCurrencyIdr(it.pricePerPorsi)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrencyIdr(it.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{formatCurrencyIdr(detailRow.totalAmount)}</span>
                  </div>
                  {detailRow.paymentMethod === "CASH" && detailRow.cashReceived && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tunai diterima</span>
                        <span className="tabular-nums">
                          {formatCurrencyIdr(detailRow.cashReceived)}
                        </span>
                      </div>
                      {detailRow.changeAmount && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Kembalian</span>
                          <span className="tabular-nums">
                            {formatCurrencyIdr(detailRow.changeAmount)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {detailRow.note && (
                    <p className="text-muted-foreground pt-2">
                      <span className="font-medium text-foreground">Catatan:</span> {detailRow.note}
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {detailRow && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!printReceipt(toReceipt(detailRow))) {
                    toast.error("Izinkan popup untuk mencetak.");
                  }
                }}
              >
                <Printer className="mr-2 size-4" />
                Cetak
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pelunasan tunai — {payRow?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <p className="text-muted-foreground text-sm">
              Total {payRow ? formatCurrencyIdr(payRow.totalAmount) : "—"}
            </p>
            <div className="flex items-center justify-between gap-3 rounded-md border p-3">
              <span className="text-sm">Metode pelunasan</span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Tunai</span>
                <Switch
                  checked={payMethod === "QRIS"}
                  onCheckedChange={(v) => setPayMethod(v ? "QRIS" : "CASH")}
                />
                <span className="text-muted-foreground">QRIS</span>
              </div>
            </div>
            {payMethod === "CASH" && (
              <div className="grid gap-2">
                <Label>Uang diterima</Label>
                <Input
                  className="h-12"
                  inputMode="decimal"
                  value={payCash}
                  onChange={(e) => setPayCash(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} disabled={busy}>
              Batal
            </Button>
            <Button onClick={() => void submitPay()} disabled={busy}>
              Simpan lunas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
