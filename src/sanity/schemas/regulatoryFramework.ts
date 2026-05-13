import { defineType, defineField } from 'sanity';

// Capability Universe v2 — Regulatory framework registry (§7.2)
// Centrally authored. Each framework is a target for atomic-level mappings.

export const regulatoryFramework = defineType({
  name: 'regulatoryFramework',
  title: 'Regulatory Framework',
  type: 'document',
  fields: [
    defineField({ name: 'frameworkKey', title: 'Framework key', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'jurisdiction', title: 'Jurisdiction', type: 'string' }),
    defineField({
      name: 'reportTier',
      title: 'Report tier',
      type: 'string',
      options: {
        list: [
          { title: 'CD level', value: 'cd_level' },
          { title: 'Learning area', value: 'learning_area' },
          { title: 'Standard', value: 'standard' },
          { title: 'Outcome', value: 'outcome' },
        ],
      },
    }),
    defineField({ name: 'totalCodes', title: 'Total codes in framework', type: 'number' }),
    defineField({ name: 'reportFormat', title: 'Report format schema (JSON)', type: 'object', fields: [{ name: 'json', type: 'text' }] }),
    defineField({ name: 'evidenceRequirements', title: 'Evidence requirements (JSON)', type: 'object', fields: [{ name: 'json', type: 'text' }] }),
    defineField({ name: 'introducedInVersion', title: 'Introduced in version', type: 'string', initialValue: '2.0.0' }),
    defineField({ name: 'deprecatedInVersion', title: 'Deprecated in version', type: 'string' }),
  ],
  preview: { select: { title: 'name', subtitle: 'jurisdiction' } },
});
