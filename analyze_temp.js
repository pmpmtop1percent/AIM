import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseCSV = (text) => {
  const result = [];
  let row = [];
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

function main() {
  const csvPath = path.join(__dirname, 'item_master_template (7.2).csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: File does not exist at ${csvPath}`);
    return;
  }
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvText);
  
  console.log(`Total rows parsed from CSV: ${rows.length} (including header)`);
  if (rows.length === 0) return;

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const skuIdx = headers.indexOf('sku');
  const nameIdx = headers.indexOf('name');
  const groupIdIdx = headers.indexOf('groupid') !== -1 ? headers.indexOf('groupid') : headers.indexOf('group');
  const unitCostIdx = headers.indexOf('unitcost') !== -1 ? headers.indexOf('unitcost') : headers.indexOf('cost');
  const sellingPriceIdx = headers.indexOf('sellingprice') !== -1 ? headers.indexOf('sellingprice') : headers.indexOf('price');
  const minStockIdx = headers.indexOf('minstock');
  const buyPriceIdx = headers.indexOf('buyprice');

  const validationErrors = [];
  const seenSkus = new Map();
  const validItems = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    if (row.length === 0 || row.every(cell => cell === '')) continue;
    
    const rawSku = skuIdx !== -1 && skuIdx < row.length ? row[skuIdx] : '';
    const rawName = nameIdx !== -1 && nameIdx < row.length ? row[nameIdx] : '';
    const rawGroupId = groupIdIdx !== -1 && groupIdIdx < row.length ? row[groupIdIdx] : '';
    const rawUnitCost = unitCostIdx !== -1 && unitCostIdx < row.length ? row[unitCostIdx] : '';
    const rawSellingPrice = sellingPriceIdx !== -1 && sellingPriceIdx < row.length ? row[sellingPriceIdx] : '';
    const rawMinStock = minStockIdx !== -1 && minStockIdx < row.length ? row[minStockIdx] : '';
    const rawBuyPrice = buyPriceIdx !== -1 && buyPriceIdx < row.length ? row[buyPriceIdx] : '';
    
    const cleanSku = rawSku.trim().toUpperCase();
    const cleanName = rawName.trim();
    const cleanGroupId = rawGroupId.trim();
    
    const rowErrors = [];
    
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
    
    const parsedUnitCost = Number((rawUnitCost || '').toString().replace(/,/g, ''));
    if (isNaN(parsedUnitCost) || parsedUnitCost <= 0) {
      rowErrors.push(`Unit Cost must be a number > 0 (got "${rawUnitCost}")`);
    }
    
    const parsedSellingPrice = Number((rawSellingPrice || '').toString().replace(/,/g, ''));
    if (isNaN(parsedSellingPrice) || parsedSellingPrice <= 0) {
      rowErrors.push(`Selling Price must be a number > 0 (got "${rawSellingPrice}")`);
    }
    
    const parsedMinStock = rawMinStock ? parseInt(rawMinStock.toString().replace(/,/g, ''), 10) : 0;
    if (isNaN(parsedMinStock) || parsedMinStock < 0) {
      rowErrors.push(`Min Stock must be an integer >= 0 (got "${rawMinStock}")`);
    }
    
    const parsedBuyPrice = rawBuyPrice ? Number(rawBuyPrice.toString().replace(/,/g, '')) : undefined;
    if (parsedBuyPrice !== undefined && (isNaN(parsedBuyPrice) || parsedBuyPrice < 0)) {
      rowErrors.push(`Buy Price must be a number >= 0 (got "${rawBuyPrice}")`);
    }
    
    if (rowErrors.length > 0) {
      validationErrors.push({ rowNum, sku: cleanSku, errors: rowErrors });
    } else {
      validItems.push({ rowNum, sku: cleanSku, name: cleanName });
      if (seenSkus.has(cleanSku)) {
        seenSkus.get(cleanSku).push(rowNum);
      } else {
        seenSkus.set(cleanSku, [rowNum]);
      }
    }
  }

  console.log('\n--- 1. VALIDATION FAILURES (SKIPPED BY IMPORTER) ---');
  console.log(`Total: ${validationErrors.length} items`);
  validationErrors.forEach(v => {
    console.log(`  Row ${v.rowNum} (${v.sku || 'No SKU'}):`);
    v.errors.forEach(e => console.log(`    - ${e}`));
  });

  console.log('\n--- 2. DUPLICATE SKUs (OVERWRITING IN DATABASE) ---');
  let duplicateOccurrences = 0;
  let uniqueValidCount = 0;
  seenSkus.forEach((rowsList, sku) => {
    uniqueValidCount++;
    if (rowsList.length > 1) {
      duplicateOccurrences += (rowsList.length - 1);
      console.log(`  SKU "${sku}" occurs ${rowsList.length} times on rows: ${rowsList.join(', ')}`);
    }
  });
  console.log(`Total duplicate row occurrences among valid items: ${duplicateOccurrences}`);
  
  console.log('\n--- SUMMARY ---');
  console.log(`Total items in CSV (excluding header): ${rows.length - 1}`);
  console.log(`Validation failures: ${validationErrors.length}`);
  console.log(`Valid items loaded into UI: ${validItems.length}`);
  console.log(`Unique valid items saved in Firestore: ${uniqueValidCount}`);
}

main();
