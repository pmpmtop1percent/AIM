import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, writeBatch, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, signInAnonymously, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  UserRole,
  UserProfile,
  Currency,
  Item,
  Warehouse,
  Stock,
  SalesOrder,
  PurchaseOrder,
  StockMovement,
  Cannibalization,
  StockOpname,
  Customer,
  Vendor,
  CustomerGroup,
  VendorGroup,
  ItemGroup,
  Delivery,
  DeliveryItem,
  Invoice,
  InvoiceItem,
  PaymentItem
} from '../types';
import {
  SEED_CURRENCIES,
  SEED_ITEM_GROUPS,
  SEED_CUSTOMER_GROUPS,
  SEED_CUSTOMERS,
  SEED_VENDORS,
  SEED_WAREHOUSES,
  SEED_ITEMS,
  SEED_STOCKS
} from '../seedData';

interface WmsContextProps {
  // Auth state
  currentUser: any;
  userProfile: UserProfile | null;
  loadingAuth: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAnonymouslyWithRole: (role: UserRole, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserProfileRole: (role: UserRole) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, role: UserRole) => Promise<void>;
  signOutUser: () => Promise<void>;

  // Collections state
  currencies: Currency[];
  itemGroups: any[];
  customerGroups: CustomerGroup[];
  customers: Customer[];
  vendors: Vendor[];
  vendorGroups: VendorGroup[];
  warehouses: Warehouse[];
  items: Item[];
  stocks: Stock[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  stockMovements: StockMovement[];
  cannibalizations: Cannibalization[];
  stockOpnames: StockOpname[];
  deliveries: Delivery[];
  invoices: Invoice[];

  // Selected multi-currency config
  selectedCurrency: Currency;
  setSelectedCurrency: (curr: Currency) => void;
  changeCurrency: (code: string) => void;

  // Real-time notification lists
  stockAlerts: { sku: string; warehouseCode: string; message: string; severity: 'high' | 'warning' }[];

  // Core operations/transactions
  loadDefaultSeedData: () => Promise<string>;
  createOrUpdateWarehouse: (wh: Warehouse) => Promise<void>;
  createOrUpdateItem: (item: Item, prices?: { usdCost: number; usdSelling: number }) => Promise<void>;
  deleteItem: (sku: string) => Promise<void>;
  clearAllItems: () => Promise<string>;
  clearAllDatabaseData: () => Promise<string>;
  deleteWarehouse: (code: string) => Promise<void>;
  createOrUpdateItemGroup: (group: ItemGroup) => Promise<void>;
  deleteItemGroup: (id: string) => Promise<void>;
  createOrUpdateCustomerGroup: (group: CustomerGroup) => Promise<void>;
  deleteCustomerGroup: (id: string) => Promise<void>;
  createOrUpdateCustomer: (cust: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  createOrUpdateVendorGroup: (group: VendorGroup) => Promise<void>;
  deleteVendorGroup: (id: string) => Promise<void>;
  createOrUpdateVendor: (vend: Vendor) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  addDirectStockAdjustment: (sku: string, warehouseCode: string, qtyDelta: number, bin: string, rack: string, reason: string) => Promise<void>;
  createSalesOrder: (soData: Partial<SalesOrder>) => Promise<void>;
  updateSalesOrder: (id: string, updatedData: Partial<SalesOrder>) => Promise<void>;
  updateSalesOrderStatus: (id: string, newStatus: SalesOrder['status'], extraData?: Partial<SalesOrder>) => Promise<void>;
  createPurchaseOrder: (poData: Partial<PurchaseOrder>) => Promise<void>;
  updatePurchaseOrder: (id: string, updatedData: Partial<PurchaseOrder>) => Promise<void>;
  updatePurchaseOrderStatus: (id: string, newStatus: PurchaseOrder['status'], receiptItems?: any[]) => Promise<void>;
  executeCannibalization: (
    parentItem: string,
    qty: number,
    componentItem: string,
    componentQty: number,
    fromWhse: string,
    toWhse: string,
    description?: string
  ) => Promise<void>;
  restoreCannibalization: (journalId: string) => Promise<void>;
  createStockOpname: (warehouseCode: string, segmentName: string, items: any[]) => Promise<void>;
  approveStockOpname: (id: string, lossGainDesc: string) => Promise<void>;
  createInvoice: (invoiceData: Partial<Invoice>) => Promise<void>;
  payInvoice: (invoiceId: string) => Promise<void>;
  payments: PaymentItem[];
  createPayment: (paymentData: Partial<PaymentItem>) => Promise<void>;

  // Roles & Seats management
  customRoles: any[];
  emailRoles: any[];
  createOrUpdateCustomRole: (role: any) => Promise<void>;
  deleteCustomRole: (id: string) => Promise<void>;
  createOrUpdateEmailRole: (assignment: any) => Promise<void>;
  deleteEmailRole: (id: string) => Promise<void>;
}

const WmsContext = createContext<WmsContextProps | undefined>(undefined);

export const WmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Synced state arrays
  const [currencies, setCurrencies] = useState<Currency[]>(SEED_CURRENCIES);
  const [itemGroups, setItemGroups] = useState<any[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorGroups, setVendorGroups] = useState<VendorGroup[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [cannibalizations, setCannibalizations] = useState<Cannibalization[]>([]);
  const [stockOpnames, setStockOpnames] = useState<StockOpname[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [emailRoles, setEmailRoles] = useState<any[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);

  // Selected currency (Default is standard client display choice: IDR, converting values accordingly)
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency>(SEED_CURRENCIES[1]); // IDR is index 1

  // Alerts
  const [stockAlerts, setStockAlerts] = useState<{ sku: string; warehouseCode: string; message: string; severity: 'high' | 'warning' }[]>([]);

  const setSelectedCurrency = (curr: Currency) => {
    setSelectedCurrencyState(curr);
  };

  const changeCurrency = (code: string) => {
    const found = currencies.find(c => c.code === code);
    if (found) {
      setSelectedCurrencyState(found);
    }
  };

  // Auth Sync Listener
  useEffect(() => {
    let unsubEmailRoleAssign: (() => void) | null = null;
    let unsubRoleDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Cleanup previous listeners if any
      if (unsubEmailRoleAssign) { unsubEmailRoleAssign(); unsubEmailRoleAssign = null; }
      if (unsubRoleDoc) { unsubRoleDoc(); unsubRoleDoc = null; }

      setCurrentUser(user);
      if (user) {
        // Fetch role from Firestore
        const roleDocRef = doc(db, 'userRoles', user.uid);
        unsubRoleDoc = onSnapshot(roleDocRef, (snap) => {
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            // First time self-register: determine default role based on email pattern
            const emailLower = (user.email || '').toLowerCase().trim();
            let defaultRole: UserRole = 'staff';
            if (emailLower.includes('admin') || emailLower === 'pmpmtop1percent@gmail.com') {
              defaultRole = 'admin';
            } else if (emailLower.includes('manager')) {
              defaultRole = 'manager';
            } else if (emailLower.includes('purchasing')) {
              defaultRole = 'purchasing';
            } else if (emailLower.includes('auditor')) {
              defaultRole = 'auditor';
            }

            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || 'guest@alphalux.com',
              role: defaultRole,
              name: user.displayName || user.email?.split('@')[0] || 'System Operator',
              createdAt: new Date().toISOString()
            };
            setDoc(roleDocRef, newProfile)
              .then(() => setUserProfile(newProfile))
              .catch(err => console.error('Error creating default user role record:', err));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `userRoles/${user.uid}`));

        // Check dynamic seat / role assignment by email in real-time
        const userEmail = (user.email || '').toLowerCase().trim();
        if (userEmail) {
          const emailRoleRef = doc(db, 'emailRoles', userEmail);
          unsubEmailRoleAssign = onSnapshot(emailRoleRef, async (emailSnap) => {
            if (emailSnap.exists()) {
              const assignedRoleId = emailSnap.data().roleId;
              const rDocRef = doc(db, 'userRoles', user.uid);
              try {
                await setDoc(rDocRef, {
                  role: assignedRoleId
                }, { merge: true });
              } catch (e) {
                console.error('Error syncing email role assignment to userProfile doc:', e);
              }
            }
          }, (err) => handleFirestoreError(err, OperationType.GET, `emailRoles/${userEmail}`));
        }
      } else {
        setUserProfile(null);
      }
      setLoadingAuth(false);
    });

    return () => {
      unsubscribe();
      if (unsubEmailRoleAssign) unsubEmailRoleAssign();
      if (unsubRoleDoc) unsubRoleDoc();
    };
  }, []);

