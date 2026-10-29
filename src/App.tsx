import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { CategoryBar } from './components/CategoryBar.tsx';
import { MarketCard } from './components/MarketCard.tsx';
import { MarketDetailModal } from './components/MarketDetailModal.tsx';
import { TradeModal } from './components/TradeModal.tsx';
import { WalletModal } from './components/WalletModal.tsx';
import { PositionsOrdersView } from './components/PositionsOrdersView.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { ReferralModal } from './components/ReferralModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AdminPanel } from './components/AdminPanel/AdminPanel.tsx';
import { 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Flame,
  Globe
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { 
    markets, 
    loadingMarkets, 
    isAdminView, 
    activeModal, 
    setActiveModal,
    language, 
    t, 
    settings 
  } = useApp();

  const announcement = language === 'bn' ? settings?.announcementBn : settings?.announcementEn;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Platform Header */}
      <Header />

      {/* Main Body View (Admin View or User View) */}
      {isAdminView ? (
        <main className="flex-1">
          <AdminPanel />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
          
          {/* Announcement Bar */}
          {announcement && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/20 flex items-center justify-between text-xs text-cyan-200 shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-medium line-clamp-1">{announcement}</span>
              </div>
              <button 
                onClick={() => setActiveModal('wallet')}
                className="hidden sm:flex items-center gap-1 font-bold text-cyan-300 hover:text-white shrink-0 ml-3 uppercase tracking-wider text-[11px]"
              >
                <span>{t.deposit}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Hero Banner / Highlight Bar */}
          <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/60 border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'বাংলাদেশ ও গ্লোবাল প্রেডিকশন এক্সচেঞ্জ' : 'Bangladesh & Global Event Trading'}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {language === 'bn' ? (
                  <>আপনার পূর্বাভাসের উপর ভিত্তি করে <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">ট্রেড করুন ও জিতুন</span></>
                ) : (
                  <>Trade on Real-World Events & <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Win Instant Payouts</span></>
                )}
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
                {language === 'bn'
                  ? 'খেলাধুলা, ক্রিপ্টো, সংবাদ ও বিনোদন জগতের যেকোনো বাস্তব ইভেন্টে YES অথবা NO শেয়ার ক্রয় করুন। প্রতিটি সঠিক পূর্বাভাসে সরাসরি ১০০% পেআউট।'
                  : 'Buy YES or NO contracts on sports, crypto, breaking news, politics, and technology. Winning contracts settle for full $1.00/unit.'}
              </p>

              {/* Ticker Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-slate-300">Live Matching Engine</span>
                </div>
                <div>
                  Settlement: <strong className="text-emerald-400">Automatic 100%</strong>
                </div>
                <div>
                  Methods: <strong className="text-cyan-400">bKash, Nagad, USDT, Bank</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Category Navigation Bar & Sort Chips */}
          <CategoryBar />

          {/* Markets Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {t.allCategories}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-900 border border-slate-800 text-slate-400">
                  {markets.length}
                </span>
              </div>
            </div>

            {loadingMarkets ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : markets.length === 0 ? (
              <div className="p-16 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                <HelpCircle className="w-12 h-12 mx-auto text-slate-600" />
                <h3 className="font-bold text-slate-300 text-base">
                  {language === 'bn' ? 'কোনো মার্কেট পাওয়া যায়নি' : 'No markets found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {language === 'bn' ? 'অন্য কোনো ফিল্টার নির্বাচন করুন অথবা নতুন মার্কেট যুক্ত করতে অ্যাডমিন প্যানেলে যান।' : 'Try clearing your search filters or check back shortly.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {markets.map(market => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}
          </div>

        </main>
      )}

      {/* Active Modals */}
      {activeModal === 'market_detail' && <MarketDetailModal />}
      {activeModal === 'trade' && <TradeModal />}
      {activeModal === 'wallet' && <WalletModal />}
      {activeModal === 'positions' && <PositionsOrdersView />}
      {activeModal === 'leaderboard' && <LeaderboardView />}
      {activeModal === 'referral' && <ReferralModal />}
      {activeModal === 'profile' && <ProfileModal />}
      {activeModal === 'auth' && <AuthModal />}

      {/* Platform Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 text-xs text-slate-500 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-300">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>NexusMarket — Next-Gen Prediction & Event Trading Engine</span>
        </div>
        <p className="max-w-2xl mx-auto leading-relaxed text-[11px] text-slate-500">
          {language === 'bn' 
            ? 'NexusMarket একটি বিশ্বমানের প্রেডিকশন এক্সচেঞ্জ প্ল্যাটফর্ম। সকল মার্কেট ও লেনদেন কঠোর ডাবল-এন্ট্রি লেজার সিস্টেমে সংরক্ষিত। দায়িত্বশীলভাবে ট্রেড করুন।'
            : 'NexusMarket is a simulated and real prediction marketplace. All settlements are executed on an idempotent, audited double-entry ledger. Trade responsibly.'}
        </p>
        <p className="text-[10px] text-slate-600">
          © {new Date().getFullYear()} NexusMarket Inc. All rights reserved. Built for Bangladesh & Global Users.
        </p>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
