import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { X, ShieldCheck, UserCheck, Sparkles, LogIn, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { setActiveModal, login, language, t } = useApp();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const success = await login(email.trim(), displayName.trim() || undefined, 'user');
    setLoading(false);
    if (success) setActiveModal(null);
  };

  const handleQuickPersona = async (pEmail: string, pName: string, role: 'user' | 'admin' = 'user') => {
    setLoading(true);
    const success = await login(pEmail, pName, role);
    setLoading(false);
    if (success) setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <LogIn className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-white text-base">{t.login}</h3>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Fast Accounts */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {language === 'bn' ? '১-ক্লিক দ্রুত প্রবেশ (টেস্ট অ্যাকাউন্ট):' : '1-Click Quick Select Account:'}
          </span>
          
          <button
            onClick={() => handleQuickPersona('mdshahanurislam397@gmail.com', 'Shahanur Islam (Pro Trader)', 'user')}
            disabled={loading}
            className="w-full p-3 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                alt="Shahanur"
                className="w-9 h-9 rounded-full object-cover border border-slate-700"
              />
              <div>
                <strong className="text-white text-xs block group-hover:text-cyan-400 transition">
                  Shahanur Islam (Pro Trader)
                </strong>
                <span className="text-[10px] text-slate-400">mdshahanurislam397@gmail.com • ৳15,400</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => handleQuickPersona('admin@nexusmarket.io', 'Nexus Super Admin', 'admin')}
            disabled={loading}
            className="w-full p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                ADM
              </div>
              <div>
                <strong className="text-amber-300 text-xs block">
                  Nexus Super Admin (পূর্ণ নিয়ন্ত্রণ)
                </strong>
                <span className="text-[10px] text-amber-400/80">admin@nexusmarket.io • Super Admin Role</span>
              </div>
            </div>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">{language === 'bn' ? 'অথবা নিজের ইমেইল দিয়ে' : 'OR WITH YOUR EMAIL'}</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Custom Email Sign In */}
        <form onSubmit={handleCustomLogin} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              ইমেইল অ্যাড্রেস (Email Address)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              ডিসপ্লে নাম (Display Name - ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Shakib Al Hasan"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20 active:scale-98"
          >
            {loading ? '...' : (language === 'bn' ? 'লগইন / নতুন অ্যাকাউন্ট তৈরি' : 'Continue / Sign Up')}
          </button>
          
          <p className="text-[10px] text-slate-500 text-center">
            {language === 'bn' ? 'নতুন অ্যাকাউন্ট খুললেই পাচ্ছেন ২০০০৳ ওয়েলকাম ডেমো ট্রেডিং বোনাস!' : 'New accounts instantly get ৳2,000 welcome demo balance!'}
          </p>
        </form>

      </div>
    </div>
  );
};
