'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Package, Plus, DollarSign, Trash2, Edit2, X } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export default function DaftarProduk() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Create Form Setup
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');

  // Edit State
  const [editingData, setEditingData] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editDesc, setEditDesc] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
      
    if (!error && products) {
      setData(products);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('products')
      .insert([{ name, price: Number(price), description }]);

    if (!error) {
      setName('');
      setPrice(0);
      setDescription('');
      setShowForm(false);
      fetchData();
    } else {
      alert('Gagal menyimpan data!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini? Riwayat penjualan yang terkait mungkin akan kehilangan referensi namanya.')) return;
    
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      fetchData();
    } else {
      alert('Gagal menghapus produk.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingData) return;

    const { error } = await supabase
      .from('products')
      .update({ name: editName, price: editPrice, description: editDesc })
      .eq('id', editingData.id);

    if (!error) {
      setEditingData(null);
      fetchData();
    } else {
      alert('Gagal mengupdate produk.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Katalog Produk</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Kelola master data produk Anda.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          {showForm ? 'Batal' : 'Tambah Produk'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Input Produk Baru</h2>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nama Produk</label>
              <input type="text" required placeholder="Cth: Kopi Susu Aren" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Harga Satuan</label>
              <input type="number" required min="0" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Deskripsi (Opsional)</label>
              <textarea placeholder="Penjelasan singkat produk..." value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="sm:col-span-2 flex justify-end mt-2">
              <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none">Simpan Produk</button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Produk</th>
                <th className="px-6 py-4 font-semibold">Deskripsi</th>
                <th className="px-6 py-4 font-semibold text-right w-48">Harga Satuan (Rp)</th>
                <th className="px-6 py-4 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    Belum ada data produk
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{row.name}</td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{row.description || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {row.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { setEditingData(row); setEditName(row.name); setEditPrice(row.price); setEditDesc(row.description); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors dark:text-indigo-400 dark:hover:bg-indigo-500/10">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors dark:text-red-400 dark:hover:bg-red-500/10">
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

      {/* EDIT MODAL */}
      {editingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setEditingData(null)}></div>
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Edit Produk</h3>
                <button onClick={() => setEditingData(null)}><X className="h-5 w-5 text-zinc-500"/></button>
             </div>
             <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Produk</label>
                  <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Harga Satuan (Rp)</label>
                  <input type="number" required value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Deskripsi</label>
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <button type="submit" className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Simpan Perubahan</button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
