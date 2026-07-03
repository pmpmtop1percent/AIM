import React, { useState } from 'react';
import { useWms } from '../context/WmsContext';
import {
  ShieldAlert,
  ClipboardCheck,
  Plus,
  Lock,
  Unlock,
  AlertOctagon,
  FileText,
  UserCheck,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Warehouse
} from 'lucide-react';
import { StockOpname } from '../types';

export const OpnameView: React.FC = () => {
  const {
    stocks,
    warehouses,
    stockOpnames,
    createStockOpname,
    approveStockOpname,
    userProfile
  } = useWms();

  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [selectedOpname, setSelectedOpname] = useState<StockOpname | null>(null);

  // Creation state
  const [warehouseCode, setWarehouseCode] = useState('WH-MUT-01');
  const [segmentName, setSegmentName] = useState('ROW-A-SHELF-3');
  const [auditItems, setAuditItems] = useState<{ sku: string; systemQty: number; physicalQty: number; reason: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Supervisor explanation
  const [lossGainDesc, setLossGainDesc] = useState('Periodic warehouse compliance correction audit.');

  // Pre-fill target stock list based on selected segment or warehouse code
  const grabAvailableSectionStocks = () => {
    // Select items from stock matching target warehouse
    const matchStocks = stocks.filter(s => s.warehouseCode === warehouseCode);
    setAuditItems(matchStocks.map(s => ({
      sku: s.sku,
      systemQty: s.physicalQty,
      physicalQty: s.physicalQty, // prefill matching so user adjusts delta
      reason: 'Routine Annual Count Check'
    })));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (auditItems.length === 0) {
      setErrorMessage('Please pull stocks to audit first.');
      return;
    }

    try {
      await createStockOpname(warehouseCode, segmentName, auditItems);
      setAuditItems([]);
      setActiveTab('LIST');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred starting stock opname.');
    }
  };

  const handleApproveSubmit = async () => {
    if (!selectedOpname) return;
    setErrorMessage('');

    if (userProfile?.role !== 'admin' && userProfile?.role !== 'manager') {
      setErrorMessage('Access Denied: Auditors or Purchasing Officers cannot authorize stock opnames.');
      return;
    }

    try {
      await approveStockOpname(selectedOpname.id, lossGainDesc);
      setSelectedOpname(null);
    } catch (err: any) {
      setErrorMessage('Error writing opname balance update.');
    }
  };

  return (
    <div className="space-y-6 font-sans pb-10">
      
      {/* Tab Select Headings */}
      <div className="flex border-b border-slate-800 p-1 bg-slate-950 rounded-xl max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('LIST')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'LIST' ? 'bg-indigo-600 text-indigo-50 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Audits Record ({stockOpnames.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CREATE')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'CREATE' ? 'bg-indigo-600 text-indigo-50 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          Schedule Audit
        </button>
      </div>

      {/* Screen Renderings */}

      {/* TAB 1: LIST AUDITS */}
      {activeTab === 'LIST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Opname Document selection list */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider font-mono text-slate-500">
              Audit Registers Status
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {stockOpnames.map((op) => {
                const isSelected = selectedOpname?.id === op.id;
                return (
                  <div
                    key={op.id}
                    onClick={() => setSelectedOpname(op)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-950/20 border-indigo-500/70 shadow-[0_0_12px_rgba(99,102,241,0.15)] bg-indigo-950/40' 
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">
                          Segment: {op.segmentName}
                        </span>
                        <h4 className="font-mono text-xs font-bold text-slate-100">Voucher: {op.id}</h4>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        op.status === 'Lockdown' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' 
                          : op.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {op.status === 'Lockdown' ? 'Active Count' : op.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500 uppercase tracking-widest text-[9px] font-mono font-medium block">Site Location</span>
                        <span className="font-sans font-semibold text-slate-300">{op.warehouseCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase tracking-widest text-[9px] font-mono font-medium block">Checked By</span>
                        <span className="font-mono font-semibold text-indigo-305 truncate block">{op.checkedBy}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {stockOpnames.length === 0 && (
                <div className="py-12 bg-slate-900/10 border border-dashed border-slate-800/80 rounded-2xl text-center text-slate-500 italic text-xs">
                  No historical Stock Opname records active on Firestore. Schedule a lockdown audit above to begin.
                </div>
              )}
            </div>
          </div>

          {/* BALANCING UTILITY DISPLAY */}
          <div className="lg:col-span-7">
            {selectedOpname ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6">
                
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider">
                      Audit Balancing Control
                    </span>
                    <h3 className="font-mono font-extrabold text-slate-100 text-sm">
                      ID: {selectedOpname.id}
                    </h3>
                  </div>

                  <span className={`px-2 py-0.5 font-mono text-[10px] uppercase font-bold rounded ${
                    selectedOpname.status === 'Lockdown' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {selectedOpname.status}
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-250">
                    {errorMessage}
                  </div>
                )}

                {/* Audit Item list with discrepancy percentages */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-450">
                    SOH Discrepancy Matrix Checking
                  </h4>

                  <div className="divide-y divide-slate-800 overflow-y-auto max-h-56 pr-1">
                    {selectedOpname.itemsAudited.map((item) => {
                      const skewValue = item.discrepancyQty;
                      const hasDiscrepancy = skewValue !== 0;
                      // Variances > 5% alert trigger
                      const toleranceExceeded = Math.abs(item.discrepancyPct) > 5;

                      return (
                        <div key={item.sku} className="py-2.5 flex justify-between items-start text-xs">
                          <div className="space-y-0.5">
                            <span className="font-mono text-slate-200 font-bold">{item.sku}</span>
                            <div className="flex gap-2 text-[10px] text-slate-500 font-mono">
                              <span>System: {item.systemQty}</span>
                              <span className="text-indigo-400">Physical: {item.physicalQty}</span>
                            </div>
                          </div>

                          <div className="text-right space-y-0.5">
                            <span className={`font-mono font-bold font-mono text-xs ${
                              skewValue > 0 
                                ? 'text-emerald-400' 
                                : skewValue < 0 
                                ? 'text-rose-400' 
                                : 'text-slate-500'
                            }`}>
                              {skewValue > 0 ? '+' : ''}{skewValue} Delta ({item.discrepancyPct.toFixed(1)}%)
                            </span>
                            
                            {toleranceExceeded && (
                              <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-550/20 rounded block mt-0.5 animate-pulse">
                                Tolerance Exceeded (&gt;5%)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Supervisor explanation authorization panel */}
                {selectedOpname.status === 'Lockdown' && (
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-sans">
                        Supervisor Authorization and Balancing
                      </h4>
                    </div>

                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-mono text-slate-450 tracking-wider mb-1">
                          Reason / Loss‑Gain Description
                        </label>
                        <input
                          type="text"
                          required
                          value={lossGainDesc}
                          onChange={(e) => setLossGainDesc(e.target.value)}
                          placeholder="Provide explanation for write-off/surplus records."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-205 focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </div>

                      {userProfile?.role === 'admin' || userProfile?.role === 'manager' ? (
                        <button
                          type="button"
                          onClick={handleApproveSubmit}
                          className="w-full py-2.5 bg-indigo-600 text-slate-100 rounded-lg font-bold hover:bg-indigo-500 transition-all text-xs"
                        >
                          Approve, Release Lockdown & Auto‑Balance
                        </button>
                      ) : (
                        <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-[11px] text-red-300 flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <span className="font-bold font-mono text-[9px] uppercase text-red-200 block">Supervisor Role Mandate</span>
                            <p className="text-red-450">Simulated role ({userProfile?.role || 'Guest'}) lacks permissions to balance discrepancy adjustments.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Display audited metadata */}
                {selectedOpname.status === 'Approved' && (
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl text-xs font-mono space-y-2 text-slate-400">
                    <div className="flex justify-between">
                      <span>Inward Checked By</span>
                      <span className="text-slate-200">{selectedOpname.checkedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Approved By</span>
                      <span className="text-slate-202 italic">{selectedOpname.approvedBy}</span>
                    </div>
                    <div className="flex flex-col pt-1.5 border-t border-slate-800 text-left">
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Loss/Gain Record Memo</span>
                      <p className="mt-1 text-slate-200 leading-relaxed font-sans font-medium text-[11px]">"{selectedOpname.lossGainDescription}"</p>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full bg-slate-900/10 border border-dashed border-slate-800/80 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3">
                <ClipboardCheck className="w-10 h-10 text-slate-655 animate-pulse" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-300">Audits Inspection Hub</h4>
                  <p className="text-slate-505 text-xs max-w-xs leading-relaxed">
                    Select an active opname document to lock warehouse segments in buffer, execute discrepancy formula checking, and launch balancing adjustments.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: SCHEDULE BRAND NEW AUDIT */}
      {activeTab === 'CREATE' && (
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-100 text-lg">Schedule Section Audit (Lockdown)</h3>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-250">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Choose Audit Warehouse Code
                </label>
                <select
                  required
                  value={warehouseCode}
                  onChange={(e) => setWarehouseCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none text-sm"
                >
                  {warehouses.map(w => (
                    <option key={w.code} value={w.code}>{w.code} - {w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Segment Sector
                </label>
                <input
                  type="text"
                  required
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value.toUpperCase())}
                  placeholder="e.g. ROW-B-LEVEL-1"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none text-sm font-mono"
                />
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={grabAvailableSectionStocks}
                className="px-4 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-550/20 rounded-xl hover:bg-indigo-650/20 text-xs font-semibold select-none cursor-pointer"
              >
                Scan Segment & Pull Active Stock Registers
              </button>
            </div>

            {/* Audit Input Matrices */}
            {auditItems.length > 0 && (
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-400">
                  Input Physical Counts
                </h4>

                <div className="divide-y divide-slate-800 pr-1 max-h-48 overflow-y-auto">
                  {auditItems.map((itm, i) => (
                    <div key={itm.sku} className="py-2.5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-mono text-slate-205 font-bold">{itm.sku}</span>
                        <p className="text-[10px] text-slate-500">System SOH: {itm.systemQty} Units</p>
                      </div>

                      <div className="flex gap-2 items-center">
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden focus-within:border-indigo-500/60 transition-all h-[32px] w-[110px]">
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...auditItems];
                              copy[i].physicalQty = (copy[i].physicalQty || 0) + 1;
                              setAuditItems(copy);
                            }}
                            className="px-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border-r border-slate-850 h-full font-bold select-none text-xs"
                          >
                            +
                          </button>
                          <input
                            type="number"
                            required
                            placeholder="Phys"
                            value={itm.physicalQty}
                            onChange={(e) => {
                              const copy = [...auditItems];
                              copy[i].physicalQty = Number(e.target.value);
                              setAuditItems(copy);
                            }}
                            className="w-full text-center bg-transparent border-0 focus:ring-0 outline-none px-0.5 font-mono text-slate-100 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...auditItems];
                              copy[i].physicalQty = Math.max(0, (copy[i].physicalQty || 0) - 1);
                              setAuditItems(copy);
                            }}
                            className="px-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border-l border-slate-850 h-full font-bold select-none text-xs"
                          >
                            -
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Verification remark"
                          value={itm.reason}
                          onChange={(e) => {
                            const copy = [...auditItems];
                            copy[i].reason = e.target.value;
                            setAuditItems(copy);
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={auditItems.length === 0}
              className="w-full py-3 bg-rose-600 disabled:bg-slate-800 disabled:text-slate-550 text-slate-100 rounded-xl font-bold hover:bg-rose-500 transition-all text-xs"
            >
              Initiate Segment Lockdown & counts
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
