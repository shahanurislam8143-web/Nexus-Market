import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Trophy, Medal, Award, Flame, X } from 'lucide-react';
import { LeaderboardEntry } from '../types/index.ts';

export const LeaderboardView: React.FC = () => {
  const { language, t, setActiveModal, settings } = useApp();
  const [period, setPeriod] = useState<string>('all-time');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const currencySymbol = settings?.currencySymbol || '৳';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg">{t.leaderboardTitle}</h2>
              <p className="text-xs text-slate-400">{t.leaderboardSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeframe Pills */}
        <div className="flex items-center justify-center gap-2 p-4 bg-slate-950/40 border-b border-slate-800 text-xs font-semibold">
          {[
            { id: 'daily', label: t.daily },
            { id: 'weekly', label: t.weekly },
            { id: 'monthly', label: t.monthly },
            { id: 'all-time', label: t.allTime },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-1.5 rounded-xl transition ${
                period === p.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Entries Table */}
        <div className="p-6">
          <div className="space-y-2.5">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading leaderboard...'}
              </div>
            ) : entries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                {language === 'bn' ? 'কোনো রেকর্ড পাওয়া যায়নি' : 'No records yet'}
              </div>
            ) : (
              entries.map((entry) => {
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;

                return (
                  <div
                    key={entry.userId}
                    className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isTop1
                        ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/40'
                        : isTop2
                        ? 'bg-gradient-to-r from-slate-400/10 via-slate-900 to-slate-900 border-slate-600'
                        : isTop3
                        ? 'bg-gradient-to-r from-amber-700/10 via-slate-900 to-slate-900 border-amber-800'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Rank Icon / Number */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                        {isTop1 ? (
                          <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
                        ) : isTop2 ? (
                          <Medal className="w-6 h-6 text-slate-300" />
                        ) : isTop3 ? (
                          <Award className="w-6 h-6 text-amber-600" />
                        ) : (
                          <span className="text-slate-500 font-mono">#{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar & Name */}
                      <img
                        src={entry.avatar}
                        alt={entry.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm sm:text-base">
                          {entry.isProfilePrivate ? 'Anonymous Trader' : entry.displayName}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{entry.tradeCount} {t.trades}</span>
                          <span>•</span>
                          <span className="text-emerald-400">{entry.winRate}% {t.winRate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Profit */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block">{t.profit}</span>
                      <span className="font-mono font-black text-base sm:text-lg text-emerald-400">
                        +{currencySymbol}{entry.verifiedNetProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
