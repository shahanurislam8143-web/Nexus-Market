import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  Trophy, 
  Newspaper, 
  Bitcoin, 
  Vote, 
  TrendingUp, 
  Cpu, 
  Film, 
  Sparkles,
  Flame,
  Clock,
  CheckCircle,
  BarChart3,
  Layers
} from 'lucide-react';
import { MarketCategory } from '../types/index.ts';

export const CategoryBar: React.FC = () => {
  const { 
    selectedCategory, 
    setSelectedCategory, 
    sortBy, 
    setSortBy, 
    t, 
    language 
  } = useApp();

  const categories: Array<{ id: string; label: string; icon: any }> = [
    { id: 'all', label: t.allCategories, icon: Layers },
    { id: 'sports', label: t.sports, icon: Trophy },
    { id: 'news', label: t.news, icon: Newspaper },
    { id: 'crypto', label: t.crypto, icon: Bitcoin },
    { id: 'politics', label: t.politics, icon: Vote },
    { id: 'business', label: t.business, icon: TrendingUp },
    { id: 'technology', label: t.technology, icon: Cpu },
    { id: 'entertainment', label: t.entertainment, icon: Film },
    { id: 'custom', label: t.custom, icon: Sparkles },
  ];

  const filterChips: Array<{ id: string; label: string; icon: any }> = [
    { id: 'all', label: t.filterAll, icon: BarChart3 },
    { id: 'volume', label: t.filterHighVolume, icon: Flame },
    { id: 'closing_soon', label: t.filterClosingSoon, icon: Clock },
    { id: 'newest', label: t.filterNew, icon: Sparkles },
    { id: 'resolved', label: t.filterResolved, icon: CheckCircle },
  ];

  return (
    <div className="space-y-3 py-2">
      {/* Category Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Filter Sort Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
          {language === 'bn' ? 'ফিল্টার:' : 'Filter:'}
        </span>
        {filterChips.map((filter) => {
          const Icon = filter.icon;
          const isSelected = sortBy === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setSortBy(filter.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
