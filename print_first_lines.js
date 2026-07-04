import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, 'item_master_template (7.2).csv');
const lines = fs.readFileSync(csvPath, 'utf-8').split('\n');

for (let i = 0; i < Math.min(15, lines.length); i++) {
  console.log(`Line ${i + 1}: ${lines[i]}`);
}
