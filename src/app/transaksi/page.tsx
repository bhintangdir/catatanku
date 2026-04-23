'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Wallet, ShoppingCart, TrendingDown, Package, Plus, X, Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export default function TransaksiPage() {
  const [activeModal, setActiveModal] = useState<'keuangan' | 'penjualan' | 'pengeluaran' | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Custom Alert State
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        // Ensure profile exists (fallback for dev)
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', session.user.id).single();
        if (!profile) {
          await supabase.from('profiles').insert([{ 
            id: session.user.id, 
            email: session.user.email, 
            full_name: session.user.user_metadata?.full_name || session.user.email 
          }]);
        }
      }
    };

    checkSession();
    
    supabase.from('products').select('*').then(({ data }) => {
       if (data) setProducts(data);
    });
  }, [supabase]);

  // Global closure
  const closeModal = () => setActiveModal(null);

  // Form States (Keuangan)
  const [k_date, setKDate] = useState(new Date().toISOString().split('T')[0]);
  const [k_desc, setKDesc] = useState('');
  const [k_debit, setKDebit] = useState(0);
  const [k_credit, setKCredit] = useState(0);
  
  // Form States (Penjualan)
  const [p_date, setPDate] = useState(new Date().toISOString().split('T')[0]);
  const [p_productId, setPProductId] = useState('');
  const [p_qty, setPQty] = useState<string | number>(1);
  const [p_price, setPPrice] = useState<string | number>(0);
  const [p_shipping, setPShipping] = useState<string | number>(0);
  const [p_notes, setPNotes] = useState('');
  const [p_isAttached, setPIsAttached] = useState(false);

  // Form States (Pengeluaran)
  const [e_date, setEDate] = useState(new Date().toISOString().split('T')[0]);
  const [e_name, setEName] = useState('');
  const [e_qty, setEQty] = useState<string | number>(1);
  const [e_unit, setEUnit] = useState('');
  const [e_price, setEPrice] = useState<string | number>(0);
  const [e_notes, setENotes] = useState('');
  const [e_isAttached, setEIsAttached] = useState(false);

  // Focus States
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);


  const submitKeuangan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Calculate new balance based on previous top 1 data
      const { data: finData } = await supabase.from('financial_reports').select('balance').order('date', { ascending: false }).order('created_at', { ascending: false }).limit(1);
      const lastBalance = finData && finData.length > 0 ? finData[0].balance : 0;
      const newBalance = lastBalance + Number(k_debit) - Number(k_credit);

      const { error } = await supabase.from('financial_reports').insert([{ 
        profile_id: userId,
        date: k_date, 
        description: k_desc, 
        credit: Number(k_credit), 
        debit: Number(k_debit), 
        balance: newBalance 
      }]);

      if (error) throw error;
      setSuccessMsg('Catatan keuangan berhasil disimpan ke arus kas!');
      closeModal();
      setKDesc(''); setKDebit(0); setKCredit(0);
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitPenjualan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p_productId) return alert("Pilih produk!");
    if (!userId) return alert("Sesi login tidak ditemukan. Silakan login kembali.");
    setLoading(true);
    
    try {
      const { data: saleData, error: saleError } = await supabase.from('sales_reports').insert([{ 
        profile_id: userId,
        product_id: p_productId, 
        quantity: Number(p_qty), 
        price: Number(p_price) * Number(p_qty), 
        shipping_cost: Number(p_shipping || 0),
        is_attached: p_isAttached,
        notes: p_notes,
        date: p_date 
      }]).select();

      if (saleError) throw saleError;

      setSuccessMsg('Transaksi penjualan berhasil dicatat dan disinkronkan!');
      closeModal();
      setPProductId(''); setPQty(1); setPPrice(0); setPShipping(0); setPNotes(''); setPIsAttached(false);
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitPengeluaran = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.from('expenses').insert([{ 
        profile_id: userId,
        product_name: e_name, 
        unit: e_unit, 
        quantity: Number(e_qty),
        price: Number(e_price), 
        is_attached: e_isAttached,
        notes: e_notes,
        date: e_date 
      }]).select();

      if (error) throw error;

      setSuccessMsg('Pengeluaran operasional berhasil dicatat!');
      closeModal();
      setEName(''); setEQty(1); setEUnit(''); setEPrice(0); setENotes(''); setEIsAttached(false);
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Input Transaksi Baru</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Pilih jenis jalur data yang ingin Anda tambahkan hari ini.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <button onClick={() => setActiveModal('penjualan')} className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-8 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors group">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full group-hover:scale-110 transition-transform">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Penjualan Produk</h3>
            <p className="text-xs text-zinc-500 mt-1">Catat transaksi masuk pesanan</p>
          </div>
        </button>

        <button onClick={() => setActiveModal('pengeluaran')} className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-8 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group">
          <div className="p-4 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full group-hover:scale-110 transition-transform">
            <TrendingDown className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">List Pengeluaran</h3>
            <p className="text-xs text-zinc-500 mt-1">Catat belanja bahan / logistik</p>
          </div>
        </button>

        <button onClick={() => setActiveModal('keuangan')} className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-8 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors group">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full group-hover:scale-110 transition-transform">
            <Wallet className="h-8 w-8" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Laporan Arus Kas</h3>
            <p className="text-xs text-zinc-500 mt-1">Penyesuaian saldo secara manual</p>
          </div>
        </button>
      </div>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex-shrink-0">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {activeModal === 'keuangan' && 'Tambah Arus Kas (Keuangan)'}
                {activeModal === 'penjualan' && 'Tambah Transaksi Penjualan'}
                {activeModal === 'pengeluaran' && 'Tambah Daftar Pengeluaran'}
              </h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* KEUANGAN MODAL */}
              {activeModal === 'keuangan' && (
                <form onSubmit={submitKeuangan} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tanggal</label>
                    <input type="date" required value={k_date} onChange={e => setKDate(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Keterangan</label>
                    <input type="text" required placeholder="Suntikan modal..." value={k_desc} onChange={e => setKDesc(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Debit (Pemasukan)</label>
                      <input type="number" required min="0" value={k_debit} onChange={e => setKDebit(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kredit (Pengeluaran)</label>
                      <input type="number" required min="0" value={k_credit} onChange={e => setKCredit(Number(e.target.value))} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100">Batal</button>
                    <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan Data'}
                    </button>
                  </div>
                </form>
              )}

              {/* PENJUALAN MODAL */}
              {activeModal === 'penjualan' && (
                <form onSubmit={submitPenjualan} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tanggal</label>
                    <input type="date" required value={p_date} onChange={e => setPDate(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Pilih Produk</label>
                    <div className="relative">
                      <button 
                        type="button" 
                        onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                        className="w-full flex items-center justify-between rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      >
                        <span className={p_productId ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500"}>
                          {p_productId ? products.find(p => p.id === p_productId)?.name : '-- Pilih Produk --'}
                        </span>
                        <svg className={`h-4 w-4 text-zinc-500 transition-transform ${productDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                      
                      {productDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setProductDropdownOpen(false)}></div>
                          <div className="absolute z-20 w-full mt-1 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 max-h-60 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
                            {products.length === 0 ? (
                              <div className="px-3 py-3 text-sm text-zinc-500 text-center">Belum ada produk</div>
                            ) : (
                              products.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setPProductId(p.id);
                                    setPPrice(p.price);
                                    setProductDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-100 transition-colors border-b border-zinc-50 dark:border-zinc-800/50 last:border-0"
                                >
                                  <div className="font-medium">{p.name}</div>
                                  <div className="text-xs text-zinc-500 mt-0.5">Rp {p.price.toLocaleString('id-ID')}</div>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kuantitas</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        required 
                        value={p_qty} 
                        onChange={e => {
                          let val = e.target.value.replace(/,/g, '.');
                          val = val.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                          setPQty(val);
                        }} 
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Harga Satuan</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        required 
                        value={p_price} 
                        onChange={e => setPPrice(e.target.value.replace(/[^0-9]/g, ''))} 
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ongkos Kirim (Opsional)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="0" 
                      value={p_shipping} 
                      onChange={e => setPShipping(e.target.value.replace(/[^0-9]/g, ''))} 
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" 
                    />
                  </div>

                  <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-500 dark:text-zinc-400">Harga Satuan x {p_qty}</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Rp {(Number(p_price) * Number(p_qty)).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                      <span className="text-zinc-500 dark:text-zinc-400">Ongkos Kirim</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">Rp {Number(p_shipping || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Total Pemasukan</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Rp {( (Number(p_price) * Number(p_qty)) + Number(p_shipping || 0) ).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Catatan (Opsional)</label>
                    <textarea rows={2} value={p_notes} onChange={e => setPNotes(e.target.value)} placeholder="Cth: Pembayaran DP 50% atau keterangan lain" className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                  <div className="flex items-center gap-4 pt-2 pb-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="pIsAttached" checked={p_isAttached} onChange={e => setPIsAttached(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950" />
                      <label htmlFor="pIsAttached" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                        Terlampir
                      </label>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100">Batal</button>
                    <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-70">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Catat Penjualan'}
                    </button>
                  </div>
                </form>
              )}

              {/* PENGELUARAN MODAL */}
              {activeModal === 'pengeluaran' && (
                <form onSubmit={submitPengeluaran} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tanggal</label>
                    <input type="date" required value={e_date} onChange={e => setEDate(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Pembelian</label>
                    <input type="text" required placeholder="Cth: Sewa Tempat / Biji Kopi" value={e_name} onChange={e => setEName(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Jumlah</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        required 
                        value={e_qty} 
                        onChange={e => {
                          let val = e.target.value.replace(/,/g, '.');
                          val = val.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                          setEQty(val);
                        }} 
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Satuan</label>
                      <input type="text" required placeholder="Cth: Bulan / Kg" value={e_unit} onChange={e => setEUnit(e.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nomial Rp</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      required 
                      value={e_price} 
                      onChange={e => setEPrice(e.target.value.replace(/[^0-9]/g, ''))} 
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Catatan (Opsional)</label>
                    <textarea rows={2} value={e_notes} onChange={e => setENotes(e.target.value)} placeholder="Cth: Keperluan renovasi kecil atau rincian beli" className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  </div>
                  <div className="flex items-center gap-4 pt-2 pb-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="eIsAttached" checked={e_isAttached} onChange={e => setEIsAttached(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 dark:border-zinc-700 dark:bg-zinc-950" />
                      <label htmlFor="eIsAttached" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                        Terlampir
                      </label>
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100">Batal</button>
                    <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Catat Pengeluaran'}
                    </button>
                  </div>
                </form>
              )}
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
