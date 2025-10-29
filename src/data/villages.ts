import villagesYaml from '../../data/villages.yaml?raw';
import type { Village, VillageDataset } from './types';
import { normalizeSlug } from '../lib/slug';

type RawVillageDataset = Partial<VillageDataset> & {
  villages?: unknown[];
};

function expectObject<T extends object>(value: unknown, message: string): T {
  if (!value || typeof value !== 'object') {
    throw new Error(message);
  }
  return value as T;
}

function expectString(value: unknown, message: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(message);
  }
  return value;
}

function expectNumber(value: unknown, message: string): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(message);
  }
  return numberValue;
}

function expectArray<T>(value: unknown, message: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(message);
  }
  return value as T[];
}

export function parseVillagesYaml(raw: string): VillageDataset {
  const yamlMatch = raw.match(/villages_json:\s*\|([\s\S]*)$/);
  if (!yamlMatch) {
    throw new Error('villages_json block missing in villages.yaml');
  }

  const jsonBlock = yamlMatch[1]
    .split('\n')
    .map((line) => line.replace(/^\s{2}/, ''))
    .join('\n')
    .trim();

  const dataset = JSON.parse(jsonBlock) as RawVillageDataset;
  const metadataObject = expectObject<Partial<VillageDataset['metadata']>>(
    dataset.metadata,
    'Villages metadata missing.',
  );
  const metadata: VillageDataset['metadata'] = {
    format: expectNumber(metadataObject.format, 'Villages metadata.format must be a number.'),
    generated_at: expectString(
      metadataObject.generated_at,
      'Villages metadata.generated_at must be a string.',
    ),
    source: expectString(metadataObject.source, 'Villages metadata.source must be a string.'),
  };

  const rawVillages = expectArray(dataset.villages, 'Villages dataset must include an array of villages.');

  const deduped: Village[] = [];
  const seenSlugs = new Set<string>();
  const duplicateSlugs: string[] = [];

  rawVillages.forEach((rawVillage, index) => {
    const villageObject = expectObject<Partial<Village>>(rawVillage, `Village entry at index ${index} is not an object.`);

    const slugSource =
      (villageObject as { slug?: unknown }).slug ??
      (villageObject as { names?: { en?: unknown } }).names?.en ??
      `village-${index}`;
    const slug = normalizeSlug(slugSource);
    if (!slug) {
      throw new Error(`Village entry at index ${index} is missing a valid slug.`);
    }

    if (seenSlugs.has(slug)) {
      duplicateSlugs.push(slug);
      return;
    }
    seenSlugs.add(slug);

    const id = expectNumber(villageObject.id, `Village ${slug} is missing a numeric id.`);
    const names = expectObject<Village['names']>(villageObject.names, `Village ${slug} is missing name translations.`);
    expectString(names.en, `Village ${slug} is missing an English name.`);
    expectString(names.ar, `Village ${slug} is missing an Arabic name.`);

    const district = expectString(villageObject.district, `Village ${slug} is missing a district.`);
    const coordinates = expectObject<Village['coordinates']>(
      villageObject.coordinates,
      `Village ${slug} is missing coordinates.`,
    );
    const lat = expectNumber(coordinates.lat, `Village ${slug} is missing a numeric latitude.`);
    const lon = expectNumber(coordinates.lon, `Village ${slug} is missing a numeric longitude.`);

    const narrative = expectObject<Village['narrative']>(
      villageObject.narrative,
      `Village ${slug} is missing narrative details.`,
    );
    expectString(narrative.summary, `Village ${slug} is missing a narrative summary.`);
    expectArray(narrative.key_events, `Village ${slug} has an invalid narrative.key_events.`);

    const destruction = expectObject<Village['destruction']>(
      villageObject.destruction,
      `Village ${slug} is missing destruction details.`,
    );
    expectArray(destruction.perpetrators, `Village ${slug} has an invalid destruction.perpetrators array.`);

    const aftermath = expectObject<Village['aftermath']>(
      villageObject.aftermath,
      `Village ${slug} is missing aftermath details.`,
    );
    expectArray(aftermath.notes, `Village ${slug} has an invalid aftermath.notes array.`);

    const media = expectObject<Village['media']>(
      villageObject.media,
      `Village ${slug} is missing media references.`,
    );
    expectArray(media.galleries, `Village ${slug} has an invalid media.galleries array.`);
    expectArray(media.maps, `Village ${slug} has an invalid media.maps array.`);
    expectArray(media.references, `Village ${slug} has an invalid media.references array.`);

    const testimonies = expectArray<Village['testimonies'][number]>(
      villageObject.testimonies,
      `Village ${slug} is missing testimonies array.`,
    );
    testimonies.forEach((testimony, testimonyIndex) => {
      expectObject(testimony, `Village ${slug} testimony at index ${testimonyIndex} is invalid.`);
    });

    deduped.push({
      ...(villageObject as Village),
      id,
      slug,
      district,
      coordinates: { lat, lon },
      names: { ...names },
      narrative: { ...narrative, key_events: [...narrative.key_events] },
      destruction: { ...destruction, perpetrators: [...destruction.perpetrators] },
      aftermath: { ...aftermath, notes: [...aftermath.notes] },
      media: {
        galleries: [...media.galleries],
        maps: [...media.maps],
        references: [...media.references],
      },
      testimonies: [...testimonies],
    });
  });

  if (duplicateSlugs.length && typeof console !== 'undefined') {
    const sample = duplicateSlugs.slice(0, 5).join(', ');
    const suffix = duplicateSlugs.length > 5 ? ', …' : '';
    console.warn?.(
      `[villages] Duplicate slugs skipped (${duplicateSlugs.length}): ${sample}${suffix}`,
    );
  }

  return {
    metadata,
    villages: deduped,
  };
}

const dataset = parseVillagesYaml(villagesYaml);

export const villages: Village[] = dataset.villages;
export const villagesDataset: VillageDataset = dataset;
