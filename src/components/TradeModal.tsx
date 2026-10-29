import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { X, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const TradeModal: React.FC = () => {
  const { 
    markets, 
    selectedMarketId, 
    selectedOutcome, 
    setActiveModal, 
    language, 
    t, 
    user, 
    refreshData, 
    notify, 
    triggerConfetti,
    settings 
  } = useApp();

  const market = markets.find(m => m.id === selectedMarketId);
  if (!market) return null;

  const [outcome, setOutcome] = useState<'YES' | 'NO'>(selectedOutcome || 'YES');
  const [amount, setAmount] = useState<number>(100);
  const [submitting, setSubmitting] = useState(false);

  const currencySymbol = settings?.currencySymbol || '৳';
  const price = outcome === 'YES' ? market.yesPrice : market.noPrice;
  const feePercent = (settings?.tradingFeePercent || 1.5) / 100;
  const fee = Number((amount * feePercent).toFixed(2));
  const netAmount = Math.max(0, amount - fee);
  const estimatedShares = Math.floor(netAmount / price);
  const potentialPayout = estimatedShares * 1.0;
  const profit = Math.max(0, potentialPayout - amount);
  const returnRate = amount > 0 ? ((profit / amount) * 100).toFixed(0) : '0';

  const title = language === 'bn' ? market.titleBn : market.titleEn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setActiveModal('auth');
      return;
    }
    if (amount <= 0) return;
    if (amount > user.wallet.availableBalance) {
      notify('error', t.insufficientFunds);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          marketId: market.id,
          outcome,
          type: 'market',
          amount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', `${t.tradeSuccess} (${outcome} ${estimatedShares} ${language === 'bn' ? 'শেয়ার' : 'shares'})`);
        triggerConfetti();
        await refreshData();
        setActiveModal(null);
      } else {
        notify('error', data.message || 'Trade failed');
      }
    } catch (err) {
      notify('error', 'Execution error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{t.tradePanel}</span>
            <h3 className="font-bold text-white text-base line-clamp-1">{title}</h3>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outcome Selector */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <button
            type="button"
            onClick={() => setOutcome('YES')}
            className={`py-3 rounded-2xl font-black text-sm flex flex-col items-center justify-center transition border ${
              outcome === 'YES'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>YES {Math.round(market.yesPrice * 100)}%</span>
            <span className="text-xs font-normal opacity-90">{currencySymbol}{market.yesPrice.toFixed(2)}</span>
          </button>

          <button
            type="button"
            onClick={() => setOutcome('NO')}
            className={`py-3 rounded-2xl font-black text-sm flex flex-col items-center justify-center transition border ${
              outcome === 'NO'
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>NO {Math.round(market.noPrice * 100)}%</span>
            <span className="text-xs font-normal opacity-90">{currencySymbol}{market.noPrice.toFixed(2)}</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
              <span>{t.amount} ({currencySymbol})</span>
              {user && (
                <span>
                  {t.available}: <strong className="text-slate-200">{currencySymbol}{user.wallet.availableBalance.toFixed(2)}</strong>
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="10"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-lg focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 mt-2">
              {[50, 100, 500, 1000].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className="flex-1 py-1 text-xs font-semibold rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                >
                  +{v}
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>{t.sharesOwned}:</span>
              <span className="font-bold text-white">{estimatedShares}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>{t.tradingFee}:</span>
              <span>{currencySymbol}{fee.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex justify-between font-bold">
              <span className="text-slate-300">{t.potentialPayout}:</span>
              <span className="text-emerald-400 text-sm">
                {currencySymbol}{potentialPayout.toFixed(2)} (+{returnRate}%)
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase transition-all shadow-xl active:scale-98 ${
              outcome === 'YES'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
            }`}
          >
            {submitting ? '...' : `${t.confirmTrade} (${outcome})`}
          </button>
        </form>

      </div>
    </div>
  );
};
