export type Language = 'bn' | 'en';
export type Theme = 'dark' | 'light';

export type MarketCategory = 
  | 'sports' 
  | 'news' 
  | 'crypto' 
  | 'politics' 
  | 'business' 
  | 'technology' 
  | 'entertainment' 
  | 'custom';

export type MarketStatus = 
  | 'open' 
  | 'closed' 
  | 'pending_resolution' 
  | 'resolved' 
  | 'cancelled' 
  | 'disputed';

export interface PricePoint {
  timestamp: string;
  yesPrice: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface MarketOrderBook {
  yesBids: OrderBookEntry[];
  yesAsks: OrderBookEntry[];
  noBids: OrderBookEntry[];
  noAsks: OrderBookEntry[];
}

export interface RecentTrade {
  id: string;
  type: 'YES' | 'NO';
  price: number;
  amount: number;
  time: string;
  buyer: string;
}

export interface Market {
  id: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  category: MarketCategory;
  imageUrl: string;
  yesPrice: number; // 0.01 to 0.99 (represents 1% to 99%)
  noPrice: number;  // 1 - yesPrice
  volume: number;
  tradeCount: number;
  liquidity: number;
  status: MarketStatus;
  outcome?: 'YES' | 'NO' | null;
  closingTime: string; // ISO string
  resolutionSource: string;
  resolutionRules: string;
  priceHistory: PricePoint[];
  orderBook: MarketOrderBook;
  recentTrades: RecentTrade[];
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  totalYesPool: number;
  totalNoPool: number;
}

export interface UserWallet {
  availableBalance: number;
  reservedBalance: number;
  pendingWithdrawal: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalFeesPaid: number;
  netProfit: number;
}

export interface UserStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalVolume: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  phone: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  status: 'active' | 'banned' | 'suspended';
  wallet: UserWallet;
  stats: UserStats;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  isProfilePrivate?: boolean;
}

export type OrderType = 'market' | 'limit';
export type OrderSide = 'buy' | 'sell';
export type OrderOutcome = 'YES' | 'NO';
export type OrderStatus = 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'expired';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  marketId: string;
  marketTitle: string;
  outcome: OrderOutcome;
  type: OrderType;
  side: OrderSide;
  price: number; // e.g. 0.65 (65%)
  quantity: number; // number of shares
  filledQuantity: number;
  totalCost: number;
  fee: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  userId: string;
  marketId: string;
  outcome: OrderOutcome;
  shares: number;
  avgPrice: number;
  totalInvested: number;
  currentValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  isSettled: boolean;
  settlementPayout?: number;
  status: 'active' | 'settled';
  createdAt: string;
}

export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'trade_buy' 
  | 'trade_sell' 
  | 'trade_cancel' 
  | 'fee' 
  | 'settlement_credit' 
  | 'settlement_debit' 
  | 'wallet_adjustment' 
  | 'referral_bonus';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: TransactionType;
  amount: number;
  fee: number;
  balanceAfter: number;
  status: 'completed' | 'pending' | 'rejected' | 'failed';
  referenceId?: string;
  descriptionBn: string;
  descriptionEn: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'crypto';
  senderNumber: string;
  transactionId: string;
  status: 'pending' | 'confirmed' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'crypto';
  accountDetails: string;
  status: 'pending' | 'processing' | 'paid' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface CategoryInfo {
  id: MarketCategory;
  nameBn: string;
  nameEn: string;
  icon: string;
  order: number;
  isActive: boolean;
  descriptionBn: string;
  descriptionEn: string;
}

export interface PlatformSettings {
  tradingFeePercent: number; // e.g. 1.5%
  cancellationFee: number; // e.g. 0
  platformFeePercent: number;
  minDeposit: number;
  minWithdrawal: number;
  currencySymbol: string; // "৳"
  currencyCode: string; // "BDT"
  isMaintenance: boolean;
  announcementBn: string;
  announcementEn: string;
  depositNumbers: {
    bkash: string;
    nagad: string;
    rocket: string;
    bank: string;
    crypto: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatar: string;
  verifiedNetProfit: number;
  tradeCount: number;
  winRate: number;
  isProfilePrivate?: boolean;
}

export interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  history: Array<{
    userId: string;
    userName: string;
    date: string;
    bonus: number;
    status: 'rewarded' | 'pending';
  }>;
}
