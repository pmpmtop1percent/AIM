/**
 * Alphalux AIM Enterprise WMS - Unified Types and Interfaces
 */

export type UserRole = 'admin' | 'manager' | 'purchasing' | 'auditor' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: string;
}

export interface Currency {
  code: string;       // e.g., 'IDR', 'USD', 'USD', 'EUR', 'SGD'
  symbol: string;     // e.g., 'Rp', '$', '€', 'S$'
  name: string;       // e.g., 'Rupiah', 'US Dollar', etc.
  exchangeRate: number; // Against USD (e.g., 1 USD = 1.0, 1 USD = 15300 IDR)
}

export interface ItemGroup {
  id: string;
  name: string;
  description?: string;
}

export interface CustomerGroup {
  id: string;
  name: string;
  discountPercent: number; // e.g. 0, 5, 12, 15 percentage based on rank status
}

export interface Customer {
  id: string;
  name: string;
  customerGroupId: string;
  email: string;
  phone: string;
}

export interface VendorGroup {
  id: string;
  name: string;
}

export interface Vendor {
  id: string;
  name: string;
  vendorGroupId: string;
  email: string;
  phone: string;
}

export interface Warehouse {
  code: string; // e.g., WH-MUT-01
  name: string;
  location: string;
  isCannibal?: boolean;
}

export interface SubComponentDefinition {
  sku: string;
  qty: number; // multiplier per master item dismantlement
}

export interface Item {
  sku: string; // uppercase, unique, min length 3
  name: string;
  groupId: string;
  unitCost: number; // float > 0
  sellingPrice: number; // float > 0
  minStock: number; // for triggers
  subComponents?: SubComponentDefinition[]; // for cannibalization harvesting
  description?: string;
  imageUrl?: string;
  vendorCode?: string;
  itemVendorCode?: string;
  buyPrice?: number;
  buyCurrency?: string;
}

export interface Stock {
  id: string; // `${sku}_${warehouseCode}`
  sku: string;
  warehouseCode: string;
  physicalQty: number; // physically present
  bookedQty: number; // committed to SOs that are Draft/Picking/Delivery
  bin: string;
  rack: string;
  updatedAt: string;
}

export interface SalesOrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number; // in SO currency
  subtotal: number;
}

export interface PickingItem {
  sku: string;
  bin: string;
  rack: string;
  quantityRequired: number;
  quantityPicked: number;
  picked: boolean;
}

export interface SalesOrder {
  id: string;
  soNumber: string; // SO-2026-XXXXX
  customerId: string;
  customerName: string;
  customerGroupId: string;
  date: string;
  targetWarehouseCode: string;
  currency: string;
  exchangeRate: number; // Rate to convert pricing
  items: SalesOrderItem[];
  status: 'Draft' | 'Picking' | 'DeliveryApproval' | 'FullyDelivered' | 'Invoiced' | 'Paid';
  totalAmount: number; // Total gross (sum of items * price)
  discountPercent: number;
  discountAmount: number;
  taxAmount: number; // e.g., 11% tax standard
  netAmount: number; // Final payable
  vatPercent?: number;
  additionalCost?: number;
  pickingList: PickingItem[];
  deliveryApprovedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseOrderItem {
  sku: string;
  name: string;
  quantity: number;
  cost: number; // Unit Purchase Cost
  subtotal: number;
}

export interface ReceiptItem {
  sku: string;
  quantityExpected: number;
  quantityAccepted: number;
  quantityDamaged: number;
  quantityIncorrectSKU: number;
  notes: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // PO-2026-XXXXX
  vendorId: string;
  vendorName: string;
  date: string;
  currency: string;
  exchangeRate: number;
  items: PurchaseOrderItem[];
  status: 'Draft' | 'Released' | 'ReceiptAudit' | 'Discrepancy' | 'Approved' | 'Paid';
  receiptItems?: ReceiptItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StockMovement {
  id: string;
  sku: string;
  warehouseCode: string;
  movementType: 'Inbound' | 'Outbound' | 'Adjustment' | 'Cannibalization' | 'Opname';
  referenceVoucher: string; // SO or PO or Opname number
  quantityDelta: number; // positive or negative
  cost: number; // Unit Cost of this transaction
  userEmail: string;
  timestamp: string;
}

export interface Cannibalization {
  id: string;
  masterSku: string;
  disassembledQty: number;
  componentSku: string;
  componentQty: number;
  fromWarehouse: string;
  toWarehouse: string;
  description?: string;
  status: 'Active' | 'Restored';
  userEmail: string;
  timestamp: string;
}

export interface OpnameAuditedItem {
  sku: string;
  systemQty: number;
  physicalQty: number;
  discrepancyQty: number;
  discrepancyPct: number; // ((physical - system) / system) * 100
  reason?: string;
}

export interface StockOpname {
  id: string;
  warehouseCode: string;
  segmentName: string; // physical partition block/segment, e.g. ROW-A
  status: 'Lockdown' | 'UnderReview' | 'Approved';
  itemsAudited: OpnameAuditedItem[];
  lossGainDescription?: string;
  checkedBy: string;
  approvedBy?: string;
  timestamp: string;
}

export interface DeliveryItem {
  sku: string;
  name: string;
  quantityDelivered: number;
}

export interface Delivery {
  id: string;
  deliveryNumber: string; // DL-XXXXX
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  items: DeliveryItem[];
  deliveredBy: string;
  deliveredAt: string;
  status: 'Uninvoiced' | 'Invoiced';
  invoiceId?: string;
}

export interface InvoiceItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-XXXXX
  customerId: string;
  customerName: string;
  deliveryIds: string[];
  items: InvoiceItem[];
  totalAmount: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  status: 'Unpaid' | 'Paid';
  createdAt: string;
  paidAt?: string;
  salesOrderId: string;
  salesOrderNumber: string;
}

export interface PaymentItem {
  id: string; // paymentId
  paymentNumber: string; // e.g. PAY-XXXXX
  customerId: string;
  customerName: string;
  invoiceIds: string[];
  invoiceNumbers: string[];
  totalPaid: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Credit Card' | 'Cheque' | 'Cash On Delivery';
  referenceNumber?: string;
  paidAt: string;
  capturedBy: string;
  notes?: string;
}

