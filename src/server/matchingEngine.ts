import { db } from './db.ts';
import { 
  Order, 
  Position, 
  Transaction, 
  OrderOutcome, 
  OrderType, 
  OrderSide 
} from '../types/index.ts';

export interface PlaceOrderParams {
  userId: string;
  marketId: string;
  outcome: OrderOutcome;
  type: OrderType;
  side: OrderSide;
  price?: number; // 0.01 to 0.99
  amount: number; // in BDT / Currency
}

export function placeOrder(params: PlaceOrderParams): { success: boolean; order?: Order; message: string } {
  const user = db.getUserById(params.userId);
  if (!user) {
    return { success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি (User not found)' };
  }
  if (user.status === 'banned') {
    return { success: false, message: 'অ্যাকাউন্ট ব্যান করা হয়েছে। আপনি ট্রেড করতে পারবেন না (Account is banned)' };
  }

  const market = db.getMarketById(params.marketId);
  if (!market) {
    return { success: false, message: 'মার্কেট খুঁজে পাওয়া যায়নি (Market not found)' };
  }
  if (market.status !== 'open') {
    return { success: false, message: `মার্কেটটি বন্ধ রয়েছে: ${market.status} (Market is not open for trading)` };
  }

  const settings = db.getSettings();
  const feePercent = settings.tradingFeePercent / 100;

  // Determine execution price
  const executionPrice = params.price && params.type === 'limit' 
    ? Math.min(0.99, Math.max(0.01, params.price)) 
    : (params.outcome === 'YES' ? market.yesPrice : market.noPrice);

  const totalCost = params.amount;
  const fee = Number((totalCost * feePercent).toFixed(2));
  const netInvestment = totalCost - fee;

  if (totalCost > user.wallet.availableBalance) {
    return { 
      success: false, 
      message: `পর্যাপ্ত ব্যালেন্স নেই। আপনার উপলব্ধ ব্যালেন্স ${settings.currencySymbol}${user.wallet.availableBalance.toFixed(2)} (Insufficient available balance)` 
    };
  }

  // Calculate shares: netInvestment / executionPrice
  const shares = Math.floor(netInvestment / executionPrice);
  if (shares <= 0) {
    return { 
      success: false, 
      message: 'ট্রেডের পরিমাণ অত্যন্ত কম (Trade amount too low to purchase at least 1 contract)' 
    };
  }

  const actualSpent = Number((shares * executionPrice).toFixed(2));
  const totalDeduction = Number((actualSpent + fee).toFixed(2));

  // Deduct user balance
  user.wallet.availableBalance -= totalDeduction;
  user.wallet.totalFeesPaid += fee;
  user.stats.totalTrades += 1;
  user.stats.totalVolume += totalDeduction;

  // Create Order
  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newOrder: Order = {
    id: orderId,
    userId: user.id,
    userName: user.displayName,
    marketId: market.id,
    marketTitle: market.titleEn,
    outcome: params.outcome,
    type: params.type,
    side: params.side,
    price: executionPrice,
    quantity: shares,
    filledQuantity: shares,
    totalCost: totalDeduction,
    fee,
    status: 'filled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.saveOrder(newOrder);

  // Update or Create Position
  const existingPositions = db.getPositions(user.id);
  const posIndex = existingPositions.findIndex(
    p => p.marketId === market.id && p.outcome === params.outcome && p.status === 'active'
  );

  let updatedPosition: Position;
  if (posIndex >= 0) {
    const existing = existingPositions[posIndex];
    const totalShares = existing.shares + shares;
    const combinedInvestment = existing.totalInvested + actualSpent;
    const avgPrice = Number((combinedInvestment / totalShares).toFixed(4));
    const currentProb = params.outcome === 'YES' ? market.yesPrice : market.noPrice;
    const currentValue = Number((totalShares * currentProb).toFixed(2));
    const unrealizedPnl = Number((currentValue - combinedInvestment).toFixed(2));

    updatedPosition = {
      ...existing,
      shares: totalShares,
      avgPrice,
      totalInvested: combinedInvestment,
      currentValue,
      unrealizedPnl,
    };
  } else {
    const currentProb = params.outcome === 'YES' ? market.yesPrice : market.noPrice;
    const currentValue = Number((shares * currentProb).toFixed(2));
    const unrealizedPnl = Number((currentValue - actualSpent).toFixed(2));

    updatedPosition = {
      id: `POS-${Date.now()}`,
      userId: user.id,
      marketId: market.id,
      outcome: params.outcome,
      shares,
      avgPrice: executionPrice,
      totalInvested: actualSpent,
      currentValue,
      unrealizedPnl,
      realizedPnl: 0,
      isSettled: false,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  }
  db.savePosition(updatedPosition);

  // Update Market Volume & Price Dynamic
  // Shift probability based on liquidity & size
  const priceImpact = Math.min(0.04, Math.max(0.005, (actualSpent / (market.liquidity || 50000)) * 0.5));
  let newYesPrice = market.yesPrice;
  if (params.outcome === 'YES') {
    newYesPrice = Math.min(0.98, Math.max(0.02, market.yesPrice + priceImpact));
    market.totalYesPool += actualSpent;
  } else {
    newYesPrice = Math.min(0.98, Math.max(0.02, market.yesPrice - priceImpact));
    market.totalNoPool += actualSpent;
  }
  newYesPrice = Number(newYesPrice.toFixed(2));
  const newNoPrice = Number((1 - newYesPrice).toFixed(2));

  market.yesPrice = newYesPrice;
  market.noPrice = newNoPrice;
  market.volume += actualSpent;
  market.tradeCount += 1;

  // Add Price History Point
  market.priceHistory.push({
    timestamp: new Date().toISOString(),
    yesPrice: newYesPrice,
    volume: actualSpent,
  });
  if (market.priceHistory.length > 50) {
    market.priceHistory.shift();
  }

  // Add Recent Trade
  market.recentTrades.unshift({
    id: `TRD-${Date.now()}`,
    type: params.outcome,
    price: executionPrice,
    amount: shares,
    time: 'Just now',
    buyer: user.displayName.split(' ')[0] + ' ' + (user.displayName.split(' ')[1]?.[0] || '') + '.',
  });
  if (market.recentTrades.length > 20) {
    market.recentTrades.pop();
  }

  db.saveMarket(market);

  // Add Transaction Entry
  const txn: Transaction = {
    id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.displayName,
    type: 'trade_buy',
    amount: totalDeduction,
    fee,
    balanceAfter: Number(user.wallet.availableBalance.toFixed(2)),
    status: 'completed',
    referenceId: newOrder.id,
    descriptionBn: `মার্কেট ট্রেড: ${market.titleBn.slice(0, 32)}... (${params.outcome} ${shares} শেয়ার)`,
    descriptionEn: `Bought ${shares} ${params.outcome} shares at ${executionPrice * 100}% on ${market.titleEn.slice(0, 32)}...`,
    timestamp: new Date().toISOString(),
  };
  db.addTransaction(txn);
  db.saveUser(user);

  return { success: true, order: newOrder, message: 'ট্রেড সফলভাবে সম্পন্ন হয়েছে (Order executed successfully)' };
}

export function cancelOrder(orderId: string, userId: string): { success: boolean; message: string } {
  const orders = db.getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    return { success: false, message: 'অর্ডার পাওয়া যায়নি (Order not found)' };
  }

  const user = db.getUserById(userId);
  if (!user) {
    return { success: false, message: 'ইউজার পাওয়া যায়নি' };
  }

  if (order.userId !== userId && user.role !== 'admin') {
    return { success: false, message: 'অননুমোদিত অনুরোধ (Unauthorized to cancel this order)' };
  }

  if (order.status !== 'open' && order.status !== 'partially_filled') {
    return { success: false, message: `এই অর্ডারটি বাতিলযোগ্য নয় (Order is already ${order.status})` };
  }

  const settings = db.getSettings();
  const unfulfilledQty = order.quantity - order.filledQuantity;
  const refundAmount = unfulfilledQty * order.price;
  const cancelFee = settings.cancellationFee || 0;
  const netRefund = Math.max(0, refundAmount - cancelFee);

  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  db.saveOrder(order);

  // Refund reserved balance
  user.wallet.reservedBalance = Math.max(0, user.wallet.reservedBalance - refundAmount);
  user.wallet.availableBalance += netRefund;
  db.saveUser(user);

  // Ledger entry
  const txn: Transaction = {
    id: `TXN-CNL-${Date.now()}`,
    userId: user.id,
    userName: user.displayName,
    type: 'trade_cancel',
    amount: netRefund,
    fee: cancelFee,
    balanceAfter: Number(user.wallet.availableBalance.toFixed(2)),
    status: 'completed',
    referenceId: order.id,
    descriptionBn: `অর্ডার বাতিল রিফান্ড (অর্ডার #${order.id})`,
    descriptionEn: `Order cancellation refund for order #${order.id}`,
    timestamp: new Date().toISOString(),
  };
  db.addTransaction(txn);

  return { success: true, message: 'অর্ডার সফলভাবে বাতিল করা হয়েছে এবং ব্যালেন্স ফেরত দেওয়া হয়েছে' };
}

export interface ResolutionResult {
  success: boolean;
  message: string;
  totalWinningPositions: number;
  totalPayout: number;
  totalLosingPositions: number;
}

export function resolveMarket(marketId: string, outcome: 'YES' | 'NO', adminId: string): ResolutionResult {
  const market = db.getMarketById(marketId);
  if (!market) {
    return { success: false, message: 'মার্কেট পাওয়া যায়নি', totalWinningPositions: 0, totalPayout: 0, totalLosingPositions: 0 };
  }

  if (market.status === 'resolved') {
    return { 
      success: false, 
      message: 'এই মার্কেটটি ইতিমধ্যে নিষ্পত্তি (Resolved) করা হয়েছে। ডুপ্লিকেট সেটেলমেন্ট প্রতিরোধ করা হয়েছে (Market is already resolved)', 
      totalWinningPositions: 0, 
      totalPayout: 0, 
      totalLosingPositions: 0 
    };
  }

  const now = new Date().toISOString();
  market.status = 'resolved';
  market.outcome = outcome;
  market.resolvedAt = now;
  market.resolvedBy = adminId;
  market.yesPrice = outcome === 'YES' ? 1.0 : 0.0;
  market.noPrice = outcome === 'NO' ? 1.0 : 0.0;
  db.saveMarket(market);

  // Settle all active positions for this market
  const allPositions = db.getPositions();
  const marketPositions = allPositions.filter(p => p.marketId === marketId && p.status === 'active');

  let totalWinningPositions = 0;
  let totalPayout = 0;
  let totalLosingPositions = 0;

  for (const pos of marketPositions) {
    const user = db.getUserById(pos.userId);
    if (!user) continue;

    if (pos.outcome === outcome) {
      // WINNER: Each share pays 1.00 unit
      const payout = pos.shares * 1.0;
      const profit = payout - pos.totalInvested;

      user.wallet.availableBalance += payout;
      user.wallet.netProfit += profit;
      user.stats.wins += 1;
      user.stats.winRate = Number(((user.stats.wins / (user.stats.wins + user.stats.losses || 1)) * 100).toFixed(1));

      pos.status = 'settled';
      pos.isSettled = true;
      pos.settlementPayout = payout;
      pos.realizedPnl = profit;
      pos.currentValue = payout;
      pos.unrealizedPnl = 0;

      // Add Ledger transaction
      const txn: Transaction = {
        id: `TXN-SETTLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: user.id,
        userName: user.displayName,
        type: 'settlement_credit',
        amount: payout,
        fee: 0,
        balanceAfter: Number(user.wallet.availableBalance.toFixed(2)),
        status: 'completed',
        referenceId: market.id,
        descriptionBn: `মার্কেট জয়লাভ! পেআউট ক্রেডিট: ${market.titleBn.slice(0, 30)}... (+৳${payout.toFixed(2)})`,
        descriptionEn: `Settlement Payout Won: ${market.titleEn.slice(0, 30)}... (+৳${payout.toFixed(2)})`,
        timestamp: now,
      };
      db.addTransaction(txn);
      db.saveUser(user);
      db.savePosition(pos);

      totalWinningPositions++;
      totalPayout += payout;
    } else {
      // LOSER
      const loss = pos.totalInvested;
      user.wallet.netProfit -= loss;
      user.stats.losses += 1;
      user.stats.winRate = Number(((user.stats.wins / (user.stats.wins + user.stats.losses || 1)) * 100).toFixed(1));

      pos.status = 'settled';
      pos.isSettled = true;
      pos.settlementPayout = 0;
      pos.realizedPnl = -loss;
      pos.currentValue = 0;
      pos.unrealizedPnl = 0;

      const txn: Transaction = {
        id: `TXN-SETTLE-L-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: user.id,
        userName: user.displayName,
        type: 'settlement_debit',
        amount: 0,
        fee: 0,
        balanceAfter: Number(user.wallet.availableBalance.toFixed(2)),
        status: 'completed',
        referenceId: market.id,
        descriptionBn: `মার্কেট সমাপ্তি: পূর্বাভাস সফল হয়নি (${market.titleBn.slice(0, 30)}...)`,
        descriptionEn: `Market Closed: Outcome did not match your position (${market.titleEn.slice(0, 30)}...)`,
        timestamp: now,
      };
      db.addTransaction(txn);
      db.saveUser(user);
      db.savePosition(pos);

      totalLosingPositions++;
    }
  }

  // Cancel and refund any remaining open orders on this market
  const openOrders = db.getOrders().filter(o => o.marketId === marketId && (o.status === 'open' || o.status === 'partially_filled'));
  for (const o of openOrders) {
    cancelOrder(o.id, o.userId);
  }

  db.addAuditLog(adminId, 'MARKET_RESOLVE', `Market ${market.id} resolved as ${outcome}. Payout: ৳${totalPayout}`);

  return {
    success: true,
    message: `মার্কেট সফলভাবে মীমাংসা (Resolved) হয়েছে! মোট ${totalWinningPositions} জন বিজয়ীকে ৳${totalPayout.toFixed(2)} পেআউট প্রদান করা হয়েছে।`,
    totalWinningPositions,
    totalPayout,
    totalLosingPositions,
  };
}
