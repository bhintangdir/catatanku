'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Tag, Plus, Receipt, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

type Expense = {
  id: string;
  product_name: string;
  unit: string;
  quantity: number;
  price: number;
  is_attached: boolean;
  notes: string;
  date: string;
};
export default function ListPengeluaran() {
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Custom Delete Confirm State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create Form State (Modal)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cDate, setCDate] = useState(new Date().toISOString().split('T')[0]);
  const [cName, setCName] = useState('');
  const [cQty, setCQty] = useState<string | number>(1);
  const [cUnit, setCUnit] = useState('');
  const [cPrice, setCPrice] = useState<string | number>(0);
  const [cNotes, setCNotes] = useState('');
  const [cIsAttached, setCIsAttached] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit State
  const [editingData, setEditingData] = useState<Expense | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState<string | number>(1);
  const [editUnit, setEditUnit] = useState('');
  const [editPrice, setEditPrice] = useState<string | number>(0);
  const [editNotes, setEditNotes] = useState('');
  const [editIsAttached, setEditIsAttached] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: list, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (!error && list) {
      setData(list);
    }
    setLoading(false);
  };
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('expenses').delete().eq('id', deleteId);
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
    try {
      const { data: expData, error } = await supabase.from('expenses').insert([{
        profile_id: userId,
        product_name: cName,
        unit: cUnit,
        quantity: Number(cQty),
        price: Number(cPrice),
        is_attached: cIsAttached,
        notes: cNotes,
        date: cDate
      }]).select();

      if (error) throw error;
      setCName(''); setCQty(1); setCUnit(''); setCPrice(0); setCNotes(''); setCIsAttached(false); 
      setShowCreateModal(false);
      setSuccessMsg('Data pengeluaran berhasil dicatat!');
      fetchData();
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + err.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingData) return;

    const { error } = await supabase
      .from('expenses')
      .update({ product_name: editName, unit: editUnit, quantity: Number(editQty), price: editPrice, is_attached: editIsAttached, notes: editNotes })
      .eq('id', editingData.id);

    if (!error) {
       setEditingData(null);
       fetchData();
    } else {
      alert('Gagal mengupdate data.');
    }
  };
  const downloadCSV = () => {
    const headers = ['Tanggal', 'Produk', 'Jumlah', 'Satuan', 'Harga (Rp)', 'Catatan', 'Lampiran'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.date,
        `"${row.product_name.replace(/"/g, '""')}"`,
        row.quantity,
        `"${row.unit}"`,
        row.price,
        `"${(row.notes || '').replace(/"/g, '""')}"`,
        row.is_attached ? 'Ya' : 'Tidak'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_pengeluaran_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalExpenses = data.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">List Pengeluaran</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Catat histori pembelian bahan dan logistik.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadCSV}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <Plus className="h-4 w-4 rotate-45" />
            Download CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Input Pengeluaran
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-500/20">
              <Tag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Item Dibeli</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{data.length} <span className="text-lg font-normal text-zinc-500">item</span></p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-500/20">
              <Receipt className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Nilai Pengeluaran</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rp {totalExpenses.toLocaleString('id-ID')}</p>
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
                <th className="px-6 py-4 font-semibold">Produk Dibeli</th>
                <th className="px-6 py-4 font-semibold text-center w-32">Satuan</th>
                <th className="px-6 py-4 font-semibold text-right w-48">Nilai Transaksi (Rp)</th>
                <th className="px-6 py-4 font-semibold text-center">Catatan</th>
                <th className="px-6 py-4 font-semibold text-center">Bukti</th>
                <th className="px-6 py-4 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    Belum ada data pengeluaran
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{format(new Date(row.date), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.product_name}</p>
                      <p className="text-xs text-zinc-500">{row.quantity} {row.unit}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10 dark:bg-zinc-800 dark:text-zinc-400">
                        {row.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                      {row.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center text-[11px] text-zinc-500 max-w-[150px] truncate">{row.notes || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {row.is_attached ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">Ya</span>
                      ) : (
                        <span className="text-zinc-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { 
                          setEditingData(row); 
                          setEditName(row.product_name); 
                          setEditQty(row.quantity);
                          setEditUnit(row.unit); 
                          setEditPrice(row.price); 
                          setEditIsAttached(row.is_attached);
                          setEditNotes(row.notes || '');
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

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Input Pengeluaran</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"><X className="h-6 w-6"/></button>
             </div>
             <form onSubmit={handleCreateSubmit} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Pembelian</label>
                   <input type="text" required placeholder="Gula..." value={cName} onChange={e => setCName(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Jumlah</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        required 
                        placeholder="0"
                        value={cQty} 
                        onChange={e => {
                          let val = e.target.value.replace(/,/g, '.');
                          val = val.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                          setCQty(val);
                        }} 
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Satuan</label>
                      <input type="text" required placeholder="Kg / Pcs" value={cUnit} onChange={e => setCUnit(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                    </div>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Total Nilai (Rp)</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    required 
                    placeholder="0"
                    value={cPrice} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setCPrice(val);
                    }} 
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Catatan</label>
                  <textarea rows={2} value={cNotes} onChange={e => setCNotes(e.target.value)} placeholder="Rincian pembelian..." className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tanggal</label>
                  <input type="date" required value={cDate} onChange={e => setCDate(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div className="flex items-center gap-4 pt-2 pb-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="cIsAttached" checked={cIsAttached} onChange={e => setCIsAttached(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                    <label htmlFor="cIsAttached" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      Terlampir
                    </label>
                  </div>
                </div>
                <button type="submit" className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Tambah Pengeluaran</button>
             </form>
          </div>
        </div>
      )}

      {/* DELETE ALERT MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
             <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
             </div>
             <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Hapus Arsip Pengeluaran?</h3>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Menghapus data ini akan mengurangi detail logistik dan arsip operasional bisnis.</p>
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
                <h3 className="text-lg font-bold">Edit Pengeluaran</h3>
                <button onClick={() => setEditingData(null)}><X className="h-5 w-5 text-zinc-500"/></button>
             </div>
             <form onSubmit={handleEditSubmit} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Pembelian</label>
                   <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Jumlah</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        required 
                        value={editQty} 
                        onChange={e => {
                          let val = e.target.value.replace(/,/g, '.');
                          val = val.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                          setEditQty(val);
                        }} 
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Satuan</label>
                      <input type="text" required value={editUnit} onChange={e => setEditUnit(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                    </div>
                 </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Total Nilai (Rp)</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    required 
                    value={editPrice} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setEditPrice(val);
                    }} 
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Catatan</label>
                  <textarea rows={2} value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div className="flex items-center gap-2 pt-2 pb-2">
                  <input type="checkbox" id="editIsAttached" checked={editIsAttached} onChange={e => setEditIsAttached(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                  <label htmlFor="editIsAttached" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">Bukti Terlampir</label>
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Simpan Perubahan</button>
             </form>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {successMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setSuccessMsg(null)}></div>
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-200">
             <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 mb-6">
                <svg className="h-10 w-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
             </div>
             <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Berhasil!</h3>
             <p className="text-zinc-500 dark:text-zinc-400 mb-8">{successMsg}</p>
             <button 
                onClick={() => setSuccessMsg(null)} 
                className="w-full py-3 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-xl font-semibold hover:opacity-90 transition-opacity"
             >
                Siap, Lanjutkan
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
