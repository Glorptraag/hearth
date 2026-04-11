import { defineType, defineField } from 'sanity';

export const pedagogicalFramework = defineType({
  name: 'pedagogicalFramework',
  title: 'Pedagogical Framework',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'Charlotte Mason', value: 'charlotte_mason' },
          { title: 'Classical', value: 'classical' },
          { title: 'Montessori', value: 'montessori' },
          { title: 'Waldorf / Steiner', value: 'waldorf_steiner' },
          { title: 'Unschooling', value: 'unschooling' },
          { title: 'Eclectic', value: 'eclectic' },
        ],
      },
    }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'greetingTone',
      title: 'Greeting Tone',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'Warm', value: 'warm' },
          { title: 'Structured', value: 'structured' },
          { title: 'Playful', value: 'playful' },
          { title: 'Poetic', value: 'poetic' },
        ],
      },
    }),
    defineField({
      name: 'vocabulary',
      title: 'Vocabulary',
      type: 'object',
      fields: [
        { name: 'sessionNoun', title: 'Session Noun', type: 'string' },
        { name: 'facilitatorNoun', title: 'Facilitator Noun', type: 'string' },
        { name: 'learnerNoun', title: 'Learner Noun', type: 'string' },
        { name: 'activityVerb', title: 'Activity Verb', type: 'string' },
        { name: 'growthNoun', title: 'Growth Noun', type: 'string' },
      ],
    }),
    defineField({
      name: 'uiCopy',
      title: 'UI Copy',
      type: 'object',
      fields: [
        { name: 'logNudge', title: 'Log Nudge', type: 'string' },
        { name: 'logWhatLabel', title: 'Log What Label', type: 'string' },
        { name: 'logWhatPlaceholder', title: 'Log What Placeholder', type: 'text' },
        { name: 'logObserveLabel', title: 'Log Observe Label', type: 'string' },
        { name: 'coverageFrame', title: 'Coverage Frame', type: 'string' },
        { name: 'gapFrame', title: 'Gap Frame', type: 'string' },
        { name: 'celebrationFrame', title: 'Celebration Frame', type: 'string' },
        { name: 'plannerFrame', title: 'Planner Frame', type: 'string' },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'tagline' },
  },
});
