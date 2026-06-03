import { useState } from 'react';
import ErpLayout from '@/Layouts/ErpLayout';
import { Head, useForm, router } from '@inertiajs/react';

function formatRupiah(value) {
    const n = Number(value) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export default function ExpensesIndex({ expenses, openShift }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        category: 'Operasional',
        description: '',
    });

    const categories = [
        'Operasional',
        'Bahan Baku',
        'Gaji',
        'Listrik/Air',
        'Tambah Modal',
        'Lainnya'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('expenses.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            }
        });
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus catatan pengeluaran ini?')) {
            router.delete(route('expenses.destroy', id));
        }
    };

    return (
        <ErpLayout title="Pengeluaran & Kas">
            <Head title="Pengeluaran" />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">Pengeluaran & Kasbon</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
                >
                    + Catat Pengeluaran
                </button>
            </div>

            {!openShift && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md mb-6">
                    <p className="font-medium text-sm">Peringatan: Tidak ada shift yang terbuka saat ini. Pengeluaran yang dicatat akan masuk ke shift berikutnya yang dibuka atau berdiri sendiri.</p>
                </div>
            )}

            <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <tr>
                            <th className="px-4 py-3 font-medium">Tanggal</th>
                            <th className="px-4 py-3 font-medium">Kategori</th>
                            <th className="px-4 py-3 font-medium">Keterangan</th>
                            <th className="px-4 py-3 font-medium text-right">Nominal (Rp)</th>
                            <th className="px-4 py-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                    Belum ada catatan pengeluaran.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((e) => (
                                <tr key={e.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">{new Date(e.created_at).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${e.category === 'Tambah Modal' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                            {e.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{e.description || '-'}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatRupiah(e.amount)}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => handleDelete(e.id)} className="text-rose-600 hover:underline">Hapus</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Catat Pengeluaran / Kas
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.amount}
                                    onChange={e => setData('amount', e.target.value)}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                                {errors.amount && <p className="text-rose-500 text-xs mt-1">{errors.amount}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                                <select
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                    required
                                >
                                    {categories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Tambahan</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                                    rows="3"
                                    placeholder="Opsional"
                                ></textarea>
                                {errors.description && <p className="text-rose-500 text-xs mt-1">{errors.description}</p>}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ErpLayout>
    );
}
