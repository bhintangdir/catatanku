'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ShoppingCart, Plus, Package, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

type Product = {
  id: string;
  name: string;
  price: number;
};

type SalesReport = {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  shipping_cost: number;
  date: string;
  products?: {
    name: string;
  };
};

export default function LaporanPenjualan() {
  const [data, setData] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Custom Delete Confirm State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create Form State (Modal)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cDate, setCDate] = useState(new Date().toISOString().split('T')[0]);
  const [cProductId, setCProductId] = useState('');
  const [cQty, setCQty] = useState(1);
  const [cPrice, setCPrice] = useState(0);
  const [productList, setProductList] = useState<Product[]>([]);

  // Edit State
  const [editingData, setEditingData] = useState<SalesReport | null>(null);
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState(0);
  const [editShipping, setEditShipping] = useState(0);
  const [editNotes, setEditNotes] = useState('');

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
    fetchProducts();
    fetchData();
  }, []);

  const fetchProducts = async () => {
    const { data: prods } = await supabase.from('products').select('*');
    if (prods) setProductList(prods);
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: laporan, error } = await supabase
      .from('sales_reports')
      .select('*, products(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (!error && laporan) {
      setData(laporan as any);
    }
    setLoading(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('sales_reports').delete().eq('id', deleteId);
    if (!error) {
      // Cascade delete to financial reports
      await supabase.from('financial_reports').delete().eq('source_id', deleteId);
      fetchData();
    } else {
      alert('Gagal menghapus data.');
    }
    setDeleteId(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cProductId) return alert('Silakan pilih produk terlebih dahulu');
    
    const { error } = await supabase.from('sales_reports').insert([{
      profile_id: userId,
      product_id: cProductId,
      quantity: cQty,
      price: cPrice,
      date: cDate
    }]);

    if (!error) {
      setCProductId(''); setCQty(1); setCPrice(0); 
      setShowCreateModal(false);
      fetchData();
    } else {
      alert('Gagal menyimpan data!');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingData) return;

    const { error } = await supabase
      .from('sales_reports')
      .update({ quantity: editQty, price: editPrice, shipping_cost: editShipping, notes: editNotes })
      .eq('id', editingData.id);

    if (!error) {
      // Sync update to financial reports
      const totalDebit = Number(editPrice) + Number(editShipping);
      const prodName = editingData.products?.name || 'Produk';
      await supabase
        .from('financial_reports')
        .update({ 
          debit: totalDebit,
          description: `Penjualan: ${prodName} (Qty: ${editQty})${Number(editShipping) > 0 ? ' + Ongkir' : ''}`,
          notes: editNotes || 'Otomatis dari Penjualan'
        })
        .eq('source_id', editingData.id);

      setEditingData(null);
      fetchData();
    } else {
      alert('Gagal mengupdate data.');
    }
  };
  const totalSales = data.reduce((acc, curr) => acc + (Number(curr.price) + Number(curr.shipping_cost || 0)), 0);
  const totalItems = data.reduce((acc, curr) => acc + curr.quantity, 0);

  const downloadCSV = () => {
    const headers = ['Tanggal', 'Produk', 'Qty', 'Pemasukan (Rp)', 'Ongkir (Rp)', 'Catatan', 'Lampiran'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.date,
        `"${(row.products?.name || 'Produk Dihapus').replace(/"/g, '""')}"`,
        row.quantity,
        row.price,
        row.shipping_cost || 0,
        `"${((row as any).notes || '').replace(/"/g, '""')}"`,
        (row as any).is_attached ? 'Ya' : 'Tidak'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_penjualan_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Laporan Penjualan</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Catat histori dan nilai penjualan produk.</p>
        </div>
        <button
          onClick={downloadCSV}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <Plus className="h-4 w-4 rotate-45" />
          Download CSV
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-500/20">
              <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Item Terjual</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{totalItems} <span className="text-lg font-normal text-zinc-500">item</span></p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-500/20">
              <ShoppingCart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Nilai Penjualan</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rp {totalSales.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>



      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold w-32">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Produk</th>
                <th className="px-6 py-4 font-semibold text-center">Qty</th>
                <th className="px-6 py-4 font-semibold text-right">Ongkir</th>
                <th className="px-6 py-4 font-semibold text-right w-48">Total Pemasukan (Rp)</th>
                <th className="px-6 py-4 font-semibold text-center">Catatan</th>
                <th className="px-6 py-4 font-semibold text-center">Bukti</th>
                <th className="px-6 py-4 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    Belum ada data penjualan
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{format(new Date(row.date), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{row.products?.name || 'Produk Dihapus'}</td>
                    <td className="px-6 py-4 text-center">{row.quantity}</td>
                    <td className="px-6 py-4 text-right text-zinc-500">{row.shipping_cost > 0 ? row.shipping_cost.toLocaleString('id-ID') : '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {(Number(row.price) + Number(row.shipping_cost || 0)).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-zinc-500">{(row as any).notes || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {(row as any).is_attached ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">Ya</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { 
                          setEditingData(row); 
                          setEditQty(row.quantity); 
                          setEditPrice(row.price); 
                          setEditShipping(row.shipping_cost || 0); 
                          setEditNotes((row as any).notes || '');
                        }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors dark:text-indigo-400 dark:hover:bg-indigo-500/10">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors dark:text-red-400 dark:hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* DELETE ALERT MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
             </div>
             <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Hapus Arsip Penjualan?</h3>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Penghapusan ini bersifat permanen dan mengurangi statistik penjualan Anda.</p>
             <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium transition-colors">Batal</button>
                <button onClick={() => handleDeleteConfirm()} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">Hapus</button>
             </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setEditingData(null)}></div>
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Edit Penjualan</h3>
                <button onClick={() => setEditingData(null)}><X className="h-5 w-5 text-zinc-500"/></button>
             </div>
             <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kuantitas</label>
                  <input type="number" required value={editQty} onChange={e => setEditQty(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Total Pemasukan (Rp)</label>
                  <input type="number" required value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ongkir (Rp)</label>
                  <input type="number" required value={editShipping} onChange={e => setEditShipping(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Catatan</label>
                  <textarea rows={2} value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Simpan Perubahan</button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
