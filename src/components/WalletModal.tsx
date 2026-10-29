import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  X, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building,
  Smartphone,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

export const WalletModal: React.FC = () => {
  const { 
    user, 
    userTransactions, 
    setActiveModal, 
    language, 
    t, 
    settings, 
    refreshData, 
    notify 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  
  // Deposit state
  const [depositMethod, setDepositMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank' | 'crypto'>('bkash');
  const [depositAmount, setDepositAmount] = useState<number>(500);
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Withdraw state
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank' | 'crypto'>('bkash');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500);
  const [accountDetails, setAccountDetails] = useState('');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Transaction filter
  const [historyFilter, setHistoryFilter] = useState<string>('all');

  const currencySymbol = settings?.currencySymbol || '৳';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    notify('info', language === 'bn' ? 'নম্বর কপি করা হয়েছে' : 'Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!depositAmount || depositAmount < (settings?.minDeposit || 100)) {
      notify('error', `${language === 'bn' ? 'সর্বনিম্ন ডিপোজিট' : 'Minimum deposit is'} ${currencySymbol}${settings?.minDeposit || 100}`);
      return;
    }
    if (!trxId.trim()) {
      notify('error', language === 'bn' ? 'ট্রানজ্যাকশন আইডি (TrxID) বাধ্যতামূলক' : 'TrxID is required');
      return;
    }

    setSubmittingDeposit(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: depositAmount,
          method: depositMethod,
          senderNumber,
          transactionId: trxId.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', data.message || 'ডিপোজিট রিকোয়েস্ট সফলভাবে গৃহীত হয়েছে');
        setSenderNumber('');
        setTrxId('');
        await refreshData();
        setActiveTab('history');
      } else {
        notify('error', data.error || 'Failed to submit deposit');
      }
    } catch (err) {
      notify('error', 'Network error');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!withdrawAmount || withdrawAmount < (settings?.minWithdrawal || 200)) {
      notify('error', `${language === 'bn' ? 'সর্বনিম্ন উত্তোলন' : 'Minimum withdrawal is'} ${currencySymbol}${settings?.minWithdrawal || 200}`);
      return;
    }
    if (withdrawAmount > user.wallet.availableBalance) {
      notify('error', t.insufficientFunds);
      return;
    }
    if (!accountDetails.trim()) {
      notify('error', language === 'bn' ? 'অ্যাকাউন্ট বা ফোন নম্বর লিখুন' : 'Account details required');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: withdrawAmount,
          method: withdrawMethod,
          accountDetails,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', data.message || 'উত্তোলন অনুরোধ গৃহীত হয়েছে');
        setAccountDetails('');
        await refreshData();
        setActiveTab('history');
      } else {
        notify('error', data.error || 'Failed to submit withdrawal');
      }
    } catch (err) {
      notify('error', 'Network error');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const getMethodNumber = () => {
    if (!settings?.depositNumbers) return '';
    return settings.depositNumbers[depositMethod] || '';
  };

  const filteredTransactions = userTransactions.filter(txn => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'deposit') return txn.type === 'deposit';
    if (historyFilter === 'withdrawal') return txn.type === 'withdrawal';
    if (historyFilter === 'trade') return txn.type.startsWith('trade');
    if (historyFilter === 'settlement') return txn.type.startsWith('settlement');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg">{t.walletTitle}</h2>
              <p className="text-xs text-slate-400">User ID: {user?.id}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 text-xs sm:text-sm font-semibold">
          {[
            { id: 'overview', label: language === 'bn' ? 'সারসংক্ষেপ' : 'Overview', icon: Wallet },
            { id: 'deposit', label: t.deposit, icon: ArrowDownLeft },
            { id: 'withdraw', label: t.withdraw, icon: ArrowUpRight },
            { id: 'history', label: t.transactionsLedger, icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 sm:px-5 border-b-2 transition ${
                  isSel
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Primary Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
                  <span className="text-xs text-emerald-300 font-medium block mb-1">
                    {t.availableBalance}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currencySymbol}{user?.wallet.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <p className="text-[11px] text-emerald-400/80 mt-1">
                    {language === 'bn' ? 'তাত্ক্ষণিক ট্রেড ও উত্তোলনের উপযোগী' : 'Ready for trading & withdrawal'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium block mb-1">
                    {t.reservedBalance}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                    {currencySymbol}{user?.wallet.reservedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {language === 'bn' ? 'অপেক্ষমাণ অর্ডারে রক্ষিত' : 'Held in open orders'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium block mb-1">
                    {t.netProfit}
                  </span>
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    (user?.wallet.netProfit || 0) >= 0 ? 'text-cyan-400' : 'text-rose-400'
                  }`}>
                    {(user?.wallet.netProfit || 0) >= 0 ? '+' : ''}{currencySymbol}{user?.wallet.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {language === 'bn' ? 'মোট অর্জিত লাভ / ক্ষতি' : 'Cumulative realized return'}
                  </p>
                </div>

              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 rounded-2xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block">{t.totalDeposited}</span>
                  <strong className="text-slate-200 text-sm font-semibold">{currencySymbol}{user?.wallet.totalDeposited.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">{t.totalWithdrawn}</span>
                  <strong className="text-slate-200 text-sm font-semibold">{currencySymbol}{user?.wallet.totalWithdrawn.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">{t.pendingWithdrawal}</span>
                  <strong className="text-amber-400 text-sm font-semibold">{currencySymbol}{user?.wallet.pendingWithdrawal.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">{t.tradingFee} Paid</span>
                  <strong className="text-slate-200 text-sm font-semibold">{currencySymbol}{user?.wallet.totalFeesPaid.toLocaleString()}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className="py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <ArrowDownLeft className="w-5 h-5" />
                  <span>{t.deposit}</span>
                </button>

                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-700"
                >
                  <ArrowUpRight className="w-5 h-5 text-cyan-400" />
                  <span>{t.withdraw}</span>
                </button>
              </div>

            </div>
          )}

          {/* 2. DEPOSIT TAB */}
          {activeTab === 'deposit' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  ১. {t.selectMethod}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['bkash', 'nagad', 'rocket', 'bank', 'crypto'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDepositMethod(m)}
                      className={`p-2.5 rounded-xl text-xs font-bold capitalize flex flex-col items-center gap-1.5 transition border ${
                        depositMethod === m
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {m === 'bank' ? <Building className="w-4 h-4" /> : m === 'crypto' ? <CreditCard className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      <span>{m}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Number & Instructions */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  {language === 'bn' ? 'অফিসিয়াল ডিপোজিট ঠিকানা / অ্যাকাউন্ট:' : 'Official Payment Destination:'}
                </span>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs sm:text-sm text-cyan-400 font-bold select-all break-all">
                  <span>{getMethodNumber()}</span>
                  <button
                    onClick={() => copyToClipboard(getMethodNumber(), 'deposit')}
                    className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white shrink-0"
                    title="Copy"
                  >
                    {copiedKey === 'deposit' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {language === 'bn'
                    ? `উপরের নম্বরে টাকা Send Money / ক্যাশ-ইন করে নিচের ফর্মে Transaction ID দিন। ন্যূনতম ডিপোজিট ${currencySymbol}${settings?.minDeposit || 100}।`
                    : `Send payment to the above destination and enter your Transaction ID below. Minimum deposit ${currencySymbol}${settings?.minDeposit || 100}.`}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.amount} ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min={settings?.minDeposit || 100}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <div className="flex gap-2 mt-2">
                    {[100, 500, 1000, 5000].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setDepositAmount(v)}
                        className="flex-1 py-1 text-xs font-semibold rounded-lg bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                      >
                        +{v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.senderNumber}
                  </label>
                  <input
                    type="text"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="e.g. 01812345678"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.trxId} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. BK9A87X41Q"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingDeposit}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase transition shadow-lg shadow-emerald-500/20 active:scale-98"
                >
                  {submittingDeposit ? '...' : t.depositSubmit}
                </button>
              </form>
            </div>
          )}

          {/* 3. WITHDRAW TAB */}
          {activeTab === 'withdraw' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <p className="font-bold">
                  {language === 'bn' ? 'সতর্কবার্তা ও নিয়মাবলী:' : 'Withdrawal Guidelines:'}
                </p>
                <p>
                  {language === 'bn'
                    ? `সর্বনিম্ন উত্তোলন ${currencySymbol}${settings?.minWithdrawal || 200}। অনুরোধের পর অর্থ রিজার্ভ থাকবে এবং অ্যাডমিন রিভিউয়ের পর সরাসরি আপনার অ্যাকাউন্টে পেইড হবে।`
                    : `Minimum withdrawal is ${currencySymbol}${settings?.minWithdrawal || 200}. Funds are safely reserved and sent to your account upon admin review.`}
                </p>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.withdrawMethod}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {(['bkash', 'nagad', 'rocket', 'bank', 'crypto'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setWithdrawMethod(m)}
                        className={`p-2.5 rounded-xl text-xs font-bold capitalize transition border ${
                          withdrawMethod === m
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>{t.amount} ({currencySymbol})</span>
                    <span className="text-slate-400">
                      {t.available}: <strong className="text-white">{currencySymbol}{user?.wallet.availableBalance.toFixed(2)}</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    min={settings?.minWithdrawal || 200}
                    max={user?.wallet.availableBalance || 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.accountDetails} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    placeholder="e.g. 018XXXXXXXX (Personal) / Bank A/C details"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingWithdraw || (user?.wallet.availableBalance || 0) < (settings?.minWithdrawal || 200)}
                  className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase transition shadow-lg shadow-cyan-500/20 active:scale-98 disabled:opacity-50"
                >
                  {submittingWithdraw ? '...' : t.withdrawSubmit}
                </button>
              </form>
            </div>
          )}

          {/* 4. TRANSACTION LEDGER TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Filter Row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'deposit', label: 'Deposits' },
                  { id: 'withdrawal', label: 'Withdrawals' },
                  { id: 'trade', label: 'Trades' },
                  { id: 'settlement', label: 'Settlements' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryFilter(f.id)}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      historyFilter === f.id
                        ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Transactions Table/List */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredTransactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    {language === 'bn' ? 'কোনো ট্রানজ্যাকশন হিস্টোরি পাওয়া যায়নি' : 'No transactions recorded yet'}
                  </div>
                ) : (
                  filteredTransactions.map(txn => {
                    const isCredit = txn.type === 'deposit' || txn.type === 'settlement_credit' || txn.type === 'referral_bonus' || (txn.type === 'wallet_adjustment' && txn.amount > 0);
                    return (
                      <div
                        key={txn.id}
                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">
                              {language === 'bn' ? txn.descriptionBn : txn.descriptionEn}
                            </p>
                            <span className="text-[10px] text-slate-500">
                              {new Date(txn.timestamp).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')} • ID: {txn.id}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`font-mono font-bold text-sm block ${
                            isCredit ? 'text-emerald-400' : 'text-slate-200'
                          }`}>
                            {isCredit ? '+' : '-'}{currencySymbol}{txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Bal: {currencySymbol}{txn.balanceAfter.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
