import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  User, 
  Layers, 
  Wallet, 
  Trophy, 
  Gift, 
  ShieldCheck, 
  Globe, 
  Sun, 
  Moon, 
  RotateCcw, 
  LogOut, 
  HelpCircle, 
  Lock,
  UserCheck
} from 'lucide-react';

export const ThreeDotMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { 
    user, 
    language, 
    setLanguage, 
    theme, 
    setTheme, 
    t, 
    setActiveModal, 
    isAdminView, 
    setIsAdminView,
    switchUser,
    logout,
    notify,
    refreshData
  } = useApp();

  const handleAction = (cb: () => void) => {
    cb();
    onClose();
  };

  const handleResetDemo = async () => {
    if (confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে ডেমো ডেটা রিসেট করতে চান?' : 'Reset all demo data to default?')) {
      try {
        const res = await fetch('/api/system/reset-demo', { method: 'POST' });
        if (res.ok) {
          notify('success', language === 'bn' ? 'ডেমো ডেটা সফলভাবে রিসেট করা হয়েছে' : 'Demo data reset successfully');
          await refreshData();
        }
      } catch (e) {
        notify('error', 'Failed to reset demo');
      }
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-2 text-sm text-slate-300 divide-y divide-slate-800/80 animate-in fade-in zoom-in-95 duration-100">
        
        {/* User Info Header */}
        <div className="px-3 py-2.5">
          <p className="text-xs text-slate-400 font-medium">{language === 'bn' ? 'সাইন-ইন আছেন:' : 'Signed in as:'}</p>
          <p className="font-bold text-white truncate">{user?.displayName}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            ID: {user?.id}
          </span>
        </div>

        {/* Primary Navigation */}
        <div className="py-1">
          <button
            onClick={() => handleAction(() => setActiveModal('profile'))}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/90 hover:text-white transition text-left"
          >
            <User className="w-4 h-4 text-cyan-400" />
            <span>{t.profile}</span>
          </button>

          <button
            onClick={() => handleAction(() => setActiveModal('positions'))}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/90 hover:text-white transition text-left"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>{t.positions}</span>
          </button>

          <button
            onClick={() => handleAction(() => setActiveModal('wallet'))}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/90 hover:text-white transition text-left"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>{t.wallet} ({t.deposit} / {t.withdraw})</span>
          </button>

          <button
            onClick={() => handleAction(() => setActiveModal('leaderboard'))}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/90 hover:text-white transition text-left"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{t.leaderboard}</span>
          </button>

          <button
            onClick={() => handleAction(() => setActiveModal('referral'))}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/90 hover:text-white transition text-left"
          >
            <Gift className="w-4 h-4 text-rose-400" />
            <span>{t.referral} (৳50 Bonus)</span>
          </button>
        </div>

        {/* Preferences */}
        <div className="py-1">
          <button
            onClick={() => handleAction(() => setLanguage(language === 'bn' ? 'en' : 'bn'))}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800/90 hover:text-white transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{t.language}</span>
            </div>
            <span className="text-xs font-bold text-cyan-400 uppercase">{language === 'bn' ? 'বাংলা' : 'English'}</span>
          </button>

          <button
            onClick={() => handleAction(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-800/90 hover:text-white transition text-left"
          >
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span>{t.theme}</span>
            </div>
            <span className="text-xs font-semibold capitalize text-slate-400">{theme}</span>
          </button>
        </div>

        {/* Admin Switcher & Reset */}
        <div className="py-1">
          <button
            onClick={() => handleAction(() => setIsAdminView(!isAdminView))}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 transition text-left font-semibold"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isAdminView ? t.exitAdmin : t.adminPanel}</span>
          </button>

          <div className="px-3 py-1 flex items-center justify-between text-xs text-slate-400">
            <span>{language === 'bn' ? 'অ্যাকাউন্ট মোড:' : 'Account Switch:'}</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleAction(() => switchUser('user'))}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${user?.role === 'user' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              >
                Trader
              </button>
              <button
                onClick={() => handleAction(() => switchUser('admin'))}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${user?.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              >
                Admin
              </button>
            </div>
          </div>

          <button
            onClick={handleResetDemo}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/90 text-slate-400 hover:text-slate-200 transition text-left text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'bn' ? 'ডেমো ডেটা রিসেট করুন' : 'Reset Demo Data'}</span>
          </button>
        </div>

        {/* Logout */}
        <div className="py-1">
          <button
            onClick={() => handleAction(logout)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.logout}</span>
          </button>
        </div>

      </div>
    </>
  );
};
