import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  TrendingUp, 
  Wallet, 
  Trophy, 
  Layers, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Globe, 
  MoreVertical, 
  Bell, 
  Plus, 
  Search,
  UserCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ThreeDotMenu } from './ThreeDotMenu.tsx';

export const Header: React.FC = () => {
  const { 
    user, 
    language, 
    setLanguage, 
    theme, 
    setTheme, 
    t, 
    isAdminView, 
    setIsAdminView, 
    setActiveModal,
    searchQuery,
    setSearchQuery,
    settings
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const currencySymbol = settings?.currencySymbol || '৳';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => { setIsAdminView(false); setActiveModal(null); }}
              className="flex items-center gap-2.5 text-left group transition"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <div className="hidden xs:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                    {t.brand}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block font-medium">
                  {t.tagline}
                </p>
              </div>
            </button>
          </div>

          {/* Search Bar (Center) */}
          {!isAdminView && (
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/90 text-sm text-slate-200 placeholder-slate-500 rounded-full border border-slate-800 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Admin Switcher Pill */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setIsAdminView(!isAdminView)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isAdminView
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 shadow-sm'
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAdminView ? t.exitAdmin : t.adminPanel}</span>
              </button>
            )}

            {/* Quick Links on desktop */}
            {!isAdminView && (
              <div className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-300">
                <button
                  onClick={() => setActiveModal('positions')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-900/80 hover:text-white transition"
                >
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>{t.positions}</span>
                </button>
                <button
                  onClick={() => setActiveModal('leaderboard')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-900/80 hover:text-white transition"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>{t.leaderboard}</span>
                </button>
              </div>
            )}

            {/* Wallet Balance Chip */}
            {user && (
              <div className="flex items-center bg-slate-900/90 rounded-xl border border-slate-800 p-1 sm:p-1.5 gap-1.5 shadow-inner">
                <button 
                  onClick={() => setActiveModal('wallet')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-800/80 transition"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block leading-none">{t.balance}</span>
                    <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                      {currencySymbol}{user.wallet.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveModal('wallet')}
                  title={t.deposit}
                  className="w-7 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
              title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'bn' ? 'বাং' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
              title="Theme Toggle"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* User Profile Avatar */}
            {user && (
              <button
                onClick={() => setActiveModal('profile')}
                className="relative group p-0.5 rounded-full ring-2 ring-transparent hover:ring-cyan-500/60 transition"
              >
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700"
                />
                {user.isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-cyan-500 text-slate-950 rounded-full flex items-center justify-center text-[8px] font-bold ring-1 ring-slate-950">
                    ✓
                  </span>
                )}
              </button>
            )}

            {/* Three-Dot Menu Button */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
                title="More Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && <ThreeDotMenu onClose={() => setMenuOpen(false)} />}
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Search Bar Row */}
      {!isAdminView && (
        <div className="px-3 pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 text-sm text-slate-200 placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      )}
    </header>
  );
};
