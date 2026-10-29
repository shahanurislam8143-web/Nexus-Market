import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Gift, Copy, CheckCircle2, Share2, Users, Trophy, X } from 'lucide-react';
import { ReferralInfo } from '../types/index.ts';

export const ReferralModal: React.FC = () => {
  const { user, language, t, setActiveModal, notify, settings } = useApp();
  const [data, setData] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const currencySymbol = settings?.currencySymbol || '৳';

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/referral/${user.id}`)
        .then(res => res.json())
        .then(d => setData(d))
        .catch(console.error);
    }
  }, [user]);

  const referralLink = `${window.location.origin}?ref=${user?.referralCode || 'NEXUS'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    notify('success', t.copied);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base sm:text-lg">{t.referralTitle}</h2>
              <p className="text-xs text-slate-400">{t.referralSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <div>
              <span className="text-[11px] text-slate-400 block">{t.totalReferrals}</span>
              <span className="text-xl font-black text-white">{data?.totalReferrals || 0}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">{t.successful}</span>
              <span className="text-xl font-black text-emerald-400">{data?.successfulReferrals || 0}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">{t.earned}</span>
              <span className="text-xl font-black text-amber-400">{currencySymbol}{data?.totalEarned || 0}</span>
            </div>
          </div>

          {/* Copyable Link Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              {t.yourCode} & Referral Link
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="w-full bg-transparent text-xs text-cyan-400 font-mono focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 transition active:scale-95"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t.copied : t.copyLink}</span>
              </button>
            </div>
          </div>

          {/* Referral History */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'আমন্ত্রিত ব্যবহারকারী তালিকা' : 'Referral History'}
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {!data?.history || data.history.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  {language === 'bn' ? 'এখনো কাউকে আমন্ত্রণ জানানো হয়নি' : 'No friends invited yet'}
                </div>
              ) : (
                data.history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.userName}</p>
                      <span className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 font-mono">+{currencySymbol}{item.bonus}</span>
                      <span className="text-[10px] text-slate-500 block capitalize">{item.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
