'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, ShoppingCart, TrendingDown, Package, FileDown, Menu, X, LayoutDashboard, User, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import AuthGuard from '@/components/AuthGuard';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Input Transaksi Baru', href: '/transaksi', icon: Plus },
  { name: 'Laporan Keuangan', href: '/laporan-keuangan', icon: Wallet },
  { name: 'Laporan Penjualan', href: '/laporan-penjualan', icon: ShoppingCart },
  { name: 'List Pengeluaran', href: '/list-pengeluaran', icon: TrendingDown },
  { name: 'Katalog Produk', href: '/produk', icon: Package },
  { name: 'Unduh Laporan', href: '/unduh-laporan', icon: FileDown },
  { name: 'Profil & Akun', href: '/profil', icon: User },
];

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

export default function Shell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isPublicPath = publicPaths.includes(pathname);

  const content = isPublicPath ? (
    <main className="w-full flex-1 flex flex-col">{children}</main>
  ) : (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900/50 w-full overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-900/80 backdrop-blur-sm lg:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <div 
        className={twMerge(
          "fixed inset-y-0 left-0 z-50 w-72 transform flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out lg:static lg:flex lg:w-64 lg:translate-x-0",
          sidebarOpen ? "translate-x-0 flex" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-sm shadow-indigo-600/20">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
              CatatanKu
            </span>
          </div>
          <button 
            type="button" 
            className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100" 
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          <nav className="flex-1 space-y-1.5 p-0">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={twMerge(
                    clsx(
                      'group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-50'
                    )
                  )}
                >
                  <item.icon
                    className={twMerge(
                      clsx(
                        'h-5 w-5 shrink-0 transition-colors duration-200',
                        isActive 
                          ? 'text-indigo-700 dark:text-indigo-400' 
                          : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                      )
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Topbar */}
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center">
             <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
               <Wallet className="h-4 w-4" />
             </div>
             <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">CatatanKu</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );

  return <AuthGuard>{content}</AuthGuard>;
}
