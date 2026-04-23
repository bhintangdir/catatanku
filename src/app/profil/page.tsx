'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UserCircle, Key, LogOut, Loader2, Save } from 'lucide-react';

export default function ProfilPage() {
  const [profile, setProfile] = useState<{ id: string; email: string; full_name: string } | null>(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name);
      }
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingSettings(true);
    
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
    if (error) {
      alert('Gagal memperbarui profil: ' + error.message);
    } else {
      alert('Profil berhasil diperbarui!');
    }
    setSavingSettings(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert('Gagal mengubah password: ' + error.message);
    } else {
      alert('Password berhasil diubah!');
      setPassword('');
    }
    setSavingPassword(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Profil & Pengaturan Akun</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Atur informasi pribadi dan keamanan Anda di sini.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* EDIT PROFIL */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2.5 rounded-lg">
               <UserCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
             </div>
             <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Informasi Pribadi</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Alamat Email</label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-zinc-500">Email tidak dapat diubah.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            
            <button
              type="submit"
              disabled={savingSettings}
              className="mt-4 flex w-full justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-70"
            >
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Profil
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {/* UBAH PASSWORD */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-orange-100 dark:bg-orange-500/20 p-2.5 rounded-lg">
                 <Key className="h-6 w-6 text-orange-600 dark:text-orange-400" />
               </div>
               <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Keamanan</h2>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password Baru</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="mt-4 flex w-full justify-center items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-70"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                Perbarui Password
              </button>
            </form>
          </div>

          {/* LOGOUT */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Keluar Aplikasi</h2>
            <p className="text-sm text-red-700 dark:text-red-400 mb-4">Anda akan memerlukan email dan password untuk masuk kembali.</p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none"
            >
              <LogOut className="h-4 w-4" />
              Keluar Akun (Logout)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