  // Multi-Collection Listeners
  useEffect(() => {
    if (!currentUser) return;

    // Listen to Item Groups
    const unsubItemGroups = onSnapshot(collection(db, 'itemGroups'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setItemGroups(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'itemGroups'));

    // Listen to Customer Groups
    const unsubCustGroups = onSnapshot(collection(db, 'customerGroups'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setCustomerGroups(list.length > 0 ? list : SEED_CUSTOMER_GROUPS);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customerGroups'));

    // Listen to Customers
    const unsubCust = onSnapshot(collection(db, 'customers'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setCustomers(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

    // Listen to Vendors
    const unsubVend = onSnapshot(collection(db, 'vendors'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setVendors(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'vendors'));

    // Listen to Vendor Groups
    const unsubVendorGroups = onSnapshot(collection(db, 'vendorGroups'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setVendorGroups(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'vendorGroups'));

    // Listen to Warehouses
    const unsubWH = onSnapshot(collection(db, 'warehouses'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setWarehouses(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'warehouses'));

    // Listen to Item Master
    const unsubItems = onSnapshot(collection(db, 'items'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setItems(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'items'));

    // Listen to Stocks
    const unsubStocks = onSnapshot(collection(db, 'stocks'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setStocks(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'stocks'));

    // Listen to Sales Orders
    const unsubSO = onSnapshot(collection(db, 'salesOrders'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        let status = data.status;
        const pickingList = data.pickingList || [];
        const hasLeftovers = pickingList.some((p: any) => p.quantityRequired > 0);
        
        if ((status === 'Paid' || status === 'Invoiced') && hasLeftovers) {
          status = 'Picking';
          const docRef = doc(db, 'salesOrders', d.id);
          // Use standard updateDoc to synchronize Firestore with the healed state
          updateDoc(docRef, { status: 'Picking', updatedAt: new Date().toISOString() }).catch(err => {
            console.error("Auto-correct SO status failed:", err);
          });
        }
        
        list.push({ id: d.id, ...data, status });
      });
      setSalesOrders(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'salesOrders'));

    // Listen to Purchase Orders
    const unsubPO = onSnapshot(collection(db, 'purchaseOrders'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setPurchaseOrders(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'purchaseOrders'));

    // Listen to Stock Movements
    const unsubMove = onSnapshot(collection(db, 'stockMovements'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      // Sort newest first
      list.sort((a,b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setStockMovements(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'stockMovements'));

    // Listen to Cannibalizations
    const unsubCanni = onSnapshot(collection(db, 'cannibalizations'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a,b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setCannibalizations(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'cannibalizations'));

    // Listen to Stock Opnames
    const unsubOpname = onSnapshot(collection(db, 'stockOpnames'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a,b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setStockOpnames(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'stockOpnames'));

    // Listen to Deliveries
    const unsubDeliveries = onSnapshot(collection(db, 'deliveries'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a,b) => (b.deliveredAt || '').localeCompare(a.deliveredAt || ''));
      setDeliveries(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'deliveries'));

    // Listen to Invoices
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setInvoices(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'invoices'));

    // Listen to Payments
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a,b) => (b.paidAt || '').localeCompare(a.paidAt || ''));
      setPayments(list);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'payments'));

    // Listen to customRoles with automatic default roles seeding
    const unsubCustomRoles = onSnapshot(collection(db, 'customRoles'), async (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      
      if (list.length === 0) {
        const defaults = [
          { id: 'admin', name: '🛡️ Admin (Control Room)', description: 'Full system authorization controls', allowedTabs: ['DASHBOARD', 'STOCK', 'SALES', 'PURCHASE', 'HISTORY', 'OPNAME', 'SETUP'] },
          { id: 'manager', name: '📋 Warehouse Manager', description: 'General inventory & logistics controls', allowedTabs: ['DASHBOARD', 'STOCK', 'SALES', 'PURCHASE', 'HISTORY', 'OPNAME'] },
          { id: 'purchasing', name: '💼 Purchasing Agent', description: 'Procure-to-pay workflow pipelines', allowedTabs: ['DASHBOARD', 'PURCHASE'] },
          { id: 'auditor', name: '✨ External Auditor', description: 'System auditing and balance inspections', allowedTabs: ['DASHBOARD', 'STOCK', 'HISTORY'] },
          { id: 'staff', name: '📦 Operative (Staff)', description: 'Physical stock receipts dispatches and opname', allowedTabs: ['STOCK', 'HISTORY', 'OPNAME'] }
        ];
        for (const r of defaults) {
          try {
            await setDoc(doc(db, 'customRoles', r.id), r);
          } catch (e) {
            console.error('Error seeding default role:', e);
          }
        }
      } else {
        list.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
        setCustomRoles(list);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customRoles'));

    // Listen to emailRoles with automatic default email seeding
    const unsubEmailRoles = onSnapshot(collection(db, 'emailRoles'), async (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      
      if (list.length === 0) {
        try {
          const defaultAss = {
            email: 'pmpmtop1percent@gmail.com',
            roleId: 'admin',
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'emailRoles', 'pmpmtop1percent@gmail.com'), defaultAss);
        } catch (e) {
          console.error('Error seeding default email role:', e);
        }
      } else {
        list.sort((a,b) => (a.email || '').localeCompare(b.email || ''));
        setEmailRoles(list);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'emailRoles'));

    return () => {
      unsubItemGroups();
      unsubCustGroups();
      unsubCust();
      unsubVend();
      unsubVendorGroups();
      unsubWH();
      unsubItems();
      unsubStocks();
      unsubSO();
      unsubPO();
      unsubMove();
      unsubCanni();
      unsubOpname();
      unsubDeliveries();
      unsubInvoices();
      unsubPayments();
      unsubCustomRoles();
      unsubEmailRoles();
    };
  }, [currentUser]);

  // Compute stock alerts live
  useEffect(() => {
    if (stocks.length === 0 || items.length === 0) return;

    const alerts: { sku: string; warehouseCode: string; message: string; severity: 'high' | 'warning' }[] = [];
    stocks.forEach((st) => {
      const item = items.find(i => i.sku === st.sku);
      if (item) {
        const availableSoh = st.physicalQty - st.bookedQty;
        if (availableSoh <= 0) {
          alerts.push({
            sku: st.sku,
            warehouseCode: st.warehouseCode,
            message: `SKU ${st.sku} is entirely OUT OF STOCK in ${st.warehouseCode}! (SOH: ${st.physicalQty}, Booked: ${st.bookedQty})`,
            severity: 'high'
          });
        } else if (availableSoh < item.minStock) {
          alerts.push({
            sku: st.sku,
            warehouseCode: st.warehouseCode,
            message: `SKU ${st.sku} stock level is low in ${st.warehouseCode}: SOH ${availableSoh} units (Minimum: ${item.minStock})`,
            severity: 'warning'
          });
        }
      }
    });
    setStockAlerts(alerts);
  }, [stocks, items]);

  // AUTH API Actions
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google Sign-In failed', err);
    }
  };

  const loginAnonymouslyWithRole = async (role: UserRole, name: string) => {
    try {
      // Create user session and write role document
      const cred = await signInAnonymously(auth);
      const user = cred.user;
      const roleDocRef = doc(db, 'userRoles', user.uid);
      const newProfile: UserProfile = {
        uid: user.uid,
        email: `${role}@alphalux.com`,
        role,
        name,
        createdAt: new Date().toISOString()
      };
      await setDoc(roleDocRef, newProfile);
      setUserProfile(newProfile);
    } catch (err) {
      console.error('Anonymous Sign-In failed', err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  const setUserProfileRole = async (role: UserRole) => {
    if (!currentUser) return;
    try {
      const roleDocRef = doc(db, 'userRoles', currentUser.uid);
      await updateDoc(roleDocRef, { role });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `userRoles/${currentUser.uid}`);
    }
  };

  const signInWithEmail = async (emailInput: string, passwordInput: string) => {
    let email = emailInput.trim();
    if (email.toLowerCase() === 'admin@alhalux.com') {
      email = 'admin@alphalux.com';
    } else if (email.toLowerCase() === 'manager@alhalux.com') {
      email = 'manager@alphalux.com';
    } else if (email.toLowerCase() === 'staff@alhalux.com') {
      email = 'staff@alphalux.com';
    } else if (email.toLowerCase() === 'auditor@alhalux.com') {
      email = 'auditor@alphalux.com';
    }
    await signInWithEmailAndPassword(auth, email, passwordInput);
  };

  const signUpWithEmail = async (emailInput: string, passwordInput: string, role: UserRole = 'staff') => {
    let email = emailInput.trim();
    if (email.toLowerCase() === 'admin@alhalux.com') {
      email = 'admin@alphalux.com';
    } else if (email.toLowerCase() === 'manager@alhalux.com') {
      email = 'manager@alphalux.com';
    } else if (email.toLowerCase() === 'staff@alhalux.com') {
      email = 'staff@alphalux.com';
    } else if (email.toLowerCase() === 'auditor@alhalux.com') {
      email = 'auditor@alphalux.com';
    }
    const cred = await createUserWithEmailAndPassword(auth, email, passwordInput);
    const user = cred.user;
    const roleDocRef = doc(db, 'userRoles', user.uid);
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      role,
      name: email.split('@')[0],
      createdAt: new Date().toISOString()
    };
    await setDoc(roleDocRef, newProfile);
    setUserProfile(newProfile);
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // OPERATIONS / TRANSACTIONS

  // 1. Initial Seed Data loader
  const loadDefaultSeedData = async (): Promise<string> => {
    if (!currentUser) return 'Not authenticated';
    try {
      const batch = writeBatch(db);

      // Write Item Groups
      SEED_ITEM_GROUPS.forEach(ig => {
        batch.set(doc(db, 'itemGroups', ig.id), ig);
      });

      // Write Customer Groups
      SEED_CUSTOMER_GROUPS.forEach(cg => {
        batch.set(doc(db, 'customerGroups', cg.id), cg);
      });

      // Write Customers
      SEED_CUSTOMERS.forEach(c => {
        batch.set(doc(db, 'customers', c.id), c);
      });

      // Write Vendors
      SEED_VENDORS.forEach(v => {
        batch.set(doc(db, 'vendors', v.id), v);
      });

      // Write Warehouses
      SEED_WAREHOUSES.forEach(w => {
        batch.set(doc(db, 'warehouses', w.code), w);
      });

      // Write Items
      SEED_ITEMS.forEach(item => {
        batch.set(doc(db, 'items', item.sku), item);
      });

      // Write Stocks & initial Movement History
      SEED_STOCKS.forEach(st => {
        const stockId = `${st.sku}_${st.warehouseCode}`;
        batch.set(doc(db, 'stocks', stockId), {
          id: stockId,
          sku: st.sku,
          warehouseCode: st.warehouseCode,
          physicalQty: st.physicalQty,
          bookedQty: st.bookedQty,
          bin: st.bin,
          rack: st.rack,
          updatedAt: new Date().toISOString()
        });

        // Insert movement history tracking
        const moveId = `MOVE_INIT_${st.sku}_${st.warehouseCode}`;
        batch.set(doc(db, 'stockMovements', moveId), {
          id: moveId,
          sku: st.sku,
          warehouseCode: st.warehouseCode,
          movementType: 'Inbound',
          referenceVoucher: 'INITIAL_SEED',
          quantityDelta: st.physicalQty,
          cost: SEED_ITEMS.find(i => i.sku === st.sku)?.unitCost || 0,
          userEmail: currentUser.email || 'system@alphalux.com',
          timestamp: new Date().toISOString()
        });
      });

      await batch.commit();
      return 'Successfully loaded full pristine seed inventory data into Cloud Firestore!';
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch/seedData');
      return 'Failed to load seed';
    }
  };

  // Roles & Seats Management functions
  const createOrUpdateCustomRole = async (role: any) => {
    try {
      const id = role.id.toLowerCase().replace(/\s+/g, '-').trim();
      await setDoc(doc(db, 'customRoles', id), {
        id,
        name: role.name,
        description: role.description || '',
        allowedTabs: role.allowedTabs || [],
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `customRoles/${role.id}`);
    }
  };

  const deleteCustomRole = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'customRoles', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `customRoles/${id}`);
    }
  };

  const createOrUpdateEmailRole = async (assignment: any) => {
    try {
      const emailDocId = assignment.email.toLowerCase().trim();
      await setDoc(doc(db, 'emailRoles', emailDocId), {
        email: assignment.email.trim(),
        roleId: assignment.roleId,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `emailRoles/${assignment.email}`);
    }
  };

  const deleteEmailRole = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'emailRoles', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `emailRoles/${id}`);
    }
  };

  // 2. Create/Update physical warehouse
  const createOrUpdateWarehouse = async (wh: Warehouse) => {
    try {
      // Codes are strictly uppercase
      const code = wh.code.toUpperCase().replace(/\s+/g, '-');
      await setDoc(doc(db, 'warehouses', code), { ...wh, code });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `warehouses/${wh.code}`);
    }
  };

const cleanUndefinedKeys = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefinedKeys(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefinedKeys(val);
      }
    }
    return cleaned;
  }
  return obj;
};

  // 3. Create/Update Item Master
  const createOrUpdateItem = async (item: Item, prices?: { usdCost: number; usdSelling: number }) => {
    try {
      const sku = item.sku.toUpperCase().trim();
      const payload = {
        ...item,
        sku,
        unitCost: prices ? prices.usdCost : item.unitCost,
        sellingPrice: prices ? prices.usdSelling : item.sellingPrice
      };
      const cleanedPayload = cleanUndefinedKeys(payload);
      await setDoc(doc(db, 'items', sku), cleanedPayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `items/${item.sku}`);
    }
  };

  const deleteItem = async (sku: string) => {
    try {
      await deleteDoc(doc(db, 'items', sku));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `items/${sku}`);
    }
  };

  const clearAllItems = async (): Promise<string> => {
    try {
      let count = 0;
      for (const item of items) {
        if (item && item.sku) {
          try {
            await deleteDoc(doc(db, 'items', item.sku));
            count++;
          } catch (err: any) {
            throw new Error(`Failed to delete items/${item.sku}: ${err.message || err}`);
          }
        }
      }
      return `Success: Erased all ${count} master items from Firestore.`;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'items/clear-all');
      throw err;
    }
  };

  const clearAllDatabaseData = async (): Promise<string> => {
    try {
      const deletions: { collection: string; id: string }[] = [];

      // Gather deletions from all collections (excluding userRoles to preserve auth profiles)
      items.forEach(x => { if (x && x.sku) deletions.push({ collection: 'items', id: x.sku }); });
      stocks.forEach(x => { if (x && x.id) deletions.push({ collection: 'stocks', id: x.id }); });
      salesOrders.forEach(x => { if (x && x.id) deletions.push({ collection: 'salesOrders', id: x.id }); });
      purchaseOrders.forEach(x => { if (x && x.id) deletions.push({ collection: 'purchaseOrders', id: x.id }); });
      stockMovements.forEach(x => { if (x && x.id) deletions.push({ collection: 'stockMovements', id: x.id }); });
      cannibalizations.forEach(x => { if (x && x.id) deletions.push({ collection: 'cannibalizations', id: x.id }); });
      stockOpnames.forEach(x => { if (x && x.id) deletions.push({ collection: 'stockOpnames', id: x.id }); });
      deliveries.forEach(x => { if (x && x.id) deletions.push({ collection: 'deliveries', id: x.id }); });
      invoices.forEach(x => { if (x && x.id) deletions.push({ collection: 'invoices', id: x.id }); });
      payments.forEach(x => { if (x && x.id) deletions.push({ collection: 'payments', id: x.id }); });
      warehouses.forEach(x => { if (x && x.code) deletions.push({ collection: 'warehouses', id: x.code }); });
      customers.forEach(x => { if (x && x.id) deletions.push({ collection: 'customers', id: x.id }); });
      vendors.forEach(x => { if (x && x.id) deletions.push({ collection: 'vendors', id: x.id }); });
      customerGroups.forEach(x => { if (x && x.id) deletions.push({ collection: 'customerGroups', id: x.id }); });
      vendorGroups.forEach(x => { if (x && x.id) deletions.push({ collection: 'vendorGroups', id: x.id }); });
      itemGroups.forEach(x => { if (x && x.id) deletions.push({ collection: 'itemGroups', id: x.id }); });

      if (deletions.length === 0) {
        return "Success: No database records found to erase.";
      }

      let totalDeleted = 0;
      for (const del of deletions) {
        try {
          await deleteDoc(doc(db, del.collection, del.id));
          totalDeleted++;
        } catch (err: any) {
          throw new Error(`Failed to delete ${del.collection}/${del.id}: ${err.message || err}`);
        }
      }

      return `Success: Erased all ${totalDeleted} database documents from Firestore.`;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'database/clear-all');
      throw err;
    }
  };

  const deleteWarehouse = async (code: string) => {
    try {
      await deleteDoc(doc(db, 'warehouses', code));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `warehouses/${code}`);
    }
  };

  // Create/Update Item Group
  const createOrUpdateItemGroup = async (group: ItemGroup) => {
    try {
      const id = group.id.toLowerCase().trim().replace(/\s+/g, '-');
      await setDoc(doc(db, 'itemGroups', id), { ...group, id });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `itemGroups/${group.id}`);
    }
  };

