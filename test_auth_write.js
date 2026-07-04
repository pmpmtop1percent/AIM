import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const configPath = path.join(__dirname, 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const { projectId, firestoreDatabaseId: databaseId, apiKey } = config;

async function main() {
  console.log("1. Authenticating as admin pmpmtop1percent@gmail.com...");
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const authRes = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'pmpmtop1percent@gmail.com',
      password: '09098080',
      returnSecureToken: true
    })
  });
  
  if (!authRes.ok) {
    console.error("Authentication failed:", await authRes.text());
    return;
  }
  
  const authData = await authRes.json();
  const idToken = authData.idToken;
  console.log("Authentication successful! Admin token obtained.");

  console.log("\n2. Fetching sample item A-002 to inspect Firestore schema...");
  const sampleUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/items/A-002`;
  const sampleRes = await fetch(sampleUrl, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });

  if (!sampleRes.ok) {
    console.log("Could not fetch A-002 (maybe it doesn't exist yet).");
  } else {
    const sampleData = await sampleRes.json();
    console.log("Sample Schema for A-002:\n", JSON.stringify(sampleData, null, 2));
  }
}

main().catch(console.error);
