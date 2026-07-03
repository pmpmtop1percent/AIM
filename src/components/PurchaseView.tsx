import React, { useState } from 'react';
import { useWms } from '../context/WmsContext';
import {
  FileCode,
  Truck,
  AlertTriangle,
  BadgeCheck,
  CheckCircle,
  HelpCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Warehouse,
  ShoppingBag,
  Coins,
  ShieldAlert,
  Edit2,
  Search
} from 'lucide-react';
import { PurchaseOrder, ReceiptItem } from '../types';

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

export const PurchaseView: React.FC = () => {
  const {
    vendors,
    items,
    purchaseOrders,
    selectedCurrency,
    currencies,
    createPurchaseOrder,
    updatePurchaseOrder,
    updatePurchaseOrderStatus,
    userProfile
  } = useWms();

  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  // Listing filter and search state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Creation State
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [poCurrency, setPoCurrency] = useState('USD');
  const [poItems, setPoItems] = useState<{ sku: string; quantity: number; cost: number }[]>([]);

  // Ref to prevent catalog lookup pricing override when picking line items to edit details
  const editingSkuRef = React.useRef<string | null>(null);

  // Item additions state
  const [selSku, setSelSku] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const suggestions = React.useMemo(() => {
    if (!selSku.trim()) return [];
    const query = selSku.toLowerCase().trim();
    return items
      .filter(item => item.sku.toLowerCase().includes(query) || item.name.toLowerCase().includes(query))
      .slice(0, 5);
  }, [items, selSku]);

  const filteredPurchaseOrders = React.useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !term || 
        po.poNumber.toLowerCase().includes(term) || 
        po.vendorName.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [purchaseOrders, statusFilter, searchTerm]);

  React.useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [selSku, showSuggestions]);

  const [selQty, setSelQty] = useState<number>(1);
  const [selCost, setSelCost] = useState<number | "">(0);
  const [errorMessage, setErrorMessage] = useState('');

  const activePoCurrency = React.useMemo(() => {
    return currencies?.find(c => c.code === poCurrency) || { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1.0 };
  }, [currencies, poCurrency]);

  const getRupiahReference = (amountInPoCurrency: number) => {
    const idrRate = currencies?.find(c => c.code === 'IDR')?.exchangeRate || 16000;
    if (activePoCurrency.code === 'IDR') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amountInPoCurrency);
    }
    const valInUsd = amountInPoCurrency / activePoCurrency.exchangeRate;
    const valInIdr = valInUsd * idrRate;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(valInIdr);
  };

  // Audit Arrival checklist states
  const [auditQuantities, setAuditQuantities] = useState<{
    [sku: string]: { accepted: number; damaged: number; incorrectItem: number; notes: string }
  }>({});

  React.useEffect(() => {
    if (editingSkuRef.current === selSku) {
      return;
    }
    editingSkuRef.current = null;
    const matched = items.find(i => i.sku === selSku);
    if (matched) {
      setSelCost(matched.unitCost * activePoCurrency.exchangeRate);
    }
  }, [selSku, items, activePoCurrency]);

  // Pre-fill audit fields when PO changes
  React.useEffect(() => {
    if (selectedPo) {
      const initialAudits: typeof auditQuantities = {};
      selectedPo.items.forEach(itm => {
        // Find if old records exist, else set standard values matching expected qty
        const existingAudit = selectedPo.receiptItems?.find(r => r.sku === itm.sku);
        initialAudits[itm.sku] = {
          accepted: existingAudit ? existingAudit.quantityAccepted : itm.quantity,
          damaged: existingAudit ? existingAudit.quantityDamaged : 0,
          incorrectItem: existingAudit ? existingAudit.quantityIncorrectSKU : 0,
          notes: existingAudit ? existingAudit.notes : 'Passed inspection.'
        };
      });
      setAuditQuantities(initialAudits);
    }
  }, [selectedPo]);

  // Sync selectedPo live when purchaseOrders list updates externally (e.g. status change)
  React.useEffect(() => {
    if (selectedPo) {
      const match = purchaseOrders.find(po => po.id === selectedPo.id);
      if (match && JSON.stringify(match) !== JSON.stringify(selectedPo)) {
        setSelectedPo(match);
      }
    }
  }, [purchaseOrders, selectedPo]);

  const convertAndFormatPrice = (usdAmount: number, overrideRate?: number, overrideCode?: string) => {
    const rate = overrideRate || selectedCurrency.exchangeRate;
    const code = overrideCode || selectedCurrency.code;
    const amt = usdAmount * rate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'IDR' ? 0 : 2,
      maximumFractionDigits: code === 'IDR' ? 0 : 2
    }).format(amt);
  };

  const calculateFormTotal = () => {
    return poItems.reduce((acc, it) => acc + (it.quantity * it.cost), 0);
  };

  const addItemToPoList = () => {
    setErrorMessage('');
    if (!selSku) return;

    const finalCost = typeof selCost === 'number' ? selCost : 0;
    const existingIndex = poItems.findIndex(pi => pi.sku === selSku);
    if (existingIndex > -1) {
      const copy = [...poItems];
      copy[existingIndex].quantity += selQty;
      copy[existingIndex].cost = finalCost;
      setPoItems(copy);
    } else {
      setPoItems([...poItems, { sku: selSku, quantity: selQty, cost: finalCost }]);
    }

    setSelSku('');
    setSelQty(1);
    setSelCost(0);
  };

  const removeItemFromPoList = (sku: string) => {
    setPoItems(poItems.filter(pi => pi.sku !== sku));
  };

  const editItemInPoList = (pi: { sku: string; quantity: number; cost: number }) => {
    editingSkuRef.current = pi.sku;
    setSelSku(pi.sku);
    setSelQty(pi.quantity);
    setSelCost(pi.cost);
    setPoItems(poItems.filter(item => item.sku !== pi.sku));
  };

  const handleEditPo = (po: PurchaseOrder) => {
    setEditingPoId(po.id);
    setVendorId(po.vendorId);
    setPoDate(po.date || new Date().toISOString().split('T')[0]);
    setPoCurrency(po.currency || 'USD');
    setPoItems(po.items.map(pi => ({
      sku: pi.sku,
      quantity: pi.quantity,
      cost: pi.cost
    })));
    setActiveTab('CREATE');
  };

  const handleCreatePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!vendorId) {
      setErrorMessage('Please select a certified vendor partner.');
      return;
    }
    if (poItems.length === 0) {
      setErrorMessage('Please add items to purchase order container.');
      return;
    }

    const vendMatch = vendors.find(v => v.id === vendorId);

    try {
      const payloadData = {
        vendorId,
        vendorName: vendMatch ? vendMatch.name : vendorId,
        date: poDate,
        currency: poCurrency,
        exchangeRate: activePoCurrency.exchangeRate,
        items: poItems.map(pi => {
          const matchedItem = items.find(i => i.sku === pi.sku);
          return {
            sku: pi.sku,
            name: matchedItem ? matchedItem.name : pi.sku,
            quantity: pi.quantity,
            cost: pi.cost,
            subtotal: pi.quantity * pi.cost
          };
        }),
        totalAmount: calculateFormTotal()
      };

      if (editingPoId) {
        await updatePurchaseOrder(editingPoId, payloadData);
        if (selectedPo && selectedPo.id === editingPoId) {
          setSelectedPo({
            ...selectedPo,
            ...payloadData
          } as PurchaseOrder);
        }
        setEditingPoId(null);
      } else {
        const uniqueIdNum = Math.floor(10000 + Math.random() * 90000);
        const poNumber = `PO-2026-${uniqueIdNum}`;
        await createPurchaseOrder({
          poNumber,
          ...payloadData
        });
      }

      // Reset
      setVendorId('');
      setPoCurrency('USD');
      setPoItems([]);
      setActiveTab('LIST');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during Firestore write.');
    }
  };

  const handleAuditSubmit = async () => {
    if (!selectedPo) return;
    setErrorMessage('');

    // Classify Audit entries
    const receiptList: ReceiptItem[] = selectedPo.items.map(itm => {
      const aud = auditQuantities[itm.sku] || { accepted: itm.quantity, damaged: 0, incorrectItem: 0, notes: '' };
      return {
        sku: itm.sku,
        quantityExpected: itm.quantity,
        quantityAccepted: Number(aud.accepted),
        quantityDamaged: Number(aud.damaged),
        quantityIncorrectSKU: Number(aud.incorrectItem),
        notes: aud.notes || 'Inward cargo check completed.'
      };
    });

    try {
      await updatePurchaseOrderStatus(selectedPo.id, 'ReceiptAudit', receiptList);
    } catch (err: any) {
      setErrorMessage('Error writing Receipt audit records');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Tab Select Headings */}
      <div className="flex border-b border-slate-800 p-1 bg-slate-950 rounded-xl max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('LIST')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'LIST' ? 'bg-indigo-600 text-indigo-50 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          Purchasing Log
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CREATE')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'CREATE' ? 'bg-indigo-600 text-indigo-50 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          Draft Brand PO
        </button>
      </div>

      {/* Screen RenderINGS */}

      {/* TAB 1: LIST REVIEWS */}
      {activeTab === 'LIST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PO List Selection */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 text-xs font-sans uppercase tracking-widest text-slate-500">
                Purchase Orders ({filteredPurchaseOrders.length})
              </h3>
            </div>

            {/* Filter Buttons (Placed before search box) */}
            <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'Draft', value: 'Draft' },
                { label: 'Released', value: 'Released' },
                { label: 'Discrep', value: 'Discrepancy' },
                { label: 'Approved', value: 'Approved' }
              ].map((opt) => {
                const isActive = statusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatusFilter(opt.value)}
                    className={`py-1.5 px-0.5 rounded-lg text-center font-medium transition-all text-[9px] sm:text-xs select-none cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-slate-100 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Search Control */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search PO # or vendor..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500/80 transition-all"
              />
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredPurchaseOrders.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-800/85 text-center text-slate-500 text-xs">
                  No purchase orders found matching criteria.
                </div>
              ) : (
                filteredPurchaseOrders.map((po) => {
                  const isSelected = selectedPo?.id === po.id;
                return (
                  <div
                    key={po.id}
                    onClick={() => setSelectedPo(po)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-950/20 border-indigo-500/70 shadow-[0_0_12px_rgba(99,102,241,0.15)] bg-indigo-950/40' 
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold">
                          Date: {po.date}
                        </span>
                        <h4 className="font-mono text-xs font-bold text-slate-100">{po.poNumber}</h4>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        po.status === 'Draft' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : po.status === 'Released'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : po.status === 'Discrepancy'
                          ? 'bg-rose-500/10 text-rose-450 border border-rose-500/25 animate-pulse'
                          : po.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-405 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {po.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-500 uppercase tracking-widest text-[9px] font-mono font-medium block">Vendor</span>
                        <span className="font-sans font-semibold text-slate-300">{po.vendorName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase tracking-widest text-[9px] font-mono font-medium block">Total value</span>
                        <span className="font-mono font-semibold text-indigo-300">
                          {convertAndFormatPrice(po.totalAmount, 1.0, po.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* ACTIVE PO WORKFLOW DETAIL DISPLAY */}
          <div className="lg:col-span-7">
            {selectedPo ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6">
                
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-450 uppercase tracking-wider">
                      P2P Procurement Hub
                    </span>
                    <h3 className="font-mono font-extrabold text-slate-100 text-base">
                      {selectedPo.poNumber}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Acquisition Cost</span>
                    <span className="font-mono text-sm font-bold text-indigo-400">
                      {convertAndFormatPrice(selectedPo.totalAmount, 1.0, selectedPo.currency || 'USD')}
                    </span>
                  </div>
                </div>

                {/* Status-specific action block */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-indigo-400 animate-pulse" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Active Cargo Operations status: {selectedPo.status}
                    </h4>
                  </div>

                  {selectedPo.status === 'Draft' && (
                    <div className="space-y-3 text-xs leading-relaxed">
                      <p className="text-slate-400">
                        This PO is in **Draft**. Send it to the vendor partner to release the cargo dispatch.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditPo(selectedPo)}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/85 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit Draft Details
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePurchaseOrderStatus(selectedPo.id, 'Released')}
                          className="flex-1 py-2 bg-indigo-600 text-slate-100 rounded-lg font-bold hover:bg-indigo-500 transition-all text-xs cursor-pointer"
                        >
                          Release Purchase Record
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedPo.status === 'Released' && (
                    <div className="space-y-4">
                      <p className="text-slate-450 text-xs">
                        Cargo has arrived! Execute **Receipt Audit** below by ticking quantities to cross check expected balances.
                      </p>

                      {/* Receipt audit fields */}
                      <div className="space-y-3 max-h-56 overflow-y-auto">
                        {selectedPo.items.map((itm) => {
                          const aud = auditQuantities[itm.sku] || { accepted: itm.quantity, damaged: 0, incorrectItem: 0, notes: '' };
                          return (
                            <div key={itm.sku} className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-2.5 text-xs">
                              <div className="flex justify-between font-mono font-bold text-slate-200">
                                <span>{itm.sku}</span>
                                <span className="text-slate-500">Expected: {itm.quantity}x</span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 text-[10px]">
                                <div>
                                  <label className="text-slate-450 uppercase block font-mono mb-1">Accepted</label>
                                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded overflow-hidden focus-within:border-indigo-500/60 h-[28px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = { ...auditQuantities };
                                        copy[itm.sku].accepted = Math.max(0, (copy[itm.sku].accepted || 0) - 1);
                                        setAuditQuantities(copy);
                                      }}
                                      className="px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-455 hover:text-slate-220 transition-colors border-r border-slate-850 h-full font-bold select-none text-[10px]"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={aud.accepted}
                                      onChange={(e) => {
                                        const copy = { ...auditQuantities };
                                        copy[itm.sku].accepted = Number(e.target.value);
                                        setAuditQuantities(copy);
                                      }}
                                      className="w-full text-center bg-transparent border-0 focus:ring-0 outline-none px-0.5 font-mono text-slate-155 text-[10px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = { ...auditQuantities };
                                        copy[itm.sku].accepted = (copy[itm.sku].accepted || 0) + 1;
                                        setAuditQuantities(copy);
                                      }}
                                      className="px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-455 hover:text-slate-220 transition-colors border-l border-slate-850 h-full font-bold select-none text-[10px]"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-slate-450 uppercase block font-mono mb-1">Damaged</label>
                                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded overflow-hidden focus-within:border-indigo-500/60 h-[28px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = { ...auditQuantities };
                                        copy[itm.sku].damaged = Math.max(0, (copy[itm.sku].damaged || 0) - 1);
                                        setAuditQuantities(copy);
                                      }}
                                      className="px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-450 hover:text-slate-200 transition-colors border-r border-slate-850 h-full font-bold select-none text-[10px]"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={aud.damaged}
                                      onChange={(e) => {
                                        const copy = { ...auditQuantities };
                                        copy[itm.sku].damaged = Number(e.target.value);
                                        setAuditQuantities(copy);
                                      }}
                                      className="w-full text-center bg-transparent border-0 focus:ring-0 outline-none px-0.5 font-mono text-rose-455 text-[10px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = { ...auditQuantities };
                                        copy[itm.sku].damaged = (copy[itm.sku].damaged || 0) + 1;
                                        setAuditQuantities(copy);
                                      }}
                                      className="px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-455 hover:text-slate-220 transition-colors border-l border-slate-850 h-full font-bold select-none text-[10px]"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-slate-450 uppercase block font-mono mb-1">Incorrect SKU</label>
                                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded overflow-hidden focus-within:border-indigo-500/60 h-[28px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = { ...auditQuantities };
                                        copy[itm.sku].incorrectItem = Math.max(0, (copy[itm.sku].incorrectItem || 0) - 1);
                                        setAuditQuantities(copy);
                                      }}
                                      className="px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-450 hover:text-slate-200 transition-colors border-r border-slate-850 h-full font-bold select-none text-[10px]"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={aud.incorrectItem}
                                      onChange={(e) => {
                                        const copy = { ...auditQuantities };
                                        copy[itm.sku].incorrectItem = Number(e.target.value);
                                        setAuditQuantities(copy);
                                      }}
                                      className="w-full text-center bg-transparent border-0 focus:ring-0 outline-none px-0.5 font-mono text-rose-455 text-[10px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = { ...auditQuantities };
                                        copy[itm.sku].incorrectItem = (copy[itm.sku].incorrectItem || 0) + 1;
                                        setAuditQuantities(copy);
                                      }}
                                      className="px-1.5 bg-slate-900 hover:bg-slate-800 text-slate-455 hover:text-slate-220 transition-colors border-l border-slate-850 h-full font-bold select-none text-[10px]"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={handleAuditSubmit}
                        className="w-full py-2.5 bg-indigo-650 text-slate-100 rounded-lg font-bold hover:bg-indigo-500 transition-all text-xs"
                      >
                        Submit Receipt Audit Check
                      </button>
                    </div>
                  )}

                  {selectedPo.status === 'Discrepancy' && (
                    <div className="space-y-4">
                      {/* Warning alerts */}
                      <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-red-300 flex items-start gap-2 text-xs">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <span className="font-mono font-bold block uppercase text-[10px]">Variance Discrepancy Alert</span>
                          <p className="mt-0.5 text-red-400">Accepted count diverges from expected vendor billing quotas. Locked under review.</p>
                        </div>
                      </div>

                      <p className="text-slate-400 text-xs">
                        Only Warehouse managers or system administrators hold permissions to override discrepancy logs and execute ledger integration.
                      </p>

                      {userProfile?.role === 'admin' || userProfile?.role === 'manager' ? (
                        <button
                          type="button"
                          onClick={() => updatePurchaseOrderStatus(selectedPo.id, 'Approved')}
                          className="w-full py-2 px-4 bg-emerald-600 text-slate-100 rounded-lg font-bold hover:bg-emerald-505 transition-all text-xs"
                        >
                          Manual Supervisor Sign‑Off & Inward Into Stock
                        </button>
                      ) : (
                        <div className="p-3 bg-slate-900 border border-slate-805 rounded-xl text-center text-slate-500 text-xs italic">
                          Awaiting Supervisor authentication keys to override lock.
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPo.status === 'Approved' && (
                    <div className="space-y-2 text-xs text-center py-4">
                      <BadgeCheck className="w-8 h-8 text-emerald-450 mx-auto" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-100">PO Audited & Inwarded Successfully</p>
                        <p className="text-slate-450">Stock balances increased in WH-MUT-01 HQ.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* List items matrices */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-450">
                    Voucher Purchase Ledger list
                  </h4>
                  <div className="divide-y divide-slate-800 border-t border-slate-800 max-h-40 overflow-y-auto pr-1">
                    {selectedPo.items.map((itm) => (
                      <div key={itm.sku} className="py-2.5 flex justify-between items-center text-xs text-slate-350">
                        <div className="space-y-0.5">
                          <span className="font-mono text-slate-205 font-bold">{itm.sku}</span>
                          <p className="text-[10px] text-slate-500">Scheduled: {itm.quantity}x</p>
                        </div>
                        <span className="font-mono text-slate-400">
                          {convertAndFormatPrice(itm.cost, 1.0, selectedPo.currency || 'USD')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full bg-slate-900/10 border border-dashed border-slate-850 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-650 animate-pulse" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-300">Procure-to-Pay Workspace</h4>
                  <p className="text-slate-505 text-xs max-w-xs leading-relaxed">
                    Select a PO folder element to trigger inward audits, handle item damages, check expected SKUs, and sync physical stock ledgers.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: CREATE BRAND NEW CHRONIC PO */}
      {activeTab === 'CREATE' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-100 text-lg">
                {editingPoId ? 'Edit Draft Purchase Order' : 'Draft Brand Purchase Order'}
              </h3>
            </div>
            {editingPoId && (
              <button
                type="button"
                onClick={() => {
                  setEditingPoId(null);
                  setVendorId('');
                  setPoCurrency('USD');
                  setPoItems([]);
                  setActiveTab('LIST');
                }}
                className="text-[11px] font-mono text-rose-450 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer grow-0 shrink-0"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-250 font-sans leading-relaxed">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreatePoSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Vendor Selector */}
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Certified Vendor
                </label>
                <select
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="">-- Select Vendor OEM --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.id} - {v.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Purchase Date */}
                <div>
                  <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                    Drafting Date
                  </label>
                  <input
                    type="date"
                    required
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-150 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                {/* Transaction Currency */}
                <div>
                  <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                    Currency
                  </label>
                  <select
                    required
                    value={poCurrency}
                    onChange={(e) => setPoCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    {currencies?.map(c => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Matrix assembler */}
            <div className="bg-slate-950 rounded-2xl border border-slate-850 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-400">
                Append Items to PO Cargo Container
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="relative sm:col-span-5">
                  <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-450 mb-1.5">
                    Select Product SKU
                  </label>
                  <input
                    type="text"
                    value={selSku}
                    onChange={(e) => {
                      setSelSku(e.target.value);
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
                          setSelSku(suggestions[activeSuggestionIndex].sku);
                          setShowSuggestions(false);
                        }
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }}
                    placeholder="Type Item Sku..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                    autoComplete="off"
                  />

                  {/* Autocomplete active suggestion option selection overlay */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-900/65 font-sans max-h-48 overflow-y-auto">
                      {suggestions.map((item, idx) => {
                        const isHighlighted = idx === activeSuggestionIndex;
                        return (
                          <button
                            key={item.sku}
                            type="button"
                            onMouseDown={() => {
                              setSelSku(item.sku);
                              setShowSuggestions(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-[11px] transition-colors flex items-center justify-between cursor-pointer group ${
                              isHighlighted ? 'bg-indigo-600/20 text-slate-100 border-l-2 border-indigo-500' : 'hover:bg-slate-900/60 text-slate-300'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className={`font-mono font-bold ${isHighlighted ? 'text-indigo-400' : 'text-indigo-300 group-hover:text-indigo-400'} truncate`}>
                                {item.sku}
                              </span>
                              <span className="text-slate-400 text-[10px] truncate mt-0.5">
                                {item.name}
                              </span>
                            </div>
                            <span className={`text-[9px] font-mono shrink-0 uppercase tracking-widest border rounded px-1.5 py-0.5 ${
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

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-450 mb-1.5">
                    Wholesale Qty
                  </label>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500/60 transition-all h-[36px] w-full">
                    <button
                      type="button"
                      onClick={() => setSelQty(Math.max(1, selQty - 1))}
                      className="w-6 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border-r border-slate-850 h-full flex items-center justify-center select-none shrink-0"
                      title="Decrease Quantity"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={selQty}
                      onChange={(e) => setSelQty(Math.max(1, Number(e.target.value)))}
                      className="w-full text-center bg-transparent border-0 focus:ring-0 outline-none px-0.5 text-xs font-mono text-slate-150"
                    />
                    <button
                      type="button"
                      onClick={() => setSelQty(selQty + 1)}
                      className="w-6 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border-l border-slate-850 h-full flex items-center justify-center select-none shrink-0"
                      title="Increase Quantity"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-450 mb-1.5">
                    Unit Purchase Price ({poCurrency})
                  </label>
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500/60 transition-all h-[36px] w-full">
                    <span className="pl-3 pr-1 text-slate-500 font-mono text-xs select-none">{activePoCurrency.symbol}</span>
                    <input
                      type="text"
                      placeholder="Price"
                      value={formatThousandDots(selCost === 0 || selCost === "" ? "" : selCost)}
                      onChange={(e) => {
                        const parsed = parseThousandDots(e.target.value);
                        setSelCost(parsed);
                      }}
                      onBlur={() => {
                        if (selCost === "") setSelCost(0);
                      }}
                      className="w-full bg-transparent border-0 focus:ring-0 outline-none pr-3 font-mono text-xs text-slate-150"
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <span>≈ {getRupiahReference(Number(selCost) || 0)}</span>
                    <span className="text-[9px] text-slate-600">(Google Finance IDR)</span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={addItemToPoList}
                    className="w-full h-[36px] bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold rounded-xl transition-all text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Register
                  </button>
                </div>
              </div>

              {/* Bento cards of loaded items */}
              {poItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pt-2">
                  {poItems.map((pi) => {
                    const matchedItem = items.find(i => i.sku === pi.sku);
                    const itemName = matchedItem ? matchedItem.name : 'Unknown Item';
                    return (
                      <div 
                        key={pi.sku} 
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-705 transition-all space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 min-w-0">
                            {/* Item Code (SKU) */}
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/15 inline-block">
                              {pi.sku}
                            </span>
                            {/* Item Name */}
                            <h5 className="text-slate-200 font-medium text-xs font-sans truncate pr-1" title={itemName}>
                              {itemName}
                            </h5>
                          </div>
                        </div>

                        {/* Middle Qty and Price info */}
                        <div className="grid grid-cols-2 gap-2 border-t border-slate-950 pt-2.5 font-mono text-[11px] leading-snug">
                          <div>
                            <span className="text-slate-500 block uppercase text-[8px] tracking-wider font-bold">Quantity</span>
                            <span className="font-extrabold text-slate-100">{pi.quantity}x</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block uppercase text-[8px] tracking-wider font-bold">Unit Cost</span>
                            <span className="font-extrabold text-slate-100 font-mono">
                              {convertAndFormatPrice(pi.cost, 1.0, poCurrency)}
                            </span>
                          </div>
                        </div>

                        {/* Bottom total price and Edit/Delete controls */}
                        <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-xl border border-slate-900/40">
                          <div>
                            <span className="text-slate-500 block uppercase text-[8px] tracking-wider font-bold font-mono">Total</span>
                            <span className="font-mono font-black text-indigo-300 text-xs">
                              {convertAndFormatPrice(pi.quantity * pi.cost, 1.0, poCurrency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => editItemInPoList(pi)}
                              className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 p-2 rounded-xl transition-all cursor-pointer border border-slate-850 bg-slate-900/80"
                              title="Edit registered item detail configuration"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItemFromPoList(pi.sku)}
                              className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-all cursor-pointer border border-slate-850 bg-slate-900/80"
                              title="Remove registered item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total summary info */}
            {poItems.length > 0 && (
              <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl text-xs space-y-1.5 font-mono text-slate-400">
                <div className="flex justify-between font-bold text-indigo-400 text-sm">
                  <span>Draft PO Net value</span>
                  <span>{convertAndFormatPrice(calculateFormTotal(), 1.0, poCurrency)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={calculateFormTotal() === 0}
              className="w-full py-3 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-100 rounded-xl font-bold hover:bg-indigo-500 transition-all text-xs cursor-pointer text-center"
            >
              {editingPoId ? 'Save Changes to Draft PO' : 'Commit Purchase Order Draft'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