  const deleteItemGroup = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'itemGroups', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `itemGroups/${id}`);
    }
  };

  // Create/Update Customer Group
  const createOrUpdateCustomerGroup = async (group: CustomerGroup) => {
    try {
      const id = group.id.toLowerCase().trim().replace(/\s+/g, '-');
      await setDoc(doc(db, 'customerGroups', id), { ...group, id });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `customerGroups/${group.id}`);
    }
  };

  const deleteCustomerGroup = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'customerGroups', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `customerGroups/${id}`);
    }
  };

  // Create/Update Customer
  const createOrUpdateCustomer = async (cust: Customer) => {
    try {
      const id = cust.id.toUpperCase().trim().replace(/\s+/g, '-');
      await setDoc(doc(db, 'customers', id), { ...cust, id });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `customers/${cust.id}`);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `customers/${id}`);
    }
  };

  // Create/Update Vendor Group
  const createOrUpdateVendorGroup = async (group: VendorGroup) => {
    try {
      const id = group.id.toLowerCase().trim().replace(/\s+/g, '-');
      await setDoc(doc(db, 'vendorGroups', id), { ...group, id });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `vendorGroups/${group.id}`);
    }
  };

  const deleteVendorGroup = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vendorGroups', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `vendorGroups/${id}`);
    }
  };

  // Create/Update Vendor
  const createOrUpdateVendor = async (vend: Vendor) => {
    try {
      const id = vend.id.toUpperCase().trim().replace(/\s+/g, '-');
      await setDoc(doc(db, 'vendors', id), { ...vend, id });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `vendors/${vend.id}`);
    }
  };

  const deleteVendor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vendors', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `vendors/${id}`);
    }
  };

  // 4. Direct Manual Stock Adjustment
  const addDirectStockAdjustment = async (sku: string, warehouseCode: string, qtyDelta: number, bin: string, rack: string, reason: string) => {
    try {
      const stockId = `${sku}_${warehouseCode}`;
      const stockDocRef = doc(db, 'stocks', stockId);
      const stockSnap = await getDoc(stockDocRef);

      const batch = writeBatch(db);
      let prevPhysical = 0;
      let prevBooked = 0;

      if (stockSnap.exists()) {
        const data = stockSnap.data();
        prevPhysical = data.physicalQty;
        prevBooked = data.bookedQty;
      }

      const newPhysical = Math.max(0, prevPhysical + qtyDelta);

      // SOH validation: prevent negative physical quantity!
      batch.set(stockDocRef, {
        id: stockId,
        sku,
        warehouseCode,
        physicalQty: newPhysical,
        bookedQty: prevBooked,
        bin: bin || indexLocationString(st => st.bin) || 'BIN-GEN',
        rack: rack || indexLocationString(st => st.rack) || 'RACK-GEN',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Find item cost for ledger
      const itemSnap = await getDoc(doc(db, 'items', sku));
      const costAmount = itemSnap.exists() ? itemSnap.data().unitCost : 0;

      // Log movement ledger
      const moveId = `MOVE_ADJ_${Date.now()}_${sku}`;
      batch.set(doc(db, 'stockMovements', moveId), {
        id: moveId,
        sku,
        warehouseCode,
        movementType: 'Adjustment',
        referenceVoucher: `MANUAL_${reason.replace(/\s+/g, '_').toUpperCase()}`,
        quantityDelta: qtyDelta,
        cost: costAmount,
        userEmail: currentUser?.email || 'operator@alphalux.com',
        timestamp: new Date().toISOString()
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'stocks/adjustment');
    }
  };

  const indexLocationString = (fn: (s: Stock) => string) => {
    return stocks.find(s => s.bin || s.rack) ? fn(stocks.find(s => s.bin || s.rack)!) : '';
  };

  // 5. Create Sales Order (Order-to-Cash creation)
  // Increases Booked Qty for matched warehouse stocks
  const createSalesOrder = async (soData: Partial<SalesOrder>) => {
    try {
      const batch = writeBatch(db);
      const soId = `SO_${Date.now()}`;
      const soNumber = soData.soNumber || '';

      // Check Available stock first for validation
      for (const orderItem of soData.items || []) {
        const stockId = `${orderItem.sku}_${soData.targetWarehouseCode}`;
        const stockDocRef = doc(db, 'stocks', stockId);
        const stockSnap = await getDoc(stockDocRef);

        let physicalQty = 0;
        let bookedQty = 0;
        let bin = 'BIN-01A';
        let rack = 'RACK-01';

        if (stockSnap.exists()) {
          const s = stockSnap.data() as Stock;
          physicalQty = s.physicalQty;
          bookedQty = s.bookedQty;
          bin = s.bin;
          rack = s.rack;
        }

        const availableSoh = physicalQty - bookedQty;
        // Dynamic Lockouts standard guards
        if (availableSoh < orderItem.quantity) {
          // Unless it's system admin who has explicit bypass, block it immediately
          if (userProfile?.role !== 'admin') {
            throw new Error(`Insufficient Available Stock for SKU ${orderItem.sku}. Available SOH: ${availableSoh}, requested: ${orderItem.quantity}`);
          }
        }

        // Increase BookedQty
        batch.set(stockDocRef, {
          id: stockId,
          sku: orderItem.sku,
          warehouseCode: soData.targetWarehouseCode,
          physicalQty,
          bookedQty: bookedQty + orderItem.quantity,
          bin,
          rack,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // Generate picking instruction lists matching SO items
      const pickingList = (soData.items || []).map(item => {
        const stockMatch = stocks.find(s => s.sku === item.sku && s.warehouseCode === soData.targetWarehouseCode);
        return {
          sku: item.sku,
          bin: stockMatch?.bin || 'BIN-GEN',
          rack: stockMatch?.rack || 'RACK-GEN',
          quantityRequired: item.quantity,
          quantityPicked: 0,
          picked: false
        };
      });

      // Write sales order document
      batch.set(doc(db, 'salesOrders', soId), {
        id: soId,
        soNumber,
        customerId: soData.customerId,
        customerName: soData.customerName,
        customerGroupId: soData.customerGroupId,
        date: soData.date,
        targetWarehouseCode: soData.targetWarehouseCode,
        currency: soData.currency || 'USD',
        exchangeRate: soData.exchangeRate || 1.0,
        items: soData.items,
        status: 'Draft',
        totalAmount: soData.totalAmount,
        discountPercent: soData.discountPercent || 0,
        discountAmount: soData.discountAmount || 0,
        taxAmount: soData.taxAmount || 0,
        netAmount: soData.netAmount || 0,
        vatPercent: soData.vatPercent !== undefined ? soData.vatPercent : 11,
        additionalCost: soData.additionalCost !== undefined ? soData.additionalCost : 0,
        pickingList,
        createdAt: new Date().toISOString()
      });

      await batch.commit();
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      handleFirestoreError(err, OperationType.WRITE, 'salesOrders/new');
    }
  };

  const updateSalesOrder = async (id: string, updatedData: Partial<SalesOrder>) => {
    try {
      const soRef = doc(db, 'salesOrders', id);
      const soSnap = await getDoc(soRef);
      if (!soSnap.exists()) {
        throw new Error("Sales Order not found.");
      }
      const originalSo = soSnap.data() as SalesOrder;
      if (originalSo.status !== 'Draft') {
        throw new Error("Only Draft Sales Orders can be edited.");
      }

      const batch = writeBatch(db);

      // 1. Release previous booked quantities
      for (const item of originalSo.items) {
        const stockId = `${item.sku}_${originalSo.targetWarehouseCode}`;
        const stockRef = doc(db, 'stocks', stockId);
        const stockSnap = await getDoc(stockRef);
        if (stockSnap.exists()) {
          const s = stockSnap.data() as Stock;
          batch.set(stockRef, {
            bookedQty: Math.max(0, s.bookedQty - item.quantity),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      // 2. Validate and book new quantities
      const targetWarehouse = updatedData.targetWarehouseCode || originalSo.targetWarehouseCode;
      const newItems = updatedData.items || originalSo.items;

      for (const orderItem of newItems) {
        const stockId = `${orderItem.sku}_${targetWarehouse}`;
        const stockDocRef = doc(db, 'stocks', stockId);
        const stockSnap = await getDoc(stockDocRef);

        let physicalQty = 0;
        let bookedQty = 0;
        let bin = 'BIN-01A';
        let rack = 'RACK-01';

        if (stockSnap.exists()) {
          const s = stockSnap.data() as Stock;
          physicalQty = s.physicalQty;
          bookedQty = s.bookedQty;
          bin = s.bin;
          rack = s.rack;
        }

        // Simulate release of the sku item if it was in the original set
        const originalItem = originalSo.items.find(oi => oi.sku === orderItem.sku && originalSo.targetWarehouseCode === targetWarehouse);
        const originalQty = originalItem ? originalItem.quantity : 0;
        const adjustedBookedQty = Math.max(0, bookedQty - originalQty);
        const availableSoh = physicalQty - adjustedBookedQty;

        if (availableSoh < orderItem.quantity) {
          if (userProfile?.role !== 'admin') {
            throw new Error(`Insufficient Available Stock for SKU ${orderItem.sku}. Available SOH: ${availableSoh}, requested: ${orderItem.quantity}`);
          }
        }

        // Increase BookedQty
        batch.set(stockDocRef, {
          id: stockId,
          sku: orderItem.sku,
          warehouseCode: targetWarehouse,
          physicalQty,
          bookedQty: adjustedBookedQty + orderItem.quantity,
          bin,
          rack,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // 3. Re-generate picking details
      const pickingList = newItems.map(item => {
        const stockMatch = stocks.find(s => s.sku === item.sku && s.warehouseCode === targetWarehouse);
        return {
          sku: item.sku,
          bin: stockMatch?.bin || 'BIN-GEN',
          rack: stockMatch?.rack || 'RACK-GEN',
          quantityRequired: item.quantity,
          quantityPicked: 0,
          picked: false
        };
      });

      // 4. Update the SO document
      const docPayload = {
        customerId: updatedData.customerId || originalSo.customerId,
        customerName: updatedData.customerName || originalSo.customerName,
        customerGroupId: updatedData.customerGroupId || originalSo.customerGroupId,
        date: updatedData.date || originalSo.date,
        targetWarehouseCode: targetWarehouse,
        items: newItems,
        totalAmount: updatedData.totalAmount !== undefined ? updatedData.totalAmount : originalSo.totalAmount,
        discountPercent: updatedData.discountPercent !== undefined ? updatedData.discountPercent : originalSo.discountPercent,
        discountAmount: updatedData.discountAmount !== undefined ? updatedData.discountAmount : originalSo.discountAmount,
        taxAmount: updatedData.taxAmount !== undefined ? updatedData.taxAmount : originalSo.taxAmount,
        netAmount: updatedData.netAmount !== undefined ? updatedData.netAmount : originalSo.netAmount,
        vatPercent: updatedData.vatPercent !== undefined ? updatedData.vatPercent : (originalSo.vatPercent !== undefined ? originalSo.vatPercent : 11),
        additionalCost: updatedData.additionalCost !== undefined ? updatedData.additionalCost : (originalSo.additionalCost !== undefined ? originalSo.additionalCost : 0),
        pickingList,
        updatedAt: new Date().toISOString()
      };

      batch.update(soRef, docPayload);
      await batch.commit();
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      handleFirestoreError(err, OperationType.UPDATE, `salesOrders/edit/${id}`);
    }
  };

  // 6. Manage OTC milestone statuses
  const updateSalesOrderStatus = async (id: string, newStatus: SalesOrder['status'], extraData?: Partial<SalesOrder>) => {
    try {
      // Optimistic update of local state first to make the UI ultra-responsive!
      setSalesOrders(prev => prev.map(so => {
        if (so.id === id) {
          let targetStatus = newStatus;
          let targetPickingList = so.pickingList;
          if (newStatus === 'Invoiced') {
            const listToUse = so.pickingList || [];
            let hasLeftovers = false;
            targetPickingList = listToUse.map(p => {
              const leftover = Math.max(0, p.quantityRequired - (p.quantityPicked || 0));
              if (leftover > 0) {
                hasLeftovers = true;
              }
              return {
                ...p,
                quantityRequired: leftover,
                quantityPicked: 0,
                picked: leftover === 0
              };
            });
            targetStatus = hasLeftovers ? 'Picking' : 'FullyDelivered';
          }

          const updated = {
            ...so,
            status: targetStatus,
            pickingList: targetPickingList,
            updatedAt: new Date().toISOString(),
            ...extraData
          };
          if (newStatus === 'DeliveryApproval') {
            updated.deliveryApprovedBy = currentUser?.email || 'supervisor@alphalux.com';
          }
          return updated as SalesOrder;
        }
        return so;
      }));

      const soRef = doc(db, 'salesOrders', id);
      const soSnap = await getDoc(soRef);
      if (!soSnap.exists()) return;

      const so = soSnap.data() as SalesOrder;
      const batch = writeBatch(db);

      if (newStatus === 'Invoiced') {
        const pickingList = so.pickingList || [];
        
        let hasLeftovers = false;
        const updatedPickingList = pickingList.map(p => {
          const leftover = Math.max(0, p.quantityRequired - (p.quantityPicked || 0));
          if (leftover > 0) {
            hasLeftovers = true;
          }
          return {
            ...p,
            quantityRequired: leftover,
            quantityPicked: 0,
            picked: leftover === 0
          };
        });

        const deliveryItems: DeliveryItem[] = [];
        for (const item of so.items) {
          const pickObj = pickingList.find(p => p.sku === item.sku);
          const qtyDelivered = pickObj ? (pickObj.quantityPicked || 0) : 0;
          if (qtyDelivered > 0) {
            deliveryItems.push({
              sku: item.sku,
              name: item.name || 'Order Item',
              quantityDelivered: qtyDelivered
            });

            // Depleted stock
            const stockId = `${item.sku}_${so.targetWarehouseCode}`;
            const stockRef = doc(db, 'stocks', stockId);
            const stockSnap = await getDoc(stockRef);

            if (stockSnap.exists()) {
              const stObj = stockSnap.data();
              const prevPhys = stObj.physicalQty || 0;
              const prevBooked = stObj.bookedQty || 0;

              batch.set(stockRef, {
                physicalQty: Math.max(0, prevPhys - qtyDelivered),
                bookedQty: Math.max(0, prevBooked - qtyDelivered),
                updatedAt: new Date().toISOString()
              }, { merge: true });

              const moveId = `MOVE_SO_${Date.now()}_${item.sku}`;
              const itSnap = await getDoc(doc(db, 'items', item.sku));
              const costVal = itSnap.exists() ? itSnap.data().unitCost : 0;

              batch.set(doc(db, 'stockMovements', moveId), {
                id: moveId,
                sku: item.sku,
                warehouseCode: so.targetWarehouseCode,
                movementType: 'Outbound',
                referenceVoucher: so.soNumber,
                quantityDelta: -qtyDelivered,
                cost: costVal,
                userEmail: currentUser?.email || 'shipper@alphalux.com',
                timestamp: new Date().toISOString()
              });
            }
          }
        }

        const deliveryId = `DL_${Date.now()}`;
        const suffix = String(Date.now()).slice(-4);
        const dlNumStr = `DL-${so.soNumber.substring(3)}-${suffix}`;

        batch.set(doc(db, 'deliveries', deliveryId), {
          id: deliveryId,
          deliveryNumber: dlNumStr,
          salesOrderId: so.id,
          salesOrderNumber: so.soNumber,
          customerId: so.customerId,
          customerName: so.customerName,
          items: deliveryItems,
          deliveredBy: currentUser?.email || 'supervisor@alphalux.com',
          deliveredAt: new Date().toISOString(),
          status: 'Uninvoiced'
        });

        const nextStatus = hasLeftovers ? 'Picking' : 'FullyDelivered';
        batch.update(soRef, {
          status: nextStatus,
          pickingList: updatedPickingList,
          updatedAt: new Date().toISOString(),
          ...extraData
        });
      } else if (newStatus === 'DeliveryApproval') {
        // Lock picked item layout and record supervisor profile validation
        batch.update(soRef, {
          status: 'DeliveryApproval',
          deliveryApprovedBy: currentUser?.email || 'supervisor@alphalux.com',
          updatedAt: new Date().toISOString(),
          ...extraData
        });
      } else {
        batch.update(soRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          ...extraData
        });
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `salesOrders/${id}`);
    }
  };

  const createInvoice = async (invoiceData: Partial<Invoice>) => {
    try {
      const invoiceId = `INV_${Date.now()}`;
      const payload: Invoice = {
        id: invoiceId,
        invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
        customerId: invoiceData.customerId || '',
        customerName: invoiceData.customerName || '',
        deliveryIds: invoiceData.deliveryIds || [],
        items: invoiceData.items || [],
        totalAmount: invoiceData.totalAmount || 0,
        discountPercent: invoiceData.discountPercent || 0,
        discountAmount: invoiceData.discountAmount || 0,
        taxAmount: invoiceData.taxAmount || 0,
        netAmount: invoiceData.netAmount || 0,
        status: 'Unpaid',
        createdAt: new Date().toISOString(),
        salesOrderId: invoiceData.salesOrderId || '',
        salesOrderNumber: invoiceData.salesOrderNumber || ''
      };

      const batch = writeBatch(db);

      batch.set(doc(db, 'invoices', invoiceId), payload);

      for (const dlId of payload.deliveryIds) {
        batch.update(doc(db, 'deliveries', dlId), {
          status: 'Invoiced',
          invoiceId: invoiceId
        });
      }

      if (payload.salesOrderId) {
        const orderDeliveries = deliveries.filter(d => d.salesOrderId === payload.salesOrderId);
        const uninvoicedCount = orderDeliveries.filter(d => d.status === 'Uninvoiced' && !payload.deliveryIds.includes(d.id)).length;

        const soRef = doc(db, 'salesOrders', payload.salesOrderId);
        const soSnap = await getDoc(soRef);
        if (soSnap.exists()) {
          const so = soSnap.data() as SalesOrder;
          // A Sales Order can only become 'Invoiced' if everything has been fully delivered (there are no leftovers)
          if (uninvoicedCount === 0 && so.status === 'FullyDelivered') {
            batch.update(soRef, {
              status: 'Invoiced',
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'invoices');
    }
  };

  const payInvoice = async (invoiceId: string) => {
    try {
      const batch = writeBatch(db);
      const invRef = doc(db, 'invoices', invoiceId);
      const invSnap = await getDoc(invRef);
      if (!invSnap.exists()) return;
      const inv = invSnap.data() as Invoice;

      batch.update(invRef, {
        status: 'Paid',
        paidAt: new Date().toISOString()
      });

      if (inv.salesOrderId) {
        const otherInvoices = invoices.filter(i => i.salesOrderId === inv.salesOrderId && i.id !== invoiceId);
        const allOthersPaid = otherInvoices.every(i => i.status === 'Paid');

        if (allOthersPaid) {
          const soRef = doc(db, 'salesOrders', inv.salesOrderId);
          const soSnap = await getDoc(soRef);
          if (soSnap.exists()) {
            const so = soSnap.data() as SalesOrder;
            // Only transition the Sales Order to 'Paid' if it was fully invoiced (status 'Invoiced')
            if (so.status === 'Invoiced') {
              batch.update(soRef, {
                status: 'Paid',
                updatedAt: new Date().toISOString()
              });
            }
          }
        }
      }

      // Also create a mirroring payment document for tracking trace audit log
      const paymentId = `PAY_${Date.now()}`;
      const paymentPayload: PaymentItem = {
        id: paymentId,
        paymentNumber: `PAY-${String(Date.now()).slice(-6)}`,
        customerId: inv.customerId,
        customerName: inv.customerName,
        invoiceIds: [invoiceId],
        invoiceNumbers: [inv.invoiceNumber],
        totalPaid: inv.netAmount,
        paymentMethod: 'Bank Transfer',
        referenceNumber: 'AUTO-DIRECT_PAY',
        paidAt: new Date().toISOString(),
        capturedBy: currentUser?.email || 'cashier@alphalux.com',
        notes: `Direct quick payment of invoice ${inv.invoiceNumber}`
      };
      batch.set(doc(db, 'payments', paymentId), paymentPayload);

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${invoiceId}`);
    }
  };

  const createPayment = async (paymentData: Partial<PaymentItem>) => {
    try {
      const paymentId = `PAY_${Date.now()}`;
      const payload: PaymentItem = {
        id: paymentId,
        paymentNumber: paymentData.paymentNumber || `PAY-${String(Date.now()).slice(-6)}`,
        customerId: paymentData.customerId || '',
        customerName: paymentData.customerName || '',
        invoiceIds: paymentData.invoiceIds || [],
        invoiceNumbers: paymentData.invoiceNumbers || [],
        totalPaid: paymentData.totalPaid || 0,
        paymentMethod: paymentData.paymentMethod || 'Bank Transfer',
        referenceNumber: paymentData.referenceNumber || '',
        paidAt: new Date().toISOString(),
        capturedBy: currentUser?.email || 'cashier@alphalux.com',
        notes: paymentData.notes || ''
      };

      const batch = writeBatch(db);

      // Save payment
      batch.set(doc(db, 'payments', paymentId), payload);

      // Update invoices status to Paid
      for (const invId of payload.invoiceIds) {
        batch.update(doc(db, 'invoices', invId), {
          status: 'Paid',
          paidAt: payload.paidAt
        });
      }

      // Check and update Sales Orders status
      const affectedOrderIds = new Set<string>();
      for (const invId of payload.invoiceIds) {
        const inv = invoices.find(i => i.id === invId);
        if (inv && inv.salesOrderId) {
          affectedOrderIds.add(inv.salesOrderId);
        }
      }

      for (const soId of affectedOrderIds) {
        const orderInvoices = invoices.filter(i => i.salesOrderId === soId);
        const allInvoicesPaid = orderInvoices.every(i => 
          payload.invoiceIds.includes(i.id) || i.status === 'Paid'
        );

        if (allInvoicesPaid) {
          const soRef = doc(db, 'salesOrders', soId);
          const soSnap = await getDoc(soRef);
          if (soSnap.exists()) {
            const so = soSnap.data() as SalesOrder;
            // Only transition the Sales Order to 'Paid' if it was fully invoiced (status 'Invoiced')
            if (so.status === 'Invoiced') {
              batch.update(soRef, {
                status: 'Paid',
                updatedAt: payload.paidAt
              });
            }
          }
        }
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'payments');
    }
  };

  // 7. Create Purchase Order (Procure-to-Pay creation)
  const createPurchaseOrder = async (poData: Partial<PurchaseOrder>) => {
    try {
      const poId = `PO_${Date.now()}`;
      const payload: PurchaseOrder = {
        id: poId,
        poNumber: poData.poNumber || '',
        vendorId: poData.vendorId || '',
        vendorName: poData.vendorName || '',
        date: poData.date || new Date().toISOString().split('T')[0],
        currency: poData.currency || 'USD',
        exchangeRate: poData.exchangeRate || 1.0,
        items: poData.items || [],
        status: 'Draft',
        totalAmount: poData.totalAmount || 0,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'purchaseOrders', poId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'purchaseOrders/new');
    }
  };

  const updatePurchaseOrder = async (id: string, updatedData: Partial<PurchaseOrder>) => {
    try {
      const poRef = doc(db, 'purchaseOrders', id);
      await updateDoc(poRef, updatedData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `purchaseOrders/${id}`);
    }
  };

  // 8. Manage Procure-to-Pay workflow approvals & Receipt Audit entries
  const updatePurchaseOrderStatus = async (id: string, newStatus: PurchaseOrder['status'], receiptItems?: any[]) => {
    try {
      const poRef = doc(db, 'purchaseOrders', id);
      const poSnap = await getDoc(poRef);
      if (!poSnap.exists()) return;

      const po = poSnap.data() as PurchaseOrder;
      const batch = writeBatch(db);

      if (newStatus === 'Approved') {
        // Physical entry: After receiving is fully validated, update item stocks and record movement
        const actualItems = receiptItems || po.receiptItems || [];

        for (const item of actualItems) {
          // Standard inward arrival into primary selected warehouse
          // We default arrivals to the headquarter warehouse, since WH details are mapped
          const selectedWarehouse = 'WH-MUT-01'; // Default target receiver
          const stockId = `${item.sku}_${selectedWarehouse}`;
          const stockRef = doc(db, 'stocks', stockId);
          const stockSnap = await getDoc(stockRef);

          let prevPhysical = 0;
          let prevBooked = 0;
          let bin = 'BIN-10R';
          let rack = 'RACK-02';

          if (stockSnap.exists()) {
            const data = stockSnap.data();
            prevPhysical = data.physicalQty;
            prevBooked = data.bookedQty;
            bin = data.bin;
            rack = data.rack;
          }

          const acceptedQty = Number(item.quantityAccepted || 0);

          // Update physical inventory
          batch.set(stockRef, {
            id: stockId,
            sku: item.sku,
            warehouseCode: selectedWarehouse,
            physicalQty: prevPhysical + acceptedQty,
            bookedQty: prevBooked,
            bin,
            rack,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          // Record historical trace ledger
          if (acceptedQty > 0) {
            const moveId = `MOVE_PO_${Date.now()}_${item.sku}`;
            const matchingItem = po.items.find((i: any) => i.sku === item.sku);
            const unitCost = matchingItem ? matchingItem.cost : 0;

            batch.set(doc(db, 'stockMovements', moveId), {
              id: moveId,
              sku: item.sku,
              warehouseCode: selectedWarehouse,
              movementType: 'Inbound',
              referenceVoucher: po.poNumber,
              quantityDelta: acceptedQty,
              cost: unitCost,
              userEmail: currentUser?.email || 'receiver@alphalux.com',
              timestamp: new Date().toISOString()
            });

            // Update item master unitCost to dynamically capture the last purchase cost
            if (unitCost > 0) {
              const usdCost = po.currency === 'IDR' ? unitCost / 16000 : unitCost;
              const idrCost = usdCost * 16000;
              batch.update(doc(db, 'items', item.sku), {
                unitCost: usdCost,
                sellingPrice: idrCost,
                updatedAt: new Date().toISOString()
              });
            }
          }
        }

        batch.update(poRef, {
          status: 'Approved',
          receiptItems: actualItems,
          updatedAt: new Date().toISOString()
        });
      } else if (newStatus === 'ReceiptAudit' && receiptItems) {
        // Calculate dynamic checking triggers: check if there are discrepancies
        let hasDiscrepancy = false;
        receiptItems.forEach(ri => {
          if (ri.quantityAccepted !== ri.quantityExpected || ri.quantityDamaged > 0 || ri.quantityIncorrectSKU > 0) {
            hasDiscrepancy = true;
          }
        });

        if (hasDiscrepancy) {
          batch.update(poRef, {
            status: 'Discrepancy',
            receiptItems,
            updatedAt: new Date().toISOString()
          });
        } else {
          // No discrepancy: Auto-approve and inward directly to stock
          for (const item of receiptItems) {
            const selectedWarehouse = 'WH-MUT-01'; // Default target receiver
            const stockId = `${item.sku}_${selectedWarehouse}`;
            const stockRef = doc(db, 'stocks', stockId);
            const stockSnap = await getDoc(stockRef);

            let prevPhysical = 0;
            let prevBooked = 0;
            let bin = 'BIN-10R';
            let rack = 'RACK-02';

            if (stockSnap.exists()) {
              const data = stockSnap.data();
              prevPhysical = data.physicalQty;
              prevBooked = data.bookedQty;
              bin = data.bin;
              rack = data.rack;
            }

            const acceptedQty = Number(item.quantityAccepted || 0);

            // Update physical inventory
            batch.set(stockRef, {
              id: stockId,
              sku: item.sku,
              warehouseCode: selectedWarehouse,
              physicalQty: prevPhysical + acceptedQty,
              bookedQty: prevBooked,
              bin,
              rack,
              updatedAt: new Date().toISOString()
            }, { merge: true });

            // Record historical trace ledger
            if (acceptedQty > 0) {
              const moveId = `MOVE_PO_${Date.now()}_${item.sku}`;
              const matchingItem = po.items.find((i: any) => i.sku === item.sku);
              const unitCost = matchingItem ? matchingItem.cost : 0;

              batch.set(doc(db, 'stockMovements', moveId), {
                id: moveId,
                sku: item.sku,
                warehouseCode: selectedWarehouse,
                movementType: 'Inbound',
                referenceVoucher: po.poNumber,
                quantityDelta: acceptedQty,
                cost: unitCost,
                userEmail: currentUser?.email || 'receiver@alphalux.com',
                timestamp: new Date().toISOString()
              });

              // Update item master unitCost to dynamically capture the last purchase cost
              if (unitCost > 0) {
                const usdCost = po.currency === 'IDR' ? unitCost / 16000 : unitCost;
                const idrCost = usdCost * 16000;
                batch.update(doc(db, 'items', item.sku), {
                  unitCost: usdCost,
                  sellingPrice: idrCost,
                  updatedAt: new Date().toISOString()
                });
              }
            }
          }

          batch.update(poRef, {
            status: 'Approved',
            receiptItems,
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        batch.update(poRef, {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `purchaseOrders/${id}`);
    }
  };

  // 9. Component Cannibalization Execution
  const executeCannibalization = async (
    parentItem: string,         // e.g. "Sepeda" (SKU)
    qty: number,                // e.g. 1
    componentItem: string,      // e.g. "Roda" (SKU)
    componentQty: number,       // e.g. 2
    fromWhse: string,           // e.g. "WH-MUT-01" (code)
    toWhse: string,             // e.g. "WH-CANNIBAL" (code)
    description?: string
  ) => {
    try {
      const batch = writeBatch(db);
      const canniId = `CAN_${Date.now()}`;

      // 1. VALIDATE: Check if Parent_Item exists in From_Whse with sufficient Qty.
      const fromParentStockId = `${parentItem}_${fromWhse}`;
      const fromParentStockRef = doc(db, 'stocks', fromParentStockId);
      const fromParentSnap = await getDoc(fromParentStockRef);

      if (!fromParentSnap.exists() || fromParentSnap.data().physicalQty < qty) {
        throw new Error(`Stok item induk ("${parentItem}") di gudang asal ("${fromWhse}") tidak mencukupi.`);
      }

      const prevFromParentData = fromParentSnap.data() as Stock;

      // 2. EXECUTE TRANSFER (Adjustment Style):
      // - From_Whse (Main): Decrease Parent_Item Qty by qty
      batch.update(fromParentStockRef, {
        physicalQty: Math.max(0, prevFromParentData.physicalQty - qty),
        updatedAt: new Date().toISOString()
      });

      // - To_Whse (Cannibal): Increase Parent_Item Qty by qty
      const toParentStockId = `${parentItem}_${toWhse}`;
      const toParentStockRef = doc(db, 'stocks', toParentStockId);
      const toParentSnap = await getDoc(toParentStockRef);

      let prevToParentPhys = 0;
      let prevToParentBooked = 0;
      if (toParentSnap.exists()) {
        const toParentData = toParentSnap.data() as Stock;
        prevToParentPhys = toParentData.physicalQty;
        prevToParentBooked = toParentData.bookedQty;
      }
      batch.set(toParentStockRef, {
        id: toParentStockId,
        sku: parentItem,
        warehouseCode: toWhse,
        physicalQty: prevToParentPhys + qty,
        bookedQty: prevToParentBooked,
        bin: toParentSnap.exists() ? (toParentSnap.data().bin || 'BIN-SALVAGE') : 'BIN-SALVAGE',
        rack: toParentSnap.exists() ? (toParentSnap.data().rack || 'RACK-SALVAGE') : 'RACK-SALVAGE',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. EXECUTE OUTPUT GENERATION:
      // - From_Whse (Main): Increase Component_Item Qty by Component_Qty
      const fromComponentStockId = `${componentItem}_${fromWhse}`;
      const fromComponentStockRef = doc(db, 'stocks', fromComponentStockId);
      const fromComponentSnap = await getDoc(fromComponentStockRef);

      let prevFromCompPhys = 0;
      let prevFromCompBooked = 0;
      if (fromComponentSnap.exists()) {
        const fromCompData = fromComponentSnap.data() as Stock;
        prevFromCompPhys = fromCompData.physicalQty;
        prevFromCompBooked = fromCompData.bookedQty;
      }
      batch.set(fromComponentStockRef, {
        id: fromComponentStockId,
        sku: componentItem,
        warehouseCode: fromWhse,
        physicalQty: prevFromCompPhys + componentQty,
        bookedQty: prevFromCompBooked,
        bin: fromComponentSnap.exists() ? (fromComponentSnap.data().bin || 'BIN-SALVAGE') : 'BIN-SALVAGE',
        rack: fromComponentSnap.exists() ? (fromComponentSnap.data().rack || 'RACK-SALVAGE') : 'RACK-SALVAGE',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Get item costs for stockMovement logging
      const parentItemSnap = await getDoc(doc(db, 'items', parentItem));
      const parentCost = parentItemSnap.exists() ? parentItemSnap.data().unitCost : 0;

      const compItemSnap = await getDoc(doc(db, 'items', componentItem));
      const compCost = compItemSnap.exists() ? compItemSnap.data().unitCost : 0;

      // Log Stock Movements for Tracking
      // Outbound for master from Main
      const masterMoveOutId = `MOVE_CAN_OUT_${Date.now()}_${parentItem}`;
      batch.set(doc(db, 'stockMovements', masterMoveOutId), {
        id: masterMoveOutId,
        sku: parentItem,
        warehouseCode: fromWhse,
        movementType: 'Cannibalization',
        referenceVoucher: canniId,
        quantityDelta: -qty,
        cost: parentCost,
        userEmail: currentUser?.email || 'operator@alphalux.com',
        timestamp: new Date().toISOString()
      });

      // Inbound for master to Cannibal
      const masterMoveInId = `MOVE_CAN_IN_${Date.now()}_${parentItem}`;
      batch.set(doc(db, 'stockMovements', masterMoveInId), {
        id: masterMoveInId,
        sku: parentItem,
        warehouseCode: toWhse,
        movementType: 'Cannibalization',
        referenceVoucher: canniId,
        quantityDelta: qty,
        cost: parentCost,
        userEmail: currentUser?.email || 'operator@alphalux.com',
        timestamp: new Date().toISOString()
      });

      // Inbound for component to Main
      const compMoveInId = `MOVE_CAN_COMP_IN_${Date.now()}_${componentItem}`;
      batch.set(doc(db, 'stockMovements', compMoveInId), {
        id: compMoveInId,
        sku: componentItem,
        warehouseCode: fromWhse,
        movementType: 'Cannibalization',
        referenceVoucher: canniId,
        quantityDelta: componentQty,
        cost: compCost,
        userEmail: currentUser?.email || 'operator@alphalux.com',
        timestamp: new Date().toISOString()
      });

      // 4. POSTING: Create a linked Cannibalization Journal
      batch.set(doc(db, 'cannibalizations', canniId), {
        id: canniId,
        masterSku: parentItem,
        disassembledQty: qty,
        componentSku: componentItem,
        componentQty: componentQty,
        fromWarehouse: fromWhse,
        toWarehouse: toWhse,
        status: 'Active',
        description: description || '',
        userEmail: currentUser?.email || 'operator@alphalux.com',
        timestamp: new Date().toISOString()
      });

      await batch.commit();
    } catch (err) {
      if (err instanceof Error) throw err;
      handleFirestoreError(err, OperationType.WRITE, 'cannibalizations/new');
    }
  };

  const restoreCannibalization = async (journalId: string) => {
    try {
      const journalRef = doc(db, 'cannibalizations', journalId);
      const journalSnap = await getDoc(journalRef);
      if (!journalSnap.exists()) {
        throw new Error(`Cannibalization journal ${journalId} not found.`);
      }

      const journalData = journalSnap.data() as Cannibalization;
      if (journalData.status === 'Restored') {
        throw new Error(`Journal ${journalId} is already Restored.`);
      }

      const { masterSku, disassembledQty, componentSku, componentQty, fromWarehouse, toWarehouse } = journalData;

      // 1. VALIDATE STOCK AVAILABILITY:
      // - Component_Item in From_Whse (Main) < Component_Qty
      const fromComponentStockId = `${componentSku}_${fromWarehouse}`;
      const fromComponentStockRef = doc(db, 'stocks', fromComponentStockId);
      const fromCompSnap = await getDoc(fromComponentStockRef);

      if (!fromCompSnap.exists() || fromCompSnap.data().physicalQty < componentQty) {
        throw new Error(`Stock komponen tidak mencukupi untuk restorasi. Dibutuhkan: ${componentQty}, Tersedia: ${fromCompSnap.exists() ? fromCompSnap.data().physicalQty : 0}.`);
      }

      // - Parent_Item in To_Whse (Cannibal) < disassembledQty
      const toParentStockId = `${masterSku}_${toWarehouse}`;
      const toParentStockRef = doc(db, 'stocks', toParentStockId);
      const toParentSnap = await getDoc(toParentStockRef);

      if (!toParentSnap.exists() || toParentSnap.data().physicalQty < disassembledQty) {
        throw new Error("Unit kanibal tidak ditemukan.");
      }

      const batch = writeBatch(db);

      // 2. EXECUTE REVERSAL:
      // - From_Whse (Main): Decrease Component_Item Qty by Component_Qty
      const prevCompData = fromCompSnap.data() as Stock;
      batch.update(fromComponentStockRef, {
        physicalQty: Math.max(0, prevCompData.physicalQty - componentQty),
        updatedAt: new Date().toISOString()
      });

      // - To_Whse (Cannibal): Decrease Parent_Item Qty by disassembledQty
      const prevToParentData = toParentSnap.data() as Stock;
      batch.update(toParentStockRef, {
        physicalQty: Math.max(0, prevToParentData.physicalQty - disassembledQty),
        updatedAt: new Date().toISOString()
      });

      // - From_Whse (Main): Increase Parent_Item Qty by disassembledQty
      const fromParentStockId = `${masterSku}_${fromWarehouse}`;
      const fromParentStockRef = doc(db, 'stocks', fromParentStockId);
      const fromParentSnap = await getDoc(fromParentStockRef);

      let prevFromParentPhys = 0;
      let prevFromParentBooked = 0;
      if (fromParentSnap.exists()) {
        const fromParentData = fromParentSnap.data() as Stock;
        prevFromParentPhys = fromParentData.physicalQty;
        prevFromParentBooked = fromParentData.bookedQty;
      }
      batch.set(fromParentStockRef, {
        id: fromParentStockId,
        sku: masterSku,
        warehouseCode: fromWarehouse,
        physicalQty: prevFromParentPhys + disassembledQty,
        bookedQty: prevFromParentBooked,
        bin: fromParentSnap.exists() ? (fromParentSnap.data().bin || 'BIN-GEN') : 'BIN-GEN',
        rack: fromParentSnap.exists() ? (fromParentSnap.data().rack || 'RACK-GEN') : 'RACK-GEN',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Costs for stockMovement logs
      const parentItemSnap = await getDoc(doc(db, 'items', masterSku));
      const parentCost = parentItemSnap.exists() ? parentItemSnap.data().unitCost : 0;

      const compItemSnap = await getDoc(doc(db, 'items', componentSku));
      const compCost = compItemSnap.exists() ? compItemSnap.data().unitCost : 0;

      // Log Stock Movements for Reversal
      const compMoveOutId = `MOVE_CAN_REV_COMP_OUT_${Date.now()}_${componentSku}`;
      batch.set(doc(db, 'stockMovements', compMoveOutId), {
        id: compMoveOutId,
        sku: componentSku,
        warehouseCode: fromWarehouse,
        movementType: 'Cannibalization',
        referenceVoucher: `REV_${journalId}`,
        quantityDelta: -componentQty,
        cost: compCost,
        userEmail: currentUser?.email || 'operator@alphalux.com',
        timestamp: new Date().toISOString()
      });

      const parentMoveOutId = `MOVE_CAN_REV_PARENT_OUT_${Date.now()}_${masterSku}`;
      batch.set(doc(db, 'stockMovements', parentMoveOutId), {
        id: parentMoveOutId,
        sku: masterSku,
        warehouseCode: toWarehouse,
        movementType: 'Cannibalization',
        referenceVoucher: `REV_${journalId}`,
        quantityDelta: -disassembledQty,
        cost: parentCost,
        userEmail: currentUser?.email || 'operator@alphalux.com',
        timestamp: new Date().toISOString()
      });

      const parentMoveInId = `MOVE_CAN_REV_PARENT_IN_${Date.now()}_${masterSku}`;
      batch.set(doc(db, 'stockMovements', parentMoveInId), {
        id: parentMoveInId,
        sku: masterSku,
        warehouseCode: fromWarehouse,
        movementType: 'Cannibalization',
        referenceVoucher: `REV_${journalId}`,
        quantityDelta: disassembledQty,
        cost: parentCost,
        userEmail: currentUser?.email || 'operator@alphalux.com',
        timestamp: new Date().toISOString()
      });

      // 3. POSTING: Close/Update Cannibalization status to "Restored"
      batch.update(journalRef, {
        status: 'Restored',
        updatedAt: new Date().toISOString()
      });

      await batch.commit();
    } catch (err) {
      if (err instanceof Error) throw err;
      handleFirestoreError(err, OperationType.WRITE, `cannibalizations/restore/${journalId}`);
    }
  };

  // 10. Stock Opname Audit Setup & Final Balancing Loops
  const createStockOpname = async (warehouseCode: string, segmentName: string, itemsToAudit: any[]) => {
    try {
      const opnameId = `OPN_${Date.now()}`;
      const payload: StockOpname = {
        id: opnameId,
        warehouseCode,
        segmentName,
        status: 'Lockdown',
        itemsAudited: itemsToAudit.map(item => {
          const systemQty = item.systemQty;
          const physicalQty = item.physicalQty || systemQty; // Default to matching
          const discrepancyQty = physicalQty - systemQty;
          const discrepancyPct = systemQty > 0 ? (discrepancyQty / systemQty) * 100 : 0;
          return {
            sku: item.sku,
            systemQty,
            physicalQty,
            discrepancyQty,
            discrepancyPct,
            reason: item.reason || 'Routine Verification'
          };
        }),
        checkedBy: currentUser?.email || 'auditor@alphalux.com',
        timestamp: new Date().toISOString()
      };
      await setDoc(doc(db, 'stockOpnames', opnameId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'stockOpnames/new');
    }
  };

  const approveStockOpname = async (id: string, lossGainDesc: string) => {
    try {
      const opRef = doc(db, 'stockOpnames', id);
      const opSnap = await getDoc(opRef);
      if (!opSnap.exists()) return;

      const op = opSnap.data() as StockOpname;
      const batch = writeBatch(db);

      // Perform auto-balancing logic upon supervisor confirmation
      for (const item of op.itemsAudited) {
        const stockId = `${item.sku}_${op.warehouseCode}`;
        const stockRef = doc(db, 'stocks', stockId);
        const stockSnap = await getDoc(stockRef);

        let prevPhys = 0;
        let prevBooked = 0;
        let bin = 'BIN-A1';
        let rack = 'RACK-01';

        if (stockSnap.exists()) {
          const data = stockSnap.data();
          prevPhys = data.physicalQty;
          prevBooked = data.bookedQty;
          bin = data.bin;
          rack = data.rack;
        }

        const discrepancyQty = Number(item.physicalQty) - prevPhys;

        // Rectify physical ledger balances
        batch.set(stockRef, {
          id: stockId,
          sku: item.sku,
          warehouseCode: op.warehouseCode,
          physicalQty: Number(item.physicalQty),
          bookedQty: prevBooked,
          bin,
          rack,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Record adjustment movement logs if there represents discrepancy
        if (discrepancyQty !== 0) {
          const moveId = `MOVE_OP_BAL_${Date.now()}_${item.sku}`;
          const itSnap = await getDoc(doc(db, 'items', item.sku));
          const unitCost = itSnap.exists() ? itSnap.data().unitCost : 0;

          batch.set(doc(db, 'stockMovements', moveId), {
            id: moveId,
            sku: item.sku,
            warehouseCode: op.warehouseCode,
            movementType: 'Opname',
            referenceVoucher: `BAL_LOCK_${op.id}`,
            quantityDelta: discrepancyQty,
            cost: unitCost,
            userEmail: currentUser?.email || 'manager@alphalux.com',
            timestamp: new Date().toISOString()
          });
        }
      }

      batch.update(opRef, {
        status: 'Approved',
        lossGainDescription: lossGainDesc,
        approvedBy: currentUser?.email || 'manager@alphalux.com',
        timestamp: new Date().toISOString()
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `stockOpnames/${id}`);
    }
  };

  return (
    <WmsContext.Provider value={{
      currentUser,
      userProfile,
      loadingAuth,
      loginWithGoogle,
      loginAnonymouslyWithRole,
      logout,
      setUserProfileRole,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
      
      currencies,
      itemGroups,
      customerGroups,
      customers,
      vendors,
      vendorGroups,
      warehouses,
      items,
      stocks,
      salesOrders,
      purchaseOrders,
      stockMovements,
      cannibalizations,
      stockOpnames,
      deliveries,
      invoices,
      payments,

      selectedCurrency,
      setSelectedCurrency,
      changeCurrency,
      stockAlerts,

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
      addDirectStockAdjustment,
      createSalesOrder,
      updateSalesOrder,
      updateSalesOrderStatus,
      createPurchaseOrder,
      updatePurchaseOrder,
      updatePurchaseOrderStatus,
      executeCannibalization,
      restoreCannibalization,
      createStockOpname,
      approveStockOpname,
      createInvoice,
      payInvoice,
      createPayment,

      // Roles & Seats bindings
      customRoles,
      emailRoles,
      createOrUpdateCustomRole,
      deleteCustomRole,
      createOrUpdateEmailRole,
      deleteEmailRole
    }}>
      {children}
    </WmsContext.Provider>
  );
};

export const useWms = () => {
  const context = useContext(WmsContext);
  if (context === undefined) {
    throw new Error('useWms must be used inside a WmsProvider');
  }
  return context;
};
