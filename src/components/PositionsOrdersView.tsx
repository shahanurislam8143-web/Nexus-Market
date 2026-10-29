import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  X, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Ban, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';

export const PositionsOrdersView: React.FC = () => {
  const { 
    user, 
    userPositions, 
    userOrders, 
    markets, 
    setActiveModal, 
    setSelectedMarketId, 
    language, 
    t, 
    settings, 
    refreshData, 
    notify 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'positions' | 'orders'>('positions');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const currencySymbol = settings?.currencySymbol || '৳';

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(t.cancelConfirm)) return;
    setCancellingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify('success', data.message);
        await refreshData();
      } else {
        notify('error', data.message || 'Cancellation failed');
      }
    } catch (e) {
      notify('error', 'Request failed');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const activePositions = userPositions.filter(p => p.status === 'active' && p.shares > 0);
  const openOrders = userOrders.filter(o => o.status === 'open' || o.status === 'partially_filled');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg">{t.positions}</h2>
              <p className="text-xs text-slate-400">
                {activePositions.length} {language === 'bn' ? 'সক্রিয় পজিশন' : 'Active positions'} • {openOrders.length} {language === 'bn' ? 'অপেক্ষমাণ অর্ডার' : 'Open orders'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('positions')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'positions'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.myPositions}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">
              {activePositions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{t.openOrders}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-bold">
              {openOrders.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* 1. POSITIONS */}
          {activeTab === 'positions' && (
            <div className="space-y-3">
              {activePositions.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p>{t.noActivePositions}</p>
                </div>
              ) : (
                activePositions.map(pos => {
                  const mkt = markets.find(m => m.id === pos.marketId);
                  const isProfit = pos.unrealizedPnl >= 0;
                  const currentProb = pos.outcome === 'YES' ? (mkt?.yesPrice || 0.5) : (mkt?.noPrice || 0.5);
                  const currentValue = pos.shares * currentProb;
                  const pnl = currentValue - pos.totalInvested;

                  return (
                    <div
                      key={pos.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            pos.outcome === 'YES'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {pos.outcome}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">ID: {pos.marketId}</span>
                        </div>
                        <h4 
                          onClick={() => { setSelectedMarketId(pos.marketId); setActiveModal('market_detail'); }}
                          className="font-semibold text-sm text-slate-100 hover:text-cyan-400 cursor-pointer transition line-clamp-1"
                        >
                          {mkt ? (language === 'bn' ? mkt.titleBn : mkt.titleEn) : pos.marketId}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                          <span>{pos.shares} {language === 'bn' ? 'শেয়ার' : 'shares'}</span>
                          <span>{t.avgPrice}: {currencySymbol}{pos.avgPrice.toFixed(2)}</span>
                          <span>{t.invested}: {currencySymbol}{pos.totalInvested.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-800">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-slate-500 block">{t.currentValue}</span>
                          <span className="font-bold text-white text-base font-mono">
                            {currencySymbol}{currentValue.toFixed(2)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">{t.pnl}</span>
                          <div className={`flex items-center gap-1 font-bold text-sm font-mono ${
                            pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {pnl >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            <span>{pnl >= 0 ? '+' : ''}{currencySymbol}{pnl.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {openOrders.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p>{t.noOpenOrders}</p>
                </div>
              ) : (
                openOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {order.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.outcome === 'YES' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {order.side.toUpperCase()} {order.outcome}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">#{order.id}</span>
                      </div>
                      <h4 className="font-semibold text-sm text-slate-200 line-clamp-1">
                        {order.marketTitle}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        {order.quantity} shares @ {currencySymbol}{order.price.toFixed(2)} • Total: {currencySymbol}{order.totalCost.toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingOrderId === order.id}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 self-end sm:self-center"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{cancellingOrderId === order.id ? 'Cancelling...' : t.cancelOrder}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
