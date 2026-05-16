"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { openShift } from "@/lib/actions/shift";
import { formatCurrencyIdr } from "@/lib/money";
import { Store, Wallet } from "lucide-react";

export function OpenShiftView({ outletId }: { outletId: string }) {
  const [cash, setCash] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(cash);
    
    if (isNaN(amount) || amount < 0) {
      toast.error("Nominal tidak valid");
      return;
    }

    setBusy(true);
    try {
      await openShift(outletId, amount);
      toast.success("Shift berhasil dibuka!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuka shift");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Store className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold">Buka Kasir</CardTitle>
          <CardDescription>
            Masukkan modal awal laci kasir (uang tunai) untuk memulai shift
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cash">Modal Awal / Uang Kembalian</Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Wallet className="h-5 w-5" />
                </div>
                <Input
                  id="cash"
                  type="number"
                  placeholder="0"
                  className="pl-10 h-12 text-lg"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  required
                  min="0"
                  step="1000"
                />
              </div>
              {cash && !isNaN(Number(cash)) && (
                <p className="text-sm text-primary font-medium">
                  {formatCurrencyIdr(Number(cash))}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12 text-lg font-semibold" type="submit" disabled={busy}>
              {busy ? "Membuka..." : "Buka Shift Kasir"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
