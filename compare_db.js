import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const configPath = path.join(__dirname, 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const { projectId, firestoreDatabaseId: databaseId, apiKey } = config;

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

async function main() {
  console.log("1. Signing in anonymously via Firebase Auth REST API...");
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const authRes = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  
  if (!authRes.ok) {
    console.error("Authentication failed:", await authRes.text());
    return;
  }
  
  const authData = await authRes.json();
  const idToken = authData.idToken;
  console.log("Authentication successful! Token obtained.");

  console.log("\n2. Fetching items from Firestore /items collection...");
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/items?pageSize=1000`;
  const firestoreRes = await fetch(firestoreUrl, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });

  if (!firestoreRes.ok) {
    console.error("Failed to fetch Firestore documents:", await firestoreRes.text());
    return;
  }

  const firestoreData = await firestoreRes.json();
  const dbDocuments = firestoreData.documents || [];
  console.log(`Successfully retrieved ${dbDocuments.length} items from database.`);

  const dbSkus = new Set(dbDocuments.map(doc => doc.name.split('/').pop().toUpperCase()));

  console.log("\n3. Reading and parsing CSV file: item_master_template (7.2).csv...");
  const csvPath = path.join(__dirname, 'item_master_template (7.2).csv');
  if (!fs.existsSync(csvPath)) {
    console.error("Error: CSV file not found.");
    return;
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const csvRows = parseCSV(csvText);
  
  if (csvRows.length === 0) {
    console.error("Error: CSV file is empty.");
    return;
  }

  const headers = csvRows[0].map(h => h.trim().toLowerCase());
  const skuIdx = headers.indexOf('sku');
  const nameIdx = headers.indexOf('name');

  if (skuIdx === -1) {
    console.error("Error: CSV header must contain 'sku'.");
    return;
  }

  const csvItems = [];
  for (let i = 1; i < csvRows.length; i++) {
    const row = csvRows[i];
    if (row.length === 0 || row.every(cell => cell === '')) continue;
    const rawSku = row[skuIdx] || '';
    const name = nameIdx !== -1 && nameIdx < row.length ? row[nameIdx] : '';
    const sku = rawSku.trim().toUpperCase();
    if (sku) {
      csvItems.push({ rowNum: i + 1, sku, name });
    }
  }

  console.log(`Total data rows in CSV: ${csvItems.length}`);

  const missingItems = [];
  csvItems.forEach(item => {
    if (!dbSkus.has(item.sku)) {
      missingItems.push(item);
    }
  });

  console.log("\n--- COMPARISON RESULTS ---");
  if (missingItems.length === 0) {
    console.log("All items from the CSV are present in the Firestore database!");
  } else {
    console.log(`Found ${missingItems.length} items from the CSV that are MISSING in Firestore:`);
    missingItems.forEach(item => {
      console.log(`  Row ${item.rowNum}: SKU="${item.sku}" - Name: "${item.name}"`);
    });
  }
}

main().catch(console.error);
