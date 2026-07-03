import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);

async function main() {
  console.log("Authenticating anonymously...");
  await signInAnonymously(auth);
  console.log("Authenticated! Reading items/A-001N...");
  const docRef = doc(db, 'items', 'A-001N');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    console.log("Document items/A-001N content:", JSON.stringify(snap.data(), null, 2));
  } else {
    console.log("Document items/A-001N does not exist in Firestore!");
  }
  process.exit(0);
}

main().catch(console.error);
