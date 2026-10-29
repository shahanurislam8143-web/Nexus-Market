import fs from 'fs';
import path from 'path';
import { 
  Market, 
  User, 
  Order, 
  Position, 
  Transaction, 
  DepositRequest, 
  WithdrawalRequest, 
  CategoryInfo, 
  PlatformSettings,
  LeaderboardEntry
} from '../types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nexus_db.json');

export interface DatabaseSchema {
  users: User[];
  markets: Market[];
  orders: Order[];
  positions: Position[];
  transactions: Transaction[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  categories: CategoryInfo[];
  settings: PlatformSettings;
  auditLogs: Array<{
    id: string;
    adminId: string;
    action: string;
    details: string;
    timestamp: string;
  }>;
}

const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { id: 'sports', nameBn: 'খেলাধুলা (Sports)', nameEn: 'Sports', icon: 'Trophy', order: 1, isActive: true, descriptionBn: 'ক্রিকেট, ফুটবল ও অন্যান্য খেলাধুলার মার্কেট', descriptionEn: 'Cricket, Football and athletic prediction markets' },
  { id: 'news', nameBn: 'সংবাদ ও ঘটনা (News)', nameEn: 'News', icon: 'Newspaper', order: 2, isActive: true, descriptionBn: 'জাতীয় ও আন্তর্জাতিক গুরুত্বপূর্ণ সংবাদ', descriptionEn: 'National and international breaking news' },
  { id: 'crypto', nameBn: 'ক্রিপ্টোকারেন্সি (Crypto)', nameEn: 'Crypto', icon: 'Bitcoin', order: 3, isActive: true, descriptionBn: 'বিটকয়েন, ইথারিয়াম ও ক্রিপ্টো প্রেডিকশন', descriptionEn: 'Bitcoin, Ethereum and crypto asset predictions' },
  { id: 'politics', nameBn: 'রাজনীতি (Politics)', nameEn: 'Politics', icon: 'Vote', order: 4, isActive: true, descriptionBn: 'নির্বাচন ও রাজনৈতিক সমীকরণ', descriptionEn: 'Elections and geopolitical forecasting' },
  { id: 'business', nameBn: 'ব্যবসা ও বাণিজ্য (Business)', nameEn: 'Business', icon: 'TrendingUp', order: 5, isActive: true, descriptionBn: 'অর্থনীতি, শেয়ারবাজার ও ব্যবসা', descriptionEn: 'Economy, stocks, and business events' },
  { id: 'technology', nameBn: 'প্রযুক্তি ও এআই (Tech & AI)', nameEn: 'Tech & AI', icon: 'Cpu', order: 6, isActive: true, descriptionBn: 'এআই, স্মার্টফোন ও মহাকাশ বিজ্ঞান', descriptionEn: 'Artificial intelligence, tech launches and space' },
  { id: 'entertainment', nameBn: 'বিনোদন ও সিনেমা (Entertainment)', nameEn: 'Entertainment', icon: 'Film', order: 7, isActive: true, descriptionBn: 'সিনেমা, বক্স অফিস ও অ্যাওয়ার্ড', descriptionEn: 'Movies, box office, awards and pop culture' },
  { id: 'custom', nameBn: 'বিশেষ মার্কেট (Special)', nameEn: 'Special Events', icon: 'Sparkles', order: 8, isActive: true, descriptionBn: 'বিশেষ ও কাস্টম প্রেডিকশন ইভেন্ট', descriptionEn: 'Custom and community prediction markets' },
];

