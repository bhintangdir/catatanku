'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, ShoppingCart, TrendingDown, Package, FileDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navigation = [
  { name: 'Laporan Keuangan', href: '/laporan-keuangan', icon: Wallet },
  { name: 'Laporan Penjualan', href: '/laporan-penjualan', icon: ShoppingCart },
  { name: 'List Pengeluaran', href: '/list-pengeluaran', icon: TrendingDown },
  { name: 'Katalog Produk', href: '/produk', icon: Package },
  { name: 'Unduh Laporan', href: '/unduh-laporan', icon: FileDown },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-zinc-50 border-r border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 transition-colors duration-300">
      <div className="flex h-16 shrink-0 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            CatatanKu
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-4 pb-4">
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={twMerge(
                  clsx(
                    'group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-100'
                  )
                )}
              >
                <item.icon
                  className={twMerge(
                    clsx(
                      'h-5 w-5 shrink-0 transition-colors duration-200',
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-500 dark:group-hover:text-zinc-300'
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
  );
}
