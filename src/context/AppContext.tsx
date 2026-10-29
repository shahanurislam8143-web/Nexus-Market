import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  Market, 
  Position, 
  Order, 
  Language, 
  Theme, 
  MarketCategory,
  PlatformSettings,
  Transaction
} from '../types/index.ts';
import { translations } from '../translations/index.ts';
import confetti from 'canvas-confetti';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  user: User | null;
  language: Language;
  theme: Theme;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  t: typeof translations['bn'];
  markets: Market[];
  loadingMarkets: boolean;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  isAdminView: boolean;
  setIsAdminView: (isAdmin: boolean) => void;
  
  // Modals & Navigation
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  selectedMarketId: string | null;
  setSelectedMarketId: (id: string | null) => void;
  selectedOutcome: 'YES' | 'NO';
  setSelectedOutcome: (outcome: 'YES' | 'NO') => void;
  
  // User data
  userPositions: Position[];
  userOrders: Order[];
  userTransactions: Transaction[];
  settings: PlatformSettings | null;

  // Actions
  login: (email: string, displayName?: string, role?: 'user' | 'admin') => Promise<boolean>;
  logout: () => void;
  switchUser: (role: 'user' | 'admin') => void;
  refreshData: () => Promise<void>;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
  triggerConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('nexus_lang') as Language) || 'bn';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('nexus_theme') as Theme) || 'dark';
  });

  const [user, setUser] = useState<User | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('all');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>('YES');

  // User State
  const [userPositions, setUserPositions] = useState<Position[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const t = translations[language];

  // Language & Theme side effects
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nexus_lang', lang);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('nexus_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Notifications
  const notify = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== id));
    }, 4500);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  };

  // Initial Data Fetch
  const fetchMarkets = async () => {
    try {
      let url = `/api/markets?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}`;
      if (sortBy !== 'all') {
        url += `&sort=${sortBy}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMarkets(data);
      }
    } catch (err) {
      console.error('Error fetching markets:', err);
    } finally {
      setLoadingMarkets(false);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const [uRes, pRes, oRes, tRes] = await Promise.all([
        fetch(`/api/auth/user/${userId}`),
        fetch(`/api/positions/user/${userId}`),
        fetch(`/api/orders/user/${userId}`),
        fetch(`/api/wallet/transactions/${userId}`),
      ]);

      if (uRes.ok) {
        const freshUser = await uRes.json();
        setUser(freshUser);
        localStorage.setItem('nexus_user_id', freshUser.id);
      }
      if (pRes.ok) setUserPositions(await pRes.json());
      if (oRes.ok) setUserOrders(await oRes.json());
      if (tRes.ok) setUserTransactions(await tRes.json());
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const s = await res.json();
        setSettings(s);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const refreshData = async () => {
    await fetchMarkets();
    if (user?.id) {
      await fetchUserData(user.id);
    }
    await fetchSettings();
  };

  // Bootstrapping initial user
  useEffect(() => {
    const savedUserId = localStorage.getItem('nexus_user_id') || 'USR-TRADER-201';
    fetchUserData(savedUserId);
    fetchMarkets();
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [selectedCategory, searchQuery, sortBy]);

  const login = async (email: string, displayName?: string, role: 'user' | 'admin' = 'user') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, role }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('nexus_user_id', data.user.id);
        await fetchUserData(data.user.id);
        notify('success', `${language === 'bn' ? 'স্বাগতম' : 'Welcome'}, ${data.user.displayName}!`);
        return true;
      }
      notify('error', data.error || 'Login failed');
      return false;
    } catch (err) {
      notify('error', 'Login connection error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('nexus_user_id');
    // Switch to fresh guest or default
    login('mdshahanurislam397@gmail.com', 'Shahanur Islam (Pro Trader)', 'user');
    notify('info', language === 'bn' ? 'লগআউট সফল হয়েছে' : 'Logged out');
  };

  const switchUser = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      login('admin@nexusmarket.io', 'Nexus Super Admin', 'admin').then(() => {
        setIsAdminView(true);
      });
    } else {
      login('mdshahanurislam397@gmail.com', 'Shahanur Islam (Pro Trader)', 'user').then(() => {
        setIsAdminView(false);
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        language,
        theme,
        setLanguage,
        setTheme,
        t,
        markets,
        loadingMarkets,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        isAdminView,
        setIsAdminView,
        activeModal,
        setActiveModal,
        selectedMarketId,
        setSelectedMarketId,
        selectedOutcome,
        setSelectedOutcome,
        userPositions,
        userOrders,
        userTransactions,
        settings,
        login,
        logout,
        switchUser,
        refreshData,
        notify,
        triggerConfetti,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-3 backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
            }`}
          >
            <span className="text-lg">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <div className="flex-1">{toast.message}</div>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
