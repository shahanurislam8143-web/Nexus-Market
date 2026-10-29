import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  X, 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  TrendingUp, 
  Calendar,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const { user, language, t, setActiveModal, notify, refreshData, settings } = useApp();
  if (!user) return null;

  const [displayName, setDisplayName] = useState(user.displayName);
  const [phone, setPhone] = useState(user.phone || '');
  const [isPrivate, setIsPrivate] = useState(user.isProfilePrivate || false);
  const [saving, setSaving] = useState(false);

  const currencySymbol = settings?.currencySymbol || '৳';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          displayName,
          phone,
          isProfilePrivate: isPrivate,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', language === 'bn' ? 'প্রোফাইল আপডেট সফল হয়েছে' : 'Profile updated successfully');
        await refreshData();
        setActiveModal(null);
      } else {
        notify('error', 'Update failed');
      }
    } catch (e) {
      notify('error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg">{t.profile}</h2>
              <p className="text-xs text-slate-400">ID: {user.id}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Avatar and Verification */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 bg-slate-800"
              />
              {user.isVerified && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-cyan-500 text-slate-950 rounded-full flex items-center justify-center text-xs font-black shadow ring-2 ring-slate-900">
                  ✓
                </span>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-extrabold text-white text-lg">{user.displayName}</h3>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {language === 'bn' ? 'ভেরিফায়েড ইমেইল' : 'Verified Email'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center text-xs">
            <div>
              <span className="text-slate-500 block">{t.trades}</span>
              <strong className="text-white text-base font-mono">{user.stats.totalTrades}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t.winRate}</span>
              <strong className="text-emerald-400 text-base font-mono">{user.stats.winRate}%</strong>
            </div>
            <div>
              <span className="text-slate-500 block">W / L</span>
              <strong className="text-slate-300 text-base font-mono">{user.stats.wins} / {user.stats.losses}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">{t.profit}</span>
              <strong className={`text-base font-mono font-bold ${user.wallet.netProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                {user.wallet.netProfit >= 0 ? '+' : ''}{currencySymbol}{user.wallet.netProfit.toFixed(0)}
              </strong>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {language === 'bn' ? 'ডিসপ্লে নাম' : 'Display Name'}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01812345678"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2.5">
                {isPrivate ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    {language === 'bn' ? 'গোপনীয়তা (প্রাইভেট মোড)' : 'Privacy Mode'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {language === 'bn' ? 'লিডারবোর্ডে আপনার নাম গোপন রাখুন' : 'Hide your display name on leaderboard'}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase transition shadow-lg shadow-cyan-500/20 active:scale-98"
            >
              {saving ? '...' : (language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes')}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
