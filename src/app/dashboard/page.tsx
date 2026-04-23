'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Wallet, TrendingUp, TrendingDown, Package, Activity, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({ balance: 0, thisMonthSales: 0, thisMonthExpenses: 0, productCount: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Get current month date string
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    // Fetch Total Balance (Net of all debits - credits)
    const { data: finStats } = await supabase.from('financial_reports').select('debit, credit');
    const balance = finStats?.reduce((acc, curr) => acc + Number(curr.debit) - Number(curr.credit), 0) || 0;

    // Fetch Monthly Sales
    const { data: salesData } = await supabase.from('sales_reports').select('price, shipping_cost, date, products(name)').gte('date', firstDay).lte('date', lastDay);
    const thisMonthSales = salesData?.reduce((acc, curr) => acc + (Number(curr.price) + Number(curr.shipping_cost || 0)), 0) || 0;

    // Fetch Monthly Expenses
    const { data: expData } = await supabase.from('expenses').select('price, date, product_name').gte('date', firstDay).lte('date', lastDay);
    const thisMonthExpenses = expData?.reduce((acc, curr) => acc + Number(curr.price), 0) || 0;

    // Fetch Total Products
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

    setStats({ balance, thisMonthSales, thisMonthExpenses, productCount: productCount || 0 });

    // Group Sales for Chart (Last 7 Days)
    const chartMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      chartMap.set(str, { date: str, total: 0 });
    }

    if (salesData) {
      salesData.forEach(sale => {
        if (chartMap.has(sale.date)) {
          chartMap.get(sale.date).total += (Number(sale.price) + Number(sale.shipping_cost || 0));
        }
      });
    }
    
    setChartData(Array.from(chartMap.values()));

    // Combine recent activities
    const combined: any[] = [];
    if (salesData) {
      salesData.map((s: any) => combined.push({ type: 'Penjualan', title: s.products?.name || 'Produk', amount: (Number(s.price) + Number(s.shipping_cost || 0)), date: s.date, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' }));
    }
    if (expData) {
      expData.map(e => combined.push({ type: 'Pengeluaran', title: e.product_name, amount: e.price, date: e.date, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' }));
    }
    
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentTransactions(combined.slice(0, 5));

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Ringkasan bisnis Anda hari ini.</p>
      </div>

      {loading ? (
         <div className="flex justify-center items-center h-48">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
         </div>
      ) : (
        <>
          {/* STATS CARDS */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-500/20">
                  <Wallet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Saldo</p>
                  <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rp {stats.balance.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/20">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Penjualan Bulan Ini</p>
                  <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rp {stats.thisMonthSales.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-red-50 p-3 dark:bg-red-500/20">
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pengeluaran Bulan Ini</p>
                  <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rp {stats.thisMonthExpenses.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-orange-50 p-3 dark:bg-orange-500/20">
                  <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Produk</p>
                  <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">{stats.productCount} Item</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* CHART */}
            <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                Trend Penjualan (7 Hari Terakhir)
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => val.split('-').slice(1).join('/')} stroke="#71717a" axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12}} stroke="#71717a" axisLine={false} tickLine={false} tickFormatter={(val) => `Rp${val/1000}k`} />
                    <Tooltip 
                      cursor={{fill: '#4f46e5', opacity: 0.1}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Penjualan']}
                    />
                    <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RECENT TRANSACTIONS */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Transaksi Terakhir</h2>
                <Link href="/laporan-penjualan" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1">
                  Lihat <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((trx, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 dark:border-zinc-800/50 dark:hover:border-zinc-700 transition">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${trx.bg}`}>
                          <trx.icon className={`h-5 w-5 ${trx.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate w-32">{trx.title}</p>
                          <p className="text-xs text-zinc-500">{trx.type} • {trx.date.split('-').slice(1).join('/')}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${trx.color}`}>
                        {trx.type === 'Pengeluaran' ? '-' : '+'}Rp {trx.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-10">
                    <Activity className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Belum ada transaksi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
