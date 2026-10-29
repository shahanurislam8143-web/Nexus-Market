import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Users, 
  DollarSign, 
  Settings, 
  Plus, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Ban,
  Check
} from 'lucide-react';
import { Market, DepositRequest, WithdrawalRequest, User as AppUser, MarketCategory } from '../../types/index.ts';

export const AdminPanel: React.FC = () => {
  const { language, t, refreshData, notify, settings, triggerConfetti } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'markets' | 'deposits' | 'withdrawals' | 'users' | 'adjustment' | 'settings'>('dashboard');

  const currencySymbol = settings?.currencySymbol || '৳';

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Markets state
  const [adminMarkets, setAdminMarkets] = useState<Market[]>([]);
  const [createMarketOpen, setCreateMarketOpen] = useState(false);
  const [resolveMarketData, setResolveMarketData] = useState<{ id: string; title: string } | null>(null);

  // New Market Form State
  const [newTitleBn, setNewTitleBn] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newDescBn, setNewDescBn] = useState('');
  const [newDescEn, setNewDescEn] = useState('');
  const [newCategory, setNewCategory] = useState<MarketCategory>('sports');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&auto=format&fit=crop&q=80');
  const [newClosingTime, setNewClosingTime] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [newInitialProb, setNewInitialProb] = useState<number>(50);
  const [newSource, setNewSource] = useState('Official Verification Source');
  const [newRules, setNewRules] = useState('অফিসিয়াল ঘোষণার ভিত্তিতে নিষ্পত্তি করা হবে।');

  // Deposits & Withdrawals state
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  // Adjustment Form State
  const [adjUserId, setAdjUserId] = useState('');
  const [adjAmount, setAdjAmount] = useState<number>(500);
  const [adjType, setAdjType] = useState<'credit' | 'debit'>('credit');
  const [adjReason, setAdjReason] = useState('');

  // Settings Form State
  const [tradingFee, setTradingFee] = useState<number>(settings?.tradingFeePercent || 1.5);
  const [cancellationFee, setCancellationFee] = useState<number>(settings?.cancellationFee || 0);
  const [bkashNum, setBkashNum] = useState(settings?.depositNumbers.bkash || '');
  const [nagadNum, setNagadNum] = useState(settings?.depositNumbers.nagad || '');
  const [cryptoAddress, setCryptoAddress] = useState(settings?.depositNumbers.crypto || '');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [sRes, mRes, dRes, wRes, uRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/markets'),
        fetch('/api/admin/deposits'),
        fetch('/api/admin/withdrawals'),
        fetch('/api/admin/users'),
      ]);

      if (sRes.ok) setStats(await sRes.json());
      if (mRes.ok) setAdminMarkets(await mRes.json());
      if (dRes.ok) setDeposits(await dRes.json());
      if (wRes.ok) setWithdrawals(await wRes.json());
      if (uRes.ok) {
        const u = await uRes.json();
        setUsers(u);
        if (u.length > 0 && !adjUserId) setAdjUserId(u[0].id);
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  // Handle Market Creation
  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleBn || !newTitleEn) {
      notify('error', 'Titles in both languages are required');
      return;
    }

    try {
      const res = await fetch('/api/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleBn: newTitleBn,
          titleEn: newTitleEn,
          descriptionBn: newDescBn,
          descriptionEn: newDescEn,
          category: newCategory,
          imageUrl: newImage,
          closingTime: new Date(newClosingTime).toISOString(),
          initialYesProb: newInitialProb / 100,
          resolutionSource: newSource,
          resolutionRules: newRules,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', language === 'bn' ? 'মার্কেট সফলভাবে তৈরি ও লাইভ হয়েছে!' : 'Market published live successfully!');
        setCreateMarketOpen(false);
        setNewTitleBn('');
        setNewTitleEn('');
        await fetchAdminData();
        await refreshData();
      } else {
        notify('error', data.error || 'Failed to create market');
      }
    } catch (e) {
      notify('error', 'Network error');
    }
  };

  // Handle Market Resolution (Automatic Settlement)
  const handleExecuteResolution = async (outcome: 'YES' | 'NO') => {
    if (!resolveMarketData) return;
    if (!confirm(language === 'bn' 
      ? `আপনি কি নিশ্চিত যে "${resolveMarketData.title}" মার্কেটের বিজয়ী হিসেবে ${outcome} ঘোষণা ও সকল পেআউট স্বয়ংক্রিয়ভাবে নিষ্পত্তি করতে চান?` 
      : `Resolve "${resolveMarketData.title}" as ${outcome} and execute automatic payouts to all winning positions?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/markets/${resolveMarketData.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, adminId: 'USR-ADMIN-100' }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', data.message);
        triggerConfetti();
        setResolveMarketData(null);
        await fetchAdminData();
        await refreshData();
      } else {
        notify('error', data.message || 'Settlement failed');
      }
    } catch (e) {
      notify('error', 'Network error');
    }
  };

  // Handle Deposit Action (Approve / Reject)
  const handleDepositAction = async (id: string, action: 'confirm' | 'reject') => {
    const reason = action === 'reject' ? prompt('প্রত্যাখ্যানের কারণ লিখুন (Rejection reason):') : '';
    if (action === 'reject' && !reason) return;

    try {
      const res = await fetch(`/api/admin/deposits/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', data.message);
        await fetchAdminData();
        await refreshData();
      } else {
        notify('error', data.error || 'Action failed');
      }
    } catch (e) {
      notify('error', 'Network error');
    }
  };

  // Handle Withdrawal Action
  const handleWithdrawalAction = async (id: string, action: 'processing' | 'pay' | 'reject') => {
    const reason = action === 'reject' ? prompt('প্রত্যাখ্যানের কারণ লিখুন:') : '';
    if (action === 'reject' && !reason) return;

    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', data.message || 'Updated');
        await fetchAdminData();
        await refreshData();
      } else {
        notify('error', data.error || 'Action failed');
      }
    } catch (e) {
      notify('error', 'Network error');
    }
  };

  // Handle Ban User
  const handleBanToggle = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin security review' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify('info', `User status: ${data.user.status}`);
        await fetchAdminData();
      }
    } catch (e) {
      notify('error', 'Action failed');
    }
  };

  // Handle Wallet Adjustment
  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjUserId || adjAmount <= 0 || !adjReason.trim()) {
      notify('error', 'All adjustment fields are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/wallet-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adjUserId,
          amount: adjAmount,
          type: adjType,
          reason: adjReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', language === 'bn' ? 'ব্যালেন্স সমন্বয় সফল হয়েছে এবং লেজারে রেকর্ড হয়েছে' : 'Wallet adjustment applied successfully');
        setAdjReason('');
        await fetchAdminData();
        await refreshData();
      } else {
        notify('error', data.error || 'Failed');
      }
    } catch (e) {
      notify('error', 'Network error');
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradingFeePercent: Number(tradingFee),
          cancellationFee: Number(cancellationFee),
          depositNumbers: {
            ...settings?.depositNumbers,
            bkash: bkashNum,
            nagad: nagadNum,
            crypto: cryptoAddress,
          }
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', t.saveSettings);
        await refreshData();
      }
    } catch (e) {
      notify('error', 'Failed to save settings');
    }
  };

  const pendingDepositsCount = deposits.filter(d => d.status === 'pending').length;
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Admin Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{t.adminDashboard}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'bn' ? 'মার্কেট সৃষ্টি, মীমাংসা (Resolution), ডিপোজিট/উত্তোলন অনুমোদন ও সম্পূর্ণ প্ল্যাটফর্ম নিয়ন্ত্রণ' : 'Full market management, automated settlements, deposits & ledger controls'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateMarketOpen(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createMarket}</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800 text-xs sm:text-sm font-semibold">
        {[
          { id: 'dashboard', label: 'ড্যাশবোর্ড (Dashboard)', icon: BarChart3 },
          { id: 'markets', label: 'মার্কেট ব্যবস্থাপনা (Markets)', icon: Layers },
          { id: 'deposits', label: `ডিপোজিট রিকোয়েস্ট (${pendingDepositsCount})`, icon: ArrowDownLeft, alert: pendingDepositsCount > 0 },
          { id: 'withdrawals', label: `উত্তোলন রিকোয়েস্ট (${pendingWithdrawalsCount})`, icon: ArrowUpRight, alert: pendingWithdrawalsCount > 0 },
          { id: 'users', label: 'ইউজার তালিকা (Users)', icon: Users },
          { id: 'adjustment', label: 'ব্যালেন্স সমন্বয় (Adjustment)', icon: DollarSign },
          { id: 'settings', label: 'প্ল্যাটফর্ম সেটিংস (Settings)', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 rounded-xl transition whitespace-nowrap shrink-0 border ${
                isSel
                  ? 'bg-slate-900 text-cyan-400 border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.alert && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* 1. DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block">{t.totalUsers}</span>
              <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalUsers}</span>
              <span className="text-[11px] text-emerald-400 block mt-1">{stats.activeUsers} {t.activeUsers}</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block">{t.totalMarkets}</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-400">{stats.totalMarkets}</span>
              <span className="text-[11px] text-slate-400 block mt-1">{stats.openMarkets} {t.openMarkets}</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block">{t.totalVolumeStat}</span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {currencySymbol}{stats.totalTradingVolume.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">{stats.totalOrders} total orders</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block">{t.platformFeesStat}</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                {currencySymbol}{stats.platformFeesRevenue.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Realized Net Platform Revenue</span>
            </div>

          </div>

          {/* Pending Alerts Banner */}
          {(stats.pendingDepositsCount > 0 || stats.pendingWithdrawalsCount > 0) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  অপেক্ষমাণ কাজ: <strong>{stats.pendingDepositsCount}</strong> টি ডিপোজিট এবং <strong>{stats.pendingWithdrawalsCount}</strong> টি উত্তোলন অনুরোধ রিভিউয়ের অপেক্ষায় রয়েছে।
                </span>
              </div>
              <div className="flex gap-2">
                {stats.pendingDepositsCount > 0 && (
                  <button
                    onClick={() => setActiveTab('deposits')}
                    className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                  >
                    ডিপোজিট দেখুন
                  </button>
                )}
                {stats.pendingWithdrawalsCount > 0 && (
                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition"
                  >
                    উত্তোলন দেখুন
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent Platform Ledger Entries */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="font-bold text-white text-sm">
              {language === 'bn' ? 'সাম্প্রতিক প্ল্যাটফর্ম ট্রানজ্যাকশন লেজার' : 'Recent Platform Ledger Activity'}
            </h3>
            <div className="space-y-2">
              {stats.recentTransactions?.slice(0, 5).map((txn: any) => (
                <div key={txn.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">{txn.descriptionBn || txn.descriptionEn}</span>
                    <span className="text-[10px] text-slate-500">{txn.userName} • {new Date(txn.timestamp).toLocaleString()}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-200">
                    {currencySymbol}{txn.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. MARKETS TAB (Resolution & Management) */}
      {activeTab === 'markets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              {language === 'bn' ? 'সকল মার্কেট ও রেজোলিউশন নিয়ন্ত্রণ' : 'All Markets & Settlement Control'}
            </h2>
            <button
              onClick={() => setCreateMarketOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.createMarket}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminMarkets.map(m => {
              const isResolved = m.status === 'resolved';
              return (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={m.imageUrl}
                      alt={m.titleEn}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-700 bg-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {m.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isResolved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                        }`}>
                          {m.status} {isResolved && `(${m.outcome} WON)`}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm line-clamp-2">
                        {language === 'bn' ? m.titleBn : m.titleEn}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        YES: {Math.round(m.yesPrice * 100)}% ({currencySymbol}{m.yesPrice.toFixed(2)}) • NO: {Math.round(m.noPrice * 100)}% • Vol: {currencySymbol}{m.volume.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Admin Resolution Trigger */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">ID: {m.id}</span>
                    
                    {!isResolved ? (
                      <button
                        onClick={() => setResolveMarketData({ id: m.id, title: m.titleEn })}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.resolveMarket}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Settled ({m.outcome})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DEPOSITS TAB */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">
            {language === 'bn' ? 'ডিপোজিট আবেদন পর্যালোচনা ও অনুমোদন' : 'Deposit Verification Queue'}
          </h2>

          <div className="space-y-3">
            {deposits.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                {language === 'bn' ? 'কোনো ডিপোজিট রেকর্ড নেই' : 'No deposit requests'}
              </div>
            ) : (
              deposits.map(dep => (
                <div
                  key={dep.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{dep.userName}</span>
                      <span className="text-slate-400 font-mono">({dep.userEmail})</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        dep.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : dep.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {dep.status}
                      </span>
                    </div>

                    <p className="text-slate-300 font-mono mt-1">
                      মেথড: <strong className="uppercase text-cyan-400">{dep.method}</strong> • TrxID: <strong className="text-white select-all">{dep.transactionId}</strong> • প্রেরক নম্বর: {dep.senderNumber || 'N/A'}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      তারিখ: {new Date(dep.createdAt).toLocaleString()} • ID: {dep.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="font-black text-base text-emerald-400 font-mono mr-2">
                      {currencySymbol}{dep.amount.toLocaleString()}
                    </span>

                    {dep.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleDepositAction(dep.id, 'confirm')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-1 shadow-md shadow-emerald-500/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.approve}</span>
                        </button>

                        <button
                          onClick={() => handleDepositAction(dep.id, 'reject')}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold transition"
                        >
                          {t.reject}
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-500 font-semibold uppercase">{dep.status}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">
            {language === 'bn' ? 'উত্তোলন অনুরোধ ও ক্যাশআউট ব্যবস্থাপনা' : 'Withdrawal Processing Queue'}
          </h2>

          <div className="space-y-3">
            {withdrawals.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                {language === 'bn' ? 'কোনো উত্তোলন আবেদন নেই' : 'No withdrawal requests'}
              </div>
            ) : (
              withdrawals.map(wth => (
                <div
                  key={wth.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{wth.userName}</span>
                      <span className="text-slate-400 font-mono">({wth.userEmail})</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        wth.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : wth.status === 'processing' ? 'bg-indigo-500/10 text-indigo-400' : wth.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {wth.status}
                      </span>
                    </div>

                    <p className="text-slate-300 font-mono mt-1">
                      মেথড: <strong className="uppercase text-cyan-400">{wth.method}</strong> • অ্যাকাউন্ট: <strong className="text-white select-all">{wth.accountDetails}</strong>
                    </p>
                    <span className="text-[10px] text-slate-500">
                      তারিখ: {new Date(wth.createdAt).toLocaleString()} • ID: {wth.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="font-black text-base text-white font-mono mr-2">
                      {currencySymbol}{wth.amount.toLocaleString()}
                    </span>

                    {wth.status === 'pending' && (
                      <button
                        onClick={() => handleWithdrawalAction(wth.id, 'processing')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                      >
                        {t.markProcessing}
                      </button>
                    )}

                    {(wth.status === 'pending' || wth.status === 'processing') && (
                      <>
                        <button
                          onClick={() => handleWithdrawalAction(wth.id, 'pay')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                        >
                          {t.markPaid}
                        </button>

                        <button
                          onClick={() => handleWithdrawalAction(wth.id, 'reject')}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold"
                        >
                          {t.reject}
                        </button>
                      </>
                    )}

                    {wth.status === 'paid' && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Paid
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">{t.userManagement}</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 uppercase text-[10px] text-slate-400">
                <tr>
                  <th className="py-3 px-4">ইউজার (User)</th>
                  <th className="py-3 px-4">রোল (Role)</th>
                  <th className="py-3 px-4">ব্যালেন্স (Balance)</th>
                  <th className="py-3 px-4">ট্রেড সংখ্যা</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-900/50">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <img src={u.avatar} alt={u.displayName} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <strong className="text-white block">{u.displayName}</strong>
                        <span className="text-[10px] text-slate-500">{u.email} • {u.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {currencySymbol}{u.wallet.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {u.stats.totalTrades}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleBanToggle(u.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                            u.status === 'banned'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          {u.status === 'banned' ? t.unbanUser : t.banUser}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. WALLET ADJUSTMENT TAB */}
      {activeTab === 'adjustment' && (
        <div className="max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">{t.walletAdjustment}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'bn' ? 'সরাসরি ডাটাবেস পরিবর্তন না করে নিরাপদ অডিট লেজার ট্রানজ্যাকশন তৈরি করা হয়।' : 'Safely creates audited double-entry ledger transactions.'}
            </p>
          </div>

          <form onSubmit={handleWalletAdjustment} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">টার্গেট ইউজার</label>
              <select
                value={adjUserId}
                onChange={(e) => setAdjUserId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.displayName} ({u.email}) — ব্যালেন্স: {currencySymbol}{u.wallet.availableBalance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.adjustType}</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="credit">{t.credit}</option>
                  <option value="debit">{t.debit}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.adjustAmount} ({currencySymbol})</label>
                <input
                  type="number"
                  min="1"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {t.reason} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="e.g. ম্যানুয়াল ডিপোজিট ট্রানজ্যাকশন ভেরিফিকেশন / ক্ষতিপূরণ বোনাস"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase transition active:scale-98"
            >
              {t.applyAdjustment}
            </button>
          </form>
        </div>
      )}

      {/* 7. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-white">{t.feeSettings} & Numbers</h2>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.tradingFeePercent}</label>
                <input
                  type="number"
                  step="0.1"
                  value={tradingFee}
                  onChange={(e) => setTradingFee(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.cancellationFee}</label>
                <input
                  type="number"
                  value={cancellationFee}
                  onChange={(e) => setCancellationFee(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">বিকাশ ডিপোজিট নম্বর</label>
              <input
                type="text"
                value={bkashNum}
                onChange={(e) => setBkashNum(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">নগদ ডিপোজিট নম্বর</label>
              <input
                type="text"
                value={nagadNum}
                onChange={(e) => setNagadNum(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">USDT (TRC20) ঠিকানা</label>
              <input
                type="text"
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase transition active:scale-98"
            >
              {t.saveSettings}
            </button>
          </form>
        </div>
      )}

      {/* CREATE MARKET MODAL */}
      {createMarketOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-lg">{t.createMarket}</h3>
              <button onClick={() => setCreateMarketOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMarket} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.marketTitleBn} *</label>
                <input
                  type="text"
                  value={newTitleBn}
                  onChange={(e) => setNewTitleBn(e.target.value)}
                  placeholder="যেমন: বাংলাদেশ কি টি-টোয়েন্টি সিরিজ জয় করবে?"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.marketTitleEn} *</label>
                <input
                  type="text"
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="e.g. Will Bangladesh win the T20 series?"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.category}</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="sports">{t.sports}</option>
                    <option value="news">{t.news}</option>
                    <option value="crypto">{t.crypto}</option>
                    <option value="politics">{t.politics}</option>
                    <option value="business">{t.business}</option>
                    <option value="technology">{t.technology}</option>
                    <option value="entertainment">{t.entertainment}</option>
                    <option value="custom">{t.custom}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.closingTime}</label>
                  <input
                    type="datetime-local"
                    value={newClosingTime}
                    onChange={(e) => setNewClosingTime(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{t.imageUrl}</label>
                <input
                  type="url"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.resolutionSource}</label>
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.initialProbability}</label>
                  <input
                    type="number"
                    min="5"
                    max="95"
                    value={newInitialProb}
                    onChange={(e) => setNewInitialProb(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase transition shadow-lg shadow-cyan-500/20 active:scale-98"
              >
                {t.submitMarket}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE MARKET POPUP MODAL */}
      {resolveMarketData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-white text-lg">{t.resolveMarket}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {resolveMarketData.title}
              </p>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              {t.resolvePrompt}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleExecuteResolution('YES')}
                className="py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase transition shadow-lg shadow-emerald-500/20"
              >
                {t.winnerYes}
              </button>

              <button
                onClick={() => handleExecuteResolution('NO')}
                className="py-3 px-4 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase transition shadow-lg shadow-rose-500/20"
              >
                {t.winnerNo}
              </button>
            </div>

            <button
              onClick={() => setResolveMarketData(null)}
              className="text-xs text-slate-400 hover:text-white pt-2 block mx-auto"
            >
              বাতিল (Close)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
