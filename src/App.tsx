import React, { useState, useEffect } from 'react';
import { WmsProvider, useWms } from './context/WmsContext';
import { DashboardView } from './components/DashboardView';
import { StockView } from './components/StockView';
import { SalesView } from './components/SalesView';
import { PurchaseView } from './components/PurchaseView';
import { OpnameView } from './components/OpnameView';
import { SetupView } from './components/SetupView';
import { HistoryView } from './components/HistoryView';
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Sliders,
  Settings,
  LogOut,
  Database,
  Coins,
  Shield,
  User,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Building,
  Menu,
  X,
  Tags,
  FolderOpen,
  UserCheck,
  Users,
  Building2,
  Layers,
  History,
  Wrench
} from 'lucide-react';

const safeGetItem = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (e) {
    return fallback;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // block-level silent fail
  }
};

function AppContent() {
  const {
    currentUser,
    userProfile,
    loadingAuth,
    loginWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    setUserProfileRole,
    currencies,
    selectedCurrency,
    changeCurrency,
    loadDefaultSeedData,
    warehouses,
    items,
    itemGroups,
    customerGroups,
    customers,
    vendors,
    vendorGroups,
    customRoles,
    emailRoles
  } = useWms();

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'STOCK' | 'SALES' | 'PURCHASE' | 'HISTORY' | 'OPNAME' | 'SETUP'>('DASHBOARD');
  const [stockSubTab, setStockSubTab] = useState<'SOH' | 'STOCK_LIST' | 'ADJUST' | 'CANNIBAL'>('SOH');
  
  const [lang, setLang] = useState<'EN' | 'IN'>(() => {
    return (safeGetItem('wms-lang', 'EN') as 'EN' | 'IN');
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (safeGetItem('wms-theme', 'dark') as 'dark' | 'light');
  });

  const toggleLang = (val: 'EN' | 'IN') => {
    setLang(val);
    safeSetItem('wms-lang', val);
  };

  const toggleTheme = (val: 'dark' | 'light') => {
    setTheme(val);
    safeSetItem('wms-theme', val);
    const rootEl = document.documentElement;
    if (val === 'light') {
      rootEl.classList.add('light');
    } else {
      rootEl.classList.remove('light');
    }
  };

  useEffect(() => {
    const savedTheme = safeGetItem('wms-theme', 'dark');
    const rootEl = document.documentElement;
    if (savedTheme === 'light') {
      rootEl.classList.add('light');
    } else {
      rootEl.classList.remove('light');
    }
  }, []);

  const getLabel = (key: string) => {
    const isIndo = lang === 'IN';
    const dict: Record<string, { en: string; id: string }> = {
      // Sections
      pipeline: { en: 'Pipeline', id: 'Alur Kerja' },
      commercial: { en: 'Commercial', id: 'Komersial' },
      stock: { en: 'Stock', id: 'Stok & Persediaan' },
      masters: { en: 'Masters', id: 'Data Master' },
      general_pipelines: { en: 'General Pipelines', id: 'Alur Kerja Umum' },
      masters_directory: { en: 'Masters Directory', id: 'Direktori Master' },

      // Tabs
      dashboard: { en: 'Dashboard', id: 'Dasbor' },
      executive_dashboard: { en: 'Executive Dashboard', id: 'Dasbor Eksekutif' },
      o2c: { en: 'Order-To-Cash (O2C)', id: 'Penjualan (O2C)' },
      p2p: { en: 'Procure-To-Pay (P2P)', id: 'Pembelian (P2P)' },
      stock_position: { en: 'Warehouse stock position menu', id: 'Posisi Stok Gudang' },
      stock_position_mobile: { en: 'Warehouse stock position', id: 'Posisi Stok Gudang' },
      history: { en: 'Movement history', id: 'Riwayat Pergerakan' },
      cannibalization: { en: 'ERP Cannibalization', id: 'Kanibalisasi ERP' },
      opname: { en: 'Stock Opname', id: 'Stok Opname' },

      // Sub-options
      item_master: { en: 'Item Master', id: 'Master Barang' },
      item_group: { en: 'Item Group', id: 'Kelompok Barang' },
      customer_master: { en: 'Customer Master', id: 'Master Pelanggan' },
      customer_group: { en: 'Customer Group', id: 'Kelompok Pelanggan' },
      vendor_master: { en: 'Vendor Master', id: 'Master Pemasok' },
      vendor_group: { en: 'Vendor Group', id: 'Kelompok Pemasok' },
      warehouse_master: { en: 'Warehouse Master', id: 'Master Gudang' },
      roles_seats: { en: 'Roles & Seats', id: 'Peran & Akses' },
      settings: { en: 'Settings & Seeds', id: 'Pengaturan & Seed' },
    };
    return isIndo ? (dict[key]?.id || dict[key]?.en || key) : (dict[key]?.en || key);
  };

  // Determine allowed tabs based on role permissions
  const matchedCustomRole = customRoles?.find(cr => cr.id === userProfile?.role);
  const defaultRoleTabs: Record<string, string[]> = {
    admin: ['DASHBOARD', 'STOCK', 'SALES', 'PURCHASE', 'HISTORY', 'OPNAME', 'SETUP'],
    manager: ['DASHBOARD', 'STOCK', 'SALES', 'PURCHASE', 'HISTORY', 'OPNAME'],
    staff: ['STOCK', 'HISTORY', 'OPNAME'],
    purchasing: ['DASHBOARD', 'PURCHASE'],
    auditor: ['DASHBOARD', 'STOCK', 'HISTORY']
  };
  const allowedTabs = (matchedCustomRole ? matchedCustomRole.allowedTabs : (defaultRoleTabs[userProfile?.role || 'staff'] || defaultRoleTabs.staff)) || [];

  const isTabAllowed = (tab: string) => {
    if (userProfile?.role === 'admin') return true; // Super admin always allowed
    return (allowedTabs || []).includes(tab);
  };

  // Redirect if current tab is not allowed
  useEffect(() => {
    if (userProfile && !loadingAuth) {
      if (!isTabAllowed(activeTab)) {
        const firstAllowed = ['DASHBOARD', 'STOCK', 'SALES', 'PURCHASE', 'HISTORY', 'OPNAME', 'SETUP'].find(t => isTabAllowed(t));
        if (firstAllowed) {
          setActiveTab(firstAllowed as any);
        }
      }
    }
  }, [userProfile, loadingAuth, customRoles, activeTab]);
  
  const [setupSubTab, setSetupSubTab] = useState<'ITEM_MASTER' | 'ITEM_GROUP' | 'CUSTOMER_MASTER' | 'CUSTOMER_GROUP' | 'VENDOR_MASTER' | 'VENDOR_GROUP' | 'WAREHOUSE_MASTER' | 'ROLES_SEATS' | 'SETTINGS'>('ITEM_MASTER');
  
  // Login Form States
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginMsg, setLoginMsg] = useState({ text: '', type: '' });
  const [authWorking, setAuthWorking] = useState(false);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper Google login action
  const handleGoogleLogin = async () => {
    setLoginMsg({ text: '', type: '' });
    setAuthWorking(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setLoginMsg({ text: err.message || 'Google Authentication failed.', type: 'error' });
    } finally {
      setAuthWorking(false);
    }
  };

  // Helper login action
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMsg({ text: '', type: '' });
    setAuthWorking(true);

    try {
      if (isSignUp) {
        // Default role sign up is staff
        await signUpWithEmail(emailInput, passwordInput, 'staff');
        setLoginMsg({ text: 'Account registered successfully!', type: 'success' });
      } else {
        await signInWithEmail(emailInput, passwordInput);
      }
    } catch (err: any) {
      setLoginMsg({ text: err.message || 'Authentication failed. Match credentials.', type: 'error' });
    } finally {
      setAuthWorking(false);
    }
  };

  // Render Loader Area
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin"></div>
          <Building className="w-5 h-5 text-indigo-400 absolute left-3.5 top-3.5 animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-slate-200 text-xs font-semibold uppercase tracking-widest font-mono">Loading Enterprise WMS</p>
          <p className="text-slate-550 text-[11px] font-sans">Connecting real-time Firestore streams...</p>
        </div>
      </div>
    );
  }

  // Render Login / Authentication Lobby
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex flex-col md:flex-row font-sans text-slate-100">
        
        {/* Pitch Side - Sleek Enterprise Intro Card */}
        <div className="md:w-1/2 bg-slate-900/40 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-800/60 p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle glowing mesh backgrounds */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-sky-500/10 rounded-full filter blur-[100px] animate-pulse"></div>
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                <Building className="w-5 h-5" />
              </span>
              <h1 className="text-sm font-extrabold tracking-widest text-sky-400 font-mono uppercase">
                AlphaLux Enterprise
              </h1>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-sky-300 bg-clip-text text-transparent font-sans">
              Warehouse Management System
            </h2>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed font-sans mt-1">
              Experience dynamic multi-device stock-flow tracking, asset component cannibalization pipelines, variance stock-opnames, and automated multi-currency sales logging.
            </p>
          </div>

          <p className="text-[10px] text-slate-600 mt-6 md:mt-0">
            © 2026 AlphaLux Enterprise, LLC. Sealed security guidelines active.
          </p>
        </div>

        {/* Input Form Side */}
        <div className="md:w-1/2 flex items-center justify-center p-8 bg-slate-950/30 backdrop-blur-md">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-100">
                {isSignUp ? 'Establish Enterprise ID' : 'Database Login Session'}
              </h3>
              <p className="text-slate-400 text-xs">
                {isSignUp ? 'Create a brand new system user identity.' : 'Provide certified administrator credentials.'}
              </p>
            </div>

            {loginMsg.text && (
              <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                loginMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}>
                {loginMsg.text}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-450 mb-1.5 font-bold">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@alphalux.com"
                  className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 block text-sm focus:ring-1 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-450 mb-1.5 font-bold">
                  Corporate Security Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 block text-sm focus:ring-1 focus:ring-sky-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={authWorking}
                className="w-full py-3 bg-sky-600 disabled:bg-slate-800 text-white rounded-xl font-bold hover:bg-sky-500 transition-all font-sans text-xs cursor-pointer shadow-lg shadow-sky-600/10 hover:shadow-sky-600/20 font-semibold"
              >
                {authWorking ? 'Processing Credentials...' : isSignUp ? 'Construct Identity Profile' : 'Authenticate Session'}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800/80"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono">
                <span className="bg-[#050811] px-2 text-slate-500 font-extrabold tracking-wider">Or credentials via</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authWorking}
              className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/60 text-slate-300 rounded-xl font-bold transition-all text-xs cursor-pointer flex justify-center items-center gap-2 shadow-lg shadow-black/20"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.5 0 2.85.51 3.9 1.5l2.9-2.9C17 1.9 14.7.9 12 .9 7.3.9 3.4 3.6 1.5 7.5L4.7 10c.8-2.5 3.1-4.96 7.3-4.96z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.25c0-.82-.07-1.6-.21-2.35H12v4.45h6.47c-.28 1.48-1.12 2.73-2.38 3.58l3.68 2.85c2.15-1.98 3.39-4.9 3.39-8.53z"
                />
                <path
                  fill="#FBBC05"
                  d="M4.7 14c-.23-.7-.36-1.45-.36-2.23s.13-1.53.36-2.23L1.5 7.04C.54 8.97 0 11.13 0 13.4s.54 4.43 1.5 6.36l3.2-2.4c-.23-.7-.36-1.45-.36-2.23z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.9l-3.68-2.85c-1.1.74-2.5 1.18-4.28 1.18-4.2 0-7.76-2.85-9.03-6.68L1.5 14c1.9 4 5.8 6.64 10.5 6.64z"
                />
              </svg>
              <span className="font-semibold">Verify Google Identity</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-slate-400 hover:text-sky-400 transition-colors text-xs font-semibold cursor-pointer"
              >
                {isSignUp ? 'Already registered? Login standard' : 'Need a new testing account? Register Identity'}
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Render main layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans overflow-x-hidden">

      
      {/* 1. SIDEBAR Navigation Area - Desktop Display */}
      <aside className="hidden md:flex md:w-64 bg-slate-900/90 border-r border-slate-800 flex-col justify-between shrink-0">
        <div className="p-6 space-y-6">
          
          {/* Logo container matching LOGIQ v2.0 style */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Building className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-sm font-extrabold tracking-tight text-white leading-none">
                AlphaLux AIM
              </h2>
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block leading-none mt-1">
                LOGIQ v2.0
              </span>
            </div>
          </div>

          {/* User profile details Card with dynamic role assignment capability */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-sky-500/10 text-sky-400 flex items-center justify-center font-extrabold text-xs border border-sky-500/20 shrink-0">
                {currentUser.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-sans font-bold text-slate-200 truncate leading-none">
                  {currentUser.email}
                </p>
                <span className="text-[8px] font-bold text-slate-500 tracking-wider uppercase block mt-1 leading-none">
                  {lang === 'IN' ? 'Sesi Anggota Aktif' : 'Active Member Session'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[8px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                {lang === 'IN' ? 'Peran Sistem' : 'System Role'}
              </label>
              <div className="w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-850/80 rounded-lg text-slate-300 font-sans text-[10px] block font-semibold">
                {userProfile?.role === 'admin' && `🛡️ ${lang === 'IN' ? 'Admin (Ruang Kontrol)' : 'Admin (Control Room)'}`}
                {userProfile?.role === 'manager' && `📋 ${lang === 'IN' ? 'Manajer Gudang' : 'Warehouse Manager'}`}
                {userProfile?.role === 'staff' && `📦 ${lang === 'IN' ? 'Staf Operasional' : 'Operative (Staff)'}`}
                {userProfile?.role === 'purchasing' && `💼 ${lang === 'IN' ? 'Agen Pembelian' : 'Purchasing Agent'}`}
                {userProfile?.role === 'auditor' && `✨ ${lang === 'IN' ? 'Auditor Eksternal' : 'External Auditor'}`}
                {!userProfile?.role && `📦 ${lang === 'IN' ? 'Staf Operasional' : 'Operative (Staff)'}`}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800/80">
              <div className="space-y-1">
                <label className="block text-[8.5px] font-semibold text-slate-400 tracking-wide">
                  {lang === 'IN' ? 'Tema' : 'Theme'}
                </label>
                <select
                  value={theme}
                  onChange={(e) => toggleTheme(e.target.value as 'dark' | 'light')}
                  className="w-full pl-1.5 pr-6 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 font-sans text-[10.5px] font-semibold cursor-pointer focus:outline-none focus:border-sky-500"
                >
                  <option value="dark">🌙 {lang === 'IN' ? 'Gelap' : 'Dark'}</option>
                  <option value="light">☀️ {lang === 'IN' ? 'Terang' : 'Light'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[8.5px] font-semibold text-slate-400 tracking-wide">
                  {lang === 'IN' ? 'Bahasa' : 'Language'}
                </label>
                <select
                  value={lang}
                  onChange={(e) => toggleLang(e.target.value as 'EN' | 'IN')}
                  className="w-full pl-1.5 pr-6 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 font-sans text-[10.5px] font-semibold cursor-pointer focus:outline-none focus:border-sky-500"
                >
                  <option value="EN">🇺🇸 EN</option>
                  <option value="IN">🇮🇩 IN</option>
                </select>
              </div>
            </div>
          </div>

          {/* Navigation Menu Selection Index organized into logical sections */}
          <nav className="space-y-4 block">
            {isTabAllowed('DASHBOARD') && (
              <div>
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{getLabel('pipeline')}</div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('DASHBOARD')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                      activeTab === 'DASHBOARD'
                        ? 'bg-slate-800 text-sky-450 border-l-4 border-sky-500 shadow-md shadow-slate-950/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {getLabel('dashboard')}
                  </button>
                </div>
              </div>
            )}

            {(isTabAllowed('SALES') || isTabAllowed('PURCHASE')) && (
              <div>
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{getLabel('commercial')}</div>
                <div className="space-y-1">
                  {isTabAllowed('SALES') && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('SALES')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                        activeTab === 'SALES'
                          ? 'bg-slate-800 text-sky-450 border-l-4 border-sky-500 shadow-md shadow-slate-950/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {getLabel('o2c')}
                    </button>
                  )}

                  {isTabAllowed('PURCHASE') && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('PURCHASE')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                        activeTab === 'PURCHASE'
                          ? 'bg-slate-800 text-sky-450 border-l-4 border-sky-500 shadow-md shadow-slate-950/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      {getLabel('p2p')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {(isTabAllowed('STOCK') || isTabAllowed('HISTORY') || isTabAllowed('OPNAME')) && (
              <div>
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{getLabel('stock')}</div>
                <div className="space-y-1">
                  {isTabAllowed('STOCK') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('STOCK');
                        setStockSubTab('SOH');
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                        activeTab === 'STOCK'
                          ? 'bg-slate-800 text-sky-450 border-l-4 border-sky-500 shadow-md shadow-slate-950/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                      }`}
                    >
                      <PackageSearch className="w-3.5 h-3.5" />
                      {getLabel('stock_position')}
                    </button>
                  )}

                  {isTabAllowed('HISTORY') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('HISTORY');
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                        activeTab === 'HISTORY'
                          ? 'bg-slate-800 text-sky-450 border-l-4 border-sky-500 shadow-md shadow-slate-950/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      {getLabel('history')}
                    </button>
                  )}

                  {isTabAllowed('STOCK') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('STOCK');
                        setStockSubTab('CANNIBAL');
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                        activeTab === 'STOCK' && stockSubTab === 'CANNIBAL'
                          ? 'bg-slate-800 text-sky-450 border-l-4 border-sky-500 shadow-md shadow-slate-950/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      {getLabel('cannibalization')}
                    </button>
                  )}

                  {isTabAllowed('OPNAME') && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('OPNAME')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                        activeTab === 'OPNAME'
                          ? 'bg-slate-800 text-sky-450 border-l-4 border-sky-500 shadow-md shadow-slate-950/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      {getLabel('opname')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {isTabAllowed('SETUP') && (
              <div>
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{getLabel('masters')}</div>
                <div className="space-y-1 block max-h-[300px] overflow-y-auto pr-1">
                  {[
                    { id: 'ITEM_MASTER', label: 'Item Master', icon: Tags, count: items?.length || 0 },
                    { id: 'ITEM_GROUP', label: 'Item Group', icon: FolderOpen, count: itemGroups?.length || 0 },
                    { id: 'CUSTOMER_MASTER', label: 'Customer Master', icon: UserCheck, count: customers?.length || 0 },
                    { id: 'CUSTOMER_GROUP', label: 'Customer Group', icon: Users, count: customerGroups?.length || 0 },
                    { id: 'VENDOR_MASTER', label: 'Vendor Master', icon: Building2, count: vendors?.length || 0 },
                    { id: 'VENDOR_GROUP', label: 'Vendor Group', icon: Layers, count: vendorGroups?.length || 0 },
                    { id: 'WAREHOUSE_MASTER', label: 'Warehouse Master', icon: Building, count: warehouses?.length || 0 },
                    { id: 'ROLES_SEATS', label: 'Roles & Seats', icon: KeyRound, count: null },
                    { id: 'SETTINGS', label: 'Settings & Seeds', icon: Database, count: null },
                  ].map((subOption) => {
                  const SubIcon = subOption.icon;
                  const isSubActive = activeTab === 'SETUP' && setupSubTab === subOption.id;
                  return (
                    <button
                      key={subOption.id}
                      type="button"
                      onClick={() => {
                        setActiveTab('SETUP');
                        setSetupSubTab(subOption.id as any);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold rounded-md text-left transition-all ${
                        isSubActive
                          ? 'bg-indigo-950/40 text-indigo-450 border-l-2 border-indigo-500 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{getLabel(subOption.id.toLowerCase())}</span>
                      {subOption.count !== null && (
                        <span className="ml-auto text-[8px] font-mono bg-slate-950/80 px-1.5 py-0.5 rounded text-indigo-400/80 border border-indigo-950">
                          {subOption.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
        </div>

        {/* Bottom Section logout */}
        <div className="p-6 border-t border-slate-800 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Firebase Realtime: Connected</span>
          </div>

          <button
            type="button"
            onClick={() => signOutUser()}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Top Bar Navigation - Mobile Layout */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-850 to-slate-900 flex items-center justify-between relative z-50 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15">
            <Building className="w-4.5 h-4.5" />
          </span>
          <div className="space-y-0.5">
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-100">
              AlphaLux AIM
            </h2>
            <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-widest block leading-none">
              LOGIQ v2.0
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-xl transition-all border border-slate-800 shadow-sm cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 shadow-2xl p-4.5 space-y-4 animate-fade-in">
            {/* Mobile User Profile details */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20 shrink-0">
                  {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-sans font-bold text-slate-200 truncate leading-none">
                    {currentUser.email}
                  </p>
                  <span className="text-[8px] font-bold text-slate-500 tracking-wider uppercase block mt-1 leading-none">
                    {lang === 'IN' ? 'Sesi Seluler Responsif' : 'Responsive Mobile Session'}
                  </span>
                </div>
              </div>
              <div className="space-y-1 pt-1 border-t border-slate-900">
                <label className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  {lang === 'IN' ? 'Peran Sistem' : 'System Role'}
                </label>
                <div className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-sans text-xs font-semibold">
                  {userProfile?.role === 'admin' && `🛡️ ${lang === 'IN' ? 'Admin (Ruang Kontrol)' : 'Admin (Control Room)'}`}
                  {userProfile?.role === 'manager' && `📋 ${lang === 'IN' ? 'Manajer Gudang' : 'Warehouse Manager'}`}
                  {userProfile?.role === 'staff' && `📦 ${lang === 'IN' ? 'Staf Operasional' : 'Operative (Staff)'}`}
                  {userProfile?.role === 'purchasing' && `💼 ${lang === 'IN' ? 'Agen Pembelian' : 'Purchasing Agent'}`}
                  {userProfile?.role === 'auditor' && `✨ ${lang === 'IN' ? 'Auditor Eksternal' : 'External Auditor'}`}
                  {!userProfile?.role && `📦 ${lang === 'IN' ? 'Staf Operasional' : 'Operative (Staff)'}`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-900/65">
                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    {lang === 'IN' ? 'Tema' : 'Theme'}
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => toggleTheme(e.target.value as 'dark' | 'light')}
                    className="w-full pl-1.5 pr-6 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-sans text-[10px] focus:outline-none focus:border-sky-500 block font-semibold cursor-pointer"
                  >
                    <option value="dark">🌙 {lang === 'IN' ? 'Gelap' : 'Dark'}</option>
                    <option value="light">☀️ {lang === 'IN' ? 'Terang' : 'Light'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                    {lang === 'IN' ? 'Bahasa' : 'Language'}
                  </label>
                  <select
                    value={lang}
                    onChange={(e) => toggleLang(e.target.value as 'EN' | 'IN')}
                    className="w-full pl-1.5 pr-6 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-sans text-[10px] focus:outline-none focus:border-sky-500 block font-semibold cursor-pointer"
                  >
                    <option value="EN">🇺🇸 EN</option>
                    <option value="IN">🇮🇩 IN</option>
                  </select>
                </div>
              </div>
            </div>

            <nav className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1 col-span-1 border border-slate-800 p-2.5 rounded-xl bg-slate-950/40">
              {isTabAllowed('DASHBOARD') && (
                <>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 px-2 mt-1">{getLabel('general_pipelines')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('DASHBOARD');
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3.5 py-2 text-xs text-left font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    {getLabel('executive_dashboard')}
                  </button>
                </>
              )}

              {(isTabAllowed('SALES') || isTabAllowed('PURCHASE')) && (
                <>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 px-2 mt-2">{getLabel('commercial')}</span>
                  {[
                    { tab: 'SALES', key: 'o2c' },
                    { tab: 'PURCHASE', key: 'p2p' }
                  ].filter(item => isTabAllowed(item.tab)).map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.tab as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-3.5 py-2 text-xs text-left font-semibold rounded-lg transition-colors cursor-pointer ${
                        activeTab === item.tab ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      {getLabel(item.key)}
                    </button>
                  ))}
                </>
              )}

              {(isTabAllowed('STOCK') || isTabAllowed('HISTORY') || isTabAllowed('OPNAME')) && (
                <>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 px-2 mt-2">{getLabel('stock')}</span>
                  {[
                    { tab: 'STOCK', subTab: 'SOH', key: 'stock_position_mobile' },
                    { tab: 'STOCK', subTab: 'CANNIBAL', key: 'cannibalization' },
                    { tab: 'HISTORY', subTab: null, key: 'history' },
                    { tab: 'OPNAME', subTab: null, key: 'opname' }
                  ].filter(item => isTabAllowed(item.tab)).map((item, index) => {
                    const isActive = activeTab === item.tab && (item.subTab === null || stockSubTab === item.subTab);
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.tab as any);
                          if (item.subTab) {
                            setStockSubTab(item.subTab as any);
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={`px-3.5 py-2 text-xs text-left font-semibold rounded-lg transition-colors cursor-pointer pl-5 ${
                          isActive ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        • {getLabel(item.key)}
                      </button>
                    );
                  })}
                </>
              )}

              {isTabAllowed('SETUP') && (
                <>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 px-2 mt-2">{getLabel('masters_directory')}</span>
                  {[
                    { id: 'ITEM_MASTER' },
                    { id: 'ITEM_GROUP' },
                    { id: 'CUSTOMER_MASTER' },
                    { id: 'CUSTOMER_GROUP' },
                    { id: 'VENDOR_MASTER' },
                    { id: 'VENDOR_GROUP' },
                    { id: 'WAREHOUSE_MASTER' },
                    { id: 'ROLES_SEATS' },
                    { id: 'SETTINGS' }
                  ].map((subItem) => (
                    <button
                      key={subItem.id}
                      type="button"
                      onClick={() => {
                        setActiveTab('SETUP');
                        setSetupSubTab(subItem.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-3.5 py-2 text-xs text-left font-semibold rounded-lg transition-colors pl-5 cursor-pointer ${
                        activeTab === 'SETUP' && setupSubTab === subItem.id ? 'bg-indigo-600/95 text-white font-bold' : 'text-slate-400 hover:bg-slate-850/60'
                      }`}
                    >
                      • {getLabel(subItem.id.toLowerCase())}
                    </button>
                  ))}
                </>
              )}
            </nav>

            <button
              type="button"
              onClick={() => signOutUser()}
              className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-rose-500/10"
            >
              {lang === 'IN' ? 'Keluar dari Sistem' : 'Sign Out'}
            </button>
          </div>
        )}
      </header>

      {/* 3. CORE SUB-SCREEN INNER VIEW SHELL */}
      <main className="flex-1 min-w-0 flex flex-col bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 overflow-y-auto overflow-x-hidden">
        
        {/* Header Bar matching layout guidelines */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 md:px-8 border-b border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center space-x-6">
            <h2 className="text-base font-bold text-slate-100 tracking-tight font-sans">
              {activeTab === 'DASHBOARD' && 'Executive Metrics Overview'}
              {activeTab === 'STOCK' && (stockSubTab === 'CANNIBAL' ? 'ERP Cannibalization Ledger' : 'Warehouse Stock Position')}
              {activeTab === 'SALES' && 'Order-to-Cash (O2C) Pipelines'}
              {activeTab === 'PURCHASE' && 'Procure-to-Pay (P2P) Logbook'}
              {activeTab === 'OPNAME' && 'Physical Inventories & Actions'}
              {activeTab === 'SETUP' && 'Item & System Directory'}
            </h2>
          </div>

          {/* Right section: live indicators and Base Currency selects */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800/80 px-2 py-1 rounded-lg">
              <Coins className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <select
                value={selectedCurrency.code}
                onChange={(e) => changeCurrency(e.target.value)}
                className="bg-transparent text-sky-400 font-bold border-0 focus:ring-0 text-xs focus:outline-none cursor-pointer p-0 pr-1.5"
              >
                {currencies.map(c => (
                  <option key={c.code} className="bg-slate-900 text-slate-200" value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* View render hub */}
        <div className="flex-1 px-3 py-4 sm:p-6 md:p-8 space-y-6">
          {activeTab === 'DASHBOARD' && (
            <DashboardView 
              onNavigateToStockList={() => {
                setActiveTab('STOCK');
                setStockSubTab('STOCK_LIST');
              }}
            />
          )}
          {activeTab === 'STOCK' && (
            <StockView 
              activeSubTab={stockSubTab} 
              setActiveSubTab={setStockSubTab} 
            />
          )}
          {activeTab === 'HISTORY' && <HistoryView />}
          {activeTab === 'SALES' && <SalesView />}
          {activeTab === 'PURCHASE' && <PurchaseView />}
          {activeTab === 'OPNAME' && <OpnameView />}
          {activeTab === 'SETUP' && (
            <SetupView 
              activeSubTab={setupSubTab} 
              setActiveSubTab={setSetupSubTab} 
              lang={lang}
            />
          )}
        </div>

      </main>

    </div>
  );
}


export default function App() {
  return (
    <WmsProvider>
      <AppContent />
    </WmsProvider>
  );
}
