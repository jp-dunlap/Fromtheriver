import villagesYaml from '../../data/villages.yaml?raw';
import type { Village, VillageDataset } from './types';

function parseVillagesYaml(raw: string): VillageDataset {
  const yamlMatch = raw.match(/villages_json:\s*\|([\s\S]*)$/);
  if (!yamlMatch) {
    throw new Error('villages_json block missing in villages.yaml');
  }

  const jsonBlock = yamlMatch[1]
    .split('\n')
    .map((line) => line.replace(/^\s{2}/, ''))
    .join('\n')
    .trim();

  const dataset = JSON.parse(jsonBlock) as VillageDataset;
  return dataset;
}

const dataset = parseVillagesYaml(villagesYaml);

export const villages: Village[] = dataset.villages;
export const villagesDataset: VillageDataset = dataset;
