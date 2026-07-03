import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import config from './firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(config);
const auth = getAuth(app);
const db = config.firestoreDatabaseId 
  ? getFirestore(app, config.firestoreDatabaseId) 
  : getFirestore(app);

// Simple RFC 4180-compliant CSV parser
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

async function main() {
  console.log("Reading CSV file...");
  const csvPath = path.join(__dirname, 'item_master_template_with_vendor.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: File not found at ${csvPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvText);
  if (rows.length <= 1) {
    console.error("Error: CSV must contain header and at least one data row.");
    process.exit(1);
  }

  const headers = rows[0].map(h => h.trim().toLowerCase());
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

  console.log(`Authenticating with Firebase anonymously...`);
  await signInAnonymously(auth);
  console.log("Authenticated successfully!");

  const uniqueGroups = new Set<string>();
  const uniqueVendors = new Set<string>();
  const items: any[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(cell => cell === '')) continue;

    const sku = (skuIdx !== -1 && skuIdx < row.length ? row[skuIdx] : '').trim().toUpperCase();
    const name = nameIdx !== -1 && nameIdx < row.length ? row[nameIdx].trim() : '';
    const groupId = groupIdIdx !== -1 && groupIdIdx < row.length ? row[groupIdIdx].trim() : '';
    const rawUnitCost = unitCostIdx !== -1 && unitCostIdx < row.length ? row[unitCostIdx] : '0';
    const rawSellingPrice = sellingPriceIdx !== -1 && sellingPriceIdx < row.length ? row[sellingPriceIdx] : '0';
    const rawMinStock = minStockIdx !== -1 && minStockIdx < row.length ? row[minStockIdx] : '0';
    const description = descIdx !== -1 && descIdx < row.length ? row[descIdx].trim() : '';
    const imageUrl = imageIdx !== -1 && imageIdx < row.length ? row[imageIdx].trim() : '';
    const vendorCode = vendorCodeIdx !== -1 && vendorCodeIdx < row.length ? row[vendorCodeIdx].trim() : '';
    const itemVendorCode = itemVendorCodeIdx !== -1 && itemVendorCodeIdx < row.length ? row[itemVendorCodeIdx].trim() : '';
    const rawBuyPrice = buyPriceIdx !== -1 && buyPriceIdx < row.length ? row[buyPriceIdx] : '';
    const buyCurrency = buyCurrencyIdx !== -1 && buyCurrencyIdx < row.length ? row[buyCurrencyIdx].trim() : 'USD';

    if (!sku || sku.length < 3) continue;

    const unitCost = Number(rawUnitCost.replace(/,/g, '')) || 0;
    const sellingPrice = Number(rawSellingPrice.replace(/,/g, '')) || 0;
    const minStock = Number(rawMinStock.replace(/,/g, '')) || 0;
    const buyPrice = rawBuyPrice ? (Number(rawBuyPrice.replace(/,/g, '')) || 0) : undefined;

    if (groupId) uniqueGroups.add(groupId);
    if (vendorCode) uniqueVendors.add(vendorCode);

    items.push({
      sku,
      name,
      groupId,
      unitCost,
      sellingPrice,
      minStock,
      description,
      imageUrl: imageUrl || undefined,
      vendorCode: vendorCode || undefined,
      itemVendorCode: itemVendorCode || undefined,
      buyPrice,
      buyCurrency: vendorCode ? buyCurrency : undefined,
      subComponents: []
    });
  }

  console.log(`Extracted ${items.length} items, ${uniqueGroups.size} groups, and ${uniqueVendors.size} vendors.`);

  // 1. Create unique Item Groups
  console.log("Uploading Item Groups...");
  for (const grp of uniqueGroups) {
    const grpRef = doc(db, 'itemGroups', grp);
    await setDoc(grpRef, {
      id: grp,
      name: grp,
      description: 'Auto-created from CSV import'
    }, { merge: true });
  }
  console.log("Item Groups uploaded.");

  // 2. Create unique Vendors
  console.log("Uploading Vendors...");
  for (const vnd of uniqueVendors) {
    const vndRef = doc(db, 'vendors', vnd);
    await setDoc(vndRef, {
      id: vnd,
      name: vnd,
      vendorGroupId: 'imported',
      email: '',
      phone: ''
    }, { merge: true });
  }
  console.log("Vendors uploaded.");

  // 3. Upload Items
  console.log("Uploading Items to Firestore...");
  let count = 0;
  for (const item of items) {
    const itemRef = doc(db, 'items', item.sku);
    const cleanedItem = Object.fromEntries(
      Object.entries(item).filter(([_, v]) => v !== undefined)
    );
    await setDoc(itemRef, cleanedItem);
    count++;
    if (count % 20 === 0) {
      console.log(`Uploaded ${count}/${items.length} items...`);
    }
  }

  console.log(`Success! Successfully uploaded ${count} items to Firestore.`);
  process.exit(0);
}

main().catch(err => {
  console.error("Critical error:", err);
  process.exit(1);
});