const DEFAULT_SETTINGS: PlatformSettings = {
  tradingFeePercent: 1.5,
  cancellationFee: 0,
  platformFeePercent: 2.0,
  minDeposit: 100,
  minWithdrawal: 200,
  currencySymbol: '৳',
  currencyCode: 'BDT',
  isMaintenance: false,
  announcementBn: 'NexusMarket-এ স্বাগতম! বিশ্বমানের প্রেডিকশন মার্কেটে অংশ নিন এবং সঠিক পূর্বাভাসের মাধ্যমে উপার্জন করুন।',
  announcementEn: 'Welcome to NexusMarket! Trade your opinions on real-world events and win.',
  depositNumbers: {
    bkash: '01899-234567 (Personal)',
    nagad: '01711-987654 (Merchant)',
    rocket: '01912-345678-9 (Personal)',
    bank: 'Nexus Bank Ltd | A/C: 1045-8902-3401 | Branch: Motijheel, Dhaka',
    crypto: 'USDT (TRC20): TQn9Y2khEsLJW1ChV8mD434bJ6c78LpxYw',
  },
};

const SEED_USERS: User[] = [
  {
    id: 'USR-ADMIN-100',
    email: 'admin@nexusmarket.io',
    displayName: 'Nexus Super Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '01700000000',
    role: 'admin',
    isVerified: true,
    status: 'active',
    wallet: {
      availableBalance: 250000,
      reservedBalance: 0,
      pendingWithdrawal: 0,
      totalDeposited: 300000,
      totalWithdrawn: 50000,
      totalFeesPaid: 450,
      netProfit: 12450,
    },
    stats: {
      totalTrades: 42,
      wins: 30,
      losses: 12,
      winRate: 71.4,
      totalVolume: 58000,
    },
    referralCode: 'NEXUSADMIN',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'USR-TRADER-201',
    email: 'mdshahanurislam397@gmail.com',
    displayName: 'Shahanur Islam (Pro Trader)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    phone: '01812345678',
    role: 'user',
    isVerified: true,
    status: 'active',
    wallet: {
      availableBalance: 15400,
      reservedBalance: 1200,
      pendingWithdrawal: 0,
      totalDeposited: 20000,
      totalWithdrawn: 8000,
      totalFeesPaid: 320,
      netProfit: 3720,
    },
    stats: {
      totalTrades: 28,
      wins: 19,
      losses: 9,
      winRate: 67.8,
      totalVolume: 24500,
    },
    referralCode: 'SHAHANUR',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'USR-DEMO-305',
    email: 'tanvir.ahmed@example.com',
    displayName: 'Tanvir Hossain',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    phone: '01987654321',
    role: 'user',
    isVerified: true,
    status: 'active',
    wallet: {
      availableBalance: 8200,
      reservedBalance: 600,
      pendingWithdrawal: 1000,
      totalDeposited: 12000,
      totalWithdrawn: 5000,
      totalFeesPaid: 190,
      netProfit: 2190,
    },
    stats: {
      totalTrades: 16,
      wins: 11,
      losses: 5,
      winRate: 68.7,
      totalVolume: 14200,
    },
    referralCode: 'TANVIR99',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  }
];

function generateSeedHistory(baseYes: number) {
  const points = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * 3600000).toISOString();
    const noise = (Math.sin(i * 0.7) * 0.08) + (Math.random() * 0.04 - 0.02);
    const p = Math.min(0.95, Math.max(0.05, Number((baseYes + noise).toFixed(2))));
    points.push({
      timestamp: time,
      yesPrice: p,
      volume: Math.floor(1200 + Math.random() * 3500)
    });
  }
  return points;
}

