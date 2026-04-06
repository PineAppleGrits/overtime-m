import slugify from 'slugify';

export const buildSlugBase = (value: string): string => {
  const slug = slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });

  return slug || 'item';
};

export const generateUniqueSlug = async ({
  value,
  exists,
}: {
  value: string;
  exists: (slug: string) => Promise<boolean>;
}): Promise<string> => {
  const baseSlug = buildSlugBase(value);
  let candidate = baseSlug;
  let suffix = 2;

  while (await exists(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};
