import Dropdown from '@/Components/Dropdown';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function ErpLayout({ title, children }) {
    const { auth, nav, outlet, flash } = usePage().props;
    const user = auth.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const changeOutlet = (e) => {
        router.post(route('outlet.set'), { outlet_id: e.target.value }, { preserveScroll: true });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 flex-1 items-center gap-6">
                        <Link href={route('dashboard')} className="shrink-0 text-lg font-bold text-emerald-800">
                            ERP Karsa
                        </Link>
                        <div className="hidden flex-wrap gap-1 md:flex">
                            {nav.map((item) => (
                                <Link
                                    key={item.feature}
                                    href={item.href}
                                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                                        route().current(item.feature)
                                            ? 'bg-emerald-100 text-emerald-900'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        {outlet.list?.length > 0 && (
                            <select
                                value={outlet.currentId ?? ''}
                                onChange={changeOutlet}
                                className="max-w-[10rem] rounded-md border-slate-300 text-sm sm:max-w-xs"
                                aria-label="Pilih outlet"
                            >
                                {outlet.list.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    type="button"
                                    className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                                >
                                    {user.displayName}
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>Profil</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    Keluar
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>

                        <button
                            type="button"
                            className="rounded-md border border-slate-200 px-2 py-1 text-sm md:hidden"
                            onClick={() => setMobileOpen((v) => !v)}
                        >
                            Menu
                        </button>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="flex flex-col gap-1 border-t border-slate-100 px-4 py-2 md:hidden">
                        {nav.map((item) => (
                            <Link
                                key={item.feature}
                                href={item.href}
                                className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                onClick={() => setMobileOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                )}
            </nav>

            {flash?.success && (
                <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
                    <p className="rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{flash.success}</p>
                </div>
            )}

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                {title && <h1 className="mb-6 text-2xl font-semibold text-slate-900">{title}</h1>}
                {children}
            </main>
        </div>
    );
}
