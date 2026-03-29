// ─── Sanity primitive builders ───────────────────────────────────────────────
// Use these when constructing documents for mutations.ts or ad-hoc writes.

export function ref(id: string) {
  return { _type: 'reference' as const, _ref: id };
}

export function slug(value: string) {
  return { _type: 'slug' as const, current: value };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function autoSlug(title: string) {
  return slug(slugify(title));
}

export function key(prefix = 'k') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function blockText(text: string) {
  return [
    {
      _type: 'block' as const,
      _key: key('block'),
      style: 'normal' as const,
      markDefs: [],
      children: [{ _type: 'span' as const, _key: key('span'), text, marks: [] }],
    },
  ];
}

export function material(name: string, required = true, alternative?: string) {
  const m: Record<string, unknown> = { _key: key('mat'), name, required };
  if (alternative) m.alternative = alternative;
  return m;
}

export function dlo(title: string, tier: 'emerging' | 'developing' | 'demonstrating', description?: string) {
  const d: Record<string, unknown> = { _key: key('dlo'), title, tier };
  if (description) d.description = description;
  return d;
}

export function refs(ids: string[]) {
  return ids.map(ref);
}

export function range(min: number, max: number) {
  return { min, max };
}
