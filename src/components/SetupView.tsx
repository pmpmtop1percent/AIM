import React, { useState, useEffect } from 'react';
import { useWms } from '../context/WmsContext';
import {
  Settings as SettingsIcon,
  Plus,
  Trash2,
  ListRestart,
  Sparkles,
  Layers,
  Users,
  Compass,
  FileCheck,
  Building,
  CheckCircle,
  Database,
  Building2,
  Tags,
  AlertTriangle,
  Coins,
  Shield,
  FolderOpen,
  MapPin,
  Mail,
  Phone,
  UserCheck,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Upload,
  KeyRound,
  Lock
} from 'lucide-react';
import { Item, Warehouse, Customer, Vendor, CustomerGroup, VendorGroup, ItemGroup } from '../types';
import { RolesAndSeatsSection } from './RolesAndSeatsSection';

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

export interface SetupViewProps {
  activeSubTab?: 'ITEM_MASTER' | 'ITEM_GROUP' | 'CUSTOMER_MASTER' | 'CUSTOMER_GROUP' | 'VENDOR_MASTER' | 'VENDOR_GROUP' | 'WAREHOUSE_MASTER' | 'ROLES_SEATS' | 'SETTINGS';
  setActiveSubTab?: (tab: any) => void;
  lang?: 'EN' | 'IN';
}

