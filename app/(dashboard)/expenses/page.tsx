import { requireNav } from "@/lib/guard";
import { resolveOutletId } from "@/lib/actions/outlet";
import { listPettyCashToday, getOpenShift, getShiftFinancialDetail } from "@/lib/actions/expense";
import { ExpensesManager, type ShiftFinancialPayload } from "@/components/expenses/expenses-manager";

export default async function ExpensesPage() {
  const user = await requireNav("expenses");
  const allowed = user.role === "OWNER" ? null : user.outletIds;
  const outletId = await resolveOutletId(allowed);
  if (!outletId) {
    return <p className="text-muted-foreground py-12 text-center">Outlet tidak tersedia.</p>;
  }

  const [rows, shift] = await Promise.all([listPettyCashToday(outletId), getOpenShift(outletId)]);

  let shiftFinancial: ShiftFinancialPayload = null;
  if (shift) {
    const detail = await getShiftFinancialDetail(shift.id);
    if (detail) {
      shiftFinancial = {
        outlet: detail.outlet,
        sebelumBuka: detail.sebelumBuka,
        selamaShift: detail.selamaShift,
        pengeluaran: detail.pengeluaran,
      };
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengeluaran laci</h1>
        <p className="text-muted-foreground text-sm">Catat pengeluaran dan kelola shift kasir</p>
      </div>
      <ExpensesManager
        outletId={outletId}
        initialShift={
          shift
            ? {
                id: shift.id,
                openedAt: shift.openedAt.toISOString(),
                openingCash: shift.openingCash.toString(),
                status: shift.status,
              }
            : null
        }
        shiftFinancial={shiftFinancial}
        rows={rows.map((r) => ({
          id: r.id,
          amount: r.amount.toString(),
          category: r.category,
          description: r.description,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
