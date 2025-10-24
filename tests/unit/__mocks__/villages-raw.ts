// tests/unit/__mocks__/villages-raw.ts
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Avoid Jest/ts-node globals: don't redeclare __filename/__dirname
const THIS_FILE = fileURLToPath(import.meta.url);
const THIS_DIR = dirname(THIS_FILE);

const yamlPath = resolve(THIS_DIR, '../../../data/villages.yaml');
const rawYaml = readFileSync(yamlPath, 'utf-8');

export default rawYaml;