function generateOrderBook(yesPrice: number): Market['orderBook'] {
  const yp = Math.round(yesPrice * 100);
  const np = 100 - yp;
  
  return {
    yesBids: [
      { price: (yp - 1) / 100, amount: 250, total: 250 * ((yp - 1) / 100) },
      { price: (yp - 2) / 100, amount: 500, total: 500 * ((yp - 2) / 100) },
      { price: (yp - 4) / 100, amount: 1200, total: 1200 * ((yp - 4) / 100) },
      { price: (yp - 7) / 100, amount: 2400, total: 2400 * ((yp - 7) / 100) },
    ],
    yesAsks: [
      { price: (yp + 1) / 100, amount: 300, total: 300 * ((yp + 1) / 100) },
      { price: (yp + 3) / 100, amount: 650, total: 650 * ((yp + 3) / 100) },
      { price: (yp + 5) / 100, amount: 1400, total: 1400 * ((yp + 5) / 100) },
      { price: (yp + 8) / 100, amount: 3100, total: 3100 * ((yp + 8) / 100) },
    ],
    noBids: [
      { price: (np - 1) / 100, amount: 280, total: 280 * ((np - 1) / 100) },
      { price: (np - 3) / 100, amount: 720, total: 720 * ((np - 3) / 100) },
      { price: (np - 5) / 100, amount: 1100, total: 1100 * ((np - 5) / 100) },
    ],
    noAsks: [
      { price: (np + 1) / 100, amount: 340, total: 340 * ((np + 1) / 100) },
      { price: (np + 3) / 100, amount: 800, total: 800 * ((np + 3) / 100) },
      { price: (np + 6) / 100, amount: 1600, total: 1600 * ((np + 6) / 100) },
    ]
  };
}

