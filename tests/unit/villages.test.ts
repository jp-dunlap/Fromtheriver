import { describe, expect, it } from '@jest/globals';

import { parseVillagesYaml } from '../../src/data/villages';

describe('parseVillagesYaml', () => {
  it('parses a valid dataset', () => {
    const raw = `villages_json: |
  {
    "villages": [
      {
        "id": 1,
        "slug": "test-village",
        "names": {"en": "Test Village"}
      }
    ]
  }
`;

    const dataset = parseVillagesYaml(raw);

    expect(dataset.villages).toHaveLength(1);
    expect(dataset.villages[0].slug).toBe('test-village');
  });

  it('throws when the YAML block is missing', () => {
    const raw = 'metadata: {}';

    expect(() => parseVillagesYaml(raw)).toThrow(
      'villages_json block missing in villages.yaml',
    );
  });
});
