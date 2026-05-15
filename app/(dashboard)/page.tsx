import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireLogin } from "@/lib/guard";
import { resolveOutletId, getOutletsForUser } from "@/lib/actions/outlet";
import { getDailySummary, getLast7DaysRevenue, getLowStockCount } from "@/lib/actions/report";
import { getDashboardAnalytics } from "@/lib/actions/analytics";
import { formatCurrencyIdr, toDecimal } from "@/lib/money";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import { canSeeNav } from "@/lib/permissions";

export default async function DashboardPage() {
  const user = await requireLogin();
  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const outlets = await getOutletsForUser(allowed);
  const outletId = await resolveOutletId(allowed);
  const outletName = outlets.find((o) => o.id === outletId)?.name ?? "";

  if (!outletId) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Belum ada outlet</h1>
        <p className="text-muted-foreground text-sm">
          Hubungi owner untuk menugaskan outlet ke akun Anda, atau jalankan seed database.
        </p>
        {user.role === "OWNER" && canSeeNav(user, "outlets") && (
          <Link href="/outlets" className={cn(buttonVariants(), "min-h-11")}>
            Kelola outlet
          </Link>
        )}
      </div>
    );
  }

  if (user.role === "MITRA") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard Mitra</h1>
          <p className="text-muted-foreground text-sm">
            Anda hanya melihat stok dan laporan untuk produk/item yang ditugaskan owner.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Laporan penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/reports" className={cn(buttonVariants(), "min-h-11 w-full")}>
                Buka laporan
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stok</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/stock" className={cn(buttonVariants({ variant: "outline" }), "min-h-11 w-full")}>
                Lihat stok
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const today = new Date();
  const [daily, lowStock, last7, analytics] = await Promise.all([
    getDailySummary(outletId, today),
    getLowStockCount(outletId),
    getLast7DaysRevenue(outletId),
    getDashboardAnalytics(outletId, 30),
  ]);

  const kasLaci = toDecimal(daily.cashSales).minus(toDecimal(daily.expenses)).toString();
  const showCashier = canSeeNav(user, "cashier");
  const showOwnerAll = user.role === "OWNER";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {outletName ? `Outlet: ${outletName}` : "Ringkasan operasional"} · 30 hari terakhir untuk analitik
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showOwnerAll && canSeeNav(user, "owner") && (
            <Link href="/owner" className={cn(buttonVariants({ variant: "outline" }), "min-h-12")}>
              Semua outlet
            </Link>
          )}
          {showCashier && (
            <Link href="/cashier" className={cn(buttonVariants({ variant: "outline" }), "min-h-12")}>
              Buka Kasir
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Omzet hari ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrencyIdr(daily.totalSales)}</p>
            <p className="text-muted-foreground mt-1 text-xs">{daily.transactionCount} transaksi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kas vs pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrencyIdr(kasLaci)}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Tunai {formatCurrencyIdr(daily.cashSales)} · QRIS {formatCurrencyIdr(daily.qrisSales)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran hari ini</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrencyIdr(daily.expenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stok menipis</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2">
            <Badge variant={lowStock > 0 ? "destructive" : "secondary"} className="text-base">
              {lowStock} item
            </Badge>
            {canSeeNav(user, "stock") && (
              <Link href="/stock" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}>
                Stok
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <DashboardCharts data={last7} paymentSplit={{ cash: daily.cashSales, qris: daily.qrisSales }} />
      <DashboardInsights
        topSelling={analytics.topSelling}
        topProfit={analytics.topProfit}
        categoryRows={analytics.categoryRows}
        financialSeries={analytics.financialSeries}
      />
    </div>
  );
}
