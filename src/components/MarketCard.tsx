import React from 'react';
import { Market } from '../types/index.ts';
import { useApp } from '../context/AppContext.tsx';
import { Clock, TrendingUp, BarChart2, CheckCircle2, AlertCircle } from 'lucide-react';

interface MarketCardProps {
  market: Market;
}

export const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  const { 
    language, 
    t, 
    setActiveModal, 
    setSelectedMarketId, 
    setSelectedOutcome,
    settings 
  } = useApp();

  const currencySymbol = settings?.currencySymbol || '৳';

  const title = language === 'bn' ? market.titleBn : market.titleEn;
  const description = language === 'bn' ? market.descriptionBn : market.descriptionEn;

  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = 100 - yesPercent;

  // Format date
  const closingDate = new Date(market.closingTime);
  const isExpired = closingDate.getTime() < Date.now();
  const timeFormatted = closingDate.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleTradeClick = (e: React.MouseEvent, outcome: 'YES' | 'NO') => {
    e.stopPropagation();
    setSelectedMarketId(market.id);
    setSelectedOutcome(outcome);
    setActiveModal('trade');
  };

  const handleCardClick = () => {
    setSelectedMarketId(market.id);
    setActiveModal('market_detail');
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-cyan-950/20 hover:-translate-y-0.5"
    >
      <div>
        {/* Top Meta Bar */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-800 bg-gradient-to-tr from-cyan-900 to-indigo-950 flex items-center justify-center">
            <img
              src={market.imageUrl}
              alt={title}
              onError={(e) => {
                // Graceful fallback to avoid broken image icon
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              loading="lazy"
            />
            <BarChart2 className="w-6 h-6 text-cyan-400/50 absolute pointer-events-none" />
            {market.status === 'resolved' && (
              <div className="absolute inset-0 bg-emerald-950/80 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700/60">
                {market.category}
              </span>

              {market.status === 'resolved' ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {t.resolved}: {market.outcome}
                </span>
              ) : isExpired ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {t.closed}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {t.open}
                </span>
              )}
            </div>

            <h3 className="font-semibold text-sm sm:text-base text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
              {title}
            </h3>
          </div>
        </div>

        {/* Probability Progress Bar */}
        <div className="mt-3 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
            <span className="text-emerald-400 flex items-center gap-1">
              YES {yesPercent}%
              <span className="text-[10px] text-slate-400 font-normal">({currencySymbol}{market.yesPrice.toFixed(2)})</span>
            </span>
            <span className="text-rose-400 flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-normal">({currencySymbol}{market.noPrice.toFixed(2)})</span>
              NO {noPercent}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${yesPercent}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
              style={{ width: `${noPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info & Quick Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/70">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
          <div className="flex items-center gap-1">
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.volume}: <strong className="text-slate-200">{currencySymbol}{market.volume.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{timeFormatted}</span>
          </div>
        </div>

        {/* Trade Action Buttons */}
        {market.status === 'open' && !isExpired ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => handleTradeClick(e, 'YES')}
              className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>{t.buyYes}</span>
              <span className="text-[10px] opacity-80">{yesPercent}%</span>
            </button>

            <button
              onClick={(e) => handleTradeClick(e, 'NO')}
              className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>{t.buyNo}</span>
              <span className="text-[10px] opacity-80">{noPercent}%</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleCardClick}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold transition"
          >
            {t.viewDetails}
          </button>
        )}
      </div>
    </div>
  );
};
