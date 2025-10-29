import { normalizeSlug } from '../../src/lib/slug';

describe('normalizeSlug', () => {
  it('normalizes diacritics, spacing, and punctuation', () => {
    expect(normalizeSlug('Al-Qūds')).toBe('al-quds');
    expect(normalizeSlug('ʿAin   Ghazāl')).toBe('ain-ghazal');
    expect(normalizeSlug('Village & Hamlet')).toBe('village-and-hamlet');
  });

  it('returns an empty string for invalid input', () => {
    expect(normalizeSlug(null)).toBe('');
    expect(normalizeSlug('   ')).toBe('');
  });
});
