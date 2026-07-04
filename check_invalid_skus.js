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
  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvText);
  
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const skuIdx = headers.indexOf('sku');
  const nameIdx = headers.indexOf('name');

  const invalidSkus = [];
  const allowedPattern = /^[a-zA-Z0-9_\-]+$/;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every(cell => cell === '')) continue;
    const rawSku = row[skuIdx] || '';
    const name = nameIdx !== -1 && nameIdx < row.length ? row[nameIdx] : '';
    const sku = rawSku.trim().toUpperCase();
    
    if (sku && !allowedPattern.test(sku)) {
      invalidSkus.push({ rowNum: i + 1, sku, name });
    }
  }

  console.log(`Found ${invalidSkus.length} SKUs containing invalid characters (e.g. slashes, dots, spaces, special chars):`);
  invalidSkus.forEach(item => {
    console.log(`  Row ${item.rowNum}: SKU="${item.sku}" - Name: "${item.name}"`);
  });
}

main();
