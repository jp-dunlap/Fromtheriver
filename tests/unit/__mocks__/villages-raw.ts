// tests/unit/__mocks__/villages-raw.ts
// CommonJS-friendly mock for "?raw" YAML imports under Jest/ts-jest.
// Avoids ESM-only `import.meta` so it runs in Jest's CJS runtime.

import { readFileSync } from 'node:fs';
import * as path from 'node:path';

// In ts-jest (CJS), __dirname is defined. Build an absolute path to the YAML.
const yamlPath = path.resolve(__dirname, '../../../data/villages.yaml');
const rawYaml = readFileSync(yamlPath, 'utf-8');

// Default export for `import x from '...yaml?raw'`
export default rawYaml;

// Also set CommonJS export for any require()-based resolution.
// @ts-ignore
module.exports = rawYaml;