const SEED_MARKETS: Market[] = [
  {
    id: 'MKT-CRIC-001',
    titleBn: 'আইসিসি চ্যাম্পিয়ন্স ট্রফিতে বাংলাদেশ কি সেমিফাইনালে উঠবে?',
    titleEn: 'Will Bangladesh reach the semifinals in the ICC Champions Trophy?',
    descriptionBn: 'আইসিসি চ্যাম্পিয়ন্স ট্রফির গ্রুপ পর্বে শীর্ষ দুইয়ে থেকে বাংলাদেশ দল পরবর্তী পর্বে উত্তীর্ণ হবে কিনা তা এই মার্কেটের ভিত্তি।',
    descriptionEn: 'Resolves to YES if the Bangladesh national cricket team qualifies for the semifinals of the ICC Champions Trophy.',
    category: 'sports',
    imageUrl: 'https://images.unsplash.com/photo-1531415074868-036b107e7752?w=600&auto=format&fit=crop&q=80',
    yesPrice: 0.64,
    noPrice: 0.36,
    volume: 184500,
    tradeCount: 1420,
    liquidity: 42000,
    status: 'open',
    closingTime: new Date(Date.now() + 14 * 86400000).toISOString(),
    resolutionSource: 'Official ICC Results & Cricbuzz',
    resolutionRules: 'ফলাফল ICC এর অফিসিয়াল স্কোরবোর্ড অনুযায়ী নির্ধারিত হবে। টুর্নামেন্ট বাতিল হলে রিফান্ড করা হবে।',
    priceHistory: generateSeedHistory(0.64),
    orderBook: generateOrderBook(0.64),
    recentTrades: [
      { id: 'T-1', type: 'YES', price: 0.64, amount: 150, time: '2 mins ago', buyer: 'Shahanur I.' },
      { id: 'T-2', type: 'NO', price: 0.36, amount: 80, time: '7 mins ago', buyer: 'Tanvir H.' },
      { id: 'T-3', type: 'YES', price: 0.63, amount: 300, time: '14 mins ago', buyer: 'Rakib07' },
    ],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    totalYesPool: 118080,
    totalNoPool: 66420,
  },
  {
    id: 'MKT-CRYPTO-002',
    titleBn: '২০২৬ সালের ডিসেম্বরের পূর্বে বিটকয়েন কি $120,000 স্পর্শ করবে?',
    titleEn: 'Will Bitcoin reach $120,000 before December 2026?',
    descriptionBn: 'Binance ও Coinbase এক্সচেঞ্জে বিটকয়েনের মূল্য নির্ধারিত সময়ের মধ্যে $120,000 স্পর্শ করলে YES জয়ী হবে।',
    descriptionEn: 'Resolves to YES if BTC/USD trades at or above $120,000 on Binance or Coinbase at any moment before the deadline.',
    category: 'crypto',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    yesPrice: 0.72,
    noPrice: 0.28,
    volume: 342000,
    tradeCount: 2890,
    liquidity: 95000,
    status: 'open',
    closingTime: new Date(Date.now() + 45 * 86400000).toISOString(),
    resolutionSource: 'CoinGecko / Binance Index',
    resolutionRules: 'বাইনান্স অথবা কয়েনগেকোতে স্পট মূল্যে ন্যূনতম একটি ভ্যালিড ট্রেড $120k পৌঁছালেই YES নির্ধারিত হবে।',
    priceHistory: generateSeedHistory(0.72),
    orderBook: generateOrderBook(0.72),
    recentTrades: [
      { id: 'T-4', type: 'YES', price: 0.72, amount: 500, time: '1 min ago', buyer: 'CryptoWhale' },
      { id: 'T-5', type: 'YES', price: 0.71, amount: 250, time: '5 mins ago', buyer: 'Sifat K.' },
      { id: 'T-6', type: 'NO', price: 0.29, amount: 100, time: '12 mins ago', buyer: 'HedgeFundBD' },
    ],
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    totalYesPool: 246240,
    totalNoPool: 95760,
  },
  {
    id: 'MKT-TECH-003',
    titleBn: 'গুগল কি চলতি ত্রৈমাসিকে Gemini 3.0 ফুল রিলিজ ঘোষণা করবে?',
    titleEn: 'Will Google announce Gemini 3.0 general availability this quarter?',
    descriptionBn: 'গুগল তাদের অফিশিয়াল কি-নোট বা ব্লগে Gemini 3.0 সাধারণ ব্যবহারকারীদের জন্য উন্মুক্ত করলে YES হবে।',
    descriptionEn: 'Resolves to YES if Google officially launches Gemini 3.0 GA during this quarter.',
    category: 'technology',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    yesPrice: 0.58,
    noPrice: 0.42,
    volume: 128900,
    tradeCount: 940,
    liquidity: 38000,
    status: 'open',
    closingTime: new Date(Date.now() + 20 * 86400000).toISOString(),
    resolutionSource: 'Google Official Blog / Keynote',
    resolutionRules: 'গুগলের ভেরিফায়েড প্রেস রিলিজের ভিত্তিতে মার্কেট নির্ধারিত হবে।',
    priceHistory: generateSeedHistory(0.58),
    orderBook: generateOrderBook(0.58),
    recentTrades: [
      { id: 'T-7', type: 'NO', price: 0.42, amount: 200, time: '3 mins ago', buyer: 'AI_Dev' },
      { id: 'T-8', type: 'YES', price: 0.58, amount: 400, time: '9 mins ago', buyer: 'TechBD' },
    ],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    totalYesPool: 74762,
    totalNoPool: 54138,
  },
  {
    id: 'MKT-FOOT-004',
    titleBn: 'উয়েফা চ্যাম্পিয়ন্স লিগ ফাইনালে কি রিয়াল মাদ্রিদ জয়ী হবে?',
    titleEn: 'Will Real Madrid win the UEFA Champions League Final?',
    descriptionBn: 'চলতি আসরে রিয়াল মাদ্রিদ চ্যাম্পিয়ন্স লিগ শিরোপা জিতলে YES ফলাফল হিসেবে পরিগণিত হবে।',
    descriptionEn: 'Resolves to YES if Real Madrid CF lifts the UEFA Champions League trophy.',
    category: 'sports',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80',
    yesPrice: 0.48,
    noPrice: 0.52,
    volume: 215000,
    tradeCount: 1680,
    liquidity: 52000,
    status: 'open',
    closingTime: new Date(Date.now() + 35 * 86400000).toISOString(),
    resolutionSource: 'UEFA.com Official',
    resolutionRules: 'অফিসিয়াল ট্রফি প্রেজেন্টেশন এবং উয়েফা ম্যাচ রিপোর্টের ওপর ভিত্তি করে মীমাংসা করা হবে।',
    priceHistory: generateSeedHistory(0.48),
    orderBook: generateOrderBook(0.48),
    recentTrades: [
      { id: 'T-9', type: 'NO', price: 0.52, amount: 150, time: '6 mins ago', buyer: 'BarcaFan' },
      { id: 'T-10', type: 'YES', price: 0.48, amount: 350, time: '11 mins ago', buyer: 'Madridista' },
    ],
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    totalYesPool: 103200,
    totalNoPool: 111800,
  },
  {
    id: 'MKT-NEWS-005',
    titleBn: 'বাংলাদেশে কি আগামী অর্থবছরে বৈদেশিক মুদ্রার রিজার্ভ $২৫ বিলিয়ন অতিক্রম করবে?',
    titleEn: 'Will Bangladesh FX reserves surpass $25 Billion in the next fiscal quarter?',
    descriptionBn: 'বাংলাদেশ ব্যাংকের অফিসিয়াল রিপোর্টে নেট রিজার্ভ ২৫ বিলিয়ন মার্কিন ডলার অতিক্রম করলে YES হবে।',
    descriptionEn: 'Resolves to YES if Bangladesh Bank officially reports forex reserves > $25B in upcoming publication.',
    category: 'business',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80',
    yesPrice: 0.39,
    noPrice: 0.61,
    volume: 98000,
    tradeCount: 680,
    liquidity: 27000,
    status: 'open',
    closingTime: new Date(Date.now() + 60 * 86400000).toISOString(),
    resolutionSource: 'Bangladesh Bank Official Data',
    resolutionRules: 'বাংলাদেশ ব্যাংকের ওয়েবসাইটে প্রকাশিত মাসিক স্ট্যাটিস্টিক্যাল বুলেটিনের তথ্যানুযায়ী।',
    priceHistory: generateSeedHistory(0.39),
    orderBook: generateOrderBook(0.39),
    recentTrades: [
      { id: 'T-11', type: 'NO', price: 0.61, amount: 500, time: '15 mins ago', buyer: 'EconObserver' },
    ],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    totalYesPool: 38220,
    totalNoPool: 59780,
  },
  {
    id: 'MKT-POL-006',
    titleBn: 'যুক্তরাজ্য কি আগামী নির্বাচনে ইউরোপীয় ইউনিয়নের সাথে নতুন বাণিজ্য চুক্তি চূড়ান্ত করবে?',
    titleEn: 'Will the UK finalize a major new trade treaty with the EU this term?',
    descriptionBn: 'যুক্তরাজ্য ও ইউরোপীয় কমিশনের মধ্যে দ্বিপাক্ষিক সমন্বিত চুক্তি স্বাক্ষরিত হলে YES হিসেবে নিষ্পত্তি হবে।',
    descriptionEn: 'Resolves to YES if a comprehensive trade accord is formally signed by UK & EU officials.',
    category: 'politics',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80',
    yesPrice: 0.51,
    noPrice: 0.49,
    volume: 112000,
    tradeCount: 820,
    liquidity: 31000,
    status: 'open',
    closingTime: new Date(Date.now() + 50 * 86400000).toISOString(),
    resolutionSource: 'BBC News / Reuters Official Reports',
    resolutionRules: 'উভয় পক্ষের স্বাক্ষর ও সরকারি বিবৃতি বাধ্যতামূলক।',
    priceHistory: generateSeedHistory(0.51),
    orderBook: generateOrderBook(0.51),
    recentTrades: [
      { id: 'T-12', type: 'YES', price: 0.51, amount: 200, time: '20 mins ago', buyer: 'GlobalGov' },
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    totalYesPool: 57120,
    totalNoPool: 54880,
  }
];

const SEED_DEPOSITS: DepositRequest[] = [
  {
    id: 'DEP-8901',
    userId: 'USR-TRADER-201',
    userName: 'Shahanur Islam (Pro Trader)',
    userEmail: 'mdshahanurislam397@gmail.com',
    amount: 5000,
    method: 'bkash',
    senderNumber: '01812345678',
    transactionId: 'BK9A87X41Q',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    reviewedAt: new Date(Date.now() - 47 * 3600000).toISOString(),
    reviewedBy: 'USR-ADMIN-100',
  },
  {
    id: 'DEP-8902',
    userId: 'USR-DEMO-305',
    userName: 'Tanvir Hossain',
    userEmail: 'tanvir.ahmed@example.com',
    amount: 3000,
    method: 'nagad',
    senderNumber: '01987654321',
    transactionId: 'NG77P291KM',
    status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  }
];

const SEED_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'WTH-4301',
    userId: 'USR-DEMO-305',
    userName: 'Tanvir Hossain',
    userEmail: 'tanvir.ahmed@example.com',
    amount: 1000,
    method: 'bkash',
    accountDetails: '01987654321 (Personal)',
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  }
];

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-001',
    userId: 'USR-TRADER-201',
    userName: 'Shahanur Islam (Pro Trader)',
    type: 'deposit',
    amount: 5000,
    fee: 0,
    balanceAfter: 15400,
    status: 'completed',
    referenceId: 'DEP-8901',
    descriptionBn: 'বিকাশ ডিপোজিট সফল (TrxID: BK9A87X41Q)',
    descriptionEn: 'bKash Deposit Approved (TrxID: BK9A87X41Q)',
    timestamp: new Date(Date.now() - 47 * 3600000).toISOString(),
  },
  {
    id: 'TXN-002',
    userId: 'USR-TRADER-201',
    userName: 'Shahanur Islam (Pro Trader)',
    type: 'trade_buy',
    amount: 1200,
    fee: 18,
    balanceAfter: 14182,
    status: 'completed',
    referenceId: 'MKT-CRIC-001',
    descriptionBn: 'মার্কেট শেয়ার ক্রয়: বাংলাদেশ বনাম চ্যাম্পিয়ন্স ট্রফি (YES)',
    descriptionEn: 'Bought YES contracts in ICC Champions Trophy',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
  }
];

