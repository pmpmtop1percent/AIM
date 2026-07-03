import React from 'react';
import { useWms } from '../context/WmsContext';
import { DollarSign, AlertTriangle, TrendingUp, Package, Compass, Layers, CheckCircle2, RefreshCcw } from 'lucide-react';
import { Currency } from '../types';

interface DashboardViewProps {
  onNavigateToStockList?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToStockList }) => {
  const {
    selectedCurrency,
    currencies,
    items,
    stocks,
    salesOrders,
    purchaseOrders,
    stockAlerts,
    userProfile
  } = useWms();

  const activeWarehouseFilter = 'ALL';

  // Helper utility to format raw prices with chosen currency
  const convertAndFormatPrice = (usdAmount: number) => {
    const amt = usdAmount * selectedCurrency.exchangeRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: selectedCurrency.code === 'IDR' ? 0 : 2,
      maximumFractionDigits: selectedCurrency.code === 'IDR' ? 0 : 2
    }).format(amt);
  };

  // 1. Calculate Warehouse Valuations
  const warehouseValuations: { [key: string]: number } = {};
  let totalValuationUsd = 0;

  stocks.forEach(stock => {
    const item = items.find(i => i.sku === stock.sku);
    const unitCost = item ? item.unitCost : 0;
    const valueUsd = stock.physicalQty * unitCost;

    if (activeWarehouseFilter === 'ALL' || stock.warehouseCode === activeWarehouseFilter) {
      totalValuationUsd += valueUsd;
    }

    if (!warehouseValuations[stock.warehouseCode]) {
      warehouseValuations[stock.warehouseCode] = 0;
    }
    warehouseValuations[stock.warehouseCode] += valueUsd;
  });

  // Calculate generic counts
  const totalStockItemsCount = stocks.reduce((acc, st) => {
    if (activeWarehouseFilter === 'ALL' || st.warehouseCode === activeWarehouseFilter) {
      return acc + (st.physicalQty - st.bookedQty);
    }
    return acc;
  }, 0);

  // Active Sales Order summary info
  const pendingSalesCount = salesOrders.filter(so => so.status === 'Draft' || so.status === 'Picking' || so.status === 'DeliveryApproval' || so.status === 'FullyDelivered').length;
  const fulfilledSalesCount = salesOrders.filter(so => so.status === 'Invoiced' || so.status === 'Paid').length;

  // Breakdown of sales orders by status
  const draftSoCount = salesOrders.filter(so => so.status === 'Draft').length;
  const pickingSoCount = salesOrders.filter(so => so.status === 'Picking').length;
  const approvalSoCount = salesOrders.filter(so => so.status === 'DeliveryApproval').length;
  const deliveredSoCount = salesOrders.filter(so => so.status === 'FullyDelivered').length;

  const totalSalesRevenueUsd = salesOrders
    .filter(so => so.status === 'Invoiced' || so.status === 'Paid')
    .reduce((acc, so) => {
      // SO.totalAmount and netAmount are locked in the SO currency, let's normalize back to USD or parse
      // Let's assume netAmount is saved in base transaction currency. Let's convert it to USD by dividing exchangeRate
      const orderUsd = so.netAmount / so.exchangeRate;
      return acc + orderUsd;
    }, 0);

  // Active Purchases summary info
  const pendingPurchasesCount = purchaseOrders.filter(po => po.status === 'Draft' || po.status === 'Released' || po.status === 'ReceiptAudit' || po.status === 'Discrepancy').length;

  // Render responsive SVG heights or charts
  const maxVal = Math.max(...Object.values(warehouseValuations), 1000);
  
  // Custom simple bar heights
  const sortedSalesOrders = [...salesOrders]
    .filter(so => so.status === 'Invoiced' || so.status === 'Paid')
    .slice(-5); // take 5

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      
      {/* Page Title Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            AIM Reporting Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Real-time stock valuation index, sales streams, and warehouse KPIs.
          </p>
        </div>
      </div>

      {/* Critical Stock Alerts banner if active */}
      {stockAlerts.filter(a => activeWarehouseFilter === 'ALL' || a.warehouseCode === activeWarehouseFilter).length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-350 shadow-inner">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse-slow" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-rose-200">
              Active Stock Notifications ({stockAlerts.filter(a => activeWarehouseFilter === 'ALL' || a.warehouseCode === activeWarehouseFilter).length})
            </h4>
            <p className="text-xs text-rose-400/90 mt-0.5 leading-relaxed">
              Certain segments have fallen below safety inventory margins. Open the alerts list to reconcile.
            </p>
          </div>
        </div>
      )}

      {/* Key Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Inventory Valuation cost based */}
        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-inner relative overflow-hidden group hover:border-slate-700/50 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest font-mono">
              Stock Valuation (Cost)
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {convertAndFormatPrice(totalValuationUsd)}
            </h3>
            <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Dynamic {selectedCurrency.code} conversion
            </p>
          </div>
        </div>

        {/* Total Available Inventory Units */}
        <div 
          onClick={onNavigateToStockList}
          className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-inner relative overflow-hidden group hover:border-sky-500/50 hover:bg-sky-950/5 transition-all cursor-pointer"
        >
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest font-mono flex items-center justify-between">
              <span>Available SOH Units</span>
              <span className="text-[10px] text-sky-400 group-hover:underline">View List →</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {totalStockItemsCount.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-450 mt-2 font-medium">
              Excluding committed booked sales
            </p>
          </div>
        </div>

        {/* Order-to-Cash pending processing queue */}
        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-inner relative overflow-hidden group hover:border-slate-700/50 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest font-mono">
              Pending Sales Orders
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {pendingSalesCount}
            </h3>
            <div className="mt-2 pt-1.5 border-t border-slate-800/60 space-y-0.5 text-[10px] text-slate-400 font-mono">
              {draftSoCount > 0 && <div>{draftSoCount} - Draft</div>}
              {pickingSoCount > 0 && <div>{pickingSoCount} - Picking</div>}
              {approvalSoCount > 0 && <div>{approvalSoCount} - Approval</div>}
              {deliveredSoCount > 0 && <div>{deliveredSoCount} - Delivered</div>}
              {draftSoCount === 0 && pickingSoCount === 0 && approvalSoCount === 0 && deliveredSoCount === 0 && (
                <div className="text-slate-500 italic">No pending orders</div>
              )}
            </div>
          </div>
        </div>

        {/* Procure-to-Pay queue */}
        <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl shadow-inner relative overflow-hidden group hover:border-slate-700/55 border-l-4 border-l-sky-500 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest font-mono">
              Inbound PO Audits
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {pendingPurchasesCount}
            </h3>
            <p className="text-[11px] text-slate-450 mt-2 font-medium">
              Awaiting Audit checkouts
            </p>
          </div>
        </div>
      </div>

      {/* Structured reporting bento dashboard grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Dynamic Valuation Share & low stocks - Left 7 spans */}
        <div className="lg:col-span-7 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 flex flex-col justify-between backdrop-blur-md shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider font-mono">
                Active Valuation distribution
              </h3>
              <span className="text-[10px] font-mono text-sky-400 hover:text-sky-300 transition-colors cursor-pointer tracking-wider font-semibold">
                Site Breakdown
              </span>
            </div>

            {/* Simulated custom bar graphs mapping actual valuations */}
            <div className="space-y-4">
              {Object.keys(warehouseValuations).map((whCode) => {
                const amountUsd = warehouseValuations[whCode];
                const pct = totalValuationUsd > 0 ? (amountUsd / totalValuationUsd) * 100 : 0;
                return (
                  <div key={whCode} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        <span className="font-semibold text-slate-300 font-mono">{whCode}</span>
                      </div>
                      <span className="text-slate-400 font-mono">
                        {convertAndFormatPrice(amountUsd)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(warehouseValuations).length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  No stock items seeded yet. Open Administration view and seed configurations.
                </div>
              )}
            </div>
          </div>

          {/* Quick interactive charts: Recent Sales Orders Trend */}
          <div>
            <h4 className="font-bold text-slate-400 text-[10px] uppercase font-mono tracking-widest mb-3">
              Historic Completed Sale Values ({selectedCurrency.code})
            </h4>
            <div className="h-28 flex items-end justify-between gap-1 px-4 border-b border-l border-slate-800/60 pt-2">
              {salesOrders.length === 0 ? (
                <div className="w-full text-center text-slate-600 text-xs py-8 italic">
                  No sales order records active.
                </div>
              ) : (
                salesOrders.slice(-6).map((so, i) => {
                  const saleValueUsd = so.netAmount / so.exchangeRate;
                  const ratio = Math.min(100, (saleValueUsd / 2000) * 100); // capped max ratio height
                  return (
                    <div key={so.id || i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full flex justify-center">
                        {/* Tooltip on hover */}
                        <div className="hidden group-hover:block absolute bottom-full mb-1 bg-slate-950 border border-slate-800 text-[10px] text-sky-450 font-mono py-1 px-2 rounded whitespace-nowrap z-10 shadow-xl">
                          {convertAndFormatPrice(saleValueUsd)}
                        </div>
                        <div 
                          className="w-10 bg-sky-500/20 group-hover:bg-sky-500/45 border-t border-sky-400 rounded-t-sm transition-all duration-300 shadow-[0_0_8px_rgba(14,165,233,0.1)]" 
                          style={{ height: `${Math.max(12, ratio)}px` }} 
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-550 uppercase tracking-widest line-clamp-1 truncate w-full text-center leading-none mt-1">
                        {so.soNumber?.replace(/^SO-\d{4}-/, '') || `#${i+1}`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Real-time stock alerts & KPI logs - Right 5 spans */}
        <div className="lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between backdrop-blur-md shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4.5">
              <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider font-mono">
                Real-Time Stock Alerts
              </h3>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded">
                CRITICAL MONITOR
              </span>
            </div>

            {/* List alerts */}
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {stockAlerts.filter(a => activeWarehouseFilter === 'ALL' || a.warehouseCode === activeWarehouseFilter).map((alt, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all outline-none ${
                    alt.severity === 'high' 
                      ? 'bg-rose-500/5 border-rose-500/20 text-rose-200' 
                      : 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alt.severity === 'high' ? 'text-rose-450 animate-pulse-slow' : 'text-amber-500'}`} />
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-slate-500">
                      {alt.warehouseCode}
                    </span>
                    <p className="text-xs leading-relaxed font-sans font-medium text-slate-200">
                      {alt.message}
                    </p>
                  </div>
                </div>
              ))}

              {stockAlerts.filter(a => activeWarehouseFilter === 'ALL' || a.warehouseCode === activeWarehouseFilter).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 space-y-2 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-400">Inventory Levels Secure</p>
                    <p className="text-[10px] text-slate-500">All available stocks satisfy safety thresholds.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick general KPIs */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/40 mt-4 space-y-2.5 text-xs">
            <h4 className="font-semibold text-slate-400 uppercase tracking-widest text-[9px] font-mono">
              Base Ledger Statistics (USD)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="flex flex-col">
                <span className="text-slate-500 text-[10px]">Fulfilled Revenue</span>
                <span className="font-mono text-slate-100 font-bold text-xs">
                  {convertAndFormatPrice(totalSalesRevenueUsd)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 text-[10px]">Total Master Items</span>
                <span className="font-mono text-slate-100 font-bold text-xs">
                  {items.length} SKUs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
