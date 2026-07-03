import React, { useState } from 'react';
import { useWms } from '../context/WmsContext';
import {
  FilePlus2,
  ListOrdered,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Warehouse,
  Coins,
  Receipt,
  User,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  Check,
  Building,
  X,
  Search,
  ClipboardList,
  Truck
} from 'lucide-react';
import { SalesOrder, SalesOrderItem } from '../types';

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

export const SalesView: React.FC = () => {
  const {
    customers,
    customerGroups,
    warehouses,
    items,
    stocks,
    salesOrders,
    purchaseOrders,
    selectedCurrency,
    createSalesOrder,
    updateSalesOrder,
    updateSalesOrderStatus,
    userProfile,
    deliveries,
    invoices,
    createInvoice,
    payInvoice,
    payments,
    createPayment
  } = useWms();

  const [activeTab, setActiveTab ] = useState<'LIST' | 'CREATE' | 'PAYMENTS'>('LIST');

  // Payment tab states
  const [paymentCustomerId, setPaymentCustomerId] = useState('');
  const [paymentSelectedInvoiceIds, setPaymentSelectedInvoiceIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash On Delivery'>('Bank Transfer');
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const printSalesDocument = (type: 'picking' | 'delivery' | 'invoice', order: SalesOrder) => {
    const orderDeliveries = (deliveries || []).filter(d => d.salesOrderId === order.id);
    const orderInvoices = (invoices || []).filter(i => i.salesOrderId === order.id);

    const fmt = (amt: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: order.currency || 'IDR',
        minimumFractionDigits: (order.currency || 'IDR') === 'IDR' ? 0 : 2,
        maximumFractionDigits: (order.currency || 'IDR') === 'IDR' ? 0 : 2
      }).format(amt);
    };

    let titleHtml = '';
    let metaHtml = '';
    let tableHeaderHtml = '';
    let tableRowsHtml = '';
    let totalsHtml = '';
    let extraHtml = '';

    const dateStr = new Date(order.date || order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (type === 'picking') {
      titleHtml = `
        <div>
          <h1 class="picking-title">PICKING slips</h1>
          <div style="font-size: 10pt; color: #64748b; font-family: monospace; margin-top: 5px;">SYS REF: PICK-${order.soNumber.substring(3)}</div>
        </div>
      `;
      
      metaHtml = `
        <table class="header-table">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <span class="meta-label">Allocation Source</span>
              <span class="meta-value">${order.targetWarehouseCode} - ${warehouses.find(w => w.code === order.targetWarehouseCode)?.name || 'Default Facility'}</span>
              <br/><br/>
              <span class="meta-label">Draft Date</span>
              <span class="meta-value">${dateStr}</span>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <span class="meta-label">Sales Reference</span>
              <span class="meta-value" style="color: #6366f1;">${order.soNumber}</span>
              <br/><br/>
              <span class="meta-label">Milestone</span>
              <span class="badge" style="background: #e0f2fe; color: #0369a1; border-color: #bae6fd;">${order.status}</span>
            </td>
          </tr>
        </table>
      `;

      tableHeaderHtml = `
        <tr>
          <th style="width: 20%;">SKU CODE</th>
          <th style="width: 40%;">DESCRIPTION</th>
          <th style="width: 15%;">BIN / RACK CODE</th>
          <th style="width: 12%; text-align: center;">QTY REQ</th>
          <th style="width: 13%; text-align: center;">VERIFIED PICK</th>
        </tr>
      `;

      tableRowsHtml = order.items.map(it => {
        const pickItem = (order.pickingList || []).find(p => p.sku === it.sku);
        let binLoc = pickItem?.bin || '';
        let rackLoc = pickItem?.rack || '';
        
        if (!binLoc || !rackLoc) {
          const matchedStock = (stocks || []).find(s => s.sku === it.sku && s.warehouseCode === order.targetWarehouseCode);
          if (matchedStock) {
            binLoc = binLoc || matchedStock.bin;
            rackLoc = rackLoc || matchedStock.rack;
          }
        }
        
        const locStr = (binLoc || rackLoc) ? `${binLoc || '-' } / ${rackLoc || '-'}` : 'MAIN-AISLE';

        return `
          <tr>
            <td style="font-family: monospace; font-weight: bold; color: #0f172a;">${it.sku}</td>
            <td>
              <div style="font-weight: 600;">${it.name || 'Catalog Item'}</div>
            </td>
            <td style="font-family: monospace; color: #475569; font-weight: 500;">${locStr}</td>
            <td style="text-align: center; font-weight: bold; font-family: monospace;">${it.quantity}x</td>
            <td style="text-align: center;">
              <div style="display: inline-block; width: 14px; height: 14px; border: 2px solid #94a3b8; border-radius: 3px; vertical-align: middle; margin-right: 5px;"></div>
              <span style="font-size: 8pt; color: #94a3b8; font-family: monospace;">[ &nbsp; ]</span>
            </td>
          </tr>
        `;
      }).join('');

      extraHtml = `
        <div style="margin-top: 35px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 9.5pt; color: #475569;">
          <strong>Supervisor Picker Instructions:</strong> Dispatch floor operators to specified rack slots. Ensure barcode parameters match. Verify physical quantities manually.
        </div>
        <div class="signature-section">
          <div class="signature-box">Floor Picker Representative</div>
          <div class="signature-box">Supervisor Approval Signoff</div>
        </div>
      `;

    } else if (type === 'delivery') {
      const doNo = orderDeliveries.length > 0 ? orderDeliveries[0].deliveryNumber : `DO-DRAFT-${order.soNumber.substring(3)}`;
      
      titleHtml = `
        <div>
          <h1 class="delivery-title">DELIVERY ORDER</h1>
          <div style="font-size: 10pt; color: #64748b; font-family: monospace; margin-top: 5px;">SURAT JALAN REF: ${doNo}</div>
        </div>
      `;

      metaHtml = `
        <table class="header-table">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <span class="meta-label">Bill / Ship To</span>
              <span class="meta-value" style="font-size: 11pt; color: #1e1b4b;">${order.customerName}</span>
              <div style="font-size: 9.5pt; color: #475569; margin-top: 4px;">
                Customer Ref ID: ${order.customerId}<br/>
                Dest: Jln. Sentosa No. 89, Jakarta (Transit Port)
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <span class="meta-label">Sales Reference</span>
              <span class="meta-value">${order.soNumber}</span>
              <br/><br/>
              <span class="meta-label">Delivery Gate Date</span>
              <span class="meta-value">${dateStr}</span>
            </td>
          </tr>
        </table>
      `;

      tableHeaderHtml = `
        <tr>
          <th style="width: 25%;">SKU CODE</th>
          <th style="width: 45%;">PRODUCT DESCRIPTION</th>
          <th style="width: 15%; text-align: center;">QTY ORDERED</th>
          <th style="width: 15%; text-align: center;">QTY DELIVERED</th>
        </tr>
      `;

      tableRowsHtml = order.items.map(it => {
        return `
          <tr>
            <td style="font-family: monospace; font-weight: bold; color: #0f172a;">${it.sku}</td>
            <td>
              <div style="font-weight: 600;">${it.name || 'Catalog Item'}</div>
            </td>
            <td style="text-align: center; font-family: monospace; color: #64748b;">${it.quantity}x</td>
            <td style="text-align: center; font-weight: bold; font-family: monospace; color: #0369a1;">${it.quantity}x</td>
          </tr>
        `;
      }).join('');

      extraHtml = `
        <div style="margin-top: 25px; padding: 12px; font-size: 9pt; color: #64748b; line-height: 1.5; background-color: #fafafa; border-radius: 6px;">
          Barang telah diperiksa dalam keadaan baik secara kuantitas dan kualitas. Apabila terdapat cacat pengiriman, harap laporkan dalam jangka waktu maksimal 1x24 jam dari kedatangan barang.
        </div>
        <div class="signature-section" style="margin-top: 50px;">
          <div class="signature-box" style="width: 28%;">Admin / Dispatcher</div>
          <div class="signature-box" style="width: 28%;">Courier Driver</div>
          <div class="signature-box" style="width: 28%;">Receiver Acknowledgement</div>
        </div>
      `;

    } else if (type === 'invoice') {
      const invNo = orderInvoices.length > 0 ? orderInvoices[0].invoiceNumber : `INV-${order.soNumber.substring(3)}-DRAFT`;
      
      titleHtml = `
        <div>
          <h1 class="invoice-title">COMMERCIAL INVOICE</h1>
          <div style="font-size: 10pt; color: #64748b; font-family: monospace; margin-top: 5px;">TAX INVOICE NO: ${invNo}</div>
        </div>
      `;

      metaHtml = `
        <table class="header-table">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <span class="meta-label">Billed To Account</span>
              <span class="meta-value" style="font-size: 11pt; color: #1e1b4b;">${order.customerName}</span>
              <div style="font-size: 9.5pt; color: #475569; margin-top: 4px;">
                Customer ID: ${order.customerId}<br/>
                Payment Currency: ${order.currency}<br/>
                Terms: COD / Transit Net-15
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
              <span class="meta-label">Invoice Date</span>
              <span class="meta-value">${dateStr}</span>
              <br/><br/>
              <span class="meta-label">Sales Reference</span>
              <span class="meta-value">${order.soNumber}</span>
            </td>
          </tr>
        </table>
      `;

      tableHeaderHtml = `
        <tr>
          <th style="width: 20%;">SKU CODE</th>
          <th style="width: 45%;">PRODUCT DESCRIPTION</th>
          <th style="width: 15%; text-align: right;">UNIT PRICE</th>
          <th style="width: 10%; text-align: center;">QTY</th>
          <th style="width: 10%; text-align: right;">TOTAL</th>
        </tr>
      `;

      tableRowsHtml = order.items.map(it => {
        return `
          <tr>
            <td style="font-family: monospace; font-weight: bold; color: #0f172a;">${it.sku}</td>
            <td>
              <div style="font-weight: 600;">${it.name || 'Catalog Item'}</div>
            </td>
            <td style="text-align: right; font-family: monospace;">${fmt(it.price)}</td>
            <td style="text-align: center; font-family: monospace;">${it.quantity}x</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">${fmt(it.subtotal)}</td>
          </tr>
        `;
      }).join('');

      const vatRate = order.vatPercent !== undefined ? order.vatPercent : 11;
      totalsHtml = `
        <div style="float: right; width: 45%; margin-top: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 10pt; color: #475569;">
            <tr>
              <td style="padding: 4px 0;">Gross Subtotal</td>
              <td style="padding: 4px 0; text-align: right;">${fmt(order.totalAmount)}</td>
            </tr>
            ${order.discountAmount > 0 ? `
            <tr style="color: #16a34a;">
              <td style="padding: 4px 0;">Applied Discount (-${order.discountPercent}%)</td>
              <td style="padding: 4px 0; text-align: right;">-${fmt(order.discountAmount)}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 4px 0;">Value Added Tax (VAT ${vatRate}%)</td>
              <td style="padding: 4px 0; text-align: right;">${fmt(order.taxAmount)}</td>
            </tr>
            ${order.additionalCost !== undefined && order.additionalCost > 0 ? `
            <tr>
              <td style="padding: 4px 0;">Freight Charges</td>
              <td style="padding: 4px 0; text-align: right;">+${fmt(order.additionalCost)}</td>
            </tr>
            ` : ''}
            <tr style="font-size: 11pt; font-weight: bold; color: #4f46e5; border-top: 2px solid #e2e8f0;">
              <td style="padding: 8px 0;">Grand Net Total</td>
              <td style="padding: 8px 0; text-align: right; font-size: 12pt;">${fmt(order.netAmount)}</td>
            </tr>
          </table>
          <div style="clear: both;"></div>
        </div>
        <div style="float: left; width: 50%; margin-top: 20px; font-size: 9pt; color: #64748b;">
          <strong>Wire Transfer Settlement:</strong><br/>
          PT ERP Logistik Nusantara<br/>
          Bank Mandiri: 131-00-5599-222<br/>
          Bank Central Asia (BCA): 804-555-111<br/><br/>
          <em>*Please note invoice reference code on the deposit message.</em>
        </div>
        <div style="clear: both;"></div>
      `;

      extraHtml = `
        <div class="signature-section" style="margin-top: 40px;">
          <div class="signature-box" style="width: 40%; margin-left: auto;">Finance & Accounts Manager</div>
        </div>
      `;
    }

    const printDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Document - ${order.soNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11pt;
            line-height: 1.4;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #1e293b;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .company-details {
            text-align: right;
            font-size: 9pt;
            color: #475569;
            line-height: 1.3;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          .header-table td {
            padding: 0;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 20px;
          }
          .details-table th {
            background-color: #f8fafc;
            border-bottom: 2px solid #cbd5e1;
            border-top: 1px solid #e2e8f0;
            font-weight: bold;
            text-align: left;
            padding: 10px 8px;
            font-size: 9.5pt;
            color: #475569;
            text-transform: uppercase;
          }
          .details-table td {
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 8px;
            font-size: 10pt;
            color: #0f172a;
          }
          .text-right {
            text-align: right;
          }
          .invoice-title {
            font-size: 22pt;
            font-weight: 850;
            color: #1e1b4b;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .picking-title {
            font-size: 22pt;
            font-weight: 850;
            color: #334155;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .delivery-title {
            font-size: 22pt;
            font-weight: 850;
            color: #0369a1;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .badge {
            font-family: monospace;
            font-size: 8.5pt;
            font-weight: bold;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 3px 8px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 4px;
          }
          .meta-label {
            font-size: 8.5pt;
            color: #64748b;
            text-transform: uppercase;
            font-weight: bold;
            display: block;
            margin-bottom: 2px;
          }
          .meta-value {
            font-size: 10pt;
            font-weight: 600;
            color: #0f172a;
          }
          .footer-note {
            margin-top: 35px;
            font-size: 9pt;
            color: #64748b;
            text-align: center;
            border-top: 1px dashed #cbd5e1;
            padding-top: 15px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            width: 38%;
            border-top: 1.5px solid #475569;
            text-align: center;
            padding-top: 8px;
            font-size: 9.5pt;
            font-weight: bold;
            color: #334155;
            margin-top: 60px;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          ${titleHtml}
          <div class="company-details">
            <strong style="color: #0f172a; font-size: 10pt;">PT ERP Enterprise Nusantara</strong><br/>
            Central Logistik Park Block D-12<br/>
            Kawasan Industri Cikarang, Bekasi 17530<br/>
            Phone: +62 21 8899 5555 | finance@erpnusantara.co.id
          </div>
        </div>

        ${metaHtml}

        <table class="details-table">
          <thead>
            ${tableHeaderHtml}
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        ${totalsHtml}

        ${extraHtml}

        <div class="footer-note">
          This system-generated document serves as a valid commercial record. Formatted automatically into standard A4 size.
        </div>
      </body>
      </html>
    `;

    const iframePr = document.createElement('iframe');
    iframePr.name = 'printFrame';
    iframePr.style.position = 'fixed';
    iframePr.style.right = '0';
    iframePr.style.bottom = '0';
    iframePr.style.width = '0';
    iframePr.style.height = '0';
    iframePr.style.border = 'none';
    document.body.appendChild(iframePr);

    const docPr = iframePr.contentDocument || iframePr.contentWindow?.document;
    if (docPr) {
      docPr.open();
      docPr.write(printDoc);
      docPr.close();
    }

    setTimeout(() => {
      try {
        iframePr.contentWindow?.focus();
        iframePr.contentWindow?.print();
      } catch (err) {
        console.warn('Parent window print caller blocked or failed:', err);
      }
    }, 500);

    setTimeout(() => {
      if (document.body.contains(iframePr)) {
        document.body.removeChild(iframePr);
      }
    }, 5000);
  };

  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);

  React.useEffect(() => {
    setSelectedDeliveryIds([]);
  }, [selectedOrder?.id]);

  // Sync selectedOrder with latest updated version from the salesOrders list in context
  React.useEffect(() => {
    if (selectedOrder) {
      const latest = salesOrders.find(so => so.id === selectedOrder.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(latest);
      }
    }
  }, [salesOrders, selectedOrder]);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [selectedMilestoneFilter, setSelectedMilestoneFilter] = useState<'All' | 'Draft' | 'Picking' | 'DeliveryApproval' | 'FullyDelivered' | 'Invoiced' | 'Paid'>('All');
  const [salesSearchTerm, setSalesSearchTerm] = useState('');

  // Creating State
  const [customerId, setCustomerId] = useState('');
  const [targetWarehouseCode, setTargetWarehouseCode] = useState('WH-MUT-01');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [soCurrency, setSoCurrency] = useState('USD');
  const [orderItems, setOrderItems] = useState<{ sku: string; quantity: number; price: number }[]>([]);
  
  // Quick Selector states for adding item
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

  React.useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [selSku, showSuggestions]);

  const [selQty, setSelQty] = useState<number>(1);
  const [selPrice, setSelPrice] = useState<number | "">(0);
  const [selDiscount, setSelDiscount] = useState<number | "">(0);
  const [errorMessage, setErrorMessage] = useState('');

  const editingSalesSkuRef = React.useRef<string | null>(null);
  const editingEditSalesSkuRef = React.useRef<string | null>(null);

  const [soDiscountPercent, setSoDiscountPercent] = useState<number | "">(0);
  const [soVatPercent, setSoVatPercent] = useState<number | "">(11);
  const [soAdditionalCost, setSoAdditionalCost] = useState<number | "">(0);

  // Editing Draft Sales Order States
  const ignoreNextReset = React.useRef(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editWarehouseCode, setEditWarehouseCode] = useState('');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editOrderItems, setEditOrderItems] = useState<{ sku: string; quantity: number; price: number }[]>([]);
  const [editErrorMessage, setEditErrorMessage] = useState('');

  const [editDiscountPercent, setEditDiscountPercent] = useState<number | "">(0);
  const [editVatPercent, setEditVatPercent] = useState<number | "">(11);
  const [editAdditionalCost, setEditAdditionalCost] = useState<number | "">(0);

  const [editSelSku, setEditSelSku] = useState('');
  const [editShowSuggestions, setEditShowSuggestions] = useState(false);
  const [editActiveSuggestionIndex, setEditActiveSuggestionIndex] = useState(-1);
  const [editSelQty, setEditSelQty] = useState<number>(1);
  const [editSelPrice, setEditSelPrice] = useState<number | "">(0);
  const [editSelDiscount, setEditSelDiscount] = useState<number | "">(0);

  const editSuggestions = React.useMemo(() => {
    if (!editSelSku.trim()) return [];
    const query = editSelSku.toLowerCase().trim();
    return items
      .filter(item => item.sku.toLowerCase().includes(query) || item.name.toLowerCase().includes(query))
      .slice(0, 5);
  }, [items, editSelSku]);

  React.useEffect(() => {
    setEditActiveSuggestionIndex(-1);
  }, [editSelSku, editShowSuggestions]);

  // Handle selected order change -> reset editing
  React.useEffect(() => {
    if (ignoreNextReset.current) {
      ignoreNextReset.current = false;
      return;
    }
    setIsEditingDraft(false);
    setEditErrorMessage('');
  }, [selectedOrder]);

  // Sync customer group discounts to draft creation/editing state defaults
  React.useEffect(() => {
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      const grp = customerGroups.find(g => g.id === cust.customerGroupId);
      setSoDiscountPercent(grp ? grp.discountPercent : 0);
    } else {
      setSoDiscountPercent(0);
    }
  }, [customerId, customers, customerGroups]);

  React.useEffect(() => {
    if (isEditingDraft && selectedOrder && editCustomerId !== selectedOrder.customerId) {
      const cust = customers.find(c => c.id === editCustomerId);
      if (cust) {
        const grp = customerGroups.find(g => g.id === cust.customerGroupId);
        setEditDiscountPercent(grp ? grp.discountPercent : 0);
      } else {
        setEditDiscountPercent(0);
      }
    }
  }, [editCustomerId, isEditingDraft, selectedOrder, customers, customerGroups]);

  // Handle edit SKU change to populate price
  React.useEffect(() => {
    if (editingEditSalesSkuRef.current === editSelSku) {
      return;
    }
    editingEditSalesSkuRef.current = null;
    const matched = items.find(i => i.sku === editSelSku);
    if (matched) {
      setEditSelPrice(matched.sellingPrice);
      setEditSelDiscount(0);
    }
  }, [editSelSku, items]);

  const editLastPurchasePrice = React.useMemo(() => {
    if (!editSelSku) return null;
    const POsWithItem = purchaseOrders.filter(po => 
      po.items.some(item => item.sku === editSelSku)
    );
    if (POsWithItem.length === 0) return null;
    
    const sortedPOs = [...POsWithItem].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const latestPO = sortedPOs[0];
    const poItem = latestPO.items.find(item => item.sku === editSelSku);
    if (!poItem) return null;
    const rate = latestPO.exchangeRate || 1.0;
    const usdCost = poItem.cost / rate;
    return usdCost * 16000;
  }, [purchaseOrders, editSelSku]);

  // Check the last purchase order price for the selected item
  const lastPurchasePrice = React.useMemo(() => {
    if (!selSku) return null;
    const POsWithItem = purchaseOrders.filter(po => 
      po.items.some(item => item.sku === selSku)
    );
    if (POsWithItem.length === 0) return null;
    
    // Sort by date/createdAt descending to find the latest
    const sortedPOs = [...POsWithItem].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const latestPO = sortedPOs[0];
    const poItem = latestPO.items.find(item => item.sku === selSku);
    if (!poItem) return null;
    const rate = latestPO.exchangeRate || 1.0;
    const usdCost = poItem.cost / rate;
    return usdCost * 16000;
  }, [purchaseOrders, selSku]);

  // Handle SKU change in selector to load default standard pricing
  React.useEffect(() => {
    if (editingSalesSkuRef.current === selSku) {
      return;
    }
    editingSalesSkuRef.current = null;
    const matched = items.find(i => i.sku === selSku);
    if (matched) {
      setSelPrice(matched.sellingPrice);
      setSelDiscount(0); // reset discount for new item
    }
  }, [selSku, items]);

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

  const filteredSalesOrders = React.useMemo(() => {
    let list = salesOrders;
    if (selectedMilestoneFilter !== 'All') {
      list = list.filter(so => so.status === selectedMilestoneFilter);
    }
    if (salesSearchTerm.trim() !== '') {
      const q = salesSearchTerm.toLowerCase();
      list = list.filter(so => 
        so.soNumber.toLowerCase().includes(q) || 
        so.customerName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [salesOrders, selectedMilestoneFilter, salesSearchTerm]);

  // Helper calculation details
  const getSelectedCustomerDetails = () => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return { name: '', discPct: 0, groupName: '' };
    const grp = customerGroups.find(g => g.id === cust.customerGroupId);
    return {
      name: cust.name,
      discPct: grp ? grp.discountPercent : 0,
      groupName: grp ? grp.name : 'Standard'
    };
  };

  const { name: custLabel, discPct: custDiscPercent, groupName: custGroupLabel } = getSelectedCustomerDetails();

  const calculateFormFinancials = () => {
    const subtotal = orderItems.reduce((acc, it) => acc + (it.quantity * it.price), 0);
    const discAmount = subtotal * (Number(soDiscountPercent || 0) / 100);
    const taxableAmount = subtotal - discAmount;
    const taxAmount = taxableAmount * (Number(soVatPercent || 0) / 100);
    const totalAmount = taxableAmount + taxAmount + Number(soAdditionalCost || 0);

    return {
      subtotal,
      discAmount,
      taxAmount,
      totalAmount
    };
  };

  const financialSummary = calculateFormFinancials();

  // Editing Draft SO logic
  const startEditingDraft = (so: SalesOrder) => {
    setEditCustomerId(so.customerId);
    setEditWarehouseCode(so.targetWarehouseCode);
    setEditOrderDate(so.date || new Date().toISOString().split('T')[0]);
    setEditOrderItems(so.items.map(it => ({
      sku: it.sku,
      quantity: it.quantity,
      price: it.price
    })));
    setEditDiscountPercent(so.discountPercent !== undefined ? so.discountPercent : 0);
    setEditVatPercent(so.vatPercent !== undefined ? so.vatPercent : 11);
    setEditAdditionalCost(so.additionalCost !== undefined ? so.additionalCost : 0);
    setEditErrorMessage('');
    setIsEditingDraft(true);
  };

  const getEditCustomerDetails = () => {
    const cust = customers.find(c => c.id === editCustomerId);
    if (!cust) return { name: '', discPct: 0, groupName: '' };
    const grp = customerGroups.find(g => g.id === cust.customerGroupId);
    return {
      name: cust.name,
      discPct: grp ? grp.discountPercent : 0,
      groupName: grp ? grp.name : 'Standard'
    };
  };

  const getLatestPOCostIDR = React.useCallback((sku: string): number | null => {
    if (!sku) return null;
    const POsWithItem = purchaseOrders.filter(po => 
      po.items.some(item => item.sku === sku)
    );
    if (POsWithItem.length === 0) return null;
    
    const sortedPOs = [...POsWithItem].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const latestPO = sortedPOs[0];
    const poItem = latestPO.items.find(item => item.sku === sku);
    if (!poItem) return null;
    const rate = latestPO.exchangeRate || 1.0;
    const usdCost = poItem.cost / rate;
    return usdCost * 16000;
  }, [purchaseOrders]);

  const getItemCostIDR = React.useCallback((sku: string): number => {
    const poCost = getLatestPOCostIDR(sku);
    if (poCost !== null) return poCost;
    const item = items.find(i => i.sku === sku);
    if (item) {
      return item.unitCost * 16000;
    }
    return 0;
  }, [getLatestPOCostIDR, items]);

  const { name: editCustLabel, discPct: editCustDiscPercent, groupName: editCustGroupLabel } = getEditCustomerDetails();

  const calculateEditFormFinancials = () => {
    const subtotal = editOrderItems.reduce((acc, it) => acc + (it.quantity * it.price), 0);
    const discAmount = subtotal * (Number(editDiscountPercent || 0) / 100);
    const taxableAmount = subtotal - discAmount;
    const taxAmount = taxableAmount * (Number(editVatPercent || 0) / 100);
    const totalAmount = taxableAmount + taxAmount + Number(editAdditionalCost || 0);

    return {
      subtotal,
      discAmount,
      taxAmount,
      totalAmount
    };
  };

  const editFinancialSummary = calculateEditFormFinancials();

  const addEditItemToDraftList = () => {
    setEditErrorMessage('');
    if (!editSelSku) return;

    // Check item available stock
    const matchedStock = stocks.find(s => s.sku === editSelSku && s.warehouseCode === editWarehouseCode);
    const phy = matchedStock ? matchedStock.physicalQty : 0;
    const bkd = matchedStock ? matchedStock.bookedQty : 0;
    
    // Simulate release of this SKU's previous quantity inside this exact PO if it matched the warehouse
    const previouslyBookedItem = selectedOrder?.items.find(it => it.sku === editSelSku && selectedOrder?.targetWarehouseCode === editWarehouseCode);
    const prevBookedQty = previouslyBookedItem ? previouslyBookedItem.quantity : 0;
    const adjustedBooked = Math.max(0, bkd - prevBookedQty);
    
    const available = phy - adjustedBooked;

    if (available < editSelQty) {
      setEditErrorMessage(`Insufficient stock. SKU ${editSelSku} only has ${available} Available SOH in ${editWarehouseCode}.`);
      return;
    }

    const discountedPrice = Math.max(0, Number(editSelPrice || 0) * (1 - (editSelDiscount || 0) / 100));

    const existingIndex = editOrderItems.findIndex(oi => oi.sku === editSelSku);
    if (existingIndex > -1) {
      const copy = [...editOrderItems];
      copy[existingIndex].quantity += editSelQty;
      copy[existingIndex].price = discountedPrice;
      setEditOrderItems(copy);
    } else {
      setEditOrderItems([...editOrderItems, { sku: editSelSku, quantity: editSelQty, price: discountedPrice }]);
    }

    setEditSelSku('');
    setEditSelQty(1);
    setEditSelPrice(0);
    setEditSelDiscount(0);
  };

  const removeEditItemFromDraftList = (sku: string) => {
    setEditOrderItems(editOrderItems.filter(oi => oi.sku !== sku));
  };

  const editItemInEditDraftList = (oi: { sku: string; quantity: number; price: number }) => {
    editingEditSalesSkuRef.current = oi.sku;
    setEditSelSku(oi.sku);
    setEditSelQty(oi.quantity);
    setEditSelPrice(oi.price);
    setEditSelDiscount(0);
    setEditOrderItems(editOrderItems.filter(item => item.sku !== oi.sku));
  };

  const handleUpdateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMessage('');

    if (!editCustomerId) {
      setEditErrorMessage('Please select a target customer.');
      return;
    }
    if (editOrderItems.length === 0) {
      setEditErrorMessage('Please ensure at least 1 item is registered in the order list.');
      return;
    }

    const itemsPayload: SalesOrderItem[] = editOrderItems.map(oi => {
      const it = items.find(i => i.sku === oi.sku);
      return {
        sku: oi.sku,
        name: it ? it.name : oi.sku,
        quantity: oi.quantity,
        price: oi.price,
        subtotal: oi.quantity * oi.price
      };
    });

    const negativeMarkupItems = editOrderItems.filter(oi => {
      const costIDR = getItemCostIDR(oi.sku);
      return oi.price < costIDR;
    });

    if (negativeMarkupItems.length > 0) {
      const skus = negativeMarkupItems.map(item => item.sku).join(', ');
      const confirmed = window.confirm(`Are you sure because this ${skus} estimated markup is less than zero ?`);
      if (!confirmed) return;
    }

    try {
      if (!selectedOrder) return;

      await updateSalesOrder(selectedOrder.id, {
        customerId: editCustomerId,
        customerName: editCustLabel,
        customerGroupId: customers.find(c => c.id === editCustomerId)?.customerGroupId || 'retail',
        date: editOrderDate,
        targetWarehouseCode: editWarehouseCode,
        currency: 'IDR',
        exchangeRate: 16000.0,
        items: itemsPayload,
        discountPercent: Number(editDiscountPercent || 0),
        discountAmount: editFinancialSummary.discAmount,
        taxAmount: editFinancialSummary.taxAmount,
        netAmount: editFinancialSummary.totalAmount,
        totalAmount: editFinancialSummary.subtotal,
        vatPercent: Number(editVatPercent !== "" ? editVatPercent : 11),
        additionalCost: Number(editAdditionalCost || 0)
      });

      // Update state and close editing
      setSelectedOrder(prev => prev ? {
        ...prev,
        customerId: editCustomerId,
        customerName: editCustLabel,
        customerGroupId: customers.find(c => c.id === editCustomerId)?.customerGroupId || 'retail',
        date: editOrderDate,
        targetWarehouseCode: editWarehouseCode,
        currency: 'IDR',
        exchangeRate: 16000.0,
        items: itemsPayload,
        discountPercent: Number(editDiscountPercent || 0),
        discountAmount: editFinancialSummary.discAmount,
        taxAmount: editFinancialSummary.taxAmount,
        netAmount: editFinancialSummary.totalAmount,
        totalAmount: editFinancialSummary.subtotal,
        vatPercent: Number(editVatPercent !== "" ? editVatPercent : 11),
        additionalCost: Number(editAdditionalCost || 0),
        pickingList: itemsPayload.map(item => {
          const stockMatch = stocks.find(s => s.sku === item.sku && s.warehouseCode === editWarehouseCode);
          return {
            sku: item.sku,
            bin: stockMatch?.bin || 'BIN-GEN',
            rack: stockMatch?.rack || 'RACK-GEN',
            quantityRequired: item.quantity,
            quantityPicked: 0,
            picked: false
          };
        })
      } : null);

      setIsEditingDraft(false);
    } catch (err: any) {
      setEditErrorMessage(err.message || 'Workflow action blocked by Firestore Rules.');
    }
  };

  // Add Item to SO Creation Layout
  const addItemToDraftList = () => {
    setErrorMessage('');
    if (!selSku) return;

    // Check item available stock
    const matchedStock = stocks.find(s => s.sku === selSku && s.warehouseCode === targetWarehouseCode);
    const phy = matchedStock ? matchedStock.physicalQty : 0;
    const bkd = matchedStock ? matchedStock.bookedQty : 0;
    const available = phy - bkd;

    if (available < selQty) {
      setErrorMessage(`Insufficient stock. SKU ${selSku} only has ${available} Available SOH in ${targetWarehouseCode}.`);
      return;
    }

    const discountedPrice = Math.max(0, Number(selPrice || 0) * (1 - (selDiscount || 0) / 100));

    // Toggle array
    const existingIndex = orderItems.findIndex(oi => oi.sku === selSku);
    if (existingIndex > -1) {
      const copy = [...orderItems];
      copy[existingIndex].quantity += selQty;
      copy[existingIndex].price = discountedPrice;
      setOrderItems(copy);
    } else {
      setOrderItems([...orderItems, { sku: selSku, quantity: selQty, price: discountedPrice }]);
    }

    setSelSku('');
    setSelQty(1);
    setSelPrice(0);
    setSelDiscount(0);
  };

  const removeItemFromDraftList = (sku: string) => {
    setOrderItems(orderItems.filter(oi => oi.sku !== sku));
  };

  const editItemInDraftList = (oi: { sku: string; quantity: number; price: number }) => {
    editingSalesSkuRef.current = oi.sku;
    setSelSku(oi.sku);
    setSelQty(oi.quantity);
    setSelPrice(oi.price);
    setSelDiscount(0);
    setOrderItems(orderItems.filter(item => item.sku !== oi.sku));
  };

  // Create Sales Order write handler
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerId) {
      setErrorMessage('Please select a target customer.');
      return;
    }
    if (orderItems.length === 0) {
      setErrorMessage('Please ensure at least 1 item is registered in the order list.');
      return;
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yymm = `${yy}${mm}`;
    const prefix = `SO-${yymm}-`;
    const countInCurrentMonth = salesOrders.filter(so => so.soNumber.startsWith(prefix)).length;
    const runningNumber = String(countInCurrentMonth + 1).padStart(4, '0');
    const soNumber = `${prefix}${runningNumber}`;

    const itemsPayload: SalesOrderItem[] = orderItems.map(oi => {
      const it = items.find(i => i.sku === oi.sku);
      return {
        sku: oi.sku,
        name: it ? it.name : oi.sku,
        quantity: oi.quantity,
        price: oi.price,
        subtotal: oi.quantity * oi.price
      };
    });

    const negativeMarkupItems = orderItems.filter(oi => {
      const costIDR = getItemCostIDR(oi.sku);
      return oi.price < costIDR;
    });

    if (negativeMarkupItems.length > 0) {
      const skus = negativeMarkupItems.map(item => item.sku).join(', ');
      const confirmed = window.confirm(`Are you sure because this ${skus} estimated markup is less than zero ?`);
      if (!confirmed) return;
    }

    try {
      await createSalesOrder({
        soNumber,
        customerId,
        customerName: custLabel,
        customerGroupId: customers.find(c => c.id === customerId)?.customerGroupId || 'retail',
        date: orderDate,
        targetWarehouseCode,
        currency: 'IDR', // Fixed transaction currency
        exchangeRate: 16000.0, // exchange rate for multi-currency reporting
        items: itemsPayload,
        discountPercent: Number(soDiscountPercent || 0),
        discountAmount: financialSummary.discAmount,
        taxAmount: financialSummary.taxAmount,
        netAmount: financialSummary.totalAmount,
        totalAmount: financialSummary.subtotal,
        vatPercent: Number(soVatPercent !== "" ? soVatPercent : 11),
        additionalCost: Number(soAdditionalCost || 0)
      });

      // Clear layout and return to view list
      setCustomerId('');
      setOrderItems([]);
      setSoDiscountPercent(0);
      setSoVatPercent(11);
      setSoAdditionalCost(0);
      setActiveTab('LIST');
    } catch (err: any) {
      setErrorMessage(err.message || 'Workflow action blocked by Firestore Rules.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Tab Select Headings */}
      <div className="flex border-b border-slate-800 p-1 bg-slate-950 rounded-xl max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('LIST')}
          className={`flex-1 flex justify-center items-center py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'LIST' ? 'bg-indigo-600 text-indigo-50 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Sales Orders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('CREATE')}
          className={`flex-1 flex justify-center items-center py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'CREATE' ? 'bg-indigo-600 text-indigo-50 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Draft New Sales Order
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PAYMENTS')}
          className={`flex-1 flex justify-center items-center py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'PAYMENTS' ? 'bg-indigo-600 text-indigo-50 shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Payments & Billing
        </button>
      </div>

      {/* Screen Renderings */}

      {/* TAB 1: LIST SALES ORDERS */}
      {activeTab === 'LIST' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Orders List Index */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-bold text-slate-150 text-xs font-sans uppercase tracking-widest">
              Active Order-to-Cash Milestones ({filteredSalesOrders.length})
            </h3>

            {/* Milestone Status Filter - Simpler, fits in 1 row list */}
            <div className="bg-slate-950/60 p-1 border border-slate-800/80 rounded-xl grid grid-cols-7 gap-0.5 text-[8.5px] font-mono">
              {[
                { label: 'All', value: 'All' },
                { label: 'Draft', value: 'Draft' },
                { label: 'Picking', value: 'Picking' },
                { label: 'Approval', value: 'DeliveryApproval' },
                { label: 'Delivered', value: 'FullyDelivered' },
                { label: 'Invoiced', value: 'Invoiced' },
                { label: 'Paid', value: 'Paid' }
              ].map((opt) => {
                const isSelectedAndFiltered = selectedMilestoneFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedMilestoneFilter(opt.value as any);
                    }}
                    className={`py-1 rounded-lg text-center font-bold tracking-tight cursor-pointer transition-all border ${
                      isSelectedAndFiltered
                        ? 'bg-indigo-600/30 text-indigo-400 border-indigo-500/40 shadow-[0_0_6px_rgba(99,102,241,0.15)] font-extrabold'
                        : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-900/60 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate block px-0.5">{opt.label === 'DeliveryApproval' ? 'Approval' : opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search field for SO Number or Customer */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by SO number or customer..."
                value={salesSearchTerm}
                onChange={(e) => setSalesSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 outline-none transition-all"
              />
              {salesSearchTerm && (
                <button
                  type="button"
                  onClick={() => setSalesSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredSalesOrders.map((so) => {
                const isSelected = selectedOrder?.id === so.id;
                return (
                  <div
                    key={so.id}
                    onClick={() => setSelectedOrder(so)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-indigo-950/20 border-indigo-500/70 shadow-[0_0_12px_rgba(99,102,241,0.15)] bg-indigo-950/40' 
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-xs uppercase tracking-wider text-slate-400 font-mono font-bold">
                          {so.targetWarehouseCode}
                        </span>
                        <h4 className="font-mono text-sm font-bold text-slate-100">{so.soNumber}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {so.status === 'Draft' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedOrder?.id !== so.id) {
                                ignoreNextReset.current = true;
                                setSelectedOrder(so);
                              }
                              startEditingDraft(so);
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-bold text-[10px] rounded-lg transition-all border border-amber-500/20 hover:border-amber-500 cursor-pointer"
                            title="Edit this Draft Sales Order"
                            id={`edit-draft-btn-${so.id}`}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider ${
                          so.status === 'Draft' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : so.status === 'Picking'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : so.status === 'DeliveryApproval'
                            ? 'bg-purple-500/10 text-purple-450 border border-purple-500/20'
                            : so.status === 'FullyDelivered'
                            ? 'bg-teal-500/10 text-teal-350 border border-teal-500/20'
                            : so.status === 'Invoiced'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {so.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 uppercase tracking-widest text-[10px] font-mono font-medium block">Customer</span>
                        <span className="font-sans font-semibold text-slate-200">{so.customerName}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-slate-500 uppercase tracking-widest text-[10px] font-mono font-medium block">Net Balance</span>
                          <span className="font-mono font-semibold text-indigo-300">
                            {convertAndFormatPrice(so.netAmount, 1.0, so.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {salesOrders.length === 0 && (
                <div className="py-12 bg-slate-900/20 border border-slate-800/60 rounded-2xl text-center text-slate-500 italic text-sm">
                  No active Sales Orders registered. Toggle the draft tab above to create one.
                </div>
              )}

              {salesOrders.length > 0 && filteredSalesOrders.length === 0 && (
                <div className="py-12 bg-slate-900/10 border border-dashed border-slate-800/40 rounded-2xl text-center text-slate-500 italic text-sm">
                  No Sales Orders found in milestone "{selectedMilestoneFilter === 'DeliveryApproval' ? 'Delivery Approval' : selectedMilestoneFilter}".
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE SO WORKFLOW MILESTONE DECODER - RIGHT */}
          <div className="lg:col-span-6 animate-fade-in w-full max-w-full">
            {selectedOrder ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-6 w-full max-w-full overflow-hidden">
                {isEditingDraft ? (
                  <form onSubmit={handleUpdateOrderSubmit} className="space-y-4">
                    {/* Header with Cancel / Save */}
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">
                          Editing Draft Sales Order
                        </span>
                        <h3 className="font-mono font-extrabold text-slate-100 text-base">
                          {selectedOrder.soNumber}
                        </h3>
                      </div>
                    </div>

                    {editErrorMessage && (
                      <div className="p-3 bg-red-950/25 border border-red-900/40 rounded-xl text-xs text-red-200">
                        {editErrorMessage}
                      </div>
                    )}

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Customer */}
                      <div>
                        <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-1">
                          Select Customer Profile
                        </label>
                        <select
                          required
                          value={editCustomerId}
                          onChange={(e) => setEditCustomerId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                        >
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                          ))}
                        </select>
                        <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">
                          Rank: {editCustGroupLabel} ({editCustDiscPercent}%)
                        </span>
                      </div>

                      {/* Warehouse */}
                      <div>
                        <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-1">
                          Dispatch Facility
                        </label>
                        <select
                          required
                          value={editWarehouseCode}
                          onChange={(e) => setEditWarehouseCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                        >
                          {warehouses.map(w => (
                            <option key={w.code} value={w.code}>{w.code} - {w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quick item container composer */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800/85 p-4 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-400">
                        Add Items Matrix
                      </h4>

                      <div className="space-y-4">
                        {/* Row 1: Item SKU/Name and Qty in 1 row */}
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-8 sm:col-span-10 relative">
                            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-1">
                              Item SKU or Name
                            </label>
                            <input
                              type="text"
                              value={editSelSku}
                              onChange={(e) => {
                                setEditSelSku(e.target.value);
                                setEditShowSuggestions(true);
                              }}
                              onFocus={() => setEditShowSuggestions(true)}
                              onBlur={() => {
                                setTimeout(() => setEditShowSuggestions(false), 200);
                              }}
                              onKeyDown={(e) => {
                                if (!editShowSuggestions || editSuggestions.length === 0) return;
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setEditActiveSuggestionIndex(prev => 
                                    prev < editSuggestions.length - 1 ? prev + 1 : 0
                                  );
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setEditActiveSuggestionIndex(prev => 
                                    prev > 0 ? prev - 1 : editSuggestions.length - 1
                                  );
                                } else if (e.key === 'Enter') {
                                  if (editActiveSuggestionIndex >= 0 && editActiveSuggestionIndex < editSuggestions.length) {
                                    e.preventDefault();
                                    setEditSelSku(editSuggestions[editActiveSuggestionIndex].sku);
                                    setEditShowSuggestions(false);
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditShowSuggestions(false);
                                }
                              }}
                              placeholder="Type Item Sku or Name..."
                              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-505 font-mono text-xs"
                              autoComplete="off"
                            />

                            {/* Autocomplete suger */}
                            {editShowSuggestions && editSuggestions.length > 0 && (
                              <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-900/65 font-sans max-h-48 overflow-y-auto">
                                {editSuggestions.map((item, idx) => {
                                  const isHighlighted = idx === editActiveSuggestionIndex;
                                  return (
                                    <button
                                      key={item.sku}
                                      type="button"
                                      onMouseDown={() => {
                                        setEditSelSku(item.sku);
                                        setEditShowSuggestions(false);
                                      }}
                                      className={`w-full text-left px-3.5 py-2.5 text-[11px] transition-colors flex items-center justify-between cursor-pointer group ${
                                        isHighlighted ? 'bg-indigo-600/20 text-slate-100 border-l-2 border-indigo-505' : 'hover:bg-slate-900/60 text-slate-300'
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
                                        isHighlighted ? 'border-indigo-500/40 text-indigo-400 bg-indigo-505/5' : 'border-slate-800 text-slate-500 group-hover:border-indigo-500/20 group-hover:text-indigo-400'
                                      }`}>
                                        Select
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="col-span-4 sm:col-span-2">
                            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-1">
                              Qty
                            </label>
                            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500/60 transition-all h-[38px] w-full">
                              <button
                                id="edit-draft-minus-btn"
                                type="button"
                                onClick={() => setEditSelQty(Math.max(1, editSelQty - 1))}
                                className="w-6 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border-r border-slate-850 h-full flex items-center justify-center select-none shrink-0"
                                title="Decrease Quantity"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <input
                                id="edit-draft-qty-input"
                                type="number"
                                min={1}
                                placeholder="Qty"
                                value={editSelQty}
                                onChange={(e) => setEditSelQty(Math.max(1, Number(e.target.value)))}
                                className="w-full text-center bg-transparent border-0 focus:ring-0 outline-none px-0.5 text-[10px] font-mono text-slate-150"
                              />
                              <button
                                id="edit-draft-plus-btn"
                                type="button"
                                onClick={() => setEditSelQty(editSelQty + 1)}
                                className="w-6 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer border-l border-slate-850 h-full flex items-center justify-center select-none shrink-0"
                                title="Increase Quantity"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Discount and Price in 1 row */}
                        <div className="grid grid-cols-4 gap-3">
                          <div className="col-span-1">
                            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-1">
                              Disc %
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              placeholder="Disc %"
                              value={editSelDiscount}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  setEditSelDiscount("");
                                } else {
                                  setEditSelDiscount(Math.min(100, Math.max(0, Number(val))));
                                }
                              }}
                              onFocus={() => {
                                if (editSelDiscount === 0) setEditSelDiscount("");
                              }}
                              onBlur={() => {
                                if (editSelDiscount === "") setEditSelDiscount(0);
                              }}
                              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-150 focus:outline-none text-xs font-mono w-full"
                            />
                          </div>

                          <div className="col-span-3">
                            <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-1">
                              Selling Price
                            </label>
                            <input
                              type="text"
                              placeholder="0"
                              value={formatThousandDots(editSelPrice)}
                              onChange={(e) => {
                                const parsed = parseThousandDots(e.target.value);
                                if (parsed === "") {
                                  setEditSelPrice("");
                                } else {
                                  setEditSelPrice(Math.max(0, parsed));
                                }
                              }}
                              onFocus={() => {
                                if (editSelPrice === 0) setEditSelPrice("");
                              }}
                              onBlur={() => {
                                if (editSelPrice === "") setEditSelPrice(0);
                              }}
                              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-150 focus:outline-none text-xs font-mono"
                            />
                          </div>
                        </div>

                        {/* Row 3: Add button below */}
                        <div>
                          <button
                            type="button"
                            onClick={addEditItemToDraftList}
                            className="w-full py-2.5 px-4 bg-indigo-600 text-slate-50 font-bold rounded-xl hover:bg-indigo-550 transition-all text-xs flex justify-center items-center gap-1.5 cursor-pointer h-[38px]"
                          >
                            <Plus className="w-4 h-4" />
                            Add Item
                          </button>
                        </div>

                        {/* Audit information for edited SKU */}
                        {editSelSku && (
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl text-[10px] font-sans">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-slate-500 font-mono text-[9px] uppercase">Last PO Price:</span>
                              {editLastPurchasePrice !== null ? (
                                <span className="font-mono font-bold text-emerald-400">
                                  {convertAndFormatPrice(editLastPurchasePrice, 1.0, 'IDR')}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic text-[9px]">No PO History</span>
                              )}

                              {Number(editSelDiscount || 0) > 0 ? (
                                <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                                  <span className="text-slate-505 font-mono text-[9px] uppercase">Net:</span>
                                  <span className="font-mono font-bold text-indigo-400">
                                    {convertAndFormatPrice(Number(editSelPrice || 0) * (1 - Number(editSelDiscount || 0) / 100), 1.0, 'IDR')}
                                  </span>
                                </div>
                              ) : null}
                            </div>

                            {editLastPurchasePrice !== null && (
                              <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-850 font-mono text-[9px]">
                                <span className="text-slate-500 font-sans text-[9px] uppercase">Est markup:</span>
                                {(() => {
                                  const costIDR = editLastPurchasePrice;
                                  const netUnit = Number(editSelPrice || 0) * (1 - Number(editSelDiscount || 0) / 100);
                                  const markupAmt = netUnit - costIDR;
                                  const markupPercent = costIDR > 0 ? (markupAmt / costIDR) * 100 : 0;
                                  return (
                                    <span className={`font-mono font-semibold ${markupPercent >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                                      {markupPercent >= 0 ? '+' : ''}{markupPercent.toFixed(1)}%
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Basket of edit items */}
                      {editOrderItems.length > 0 && (
                        <div className="divide-y divide-slate-800/60 max-h-36 overflow-y-auto space-y-1">
                          {editOrderItems.map((oi) => {
                            const matchedItem = items.find(item => item.sku === oi.sku);
                            const costIDR = getItemCostIDR(oi.sku);
                            const isNegativeMarkup = oi.price < costIDR;
                            const markupAmt = oi.price - costIDR;
                            const markupPercent = costIDR > 0 ? (markupAmt / costIDR) * 100 : 0;
                            return (
                              <div 
                                key={oi.sku} 
                                className={`py-2 px-2.5 rounded-lg flex justify-between items-center text-[11px] gap-2 transition-all ${
                                  isNegativeMarkup 
                                    ? 'bg-rose-950/25 border border-rose-900/40 my-1' 
                                    : 'hover:bg-slate-900/30'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono text-slate-200 font-semibold block truncate text-[11px]">{oi.sku}</span>
                                      {isNegativeMarkup && (
                                        <span className="text-[8px] bg-rose-500/25 text-rose-400 px-1 py-0.5 rounded font-mono font-bold flex items-center gap-0.5 shrink-0" title={`Unit Cost: ${convertAndFormatPrice(costIDR, 1.0, 'IDR')}`}>
                                          {markupPercent.toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[9px] text-slate-300 truncate">{matchedItem?.name || 'Order Item'}</p>
                                    <p className="text-[9px] text-slate-500 font-mono">
                                      {oi.quantity}x @ {convertAndFormatPrice(oi.price, 1.0, 'IDR')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono text-xs text-slate-300 font-bold">{convertAndFormatPrice(oi.quantity * oi.price, 1.0, 'IDR')}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => editItemInEditDraftList(oi)}
                                      className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 p-1 rounded transition-all cursor-pointer"
                                      title="Edit item detail configuration"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeEditItemFromDraftList(oi.sku)}
                                      className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-1 rounded transition-all cursor-pointer"
                                      title="Delete item"
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

                    {/* Pricing summary */}
                    {editOrderItems.length > 0 && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-850">
                          <div>
                            <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">
                              Disc %
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={editDiscountPercent}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  setEditDiscountPercent("");
                                } else {
                                  setEditDiscountPercent(Math.max(0, Math.min(100, Number(val) || 0)));
                                }
                              }}
                              onFocus={() => {
                                if (editDiscountPercent === 0) setEditDiscountPercent("");
                              }}
                              onBlur={() => {
                                if (editDiscountPercent === "") setEditDiscountPercent(0);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">
                              VAT %
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={editVatPercent}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  setEditVatPercent("");
                                } else {
                                  setEditVatPercent(Math.max(0, Math.min(100, Number(val) || 0)));
                                }
                              }}
                              onFocus={() => {
                                if (editVatPercent === 11 || editVatPercent === 0) setEditVatPercent("");
                              }}
                              onBlur={() => {
                                if (editVatPercent === "") setEditVatPercent(11);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1">
                              Addil Cost
                            </label>
                            <input
                              type="text"
                              value={formatThousandDots(editAdditionalCost)}
                              onChange={(e) => {
                                const parsed = parseThousandDots(e.target.value);
                                if (parsed === "") {
                                  setEditAdditionalCost("");
                                } else {
                                  setEditAdditionalCost(Math.max(0, parsed));
                                }
                              }}
                              onFocus={() => {
                                if (editAdditionalCost === 0) setEditAdditionalCost("");
                              }}
                              onBlur={() => {
                                if (editAdditionalCost === "") setEditAdditionalCost(0);
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                         <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-[10px] space-y-1 font-mono text-slate-450">
                          <div className="flex justify-between">
                            <span>Gross Item Total</span>
                            <span>{convertAndFormatPrice(editFinancialSummary.subtotal, 1.0, 'IDR')}</span>
                          </div>
                          {editFinancialSummary.discAmount > 0 && (
                            <div className="flex justify-between text-emerald-450">
                              <span>Rank Disc (-{editDiscountPercent}%)</span>
                              <span>-{convertAndFormatPrice(editFinancialSummary.discAmount, 1.0, 'IDR')}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>VAT Duty ({editVatPercent}%)</span>
                            <span>{convertAndFormatPrice(editFinancialSummary.taxAmount, 1.0, 'IDR')}</span>
                          </div>
                          {Number(editAdditionalCost || 0) > 0 && (
                            <div className="flex justify-between text-indigo-300">
                              <span>Additional Cost</span>
                              <span>+{convertAndFormatPrice(Number(editAdditionalCost || 0), 1.0, 'IDR')}</span>
                            </div>
                          )}
                          <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-indigo-400 text-xs text-slate-200">
                            <span>New Draft net pricing</span>
                            <span>{convertAndFormatPrice(editFinancialSummary.totalAmount, 1.0, 'IDR')}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Save actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingDraft(false)}
                        className="flex-1 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 rounded-lg font-bold transition-all text-xs"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        disabled={editOrderItems.length === 0}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-800 disabled:text-slate-500 text-slate-50 rounded-lg font-bold transition-all text-xs"
                      >
                        Save Voucher
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Order Top Summary */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        O2C Lifecycle
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                        selectedOrder.status === 'Draft' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : selectedOrder.status === 'Picking'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : selectedOrder.status === 'DeliveryApproval'
                          ? 'bg-purple-500/10 text-purple-450 border border-purple-500/20'
                          : selectedOrder.status === 'FullyDelivered'
                          ? 'bg-teal-500/10 text-teal-350 border border-teal-500/20'
                          : selectedOrder.status === 'Invoiced'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <h3 className="font-mono font-extrabold text-slate-100 text-lg">
                      {selectedOrder.soNumber}
                    </h3>
                  </div>
                  
                  {/* Master Value */}
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Order Net Cost</span>
                    <span className="font-mono text-base font-bold text-indigo-400">
                      {convertAndFormatPrice(selectedOrder.netAmount, 1.0, selectedOrder.currency)}
                    </span>
                  </div>
                </div>

                {/* Print Layout Document Triggers Row */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-2 border border-slate-800/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => printSalesDocument('picking', selectedOrder)}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-slate-350 hover:text-slate-100 transition-all text-[11px] font-bold cursor-pointer rounded-lg"
                    title="Print A4 Picking Checklist"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Picking slips</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => printSalesDocument('delivery', selectedOrder)}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-slate-350 hover:text-slate-100 transition-all text-[11px] font-bold cursor-pointer rounded-lg"
                    title="Print A4 Delivery Order"
                  >
                    <Truck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Print DO</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => printSalesDocument('invoice', selectedOrder)}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 text-slate-350 hover:text-slate-100 transition-all text-[11px] font-bold cursor-pointer rounded-lg"
                    title="Print A4 Commercial Invoice"
                  >
                    <Receipt className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Print Invoice</span>
                  </button>
                </div>

                {/* Main Action Block Based on status */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    Milestone Instructions & Controls
                  </h4>

                  {selectedOrder.status === 'Draft' && (
                    <div className="space-y-3 text-xs leading-relaxed">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => updateSalesOrderStatus(selectedOrder.id, 'Picking')}
                          className="w-full py-2.5 px-4 bg-indigo-600 text-slate-50 rounded-lg font-bold hover:bg-indigo-505 transition-all text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                        >
                          Generate Pick List
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === 'Picking' && (
                    <div className="space-y-4">
                      {/* Picking checklist */}
                      <div className="space-y-2.5 max-h-56 overflow-y-auto">
                        {(selectedOrder.pickingList || []).map((pick, idx) => {
                          const matchedItem = items.find(item => item.sku === pick.sku);
                          return (
                            <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-3">
                              <div className="flex items-center justify-between text-xs gap-3">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div 
                                    className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-indigo-505 transition-colors relative group"
                                    onClick={() => setZoomedImageUrl(matchedItem?.imageUrl || 'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=800&auto=format&fit=crop')}
                                    title="Click to zoom item photo"
                                  >
                                    {matchedItem?.imageUrl ? (
                                      <img 
                                        src={matchedItem.imageUrl} 
                                        alt={pick.sku} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <span className="text-[8px] text-slate-600 font-mono font-bold select-none leading-none text-center">
                                        No img
                                      </span>
                                    )}
                                    <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <span className="text-[7px] text-white font-mono uppercase tracking-widest font-bold">Zoom</span>
                                    </div>
                                  </div>
                                  <div className="space-y-0.5 min-w-0">
                                    <span className="font-mono text-slate-200 font-bold block truncate">{pick.sku}</span>
                                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 font-mono">
                                      <span className="flex items-center gap-1">
                                        <Warehouse className="w-3 h-3 text-indigo-400" /> Bin: {pick.bin || 'BIN-GEN'}, Rack: {pick.rack || 'RACK-GEN'}
                                      </span>
                                      <span className="text-slate-400">
                                        Required Qty: <span className="text-slate-200 font-bold">{pick.quantityRequired}</span> units
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copyList = [...(selectedOrder.pickingList || [])];
                                    const p = copyList[idx];
                                    p.picked = !p.picked;
                                    p.quantityPicked = p.picked ? p.quantityRequired : 0;
                                    updateSalesOrderStatus(selectedOrder.id, 'Picking', { pickingList: copyList }); 
                                  }}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border shrink-0 ${
                                    pick.picked
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : 'bg-slate-950 text-slate-500 border-slate-800'
                                  }`}
                                >
                                  {pick.picked ? <Check className="w-3.5 h-3.5" /> : null}
                                  {pick.picked ? 'Fully Picked' : 'Check off All'}
                                </button>
                              </div>

                              {/* Interactive Qty Picker for Partial Delivery */}
                              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-850">
                                <span className="text-[10px] font-mono text-slate-400">
                                  Quantity Picked for Delivery:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const copyList = [...(selectedOrder.pickingList || [])];
                                      const p = copyList[idx];
                                      const currentVal = Number(p.quantityPicked || 0);
                                      p.quantityPicked = Math.max(0, currentVal - 1);
                                      p.picked = p.quantityPicked === p.quantityRequired;
                                      updateSalesOrderStatus(selectedOrder.id, 'Picking', { pickingList: copyList }); 
                                    }}
                                    className="w-6 h-6 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    max={pick.quantityRequired}
                                    value={pick.quantityPicked}
                                    onChange={(e) => {
                                      const val = Math.min(pick.quantityRequired, Math.max(0, Number(e.target.value) || 0));
                                      const copyList = [...(selectedOrder.pickingList || [])];
                                      const p = copyList[idx];
                                      p.quantityPicked = val;
                                      p.picked = p.quantityPicked === p.quantityRequired;
                                      updateSalesOrderStatus(selectedOrder.id, 'Picking', { pickingList: copyList }); 
                                    }}
                                    className="w-12 text-center bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded py-0.5 font-mono outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const copyList = [...(selectedOrder.pickingList || [])];
                                      const p = copyList[idx];
                                      const currentVal = Number(p.quantityPicked || 0);
                                      p.quantityPicked = Math.min(p.quantityRequired, currentVal + 1);
                                      p.picked = p.quantityPicked === p.quantityRequired;
                                      updateSalesOrderStatus(selectedOrder.id, 'Picking', { pickingList: copyList }); 
                                    }}
                                    className="w-6 h-6 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => updateSalesOrderStatus(selectedOrder.id, 'DeliveryApproval')}
                        disabled={(selectedOrder.pickingList || []).reduce((acc, p) => acc + (p.quantityPicked || 0), 0) === 0}
                        className="w-full py-2.5 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-50 rounded-lg font-bold hover:bg-indigo-505 transition-all text-xs"
                      >
                        Lock Checklist & Submit for Supervisor Sign-Off
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === 'DeliveryApproval' && (
                    <div className="space-y-3.5 text-xs leading-relaxed">
                      {/* Secure supervisor validation */}
                      {userProfile?.role === 'admin' || userProfile?.role === 'manager' ? (
                        <button
                          type="button"
                          onClick={() => updateSalesOrderStatus(selectedOrder.id, 'Invoiced')}
                          className="w-full py-2.5 bg-indigo-600 text-slate-50 rounded-lg font-bold hover:bg-indigo-505 transition-all text-xs"
                        >
                          Approve Delivery & Trigger SOH Dispatch
                        </button>
                      ) : (
                        <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-red-300 flex items-start gap-2.5">
                          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-0.5">
                            <span className="font-bold uppercase tracking-wide text-[9px] font-mono text-red-200">Supervisor Auths Required</span>
                            <p className="text-[11px] text-red-400">Your simulated role ({userProfile?.role || 'Guest'}) does not hold delivery authorization clearance.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedOrder.status === 'Invoiced' && (
                    <div className="space-y-3 text-xs leading-relaxed">
                      <button
                        type="button"
                        onClick={() => updateSalesOrderStatus(selectedOrder.id, 'Paid')}
                        className="w-full py-2.5 bg-emerald-600 text-slate-50 rounded-lg font-bold hover:bg-emerald-500 transition-all text-xs"
                      >
                        Record Invoice Payment
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === 'Paid' && (
                    <div className="space-y-2 text-xs text-center py-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-200">O2C Loop Fulfill Success</p>
                        <p className="text-slate-400">Sales sequence is secured, paid, and audited.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Deliveries & Invoicing Section */}
                {(() => {
                  const orderDeliveries = (deliveries || []).filter(d => d.salesOrderId === selectedOrder.id);
                  const orderInvoices = (invoices || []).filter(inv => inv.salesOrderId === selectedOrder.id);

                  if (orderDeliveries.length === 0 && selectedOrder.status !== 'FullyDelivered' && selectedOrder.status !== 'Invoiced' && selectedOrder.status !== 'Paid') {
                    return null;
                  }

                  // Calculate combined item totals for selected deliveries
                  const combinedItems: { sku: string; name: string; quantity: number; price: number; subtotal: number }[] = [];
                  let grossTotal = 0;
                  
                  selectedDeliveryIds.forEach(dlId => {
                    const dl = orderDeliveries.find(d => d.id === dlId);
                    if (!dl) return;
                    dl.items.forEach(dlIt => {
                      const soIt = selectedOrder.items.find(i => i.sku === dlIt.sku);
                      const unitPrice = soIt ? soIt.price : 0;
                      const sub = dlIt.quantityDelivered * unitPrice;
                      
                      const existing = combinedItems.find(item => item.sku === dlIt.sku);
                      if (existing) {
                        existing.quantity += dlIt.quantityDelivered;
                        existing.subtotal += sub;
                      } else {
                        combinedItems.push({
                          sku: dlIt.sku,
                          name: dlIt.name,
                          quantity: dlIt.quantityDelivered,
                          price: unitPrice,
                          subtotal: sub
                        });
                      }
                      grossTotal += sub;
                    });
                  });

                  const discPercent = selectedOrder.discountPercent || 0;
                  const vatPercentVal = selectedOrder.vatPercent || 11;
                  
                  const discAmt = grossTotal * (discPercent / 100);
                  const taxableAmt = grossTotal - discAmt;
                  const taxAmtVal = taxableAmt * (vatPercentVal / 100);
                  const extraCost = selectedOrder.additionalCost || 0;
                  const netInvAmount = taxableAmt + taxAmtVal + extraCost;

                  return (
                    <div className="space-y-4 border-t border-slate-800 pt-4" id="deliveries_invoicing_card">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-450">
                          Deliveries & Consolidated Invoices
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Invoice several shipments into a single billing statement and record payments.
                        </p>
                      </div>

                      {/* Deliveries List */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider block">
                          Dispatched Shipments ({orderDeliveries.length})
                        </span>
                        
                        {orderDeliveries.length === 0 ? (
                          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-[11px] text-slate-400 italic">
                            No shipments dispatched yet. Generate picks first.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {orderDeliveries.map(dl => {
                              const isChecked = selectedDeliveryIds.includes(dl.id);
                              return (
                                <div key={dl.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-705 transition-all">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      {dl.status === 'Uninvoiced' && (
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedDeliveryIds(prev => [...prev, dl.id]);
                                            } else {
                                              setSelectedDeliveryIds(prev => prev.filter(id => id !== dl.id));
                                            }
                                          }}
                                          className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 outline-none cursor-pointer"
                                        />
                                      )}
                                      <span className="font-mono text-[11px] font-bold text-slate-200">
                                        {dl.deliveryNumber}
                                      </span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                      dl.status === 'Uninvoiced'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                      {dl.status}
                                    </span>
                                  </div>

                                  <div className="text-[9px] text-slate-500 font-mono flex flex-wrap gap-x-3">
                                    <span>Shipper: {dl.deliveredBy}</span>
                                    <span>Date: {dl.deliveredAt.substring(0, 10)}</span>
                                  </div>

                                  <div className="border-t border-slate-850/60 pt-1.5 space-y-1">
                                    {dl.items.map((it, idx) => (
                                      <div key={idx} className="flex justify-between text-[10px] font-mono text-slate-400">
                                        <span>{it.sku} ({it.name})</span>
                                        <span className="font-bold text-slate-350">{it.quantityDelivered}x</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* consolidated billing generator helper */}
                      {selectedDeliveryIds.length > 0 && (
                        <div className="p-3.5 bg-indigo-950/15 border border-indigo-900/30 rounded-2xl space-y-3">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-[10px] uppercase text-indigo-400 block">
                              Consolidating {selectedDeliveryIds.length} Shipment{selectedDeliveryIds.length > 1 ? 's' : ''}
                            </span>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                              {combinedItems.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-[10px] font-mono text-slate-300">
                                  <span>{it.quantity}x {it.sku}</span>
                                  <span>{convertAndFormatPrice(it.subtotal, 1.0, selectedOrder.currency)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-indigo-900/20 pt-2 space-y-1 text-[10px] font-mono text-slate-400">
                            <div className="flex justify-between">
                              <span>Sum Gross Total</span>
                              <span>{convertAndFormatPrice(grossTotal, 1.0, selectedOrder.currency)}</span>
                            </div>
                            {discPercent > 0 && (
                              <div className="flex justify-between text-emerald-400">
                                <span>Disc (-{discPercent}%)</span>
                                <span>-{convertAndFormatPrice(discAmt, 1.0, selectedOrder.currency)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>VAT ({vatPercentVal}%)</span>
                              <span>{convertAndFormatPrice(taxAmtVal, 1.0, selectedOrder.currency)}</span>
                            </div>
                            {extraCost > 0 && (
                              <div className="flex justify-between text-indigo-300">
                                <span>Freight/Addt Cost</span>
                                <span>+{convertAndFormatPrice(extraCost, 1.0, selectedOrder.currency)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-indigo-400 font-bold text-xs pt-1 border-t border-indigo-900/10">
                              <span>Invoice Net Payable</span>
                              <span>{convertAndFormatPrice(netInvAmount, 1.0, selectedOrder.currency)}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              const suffix = String(Date.now()).slice(-4);
                              const invNumber = `INV-${selectedOrder.soNumber.substring(3)}-${suffix}`;
                              await createInvoice({
                                invoiceNumber: invNumber,
                                customerId: selectedOrder.customerId,
                                customerName: selectedOrder.customerName,
                                deliveryIds: selectedDeliveryIds,
                                items: combinedItems,
                                totalAmount: grossTotal,
                                discountPercent: discPercent,
                                discountAmount: discAmt,
                                taxAmount: taxAmtVal,
                                netAmount: netInvAmount,
                                salesOrderId: selectedOrder.id,
                                salesOrderNumber: selectedOrder.soNumber
                              });
                              setSelectedDeliveryIds([]);
                            }}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer text-center"
                          >
                            Generate Consolidated Invoice
                          </button>
                        </div>
                      )}

                      {/* Invoices List */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider block">
                          Sales Billing Invoices ({orderInvoices.length})
                        </span>

                        {orderInvoices.length === 0 ? (
                          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-[11px] text-slate-400 italic">
                            No billing statements generated yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {orderInvoices.map(inv => (
                              <div key={inv.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-slate-755 transition-all">
                                <div className="flex justify-between items-center">
                                  <div className="space-y-0.5">
                                    <span className="font-mono text-[11px] font-bold text-slate-200 block">
                                      {inv.invoiceNumber}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-mono">
                                      Generated: {inv.createdAt.substring(0, 10)}
                                    </span>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                    inv.status === 'Paid'
                                      ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                                      : 'bg-red-500/10 text-red-100 border border-red-500/20'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </div>

                                <div className="border-t border-slate-800 pt-1.5 font-mono text-[10px] text-slate-400 space-y-1">
                                  {inv.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span>{it.quantity}x {it.sku}</span>
                                      <span className="text-slate-300">{convertAndFormatPrice(it.subtotal, 1.0, selectedOrder.currency)}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between font-bold text-slate-200 text-xs border-t border-slate-800 pt-1.5">
                                    <span>Total Payable</span>
                                    <span className="text-indigo-400">{convertAndFormatPrice(inv.netAmount, 1.0, selectedOrder.currency)}</span>
                                  </div>
                                </div>

                                {inv.status === 'Unpaid' && (
                                  <button
                                    type="button"
                                    onClick={() => payInvoice(inv.id)}
                                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold rounded cursor-pointer"
                                  >
                                    Record Payment ({convertAndFormatPrice(inv.netAmount, 1.0, selectedOrder.currency)})
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Display item ledger matrices */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">
                    Bill item matrix
                  </h4>
                  <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto pr-1">
                    {selectedOrder.items.map((it) => {
                      const matchedItem = items.find(item => item.sku === it.sku);
                      return (
                        <div key={it.sku} className="py-2.5 flex justify-between items-center text-xs text-slate-300 gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Miniature Click-to-Zoom Item Photo */}
                            <div 
                              className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-indigo-550 transition-colors relative group"
                              onClick={() => setZoomedImageUrl(matchedItem?.imageUrl || 'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=800&auto=format&fit=crop')}
                              title="Click to zoom item photo"
                            >
                              {matchedItem?.imageUrl ? (
                                <img 
                                  src={matchedItem.imageUrl} 
                                  alt={it.name || it.sku} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-[8px] text-slate-600 font-mono font-bold select-none leading-none text-center">
                                  No img
                                </span>
                              )}
                              <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-[7px] text-white font-mono uppercase tracking-widest font-bold">Zoom</span>
                              </div>
                            </div>
                            <span className="sr-only">Zoom item image</span>
                            
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-mono text-slate-200 font-semibold block truncate">{it.sku}</span>
                              <p className="text-[10px] text-slate-500 truncate">{it.name || 'Catalog Item'}</p>
                              <div className="flex gap-2 text-[10px]">
                                <span className="text-slate-500">Qty Ordered: {it.quantity}x</span>
                                {selectedOrder.status !== 'Draft' && (
                                  <span className="text-indigo-400 font-semibold font-mono">
                                    Qty Picked: {(() => {
                                      const pickObj = (selectedOrder.pickingList || []).find(p => p.sku === it.sku);
                                      return pickObj ? (pickObj.quantityPicked !== undefined ? pickObj.quantityPicked : (pickObj.picked ? pickObj.quantityRequired : 0)) : 0;
                                    })()}x
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <span className="font-mono text-slate-400 shrink-0">
                            {convertAndFormatPrice(it.price, 1.0, selectedOrder.currency)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Financial computations layout */}
                  <div className="bg-slate-950 p-3.5 border border-slate-800 rounded-2xl text-xs font-mono space-y-1.5 text-slate-400">
                    <div className="flex justify-between">
                      <span>Total Gross Cost</span>
                      <span>{convertAndFormatPrice(selectedOrder.totalAmount, 1.0, selectedOrder.currency)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount ({selectedOrder.discountPercent}%)</span>
                        <span>-{convertAndFormatPrice(selectedOrder.discountAmount, 1.0, selectedOrder.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>VAT Tax ({selectedOrder.vatPercent !== undefined ? selectedOrder.vatPercent : 11}%)</span>
                      <span>{convertAndFormatPrice(selectedOrder.taxAmount, 1.0, selectedOrder.currency)}</span>
                    </div>
                    {selectedOrder.additionalCost !== undefined && selectedOrder.additionalCost > 0 && (
                      <div className="flex justify-between text-indigo-300">
                        <span>Additional Cost</span>
                        <span>+{convertAndFormatPrice(selectedOrder.additionalCost, 1.0, selectedOrder.currency)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-slate-100">
                      <span>Final Net Total</span>
                      <span className="text-indigo-400">{convertAndFormatPrice(selectedOrder.netAmount, 1.0, selectedOrder.currency)}</span>
                    </div>
                  </div>
                </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-full bg-slate-900/10 border border-dashed border-slate-800/80 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3">
                <ListOrdered className="w-10 h-10 text-slate-600 animate-pulse" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-300">Lifecycle Operations View</h4>
                  <p className="text-slate-500 text-xs max-w-sm leading-relaxed">
                    Select any created sales voucher code from the index to inspect billing computations, pick locations, and supervisor delivery gates.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: CREATE NEW SALES DRAFT */}
      {activeTab === 'CREATE' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-6">
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-100 text-lg">Draft Sales Order Voucher</h3>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-250 font-sans leading-relaxed">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreateOrderSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Customer chooser */}
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Customer Profile
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="">-- Select Customer Account --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                  ))}
                </select>
                {customerId && (
                  <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                     Class Rank Discount: {custGroupLabel} ({custDiscPercent}%)
                  </span>
                )}
              </div>

              {/* Warehouse selector */}
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Dispatch Facility (Units locked here)
                </label>
                <select
                  value={targetWarehouseCode}
                  onChange={(e) => setTargetWarehouseCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                >
                  {warehouses.map(w => (
                    <option key={w.code} value={w.code}>{w.code} - {w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick item container composer */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800/85 p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-indigo-400">
                Add Items Matrix
              </h4>

              <div className="space-y-4">
                {/* Row 1: Item SKU/Name and Qty in 1 row */}
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8 sm:col-span-10 relative">
                    <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Item SKU or Name
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
                      placeholder="Type Item Sku or Name..."
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                      autoComplete="off"
                    />

                    {/* Autocomplete dynamic suggestion popup container */}
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

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Qty
                    </label>
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500/60 transition-all h-[38px] w-full">
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
                        className="w-full text-center bg-transparent border-0 focus:ring-0 outline-none px-0.5 text-[10px] font-mono text-slate-150"
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
                  </div>
                </div>

                {/* Row 2: Discount and Price in 1 row */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Disc %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Disc %"
                      value={selDiscount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setSelDiscount("");
                        } else {
                          setSelDiscount(Math.min(100, Math.max(0, Number(val))));
                        }
                      }}
                      onFocus={() => {
                        if (selDiscount === 0) setSelDiscount("");
                      }}
                      onBlur={() => {
                        if (selDiscount === "") setSelDiscount(0);
                      }}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-150 focus:outline-none text-xs font-mono w-full"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Selling Price
                    </label>
                    <input
                      type="text"
                      placeholder="Price"
                      value={formatThousandDots(selPrice)}
                      onChange={(e) => {
                        const parsed = parseThousandDots(e.target.value);
                        if (parsed === "") {
                          setSelPrice("");
                        } else {
                          setSelPrice(Math.max(0, parsed));
                        }
                      }}
                      onFocus={() => {
                        if (selPrice === 0) setSelPrice("");
                      }}
                      onBlur={() => {
                        if (selPrice === "") setSelPrice(0);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-150 focus:outline-none text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Row 3: Add button below */}
                <div>
                  <button
                    type="button"
                    onClick={addItemToDraftList}
                    className="w-full py-2.5 px-4 bg-indigo-600 text-slate-50 font-bold rounded-xl hover:bg-indigo-500 transition-all text-xs flex justify-center items-center gap-1.5 cursor-pointer h-[38px]"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {/* Audit helper for selected Sku */}
                {selSku && (
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl text-[11px] font-sans">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-mono text-[10px] uppercase">Last PO Price:</span>
                        {lastPurchasePrice !== null ? (
                          <span className="font-mono font-bold text-emerald-400">
                            {convertAndFormatPrice(lastPurchasePrice, 1.0, 'IDR')}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]">No PO History</span>
                        )}
                      </div>

                      {Number(selDiscount || 0) > 0 && (
                        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
                          <span className="text-slate-500 font-mono text-[10px] uppercase">Net Unit Price:</span>
                          <span className="font-mono font-bold text-indigo-400">
                            {convertAndFormatPrice(Number(selPrice || 0) * (1 - Number(selDiscount || 0) / 100), 1.0, 'IDR')}
                          </span>
                          <span className="text-slate-500 line-through text-[10px]">
                            ({convertAndFormatPrice(Number(selPrice || 0), 1.0, 'IDR')})
                          </span>
                        </div>
                      )}
                    </div>

                    {lastPurchasePrice !== null && (
                      <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-850 font-mono">
                        <span className="text-slate-500 font-sans text-[10px] uppercase">Est markup:</span>
                        {(() => {
                          const costIDR = lastPurchasePrice;
                          const netUnit = Number(selPrice || 0) * (1 - Number(selDiscount || 0) / 100);
                          const markupAmt = netUnit - costIDR;
                          const markupPercent = costIDR > 0 ? (markupAmt / costIDR) * 100 : 0;
                          return (
                            <span className={`font-mono font-semibold ${markupPercent >= 0 ? 'text-emerald-400' : 'text-rose-450'}`}>
                              {markupPercent >= 0 ? '+' : ''}{markupPercent.toFixed(1)}%
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Items loaded in basket */}
              {orderItems.length > 0 && (
                <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto space-y-1">
                  {orderItems.map((oi) => {
                    const matchedItem = items.find(item => item.sku === oi.sku);
                    const costIDR = getItemCostIDR(oi.sku);
                    const isNegativeMarkup = oi.price < costIDR;
                    const markupAmt = oi.price - costIDR;
                    const markupPercent = costIDR > 0 ? (markupAmt / costIDR) * 100 : 0;
                    return (
                      <div 
                        key={oi.sku} 
                        className={`py-2 px-2.5 rounded-lg flex justify-between items-center text-xs gap-3 transition-colors ${
                          isNegativeMarkup 
                            ? 'bg-rose-950/25 border border-rose-900/40 my-1' 
                            : 'hover:bg-slate-900/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Item draft image */}
                          <div 
                            className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-indigo-550 transition-colors relative group"
                            onClick={() => setZoomedImageUrl(matchedItem?.imageUrl || 'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=800&auto=format&fit=crop')}
                            title="Click to zoom item photo"
                          >
                            {matchedItem?.imageUrl ? (
                              <img 
                                src={matchedItem.imageUrl} 
                                alt={oi.sku} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-[8px] text-slate-600 font-mono font-bold select-none leading-none text-center">
                                No img
                              </span>
                            )}
                            <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[7px] text-white font-mono uppercase tracking-widest font-bold">Zoom</span>
                            </div>
                          </div>
                          
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-slate-200 font-semibold block truncate">{oi.sku}</span>
                              {isNegativeMarkup && (
                                                            <span className="text-[9px] bg-rose-500/25 text-rose-450 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 shrink-0" title={`Unit Cost: ${convertAndFormatPrice(costIDR, 1.0, 'IDR')}`}>
                                                              {markupPercent.toFixed(1)}%
                                                            </span>
                                                          )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{matchedItem?.name || 'Order Item'}</p>
                            <p className="text-[10px] text-slate-500">Ordered: <span className="font-semibold text-slate-450">{oi.quantity}x</span> @ {convertAndFormatPrice(oi.price, 1.0, 'IDR')}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-slate-350">{convertAndFormatPrice(oi.quantity * oi.price, 1.0, 'IDR')}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => editItemInDraftList(oi)}
                              className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 p-1.5 rounded transition-all cursor-pointer"
                              title="Edit item detail configuration"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItemFromDraftList(oi.sku)}
                              className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded transition-all cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Financial summaries computation card */}
            {orderItems.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-3 rounded-xl border border-slate-850">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-450 uppercase mb-1">
                      Discount %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={soDiscountPercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setSoDiscountPercent("");
                        } else {
                          setSoDiscountPercent(Math.max(0, Math.min(100, Number(val) || 0)));
                        }
                      }}
                      onFocus={() => {
                        if (soDiscountPercent === 0) setSoDiscountPercent("");
                      }}
                      onBlur={() => {
                        if (soDiscountPercent === "") setSoDiscountPercent(0);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-450 uppercase mb-1">
                      VAT %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={soVatPercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setSoVatPercent("");
                        } else {
                          setSoVatPercent(Math.max(0, Math.min(100, Number(val) || 0)));
                        }
                      }}
                      onFocus={() => {
                        if (soVatPercent === 11 || soVatPercent === 0) setSoVatPercent("");
                      }}
                      onBlur={() => {
                        if (soVatPercent === "") setSoVatPercent(11);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-450 uppercase mb-1">
                      Addl Cost
                    </label>
                    <input
                      type="text"
                      value={formatThousandDots(soAdditionalCost)}
                      onChange={(e) => {
                        const parsed = parseThousandDots(e.target.value);
                        if (parsed === "") {
                          setSoAdditionalCost("");
                        } else {
                          setSoAdditionalCost(Math.max(0, parsed));
                        }
                      }}
                      onFocus={() => {
                        if (soAdditionalCost === 0) setSoAdditionalCost("");
                      }}
                      onBlur={() => {
                        if (soAdditionalCost === "") setSoAdditionalCost(0);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl text-xs space-y-1.5 font-mono text-slate-450">
                  <div className="flex justify-between">
                    <span>Gross Item Total</span>
                    <span>{convertAndFormatPrice(financialSummary.subtotal, 1.0, 'IDR')}</span>
                  </div>
                  {financialSummary.discAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Rank Disc (-{soDiscountPercent}%)</span>
                      <span>-{convertAndFormatPrice(financialSummary.discAmount, 1.0, 'IDR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>VAT Duty ({soVatPercent}%)</span>
                    <span>{convertAndFormatPrice(financialSummary.taxAmount, 1.0, 'IDR')}</span>
                  </div>
                  {Number(soAdditionalCost || 0) > 0 && (
                    <div className="flex justify-between text-indigo-300">
                      <span>Additional Cost</span>
                      <span>+{convertAndFormatPrice(Number(soAdditionalCost || 0), 1.0, 'IDR')}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-indigo-400 text-sm">
                    <span>Draft Net Pricing</span>
                    <span>{convertAndFormatPrice(financialSummary.totalAmount, 1.0, 'IDR')}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={orderItems.length === 0}
              className="w-full py-3 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-50 rounded-xl font-bold hover:bg-indigo-500 transition-all text-xs"
            >
              Draft Order & Book Site Stocks
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: PAYMENTS & BILLING */}
      {activeTab === 'PAYMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Left Panel: Record Consolidated Payment */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-400" />
                Record Consolidated Payment Voucher
              </h3>
            </div>

            {paymentSuccess && (
              <div id="payment-success-banner" className="p-3.5 bg-emerald-950/25 border border-emerald-900/40 rounded-xl text-xs text-emerald-200">
                {paymentSuccess}
              </div>
            )}

            {paymentError && (
              <div id="payment-error-banner" className="p-3.5 bg-red-950/25 border border-red-900/40 rounded-xl text-xs text-red-200">
                {paymentError}
              </div>
            )}

            <div className="space-y-4">
              {/* Select Customer */}
              <div>
                <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Customer Account
                </label>
                <select
                  id="payment-customer-select"
                  value={paymentCustomerId}
                  onChange={(e) => {
                    setPaymentCustomerId(e.target.value);
                    setPaymentSelectedInvoiceIds([]);
                    setPaymentError('');
                    setPaymentSuccess('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Invoices List for Selected Customer */}
              {paymentCustomerId && (() => {
                const unpaidCustomerInvoices = invoices.filter(
                  inv => inv.customerId === paymentCustomerId && inv.status === 'Unpaid'
                );

                if (unpaidCustomerInvoices.length === 0) {
                  return (
                    <div className="p-8 bg-slate-950/40 border border-dashed border-slate-800/80 rounded-2xl text-center text-slate-500 italic text-xs">
                      All invoices for this customer have already been fully collected! No unpaid invoices found.
                    </div>
                  );
                }

                // Sum total selected
                const totalSelectedPayable = unpaidCustomerInvoices
                  .filter(inv => paymentSelectedInvoiceIds.includes(inv.id))
                  .reduce((sum, inv) => sum + inv.netAmount, 0);

                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
                        Choose Invoices to Settle under this Receipt ({unpaidCustomerInvoices.length} Unpaid)
                      </label>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {unpaidCustomerInvoices.map((inv) => {
                          const isChecked = paymentSelectedInvoiceIds.includes(inv.id);
                          return (
                            <div 
                              key={inv.id} 
                              onClick={() => {
                                if (isChecked) {
                                  setPaymentSelectedInvoiceIds(prev => prev.filter(id => id !== inv.id));
                                } else {
                                  setPaymentSelectedInvoiceIds(prev => [...prev, inv.id]);
                                }
                              }}
                              className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 select-none ${
                                isChecked 
                                  ? 'bg-indigo-950/20 border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]' 
                                  : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Handle on parent div click for wider touch target
                                className="w-4 h-4 mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 outline-none cursor-pointer shrink-0"
                              />

                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex justify-between items-center">
                                  <span className="font-mono text-xs font-bold text-slate-200 block truncate">
                                    {inv.invoiceNumber}
                                  </span>
                                  <span className="font-mono text-xs font-bold text-indigo-400 shrink-0">
                                    {convertAndFormatPrice(inv.netAmount, 1.0, 'IDR')}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 text-[10px] text-slate-505 font-mono">
                                  <span>SO: {inv.salesOrderNumber}</span>
                                  <span>Date: {inv.createdAt.substring(0, 10)}</span>
                                </div>

                                <div className="border-t border-slate-900/60 pt-1 text-[10px] text-slate-400 font-mono truncate">
                                  Items: {inv.items.map(it => `${it.quantity}x ${it.sku}`).join(', ')}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Consolidated Details and Receipt Booking Form */}
                    {paymentSelectedInvoiceIds.length > 0 && (
                      <div className="bg-slate-950 border border-slate-805 rounded-2xl p-4 space-y-4">
                        <div className="flex justify-between items-center text-xs font-mono font-bold text-indigo-400 border-b border-slate-900 pb-2">
                          <span>CONSOLIDATED COLLECTION TOTAL</span>
                          <span>{convertAndFormatPrice(totalSelectedPayable, 1.0, 'IDR')}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Payment Method */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Payment Method
                            </label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as any)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                            >
                              <option value="Bank Transfer">Bank Transfer (Giro/Wire)</option>
                              <option value="Cash">Cash (Physical Currency)</option>
                              <option value="Credit Card">Credit Card</option>
                              <option value="Cheque">Corporate Cheque</option>
                              <option value="Cash On Delivery">Cash On Delivery (COD)</option>
                            </select>
                          </div>

                          {/* Reference Number */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Reference Number / Receipt ID
                            </label>
                            <input
                              type="text"
                              value={paymentReferenceNumber}
                              onChange={(e) => setPaymentReferenceNumber(e.target.value)}
                              placeholder="e.g. SLIP-X82729-IDR"
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Payment Memo / Cashier Notes
                          </label>
                          <textarea
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            rows={2}
                            placeholder="Add bank accounts details, cheque clearings dates, etc..."
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 font-sans resize-none"
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            setPaymentError('');
                            setPaymentSuccess('');
                            try {
                              const selectedInvs = unpaidCustomerInvoices.filter(inv =>
                                paymentSelectedInvoiceIds.includes(inv.id)
                              );
                              
                              const targetCustomer = customers.find(c => c.id === paymentCustomerId);

                              await createPayment({
                                customerId: paymentCustomerId,
                                customerName: targetCustomer ? targetCustomer.name : 'Unknown Customer',
                                invoiceIds: paymentSelectedInvoiceIds,
                                invoiceNumbers: selectedInvs.map(inv => inv.invoiceNumber),
                                totalPaid: totalSelectedPayable,
                                paymentMethod: paymentMethod,
                                referenceNumber: paymentReferenceNumber,
                                notes: paymentNotes
                              });

                              setPaymentSuccess(`Successfully captured single payment receipt for ${paymentSelectedInvoiceIds.length} invoice(s)! Total: ${convertAndFormatPrice(totalSelectedPayable, 1.0, 'IDR')}`);
                              setPaymentSelectedInvoiceIds([]);
                              setPaymentReferenceNumber('');
                              setPaymentNotes('');
                            } catch (err: any) {
                              setPaymentError(err.message || 'Firestore block: failed to register payment.');
                            }
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-sans rounded-xl transition-all cursor-pointer h-[38px] flex justify-center items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          Record Consolidated Collection Receipt
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {!paymentCustomerId && (
                <div className="py-16 bg-slate-955/20 border border-dashed border-slate-850 rounded-3xl text-center text-slate-500 italic text-xs max-w-sm mx-auto">
                   Select a customer account in the dropdown above to fetch outstandings and trigger the single-payment wizard.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Historical Cash Receipts */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                Historical Cash Receipts ({payments?.length || 0})
              </h3>
            </div>

            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {(payments || []).map((pay) => (
                <div 
                  key={pay.id}
                  className="p-3.5 bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl space-y-3 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="font-mono text-xs font-extrabold text-slate-100 block">
                        {pay.paymentNumber}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Received: {pay.paidAt ? pay.paidAt.replace('T', ' ').substring(0, 16) : 'N/A'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-emerald-400">
                      +{convertAndFormatPrice(pay.totalPaid, 1.0, 'IDR')}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 border-t border-slate-900 pt-2 text-slate-300 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono text-[9px] uppercase">Customer:</span>
                      <span className="font-semibold text-slate-205">{pay.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono text-[9px] uppercase">Paid Invoices:</span>
                      <span className="font-mono font-bold text-indigo-400 text-right max-w-[200px] truncate">
                        {(pay.invoiceNumbers || []).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-mono text-[9px] uppercase">Method:</span>
                      <span className="font-mono text-slate-205">{pay.paymentMethod}</span>
                    </div>
                    {pay.referenceNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-mono text-[9px] uppercase">Ref ID:</span>
                        <span className="font-mono text-indigo-350">{pay.referenceNumber}</span>
                      </div>
                    )}
                    {pay.notes && (
                      <div className="border-t border-slate-900/40 mt-1 pt-1 text-[10px] text-slate-400 italic">
                        Memo: {pay.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {(!payments || payments.length === 0) && (
                <div className="py-12 bg-slate-950/20 border border-dashed border-slate-805 rounded-3xl text-center text-slate-500 italic text-xs leading-relaxed">
                  No payment vouchers processed yet. Settle any unpaid bill statements using the recorder panel to the left.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Product Image Lightbox Modal */}
      {zoomedImageUrl && (
        <div 
          id="zoom-lightbox-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in cursor-pointer w-full h-full"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-3.5 shadow-2xl cursor-default animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="zoom-close-btn"
              type="button"
              onClick={() => setZoomedImageUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white border border-slate-850 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="sr-only">Close View</span>
            
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-850 flex items-center justify-center">
              <img 
                src={zoomedImageUrl} 
                alt="Zoomed product spec detail" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="mt-3.5 px-1.5 flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
              <span className="text-slate-500 font-bold">Sales Order Product Reference</span>
              <button 
                type="button"
                onClick={() => setZoomedImageUrl(null)}
                className="text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
