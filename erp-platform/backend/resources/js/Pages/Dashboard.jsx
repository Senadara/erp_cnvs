import ErpLayout from '@/Layouts/ErpLayout';
import { Head } from '@inertiajs/react';

function formatRupiah(value) {
    const n = Number(value) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard({ stats }) {
    return (
        <ErpLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Produk aktif</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.productCount}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Penjualan hari ini</p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-800">{formatRupiah(stats.todaySales)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Shift</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {stats.openShift ? 'Terbuka' : 'Tutup'}
                    </p>
                </div>
            </div>

            <p className="mt-8 text-sm text-slate-500">
                Modul bisnis (kasir, stok, laporan) akan di-port bertahap dari Next.js. Gunakan menu di atas untuk
                placeholder modul sesuai role.
            </p>
        </ErpLayout>
    );
}
