import { parseVillagesYaml } from '../../src/data/villages';

const baseVillage = {
  id: 1,
  slug: 'Test Village',
  names: { en: 'Test Village', ar: 'اختبار' },
  district: 'Test',
  coordinates: { lat: 1.23, lon: 4.56 },
  narrative: { summary: 'Story', key_events: [] },
  destruction: { perpetrators: [], operation: null },
  aftermath: { settlement: null, notes: [] },
  media: { galleries: [], maps: [], references: [] },
  testimonies: [],
};

const baseDataset = {
  metadata: {
    format: 1,
    generated_at: '2024-01-01T00:00:00Z',
    source: 'test',
  },
  villages: [baseVillage],
};

const toYaml = (dataset: unknown) => {
  const json = JSON.stringify(dataset, null, 2)
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
  return `villages_json: |\n${json}\n`;
};

describe('parseVillagesYaml', () => {
  it('parses a valid dataset with normalization', () => {
    const dataset = parseVillagesYaml(toYaml(baseDataset));

    expect(dataset.metadata.source).toBe('test');
    expect(dataset.villages).toHaveLength(1);
    expect(dataset.villages[0].slug).toBe('test-village');
  });

  it('deduplicates villages by normalized slug', () => {
    const duplicateDataset = {
      ...baseDataset,
      villages: [
        baseVillage,
        { ...baseVillage, id: 99, slug: 'Test  Village' },
      ],
    };

    const dataset = parseVillagesYaml(toYaml(duplicateDataset));

    expect(dataset.villages).toHaveLength(1);
    expect(dataset.villages[0].id).toBe(1);
  });

  it('throws when the YAML block is missing', () => {
    const raw = 'metadata: {}';

    expect(() => parseVillagesYaml(raw)).toThrow(
      'villages_json block missing in villages.yaml',
    );
  });

  it('throws for entries missing a slug', () => {
    const missingSlugDataset = {
      ...baseDataset,
      villages: [{ ...baseVillage, slug: '   ' }],
    };

    expect(() => parseVillagesYaml(toYaml(missingSlugDataset))).toThrow(
      'Village entry at index 0 is missing a valid slug.',
    );
  });
});
