import { requireNav } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function UserLogsPage() {
  await requireNav("users");

  const logs = await prisma.userActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: {
          displayName: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Histori Interaksi User</h1>
        <p className="text-muted-foreground text-sm">
          Melihat kapan user login, logout, atau melakukan aksi lainnya. Maksimal menampilkan 100 histori terakhir.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Keterangan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Belum ada riwayat aktivitas.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{log.user.displayName}</span>
                      <span className="text-xs text-muted-foreground">{log.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.action === "LOGIN" ? "default" : log.action === "LOGOUT" ? "secondary" : "outline"}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.description || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
