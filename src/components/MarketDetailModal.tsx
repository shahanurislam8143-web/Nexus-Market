import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  X, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  BarChart3, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  Info
} from 'lucide-react';

export const MarketDetailModal: React.FC = () => {
  const { 
    markets, 
    selectedMarketId, 
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

  const currencySymbol = settings?.currencySymbol || '৳';

  // Trading state
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState<number>(100);
  const [limitPrice, setLimitPrice] = useState<number>(outcome === 'YES' ? market.yesPrice : market.noPrice);
  const [submitting, setSubmitting] = useState(false);
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | 'ALL'>('24H');

  const title = language === 'bn' ? market.titleBn : market.titleEn;
  const description = language === 'bn' ? market.descriptionBn : market.descriptionEn;

  const currentPrice = outcome === 'YES' ? market.yesPrice : market.noPrice;
  const effectivePrice = orderType === 'limit' ? limitPrice : currentPrice;
  const feePercent = (settings?.tradingFeePercent || 1.5) / 100;
  const fee = Number((amount * feePercent).toFixed(2));
  const netInvestment = Math.max(0, amount - fee);
  const estimatedShares = Math.floor(netInvestment / effectivePrice);
  const potentialPayout = estimatedShares * 1.0; // 1 BDT/unit per share
  const estimatedProfit = Math.max(0, potentialPayout - amount);
  const returnPercent = amount > 0 ? ((estimatedProfit / amount) * 100).toFixed(1) : '0';

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setActiveModal('auth');
      return;
    }

    if (amount <= 0) {
      notify('error', language === 'bn' ? 'সঠিক পরিমাণ লিখুন' : 'Enter a valid trade amount');
      return;
    }

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
          type: orderType,
          price: effectivePrice,
          amount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', `${t.tradeSuccess} (${outcome} ${estimatedShares} ${language === 'bn' ? 'শেয়ার' : 'shares'})`);
        triggerConfetti();
        await refreshData();
      } else {
        notify('error', data.message || data.error || 'Trade failed');
      }
    } catch (err) {
      notify('error', 'Trade request failed');
    } finally {
      setSubmitting(false);
    }
  };

  // SVG Chart Calculation
  const history = market.priceHistory && market.priceHistory.length > 0 
    ? market.priceHistory 
    : [{ timestamp: new Date().toISOString(), yesPrice: market.yesPrice, volume: market.volume }];

  const svgWidth = 600;
  const svgHeight = 200;
  const minPrice = 0.0;
  const maxPrice = 1.0;

  const points = history.map((pt, idx) => {
    const x = (idx / (history.length - 1 || 1)) * (svgWidth - 40) + 20;
    const y = svgHeight - 20 - ((pt.yesPrice - minPrice) / (maxPrice - minPrice)) * (svgHeight - 40);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${history.length > 0 ? (20 + ',' + (svgHeight - 20)) : ''} ${points} ${history.length > 0 ? ((svgWidth - 20) + ',' + (svgHeight - 20)) : ''}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              {market.category}
            </span>
            <span className="text-xs text-slate-400">ID: {market.id}</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Chart, OrderBook, Rules (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Market Info */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-700 bg-gradient-to-tr from-cyan-900 to-indigo-950 flex items-center justify-center relative">
                <img
                  src={market.imageUrl}
                  alt={title}
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  className="w-full h-full object-cover"
                />
                <BarChart3 className="w-8 h-8 text-cyan-400/50 absolute pointer-events-none" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {title}
                </h1>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Probability Stats Row */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 block">{t.chance} (YES)</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  {Math.round(market.yesPrice * 100)}%
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {currencySymbol}{market.yesPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{t.chance} (NO)</span>
                <span className="text-xl sm:text-2xl font-black text-rose-400">
                  {Math.round(market.noPrice * 100)}%
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {currencySymbol}{market.noPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">{t.volume}</span>
                <span className="text-lg sm:text-xl font-bold text-slate-200">
                  {currencySymbol}{market.volume.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {market.tradeCount} {t.trades}
                </span>
              </div>
            </div>

            {/* Interactive SVG Chart */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-300">{t.priceChart} (YES)</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                  {(['24H', '7D', '30D', 'ALL'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                        timeframe === tf ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Visual */}
              <div className="w-full overflow-hidden">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  <line x1="20" y1="30" x2={svgWidth - 20} y2="30" stroke="#1e293b" strokeDasharray="4 4" />
                  <line x1="20" y1="100" x2={svgWidth - 20} y2="100" stroke="#1e293b" strokeDasharray="4 4" />
                  <line x1="20" y1="170" x2={svgWidth - 20} y2="170" stroke="#1e293b" strokeDasharray="4 4" />

                  <text x="25" y="25" fill="#64748b" fontSize="10">80%</text>
                  <text x="25" y="95" fill="#64748b" fontSize="10">50%</text>
                  <text x="25" y="165" fill="#64748b" fontSize="10">20%</text>

                  {/* Shaded Area */}
                  {points && (
                    <polygon
                      points={areaPoints}
                      fill="url(#chartGradient)"
                    />
                  )}

                  {/* Main Line */}
                  {points && (
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* Order Book & Recent Trades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Order Book Mini */}
              <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  {t.orderBook}
                </h4>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    <span>{outcome} PRICE</span>
                    <span>QTY</span>
                  </div>
                  {(market.orderBook?.yesAsks?.slice(0, 3) || []).map((ask, i) => (
                    <div key={i} className="flex justify-between text-rose-400">
                      <span>{currencySymbol}{(ask.price).toFixed(2)}</span>
                      <span>{ask.amount}</span>
                    </div>
                  ))}
                  <div className="py-1 text-center font-bold text-slate-300 border-y border-slate-800/80 my-1">
                    SPREAD: 0.02
                  </div>
                  {(market.orderBook?.yesBids?.slice(0, 3) || []).map((bid, i) => (
                    <div key={i} className="flex justify-between text-emerald-400">
                      <span>{currencySymbol}{(bid.price).toFixed(2)}</span>
                      <span>{bid.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Trades Stream */}
              <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  {t.recentTrades}
                </h4>
                <div className="space-y-2 text-xs">
                  {market.recentTrades?.slice(0, 4).map((trd) => (
                    <div key={trd.id} className="flex items-center justify-between text-slate-300">
                      <span className={`font-bold ${trd.type === 'YES' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trd.type} {trd.amount}
                      </span>
                      <span className="text-slate-400">{currencySymbol}{trd.price.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500">{trd.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Resolution Rules & Source */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                {t.resolutionRules}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {market.resolutionRules}
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>{t.resolutionSource}:</span>
                <span className="text-cyan-400 font-semibold">{market.resolutionSource}</span>
              </div>
            </div>

          </div>

          {/* Right Column: Instant Trading Form (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 p-5 sm:p-6 bg-slate-950 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-white">
                  {t.tradePanel}
                </h3>
                {user && (
                  <span className="text-xs text-slate-400">
                    {t.available}: <strong className="text-white">{currencySymbol}{user.wallet.availableBalance.toFixed(2)}</strong>
                  </span>
                )}
              </div>

              {/* YES / NO Outcome Toggle */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setOutcome('YES'); setLimitPrice(market.yesPrice); }}
                  className={`py-3 rounded-xl font-black text-sm flex flex-col items-center justify-center transition-all ${
                    outcome === 'YES'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>YES {Math.round(market.yesPrice * 100)}%</span>
                  <span className="text-[11px] font-normal opacity-90">{currencySymbol}{market.yesPrice.toFixed(2)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setOutcome('NO'); setLimitPrice(market.noPrice); }}
                  className={`py-3 rounded-xl font-black text-sm flex flex-col items-center justify-center transition-all ${
                    outcome === 'NO'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 scale-[1.02]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>NO {Math.round(market.noPrice * 100)}%</span>
                  <span className="text-[11px] font-normal opacity-90">{currencySymbol}{market.noPrice.toFixed(2)}</span>
                </button>
              </div>

              {/* Order Type Tabs */}
              <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setOrderType('market')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    orderType === 'market' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.marketOrder}
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('limit')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    orderType === 'limit' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.limitOrder}
                </button>
              </div>

              <form onSubmit={handleTrade} className="space-y-4">
                
                {/* Limit Price Input if limit order */}
                {orderType === 'limit' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      {language === 'bn' ? 'অর্ডার লিমিট প্রাইস (০.০১ - ০.৯৯)' : 'Limit Price (0.01 - 0.99)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="0.99"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1.5">
                    <span>{t.amount} ({currencySymbol})</span>
                    {user && (
                      <button
                        type="button"
                        onClick={() => setAmount(Math.floor(user.wallet.availableBalance))}
                        className="text-cyan-400 hover:underline"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="10"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold text-lg focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex gap-2 mt-2">
                    {[100, 500, 1000, 5000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className="flex-1 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation Breakdown Box */}
                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800/80 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>{t.sharesOwned}:</span>
                    <span className="font-bold text-white">{estimatedShares} {language === 'bn' ? 'কন্ট্রাক্ট' : 'Contracts'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{t.avgPrice}:</span>
                    <span className="font-mono text-slate-200">{currencySymbol}{effectivePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{t.tradingFee} ({(feePercent * 100).toFixed(1)}%):</span>
                    <span className="text-slate-400">{currencySymbol}{fee.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
                    <span className="text-slate-300">{t.potentialPayout}:</span>
                    <span className="text-emerald-400 text-sm font-black">
                      {currencySymbol}{potentialPayout.toFixed(2)} (+{returnPercent}%)
                    </span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={submitting || market.status !== 'open'}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-xl active:scale-98 ${
                    market.status !== 'open'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : outcome === 'YES'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  }`}
                >
                  {submitting ? (
                    <span>{language === 'bn' ? 'অর্ডার প্রক্রিয়াধীন...' : 'Executing Order...'}</span>
                  ) : market.status !== 'open' ? (
                    <span>{language === 'bn' ? 'মার্কেট বন্ধ রয়েছে' : 'Market Closed'}</span>
                  ) : (
                    <span>{t.confirmTrade} ({outcome})</span>
                  )}
                </button>

                <p className="text-[11px] text-slate-500 text-center leading-normal">
                  {language === 'bn'
                    ? 'পূর্বাভাস সঠিক হলে প্রতিটি কন্ট্রাক্টের জন্য ১০০% পেআউট প্রাপ্ত হবে।'
                    : 'Winning predictions receive full 1.00 unit settlement per contract.'}
                </p>

              </form>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
