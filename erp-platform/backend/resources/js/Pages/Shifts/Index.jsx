import { useState } from 'react';
import ErpLayout from '@/Layouts/ErpLayout';
import { Head, useForm, router } from '@inertiajs/react';

function formatRupiah(value) {
    const n = Number(value) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export default function ShiftsIndex({ shifts, openShift }) {
    const [isClosing, setIsClosing] = useState(false);
    
    const { data: openData, setData: setOpenData, post: postOpen, processing: opening } = useForm({
        opening_cash: '',
    });

    const { data: closeData, setData: setCloseData, post: postClose, processing: closing } = useForm({
        actual_cash: '',
        note: '',
    });

    const handleOpen = (e) => {
        e.preventDefault();
        postOpen(route('shifts.store'), {
            onSuccess: () => setOpenData('opening_cash', '')
        });
    };

    const handleClose = (e) => {
        e.preventDefault();
        postClose(route('shifts.update', openShift.id), {
            onSuccess: () => {
                setIsClosing(false);
                setCloseData({ actual_cash: '', note: '' });
            }
        });
    };

    return (
        <ErpLayout title="Manajemen Shift">
            <Head title="Shift" />

            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">Manajemen Shift</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Status Shift Saat Ini</h2>
                    {openShift ? (
                        <div className="space-y-4">
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-bold">Shift Terbuka</p>
                                    <p className="text-sm">Sejak: {new Date(openShift.opened_at).toLocaleString('id-ID')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm">Kas Awal:</p>
                                    <p className="font-bold">{formatRupiah(openShift.opening_cash)}</p>
                                </div>
                            </div>

                            {!isClosing ? (
                                <button
                                    onClick={() => setIsClosing(true)}
                                    className="w-full bg-rose-600 text-white font-medium py-2 rounded hover:bg-rose-700 transition"
                                >
                                    Tutup Shift Sekarang
                                </button>
                            ) : (
                                <form onSubmit={handleClose} className="border-t border-slate-200 pt-4 mt-4 space-y-4">
                                    <h3 className="font-medium text-slate-900">Form Tutup Shift</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Kas Aktual di Laci (Rp)</label>
                                        <input
                                            type="number"
                                            value={closeData.actual_cash}
                                            onChange={e => setCloseData('actual_cash', e.target.value)}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                                        <textarea
                                            value={closeData.note}
                                            onChange={e => setCloseData('note', e.target.value)}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                            rows="2"
                                        ></textarea>
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setIsClosing(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded hover:bg-slate-200">
                                            Batal
                                        </button>
                                        <button type="submit" disabled={closing} className="flex-1 bg-rose-600 text-white py-2 rounded hover:bg-rose-700 disabled:opacity-50">
                                            {closing ? 'Memproses...' : 'Tutup Shift'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleOpen} className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-3 rounded-md">
                                <p>Tidak ada shift yang terbuka saat ini. Buka shift untuk mulai menerima transaksi.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kas Awal (Uang di Laci) Rp</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={openData.opening_cash}
                                    onChange={e => setOpenData('opening_cash', e.target.value)}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={opening} className="w-full bg-emerald-600 text-white font-medium py-2 rounded hover:bg-emerald-700 transition disabled:opacity-50">
                                {opening ? 'Membuka...' : 'Buka Shift Baru'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-x-auto">
                <h2 className="text-lg font-semibold text-slate-900 p-4 border-b border-slate-200">Riwayat Shift</h2>
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <tr>
                            <th className="px-4 py-3 font-medium">Buka</th>
                            <th className="px-4 py-3 font-medium">Tutup</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium text-right">Kas Awal</th>
                            <th className="px-4 py-3 font-medium text-right">Ekspektasi Kas</th>
                            <th className="px-4 py-3 font-medium text-right">Selisih</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {shifts.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                                    Belum ada riwayat shift.
                                </td>
                            </tr>
                        ) : (
                            shifts.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">{new Date(s.opened_at).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3">{s.closed_at ? new Date(s.closed_at).toLocaleString('id-ID') : '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {s.status === 'OPEN' ? 'Terbuka' : 'Tutup'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">{formatRupiah(s.opening_cash)}</td>
                                    <td className="px-4 py-3 text-right">{s.expected_cash ? formatRupiah(s.expected_cash) : '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        {s.discrepancy ? (
                                            <span className={Number(s.discrepancy) < 0 ? 'text-rose-600 font-bold' : (Number(s.discrepancy) > 0 ? 'text-emerald-600 font-bold' : '')}>
                                                {formatRupiah(s.discrepancy)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </ErpLayout>
    );
}
