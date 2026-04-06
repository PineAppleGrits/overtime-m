import { buildSlugBase, generateUniqueSlug } from './slug.util';

describe('slug util', () => {
  it('builds a normalized slug base', () => {
    expect(buildSlugBase('  Fury Basket  ')).toBe('fury-basket');
  });

  it('falls back to a safe default when the value has no slug characters', () => {
    expect(buildSlugBase('***')).toBe('item');
  });

  it('adds numeric suffixes until a free slug is found', async () => {
    const takenSlugs = new Set(['fury-basket', 'fury-basket-2']);

    const slug = await generateUniqueSlug({
      value: 'Fury Basket',
      exists: async (candidate) => takenSlugs.has(candidate),
    });

    expect(slug).toBe('fury-basket-3');
  });
});
