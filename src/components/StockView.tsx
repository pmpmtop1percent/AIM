import React, { useState } from 'react';
import { useWms } from '../context/WmsContext';
import { CannibalView } from './CannibalView';
import {
  Package,
  Layers,
  History,
  AlertOctagon,
  Search,
  Plus,
  Minus,
  Wrench,
  Navigation,
  FileText,
  Scan,
  Coins,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Flame,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { Item, Stock, Warehouse } from '../types';

const formatThousandDots = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === "") return "";
  const parts = val.toString().split(".");
  const intPart = parts[0];
  const decPart = parts[1];
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (decPart !== undefined) {
    return formattedInt + "," + decPart;
  }
  return formattedInt;
};

const parseThousandDots = (str: string): number | "" => {
  if (str === "") return "";
  const clean = str.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(clean);
  return isNaN(num) ? "" : num;
};

interface StockViewProps {
  activeSubTab?: 'SOH' | 'STOCK_LIST' | 'ADJUST' | 'CANNIBAL';
  setActiveSubTab?: (tab: 'SOH' | 'STOCK_LIST' | 'ADJUST' | 'CANNIBAL') => void;
}

export const StockView: React.FC<StockViewProps> = ({ activeSubTab, setActiveSubTab }) => {
  const {
    items,
    stocks,
    warehouses,
    itemGroups,
    stockMovements,
    selectedCurrency,
    addDirectStockAdjustment,
    userProfile
  } = useWms();

  const [localActiveTab, setLocalActiveTab] = useState<'SOH' | 'STOCK_LIST' | 'ADJUST' | 'CANNIBAL'>('SOH');
  
  const activeTab = activeSubTab !== undefined ? activeSubTab : localActiveTab;
  const setActiveTab = setActiveSubTab !== undefined ? setActiveSubTab : setLocalActiveTab;
  
  // SOH Dashboard Calculations
  const uniqueSkusCount = React.useMemo(() => new Set(stocks.map(s => s.sku)).size, [stocks]);
  const totalPhysicalSoh = React.useMemo(() => stocks.reduce((acc, curr) => acc + curr.physicalQty, 0), [stocks]);
  const totalCommittedSoh = React.useMemo(() => stocks.reduce((acc, curr) => acc + curr.bookedQty, 0), [stocks]);
  const totalAvailableSoh = React.useMemo(() => totalPhysicalSoh - totalCommittedSoh, [totalPhysicalSoh, totalCommittedSoh]);
  
  const totalValue = React.useMemo(() => {
    return stocks.reduce((acc, curr) => {
      const item = items.find(i => i.sku === curr.sku);
      return acc + (item ? item.unitCost * curr.physicalQty : 0);
    }, 0);
  }, [stocks, items]);

  const lowStockCount = React.useMemo(() => {
    return stocks.filter(st => {
      const item = items.find(i => i.sku === st.sku);
      return item ? (st.physicalQty - st.bookedQty) < item.minStock : false;
    }).length;
  }, [stocks, items]);

  // SOH States
  const [sohSearch, setSohSearch] = useState('');
  const [sohWarehouseFilter, setSohWarehouseFilter] = useState('ALL');
  const [sohCategoryFilter, setSohCategoryFilter] = useState('ALL');

  // Scanner integrations
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTargetForm, setScannerTargetForm] = useState<'adjust' | null>(null);

  // Manual Adjust State
  const [adjSku, setAdjSku] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Filter items matching the adjSku input (matching SKU or name, case insensitive)
  const suggestions = React.useMemo(() => {
    if (!adjSku.trim()) return [];
    const query = adjSku.toLowerCase().trim();
    return items
      .filter(item => item.sku.toLowerCase().includes(query) || item.name.toLowerCase().includes(query))
      .slice(0, 5); // Limit to top 5 matches
  }, [items, adjSku]);

  // Reset active suggestion index when query or visibility changes
  React.useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [adjSku, showSuggestions]);

  const [adjWarehouse, setAdjWarehouse] = useState('WH-MUT-01');
  const [adjQty, setAdjQty] = useState<number>(0);
  const [adjBin, setAdjBin] = useState('');
  const [adjRack, setAdjRack] = useState('');
  const [adjReason, setAdjReason] = useState('Safety Stock Sync');
  const [adjMessage, setAdjMessage] = useState({ text: '', type: '' });



  const convertAndFormatPrice = (usdAmount: number) => {
    const amt = usdAmount * selectedCurrency.exchangeRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: selectedCurrency.code === 'IDR' ? 0 : 2
    }).format(amt);
  };

  // Adjust handle
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjMessage({ text: '', type: '' });
    
    // Gating
    if (userProfile?.role === 'auditor') {
      setAdjMessage({ text: 'Access Denied: Auditors cannot write direct stock adjustments.', type: 'error' });
      return;
    }

    const cleanSku = adjSku.toUpperCase().trim();
    const itemMatch = items.find(i => i.sku === cleanSku);
    if (!itemMatch) {
      setAdjMessage({ text: `SKU "${cleanSku}" does not exist in master catalog.`, type: 'error' });
      return;
    }

    if (adjQty === 0) {
      setAdjMessage({ text: 'Adjustment quantity cannot be zero.', type: 'error' });
      return;
    }

    try {
      await addDirectStockAdjustment(cleanSku, adjWarehouse, adjQty, adjBin, adjRack, adjReason);
      setAdjMessage({ text: `Stock successfully adjusted for SKU ${cleanSku}. Balance refreshed.`, type: 'success' });
      setAdjSku('');
      setAdjQty(0);
      setAdjBin('');
      setAdjRack('');
    } catch (err: any) {
      setAdjMessage({ text: 'Error executing Firestore write.', type: 'error' });
    }
  };



  // Filter SOH
  const filteredSoh = stocks.filter(st => {
    const item = items.find(i => i.sku === st.sku);
    const matchesSearch =
      st.sku.toLowerCase().includes(sohSearch.toLowerCase()) ||
      (item?.name || '').toLowerCase().includes(sohSearch.toLowerCase()) ||
      (st.bin || '').toLowerCase().includes(sohSearch.toLowerCase()) ||
      (st.rack || '').toLowerCase().includes(sohSearch.toLowerCase());

    const matchesWarehouse = sohWarehouseFilter === 'ALL' || st.warehouseCode === sohWarehouseFilter;
    const matchesCategory = sohCategoryFilter === 'ALL' || (item?.groupId === sohCategoryFilter);

    return matchesSearch && matchesWarehouse && matchesCategory;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Tab Select Headings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border border-slate-800 p-1 bg-slate-950/80 rounded-xl max-w-2xl mx-auto gap-1 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('SOH')}
          className={`text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'SOH' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          SOH
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('STOCK_LIST')}
          className={`text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'STOCK_LIST' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Stock list
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ADJUST')}
          className={`text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'ADJUST' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Stock adjustment
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CANNIBAL')}
          className={`text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'CANNIBAL' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Cannibalization
        </button>

      </div>

      {/* Screen Renderings */}

      {/* TAB 1: SOH Dashboard Overview */}
      {activeTab === 'SOH' && (
        <div className="space-y-6 animate-fade-in">
          {/* Bento Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stat Card 1: Valuation Index */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
                  SOH Valuation Index
                </span>
                <h3 className="text-xl font-extrabold text-slate-100 font-mono tracking-tight">
                  {convertAndFormatPrice(totalValue)}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Total book value of physical inventory
                </p>
              </div>
            </div>

            {/* Stat Card 2: Total Units On Hand */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
                  Total Physical Units
                </span>
                <h3 className="text-xl font-extrabold text-indigo-300 font-mono tracking-tight">
                  {totalPhysicalSoh.toLocaleString()}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Units physically present in warehouses
                </p>
              </div>
            </div>

            {/* Stat Card 3: Available Free Stock */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
                  Available SOH Assets
                </span>
                <h3 className="text-xl font-extrabold text-emerald-400 font-mono tracking-tight">
                  {totalAvailableSoh.toLocaleString()}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {totalCommittedSoh.toLocaleString()} units committed
                </p>
              </div>
            </div>

            {/* Stat Card 4: Low Stock Warnings */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
                  SOH Health Status
                </span>
                <div className="flex items-center gap-2">
                  <h3 className={`text-xl font-extrabold font-mono tracking-tight ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {lowStockCount} {lowStockCount === 1 ? 'Alert' : 'Alerts'}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400">
                  Items below minimum threshold level
                </p>
              </div>
            </div>

          </div>

          {/* Warehouse Breakdown Title */}
          <div className="pt-2 border-t border-slate-800/50">
            <h4 className="text-sm font-semibold text-slate-200 tracking-tight font-sans">
              Warehouse Storage Sites & Capacity Status
            </h4>
          </div>

          {/* Warehouse Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
            {warehouses.map(wh => {
              const whStocks = stocks.filter(s => s.warehouseCode === wh.code);
              const whPhysical = whStocks.reduce((acc, curr) => acc + curr.physicalQty, 0);
              const whBooked = whStocks.reduce((acc, curr) => acc + curr.bookedQty, 0);
              const whAvailable = whPhysical - whBooked;
              const whSkus = new Set(whStocks.map(s => s.sku)).size;
              const ratio = whPhysical > 0 ? Math.round((whBooked / whPhysical) * 100) : 0;

              return (
                <div key={wh.code} className="bg-gradient-to-br from-slate-950 to-slate-900/90 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700/60 transition-colors">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <h5 className="font-mono text-base font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                        {wh.code}
                      </h5>
                      <p className="text-xs text-slate-200 font-semibold mt-0.5">
                        {wh.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {wh.location}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20">
                      {whSkus} {whSkus === 1 ? 'SKU' : 'SKUs'} Active
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mt-4 space-y-2.5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono uppercase">Physical On-Hand</div>
                        <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">{whPhysical}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono uppercase">Committed</div>
                        <div className="text-sm font-bold text-slate-400 font-mono mt-0.5">{whBooked}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono uppercase">Available</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{whAvailable}</div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-slate-800/60">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Ratio Committed</span>
                        <span>{ratio}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(ratio, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Detailed Stock List */}
      {activeTab === 'STOCK_LIST' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={sohSearch}
                onChange={(e) => setSohSearch(e.target.value)}
                placeholder="Search SKU, name, bin, rack..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-sans"
              />
            </div>
            {/* Filters */}
            <div className="flex flex-col gap-2 shrink-0 min-w-[150px]">
              {/* Category Filter */}
              <select
                id="soh-category-filter"
                value={sohCategoryFilter}
                onChange={(e) => setSohCategoryFilter(e.target.value)}
                className="px-2.5 sm:px-3 text-left py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer w-full"
              >
                <option value="ALL">Category: ALL</option>
                {itemGroups && itemGroups.map(ig => (
                  <option key={ig.id} value={ig.id}>{ig.name}</option>
                ))}
              </select>

              {/* Warehouse Filter */}
              <select
                id="soh-warehouse-filter"
                value={sohWarehouseFilter}
                onChange={(e) => setSohWarehouseFilter(e.target.value)}
                className="px-2.5 sm:px-3 text-left py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer w-full"
              >
                <option value="ALL">WH: ALL</option>
                {warehouses.map(w => (
                  <option key={w.code} value={w.code}>{w.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SOH Grid View */}
          <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/45 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/45 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Item SKU / Product</th>
                  <th className="py-3 px-4">Physical SOH</th>
                  <th className="py-3 px-4">Booked Committed</th>
                  <th className="py-3 px-4">Available SOH</th>
                  <th className="py-3 px-4">Warehouse Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredSoh.map((st) => {
                  const item = items.find(i => i.sku === st.sku);
                  const availableSoh = st.physicalQty - st.bookedQty;
                  const isLow = item ? availableSoh < item.minStock : false;

                  return (
                    <tr key={st.id} className="hover:bg-slate-855/20 transition-colors group">
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-indigo-300 group-hover:text-indigo-400 transition-colors">
                            {st.sku}
                          </span>
                          <span className="text-[11px] text-slate-400 line-clamp-1 truncate font-medium mt-0.5">
                            {item?.name || 'Unknown SKU detail'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-slate-200">
                        {st.physicalQty}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        {st.bookedQty}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {availableSoh}
                          </span>
                          {isLow && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        {st.warehouseCode}
                      </td>
                    </tr>
                  );
                })}

                {filteredSoh.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                      No stock positions match your searches. Click "Init Seed Data" if database is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Direct Stock Adjustment Card */}
      {activeTab === 'ADJUST' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="space-y-0.5 animate-pulse">
              <h3 className="font-bold text-slate-100 text-lg">Direct Stock Adjustment</h3>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setScannerTargetForm('adjust');
                setShowScanner(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 rounded-xl hover:bg-indigo-600/20 text-xs font-semibold select-none transition-all cursor-pointer"
            >
              <Scan className="w-4 h-4" />
              Scan Item Package
            </button>
          </div>

          {adjMessage.text && (
            <div className={`mb-4.5 p-3.5 rounded-xl border text-xs leading-relaxed ${
              adjMessage.type === 'success' 
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-250' 
                : 'bg-red-950/20 border-red-900/40 text-red-150'
            }`}>
              {adjMessage.text}
            </div>
          )}

          <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Item SKU Code
                </label>
                <input
                  type="text"
                  required
                  value={adjSku}
                  onChange={(e) => {
                    setAdjSku(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  onKeyDown={(e) => {
                    if (!showSuggestions || suggestions.length === 0) return;
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveSuggestionIndex(prev => 
                        prev < suggestions.length - 1 ? prev + 1 : 0
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveSuggestionIndex(prev => 
                        prev > 0 ? prev - 1 : suggestions.length - 1
                      );
                    } else if (e.key === 'Enter') {
                      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                        e.preventDefault();
                        setAdjSku(suggestions[activeSuggestionIndex].sku);
                        setShowSuggestions(false);
                      }
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder="e.g. CPU-INT-I9"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  autoComplete="off"
                />

                {/* Autocomplete active suggestion option dialog list */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-900/65 font-sans max-h-60 overflow-y-auto">
                    {suggestions.map((item, idx) => {
                      const isHighlighted = idx === activeSuggestionIndex;
                      return (
                        <button
                          key={item.sku}
                          type="button"
                          onMouseDown={() => {
                            setAdjSku(item.sku);
                            setShowSuggestions(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer group ${
                            isHighlighted ? 'bg-indigo-600/20 text-slate-100 border-l-2 border-indigo-500' : 'hover:bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className={`font-mono font-bold ${isHighlighted ? 'text-indigo-400' : 'text-indigo-300 group-hover:text-indigo-400'} truncate`}>
                              {item.sku}
                            </span>
                            <span className="text-slate-400 text-[11px] truncate mt-0.5">
                              {item.name}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono shrink-0 uppercase tracking-widest border rounded px-1 ${
                            isHighlighted ? 'border-indigo-500/40 text-indigo-400 bg-indigo-500/5' : 'border-slate-800 text-slate-500 group-hover:border-indigo-500/20 group-hover:text-indigo-400'
                          }`}>
                            Select
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Warehouse
                </label>
                <select
                  value={adjWarehouse}
                  onChange={(e) => setAdjWarehouse(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                >
                  {warehouses.map(w => (
                    <option key={w.code} value={w.code}>{w.code} - {w.name}</option>
                  ))}
                  {warehouses.length === 0 && (
                    <option value="WH-MUT-01">WH-MUT-01 (Default)</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <div>
                 <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Quantity Adjustment Delta
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-w-[140px] h-[38px]">
                  <button
                    type="button"
                    onClick={() => setAdjQty(prev => prev - 5)}
                    className="px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border-r border-slate-800 h-full flex items-center justify-center select-none"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    required
                    value={adjQty}
                    onChange={(e) => setAdjQty(Number(e.target.value))}
                    className="w-full text-center bg-transparent border-0 focus:ring-0 outline-none px-1 text-xs font-mono text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjQty(prev => prev + 5)}
                    className="px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border-l border-slate-800 h-full flex items-center justify-center select-none"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                Audit/Correction Reason Description
              </label>
              <input
                type="text"
                required
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="e.g. Broken packaging / stock takeoff audit"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-650 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-slate-100 rounded-xl font-bold hover:bg-indigo-500 hover:shadow-indigo-500/10 hover:shadow-lg transition-all focus:outline-none"
              >
                Apply Direct Adjustment Sync
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'CANNIBAL' && (
        <div className="animate-fade-in">
          <CannibalView />
        </div>
      )}

      {/* Barcode scanner slide-over overlay */}
      {showScanner && (
        <BarcodeScanner
          onScanSuccess={(scannedSku) => {
            if (scannerTargetForm === 'adjust') {
              setAdjSku(scannedSku);
              setAdjQty(1);
            }
          }}
          onClose={() => {
            setShowScanner(false);
            setScannerTargetForm(null);
          }}
        />
      )}
    </div>
  );
};
