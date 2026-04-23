'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { Wallet, Plus, TrendingDown, TrendingUp, ReceiptText, FileText, Trash2, Edit2, X, AlertCircle } from 'lucide-react';

type FinancialReport = {
  id: string;
  date: string;
  description: string;
  is_attached: boolean;
  credit: number;
  debit: number;
  notes: string;
  balance: number;
};

export default function LaporanKeuangan() {
  const [data, setData] = useState<FinancialReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Custom Alert State
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Custom Delete Confirm State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Create Form State (Modal)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cDate, setCDate] = useState(new Date().toISOString().split('T')[0]);
  const [cDesc, setCDesc] = useState('');
  const [cDebit, setCDebit] = useState(0);
  const [cCredit, setCCredit] = useState(0);
  const [cNotes, setCNotes] = useState('');
  const [cIsAttached, setCIsAttached] = useState(false);

  // Edit State
  const [editingData, setEditingData] = useState<FinancialReport | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editDebit, setEditDebit] = useState(0);
  const [editCredit, setEditCredit] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
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
    const { data: reports, error } = await supabase
      .from('financial_reports')
      .select('*')
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });
      
    if (!error && reports) {
      setData(reports);
    }
    setLoading(false);
  };
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('financial_reports').delete().eq('id', deleteId);
    if (!error) {
      fetchData();
    } else {
      alert('Gagal menghapus data.');
    }
    setDeleteId(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lastBalance = data.length > 0 ? data[data.length - 1].balance : 0;
    const newBalance = lastBalance + Number(cDebit) - Number(cCredit);

    const { error } = await supabase.from('financial_reports').insert([{ 
      profile_id: userId,
      date: cDate, 
      description: cDesc, 
      credit: Number(cCredit), 
      debit: Number(cDebit), 
      notes: cNotes, 
      is_attached: cIsAttached,
      balance: newBalance 
    }]);

    if (!error) {
      setCDesc(''); setCDebit(0); setCCredit(0); setCNotes(''); setCIsAttached(false);
      setShowCreateModal(false);
      setSuccessMsg('Data keuangan berhasil ditambahkan!');
      fetchData();
    } else {
      alert('Gagal menyimpan data!');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingData) return;

    // We do not auto recalculate balance here to avoid complex chain updates for now. 
    // Usually handled via DB triggers or full re-calc loops.
    const { error } = await supabase
      .from('financial_reports')
      .update({ 
        description: editDesc, 
        debit: editDebit, 
        credit: editCredit, 
        notes: editNotes,
        date: editDate,
        is_attached: editIsAttached
      })
      .eq('id', editingData.id);

    if (!error) {
      setEditingData(null);
      fetchData();
    } else {
      alert('Gagal mengupdate data.');
    }
  };

  const totalDebit = data.reduce((acc, curr) => acc + curr.debit, 0);
  const totalCredit = data.reduce((acc, curr) => acc + curr.credit, 0);
  const currentBalance = totalDebit - totalCredit;

  const downloadCSV = () => {
    const headers = ['Tanggal', 'Deskripsi', 'Debit', 'Kredit', 'Saldo', 'Catatan', 'Lampiran'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.date,
        `"${(row.description || '').replace(/"/g, '""')}"`,
        row.debit,
        row.credit,
        row.balance,
        `"${(row.notes || '').replace(/"/g, '""')}"`,
        row.is_attached ? 'Ya' : 'Tidak'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_keuangan_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Laporan Keuangan</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Kelola dan pantau arus kas Anda.</p>
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
            Tambah Data
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-500/20">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Debit (Masuk)</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rp {totalDebit.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-500/20">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Kredit (Keluar)</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rp {totalCredit.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 border-b-4 border-b-indigo-500">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-500/20">
              <Wallet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Saldo Saat Ini</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Rp {currentBalance.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>



      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Deskripsi</th>
                <th className="px-6 py-4 font-semibold text-right">Debit</th>
                <th className="px-6 py-4 font-semibold text-right">Kredit</th>
                <th className="px-6 py-4 font-semibold text-right text-indigo-600 dark:text-indigo-400">Saldo</th>
                <th className="px-6 py-4 font-semibold">Catatan</th>
                <th className="px-6 py-4 font-semibold text-center">Lampiran</th>
                <th className="px-6 py-4 font-semibold text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center">
                      <ReceiptText className="h-8 w-8 text-zinc-400 mb-2" />
                      <p>Belum ada transaksi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => {
                  let runningBalance = 0;
                  for(let i=0; i<=index; i++) {
                    runningBalance += (data[i].debit - data[i].credit);
                  }
                  
                  return (
                    <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{format(new Date(row.date), 'dd MMM yyyy')}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.description}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                        {row.debit > 0 ? `+ Rp ${row.debit.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                        {row.credit > 0 ? `- Rp ${row.credit.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        Rp {runningBalance.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                        {row.notes || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.is_attached ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                            <FileText className="h-3 w-3" />
                            Ya
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => { 
                            setEditingData(row); 
                            setEditDesc(row.description); 
                            setEditDebit(row.debit); 
                            setEditCredit(row.credit); 
                            setEditNotes(row.notes);
                            setEditDate(row.date);
                            setEditIsAttached(row.is_attached);
                          }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors dark:text-indigo-400 dark:hover:bg-indigo-500/10">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteId(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors dark:text-red-400 dark:hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                <h3 className="text-lg font-bold">Edit Laporan Keuangan</h3>
                <button onClick={() => setEditingData(null)}><X className="h-5 w-5 text-zinc-500"/></button>
             </div>
             <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Keterangan</label>
                  <input type="text" required value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Debit (Masuk)</label>
                    <input type="number" required value={editDebit} onChange={e => setEditDebit(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kredit (Keluar)</label>
                    <input type="number" required value={editCredit} onChange={e => setEditCredit(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Catatan</label>
                  <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tanggal</label>
                  <input type="date" required value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="editIsAttached" checked={editIsAttached} onChange={e => setEditIsAttached(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                  <label htmlFor="editIsAttached" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">Bukti Terlampir</label>
                </div>
                <button type="submit" className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Simpan Perubahan</button>
             </form>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Input Keuangan Baru</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"><X className="h-6 w-6"/></button>
             </div>
             <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tanggal</label>
                  <input type="date" required value={cDate} onChange={e => setCDate(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Keterangan</label>
                  <input type="text" required placeholder="Beli bahan baku..." value={cDesc} onChange={e => setCDesc(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Debit (Masuk)</label>
                    <input type="number" required min="0" value={cDebit} onChange={e => setCDebit(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kredit (Keluar)</label>
                    <input type="number" required min="0" value={cCredit} onChange={e => setCCredit(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Catatan</label>
                  <input type="text" placeholder="Opsional" value={cNotes} onChange={e => setCNotes(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="cIsAttached" checked={cIsAttached} onChange={e => setCIsAttached(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                  <label htmlFor="cIsAttached" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">Bukti Terlampir</label>
                </div>
                <button type="submit" className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Tambah Data</button>
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
             <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Hapus Arsip?</h3>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Catatan keuangan ini akan dihapus permanen. Saldo transaksi setelahnya mungkin tidak akurat secara manual.</p>
             <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium transition-colors">Batal</button>
                <button onClick={() => handleDeleteConfirm()} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">Hapus</button>
             </div>
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
