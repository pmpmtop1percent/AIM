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
  const csvPath = path.join(__dirname, 'item_master_template_with_vendor.csv');
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvText);
  
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const skuIdx = headers.indexOf('sku');
  const nameIdx = headers.indexOf('name');
  const groupIdIdx = headers.indexOf('groupid') !== -1 ? headers.indexOf('groupid') : headers.indexOf('group');
  const unitCostIdx = headers.indexOf('unitcost') !== -1 ? headers.indexOf('unitcost') : headers.indexOf('cost');
  const sellingPriceIdx = headers.indexOf('sellingprice') !== -1 ? headers.indexOf('sellingprice') : headers.indexOf('price');

  const seenSkus = new Map();
  const shortSkus = [];
  const invalidNumbers = [];
  const missingFields = [];
  
  console.log(`Total rows in CSV: ${rows.length} (including header)`);
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    if (row.length === 0 || row.every(cell => cell === '')) continue;
    
    const rawSku = skuIdx < row.length ? row[skuIdx] : '';
    const rawName = nameIdx < row.length ? row[nameIdx] : '';
    const rawGroupId = groupIdIdx < row.length ? row[groupIdIdx] : '';
    const rawUnitCost = unitCostIdx < row.length ? row[unitCostIdx] : '';
    const rawSellingPrice = sellingPriceIdx < row.length ? row[sellingPriceIdx] : '';
    
    const sku = rawSku.trim().toUpperCase();
    const name = rawName.trim();
    const groupId = rawGroupId.trim();
    
    if (!sku) {
      missingFields.push({ rowNum, error: 'SKU is empty' });
      continue;
    }
    
    // Check length
    if (sku.length < 3) {
      shortSkus.push({ rowNum, sku, name });
      continue;
    }
    
    // Check duplicates
    if (seenSkus.has(sku)) {
      seenSkus.get(sku).push(rowNum);
    } else {
      seenSkus.set(sku, [rowNum]);
    }
    
    // Check numbers
    const unitCost = Number(rawUnitCost.replace(/,/g, ''));
    const sellingPrice = Number(rawSellingPrice.replace(/,/g, ''));
    if (isNaN(unitCost) || unitCost < 0 || isNaN(sellingPrice) || sellingPrice < 0) {
      invalidNumbers.push({ rowNum, sku, unitCost: rawUnitCost, sellingPrice: rawSellingPrice });
    }
    if (!name || !groupId) {
      missingFields.push({ rowNum, sku, name, groupId });
    }
  }
  
  console.log('\n--- 1. SHORT SKUs (< 3 CHARACTERS) ---');
  console.log(`Found ${shortSkus.length} rows:`);
  shortSkus.forEach(s => console.log(`  Row ${s.rowNum}: SKU="${s.sku}" - Name: "${s.name}"`));
  
  console.log('\n--- 2. DUPLICATE SKUs ---');
  let duplicateCount = 0;
  seenSkus.forEach((rowsList, sku) => {
    if (rowsList.length > 1) {
      duplicateCount += (rowsList.length - 1);
      console.log(`  SKU "${sku}" occurs on rows: ${rowsList.join(', ')}`);
    }
  });
  console.log(`Total duplicate row occurrences: ${duplicateCount}`);
  
  console.log('\n--- 3. INVALID NUMERIC VALUES ---');
  console.log(`Found ${invalidNumbers.length} rows:`);
  invalidNumbers.forEach(n => console.log(`  Row ${n.rowNum}: SKU="${n.sku}", unitCost="${n.unitCost}", sellingPrice="${n.sellingPrice}"`));

  console.log('\n--- 4. MISSING REQUIRED FIELDS ---');
  console.log(`Found ${missingFields.length} rows:`);
  missingFields.forEach(m => console.log(`  Row ${m.rowNum}: SKU="${m.sku || ''}", Name="${m.name || ''}", GroupId="${m.groupId || ''}"`));
  
  const parsedCount = rows.length - 1 - shortSkus.length - invalidNumbers.length - missingFields.length - duplicateCount;
  console.log(`\nExpected final database records: ${parsedCount}`);
}

main();
