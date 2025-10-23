import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const yamlPath = resolve(__dirname, '../../../data/villages.yaml');
const rawYaml = readFileSync(yamlPath, 'utf-8');

export default rawYaml;