export const SetupView: React.FC<SetupViewProps> = ({ activeSubTab, setActiveSubTab, lang = 'EN' }) => {
  const {
    warehouses,
    items,
    itemGroups,
    customerGroups,
    customers,
    vendors,
    vendorGroups,
    loadDefaultSeedData,
    createOrUpdateWarehouse,
    deleteWarehouse,
    createOrUpdateItem,
    deleteItem,
    clearAllItems,
    clearAllDatabaseData,
    createOrUpdateItemGroup,
    deleteItemGroup,
    createOrUpdateCustomerGroup,
    deleteCustomerGroup,
    createOrUpdateCustomer,
    deleteCustomer,
    createOrUpdateVendorGroup,
    deleteVendorGroup,
    createOrUpdateVendor,
    deleteVendor,
    selectedCurrency,
    userProfile,
    customRoles,
    emailRoles,
    createOrUpdateCustomRole,
    deleteCustomRole,
    createOrUpdateEmailRole,
    deleteEmailRole
  } = useWms();

  type SetupTab = 
    | 'ITEM_MASTER'
    | 'ITEM_GROUP'
    | 'CUSTOMER_MASTER'
    | 'CUSTOMER_GROUP'
    | 'VENDOR_MASTER'
    | 'VENDOR_GROUP'
    | 'WAREHOUSE_MASTER'
    | 'ROLES_SEATS'
    | 'SETTINGS';

  const [localActiveTab, setLocalActiveTab] = useState<SetupTab>('ITEM_MASTER');
  const activeTab = activeSubTab || localActiveTab;
  const setActiveTab = setActiveSubTab || setLocalActiveTab;
  const [dbMessage, setDbMessage] = useState('');

  // CSV Import state variables
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvItems, setCsvItems] = useState<Item[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Editing state variables for other forms
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingCustId, setEditingCustId] = useState<string | null>(null);
  const [editingCustGroupId, setEditingCustGroupId] = useState<string | null>(null);
  const [editingVendId, setEditingVendId] = useState<string | null>(null);
  const [editingVendGroupId, setEditingVendGroupId] = useState<string | null>(null);
  const [editingWarehouseCode, setEditingWarehouseCode] = useState<string | null>(null);

  // 1. Item Form states
  const [sku, setSku] = useState('');
  const [itemName, setItemName] = useState('');
  const [groupId, setGroupId] = useState('electro');
  const [unitCost, setUnitCost] = useState<number | "">(1.0);
  const [sellingPrice, setSellingPrice] = useState<number | "">(50000);
  const [minStock, setMinStock] = useState<number>(10);
  const [itemDesc, setItemDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [vendorCode, setVendorCode] = useState('');
  const [itemVendorCode, setItemVendorCode] = useState('');
  const [buyPrice, setBuyPrice] = useState<number | "">('');
  const [buyCurrency, setBuyCurrency] = useState('USD');
  const [confirmDeleteAllItems, setConfirmDeleteAllItems] = useState(false);
  const [deleteAllPassword, setDeleteAllPassword] = useState('');
  const [confirmClearDb, setConfirmClearDb] = useState(false);
  const [clearDbPassword, setClearDbPassword] = useState('');
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [deleteConfirmSku, setDeleteConfirmSku] = useState<string | null>(null);
  const [confirmDeleteSku, setConfirmDeleteSku] = useState<string | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [confirmDeleteCustId, setConfirmDeleteCustId] = useState<string | null>(null);
  const [confirmDeleteCustGroupId, setConfirmDeleteCustGroupId] = useState<string | null>(null);
  const [confirmDeleteVendId, setConfirmDeleteVendId] = useState<string | null>(null);
  const [confirmDeleteVendGroupId, setConfirmDeleteVendGroupId] = useState<string | null>(null);
  const [confirmDeleteWarehouseCode, setConfirmDeleteWarehouseCode] = useState<string | null>(null);
  const [isItemFormCollapsed, setIsItemFormCollapsed] = useState(true);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemGroupFilter, setItemGroupFilter] = useState('ALL');

  // Collapse states for other configuration forms
  const [isItemGroupFormCollapsed, setIsItemGroupFormCollapsed] = useState(true);
  const [isCustomerFormCollapsed, setIsCustomerFormCollapsed] = useState(true);
  const [isCustomerGroupFormCollapsed, setIsCustomerGroupFormCollapsed] = useState(true);
  const [isVendorFormCollapsed, setIsVendorFormCollapsed] = useState(true);
  const [isVendorGroupFormCollapsed, setIsVendorGroupFormCollapsed] = useState(true);
  const [isWarehouseFormCollapsed, setIsWarehouseFormCollapsed] = useState(true);

  // 2. Item Group Form states
  const [igId, setIgId] = useState('');
  const [igName, setIgName] = useState('');
  const [igDesc, setIgDesc] = useState('');

  // 3. Customer Master Form states
  const [custId, setCustId] = useState('');
  const [custName, setCustName] = useState('');
  const [custGroupId, setCustGroupId] = useState('retail');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // 4. Customer Group Form states
  const [cgId, setCgId] = useState('');
  const [cgName, setCgName] = useState('');
  const [cgDiscountPercent, setCgDiscountPercent] = useState<number>(0);

  // 5. Vendor Master Form states
  const [vendId, setVendId] = useState('');
  const [vendName, setVendName] = useState('');
  const [vendGroupId, setVendGroupId] = useState('');
  const [vendEmail, setVendEmail] = useState('');
  const [vendPhone, setVendPhone] = useState('');

  // 6. Vendor Group Form states
  const [vgId, setVgId] = useState('');
  const [vgName, setVgName] = useState('');

  // 7. Warehouse Form states
  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');
  const [whIsCannibal, setWhIsCannibal] = useState(false);

  // Pre-populate select box fallbacks when groups are fetched
  useEffect(() => {
    if (itemGroups && itemGroups.length > 0 && !groupId) {
      setGroupId(itemGroups[0].id);
    }
  }, [itemGroups]);

  useEffect(() => {
    if (customerGroups && customerGroups.length > 0 && (!custGroupId || custGroupId === 'retail')) {
      const activeCg = customerGroups.find(c => c.id === 'retail') || customerGroups[0];
      setCustGroupId(activeCg.id);
    }
  }, [customerGroups]);

  useEffect(() => {
    if (vendorGroups && vendorGroups.length > 0 && !vendGroupId) {
      setVendGroupId(vendorGroups[0].id);
    }
  }, [vendorGroups]);

  const filteredItems = items.filter(item => {
    const query = itemSearchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      item.sku.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query));
    
    const matchesGroup = itemGroupFilter === 'ALL' || item.groupId === itemGroupFilter;
    return matchesSearch && matchesGroup;
  });

  const convertAndFormatPrice = (usdAmount: number) => {
    const amt = usdAmount * selectedCurrency.exchangeRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: selectedCurrency.code === 'IDR' ? 0 : 2
    }).format(amt);
  };

  const convertAndFormatSellingPrice = (idrAmount: number) => {
    // Standard list price is always in IDR, convert to selected display currency
    const amt = (idrAmount / 16000) * selectedCurrency.exchangeRate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: selectedCurrency.code === 'IDR' ? 0 : 2
    }).format(amt);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Low resolution downscaling: max dimension 80-120px is perfect for low-res but visible
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // High compression ratio for extremely tiny size but still visible
          const lowResDataUrl = canvas.toDataURL('image/jpeg', 0.2);
          setImageUrl(lowResDataUrl);
          setDbMessage("Successfully compressed and scaled down uploaded image to low-res verification size.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSeedAction = async () => {
    setDbMessage('Seeding database... Please wait.');
    const msg = await loadDefaultSeedData();
    setDbMessage(msg);
  };

  const handleClearAllItems = async () => {
    if (deleteAllPassword !== '09098080') {
      setDbMessage('Error: Security password verification failed for database erase.');
      return;
    }
    setDbMessage('Erasing all master items... Please wait.');
    try {
      const msg = await clearAllItems();
      setDbMessage(msg);
      setConfirmDeleteAllItems(false);
      setDeleteAllPassword('');
    } catch (err: any) {
      setDbMessage(`Database erase failed: ${err?.message || err || 'Unknown error'}`);
      console.error("Clear all items error:", err);
    }
  };

  const handleClearAllDatabaseData = async () => {
    if (clearDbPassword !== '09098080') {
      setDbMessage('Error: Security password verification failed for database erase.');
      return;
    }
    setDbMessage('Erasing entire WMS database... Please wait.');
    try {
      const msg = await clearAllDatabaseData();
      setDbMessage(msg);
      setConfirmClearDb(false);
      setClearDbPassword('');
    } catch (err: any) {
      setDbMessage(`Database erase failed: ${err?.message || err || 'Unknown error'}`);
      console.error("Clear all database error:", err);
    }
  };

  // CSV Parsing & Validation Helpers
  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let col = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          col += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(col.trim());
        col = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        row.push(col.trim());
        result.push(row);
        row = [];
        col = '';
      } else {
        col += char;
      }
    }
    if (row.length > 0 || col.length > 0) {
      row.push(col.trim());
      result.push(row);
    }
    return result.filter(r => r.some(cell => cell !== ''));
  };

  const downloadCsvTemplate = () => {
    const headers = 'sku,name,groupId,unitCost,sellingPrice,minStock,description,imageUrl,vendorCode,itemVendorCode,buyPrice,buyCurrency\n';
    const exampleRow = 'CPU-INTEL-I7,Intel Core i7 Processor,electro,250.00,350.00,10,High-performance CPU,https://example.com/cpu.jpg,VEND-001,INT-I7-OEM,220.00,USD\n';
    const blob = new Blob([headers + exampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'item_master_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDbMessage('');
    setImportSuccessCount(null);
    const file = e.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      setCsvItems([]);
      setCsvErrors([]);
      return;
    }
    
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setCsvErrors(["CSV file is empty or unreadable."]);
        return;
      }
      
      const parsedRows = parseCSV(text);
      if (parsedRows.length <= 1) {
        setCsvErrors(["CSV file must contain a header row and at least one data row."]);
        return;
      }
      
      const headers = parsedRows[0].map(h => h.trim().toLowerCase());
      const skuIdx = headers.indexOf('sku');
      const nameIdx = headers.indexOf('name');
      const groupIdIdx = headers.indexOf('groupid') !== -1 ? headers.indexOf('groupid') : headers.indexOf('group');
      const unitCostIdx = headers.indexOf('unitcost') !== -1 ? headers.indexOf('unitcost') : headers.indexOf('cost');
      const sellingPriceIdx = headers.indexOf('sellingprice') !== -1 ? headers.indexOf('sellingprice') : headers.indexOf('price');
      const minStockIdx = headers.indexOf('minstock') !== -1 ? headers.indexOf('minstock') : -1;
      const descIdx = headers.indexOf('description') !== -1 ? headers.indexOf('description') : headers.indexOf('desc');
      const imageIdx = headers.indexOf('imageurl') !== -1 ? headers.indexOf('imageurl') : headers.indexOf('image');
      const vendorCodeIdx = headers.indexOf('vendorcode') !== -1 ? headers.indexOf('vendorcode') : headers.indexOf('vendor');
      const itemVendorCodeIdx = headers.indexOf('itemvendorcode') !== -1 ? headers.indexOf('itemvendorcode') : headers.indexOf('vendoritemcode');
      const buyPriceIdx = headers.indexOf('buyprice') !== -1 ? headers.indexOf('buyprice') : headers.indexOf('buycost');
      const buyCurrencyIdx = headers.indexOf('buycurrency') !== -1 ? headers.indexOf('buycurrency') : headers.indexOf('currency');
      
      // Validate headers
      const missingHeaders: string[] = [];
      if (skuIdx === -1) missingHeaders.push('sku');
      if (nameIdx === -1) missingHeaders.push('name');
      if (groupIdIdx === -1) missingHeaders.push('groupId');
      if (unitCostIdx === -1) missingHeaders.push('unitCost');
      if (sellingPriceIdx === -1) missingHeaders.push('sellingPrice');
      
      if (missingHeaders.length > 0) {
        setCsvErrors([`Missing required headers: ${missingHeaders.join(', ')}. Please use the template.`]);
        setCsvItems([]);
        return;
      }
      
      const itemsToImport: Item[] = [];
      const errors: string[] = [];
      
      for (let i = 1; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const rowNum = i + 1;
        
        // Skip empty rows
        if (row.length === 0 || row.every(cell => cell === '')) {
          continue;
        }
        
        // Handle row padding or truncation safely
        const rawSku = skuIdx < row.length ? row[skuIdx] : '';
        const rawName = nameIdx < row.length ? row[nameIdx] : '';
        const rawGroupId = groupIdIdx < row.length ? row[groupIdIdx] : '';
        const rawUnitCost = unitCostIdx < row.length ? row[unitCostIdx] : '';
        const rawSellingPrice = sellingPriceIdx < row.length ? row[sellingPriceIdx] : '';
        const rawMinStock = (minStockIdx !== -1 && minStockIdx < row.length) ? row[minStockIdx] : '0';
        const rawDesc = (descIdx !== -1 && descIdx < row.length) ? row[descIdx] : '';
        const rawImage = (imageIdx !== -1 && imageIdx < row.length) ? row[imageIdx] : '';
        const rawVendorCode = (vendorCodeIdx !== -1 && vendorCodeIdx < row.length) ? row[vendorCodeIdx] : '';
        const rawItemVendorCode = (itemVendorCodeIdx !== -1 && itemVendorCodeIdx < row.length) ? row[itemVendorCodeIdx] : '';
        const rawBuyPrice = (buyPriceIdx !== -1 && buyPriceIdx < row.length) ? row[buyPriceIdx] : '';
        const rawBuyCurrency = (buyCurrencyIdx !== -1 && buyCurrencyIdx < row.length) ? row[buyCurrencyIdx] : '';
        
        const cleanSku = rawSku?.trim().toUpperCase() || '';
        const cleanName = rawName?.trim() || '';
        const cleanGroupId = rawGroupId?.trim().toLowerCase().replace(/\s+/g, '-') || '';
        const parsedUnitCost = Number((rawUnitCost || '').toString().replace(/,/g, ''));
        const parsedSellingPrice = Number((rawSellingPrice || '').toString().replace(/,/g, ''));
        const parsedMinStock = rawMinStock ? Number(rawMinStock.toString().replace(/,/g, '')) : 0;
        const cleanVendorCode = rawVendorCode?.trim() || '';
        const cleanItemVendorCode = rawItemVendorCode?.trim() || '';
        const parsedBuyPrice = rawBuyPrice ? Number(rawBuyPrice.toString().replace(/,/g, '')) : undefined;
        const cleanBuyCurrency = rawBuyCurrency?.trim() || 'USD';
        
        const rowErrors: string[] = [];
        
        if (!cleanSku) {
          rowErrors.push("SKU is required");
        } else if (cleanSku.length < 3) {
          rowErrors.push("SKU must be at least 3 characters");
        }
        
        if (!cleanName) {
          rowErrors.push("Name is required");
        }
        
        if (!cleanGroupId) {
          rowErrors.push("Group ID is required");
        }
        
        if (isNaN(parsedUnitCost) || parsedUnitCost <= 0) {
          rowErrors.push("Unit Cost must be a number > 0");
        }
        
        if (isNaN(parsedSellingPrice) || parsedSellingPrice <= 0) {
          rowErrors.push("Selling Price must be a number > 0");
        }
        
        if (isNaN(parsedMinStock) || parsedMinStock < 0) {
          rowErrors.push("Min Stock must be an integer >= 0");
        }
        
        if (rawBuyPrice && (isNaN(Number(rawBuyPrice)) || Number(rawBuyPrice) < 0)) {
          rowErrors.push("Buy Price must be a number >= 0");
        }
        
        if (rowErrors.length > 0) {
          errors.push(`Row ${rowNum} (${cleanSku || 'No SKU'}): ${rowErrors.join(', ')}`);
        } else {
          itemsToImport.push({
            sku: cleanSku,
            name: cleanName,
            groupId: cleanGroupId,
            unitCost: parsedUnitCost,
            sellingPrice: parsedSellingPrice,
            minStock: parsedMinStock,
            description: rawDesc?.trim() || '',
            imageUrl: rawImage?.trim() || '',
            vendorCode: cleanVendorCode || undefined,
            itemVendorCode: cleanItemVendorCode || undefined,
            buyPrice: parsedBuyPrice !== undefined && !isNaN(parsedBuyPrice) ? parsedBuyPrice : undefined,
            buyCurrency: cleanVendorCode ? cleanBuyCurrency : undefined
          });
        }
      }
      
      setCsvItems(itemsToImport);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (confirmPassword !== '09098080') {
      setDbMessage('Error: Security password verification failed.');
      return;
    }
    if (csvItems.length === 0) {
      setDbMessage('Error: No valid items to import.');
      return;
    }
    
    setIsImporting(true);
    setDbMessage('');
    setImportSuccessCount(null);
    let successCount = 0;

    // Collect unique item groups and vendors from csvItems
    const uniqueGroups = new Set<string>();
    const uniqueVendors = new Set<string>();
    csvItems.forEach(item => {
      if (item.groupId) uniqueGroups.add(item.groupId);
      if (item.vendorCode) uniqueVendors.add(item.vendorCode);
    });

    // Auto-create unique Item Groups in Firestore
    setDbMessage('Auto-creating imported item groups...');
    for (const grp of uniqueGroups) {
      try {
        await createOrUpdateItemGroup({
          id: grp,
          name: grp.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          description: 'Auto-created from CSV import'
        });
      } catch (err) {
        console.error(`Failed to create item group: ${grp}`, err);
      }
    }

    // Auto-create unique Vendors in Firestore
    setDbMessage('Auto-creating imported vendors...');
    for (const vnd of uniqueVendors) {
      try {
        await createOrUpdateVendor({
          id: vnd,
          name: vnd,
          vendorGroupId: 'imported',
          email: '',
          phone: ''
        });
      } catch (err) {
        console.error(`Failed to create vendor: ${vnd}`, err);
      }
    }

    setDbMessage('Importing items to Firestore...');
    for (let i = 0; i < csvItems.length; i++) {
      setImportProgress({ current: i + 1, total: csvItems.length });
      try {
        await createOrUpdateItem(csvItems[i]);
        successCount++;
      } catch (err) {
        console.error(`Import failed for SKU: ${csvItems[i].sku}`, err);
      }
    }
    
    setImportSuccessCount(successCount);
    setDbMessage(`Import complete. Successfully imported ${successCount} of ${csvItems.length} items to Firestore.`);
    
    // Clear CSV states after successful import
    setCsvFile(null);
    setCsvItems([]);
    setCsvErrors([]);
    setConfirmPassword('');
    setIsImporting(false);
  };

  // 1. Submit Item SKU
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbMessage('');
    const uppercaseSku = sku.toUpperCase().trim();
    if (uppercaseSku.length < 3) {
      setDbMessage('Item SKU validation error: must represent min length 3 alphanumeric.');
      return;
    }
    const numericUnitCost = Number(unitCost) || 0;
    const numericSellingPrice = Number(sellingPrice) || 0;
    if (numericUnitCost <= 0 || numericSellingPrice <= 0) {
      setDbMessage('Validation fail: Costs & selling prices must strictly represent numbers > 0.');
      return;
    }

    try {
      await createOrUpdateItem({
        sku: uppercaseSku,
        name: itemName,
        groupId,
        unitCost: numericUnitCost,
        sellingPrice: numericSellingPrice,
        minStock,
        description: itemDesc,
        imageUrl: imageUrl.trim() || undefined,
        subComponents: [],
        vendorCode: vendorCode || undefined,
        itemVendorCode: itemVendorCode || undefined,
        buyPrice: buyPrice !== "" ? Number(buyPrice) : undefined,
        buyCurrency: vendorCode ? buyCurrency : undefined
      });
      setDbMessage(`SKU ${uppercaseSku} ("${itemName}") saved successfully.`);
      setSku('');
      setItemName('');
      setItemDesc('');
      setUnitCost(1.0);
      setSellingPrice(50000);
      setMinStock(10);
      setImageUrl('');
      setVendorCode('');
      setItemVendorCode('');
      setBuyPrice('');
      setBuyCurrency('USD');
      setEditingSku(null);
    } catch {
      setDbMessage('Action blocked by permission logic.');
    }
  };

  const handleEditClick = (item: Item) => {
    setSku(item.sku);
    setItemName(item.name);
    setGroupId(item.groupId);
    setUnitCost(item.unitCost);
    setSellingPrice(item.sellingPrice);
    setMinStock(item.minStock);
    setItemDesc(item.description || '');
    setImageUrl(item.imageUrl || '');
    setVendorCode(item.vendorCode || '');
    setItemVendorCode(item.itemVendorCode || '');
    setBuyPrice(item.buyPrice !== undefined ? item.buyPrice : '');
    setBuyCurrency(item.buyCurrency || 'USD');
    setEditingSku(item.sku);
    setIsItemFormCollapsed(false);
    setDbMessage(`Now editing SKU: ${item.sku}`);
  };

  const handleCancelEdit = () => {
    setSku('');
    setItemName('');
    setGroupId(itemGroups[0]?.id || 'electro');
    setUnitCost(1.0);
    setSellingPrice(2.0);
    setMinStock(10);
    setItemDesc('');
    setImageUrl('');
    setVendorCode('');
    setItemVendorCode('');
    setBuyPrice('');
    setBuyCurrency('USD');
    setEditingSku(null);
    setDbMessage('');
  };

  const handleDeleteItem = async (targetSku: string) => {
    try {
      await deleteItem(targetSku);
      setDbMessage(`SKU catalog item [${targetSku}] deleted successfully.`);
      setDeleteConfirmSku(null);
    } catch {
      setDbMessage(`Database delete failed for [${targetSku}].`);
    }
  };

  // 2. Submit Item Group
  const handleItemGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbMessage('');
    const rawId = igId.toLowerCase().trim().replace(/\s+/g, '-');
    if (!rawId) {
      setDbMessage('Please provide a valid ID identifier.');
      return;
    }
    try {
      await createOrUpdateItemGroup({
        id: rawId,
        name: igName,
        description: igDesc
      });
      setDbMessage(`Item Group "${igName}" ${editingGroupId ? 'updated' : 'added'} successfully.`);
      setIgId('');
      setIgName('');
      setIgDesc('');
      setEditingGroupId(null);
    } catch {
      setDbMessage('Access Denied or database write failure.');
    }
  };

  // 3. Submit Customer Master
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbMessage('');
    const cleanId = custId.toUpperCase().trim().replace(/\s+/g, '-');
    if (!cleanId) {
      setDbMessage('Customer ID is required.');
      return;
    }
    try {
      await createOrUpdateCustomer({
        id: cleanId,
        name: custName,
        customerGroupId: custGroupId || 'retail',
        email: custEmail,
        phone: custPhone
      });
      setDbMessage(`Customer "${custName}" ${editingCustId ? 'updated' : 'registered'} successfully.`);
      setCustId('');
      setCustName('');
      setCustEmail('');
      setCustPhone('');
      setEditingCustId(null);
    } catch {
      setDbMessage('Permission rules rejected customer creation/update.');
    }
  };

  // 4. Submit Customer Group Setup
  const handleCustomerGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbMessage('');
    const rawId = cgId.toLowerCase().trim().replace(/\s+/g, '-');
    if (!rawId) {
      setDbMessage('Please provide custom Group ID code.');
      return;
    }
    try {
      await createOrUpdateCustomerGroup({
        id: rawId,
        name: cgName,
        discountPercent: Number(cgDiscountPercent)
      });
      setDbMessage(`Customer Group "${cgName}" ${editingCustGroupId ? 'updated' : 'registered'}.`);
      setCgId('');
      setCgName('');
      setCgDiscountPercent(0);
      setEditingCustGroupId(null);
    } catch {
      setDbMessage('Action blocked by system rule levels.');
    }
  };

  // 5. Submit Vendor Master
  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbMessage('');
    const cleanId = vendId.toUpperCase().trim().replace(/\s+/g, '-');
    if (!cleanId) {
      setDbMessage('Vendor ID represents a required unique code.');
      return;
    }
    try {
      await createOrUpdateVendor({
        id: cleanId,
        name: vendName,
        vendorGroupId: vendGroupId || (vendorGroups[0]?.id || 'electro'),
        email: vendEmail,
        phone: vendPhone
      });
      setDbMessage(`Vendor "${vendName}" successfully ${editingVendId ? 'updated' : 'saved'} in database.`);
      setVendId('');
      setVendName('');
      setVendEmail('');
      setVendPhone('');
      setEditingVendId(null);
    } catch {
      setDbMessage('Database Write Rejected.');
    }
  };

  // 6. Submit Vendor Group
  const handleVendorGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbMessage('');
    const rawId = vgId.toLowerCase().trim().replace(/\s+/g, '-');
    if (!rawId) {
      setDbMessage('Please enter Vendor Group Code.');
      return;
    }
    try {
      await createOrUpdateVendorGroup({
        id: rawId,
        name: vgName
      });
      setDbMessage(`Vendor Group "${vgName}" ${editingVendGroupId ? 'updated' : 'registered'} successfully.`);
      setVgId('');
      setVgName('');
      setEditingVendGroupId(null);
    } catch {
      setDbMessage('Rejected by database policy.');
    }
  };

  // 7. Submit Warehouse Hub
  const handleWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbMessage('');
    const uppercaseWhCode = whCode.toUpperCase().trim().replace(/\s+/g, '-');
    if (!uppercaseWhCode) {
      setDbMessage('Please input a valid Warehouse Code identifier.');
      return;
    }
    try {
      await createOrUpdateWarehouse({
        code: uppercaseWhCode,
        name: whName,
        location: whLocation,
        isCannibal: whIsCannibal
      });
      setDbMessage(`Warehouse ${uppercaseWhCode} ${editingWarehouseCode ? 'updated' : 'registered'} successfully.`);
      setWhCode('');
      setWhName('');
      setWhLocation('');
      setWhIsCannibal(false);
      setEditingWarehouseCode(null);
    } catch {
      setDbMessage('Access Denied or configuration rules failure.');
    }
  };

  // Helper click handlers for Editing & Canceling
  const handleEditItemGroup = (grp: ItemGroup) => {
    setIgId(grp.id);
    setIgName(grp.name);
    setIgDesc(grp.description || '');
    setEditingGroupId(grp.id);
    setIsItemGroupFormCollapsed(false);
    setDbMessage(`Now editing Item Group: ${grp.id}`);
  };

  const handleCancelItemGroupEdit = () => {
    setIgId('');
    setIgName('');
    setIgDesc('');
    setEditingGroupId(null);
  };

  const handleEditCustomer = (cust: Customer) => {
    setCustId(cust.id);
    setCustName(cust.name);
    setCustGroupId(cust.customerGroupId);
    setCustEmail(cust.email);
    setCustPhone(cust.phone);
    setEditingCustId(cust.id);
    setIsCustomerFormCollapsed(false);
    setDbMessage(`Now editing Customer: ${cust.id}`);
  };

  const handleCancelCustomerEdit = () => {
    setCustId('');
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setEditingCustId(null);
  };

  const handleEditCustomerGroup = (grp: CustomerGroup) => {
    setCgId(grp.id);
    setCgName(grp.name);
    setCgDiscountPercent(grp.discountPercent);
    setEditingCustGroupId(grp.id);
    setIsCustomerGroupFormCollapsed(false);
    setDbMessage(`Now editing Customer Group: ${grp.id}`);
  };

  const handleCancelCustomerGroupEdit = () => {
    setCgId('');
    setCgName('');
    setCgDiscountPercent(0);
    setEditingCustGroupId(null);
  };

  const handleEditVendor = (vend: Vendor) => {
    setVendId(vend.id);
    setVendName(vend.name);
    setVendGroupId(vend.vendorGroupId);
    setVendEmail(vend.email);
    setVendPhone(vend.phone);
    setEditingVendId(vend.id);
    setIsVendorFormCollapsed(false);
    setDbMessage(`Now editing Vendor: ${vend.id}`);
  };

  const handleCancelVendorEdit = () => {
    setVendId('');
    setVendName('');
    setVendEmail('');
    setVendPhone('');
    setEditingVendId(null);
  };

  const handleEditVendorGroup = (grp: VendorGroup) => {
    setVgId(grp.id);
    setVgName(grp.name);
    setEditingVendGroupId(grp.id);
    setIsVendorGroupFormCollapsed(false);
    setDbMessage(`Now editing Vendor Group: ${grp.id}`);
  };

  const handleCancelVendorGroupEdit = () => {
    setVgId('');
    setVgName('');
    setEditingVendGroupId(null);
  };

  const handleEditWarehouse = (wh: Warehouse) => {
    setWhCode(wh.code);
    setWhName(wh.name);
    setWhLocation(wh.location);
    setWhIsCannibal(!!wh.isCannibal);
    setEditingWarehouseCode(wh.code);
    setIsWarehouseFormCollapsed(false);
    setDbMessage(`Now editing Warehouse: ${wh.code}`);
  };

  const handleCancelWarehouseEdit = () => {
    setWhCode('');
    setWhName('');
    setWhLocation('');
    setWhIsCannibal(false);
    setEditingWarehouseCode(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in font-sans pb-10">
      
      {/* Selector Side Menu is integrated directly inside the main application sidebar */}
      <div className="hidden">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 p-2.5">
          Enterprise Masters
        </h3>
        
        <button
          type="button"
          onClick={() => { setActiveTab('ITEM_MASTER'); setDbMessage(''); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all ${
            activeTab === 'ITEM_MASTER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/30'
          }`}
        >
          <Tags className="w-4 h-4 shrink-0" />
          <span>Item Master</span>
          <span className="ml-auto text-[9px] font-mono bg-slate-950/60 px-1.5 py-0.5 rounded text-slate-400">
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('ITEM_GROUP'); setDbMessage(''); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all ${
            activeTab === 'ITEM_GROUP' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/30'
          }`}
        >
          <FolderOpen className="w-4 h-4 shrink-0" />
          <span>Item Group</span>
          <span className="ml-auto text-[9px] font-mono bg-slate-950/60 px-1.5 py-0.5 rounded text-slate-400">
            {itemGroups.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('CUSTOMER_MASTER'); setDbMessage(''); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all ${
            activeTab === 'CUSTOMER_MASTER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/30'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Customer Master</span>
          <span className="ml-auto text-[9px] font-mono bg-slate-950/60 px-1.5 py-0.5 rounded text-slate-400">
            {customers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('CUSTOMER_GROUP'); setDbMessage(''); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all ${
            activeTab === 'CUSTOMER_GROUP' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/30'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Customer Group</span>
          <span className="ml-auto text-[9px] font-mono bg-slate-950/60 px-1.5 py-0.5 rounded text-slate-400">
            {customerGroups.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('VENDOR_MASTER'); setDbMessage(''); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all ${
            activeTab === 'VENDOR_MASTER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/30'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Vendor Master</span>
          <span className="ml-auto text-[9px] font-mono bg-slate-950/60 px-1.5 py-0.5 rounded text-slate-400">
            {vendors.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('VENDOR_GROUP'); setDbMessage(''); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all ${
            activeTab === 'VENDOR_GROUP' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/30'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span>Vendor Group</span>
          <span className="ml-auto text-[9px] font-mono bg-slate-950/60 px-1.5 py-0.5 rounded text-slate-400">
            {vendorGroups ? vendorGroups.length : 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('WAREHOUSE_MASTER'); setDbMessage(''); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all ${
            activeTab === 'WAREHOUSE_MASTER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/30'
          }`}
        >
          <Building className="w-4 h-4 shrink-0" />
          <span>Warehouse Master</span>
          <span className="ml-auto text-[9px] font-mono bg-slate-950/60 px-1.5 py-0.5 rounded text-slate-400">
            {warehouses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('ROLES_SEATS'); setDbMessage(''); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all ${
            activeTab === 'ROLES_SEATS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/30'
          }`}
        >
          <KeyRound className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Roles & Access Seats</span>
          <span className="ml-auto text-[9px] font-mono bg-slate-950/60 px-1.5 py-0.5 rounded text-slate-400">
            {emailRoles?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('SETTINGS'); setDbMessage(''); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl text-left transition-all ${
            activeTab === 'SETTINGS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/30'
          }`}
        >
          <Database className="w-4 h-4 shrink-0" />
          <span>Settings / Sandbox</span>
        </button>
      </div>

      {/* Main Focus Detail Setup Area - Full Width */}
      <div className="md:col-span-12 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
        
        {dbMessage && (
          <div className="mb-5 p-3.5 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs text-indigo-350 font-medium leading-relaxed flex items-center gap-2.5 animate-fade-in shrink-0">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
            <span>{dbMessage}</span>
          </div>
        )}

        {/* 1. ITEM MASTER SCREEN */}
        {activeTab === 'ITEM_MASTER' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-4">
              <div>
                <h3 className="font-bold text-slate-100 text-lg">Item Master SKU Catalog</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form card - 5 slots */}
              <div id="item-master-form-card" className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl h-fit space-y-4">
                <div 
                  onClick={() => setIsItemFormCollapsed(!isItemFormCollapsed)}
                  className="flex items-center justify-between cursor-pointer select-none pb-1 group"
                  title={isItemFormCollapsed ? "Click to expand registration form" : "Click to collapse registration form"}
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-505 group-hover:bg-indigo-500/20 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                    {editingSku ? 'Edit SKU Item Master' : 'Register New SKU'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                    <span>{isItemFormCollapsed ? 'Expand' : 'Collapse'}</span>
                    {isItemFormCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>
                </div>
                
                {!isItemFormCollapsed && (
                  <form onSubmit={handleItemSubmit} className="space-y-3.5 text-xs animate-fade-in">
                    {/* 1. Inventory category classification (groupId) */}
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Inventory category classification</label>
                      <select
                        id="item-group-select"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 cursor-pointer focus:outline-none focus:border-indigo-500 font-semibold"
                      >
                        {itemGroups && itemGroups.length > 0 ? (
                          itemGroups.map(ig => <option key={ig.id} className="bg-slate-900" value={ig.id}>{ig.name}</option>)
                        ) : (
                          <option value="electro">Electronics</option>
                        )}
                      </select>
                    </div>

                    {/* 2. SKU identifier code (sku) */}
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">SKU identifier code (min 3 chars)</label>
                      <input
                        id="item-sku-input"
                        type="text"
                        required
                        disabled={!!editingSku}
                        value={sku}
                        onChange={(e) => setSku(e.target.value.toUpperCase())}
                        placeholder="e.g. CPU-AMD-R9"
                        className={`w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 font-mono focus:outline-none transition-all ${
                          editingSku ? 'opacity-60 cursor-not-allowed bg-slate-900 border-indigo-950' : ''
                        }`}
                      />
                      {editingSku && (
                        <span className="text-[9px] font-semibold text-indigo-400 mt-1 block">
                          SKU identifier is locked during catalog editing.
                        </span>
                      )}
                    </div>

                    {/* 3. Product Description name (itemName) */}
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Product Description name</label>
                      <input
                        id="item-name-input"
                        type="text"
                        required
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="AMD Ryzen 9 Processor Hub"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    {/* 4. Min alerting Safety SOH volume (minStock) */}
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Min alerting Safety SOH volume</label>
                      <input
                        id="item-minstock-input"
                        type="number"
                        required
                        value={minStock}
                        onChange={(e) => setMinStock(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none"
                      />
                    </div>

                    {/* 5. Product Specs (itemDesc) */}
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">{lang === 'IN' ? 'Spesifikasi Produk' : 'Product Specs'}</label>
                      <input
                        id="item-desc-input"
                        type="text"
                        value={itemDesc}
                        onChange={(e) => setItemDesc(e.target.value)}
                        placeholder="e.g. Zen 5 Microarchitecture 16 cores..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    {/* 6. Vendor Code selection (vendorCode) */}
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">
                        {lang === 'IN' ? 'Vendor Utama (Beli Dari)' : 'Primary Vendor (Buy From)'}
                      </label>
                      <select
                        id="item-vendor-select"
                        value={vendorCode}
                        onChange={(e) => setVendorCode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 cursor-pointer focus:outline-none focus:border-indigo-500 font-semibold"
                      >
                        <option value="" className="bg-slate-900 text-slate-500">-- None --</option>
                        {vendors && vendors.length > 0 && vendors.map(v => (
                          <option key={v.id} className="bg-slate-900" value={v.id}>
                            {v.name} ({v.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 7. Vendor Item SKU code (itemVendorCode) */}
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">
                        {lang === 'IN' ? 'Kode SKU Vendor' : 'Vendor Item SKU Code'}
                      </label>
                      <input
                        id="item-vendor-sku-input"
                        type="text"
                        value={itemVendorCode}
                        onChange={(e) => setItemVendorCode(e.target.value)}
                        placeholder="e.g. VEND-SKU-9923"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-205 focus:outline-none font-mono"
                      />
                    </div>

                    {/* 8. Buy Price and Buy Currency */}
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">
                        {lang === 'IN' ? 'Harga & Mata Uang Beli' : 'Purchase Price & Currency'}
                      </label>
                      <div className="flex gap-2">
                        <select
                          id="item-buy-currency-select"
                          value={buyCurrency}
                          onChange={(e) => setBuyCurrency(e.target.value)}
                          className="w-24 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 cursor-pointer focus:outline-none focus:border-indigo-500 font-semibold text-center"
                        >
                          <option value="USD" className="bg-slate-900">USD ($)</option>
                          <option value="RMB" className="bg-slate-900">RMB (¥)</option>
                          <option value="IDR" className="bg-slate-900">IDR (Rp)</option>
                        </select>
                        <input
                          id="item-buy-price-input"
                          type="number"
                          step="any"
                          value={buyPrice}
                          onChange={(e) => setBuyPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="e.g. 150"
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none text-right font-semibold"
                        />
                      </div>
                    </div>

                    {/* 9. Unit Cost (HPP / COGS) */}
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">
                        {lang === 'IN' ? 'Harga Pokok (HPP / Unit Cost)' : 'Unit Cost (COGS / HPP)'}
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-bold font-mono text-slate-400">Rp</span>
                        <input
                          id="item-unitcost-input"
                          type="text"
                          required
                          value={unitCost !== "" ? formatThousandDots(Number(unitCost)) : ""}
                          onChange={(e) => {
                            const parsed = parseThousandDots(e.target.value);
                            setUnitCost(parsed);
                          }}
                          className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 font-mono focus:outline-none text-sm font-semibold"
                          placeholder="35.000"
                        />
                      </div>
                    </div>

                    {/* 10. Selling Price */}
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">
                        {lang === 'IN' ? 'Harga Jual (Selling Price)' : 'Selling Price'}
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs font-bold font-mono text-slate-400">Rp</span>
                        <input
                          id="item-cost-input"
                          type="text"
                          required
                          value={sellingPrice !== "" ? formatThousandDots(Number(sellingPrice)) : ""}
                          onChange={(e) => {
                            const parsed = parseThousandDots(e.target.value);
                            setSellingPrice(parsed);
                          }}
                          className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-200 font-mono focus:outline-none text-sm font-semibold"
                          placeholder="50.000"
                        />
                      </div>
                    </div>

                    {/* 11. Picture field (imageUrl) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450">Product Photo image URL (Optional)</label>
                        <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase tracking-widest">[ Low-Res Upload Enabled ]</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          id="item-image-input"
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none font-mono text-[10px]"
                        />
                        {imageUrl && (
                          <div className="w-10 h-10 rounded-lg border border-slate-800 overflow-hidden bg-slate-900 shrink-0">
                            <img src={imageUrl} alt="Thumbnail preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>

                      {/* Drag & drop/click local low-res file compressor */}
                      <div className="mt-2.5 relative group flex items-center justify-center border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-2.5 bg-slate-950/40 hover:bg-slate-950/60 transition-all cursor-pointer">
                        <input
                          id="item-file-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center gap-2 text-[10px] select-none">
                          <Upload className="w-4 h-4 text-indigo-400 group-hover:translate-y-[-2px] transition-all" />
                          <div className="text-left leading-tighter">
                            <span className="font-bold text-slate-200 block">Upload Local Image File</span>
                            <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wide block">Automatically scales to very low-res checking layout</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sandbox tech image presets */}
                      <div id="item-presets-container" className="mt-2 text-slate-500 space-y-1 bg-slate-900/30 p-2 border border-slate-850/60 rounded-xl">
                        <span className="text-[9px] font-mono font-bold block uppercase tracking-wider text-slate-450">Quick-Pick Photo Presets</span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { name: 'CPU Processor', url: 'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=400&auto=format&fit=crop' },
                            { name: 'Motherboard', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop' },
                            { name: '4K Screen', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop' },
                            { name: 'RAM Memory', url: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=400&auto=format&fit=crop' },
                            { name: 'Keyboards', url: 'https://images.unsplash.com/photo-1527866990264-a50d75a84b4c?w=400&auto=format&fit=crop' },
                          ].map((pOpt) => (
                            <button
                              key={pOpt.name}
                              type="button"
                              onClick={() => setImageUrl(pOpt.url)}
                              className="px-1.5 py-0.5 text-[9px] font-semibold bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-850 text-indigo-300 rounded transition-all cursor-pointer"
                            >
                              {pOpt.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        id="item-submit-button"
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-bold rounded-xl text-white transition-all cursor-pointer shadow-lg shadow-indigo-950/20"
                      >
                        {editingSku ? 'Update Item Master' : 'Save SKU Item Master'}
                      </button>
                      {editingSku && (
                        <button
                          id="item-cancel-edit-button"
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 font-semibold rounded-xl text-slate-350 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* Listings - 7 slots (styled in Bento style grid) */}
              <div className="lg:col-span-7 space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <h4 id="item-catalog-header" className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                      Active SKU Catalog ({filteredItems.length === items.length ? items.length : `${filteredItems.length}/${items.length}`} records)
                    </h4>
                    
                    {(itemSearchQuery || itemGroupFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={() => {
                          setItemSearchQuery('');
                          setItemGroupFilter('ALL');
                        }}
                        className="text-[10px] font-mono text-indigo-400 hover:underline text-left cursor-pointer font-bold uppercase tracking-wider"
                      >
                        [ Clear Filters ]
                      </button>
                    )}
                  </div>

                  {/* Search and Filter Panel */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-1.5 border border-slate-800 rounded-xl">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-500">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="item-catalog-search-input"
                        type="text"
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        placeholder="Search SKU or name..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 transition-colors"
                      />
                      {itemSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setItemSearchQuery('')}
                          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500 hover:text-slate-350 cursor-pointer animate-fade-in"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="relative font-sans">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-500">
                        <Filter className="w-3.5 h-3.5" />
                      </span>
                      <select
                        id="item-catalog-group-filter-select"
                        value={itemGroupFilter}
                        onChange={(e) => setItemGroupFilter(e.target.value)}
                        className="w-full pl-8 pr-6 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-205 cursor-pointer focus:outline-none focus:border-indigo-500 font-medium appearance-none"
                      >
                        <option value="ALL" className="bg-slate-900 font-medium">All Classifications</option>
                        {itemGroups.map(ig => (
                          <option key={ig.id} value={ig.id} className="bg-slate-900">
                            {ig.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
                
                {items.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                    No items registered. Set up pristine seed data inside the Settings tab.
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/20 border border-dashed border-indigo-500/20 rounded-2xl text-slate-300 text-xs space-y-1.5 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent">
                    <p className="font-semibold text-slate-300">No search results found</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">Your filters didn't match any active SKU entries. Try checking your spelling or reset the filter scopes below.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setItemSearchQuery('');
                        setItemGroupFilter('ALL');
                      }}
                      className="mt-2.5 text-indigo-400 hover:text-indigo-300 font-bold tracking-wider uppercase text-[10px] cursor-pointer hover:underline"
                    >
                      Reset Search Filters
                    </button>
                  </div>
                ) : (
                  <div id="item-bento-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                    {filteredItems.map(item => {
                      const group = itemGroups.find(g => g.id === item.groupId);
                      return (
                        <div 
                          key={item.sku} 
                          id={`item-card-${item.sku}`}
                          className="relative p-3 bg-slate-950/60 border border-slate-800 hover:border-indigo-500/30 rounded-2xl flex flex-col justify-between gap-2.5 transition-all duration-300 hover:bg-slate-950 hover:shadow-xl hover:shadow-indigo-950/10 group/card text-xs"
                        >
                          <div className="flex gap-2.5">
                            {/* Bento Thumbnail Box */}
                            <div 
                              id={`item-zoom-trigger-${item.sku}`}
                              className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer relative group/thumb shadow-inner"
                              onClick={() => setZoomedImageUrl(item.imageUrl || 'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=800&auto=format&fit=crop')}
                              title="Click to view full photo"
                            >
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="text-slate-655 font-mono text-[8px] uppercase font-bold text-center select-none leading-none">
                                  No image
                                </div>
                              )}
                              <div className="absolute inset-0 bg-indigo-950/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                <span className="text-[7px] font-mono font-bold text-white tracking-widest uppercase">Zoom</span>
                              </div>
                            </div>

                            {/* Catalog description */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[9px] font-mono font-extrabold text-indigo-400 bg-indigo-550/10 border border-indigo-500/20 px-1.5 py-0.2 rounded uppercase">
                                  {item.sku}
                                </span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[80px]">
                                  {group?.name || item.groupId}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-200 text-xs leading-none line-clamp-1" title={item.name}>
                                {item.name}
                              </h5>
                              <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal" title={item.description}>
                                {item.description || 'No metadata.'}
                              </p>
                            </div>
                          </div>

                          {/* Inventory valuation & tools block */}
                          <div className="flex flex-col border-t border-slate-850/60 pt-2 mt-0.5 gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-mono text-[10px] leading-relaxed text-slate-400 space-y-0.5">
                                <div className="text-slate-450">
                                  {lang === 'IN' ? 'HPP/Cost' : 'COGS/Cost'}: <span className="text-xs font-semibold text-slate-200">{convertAndFormatSellingPrice(item.unitCost)}</span>
                                </div>
                                <div className="text-indigo-400 font-bold">
                                  {lang === 'IN' ? 'Harga Jual' : 'Selling Price'}: <span className="text-xs font-semibold">{convertAndFormatSellingPrice(item.sellingPrice)}</span>
                                </div>
                                <div className="text-[9px] text-slate-500 mt-0.5">
                                  Safety: <span className="text-rose-500 font-bold">{item.minStock}</span>
                                </div>
                              </div>

                              {/* Edit & Delete trigger buttons */}
                              {confirmDeleteSku === item.sku ? (
                                <div className="flex items-center gap-1 bg-rose-950/30 border border-rose-500/30 px-1.5 py-0.5 rounded-lg text-xs font-semibold animate-fade-in font-sans">
                                  <span className="text-rose-400 font-bold text-[9px]">{lang === 'IN' ? 'Hapus?' : 'Delete?'}</span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await handleDeleteItem(item.sku);
                                        setDbMessage(`Item "${item.name}" deleted successfully.`);
                                      } catch {
                                        setDbMessage(`Could not delete Item "${item.name}".`);
                                      }
                                      setConfirmDeleteSku(null);
                                    }}
                                    className="px-1.5 py-0.5 bg-rose-650 hover:bg-rose-600 text-white rounded text-[9px] font-bold cursor-pointer transition-all border border-rose-600 shadow"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteSku(null)}
                                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded text-[9px] font-bold cursor-pointer transition-all border border-slate-700 shadow"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    id={`item-edit-btn-${item.sku}`}
                                    type="button"
                                    onClick={() => handleEditClick(item)}
                                    className="p-1 rounded-md bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                                    title="Edit Item Details"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    id={`item-delete-btn-${item.sku}`}
                                    type="button"
                                    onClick={() => setConfirmDeleteSku(item.sku)}
                                    className="p-1 rounded-md bg-slate-900 border border-slate-800 hover:border-red-500/40 hover:bg-rose-950/20 text-slate-400 hover:text-rose-450 transition-all cursor-pointer"
                                    title="Delete Catalog Item"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Vendor purchase details */}
                            {(item.vendorCode || item.itemVendorCode || item.buyPrice !== undefined) && (
                              <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-850 text-[10px] text-slate-400 font-mono space-y-0.5">
                                {item.vendorCode && (
                                  <div className="flex justify-between gap-2">
                                    <span className="text-slate-500">{lang === 'IN' ? 'Vendor:' : 'Vendor:'}</span>
                                    <span className="font-semibold text-slate-350 truncate max-w-[120px]" title={vendors?.find(v => v.id === item.vendorCode)?.name || item.vendorCode}>
                                      {vendors?.find(v => v.id === item.vendorCode)?.name || item.vendorCode}
                                    </span>
                                  </div>
                                )}
                                {item.itemVendorCode && (
                                  <div className="flex justify-between gap-2">
                                    <span className="text-slate-500">{lang === 'IN' ? 'SKU Vendor:' : 'Vendor SKU:'}</span>
                                    <span className="text-indigo-350 font-semibold truncate max-w-[120px]" title={item.itemVendorCode}>{item.itemVendorCode}</span>
                                  </div>
                                )}
                                {item.buyPrice !== undefined && (
                                  <div className="flex justify-between border-t border-slate-850/40 pt-0.5 mt-0.5">
                                    <span className="text-slate-500">{lang === 'IN' ? 'Harga Beli:' : 'Buy Price:'}</span>
                                    <span className="font-bold text-emerald-450">
                                      {item.buyCurrency || 'USD'} {item.buyPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. ITEM GROUP SCREEN */}
        {activeTab === 'ITEM_GROUP' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Item Classifications (Item Groups)</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl h-fit space-y-4">
                <div 
                  onClick={() => setIsItemGroupFormCollapsed(!isItemGroupFormCollapsed)}
                  className="flex items-center justify-between cursor-pointer select-none pb-1 group"
                  title={isItemGroupFormCollapsed ? "Click to expand item group registration form" : "Click to collapse item group registration form"}
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-505 group-hover:bg-indigo-500/20 transition-colors">
                      {editingGroupId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                    {editingGroupId ? 'Edit Classification Group' : 'Add Classification Group'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                    <span>{isItemGroupFormCollapsed ? 'Expand' : 'Collapse'}</span>
                    {isItemGroupFormCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>
                </div>
                
                {!isItemGroupFormCollapsed && (
                  <form onSubmit={handleItemGroupSubmit} className="space-y-4 text-xs animate-fade-in">
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Group ID Code (lowercase)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingGroupId}
                        value={igId}
                        onChange={(e) => setIgId(e.target.value)}
                        placeholder="e.g. peripherals"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 font-mono focus:outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Classification Name</label>
                      <input
                        type="text"
                        required
                        value={igName}
                        onChange={(e) => setIgName(e.target.value)}
                        placeholder="Computer Peripherals"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Group Scope description</label>
                      <textarea
                        value={igDesc}
                        onChange={(e) => setIgDesc(e.target.value)}
                        placeholder="Input keyboards, mice, external storage hubs..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-205 focus:outline-none min-h-[60px]"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-bold rounded-xl text-white transition-all cursor-pointer shadow outline-none"
                      >
                        {editingGroupId ? 'Update Group' : 'Save Item Group Category'}
                      </button>
                      {editingGroupId && (
                        <button
                          type="button"
                          onClick={handleCancelItemGroupEdit}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-slate-300 transition-all cursor-pointer outline-none"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Registered classification groups</h4>
                
                <div className="space-y-3">
                  {itemGroups.map(grp => (
                    <div key={grp.id} className="relative pb-14 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700/80 transition-all flex flex-col justify-between group">
                      <div className="space-y-1">
                        <span className="inline-block text-[9px] font-mono tracking-widest uppercase text-indigo-400 bg-indigo-550/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {grp.id}
                        </span>
                        <h4 className="text-slate-100 font-bold text-xs">{grp.name}</h4>
                        {grp.description && (
                          <p className="text-[10px] text-slate-450 leading-relaxed mt-0.5">{grp.description}</p>
                        )}
                      </div>
                      
                      {confirmDeleteGroupId === grp.id ? (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/30 px-2 py-1 rounded-xl text-xs font-semibold animate-fade-in z-10 font-sans">
                          <span className="text-rose-400 font-bold text-[10px]">Hapus?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await deleteItemGroup(grp.id);
                                setDbMessage(`Item Group "${grp.name}" deleted successfully.`);
                                if (editingGroupId === grp.id) {
                                  handleCancelItemGroupEdit();
                                }
                              } catch {
                                setDbMessage(`Could not delete Item Group "${grp.name}".`);
                              }
                              setConfirmDeleteGroupId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-650 hover:bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer transition-all border border-rose-600 shadow"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteGroupId(null)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition-all border border-slate-700 shadow"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditItemGroup(grp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                            title="Edit group"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteGroupId(grp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete group"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. CUSTOMER MASTER SCREEN */}
        {activeTab === 'CUSTOMER_MASTER' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Customer Master Directory</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl h-fit space-y-4">
                <div 
                  onClick={() => setIsCustomerFormCollapsed(!isCustomerFormCollapsed)}
                  className="flex items-center justify-between cursor-pointer select-none pb-1 group"
                  title={isCustomerFormCollapsed ? "Click to expand customer registration form" : "Click to collapse customer registration form"}
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-505 group-hover:bg-indigo-500/20 transition-colors">
                      {editingCustId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                    {editingCustId ? 'Edit Customer' : 'Register New Customer'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                    <span>{isCustomerFormCollapsed ? 'Expand' : 'Collapse'}</span>
                    {isCustomerFormCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>
                </div>
                
                {!isCustomerFormCollapsed && (
                  <form onSubmit={handleCustomerSubmit} className="space-y-3.5 text-xs animate-fade-in">
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Unique Customer ID (e.g. CUST-01)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingCustId}
                        value={custId}
                        onChange={(e) => setCustId(e.target.value.toUpperCase())}
                        placeholder="CUST-X01"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 font-mono focus:outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Company / Customer Name</label>
                      <input
                        type="text"
                        required
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="PT Mandiri Tech"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Customer Group Segment Tier</label>
                      <select
                        value={custGroupId}
                        onChange={(e) => setCustGroupId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 cursor-pointer focus:outline-none focus:border-indigo-500 font-semibold"
                      >
                        {customerGroups.map(cg => (
                          <option key={cg.id} value={cg.id}>{cg.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        placeholder="procurement@mandiri.co.id"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Primary phone / contact number</label>
                      <input
                        type="text"
                        required
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="+62 21 8234 567"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-bold rounded-xl text-white transition-all cursor-pointer shadow outline-none"
                      >
                        {editingCustId ? 'Update Customer' : 'Save Customer Record'}
                      </button>
                      {editingCustId && (
                        <button
                          type="button"
                          onClick={handleCancelCustomerEdit}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-slate-300 transition-all cursor-pointer outline-none"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Registered active accounts</h4>
                
                <div className="space-y-3">
                  {customers.map(cust => {
                    const grp = customerGroups.find(c => c.id === cust.customerGroupId);
                    return (
                      <div key={cust.id} className="relative pb-16 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700/80 transition-colors flex flex-col gap-3 group">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20 uppercase">
                              {cust.id}
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 tracking-wider uppercase">
                              {grp?.name || cust.customerGroupId}
                            </span>
                          </div>
                          <h4 className="text-slate-150 font-bold text-xs">{cust.name}</h4>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-[10px] text-slate-450">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {cust.email}
                            </span>
                            <span className="hidden sm:inline text-slate-700">•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {cust.phone}
                            </span>
                          </div>
                        </div>

                        {grp && grp.discountPercent > 0 && (
                          <div className="self-start">
                            <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-emerald-450">
                              {grp.discountPercent}% OFF List
                            </span>
                          </div>
                        )}

                        {confirmDeleteCustId === cust.id ? (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/30 px-2 py-1 rounded-xl text-xs font-semibold animate-fade-in z-10 font-sans">
                            <span className="text-rose-400 font-bold text-[10px]">Hapus?</span>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await deleteCustomer(cust.id);
                                  setDbMessage(`Customer "${cust.name}" deleted successfully.`);
                                  if (editingCustId === cust.id) {
                                    handleCancelCustomerEdit();
                                  }
                                } catch {
                                  setDbMessage(`Could not delete Customer "${cust.name}".`);
                                }
                                setConfirmDeleteCustId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-650 hover:bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer transition-all border border-rose-600 shadow"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCustId(null)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition-all border border-slate-700 shadow"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditCustomer(cust)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                              title="Edit profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteCustId(cust.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Delete profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CUSTOMER GROUP SCREEN */}
        {activeTab === 'CUSTOMER_GROUP' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Customer Groups & Discount Tiers</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl h-fit space-y-4">
                <div 
                  onClick={() => setIsCustomerGroupFormCollapsed(!isCustomerGroupFormCollapsed)}
                  className="flex items-center justify-between cursor-pointer select-none pb-1 group"
                  title={isCustomerGroupFormCollapsed ? "Click to expand customer group form" : "Click to collapse customer group form"}
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-505 group-hover:bg-indigo-500/20 transition-colors">
                      {editingCustGroupId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                    {editingCustGroupId ? 'Edit Customer Group' : 'Add Customer Group'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                    <span>{isCustomerGroupFormCollapsed ? 'Expand' : 'Collapse'}</span>
                    {isCustomerGroupFormCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>
                </div>
                
                {!isCustomerGroupFormCollapsed && (
                  <form onSubmit={handleCustomerGroupSubmit} className="space-y-4 text-xs animate-fade-in">
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Group Tag ID (lowercase)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingCustGroupId}
                        value={cgId}
                        onChange={(e) => setCgId(e.target.value)}
                        placeholder="e.g. corporate-partner"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 font-mono focus:outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Group / Tier Name</label>
                      <input
                        type="text"
                        required
                        value={cgName}
                        onChange={(e) => setCgName(e.target.value)}
                        placeholder="Gold Member Strategic Partner"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Wholesale Discount Factor (%)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        value={cgDiscountPercent}
                        onChange={(e) => setCgDiscountPercent(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-bold rounded-xl text-white transition-all cursor-pointer shadow outline-none"
                      >
                        {editingCustGroupId ? 'Update Group' : 'Save Customer Group'}
                      </button>
                      {editingCustGroupId && (
                        <button
                          type="button"
                          onClick={handleCancelCustomerGroupEdit}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-slate-300 transition-all cursor-pointer outline-none"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Active Customer Groups</h4>
                
                <div className="space-y-3.5">
                  {customerGroups.map(grp => (
                    <div key={grp.id} className="relative pb-16 p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3.5 bg-slate-950/40 group">
                      <div className="space-y-0.5">
                        <span className="font-bold text-indigo-400 font-mono uppercase text-[9px] bg-indigo-550/10 border border-indigo-500/20 px-1.5 py-0.5 rounded leading-none">
                          Segment: {grp.id}
                        </span>
                        <h4 className="text-slate-100 font-bold mt-1 text-xs">{grp.name}</h4>
                      </div>
                      <div className="self-start">
                        <span className="text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-emerald-400 rounded-lg">
                          {grp.discountPercent}% Discount Factor
                        </span>
                      </div>

                      {confirmDeleteCustGroupId === grp.id ? (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/30 px-2 py-1 rounded-xl text-xs font-semibold animate-fade-in z-10 font-sans">
                          <span className="text-rose-400 font-bold text-[10px]">Hapus?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await deleteCustomerGroup(grp.id);
                                setDbMessage(`Customer Group "${grp.name}" deleted successfully.`);
                                if (editingCustGroupId === grp.id) {
                                  handleCancelCustomerGroupEdit();
                                }
                              } catch {
                                setDbMessage(`Could not delete Customer Group "${grp.name}".`);
                              }
                              setConfirmDeleteCustGroupId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-650 hover:bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer transition-all border border-rose-600 shadow"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCustGroupId(null)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition-all border border-slate-700 shadow"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditCustomerGroup(grp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                            title="Edit group"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCustGroupId(grp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete group"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. VENDOR MASTER SCREEN */}
        {activeTab === 'VENDOR_MASTER' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Vendor Supplier Directory</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl h-fit space-y-4">
                <div 
                  onClick={() => setIsVendorFormCollapsed(!isVendorFormCollapsed)}
                  className="flex items-center justify-between cursor-pointer select-none pb-1 group"
                  title={isVendorFormCollapsed ? "Click to expand vendor registration form" : "Click to collapse vendor registration form"}
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-505 group-hover:bg-indigo-500/20 transition-colors">
                      {editingVendId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                    {editingVendId ? 'Edit Supplier' : 'Register New Supplier'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                    <span>{isVendorFormCollapsed ? 'Expand' : 'Collapse'}</span>
                    {isVendorFormCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>
                </div>
                
                {!isVendorFormCollapsed && (
                  <form onSubmit={handleVendorSubmit} className="space-y-3.5 text-xs animate-fade-in">
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Unique Vendor ID (e.g. VEND-001)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingVendId}
                        value={vendId}
                        onChange={(e) => setVendId(e.target.value.toUpperCase())}
                        placeholder="VEND-A90"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 font-mono focus:outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Supplier Business Name</label>
                      <input
                        type="text"
                        required
                        value={vendName}
                        onChange={(e) => setVendName(e.target.value)}
                        placeholder="NVIDIA Asia Pacific HQ"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Vendor Industry Grouping</label>
                      <select
                        value={vendGroupId}
                        onChange={(e) => setVendGroupId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 cursor-pointer focus:outline-none focus:border-indigo-500 font-semibold"
                      >
                        {vendorGroups && vendorGroups.length > 0 ? (
                          vendorGroups.map(vg => (
                            <option key={vg.id} value={vg.id}>{vg.name}</option>
                          ))
                        ) : (
                          itemGroups.map(ig => <option key={ig.id} value={ig.id}>{ig.name}</option>)
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Active Email Address</label>
                      <input
                        type="email"
                        required
                        value={vendEmail}
                        onChange={(e) => setVendEmail(e.target.value)}
                        placeholder="supply@nvidia.com"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Point-of-contact phone line</label>
                      <input
                        type="text"
                        required
                        value={vendPhone}
                        onChange={(e) => setVendPhone(e.target.value)}
                        placeholder="+1 408 8123 456"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-bold rounded-xl text-white transition-all cursor-pointer shadow outline-none"
                      >
                        {editingVendId ? 'Update Supplier' : 'Save Supplier Record'}
                      </button>
                      {editingVendId && (
                        <button
                          type="button"
                          onClick={handleCancelVendorEdit}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-slate-300 transition-all cursor-pointer outline-none"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Registered active suppliers</h4>
                
                <div className="space-y-3">
                  {vendors.map(vend => {
                    const grpName = vendorGroups?.find(v => v.id === vend.vendorGroupId)?.name || vend.vendorGroupId;
                    return (
                      <div key={vend.id} className="relative pb-16 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700/80 transition-colors flex flex-col gap-3 group">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20 uppercase">
                              {vend.id}
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 tracking-wider uppercase">
                              Type ID: {grpName}
                            </span>
                          </div>
                          
                          <h4 className="text-slate-150 font-bold text-xs">{vend.name}</h4>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-[10px] text-slate-450 font-sans mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {vend.email}
                            </span>
                            <span className="hidden sm:inline text-slate-700">•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {vend.phone}
                            </span>
                          </div>
                        </div>

                        {confirmDeleteVendId === vend.id ? (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/30 px-2 py-1 rounded-xl text-xs font-semibold animate-fade-in z-10 font-sans">
                            <span className="text-rose-400 font-bold text-[10px]">Hapus?</span>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await deleteVendor(vend.id);
                                  setDbMessage(`Vendor "${vend.name}" deleted successfully.`);
                                  if (editingVendId === vend.id) {
                                    handleCancelVendorEdit();
                                  }
                                } catch {
                                  setDbMessage(`Could not delete Vendor "${vend.name}".`);
                                }
                                setConfirmDeleteVendId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-650 hover:bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer transition-all border border-rose-600 shadow"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteVendId(null)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition-all border border-slate-700 shadow"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => handleEditVendor(vend)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                              title="Edit profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteVendId(vend.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Delete vendor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. VENDOR GROUP SCREEN */}
        {activeTab === 'VENDOR_GROUP' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Vendor Supplier Classifications</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl h-fit space-y-4">
                <div 
                  onClick={() => setIsVendorGroupFormCollapsed(!isVendorGroupFormCollapsed)}
                  className="flex items-center justify-between cursor-pointer select-none pb-1 group"
                  title={isVendorGroupFormCollapsed ? "Click to expand supplier group form" : "Click to collapse supplier group form"}
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-505 group-hover:bg-indigo-500/20 transition-colors">
                      {editingVendGroupId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                    {editingVendGroupId ? 'Edit Supplier Group' : 'Add Supplier Group'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                    <span>{isVendorGroupFormCollapsed ? 'Expand' : 'Collapse'}</span>
                    {isVendorFormCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>
                </div>
                
                {!isVendorGroupFormCollapsed && (
                  <form onSubmit={handleVendorGroupSubmit} className="space-y-4 text-xs animate-fade-in">
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Group ID Code (lowercase)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingVendGroupId}
                        value={vgId}
                        onChange={(e) => setVgId(e.target.value)}
                        placeholder="e.g. domestic-trade"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 font-mono focus:outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Supplier Group Name</label>
                      <input
                        type="text"
                        required
                        value={vgName}
                        onChange={(e) => setVgName(e.target.value)}
                        placeholder="Domestic Trade & Materials"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-bold rounded-xl text-white transition-all cursor-pointer shadow outline-none"
                      >
                        {editingVendGroupId ? 'Update Group' : 'Save Vendor Group Category'}
                      </button>
                      {editingVendGroupId && (
                        <button
                          type="button"
                          onClick={handleCancelVendorGroupEdit}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-slate-300 transition-all cursor-pointer outline-none"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Registered supplier types</h4>
                
                <div className="space-y-3">
                  {vendorGroups && vendorGroups.length > 0 ? (
                    vendorGroups.map(grp => (
                      <div key={grp.id} className="relative pb-14 p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-700/80 transition-all flex flex-col justify-between group">
                        <div className="space-y-1">
                          <span className="inline-block text-[9px] font-mono tracking-widest uppercase text-indigo-400 bg-indigo-550/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {grp.id}
                          </span>
                          <h4 className="text-slate-100 font-bold text-xs mt-1">{grp.name}</h4>
                        </div>

                        {confirmDeleteVendGroupId === grp.id ? (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/30 px-2 py-1 rounded-xl text-xs font-semibold animate-fade-in z-10 font-sans">
                            <span className="text-rose-400 font-bold text-[10px]">Hapus?</span>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await deleteVendorGroup(grp.id);
                                  setDbMessage(`Vendor Group "${grp.name}" deleted successfully.`);
                                  if (editingVendGroupId === grp.id) {
                                    handleCancelVendorGroupEdit();
                                  }
                                } catch {
                                  setDbMessage(`Could not delete Vendor Group "${grp.name}".`);
                                }
                                setConfirmDeleteVendGroupId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-650 hover:bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer transition-all border border-rose-600 shadow"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteVendGroupId(null)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition-all border border-slate-700 shadow"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditVendorGroup(grp)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                              title="Edit classification"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteVendGroupId(grp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Delete classification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-slate-555 text-xs">
                      No vendor groups defined. Register classification group using the form on the left.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. WAREHOUSE MASTER SCREEN */}
        {activeTab === 'WAREHOUSE_MASTER' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Define Physical Warehouse Locations</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-4.5 rounded-2xl h-fit space-y-4">
                <div 
                  onClick={() => setIsWarehouseFormCollapsed(!isWarehouseFormCollapsed)}
                  className="flex items-center justify-between cursor-pointer select-none pb-1 group"
                  title={isWarehouseFormCollapsed ? "Click to expand warehouse registration form" : "Click to collapse warehouse registration form"}
                >
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-505 group-hover:bg-indigo-500/20 transition-colors">
                      {editingWarehouseCode ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </span>
                    {editingWarehouseCode ? 'Edit Warehouse Location' : 'Register Warehouse'}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                    <span>{isWarehouseFormCollapsed ? 'Expand' : 'Collapse'}</span>
                    {isWarehouseFormCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>
                </div>
                
                {!isWarehouseFormCollapsed && (
                  <form onSubmit={handleWarehouseSubmit} className="space-y-3.5 text-xs animate-fade-in">
                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Unique Zone Code (e.g. WH-JKT-01)</label>
                      <input
                        type="text"
                        required
                        disabled={!!editingWarehouseCode}
                        value={whCode}
                        onChange={(e) => setWhCode(e.target.value)}
                        placeholder="WH-JKT-01"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 font-mono focus:outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Display Site Name</label>
                      <input
                        type="text"
                        required
                        value={whName}
                        onChange={(e) => setWhName(e.target.value)}
                        placeholder="Jakarta Central Hub"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-1">Address / Coordinates</label>
                      <input
                        type="text"
                        required
                        value={whLocation}
                        onChange={(e) => setWhLocation(e.target.value)}
                        placeholder="Jl. Thamrin No 14, Jakarta Pusat"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-250 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="wh-is-cannibal"
                        checked={whIsCannibal}
                        onChange={(e) => setWhIsCannibal(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      />
                      <label htmlFor="wh-is-cannibal" className="text-xs font-mono tracking-wider uppercase font-bold text-slate-400 cursor-pointer select-none">
                        Cannibal Warehouse
                      </label>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-bold rounded-xl text-white transition-all cursor-pointer shadow outline-none"
                      >
                        {editingWarehouseCode ? 'Update Warehouse' : 'Save Warehouse Hub Location'}
                      </button>
                      {editingWarehouseCode && (
                        <button
                          type="button"
                          onClick={handleCancelWarehouseEdit}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 font-bold rounded-xl text-slate-300 transition-all cursor-pointer outline-none"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3.5 pr-1 max-h-[520px] overflow-y-auto">
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Active Warehouse Sites ({warehouses.length})</h4>
                
                {warehouses.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-slate-550 text-xs">
                    No warehouses defined. Register warehouses inside the Settings tab.
                  </div>
                ) : (
                  warehouses.map(wh => (
                    <div key={wh.code} className="relative pb-16 p-4 bg-slate-950 border border-slate-800 hover:border-slate-705 rounded-2xl flex flex-col gap-3 group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                            {wh.code}
                          </span>
                          <h4 className="text-slate-100 font-bold text-xs">{wh.name}</h4>
                          {wh.isCannibal && (
                            <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold select-none">
                              Cannibal
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-450 flex items-center gap-1 mt-1 leading-normal">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Address: {wh.location}</span>
                        </p>
                      </div>

                      {confirmDeleteWarehouseCode === wh.code ? (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-rose-950/30 border border-rose-500/30 px-2 py-1 rounded-xl text-xs font-semibold animate-fade-in z-10 font-sans">
                          <span className="text-rose-400 font-bold text-[10px]">Hapus?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await deleteWarehouse(wh.code);
                                setDbMessage(`Warehouse "${wh.name}" deleted successfully.`);
                                if (editingWarehouseCode === wh.code) {
                                  handleCancelWarehouseEdit();
                                }
                              } catch {
                                setDbMessage(`Could not delete Warehouse "${wh.name}".`);
                              }
                              setConfirmDeleteWarehouseCode(null);
                            }}
                            className="px-2 py-0.5 bg-rose-650 hover:bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer transition-all border border-rose-600 shadow"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteWarehouseCode(null)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition-all border border-slate-700 shadow"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleEditWarehouse(wh)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                            title="Edit zoning"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteWarehouseCode(wh.code)}
                            className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete zoning"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7.5. ROLES & OPERATIONS ACCESS SEATS */}
        {activeTab === 'ROLES_SEATS' && (
          <RolesAndSeatsSection 
            customRoles={customRoles}
            emailRoles={emailRoles}
            createOrUpdateCustomRole={createOrUpdateCustomRole}
            deleteCustomRole={deleteCustomRole}
            createOrUpdateEmailRole={createOrUpdateEmailRole}
            deleteEmailRole={deleteEmailRole}
            setDbMessage={setDbMessage}
          />
        )}

        {/* 8. GENERAL SETTINGS */}
        {activeTab === 'SETTINGS' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-bold text-slate-100 text-lg">System Settings & Seed Management</h3>
            </div>

            <div className="p-5 bg-slate-955 border border-slate-800 rounded-2xl space-y-4 text-xs">
              <div className="space-y-1.5 leading-relaxed text-slate-350">
                <span className="font-bold text-indigo-400 block text-sm">AlphaLux Core Populator tool</span>
                <p>
                  Clicking the load button below writes pristine seed datasets to Cloud Firestore using transaction batches. This automatically configures:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 py-1 font-mono text-[10px]">
                  <li>CPU processor SKUs & capacitor SMD sub-components</li>
                  <li>Inbound/Outbound physical storage warehouse zones</li>
                  <li>Customer distributor profiles and OEM supplier channels</li>
                  <li>SOH bin maps (`BIN-GEN`) & movement ledgers</li>
                </ul>
              </div>

              {userProfile?.role === 'admin' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSeedAction}
                      className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 font-extrabold text-white rounded-xl transition-all select-none cursor-pointer flex items-center gap-2 shadow text-[11px]"
                    >
                      <ListRestart className="w-4 h-4" />
                      Load Alphalux AIM Pristine Seed Data
                    </button>
                    
                    {!confirmDeleteAllItems ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAllItems(true)}
                        className="px-5 py-2.5 bg-rose-700 hover:bg-rose-650 font-extrabold text-white rounded-xl transition-all select-none cursor-pointer flex items-center gap-2 shadow text-[11px]"
                      >
                        <Trash2 className="w-4 h-4" />
                        Erase All Master Items
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteAllItems(false);
                          setDeleteAllPassword('');
                        }}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 font-extrabold text-slate-350 rounded-xl transition-all select-none cursor-pointer flex items-center gap-2 shadow text-[11px]"
                      >
                        Cancel Erase
                      </button>
                    )}

                    {!confirmClearDb ? (
                      <button
                        type="button"
                        onClick={() => setConfirmClearDb(true)}
                        className="px-5 py-2.5 bg-rose-900 hover:bg-rose-850 font-extrabold text-white rounded-xl transition-all select-none cursor-pointer flex items-center gap-2 shadow text-[11px]"
                      >
                        <Database className="w-4 h-4" />
                        Erase Entire WMS Database
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmClearDb(false);
                          setClearDbPassword('');
                        }}
                        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 font-extrabold text-slate-350 rounded-xl transition-all select-none cursor-pointer flex items-center gap-2 shadow text-[11px]"
                      >
                        Cancel DB Erase
                      </button>
                    )}
                  </div>

                  {confirmDeleteAllItems && (
                    <div className="p-4 bg-rose-950/20 border border-rose-900/35 rounded-xl space-y-3 max-w-md animate-fade-in">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono font-bold block uppercase text-[10px] text-rose-400">CRITICAL WARNING</span>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            This action will permanently delete all catalog items from your Firestore database. This action is irreversible.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] uppercase font-mono text-slate-450 font-bold">
                          Enter Security Password to Authorize Erase
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Enter password (09098080)"
                            value={deleteAllPassword}
                            onChange={(e) => setDeleteAllPassword(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-205 placeholder:text-slate-650 focus:outline-none focus:border-rose-500 font-mono text-xs focus:ring-1 focus:ring-rose-550/20"
                          />
                          <button
                            type="button"
                            onClick={handleClearAllItems}
                            disabled={deleteAllPassword !== '09098080'}
                            className="px-4 py-1.5 bg-rose-700 hover:bg-rose-650 disabled:bg-slate-900 disabled:text-slate-650 disabled:border-slate-850 border border-rose-650 font-bold text-white rounded-lg text-xs cursor-pointer transition-all disabled:cursor-not-allowed"
                          >
                            Confirm Erase All
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {confirmClearDb && (
                    <div className="p-4 bg-red-955/20 border border-red-900/35 rounded-xl space-y-3 max-w-md animate-fade-in">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono font-bold block uppercase text-[10px] text-red-400">ULTRA CRITICAL WARNING</span>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            This will wipe out the entire WMS system database (all items, stocks, warehouses, customer/vendor data, purchase & sales orders, stock movements, and invoices). Roles and Seats configurations are preserved. This action is irreversible.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] uppercase font-mono text-slate-450 font-bold">
                          Enter Security Password to Authorize Database Wipe
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Enter password (09098080)"
                            value={clearDbPassword}
                            onChange={(e) => setClearDbPassword(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-205 placeholder:text-slate-650 focus:outline-none focus:border-red-500 font-mono text-xs focus:ring-1 focus:ring-red-550/20"
                          />
                          <button
                            type="button"
                            onClick={handleClearAllDatabaseData}
                            disabled={clearDbPassword !== '09098080'}
                            className="px-4 py-1.5 bg-red-750 hover:bg-red-700 disabled:bg-slate-900 disabled:text-slate-650 disabled:border-slate-850 border border-red-650 font-bold text-white rounded-lg text-xs cursor-pointer transition-all disabled:cursor-not-allowed"
                          >
                            Wipe Database
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-red-955/20 border border-red-900/35 rounded-xl text-red-300 flex items-start gap-2 max-w-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <div>
                    <span className="font-mono font-bold block uppercase text-[10px]">Access Blocked</span>
                    <p className="text-[10px] text-red-400 mt-0.5">Mock seed populations are restricted strictly to System Administrator roles.</p>
                  </div>
                </div>
              )}
            </div>

            {/* CSV Item Importer Card (Admin Only) */}
            {userProfile?.role === 'admin' && (
              <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-5 text-xs">
                <div className="space-y-1.5 leading-relaxed text-slate-350">
                  <span className="font-bold text-emerald-400 block text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4 animate-pulse" /> Bulk CSV Item Master Importer
                  </span>
                  <p>
                    Select a `.csv` file containing new or updated items to import them in bulk to Firestore. 
                    Download our official template to ensure formatting compatibility.
                  </p>
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] font-bold text-slate-300 rounded-lg hover:text-slate-100 transition-all flex items-center gap-1.5 select-none cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      Download CSV Template
                    </button>
                  </div>
                </div>

                {/* Upload Zone */}
                <div className="space-y-3">
                  <label className="block text-[10px] uppercase font-mono text-slate-550 font-bold">
                    Upload CSV File
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      className="hidden"
                      id="csv-file-upload"
                      disabled={isImporting}
                    />
                    <label
                      htmlFor="csv-file-upload"
                      className={`px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-750 transition-all flex items-center gap-2 cursor-pointer font-semibold ${
                        isImporting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span>{csvFile ? 'Change CSV File' : 'Choose CSV File'}</span>
                    </label>

                    {csvFile && (
                      <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-xl text-slate-300 text-[11px] font-medium">
                        <span className="truncate max-w-[200px] font-mono text-slate-200">{csvFile.name}</span>
                        <span className="text-[9px] text-slate-550">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCsvFile(null);
                            setCsvItems([]);
                            setCsvErrors([]);
                            setConfirmPassword('');
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                          disabled={isImporting}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parsing Summary & Preview */}
                {(csvItems.length > 0 || csvErrors.length > 0) && (
                  <div className="space-y-4 border-t border-slate-800/80 pt-4">
                    <div className="flex items-center gap-4 text-[11px] font-mono font-bold">
                      <span className="text-slate-450 uppercase">Analysis:</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400">
                        {csvItems.length} Valid Items
                      </span>
                      {csvErrors.length > 0 && (
                        <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400">
                          {csvErrors.length} Validation Errors
                        </span>
                      )}
                    </div>

                    {/* Validation Errors Box */}
                    {csvErrors.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-mono text-rose-450 font-bold block flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-450" /> Data Validation Details
                        </span>
                        <div className="p-3.5 bg-rose-950/15 border border-rose-900/35 rounded-xl max-h-40 overflow-y-auto font-mono text-[11px] text-rose-300 space-y-1.5 leading-relaxed">
                          {csvErrors.map((err, idx) => (
                            <div key={idx} className="flex gap-1">
                              <span className="text-rose-500 shrink-0">•</span>
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview Table of Valid Items */}
                    {csvItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-mono text-slate-550 font-bold block">
                          Preview (First 5 Valid Items)
                        </span>
                        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                          <table className="w-full border-collapse text-left text-[11px] font-sans">
                            <thead>
                              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-450 font-mono uppercase text-[10px]">
                                <th className="p-2.5">SKU</th>
                                <th className="p-2.5">Name</th>
                                <th className="p-2.5">Group</th>
                                <th className="p-2.5 text-right">Cost (USD)</th>
                                <th className="p-2.5 text-right">Price (USD)</th>
                                <th className="p-2.5 text-right">Min Stock</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/50 text-slate-350">
                              {csvItems.slice(0, 5).map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/40">
                                  <td className="p-2.5 font-mono font-bold text-slate-200">{item.sku}</td>
                                  <td className="p-2.5 truncate max-w-[150px]">{item.name}</td>
                                  <td className="p-2.5 font-mono text-[10px] text-indigo-400">{item.groupId}</td>
                                  <td className="p-2.5 text-right font-mono">${item.unitCost.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-mono">${item.sellingPrice.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-mono">{item.minStock}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Import Confirmation & Execution Panel */}
                    {csvItems.length > 0 && (
                      <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3.5 max-w-md">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase font-mono text-slate-450 font-bold">
                            Enter Security Password to Authorize
                          </label>
                          <input
                            type="password"
                            placeholder="Enter confirmation password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isImporting}
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-650 focus:outline-none focus:border-emerald-500 font-mono text-sm focus:ring-1 focus:ring-emerald-500/20"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleCsvImport}
                          disabled={confirmPassword !== '09098080' || isImporting}
                          className="w-full py-2.5 px-4 bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>
                            {isImporting 
                              ? `Importing: ${importProgress.current} / ${importProgress.total} Items` 
                              : `Execute Import of ${csvItems.length} Items`}
                          </span>
                        </button>

                        {isImporting && (
                          <div className="space-y-1.5">
                            <div className="h-2 w-full bg-slate-950 border border-slate-850 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-200"
                                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-slate-550">
                              <span>PROGRESS</span>
                              <span>{((importProgress.current / importProgress.total) * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Zoom Modal Overlay */}
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
            
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-850 flex items-center justify-center">
              <img 
                src={zoomedImageUrl} 
                alt="Zoomed preview" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="mt-3.5 px-1.5 flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
              <span className="text-slate-450 font-bold">Product Image Reference</span>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmSku && (
        <div 
          id="delete-confirmation-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-zoom-in text-xs"
          >
            <div className="flex gap-3 text-rose-450">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-rose-500" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-100 text-sm">Remove SKU Item from Master Directory?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You are about to irreversibly delete item SKU <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{deleteConfirmSku}</span> from the database catalog. This will prevent creation of future sales and purchase records for this item.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 text-xs font-bold pt-2.5">
              <button
                id="delete-cancel-btn"
                type="button"
                onClick={() => setDeleteConfirmSku(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Cancel, Keep Item
              </button>
              <button
                id="delete-confirm-btn"
                type="button"
                onClick={() => handleDeleteItem(deleteConfirmSku)}
                className="px-4 py-2 bg-rose-650 hover:bg-rose-600 text-white rounded-xl transition-colors cursor-pointer"
              >
                Yes, Delete SKU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
