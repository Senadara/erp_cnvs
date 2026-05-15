import fs from "fs";

const p = "components/stock/stock-manager.tsx";
let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

const gridStart =
  '      <div className="grid gap-3 md:grid-cols-2">\n        {filtered.map((s) => {';
const dialogMarker = "      <Dialog open={formOpen}";

const start = s.indexOf(gridStart);
const end = s.indexOf(dialogMarker);
if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}

const replacement = `      {filteredItems.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border py-12 text-center text-sm">
          Tidak ada bahan untuk filter ini. Buat grup lewat &quot;Kelola grup&quot; lalu assign ke bahan.
        </p>
      ) : groupFilter === "all" && groupSections ? (
        <div className="space-y-6">
          {groupSections.map((sec) => (
            <section key={sec.id} className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b pb-2">
                <h3 className="text-lg font-semibold tracking-tight">{sec.name}</h3>
                <Badge variant="secondary">{sec.items.length} item</Badge>
              </div>
              <motion.div className="grid gap-3 md:grid-cols-2">
                {sec.items.map((item) => renderStockCard(item))}
              </motion.div>
            </section>
          ))}
        </motion.div>
      ) : (
        <motion.div className="grid gap-3 md:grid-cols-2">
          {filteredItems.map((item) => renderStockCard(item))}
        </motion.div>
      )}

      <Dialog open={groupsOpen} onOpenChange={setGroupsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grup tampilan stok</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Grup khusus outlet ini. Pindahkan bahan ke grup lewat dropdown di kartu stok.
          </p>
          <motion.div className="max-h-[50dvh] space-y-2 overflow-y-auto py-2">
            {stockGroups.map((g) => (
              <motion.div
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <span className="text-sm font-medium">{g.name}</span>
                {!readOnly && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={busy === "group"}
                    onClick={async () => {
                      if (!confirm(\`Hapus grup "\${g.name}"? Bahan di grup ini jadi tanpa grup.\`))
                        return;
                      setBusy("group");
                      try {
                        await deleteDisplayGroup(g.id);
                        toast.success("Grup dihapus");
                        router.refresh();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Gagal");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    Hapus
                  </Button>
                )}
              </motion.div>
            ))}
            {stockGroups.length === 0 && (
              <p className="text-muted-foreground text-sm">Belum ada grup. Tambahkan di bawah.</p>
            )}
          </motion.div>
          {!readOnly && (
            <motion.div className="flex flex-wrap gap-2 border-t pt-3">
              <Input
                className="h-11 min-w-[120px] flex-1"
                placeholder="Nama grup baru"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <Button
                type="button"
                className="h-11"
                disabled={busy === "group"}
                onClick={async () => {
                  if (!newGroupName.trim()) {
                    toast.error("Nama grup wajib");
                    return;
                  }
                  setBusy("group");
                  try {
                    await createDisplayGroup({
                      name: newGroupName,
                      context: "STOCK",
                      outletId,
                    });
                    setNewGroupName("");
                    toast.success("Grup dibuat");
                    router.refresh();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Gagal");
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                Tambah grup
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen}`;

s = s.slice(0, start) + replacement + s.slice(end);
s = s.replaceAll("<motion.div", "<div").replaceAll("</motion.div>", "</div>");

fs.writeFileSync(p, s);
console.log("fixed");