const SEED_POSITIONS: Position[] = [
  {
    id: 'POS-001',
    userId: 'USR-TRADER-201',
    marketId: 'MKT-CRIC-001',
    outcome: 'YES',
    shares: 200,
    avgPrice: 0.60,
    totalInvested: 120,
    currentValue: 128,
    unrealizedPnl: 8,
    realizedPnl: 0,
    isSettled: false,
    status: 'active',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading DB file, reinitializing default seed:', err);
    }

    const initialDb: DatabaseSchema = {
      users: SEED_USERS,
      markets: SEED_MARKETS,
      orders: [],
      positions: SEED_POSITIONS,
      transactions: SEED_TRANSACTIONS,
      deposits: SEED_DEPOSITS,
      withdrawals: SEED_WITHDRAWALS,
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      auditLogs: [
        {
          id: 'LOG-1',
          adminId: 'USR-ADMIN-100',
          action: 'SYSTEM_BOOT',
          details: 'NexusMarket Database initialized with production seed data.',
          timestamp: new Date().toISOString(),
        }
      ],
    };

    this.save(initialDb);
    return initialDb;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB file:', err);
    }
  }

  // Generic access
  public getSnapshot(): DatabaseSchema {
    return this.data;
  }

  public persist() {
    this.save();
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public saveUser(user: User): User {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.persist();
    return user;
  }

  // Markets
  public getMarkets(): Market[] {
    return this.data.markets;
  }

  public getMarketById(id: string): Market | undefined {
    return this.data.markets.find(m => m.id === id);
  }

  public saveMarket(market: Market): Market {
    const idx = this.data.markets.findIndex(m => m.id === market.id);
    if (idx >= 0) {
      this.data.markets[idx] = market;
    } else {
      this.data.markets.unshift(market);
    }
    this.persist();
    return market;
  }

  // Orders
  public getOrders(): Order[] {
    return this.data.orders;
  }

  public getUserOrders(userId: string): Order[] {
    return this.data.orders.filter(o => o.userId === userId);
  }

  public saveOrder(order: Order): Order {
    const idx = this.data.orders.findIndex(o => o.id === order.id);
    if (idx >= 0) {
      this.data.orders[idx] = order;
    } else {
      this.data.orders.unshift(order);
    }
    this.persist();
    return order;
  }

  // Positions
  public getPositions(userId?: string): Position[] {
    if (userId) {
      return this.data.positions.filter(p => p.userId === userId);
    }
    return this.data.positions;
  }

  public savePosition(pos: Position): Position {
    const idx = this.data.positions.findIndex(p => p.id === pos.id);
    if (idx >= 0) {
      this.data.positions[idx] = pos;
    } else {
      this.data.positions.unshift(pos);
    }
    this.persist();
    return pos;
  }

  // Transactions
  public getTransactions(userId?: string): Transaction[] {
    if (userId) {
      return this.data.transactions.filter(t => t.userId === userId);
    }
    return this.data.transactions;
  }

  public addTransaction(txn: Transaction): Transaction {
    this.data.transactions.unshift(txn);
    this.persist();
    return txn;
  }

  // Deposits
  public getDeposits(): DepositRequest[] {
    return this.data.deposits;
  }

  public saveDeposit(deposit: DepositRequest): DepositRequest {
    const idx = this.data.deposits.findIndex(d => d.id === deposit.id);
    if (idx >= 0) {
      this.data.deposits[idx] = deposit;
    } else {
      this.data.deposits.unshift(deposit);
    }
    this.persist();
    return deposit;
  }

  // Withdrawals
  public getWithdrawals(): WithdrawalRequest[] {
    return this.data.withdrawals;
  }

  public saveWithdrawal(wth: WithdrawalRequest): WithdrawalRequest {
    const idx = this.data.withdrawals.findIndex(w => w.id === wth.id);
    if (idx >= 0) {
      this.data.withdrawals[idx] = wth;
    } else {
      this.data.withdrawals.unshift(wth);
    }
    this.persist();
    return wth;
  }

  // Categories
  public getCategories(): CategoryInfo[] {
    return this.data.categories;
  }

  public saveCategories(categories: CategoryInfo[]) {
    this.data.categories = categories;
    this.persist();
  }

  // Settings
  public getSettings(): PlatformSettings {
    return this.data.settings;
  }

  public saveSettings(settings: PlatformSettings) {
    this.data.settings = settings;
    this.persist();
  }

  // Audit
  public addAuditLog(adminId: string, action: string, details: string) {
    this.data.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      adminId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
    this.persist();
  }

  public getAuditLogs() {
    return this.data.auditLogs;
  }

  // Leaderboard generator
  public getLeaderboard(period: string = 'all-time'): LeaderboardEntry[] {
    const sorted = [...this.data.users]
      .filter(u => u.status === 'active')
      .sort((a, b) => b.wallet.netProfit - a.wallet.netProfit);

    return sorted.map((user, idx) => ({
      rank: idx + 1,
      userId: user.id,
      displayName: user.displayName,
      avatar: user.avatar,
      verifiedNetProfit: user.wallet.netProfit,
      tradeCount: user.stats.totalTrades,
      winRate: user.stats.winRate,
      isProfilePrivate: user.isProfilePrivate,
    }));
  }

  // Reset to default seed
  public resetDemo() {
    this.data = {
      users: SEED_USERS,
      markets: SEED_MARKETS,
      orders: [],
      positions: SEED_POSITIONS,
      transactions: SEED_TRANSACTIONS,
      deposits: SEED_DEPOSITS,
      withdrawals: SEED_WITHDRAWALS,
      categories: DEFAULT_CATEGORIES,
      settings: DEFAULT_SETTINGS,
      auditLogs: [{
        id: `LOG-${Date.now()}`,
        adminId: 'USR-ADMIN-100',
        action: 'DEMO_RESET',
        details: 'NexusMarket restored to demo state.',
        timestamp: new Date().toISOString(),
      }],
    };
    this.save();
    return true;
  }
}

export const db = new Database();
