import { Item, Warehouse, Customer, Vendor, CustomerGroup, Currency } from './types';

export const SEED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1.0 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', exchangeRate: 16000.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 0.92 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', exchangeRate: 1.34 }
];

export const SEED_ITEM_GROUPS = [
  { id: 'electro', name: 'Electronics', description: 'Microchips, chips, processors and circuit elements' },
  { id: 'parts', name: 'Mechanical Parts', description: 'Enclosures, screws, hardware, fans and subassemblies' },
  { id: 'pack', name: 'Packaging Materials', description: 'Boxes, labels, bubble wrap and packing tape' }
];

export const SEED_CUSTOMER_GROUPS: CustomerGroup[] = [
  { id: 'retail', name: 'Retail Customer', discountPercent: 0 },
  { id: 'distributor', name: 'Wholesale Distributor', discountPercent: 10 },
  { id: 'vip', name: 'VIP Alliance Partner', discountPercent: 15 }
];

export const SEED_CUSTOMERS: Customer[] = [
  { id: 'CUST-001', name: 'PT Sinar Abadi Perkasa', customerGroupId: 'distributor', email: 'sinar@abadi.co.id', phone: '+628123456781' },
  { id: 'CUST-002', name: 'CoreTech Global Inc.', customerGroupId: 'vip', email: 'procurement@coretech.com', phone: '+15550293112' },
  { id: 'CUST-003', name: 'Sanjaya Retail Group', customerGroupId: 'retail', email: 'sales@sanjaya.co.id', phone: '+628812239423' }
];

export const SEED_VENDORS: Vendor[] = [
  { id: 'VEND-001', name: 'Intel Asia OEM Supplies', vendorGroupId: 'electro', email: 'partner@intel.sg', phone: '+6568881222' },
  { id: 'VEND-002', name: 'NVIDIA Hardware Logistics', vendorGroupId: 'electro', email: 'b2b@nvidia.com', phone: '+14082229900' },
  { id: 'VEND-003', name: 'IndoBox Packaging Ltd.', vendorGroupId: 'pack', email: 'info@indoboxpack.com', phone: '+62215556677' }
];

export const SEED_WAREHOUSES: Warehouse[] = [
  { code: 'WH-MUT-01', name: 'Mutu Main Headquarters (Jakarta)', location: 'Kawasan Industri Pulogadung, Jakarta Timur' },
  { code: 'WH-SBY-02', name: 'Surabaya Inbound Logistics (Sidoarjo)', location: 'Lingkar Timur Sidoarjo, Jawa Timur' }
];

export const SEED_ITEMS: Item[] = [
  {
    sku: 'CPU-INT-I9',
    name: 'Intel Processor Core i9-14900K',
    groupId: 'electro',
    unitCost: 450.00,
    sellingPrice: 9424000,
    minStock: 20,
    description: 'High-performance processor with 24 cores (8 P-cores and 16 E-cores).',
    subComponents: [
      { sku: 'CAP-SMD-10U', qty: 6 },
      { sku: 'DIODE-SMD-1N', qty: 4 }
    ]
  },
  {
    sku: 'GPU-NVI-RTX4090',
    name: 'NVIDIA GeForce RTX 4090 Founder Edition',
    groupId: 'electro',
    unitCost: 1200.00,
    sellingPrice: 25584000,
    minStock: 10,
    description: 'The ultimate GeForce GPU. It brings an enormous leap in performance.',
    subComponents: [
      { sku: 'VT-FAN-120M', qty: 3 },
      { sku: 'CAP-SMD-10U', qty: 12 },
      { sku: 'DIODE-SMD-1N', qty: 8 }
    ]
  },
  {
    sku: 'CAP-SMD-10U',
    name: 'SMD MLCC Capacitor 10uF 50V',
    groupId: 'parts',
    unitCost: 0.12,
    sellingPrice: 4000,
    minStock: 100,
    description: 'Surface mount multi-layer ceramic capacitor.',
    subComponents: []
  },
  {
    sku: 'DIODE-SMD-1N',
    name: 'SMD Diode 1N4148 Fast Switching',
    groupId: 'parts',
    unitCost: 0.08,
    sellingPrice: 2880,
    minStock: 150,
    description: '1N4148 high-speed switching diode in SOD-123 package.',
    subComponents: []
  },
  {
    sku: 'VT-FAN-120M',
    name: 'Vortex DC Fan 120mm High Static Pressure',
    groupId: 'parts',
    unitCost: 8.50,
    sellingPrice: 238400,
    minStock: 30,
    description: '120mm PWM controllable premium cooling fan.',
    subComponents: []
  },
  {
    sku: 'BOX-CRD-MED',
    name: 'Cardboard Box Medium Double-Wall x25',
    groupId: 'pack',
    unitCost: 12.00,
    sellingPrice: 360000,
    minStock: 50,
    description: 'Highly durable medium sized brown box pack.',
    subComponents: []
  },
  {
    sku: '879324',
    name: 'Vacuum Cleaner RX 5 CleanPro',
    groupId: 'parts',
    unitCost: 85.00,
    sellingPrice: 1920000,
    minStock: 15,
    description: 'High suction robotic physical vacuum cleaner RX 5 smart model with multi-zone tracking.',
    subComponents: []
  }
];

export const SEED_STOCKS = [
  { sku: 'CPU-INT-I9', warehouseCode: 'WH-MUT-01', physicalQty: 48, bookedQty: 8, bin: 'BIN-10A', rack: 'RACK-03' },
  { sku: 'GPU-NVI-RTX4090', warehouseCode: 'WH-MUT-01', physicalQty: 18, bookedQty: 4, bin: 'BIN-10B', rack: 'RACK-03' },
  { sku: 'CAP-SMD-10U', warehouseCode: 'WH-MUT-01', physicalQty: 1850, bookedQty: 0, bin: 'BIN-01C', rack: 'RACK-08' },
  { sku: 'DIODE-SMD-1N', warehouseCode: 'WH-MUT-01', physicalQty: 2400, bookedQty: 0, bin: 'BIN-01D', rack: 'RACK-08' },
  { sku: 'VT-FAN-120M', warehouseCode: 'WH-MUT-01', physicalQty: 85, bookedQty: 15, bin: 'BIN-05F', rack: 'RACK-02' },
  { sku: '879324', warehouseCode: 'WH-MUT-01', physicalQty: 25, bookedQty: 5, bin: 'BIN-ROB-05', rack: 'RACK-02' },
  
  { sku: 'CPU-INT-I9', warehouseCode: 'WH-SBY-02', physicalQty: 12, bookedQty: 0, bin: 'BIN-A01', rack: 'RACK-A1' },
  { sku: 'GPU-NVI-RTX4090', warehouseCode: 'WH-SBY-02', physicalQty: 4, bookedQty: 0, bin: 'BIN-A02', rack: 'RACK-A1' },
  { sku: 'CAP-SMD-10U', warehouseCode: 'WH-SBY-02', physicalQty: 600, bookedQty: 0, bin: 'BIN-X29', rack: 'RACK-C4' },
  { sku: 'BOX-CRD-MED', warehouseCode: 'WH-SBY-02', physicalQty: 75, bookedQty: 10, bin: 'BIN-P01', rack: 'RACK-F5' }
];
