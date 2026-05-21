#!/bin/bash
# ═══════════════════════════════════════════════════════
# Diagnostic Script: Cek penggunaan NPROC di cPanel
# Jalankan di Terminal cPanel: bash scripts/diagnose-nproc.sh
# ═══════════════════════════════════════════════════════

echo "════════════════════════════════════════════"
echo "  NPROC DIAGNOSTIC TOOL - erp_cnvs"
echo "════════════════════════════════════════════"
echo ""

# 1. Total proses milik user ini
TOTAL_PROCS=$(ps -eLf | grep "^$(whoami)" | wc -l)
echo "🔢 Total threads milik user $(whoami): $TOTAL_PROCS"
echo ""

# 2. Breakdown per program
echo "📊 Breakdown threads per program:"
ps -eLf | grep "^$(whoami)" | awk '{print $NF}' | sort | uniq -c | sort -rn | head -20
echo ""

# 3. Proses Node.js secara spesifik
echo "🟢 Proses Node.js yang sedang berjalan:"
ps aux | grep "^$(whoami)" | grep -i node | grep -v grep
echo ""

# 4. Jumlah thread per proses Node.js
echo "🧵 Detail thread per proses Node.js (PID → Thread Count):"
for pid in $(ps aux | grep "^$(whoami)" | grep -i node | grep -v grep | awk '{print $2}'); do
  THREADS=$(ls /proc/$pid/task 2>/dev/null | wc -l)
  CMD=$(cat /proc/$pid/cmdline 2>/dev/null | tr '\0' ' ' | head -c 80)
  echo "  PID $pid → $THREADS threads | $CMD"
done
echo ""

# 5. Cek env vars
echo "🔧 Environment check:"
echo "  UV_THREADPOOL_SIZE = ${UV_THREADPOOL_SIZE:-NOT SET}"
echo "  RAYON_NUM_THREADS  = ${RAYON_NUM_THREADS:-NOT SET}"
echo "  NODE_ENV           = ${NODE_ENV:-NOT SET}"
echo ""

# 6. Cek apakah ada proses zombie
ZOMBIES=$(ps aux | grep "^$(whoami)" | grep -c 'Z')
echo "💀 Proses zombie: $ZOMBIES"
echo ""

echo "════════════════════════════════════════════"
echo "  SELESAI. Kirimkan output ini ke developer."
echo "════════════════════════════════════════════"
