'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, Calendar, Loader2, Filter } from 'lucide-react';

export default function UnduhLaporan() {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [includeFinancial, setIncludeFinancial] = useState(true);
  const [includeSales, setIncludeSales] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);

  const supabase = createClient();

  const handleDownload = async () => {
    if (!includeFinancial && !includeSales && !includeExpenses) {
      alert("Pilih setidaknya satu jenis laporan untuk diunduh.");
      return;
    }

    try {
      setLoading(true);

      let financialReports: any[] = [];
      let salesReports: any[] = [];
      let expenses: any[] = [];

      const promises = [];

      if (includeFinancial) {
        promises.push(
          supabase.from('financial_reports').select('*').gte('date', startDate).lte('date', endDate).order('date', { ascending: true })
            .then(({ data }) => { financialReports = data || []; })
        );
      }
      if (includeSales) {
        promises.push(
          supabase.from('sales_reports').select('*, products(name)').gte('date', startDate).lte('date', endDate).order('date', { ascending: true })
            .then(({ data }) => { salesReports = data || []; })
        );
      }
      if (includeExpenses) {
        promises.push(
          supabase.from('expenses').select('*').gte('date', startDate).lte('date', endDate).order('date', { ascending: true })
            .then(({ data }) => { expenses = data || []; })
        );
      }

      await Promise.all(promises);

      const doc = new jsPDF();
      
      const titleStr = `Laporan Rekapitulasi - CatatanKu`;
      const dateStr = `Periode: ${format(new Date(startDate), 'dd MMM yyyy', { locale: id })} - ${format(new Date(endDate), 'dd MMM yyyy', { locale: id })}`;

      // Setup First Page Header
      doc.setFontSize(16);
      doc.text(titleStr, 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(dateStr, 14, 28);

      let currentY = 35;

      // 1. Laporan Keuangan
      if (includeFinancial) {
        doc.setFontSize(14);
        doc.setTextColor(30);
        doc.text("Laporan Keuangan", 14, currentY);
        
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Tanggal', 'Keterangan', 'Debit', 'Kredit', 'Saldo Akhir']],
          body: financialReports.map(item => [
            format(new Date(item.date), 'dd MMM yyyy', { locale: id }),
            item.description,
            item.debit > 0 ? `+ Rp\n${item.debit.toLocaleString('id-ID')}` : '-',
            item.credit > 0 ? `- Rp\n${item.credit.toLocaleString('id-ID')}` : '-',
            `Rp\n${item.balance.toLocaleString('id-ID')}`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 9 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }

      // 2. Laporan Penjualan
      if (includeSales) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(30);
        doc.text("Laporan Penjualan", 14, currentY);
        
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Tanggal', 'Produk', 'Qty', 'Total Harga']],
          body: salesReports.map(item => [
            format(new Date(item.date), 'dd MMM yyyy', { locale: id }),
            item.products?.name || 'Produk Dihapus',
            item.quantity.toString(),
            `Rp\n${item.price.toLocaleString('id-ID')}`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 9 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }

      // 3. Laporan Pengeluaran
      if (includeExpenses) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(30);
        doc.text("List Pengeluaran", 14, currentY);
        
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Tanggal', 'Produk Dibeli', 'Satuan', 'Total Harga']],
          body: expenses.map(item => [
            format(new Date(item.date), 'dd MMM yyyy', { locale: id }),
            item.product_name,
            item.unit,
            `Rp\n${item.price.toLocaleString('id-ID')}`
          ]),
          theme: 'grid',
          headStyles: { fillColor: [239, 68, 68] },
          styles: { fontSize: 9 }
        });
      }

      // Save the PDF
      doc.save(`CatatanKu_Laporan_${startDate}_to_${endDate}.pdf`);

    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat membuat dokumen PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Unduh Laporan</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Filter dan unduh rangkuman catatan Anda dalam bentuk PDF.</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-8">
          
          {/* DATE RANGE */}
          <div>
            <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
              <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Range Tanggal</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dari Tanggal (Mulai)</label>
                <input 
                  type="date" 
                  required 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sampai Tanggal (Akhir)</label>
                <input 
                  type="date" 
                  required 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" 
                />
              </div>
            </div>
          </div>

          {/* REPORT FILTERS */}
          <div>
            <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
              <div className="bg-orange-100 dark:bg-orange-500/20 p-2 rounded-lg">
                <Filter className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Jenis Laporan</h2>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={includeFinancial} 
                    onChange={e => setIncludeFinancial(e.target.checked)} 
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-zinc-300 checked:border-indigo-600 checked:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:checked:border-indigo-500 dark:checked:bg-indigo-500" 
                  />
                  <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Laporan Keuangan (Arus Kas)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={includeSales} 
                    onChange={e => setIncludeSales(e.target.checked)} 
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-zinc-300 checked:border-indigo-600 checked:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:checked:border-indigo-500 dark:checked:bg-indigo-500" 
                  />
                  <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Laporan Penjualan Produk</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={includeExpenses} 
                    onChange={e => setIncludeExpenses(e.target.checked)} 
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-zinc-300 checked:border-indigo-600 checked:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:checked:border-indigo-500 dark:checked:bg-indigo-500" 
                  />
                  <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Laporan Daftar Pengeluaran</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
              {loading ? 'Menyiapkan Data...' : 'Unduh Dokumen PDF'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
