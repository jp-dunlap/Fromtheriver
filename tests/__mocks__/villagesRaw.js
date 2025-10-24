const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const yamlPath = resolve(__dirname, '..', '..', 'data', 'villages.yaml');
const rawYaml = readFileSync(yamlPath, 'utf-8');

module.exports = rawYaml;
