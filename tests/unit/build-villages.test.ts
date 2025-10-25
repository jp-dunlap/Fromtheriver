import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('buildVillages', () => {
  it('parses YAML and writes normalized JSON output', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'villages-build-'));

    try {
      const sourcePath = join(tempDir, 'villages.yaml');
      const outputPath = join(tempDir, 'public', 'villages.json');

      const fixture = `villages_json: |
  {
    "villages": [
      {
        "id": 42,
        "slug": " sample-slug ",
        "name": " Sample Village ",
        "district": " Sample District ",
        "coordinates": { "lat": 12.34, "lon": 56.78 }
      }
    ]
  }
`;

      writeFileSync(sourcePath, fixture, 'utf8');

      execFileSync('node', [
        join(__dirname, '../../scripts/build-villages.mjs'),
        '--source',
        sourcePath,
        '--destination',
        outputPath,
      ]);

      const rows = JSON.parse(readFileSync(outputPath, 'utf8'));

      expect(rows.length).toBe(1);
      expect(rows[0]).toEqual({
        id: '42',
        slug: 'sample-slug',
        name: 'Sample Village',
        district: 'Sample District',
        lat: 12.34,
        lng: 56.78,
      });

      expect(readFileSync(outputPath, 'utf8').trim()).toContain('sample-slug');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
