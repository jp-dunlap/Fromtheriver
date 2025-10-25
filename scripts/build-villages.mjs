import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import YAML from 'yaml';

function toFileUrl(value, fallback) {
  if (value instanceof URL) {
    return value;
  }

  if (typeof value === 'string' && value.length > 0) {
    if (value.startsWith('file:')) {
      return new URL(value);
    }

    return pathToFileURL(resolve(value));
  }

  return fallback;
}

export function buildVillages({
  source = new URL('../data/villages.yaml', import.meta.url),
  destination = new URL('../public/villages.json', import.meta.url),
} = {}) {
  const sourceUrl = toFileUrl(source, new URL('../data/villages.yaml', import.meta.url));
  const destinationUrl = toFileUrl(
    destination,
    new URL('../public/villages.json', import.meta.url),
  );

  const raw = readFileSync(sourceUrl, 'utf8');
  const doc = YAML.parse(raw);

  let list = [];

  if (Array.isArray(doc?.villages_json)) {
    list = doc.villages_json;
  } else if (typeof doc?.villages_json === 'string') {
    try {
      const parsed = JSON.parse(doc.villages_json);
      if (Array.isArray(parsed?.villages)) {
        list = parsed.villages;
      } else if (Array.isArray(parsed)) {
        list = parsed;
      }
    } catch (error) {
      console.warn('Unable to parse villages_json as JSON:', error);
    }
  } else if (Array.isArray(doc?.villages)) {
    list = doc.villages;
  } else if (Array.isArray(doc?.metadata?.villages)) {
    list = doc.metadata.villages;
  }

  const rows = list
    .map((v) => ({
      id: String(v?.id ?? v?.slug ?? ''),
      slug: String(v?.slug ?? '').trim(),
      name: String(v?.name ?? v?.names?.en ?? '').trim(),
      district: String(v?.district ?? '').trim(),
      lat: Number(v?.lat ?? v?.coordinates?.lat ?? v?.coordinates?.latitude),
      lng: Number(v?.lng ?? v?.coordinates?.lng ?? v?.coordinates?.lon ?? v?.coordinates?.longitude),
    }))
    .filter((v) => v.slug && Number.isFinite(v.lat) && Number.isFinite(v.lng));

  mkdirSync(new URL('.', destinationUrl), { recursive: true });
  writeFileSync(destinationUrl, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');

  return { rows, destination: destinationUrl };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let sourceArg;
  let destinationArg;

  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const value = args[index + 1];

    if (flag === '--source') {
      sourceArg = value;
      index += 1;
    } else if (flag === '--destination') {
      destinationArg = value;
      index += 1;
    }
  }

  const { rows } = buildVillages({ source: sourceArg, destination: destinationArg });
  console.log(`Wrote villages.json (${rows.length} entries)`);
}
