"use client";

import { AlertTriangle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { LowStockRow } from "@/lib/actions/analytics";

const LEVEL_COLOR = {
  critical: "#ef4444",
  low: "#f97316",
  ok: "#22c55e",
};

export function StockOverview({
  low,
  criticalCount,
  lowCount,
}: {
  low: LowStockRow[];
  criticalCount: number;
  lowCount: number;
}) {
  const chartData = low.slice(0, 12).map((r) => ({
    name: r.name.length > 14 ? `${r.name.slice(0, 14)}…` : r.name,
    percent: r.percent,
    level: r.level,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className={cn(criticalCount > 0 && "border-destructive/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="text-destructive size-4" />
              Stok habis / kritis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{criticalCount}</p>
          </CardContent>
        </Card>
        <Card className={cn(lowCount > 0 && "border-orange-500/40")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <Package className="size-4 text-orange-500" />
              Di bawah batas minimum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{lowCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Perlu perhatian</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{low.length}</p>
          </CardContent>
        </Card>
      </div>

      {low.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Level stok (% dari minimum)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => `${v}% dari batas minimum`} />
                  <Bar dataKey="percent" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={LEVEL_COLOR[entry.level]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daftar stok menipis</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 space-y-2 overflow-y-auto">
              {low.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {r.currentStock} / {r.minStockAlert} {r.unitName}
                    </p>
                  </div>
                  <Badge
                    variant={r.level === "critical" ? "destructive" : "secondary"}
                    className="shrink-0"
                  >
                    {r.level === "critical" ? "Kritis" : "Rendah"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
