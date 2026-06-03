import { useState } from 'react';
import ErpLayout from '@/Layouts/ErpLayout';
import { Head, useForm, router } from '@inertiajs/react';

function formatRupiah(value) {
    const n = Number(value) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

export default function CashierIndex({ openShift, products }) {
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [cashReceived, setCashReceived] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        items: [],
        payment_status: 'PAID',
        payment_method: 'CASH',
        cash_received: '',
        note: '',
    });

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product_id === product.id);
            if (existing) {
                return prev.map(item => 
                    item.product_id === product.id 
                    ? { ...item, qty_porsi: item.qty_porsi + 1 }
                    : item
                );
            }
            return [...prev, {
                product_id: product.id,
                product_name: product.name,
                price_per_porsi: product.price,
                qty_porsi: 1,
                note: ''
            }];
        });
    };

    const updateQty = (productId, delta) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.product_id === productId) {
                    const newQty = item.qty_porsi + delta;
                    return newQty > 0 ? { ...item, qty_porsi: newQty } : item;
                }
                return item;
            });
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.product_id !== productId));
    };

    const total = cart.reduce((sum, item) => sum + (item.price_per_porsi * item.qty_porsi), 0);

    const handleCheckout = (e) => {
        e.preventDefault();
        
        post(route('cashier.store'), {
            data: {
                items: cart,
                payment_status: 'PAID',
                payment_method: paymentMethod,
                cash_received: cashReceived ? Number(cashReceived) : null,
                note: ''
            },
            onSuccess: () => {
                setCart([]);
                setCashReceived('');
            }
        });
    };

    if (!openShift) {
        return (
            <ErpLayout title="Kasir">
                <Head title="Kasir" />
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-semibold mb-2">Shift Belum Dibuka</h2>
                    <p className="mb-4">Anda harus membuka shift terlebih dahulu sebelum dapat mengakses kasir.</p>
                    <button 
                        onClick={() => router.get(route('shifts'))}
                        className="bg-amber-600 text-white px-4 py-2 rounded font-medium hover:bg-amber-700"
                    >
                        Buka Shift Sekarang
                    </button>
                </div>
            </ErpLayout>
        );
    }

    return (
        <ErpLayout title="Kasir">
            <Head title="Kasir" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
                {/* Produk Grid */}
                <div className="lg:col-span-2 bg-white shadow-sm rounded-lg border border-slate-200 p-4 flex flex-col h-full overflow-hidden">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Pilih Produk</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
                        {products.filter(p => p.is_active).map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="flex flex-col items-center p-3 border border-slate-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all active:scale-95 bg-slate-50 text-left"
                            >
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-24 object-cover rounded mb-2 bg-white" />
                                ) : (
                                    <div className="w-full h-24 bg-slate-200 rounded mb-2 flex items-center justify-center text-slate-400">Img</div>
                                )}
                                <span className="font-medium text-sm text-slate-900 w-full truncate">{product.name}</span>
                                <span className="text-indigo-600 font-semibold text-sm w-full">{formatRupiah(product.price)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Keranjang & Checkout */}
                <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-4 flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4 border-b pb-2">Pesanan Saat Ini</h2>
                    
                    <div className="flex-1 overflow-y-auto mb-4">
                        {cart.length === 0 ? (
                            <div className="text-center text-slate-400 mt-10">Keranjang kosong</div>
                        ) : (
                            <ul className="space-y-3">
                                {cart.map(item => (
                                    <li key={item.product_id} className="flex justify-between items-start border-b border-slate-100 pb-2">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-slate-900">{item.product_name}</div>
                                            <div className="text-xs text-slate-500">{formatRupiah(item.price_per_porsi)} x {item.qty_porsi}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="font-semibold text-sm text-slate-900">{formatRupiah(item.price_per_porsi * item.qty_porsi)}</div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateQty(item.product_id, -1)} className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold">-</button>
                                                <span className="text-sm font-medium w-4 text-center">{item.qty_porsi}</span>
                                                <button onClick={() => updateQty(item.product_id, 1)} className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold">+</button>
                                                <button onClick={() => removeFromCart(item.product_id)} className="ml-2 text-rose-500 hover:text-rose-700 text-xs font-medium">Hapus</button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold text-slate-900">Total</span>
                            <span className="text-2xl font-bold text-indigo-700">{formatRupiah(total)}</span>
                        </div>

                        {cart.length > 0 && (
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Metode Pembayaran</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('CASH')}
                                            className={`py-2 text-sm font-medium rounded border ${paymentMethod === 'CASH' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-300 text-slate-600'}`}
                                        >
                                            Tunai
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('QRIS')}
                                            className={`py-2 text-sm font-medium rounded border ${paymentMethod === 'QRIS' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-300 text-slate-600'}`}
                                        >
                                            QRIS
                                        </button>
                                    </div>
                                </div>

                                {paymentMethod === 'CASH' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Uang Diterima (Rp)</label>
                                        <input
                                            type="number"
                                            value={cashReceived}
                                            onChange={e => setCashReceived(e.target.value)}
                                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Masukkan nominal"
                                        />
                                        {cashReceived && Number(cashReceived) >= total && (
                                            <p className="text-emerald-600 text-xs mt-1 font-medium">
                                                Kembalian: {formatRupiah(Number(cashReceived) - total)}
                                            </p>
                                        )}
                                        {cashReceived && Number(cashReceived) < total && (
                                            <p className="text-rose-500 text-xs mt-1 font-medium">Uang kurang!</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || processing || (paymentMethod === 'CASH' && cashReceived && Number(cashReceived) < total)}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {processing ? 'Memproses...' : 'BAYAR SEKARANG'}
                        </button>
                    </div>
                </div>
            </div>
        </ErpLayout>
    );
}
