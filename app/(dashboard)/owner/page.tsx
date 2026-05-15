import { requireNav } from "@/lib/guard";
import { getOwnerOutletsSummary } from "@/lib/actions/owner";
import { getOwnerPerformance } from "@/lib/actions/analytics";
import { OwnerOutletSummary } from "@/components/owner/owner-outlet-summary";
import { OwnerPerformance } from "@/components/owner/owner-performance";

export default async function OwnerPage() {
  const user = await requireNav("owner");
  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const today = new Date();
  const [{ date, outlets }, performance] = await Promise.all([
    getOwnerOutletsSummary(today, allowed),
    getOwnerPerformance(today, allowed),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performa outlet</h1>
        <p className="text-muted-foreground text-sm">
          Ringkasan gabungan semua outlet yang Anda akses, plus detail per cabang.
          {user.role === "OWNER"
            ? " Owner melihat semua outlet."
            : " Petugas hanya melihat outlet yang ditugaskan."}
        </p>
      </div>
      <OwnerPerformance initial={performance} />
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Operasional harian per outlet</h2>
        <OwnerOutletSummary initialDate={date} initialRows={outlets} />
      </div>
    </div>
  );
}
