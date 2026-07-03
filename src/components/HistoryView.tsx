import React, { useState, useMemo } from 'react';
import { useWms } from '../context/WmsContext';
import { 
  History, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw, 
  Filter, 
  TrendingUp, 
  Activity, 
  Database,
  Calendar
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const {
    items,
    stockMovements,
    warehouses,
    selectedCurrency
  } = useWms();

  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  const convertAndFormatPrice = (usdAmount: number) => {
    const amt = usdAmount * selectedCurrency.exchangeRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: selectedCurrency.code === 'IDR' ? 0 : 2
    }).format(amt);
  };

  // Filtered and sorted movements
  const processedMovements = useMemo(() => {
    let result = [...stockMovements];

    // Filter by search query (SKU, reference voucher, bin, rack, etc.)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(m => 
        m.sku.toLowerCase().includes(query) ||
        (m.referenceVoucher || '').toLowerCase().includes(query) ||
        (m.userEmail || '').toLowerCase().includes(query)
      );
    }

    // Filter by site code
    if (warehouseFilter !== 'ALL') {
      result = result.filter(m => m.warehouseCode === warehouseFilter);
    }

    // Filter by movement type
    if (typeFilter !== 'ALL') {
      result = result.filter(m => {
        if (typeFilter === 'INBOUND') return m.quantityDelta > 0;
        if (typeFilter === 'OUTBOUND') return m.quantityDelta < 0;
        
        // Exact match
        return m.movementType?.toLowerCase() === typeFilter.toLowerCase();
      });
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0).getTime();
      const dateB = new Date(b.timestamp || 0).getTime();
      return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [stockMovements, searchQuery, warehouseFilter, typeFilter, sortBy]);

  // Statistics calculation
  const stats = useMemo(() => {
    let inboundCount = 0;
    let outboundCount = 0;
    let totalValue = 0;

    processedMovements.forEach(m => {
      if (m.quantityDelta > 0) {
        inboundCount += m.quantityDelta;
      } else {
        outboundCount += Math.abs(m.quantityDelta);
      }
      totalValue += Math.abs(m.quantityDelta) * (m.cost || 0);
    });

    return {
      totalTransactions: processedMovements.length,
      inboundCount,
      outboundCount,
      totalVolumeCost: totalValue
    };
  }, [processedMovements]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header section with Stats in visual Bento Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            Stock Movement History Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time auditable pipeline ledger logging item transits, inbound receipts, and dispatch adjustments.
          </p>
        </div>
        
        {/* Reset Filters Shortcut */}
        {(searchQuery || warehouseFilter !== 'ALL' || typeFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setWarehouseFilter('ALL');
              setTypeFilter('ALL');
            }}
            className="self-start md:self-auto py-1 px-3 bg-slate-900 border border-slate-800 text-[11px] text-indigo-400 hover:text-indigo-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-3 h-3" />
            Clear Active Filters
          </button>
        )}
      </div>

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-indigo-400" /> Ledger Audits
          </span>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-slate-100 font-sans">
              {stats.totalTransactions}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Logged Entries</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Inbound Delta
          </span>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-emerald-400 font-sans">
              +{stats.inboundCount}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Received stock items</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" /> Outbound Delta
          </span>
          <div className="mt-2.5">
            <div className="text-2xl font-bold text-rose-400 font-sans">
              -{stats.outboundCount}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Dispatched stock items</p>
          </div>
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Ledger Valuations
          </span>
          <div className="mt-2.5">
            <div className="text-xl sm:text-2xl font-bold text-sky-450 font-sans truncate">
              {convertAndFormatPrice(stats.totalVolumeCost)}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Gross ledger turn</p>
          </div>
        </div>
      </div>

      {/* Audit Controls & Filters bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, Voucher, or operator email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 font-sans"
          />
        </div>

        {/* Filter Dropdowns on single row / screen fitted */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Site Selection */}
          <div className="flex items-center gap-1.5 pl-1">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Sites</option>
              {warehouses.map(w => (
                <option key={w.code} value={w.code}>{w.code}</option>
              ))}
            </select>
          </div>

          {/* Type selection */}
          <div className="flex items-center gap-1.5 pl-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="INBOUND">Inbound Receipts</option>
              <option value="OUTBOUND">Outbound Dispatches</option>
              <option value="Adjustment">Direct Adjustments</option>
              <option value="Cannibalization">Cannibalization</option>
            </select>
          </div>

          {/* Sort Option */}
          <div className="flex items-center gap-1.5 pl-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/40 shadow-sm backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/45 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-4 font-semibold">Timestamp</th>
              <th className="py-3.5 px-4 font-semibold">Item SKU</th>
              <th className="py-3.5 px-4 font-semibold">Warehouse / Site</th>
              <th className="py-3.5 px-4 font-semibold">Voucher / Ticket</th>
              <th className="py-3.5 px-4 font-semibold">Movement Category</th>
              <th className="py-3.5 px-4 font-semibold text-right">Delta Qty</th>
              <th className="py-3.5 px-4 font-semibold text-right">Cost Value</th>
              <th className="py-3.5 px-4 font-semibold">Performed By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs text-slate-200">
            {processedMovements.map((move) => {
              const itemMatch = items.find(i => i.sku === move.sku);
              const isPositive = move.quantityDelta > 0;
              return (
                <tr key={move.id} className="hover:bg-slate-855/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(move.timestamp || '').toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-indigo-300">{move.sku}</span>
                      {itemMatch && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{itemMatch.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                    {move.warehouseCode}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {move.referenceVoucher}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold tracking-wider ${
                      move.quantityDelta > 0 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : move.quantityDelta < 0
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {move.movementType || (move.quantityDelta > 0 ? 'Inbound' : 'Outbound')}
                    </span>
                  </td>
                  <td className={`py-3.5 px-4 font-mono font-bold text-right text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPositive ? '+' : ''}{move.quantityDelta}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-right text-slate-300 text-[11px]">
                    {convertAndFormatPrice(Math.abs(move.quantityDelta) * (move.cost || 0))}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 max-w-[140px] truncate" title={move.userEmail}>
                    {move.userEmail?.split('@')[0]}
                  </td>
                </tr>
              );
            })}

            {processedMovements.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 italic font-mono text-[11px]">
                  No matching ledger history entries found. Check your search query or active filter selections.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
