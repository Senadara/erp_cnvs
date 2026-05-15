"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyIdr, toDecimal } from "@/lib/money";

type DayRow = { date: string; total: string; cash: string; qris: string };

export function DashboardCharts({
  data,
  paymentSplit,
}: {
  data: DayRow[];
  paymentSplit: { cash: string; qris: string };
}) {
  const barData = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
    totalNum: toDecimal(d.total).toNumber(),
  }));

  const cashN = toDecimal(paymentSplit.cash).toNumber();
  const qrisN = toDecimal(paymentSplit.qris).toNumber();
  const pieData = [
    { name: "Tunai", value: cashN, key: "cash" },
    { name: "QRIS", value: qrisN, key: "qris" },
  ].filter((d) => d.value > 0);

  const COLORS = ["#6366f1", "#22c55e"];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Omzet 7 hari terakhir</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={48} />
              <Tooltip
                formatter={(value) => formatCurrencyIdr(Number(value ?? 0))}
                labelFormatter={(l) => `Tanggal ${l}`}
              />
              <Bar dataKey="totalNum" radius={[6, 6, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metode pembayaran hari ini</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {pieData.length === 0 ? (
            <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
              Belum ada data pembayaran hari ini
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrencyIdr(Number(value ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
