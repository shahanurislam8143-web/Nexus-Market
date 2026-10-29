import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./src/server/db.ts";
import { placeOrder, cancelOrder, resolveMarket } from "./src/server/matchingEngine.ts";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3e3;
app.use(express.json());
app.post("/api/auth/login", (req, res) => {
  const { email, displayName, avatar, role = "user" } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  let user = db.getUserByEmail(email);
  if (!user) {
    const id = `USR-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const refCode = (displayName || "NEX").slice(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900);
    user = {
      id,
      email,
      displayName: displayName || email.split("@")[0],
      avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      phone: "",
      role: role === "admin" ? "admin" : "user",
      isVerified: true,
      status: "active",
      wallet: {
        availableBalance: 2e3,
        // Welcome gift demo balance for instant testing
        reservedBalance: 0,
        pendingWithdrawal: 0,
        totalDeposited: 2e3,
        totalWithdrawn: 0,
        totalFeesPaid: 0,
        netProfit: 0
      },
      stats: {
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalVolume: 0
      },
      referralCode: refCode,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.saveUser(user);
    db.addTransaction({
      id: `TXN-WELCOME-${Date.now()}`,
      userId: user.id,
      userName: user.displayName,
      type: "deposit",
      amount: 2e3,
      fee: 0,
      balanceAfter: 2e3,
      status: "completed",
      descriptionBn: "\u0993\u09AF\u09BC\u09C7\u09B2\u0995\u09BE\u09AE \u099F\u09CD\u09B0\u09C7\u09A1\u09BF\u0982 \u09AC\u09CB\u09A8\u09BE\u09B8 \u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F",
      descriptionEn: "Welcome trading bonus credited",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  res.json({ success: true, user });
});
app.get("/api/auth/user/:id", (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});
app.post("/api/auth/profile", (req, res) => {
  const { userId, displayName, avatar, phone, isProfilePrivate } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (displayName) user.displayName = displayName.trim();
  if (avatar) user.avatar = avatar;
  if (phone !== void 0) user.phone = phone.trim();
  if (isProfilePrivate !== void 0) user.isProfilePrivate = isProfilePrivate;
  db.saveUser(user);
  res.json({ success: true, user });
});
app.get("/api/markets", (req, res) => {
  const { category, search, status, sort } = req.query;
  let markets = db.getMarkets();
  if (category && category !== "all") {
    markets = markets.filter((m) => m.category === category);
  }
  if (status && status !== "all") {
    markets = markets.filter((m) => m.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    markets = markets.filter(
      (m) => m.titleBn.toLowerCase().includes(q) || m.titleEn.toLowerCase().includes(q) || m.descriptionBn.toLowerCase().includes(q) || m.descriptionEn.toLowerCase().includes(q)
    );
  }
  if (sort === "volume") {
    markets.sort((a, b) => b.volume - a.volume);
  } else if (sort === "closing_soon") {
    markets.sort((a, b) => new Date(a.closingTime).getTime() - new Date(b.closingTime).getTime());
  } else if (sort === "newest") {
    markets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  res.json(markets);
});
app.get("/api/markets/:id", (req, res) => {
  const market = db.getMarketById(req.params.id);
  if (!market) {
    return res.status(404).json({ error: "Market not found" });
  }
  res.json(market);
});
app.post("/api/markets", (req, res) => {
  const {
    titleBn,
    titleEn,
    descriptionBn,
    descriptionEn,
    category,
    imageUrl,
    closingTime,
    resolutionSource,
    resolutionRules,
    initialYesProb = 0.5
  } = req.body;
  if (!titleBn || !titleEn || !category || !closingTime) {
    return res.status(400).json({ error: "Missing required market fields" });
  }
  const yesPrice = Number(Number(initialYesProb).toFixed(2));
  const noPrice = Number((1 - yesPrice).toFixed(2));
  const newMarket = {
    id: `MKT-${Date.now()}`,
    titleBn,
    titleEn,
    descriptionBn: descriptionBn || titleBn,
    descriptionEn: descriptionEn || titleEn,
    category,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80",
    yesPrice,
    noPrice,
    volume: 0,
    tradeCount: 0,
    liquidity: 5e4,
    status: "open",
    closingTime: new Date(closingTime).toISOString(),
    resolutionSource: resolutionSource || "Official Authorities & Verified Media",
    resolutionRules: resolutionRules || "\u09AE\u09BE\u09B0\u09CD\u0995\u09C7\u099F \u09B8\u09AE\u09BE\u09AA\u09CD\u09A4\u09BF\u09B0 \u09AA\u09B0 \u0985\u09AB\u09BF\u09B8\u09BF\u09AF\u09BC\u09BE\u09B2 \u0998\u09CB\u09B7\u09A3\u09BE\u09B0 \u09AD\u09BF\u09A4\u09CD\u09A4\u09BF\u09A4\u09C7 \u09A8\u09BF\u09B7\u09CD\u09AA\u09A4\u09CD\u09A4\u09BF \u0995\u09B0\u09BE \u09B9\u09AC\u09C7\u0964",
    priceHistory: [
      { timestamp: (/* @__PURE__ */ new Date()).toISOString(), yesPrice, volume: 0 }
    ],
    orderBook: {
      yesBids: [{ price: Number((yesPrice - 0.02).toFixed(2)), amount: 500, total: 250 }],
      yesAsks: [{ price: Number((yesPrice + 0.02).toFixed(2)), amount: 500, total: 250 }],
      noBids: [{ price: Number((noPrice - 0.02).toFixed(2)), amount: 500, total: 250 }],
      noAsks: [{ price: Number((noPrice + 0.02).toFixed(2)), amount: 500, total: 250 }]
    },
    recentTrades: [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalYesPool: 0,
    totalNoPool: 0
  };
  db.saveMarket(newMarket);
  db.addAuditLog("ADMIN", "CREATE_MARKET", `Created market: ${newMarket.titleEn}`);
  res.json({ success: true, market: newMarket });
});
app.post("/api/markets/:id/resolve", (req, res) => {
  const { outcome, adminId = "USR-ADMIN-100" } = req.body;
  if (!outcome || outcome !== "YES" && outcome !== "NO") {
    return res.status(400).json({ error: "Outcome must be YES or NO" });
  }
  const result = resolveMarket(req.params.id, outcome, adminId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});
app.post("/api/markets/:id/status", (req, res) => {
  const { status, adminId = "USR-ADMIN-100" } = req.body;
  const market = db.getMarketById(req.params.id);
  if (!market) {
    return res.status(404).json({ error: "Market not found" });
  }
  market.status = status;
  db.saveMarket(market);
  db.addAuditLog(adminId, "CHANGE_MARKET_STATUS", `Market ${market.id} status changed to ${status}`);
  res.json({ success: true, market });
});
app.post("/api/orders", (req, res) => {
  const { userId, marketId, outcome, type = "market", side = "buy", price, amount } = req.body;
  if (!userId || !marketId || !outcome || !amount) {
    return res.status(400).json({ error: "Missing required trade parameters" });
  }
  const result = placeOrder({
    userId,
    marketId,
    outcome,
    type,
    side,
    price,
    amount: Number(amount)
  });
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});
app.post("/api/orders/:id/cancel", (req, res) => {
  const { userId } = req.body;
  const result = cancelOrder(req.params.id, userId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});
app.get("/api/orders/user/:userId", (req, res) => {
  const orders = db.getUserOrders(req.params.userId);
  res.json(orders);
});
app.get("/api/positions/user/:userId", (req, res) => {
  const positions = db.getPositions(req.params.userId);
  res.json(positions);
});
app.get("/api/wallet/transactions/:userId", (req, res) => {
  const txns = db.getTransactions(req.params.userId);
  res.json(txns);
});
app.post("/api/wallet/deposit", (req, res) => {
  const { userId, amount, method, senderNumber, transactionId } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!amount || amount <= 0 || !method || !transactionId) {
    return res.status(400).json({ error: "Amount, method and transaction ID are required" });
  }
  const settings = db.getSettings();
  if (amount < settings.minDeposit) {
    return res.status(400).json({ error: `Minimum deposit is ${settings.currencySymbol}${settings.minDeposit}` });
  }
  const deposit = {
    id: `DEP-${Math.floor(1e3 + Math.random() * 9e3)}`,
    userId: user.id,
    userName: user.displayName,
    userEmail: user.email,
    amount: Number(amount),
    method,
    senderNumber: senderNumber || "",
    transactionId: transactionId.trim().toUpperCase(),
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.saveDeposit(deposit);
  res.json({ success: true, deposit, message: "\u09A1\u09BF\u09AA\u09CB\u099C\u09BF\u099F \u09B0\u09BF\u0995\u09CB\u09AF\u09BC\u09C7\u09B8\u09CD\u099F \u099C\u09AE\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u09AF\u09BE\u099A\u09BE\u0987 \u09B8\u09BE\u09AA\u09C7\u0995\u09CD\u09B7\u09C7 \u09A6\u09CD\u09B0\u09C1\u09A4 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8\u09C7 \u09AF\u09CB\u0997 \u09B9\u09AC\u09C7\u0964" });
});
app.post("/api/wallet/withdraw", (req, res) => {
  const { userId, amount, method, accountDetails } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const numAmount = Number(amount);
  const settings = db.getSettings();
  if (numAmount < settings.minWithdrawal) {
    return res.status(400).json({ error: `\u09B8\u09B0\u09CD\u09AC\u09A8\u09BF\u09AE\u09CD\u09A8 \u0989\u09A4\u09CD\u09A4\u09CB\u09B2\u09A8\u09C7\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 ${settings.currencySymbol}${settings.minWithdrawal}` });
  }
  if (numAmount > user.wallet.availableBalance) {
    return res.status(400).json({ error: "\u0989\u09A4\u09CD\u09A4\u09CB\u09B2\u09A8\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09AA\u09B0\u09CD\u09AF\u09BE\u09AA\u09CD\u09A4 \u0989\u09AA\u09B2\u09AC\u09CD\u09A7 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 \u09A8\u09C7\u0987" });
  }
  user.wallet.availableBalance -= numAmount;
  user.wallet.pendingWithdrawal += numAmount;
  db.saveUser(user);
  const withdrawal = {
    id: `WTH-${Math.floor(1e3 + Math.random() * 9e3)}`,
    userId: user.id,
    userName: user.displayName,
    userEmail: user.email,
    amount: numAmount,
    method,
    accountDetails: accountDetails || "",
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.saveWithdrawal(withdrawal);
  db.addTransaction({
    id: `TXN-WREQ-${Date.now()}`,
    userId: user.id,
    userName: user.displayName,
    type: "withdrawal",
    amount: numAmount,
    fee: 0,
    balanceAfter: Number(user.wallet.availableBalance.toFixed(2)),
    status: "pending",
    referenceId: withdrawal.id,
    descriptionBn: `\u0989\u09A4\u09CD\u09A4\u09CB\u09B2\u09A8 \u0985\u09A8\u09C1\u09B0\u09CB\u09A7 \u09AA\u09CD\u09B0\u0995\u09CD\u09B0\u09BF\u09AF\u09BC\u09BE\u09A7\u09C0\u09A8 (${method.toUpperCase()}: \u09F3${numAmount})`,
    descriptionEn: `Withdrawal request pending (${method.toUpperCase()}: \u09F3${numAmount})`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({ success: true, withdrawal, message: "\u0989\u09A4\u09CD\u09A4\u09CB\u09B2\u09A8 \u0985\u09A8\u09C1\u09B0\u09CB\u09A7 \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u0997\u09C3\u09B9\u09C0\u09A4 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7" });
});
app.get("/api/leaderboard", (req, res) => {
  const period = req.query.period || "all-time";
  const leaderboard = db.getLeaderboard(period);
  res.json(leaderboard);
});
app.get("/api/referral/:userId", (req, res) => {
  const user = db.getUserById(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const allUsers = db.getUsers();
  const referred = allUsers.filter((u) => u.referredBy === user.referralCode);
  res.json({
    referralCode: user.referralCode,
    totalReferrals: referred.length,
    successfulReferrals: referred.filter((u) => u.stats.totalTrades > 0).length,
    pendingReferrals: referred.filter((u) => u.stats.totalTrades === 0).length,
    totalEarned: referred.length * 50,
    history: referred.map((u) => ({
      userId: u.id,
      userName: u.displayName,
      date: u.createdAt,
      bonus: 50,
      status: u.stats.totalTrades > 0 ? "rewarded" : "pending"
    }))
  });
});
app.get("/api/categories", (_req, res) => {
  res.json(db.getCategories());
});
app.post("/api/categories", (req, res) => {
  const { categories } = req.body;
  if (Array.isArray(categories)) {
    db.saveCategories(categories);
    return res.json({ success: true, categories });
  }
  res.status(400).json({ error: "Invalid categories payload" });
});
app.get("/api/admin/dashboard", (_req, res) => {
  const users = db.getUsers();
  const markets = db.getMarkets();
  const orders = db.getOrders();
  const deposits = db.getDeposits();
  const withdrawals = db.getWithdrawals();
  const txns = db.getTransactions();
  const totalVolume = markets.reduce((acc, m) => acc + m.volume, 0);
  const totalFees = users.reduce((acc, u) => acc + u.wallet.totalFeesPaid, 0);
  const pendingDeposits = deposits.filter((d) => d.status === "pending");
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  res.json({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    bannedUsers: users.filter((u) => u.status === "banned").length,
    totalMarkets: markets.length,
    openMarkets: markets.filter((m) => m.status === "open").length,
    resolvedMarkets: markets.filter((m) => m.status === "resolved").length,
    totalOrders: orders.length,
    totalTradingVolume: totalVolume,
    pendingDepositsCount: pendingDeposits.length,
    pendingDepositsAmount: pendingDeposits.reduce((acc, d) => acc + d.amount, 0),
    pendingWithdrawalsCount: pendingWithdrawals.length,
    pendingWithdrawalsAmount: pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0),
    platformFeesRevenue: totalFees,
    recentTransactions: txns.slice(0, 10),
    systemAlerts: pendingDeposits.length + pendingWithdrawals.length
  });
});
app.get("/api/admin/users", (_req, res) => {
  res.json(db.getUsers());
});
app.post("/api/admin/users/:id/ban", (req, res) => {
  const { reason = "Terms violation", adminId = "USR-ADMIN-100" } = req.body;
  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  user.status = user.status === "banned" ? "active" : "banned";
  db.saveUser(user);
  db.addAuditLog(adminId, user.status === "banned" ? "BAN_USER" : "UNBAN_USER", `User ${user.id} status set to ${user.status}. Reason: ${reason}`);
  res.json({ success: true, user });
});
app.post("/api/admin/wallet-adjustment", (req, res) => {
  const { userId, amount, type, reason, adminId = "USR-ADMIN-100" } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!amount || Number(amount) <= 0 || !reason) {
    return res.status(400).json({ error: "Amount and reason are mandatory" });
  }
  const num = Number(amount);
  if (type === "credit") {
    user.wallet.availableBalance += num;
  } else if (type === "debit") {
    if (num > user.wallet.availableBalance) {
      return res.status(400).json({ error: "Cannot debit more than available balance" });
    }
    user.wallet.availableBalance -= num;
  } else {
    return res.status(400).json({ error: "Type must be credit or debit" });
  }
  db.saveUser(user);
  const txn = db.addTransaction({
    id: `TXN-ADJ-${Date.now()}`,
    userId: user.id,
    userName: user.displayName,
    type: "wallet_adjustment",
    amount: num,
    fee: 0,
    balanceAfter: Number(user.wallet.availableBalance.toFixed(2)),
    status: "completed",
    descriptionBn: `\u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 \u09B8\u09AE\u09A8\u09CD\u09AC\u09AF\u09BC (${type === "credit" ? "\u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F" : "\u09A1\u09C7\u09AC\u09BF\u099F"}): ${reason}`,
    descriptionEn: `Admin Wallet Adjustment (${type}): ${reason}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  db.addAuditLog(adminId, "WALLET_ADJUSTMENT", `${type} \u09F3${num} to ${user.id}. Reason: ${reason}`);
  res.json({ success: true, user, txn });
});
app.get("/api/admin/deposits", (_req, res) => {
  res.json(db.getDeposits());
});
app.post("/api/admin/deposits/:id/action", (req, res) => {
  const { action, reason, adminId = "USR-ADMIN-100" } = req.body;
  const deposits = db.getDeposits();
  const dep = deposits.find((d) => d.id === req.params.id);
  if (!dep) {
    return res.status(404).json({ error: "Deposit request not found" });
  }
  if (dep.status !== "pending") {
    return res.status(400).json({ error: `Deposit is already ${dep.status}` });
  }
  const user = db.getUserById(dep.userId);
  if (!user) {
    return res.status(404).json({ error: "Associated user not found" });
  }
  if (action === "confirm") {
    dep.status = "confirmed";
    dep.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
    dep.reviewedBy = adminId;
    db.saveDeposit(dep);
    user.wallet.availableBalance += dep.amount;
    user.wallet.totalDeposited += dep.amount;
    db.saveUser(user);
    db.addTransaction({
      id: `TXN-DEP-${Date.now()}`,
      userId: user.id,
      userName: user.displayName,
      type: "deposit",
      amount: dep.amount,
      fee: 0,
      balanceAfter: Number(user.wallet.availableBalance.toFixed(2)),
      status: "completed",
      referenceId: dep.id,
      descriptionBn: `\u09A1\u09BF\u09AA\u09CB\u099C\u09BF\u099F \u0985\u09CD\u09AF\u09BE\u09AA\u09CD\u09B0\u09C1\u09AD\u09A1 (${dep.method.toUpperCase()} TrxID: ${dep.transactionId})`,
      descriptionEn: `Deposit Approved (${dep.method.toUpperCase()} TrxID: ${dep.transactionId})`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    db.addAuditLog(adminId, "CONFIRM_DEPOSIT", `Approved deposit ${dep.id} for \u09F3${dep.amount}`);
    return res.json({ success: true, deposit: dep, message: "\u09A1\u09BF\u09AA\u09CB\u099C\u09BF\u099F \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u0985\u09CD\u09AF\u09BE\u09AA\u09CD\u09B0\u09C1\u09AD \u09B9\u09AF\u09BC\u09C7\u099B\u09C7" });
  } else if (action === "reject") {
    dep.status = "rejected";
    dep.rejectionReason = reason || "Payment could not be verified";
    dep.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
    dep.reviewedBy = adminId;
    db.saveDeposit(dep);
    db.addAuditLog(adminId, "REJECT_DEPOSIT", `Rejected deposit ${dep.id}. Reason: ${reason}`);
    return res.json({ success: true, deposit: dep, message: "\u09A1\u09BF\u09AA\u09CB\u099C\u09BF\u099F \u09AC\u09BE\u09A4\u09BF\u09B2 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7" });
  }
  res.status(400).json({ error: "Invalid action" });
});
app.get("/api/admin/withdrawals", (_req, res) => {
  res.json(db.getWithdrawals());
});
app.post("/api/admin/withdrawals/:id/action", (req, res) => {
  const { action, reason, adminId = "USR-ADMIN-100" } = req.body;
  const withdrawals = db.getWithdrawals();
  const wth = withdrawals.find((w) => w.id === req.params.id);
  if (!wth) {
    return res.status(404).json({ error: "Withdrawal not found" });
  }
  const user = db.getUserById(wth.userId);
  if (!user) {
    return res.status(404).json({ error: "Associated user not found" });
  }
  if (action === "processing") {
    wth.status = "processing";
    db.saveWithdrawal(wth);
    db.addAuditLog(adminId, "PROCESSING_WITHDRAWAL", `Withdrawal ${wth.id} set to processing`);
    return res.json({ success: true, withdrawal: wth });
  } else if (action === "pay") {
    wth.status = "paid";
    wth.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
    wth.reviewedBy = adminId;
    db.saveWithdrawal(wth);
    user.wallet.pendingWithdrawal = Math.max(0, user.wallet.pendingWithdrawal - wth.amount);
    user.wallet.totalWithdrawn += wth.amount;
    db.saveUser(user);
    db.addTransaction({
      id: `TXN-WTH-PAID-${Date.now()}`,
      userId: user.id,
      userName: user.displayName,
      type: "withdrawal",
      amount: wth.amount,
      fee: 0,
      balanceAfter: Number(user.wallet.availableBalance.toFixed(2)),
      status: "completed",
      referenceId: wth.id,
      descriptionBn: `\u0989\u09A4\u09CD\u09A4\u09CB\u09B2\u09A8 \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 (${wth.method.toUpperCase()} \u098F\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7 \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u09AF\u09BC\u09C7\u099B\u09C7)`,
      descriptionEn: `Withdrawal Paid successfully to ${wth.method.toUpperCase()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    db.addAuditLog(adminId, "PAY_WITHDRAWAL", `Paid withdrawal ${wth.id} of \u09F3${wth.amount}`);
    return res.json({ success: true, withdrawal: wth, message: "\u0989\u09A4\u09CD\u09A4\u09CB\u09B2\u09A8 \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8 \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7" });
  } else if (action === "reject") {
    wth.status = "rejected";
    wth.rejectionReason = reason || "Verification failed";
    wth.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
    wth.reviewedBy = adminId;
    db.saveWithdrawal(wth);
    user.wallet.pendingWithdrawal = Math.max(0, user.wallet.pendingWithdrawal - wth.amount);
    user.wallet.availableBalance += wth.amount;
    db.saveUser(user);
    db.addTransaction({
      id: `TXN-WTH-REJ-${Date.now()}`,
      userId: user.id,
      userName: user.displayName,
      type: "withdrawal",
      amount: wth.amount,
      fee: 0,
      balanceAfter: Number(user.wallet.availableBalance.toFixed(2)),
      status: "failed",
      referenceId: wth.id,
      descriptionBn: `\u0989\u09A4\u09CD\u09A4\u09CB\u09B2\u09A8 \u09AC\u09BE\u09A4\u09BF\u09B2 \u0993 \u09B0\u09BF\u09AB\u09BE\u09A8\u09CD\u09A1: ${reason || "\u09A4\u09A5\u09CD\u09AF \u0985\u09AE\u09BF\u09B2"}`,
      descriptionEn: `Withdrawal rejected and refunded: ${reason || "Mismatch"}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    db.addAuditLog(adminId, "REJECT_WITHDRAWAL", `Rejected withdrawal ${wth.id}. Refunded \u09F3${wth.amount}`);
    return res.json({ success: true, withdrawal: wth, message: "\u0989\u09A4\u09CD\u09A4\u09CB\u09B2\u09A8 \u09AC\u09BE\u09A4\u09BF\u09B2 \u098F\u09AC\u0982 \u0985\u09B0\u09CD\u09A5 \u09AB\u09C7\u09B0\u09A4 \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7" });
  }
  res.status(400).json({ error: "Invalid action" });
});
app.get("/api/admin/settings", (_req, res) => {
  res.json(db.getSettings());
});
app.post("/api/admin/settings", (req, res) => {
  const current = db.getSettings();
  const updated = { ...current, ...req.body };
  db.saveSettings(updated);
  db.addAuditLog("ADMIN", "UPDATE_SETTINGS", "Platform settings updated");
  res.json({ success: true, settings: updated });
});
app.post("/api/system/reset-demo", (_req, res) => {
  db.resetDemo();
  res.json({ success: true, message: "NexusMarket restored to demo state" });
});
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NexusMarket fullstack server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
