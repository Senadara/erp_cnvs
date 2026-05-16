"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Wallet,
  Trash2,
  BarChart3,
  Menu,
  Receipt,
  Building2,
  Store,
  Users,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  UserCircle,
} from "lucide-react";
import type { SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { setOutletCookie } from "@/lib/actions/outlet";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { OutletProvider } from "@/components/shared/outlet-context";
import { canSeeNav, type NavFeature } from "@/lib/permissions";
import { logoutAction } from "@/lib/actions/auth";
import { setSidebarCollapsed } from "@/lib/actions/shell-prefs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

type Outlet = { id: string; name: string };

export type ShellUser = SessionUser;

const navGroups: {
  title: string;
  items: {
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    feature: NavFeature;
  }[];
}[] = [
  {
    title: "Utama",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, feature: "dashboard" },
      { href: "/cashier", label: "Kasir", icon: ShoppingCart, feature: "cashier" },
      { href: "/receipts", label: "Struk", icon: Receipt, feature: "receipts" },
    ],
  },
  {
    title: "Inventori",
    items: [
      { href: "/products", label: "Produk", icon: Package, feature: "products" },
      { href: "/stock", label: "Stok", icon: Warehouse, feature: "stock" },
      { href: "/waste", label: "Waste", icon: Trash2, feature: "waste" },
    ],
  },
  {
    title: "Keuangan & Laporan",
    items: [
      { href: "/expenses", label: "Keuangan Shift", icon: Wallet, feature: "expenses" },
      { href: "/reports", label: "Laporan Performa", icon: BarChart3, feature: "reports" },
      { href: "/reports/shifts", label: "Riwayat Shift", icon: Receipt, feature: "reports" },
    ],
  },
  {
    title: "Manajemen",
    items: [
      { href: "/outlets", label: "Outlet", icon: Store, feature: "outlets" },
      { href: "/owner", label: "Owner", icon: Building2, feature: "owner" },
      { href: "/users", label: "Pengguna", icon: Users, feature: "users" },
    ],
  },
];

function ShellNavLinks({
  pathname,
  user,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  user: SessionUser;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const allItems = navGroups.flatMap(g => g.items);
  
  return (
    <nav className="flex flex-col gap-6 p-2">
      {navGroups.map((group) => {
        const allowedItems = group.items.filter((item) => canSeeNav(user, item.feature));
        if (allowedItems.length === 0) return null;

        return (
          <div key={group.title} className="space-y-1">
            {!collapsed && (
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                {group.title}
              </h3>
            )}
            <div className="flex flex-col gap-0.5">
              {allowedItems.map((item) => {
                const isExact = pathname === item.href;
                const isPrefix = item.href !== "/" && pathname.startsWith(`${item.href}/`);
                // Check if there's a more specific match in allItems
                const hasBetterMatch = allItems.some(
                  (other) => other.href !== item.href && pathname.startsWith(other.href) && other.href.length > item.href.length
                );
                const active = isExact || (isPrefix && !hasBetterMatch);
                
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={() => {
                      onNavigate?.();
                    }}
                  >
                    <span
                      className={cn(
                        "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                        collapsed ? "justify-center px-0 h-10 min-h-0" : "",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("size-5 shrink-0", active ? "text-primary" : "text-muted-foreground/70")} />
                      {!collapsed && item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  user,
  outlets,
  initialOutletId,
  sidebarInitiallyCollapsed,
  children,
}: {
  user: SessionUser;
  outlets: Outlet[];
  initialOutletId: string | null;
  sidebarInitiallyCollapsed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(sidebarInitiallyCollapsed);
  const outletId = initialOutletId ?? outlets[0]?.id ?? null;

  const onOutletChange = async (id: string) => {
    await setOutletCookie(id);
    router.refresh();
  };

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    void setSidebarCollapsed(next);
  };

  const allItems = navGroups.flatMap(g => g.items);
  const mobileNav = allItems.filter((item) => canSeeNav(user, item.feature)).slice(0, 6);

  return (
    <OutletProvider outletId={outletId}>
      <div className="flex min-h-dvh flex-col bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 md:px-4">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "md:hidden"
                )}
                aria-label="Menu"
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100%,280px)] p-0">
                <div className="border-b px-4 py-3 text-lg font-semibold">Karsa POS</div>
                <ScrollArea className="h-[calc(100dvh-3.5rem)]">
                  <ShellNavLinks
                    pathname={pathname}
                    user={user}
                    collapsed={false}
                    onNavigate={() => setMenuOpen(false)}
                  />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "hidden md:inline-flex"
              )}
              aria-label={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
              onClick={() => toggleSidebar()}
            >
              {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
            </button>

            <div className="flex flex-1 items-center gap-2">
              <span className="hidden text-base font-semibold tracking-tight md:inline">
                Karsa Group POS
              </span>
              <span className="text-base font-semibold tracking-tight md:hidden">Karsa POS</span>
            </div>

            {outlets.length > 0 && (
              <Select
                value={outletId ?? outlets[0]?.id}
                onValueChange={(v) => {
                  if (v) void onOutletChange(v);
                }}
              >
                <SelectTrigger className="h-11 w-[min(100%,200px)] md:w-56">
                  <SelectValue placeholder="Outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 px-3 sm:px-4 flex items-center gap-2 max-w-[12rem]"
                )}
              >
                <UserCircle className="size-5 shrink-0" />
                <span className="hidden truncate sm:inline">{user.displayName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="truncate font-normal">
                    <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    <span className="block truncate text-sm font-medium">{user.displayName}</span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 size-4" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void logoutAction().then(() => {
                      router.push("/login");
                      router.refresh();
                    });
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1600px] flex-1">
          <aside
            className={cn(
              "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 border-r border-border/60 bg-card/30 backdrop-blur-xl transition-[width] duration-200 md:block",
              collapsed ? "w-[4.25rem]" : "w-64"
            )}
          >
            <ScrollArea className="h-full">
              <ShellNavLinks pathname={pathname} user={user} collapsed={collapsed} />
            </ScrollArea>
          </aside>

          <main className="min-w-0 flex-1 p-3 md:p-6">{children}</main>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-6 gap-1 px-1 pt-1">
            {mobileNav.map((item) => {
              const isExact = pathname === item.href;
              const isPrefix = item.href !== "/" && pathname.startsWith(`${item.href}/`);
              const hasBetterMatch = allItems.some(
                (other) => other.href !== item.href && pathname.startsWith(other.href) && other.href.length > item.href.length
              );
              const active = isExact || (isPrefix && !hasBetterMatch);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </OutletProvider>
  );
}
