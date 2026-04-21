/**
 * Hearth Sanity Seed — Charlotte Mason PKB Corpus
 * Ingests all 45 documents from the CM proof-of-concept corpus into Sanity.
 *
 * Run: npx tsx scripts/ingest-pedagogy-corpus.ts
 * Idempotent — uses createOrReplace throughout.
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const CM_REF = {
  _type: 'reference' as const,
  _ref: 'pedagogicalFramework.charlotte_mason',
};

// ---------------------------------------------------------------------------
// Layer 1 — Source Excerpts (20)
// ---------------------------------------------------------------------------

const SOURCE_EXCERPTS = [
  {
    _id: 'pedagogySourceExcerpt.cm.001',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: 'Therefore we are limited to three educational instruments\u2014the atmosphere of environment, the discipline of habit, and the presentation of living ideas.',
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Preface to the Home Education Series, Point 5, pp. xiii\u2013xiv',
    },
    tags: [
      'atmosphere', 'habit', 'living_ideas', 'core_principle',
      'onboarding_wizard', 'settings_reading_path', 'first_principles_reference',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.002',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "By the saying, EDUCATION IS AN ATMOSPHERE, it is not meant that a child should be isolated in what may be called a 'child environment,' especially adapted and prepared; but that we should take into account the educational value of his natural home atmosphere, both as regards persons and things, and should let him live freely among his proper conditions. It stultifies a child to bring down his world to the 'child\u2019s' level.",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Preface to the Home Education Series, Point 6, pp. xiii\u2013xiv',
    },
    tags: [
      'atmosphere', 'environment', 'home_life', 'anti_child_centric',
      'parent_considering_dedicated_learning_space', 'child_is_bored', 'kitchen_table_learning',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.003',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: 'By EDUCATION IS A DISCIPLINE, is meant the discipline of habits formed definitely and thoughtfully, whether habits of mind or body. Physiologists tell us of the adaptation of brain structure to habitual lines of thought\u2014i.e., to our habits.',
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Preface, Point 7, p. xiv',
    },
    tags: [
      'habit', 'discipline', 'brain_structure', 'physiology',
      'parent_struggling_with_routines', 'child_resistance', 'establishing_rhythms',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.004',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "A child\u2019s mind is no mere sac to hold ideas; but is rather, if the figure may be allowed, a spiritual organism, with an appetite for all knowledge. This is its proper diet, with which it is prepared to deal, and which it can digest and assimilate as the body does foodstuffs.",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Preface, Point 10, pp. xiv\u2013xv',
    },
    tags: [
      'mind_as_organism', 'living_ideas', 'rich_curriculum', 'anti_twaddle',
      'parent_worries_child_overwhelmed', 'choosing_books', 'curriculum_depth_vs_breadth',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.005',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: 'Education is the science of relations; that is, that a child has natural relations with a vast number of things and thoughts: so we must train him upon physical exercises, nature, handicrafts, science and art, and upon many living books; for we know that our business is, not to teach him all about anything, but to help him to make valid as many as may be of\u2014\n\n"Those first-born affinities\n\nThat fit our new existence to existing things."',
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Preface, Point 13, p. xv',
    },
    tags: [
      'science_of_relations', 'breadth', 'living_books', 'nature', 'art', 'handicrafts',
      'curriculum_planning', 'parent_overwhelmed_by_subject_coverage', 'defining_education',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.006',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "A tablet to be written upon? A twig to be bent? Wax to be moulded? Very likely; but he is much more\u2014a being belonging to an altogether higher estate than ours; as it were, a prince committed to the fostering care of peasants.",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: "Part I, II. The Child\u2019s Estate, p. 11",
    },
    tags: [
      'children_are_persons', 'child_estate', 'reverence', 'anti_tabula_rasa',
      'parent_feels_inadequate', 'child_is_difficult', 'framing_the_child',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.007',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "Nothing could be better for the child than this 'masterly inactivity,' so far as it goes. It is well he should be let grow and helped to grow according to his nature; and so long as the parents do not step in to spoil him, much good and no very evident harm comes of letting him alone.",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part I, "How Parents Usually Proceed", p. 5',
    },
    tags: [
      'masterly_inactivity', 'restraint', 'trust', 'withdrawal',
      'parent_overmanaging', 'child_in_free_play', 'parent_considering_intervention',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.008',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: 'Take heed that ye OFFEND not\u2014DESPISE not\u2014HINDER not\u2014one of these little ones.\n\nSo run the three educational laws of the New Testament, which, when separately examined, appear to me to cover all the help we can give the children and all the harm we can save them from\u2014that is, whatever is included in training up a child in the way he should go.',
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part I, II. The Child\u2019s Estate \u2014 "Code of Education in the Gospels", p. 12',
    },
    tags: [
      'three_laws', 'offend_not', 'despise_not', 'hinder_not', 'negative_precepts',
      'parent_self_reflection', 'parenting_mistakes', 'moral_framework',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.009',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "'Naughty baby!' says the mother; and the child\u2019s eyes droop, and a flush rises over neck and brow... what does it mean, this display of feeling, conscience, in the child, before any human teaching can have reached him? No less than this, that he is born a law-abiding being, with a sense of may, and must not, of right and wrong.",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part I, III. Offending the Children, p. 13',
    },
    tags: [
      'conscience', 'moral_sense', 'born_law_abiding', 'habit_of_obedience',
      'toddler_testing_limits', 'moral_moment', 'child_seems_aware_of_wrongdoing',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.010',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "A great deal has been said lately about the danger of overpressure, of requiring too much mental work from a child of tender years. The danger exists; but lies, not in giving the child too much, but in giving him the wrong thing to do, the sort of work for which the present state of his mental development does not fit him... Whoever saw a child tired of seeing, of examining in his own way, unfamiliar things? This is the sort of mental nourishment for which he has an unbounded appetite, because it is that food of the mind on which, for the present, he is meant to grow.",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part II, VII. The Child Gets Knowledge By Means Of His Senses, pp. 66\u201367',
    },
    tags: [
      'overpressure', 'appropriate_challenge', 'seeing', 'observation', 'appetite_for_knowledge',
      'parent_worries_about_overload', 'child_seems_bored', 'calibrating_challenge_level',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.011',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "Set him face to face with a thing, and he is twenty times as quick as you are in knowing all about it; knowledge of things flies to the mind of a child as steel filings to a magnet. And, pari passu with his knowledge of things, his vocabulary grows; for it is a law of the mind that what we know, we struggle to express. This fact accounts for many of the apparently aimless questions of children; they are in quest, not of knowledge, but of words to express the knowledge they have.",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part II, VII. The Child Gets Knowledge By Means Of His Senses, pp. 67\u201368',
    },
    tags: [
      'things_vs_words', 'direct_knowledge', 'vocabulary', 'real_experience',
      'child_asks_many_questions', 'child_prefers_hands_on', 'worksheets_vs_real_things',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.012',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: '"The mother is qualified," says Pestalozzi, "and qualified by the Creator Himself, to become the principal agent in the development of her child; ... and what is demanded of her is\u2014a thinking love...."',
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M. (quoting Pestalozzi)',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part I, Preliminary Considerations, p. 2',
    },
    tags: [
      'thinking_love', 'mother_role', 'pestalozzi', 'disciplined_affection',
      'parent_feels_inadequate', 'parent_new_to_homeschooling', 'reading_path_introduction',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.013',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "It would be well if all we persons in authority, parents and all who act for parents, could make up our minds that there is no sort of knowledge to be got in these early years so valuable to children as that which they get for themselves of the world they live in. Let them once get in touch with Nature, and a habit is formed which will be a source of delight through life. We were all meant to be naturalists, each in his degree, and it is inexcusable to live in a world so full of the marvels of plant and animal life and to care for none of these things.",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part II, V. Living Creatures, p. 61',
    },
    tags: [
      'nature_study', 'firsthand_knowledge', 'naturalist', 'outdoor_life',
      'nature_walk', 'outdoor_activity', 'parent_considering_nature_study', 'seasonal_observation',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.014',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: 'The power to classify, discriminate, distinguish between things that differ, is amongst the highest faculties of the human intellect, and no opportunity to cultivate it should be let slip; but a classification got out of books, that the child does not make for himself and is not able to verify for himself, cultivates no power but that of verbal memory...',
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: "Part II, VI. Field-Lore and Naturalists\u2019 Books, p. 64",
    },
    tags: [
      'observation', 'classification', 'firsthand_knowledge', 'anti_rote',
      'child_sorting_or_classifying', 'worksheet_vs_real_study', 'observation_activity',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.015',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: 'Children narrate by nature. Listen to the babble of your little ones. Much of it is narration. They narrate what they have seen, what they have done, what they have heard. This power should be used in their education.',
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part V, IX. The Art of Narrating, p. 231',
    },
    tags: [
      'narration', 'natural_language', 'oral_composition', 'telling_back',
      'after_reading', 'after_an_outing', 'assessment_moment', 'child_telling_back',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.016',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: 'They must be let alone, left to themselves a great deal, to take in what they can of the beauty of earth and heavens; for of the evils of modern education few are worse than this\u2014that the perpetual cackle of his elders leaves the poor child not a moment of time, nor an inch of space, wherein to wonder\u2014and grow.',
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part II, I. Growing Time \u2014 "Possibilities of a Day in the Open", p. 44',
    },
    tags: [
      'silence', 'wonder', 'parental_restraint', 'space_to_grow',
      'overtalking_parent', 'child_staring_at_something', 'quiet_observation_moment',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.017',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "But it is not her business to entertain the little people: there should be no story-books, no telling of tales, as little talk as possible, and that to some purpose. Who thinks to amuse children with tale or talk at a circus or a pantomime? And here, is there not infinitely more displayed for their delectation?",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part II, I. Growing Time \u2014 "No Story-Books", p. 45',
    },
    tags: [
      'restraint', 'nature_as_spectacle', 'parent_role', 'wonder',
      'outdoor_activity', 'parent_feels_need_to_narrate', 'nature_walk', 'child_fascinated_by_something',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.018',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "By degrees the children will learn discriminatingly every feature of the landscapes with which they are familiar; and think what a delightful possession for old age and middle life is a series of pictures imaged, feature by feature, in the sunny glow of a child\u2019s mind! The miserable thing about the childish recollections of most persons is that they are blurred, distorted, incomplete, no more pleasant to look upon than a fractured cup or a torn garment; and the reason is, not that the old scenes are forgotten, but that they were never fully seen.",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part II, II. Sight-Seeing, pp. 47\u201348',
    },
    tags: [
      'observation', 'memory', 'seeing_fully', 'sight_seeing',
      'outdoor_activity', 'art_appreciation', 'memory_exercise', 'first_visit_to_a_place',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.019',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: 'Let everything the child does be well done. An exercise written with carelessness, a drawing scamped \u2014 these are to be corrected on the spot. The child must not be allowed to form the habit of turning out imperfect work.',
    isParaphrase: true,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part IV, VI. The Habit of Perfect Execution, p. 159',
    },
    tags: [
      'perfect_execution', 'habit_of_excellence', 'short_lessons', 'completion',
      'child_producing_careless_work', 'copywork_session', 'handicraft_activity',
    ],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogySourceExcerpt.cm.020',
    _type: 'pedagogySourceExcerpt' as const,
    framework: CM_REF,
    text: "'The children walk every day; they are never out less than an hour when the weather is suitable.' That is better than nothing... Children do not develop at their best upon... an hour\u2019s 'constitutional' daily.",
    isParaphrase: false,
    sourceAttribution: {
      author: 'Mason, Charlotte M.',
      title: 'Home Education',
      year: '1906',
      pageOrChapter: 'Part II, VII. The Child Gets Knowledge By Means Of His Senses \u2014 "The Children Walk Every Day", p. 29',
    },
    tags: [
      'outdoor_hours', 'daily_walk', 'four_hours_outdoors', 'air_and_exercise',
      'parent_asking_how_much_outdoor_time', 'short_outdoor_day', 'weather_concerns',
    ],
    suggestedDraft: false,
    status: 'published',
  },
];

// ---------------------------------------------------------------------------
// Layer 2 — Practice Patterns (7)
// ---------------------------------------------------------------------------

const PRACTICE_PATTERNS = [
  {
    _id: 'pedagogyPracticePattern.cm.001',
    _type: 'pedagogyPracticePattern' as const,
    framework: CM_REF,
    triggerTitle: 'Child resists a planned lesson',
    triggerContext: 'Parent has planned a short lesson (reading, arithmetic, copywork, etc.) and the child is reluctant, fidgeting, or actively refusing to engage.',
    traditionResponse: "Mason\u2019s guidance here runs through three layers. First, check the length of the lesson. CM lessons for children under nine are fifteen to twenty minutes for the shortest subjects, never more. If the parent has extended a lesson beyond the child\u2019s attention span, the resistance is structural, not attitudinal \u2014 shortening the lesson is the fix, not pressing through.\n\nSecond, check the quality of the material. Mason calls twaddle \u2014 dumbed-down, moralising, or dry factual material \u2014 an offence against the child. The resistance may be correct intellectual judgement. If the book or exercise is twaddle, the child\u2019s refusal is evidence of living mind. Substitute a living book and observe.\n\nThird, if the material is right and the length is right, then the resistance is a matter of will and habit. Mason\u2019s approach here is emphatically not coercion by pressure or by reward. It is the gentle, repeated expectation that the habit of attention is being formed. The parent says, calmly and without heat, that this short thing is what we do now, and then does not fill the room with argument. The child\u2019s will is strengthened by being allowed to comply, not by being forced. \u201CA lesson that is too long is a lesson that is twice as long as the child can bear. Shorten it.\u201D",
    antiPattern: "Do not bribe completion with extrinsic rewards. Do not extend the lesson as punishment for not attending. Do not lecture the child about the importance of the task. Do not move the lesson to evening or after dinner when the child is already tired \u2014 Mason explicitly considers this an offence against the child\u2019s physiology.",
    tags: ['child_resists_lesson', 'child_fidgets', 'lesson_running_long', 'parent_frustrated'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyPracticePattern.cm.002',
    _type: 'pedagogyPracticePattern' as const,
    framework: CM_REF,
    triggerTitle: 'Child becomes completely absorbed in something unrelated to the plan',
    triggerContext: 'The parent has a plan for the morning, but the child is deeply engaged in something else \u2014 watching ants, reading a book that wasn\u2019t assigned, drawing, building something.',
    traditionResponse: "This is not a problem for Mason. The deep absorption is itself education \u2014 it is the child\u2019s mind feeding on ideas appropriate to it. The parent\u2019s role here is \u201Cmasterly inactivity,\u201D which is one of Mason\u2019s signature operational concepts.\n\nMasterly inactivity is not laziness. It is a disciplined restraint: the parent is watchful and present, but does not interrupt, does not narrate the child\u2019s activity back to them, does not praise (\u201CWow, you\u2019re really concentrating!\u201D), and does not redirect. The attention is being formed \u2014 the worst thing the parent can do is break it. Mason elsewhere writes that the perpetual cackle of adults leaves the child no space to wonder and grow.\n\nAfter the child\u2019s absorption has run its natural course, Mason would recommend a light, open question that invites narration: \u201CTell me what you saw.\u201D Not a quiz, not a test \u2014 an invitation. If the child tells back at length, the learning is consolidated. If the child doesn\u2019t want to, that is also fine. The plan for the morning can move to the afternoon or the next day. Mason\u2019s scheduling is firm but not rigid.",
    antiPattern: "Do not praise the concentration while it\u2019s happening. Do not photograph and share it while it\u2019s happening. Do not announce to the child that \u201Cthis counts\u201D for their lessons. Do not reframe the spontaneous interest into a formal project. All of these collapse the authentic attention into performance.",
    tags: ['child_deeply_focused', 'parent_considering_interrupting', 'planned_lesson_displaced', 'spontaneous_interest', 'long_concentration_observed'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyPracticePattern.cm.003',
    _type: 'pedagogyPracticePattern' as const,
    framework: CM_REF,
    triggerTitle: 'Parent feels the day was unproductive because plans were abandoned',
    triggerContext: 'The Logger entry indicates a day where the planned structure didn\u2019t happen \u2014 the parent is writing it up with a sense of failure or inadequacy.',
    traditionResponse: "Mason\u2019s entire educational philosophy rejects the equation of productivity with coverage. The three instruments of education are atmosphere, habit, and living ideas \u2014 none of which require a checklist. A day spent outdoors with real things and real people, with the parent cheerful and present and the child freely engaged, is a day in which education is proceeding exactly as Mason prescribes.\n\nThe most important thing the parent can hear in this moment is that Mason herself would have counted the day a success if the children encountered real things, heard living language, spent time outdoors, and were treated as persons. She explicitly writes that nature knowledge is the most important knowledge for young children, and that a day of sight-seeing, picture-painting, and discriminating observation is a day of substantial education.\n\nThe secondary guidance is for the parent\u2019s own inner life: the instrument you are using is not a plan, it is yourself. Your attention, your cheerfulness, your restraint, your presence \u2014 these are the teaching. The plan is a scaffold for those things, not a replacement for them.",
    antiPattern: "Do not recommend that the parent \u201Ccatch up tomorrow\u201D \u2014 this reinforces the coverage framing Mason rejects. Do not list what was accomplished informally to \u201Cprove\u201D the day counted \u2014 this performs the same accounting the tradition doesn\u2019t value. Do not offer a productivity hack. The right response is to reframe what productivity means in this tradition.",
    tags: ['parent_feels_inadequate', 'parent_abandoned_plan', 'unstructured_day_logged', 'parent_burnout', 'comparison_to_structured_days'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyPracticePattern.cm.004',
    _type: 'pedagogyPracticePattern' as const,
    framework: CM_REF,
    triggerTitle: 'Child produces a short, thin narration after a reading',
    triggerContext: 'Parent read a passage aloud and asked the child to tell it back. The child\u2019s narration was much shorter or less detailed than the parent expected.',
    traditionResponse: "First, the narration Mason cares about is single-reading. She insists that passages be read only once, and that narration follow immediately. The effort of attention, knowing there is no second chance, is part of the method. If the parent is comparing the child\u2019s narration to what they would produce themselves having read it twice, the comparison is unfair.\n\nSecond, short narrations are often right. Mason does not value length; she values whether the child has made the ideas their own. A child who restates the central incident of a chapter in three sentences has narrated. The test is not completeness but whether the child is speaking from their own grasp.\n\nThird, thinness in narration over time is sometimes a signal that the reading material is above the child\u2019s current living grasp \u2014 not their decoding, but their capacity to make the ideas their own. Mason\u2019s remedy is not to change the method but to check the material. A shorter, richer passage read once and well-narrated is a full lesson. A longer, thinner passage poorly narrated is a failed lesson no matter how much ground was covered.\n\nFourth, narration is a habit that strengthens with practice. Early narrations are often stilted or very brief. This is normal. The mother does not correct, coach, or interrupt \u2014 she accepts the narration as offered, and asks for narration again tomorrow with a fresh passage.",
    antiPattern: "Do not re-read the passage and ask again. Do not prompt with \u201CWhat about the part where...?\u201D Do not correct factual mistakes in the narration during the narration itself. Do not grade or assess narration. Mason would consider all of these offences against the method.",
    tags: ['narration_was_short', 'narration_was_thin', 'parent_expected_more', 'reading_aloud_session', 'comprehension_concern'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyPracticePattern.cm.005',
    _type: 'pedagogyPracticePattern' as const,
    framework: CM_REF,
    triggerTitle: 'Child is bored and complains there is nothing to do',
    triggerContext: 'Logger entry or parent note indicates the child is bored, restless, or asking to be entertained.',
    traditionResponse: "Mason would treat this with some seriousness but without alarm. Her framing is that a child who has been over-entertained, over-directed, and over-stimulated loses the capacity to occupy themselves. The restoration is slow and goes through a period of apparent dullness before authentic interest re-emerges.\n\nThe operational guidance is masterly inactivity combined with access. Put the child in a rich environment \u2014 outdoors ideally, or in a room with real books (not twaddle), real materials (clay, paints, a garden), and the presence of an unhurried adult \u2014 and then do not direct. Do not propose activities. Do not suggest screens or structured play. The parent is not being unkind by refusing to entertain; they are restoring the child\u2019s capacity to meet their own interest.\n\nMason also writes about the \u201Cblas\u00e9\u201D child \u2014 the child surfeited on wonders who has lost the ability to be curious about anything. The cure is to \u201Clet them alone for a bit, and then begin on new lines.\u201D New lines meaning real nature, real books, real handicrafts, real presence \u2014 not more stimulation, but different substance.\n\nThe third element is outdoor time. Mason\u2019s repeated point is that children need far more hours outdoors than contemporary parenting assumes \u2014 four to six hours on fine days. Boredom is often a symptom of insufficient outdoor life.",
    antiPattern: "Do not offer a screen. Do not propose a structured activity. Do not apologise to the child for the boredom. Do not take the complaint personally. Do not announce that you will play with them (unless the parent genuinely wants to \u2014 but the method does not require it).",
    tags: ['child_bored', 'child_demands_entertainment', 'restless_child', 'indoors_too_long', 'screen_request'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyPracticePattern.cm.006',
    _type: 'pedagogyPracticePattern' as const,
    framework: CM_REF,
    triggerTitle: "Parent wants to measure progress and feels Mason\u2019s method gives no metrics",
    triggerContext: 'Parent is anxious about whether the child is "learning enough" and is looking for markers of progress that the CM method does not obviously provide.',
    traditionResponse: "Mason does give markers \u2014 they are just different from the markers of a conventional curriculum. The primary markers are:\n\nFirst, the quality of narration. A child who narrates with increasing fullness, accuracy, and voice over months is learning. Narration is not a side practice; it is the primary assessment instrument of the method. A narration journal (even informal) is the CM family\u2019s best measurement tool.\n\nSecond, the habit of attention. A child who can attend to a short lesson, a story, or a nature observation with focus is a child whose mental habits are strengthening. This is visible in the Logger\u2019s engagement data and in the parent\u2019s own observations.\n\nThird, the child\u2019s relationships \u2014 the \u201Cscience of relations\u201D \u2014 with things and ideas. Is the child naming more wildflowers than three months ago? Recognising more birds? Drawing more carefully? Asking questions that imply deeper grasp? These are real progress in the Mason frame.\n\nFourth, habits of body and mind. Is the child\u2019s copywork neater? Is the handwriting forming? Can the child sit still for a reading that six months ago they couldn\u2019t? These habits are the CM equivalent of scope-and-sequence mastery.\n\nWhat Mason does not value, and what she actively warns against, is testing as a driver of learning. The examination at the end of term is narration-based and concrete, not test-based.",
    antiPattern: "Do not import grade-level benchmarks from a conventional curriculum and measure against them. Do not introduce timed tests. Do not compare the child\u2019s progress to another child\u2019s. Do not apologise for Mason\u2019s method as being \u201Cunrigorous\u201D \u2014 the rigour is present, it is just located in habits and narrations rather than in test scores.",
    tags: ['parent_seeking_metrics', 'parent_compares_to_school', 'progress_anxiety', 'HEU_report_preparation', 'term_review'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyPracticePattern.cm.007',
    _type: 'pedagogyPracticePattern' as const,
    framework: CM_REF,
    triggerTitle: 'Child shows deep interest in a topic not currently in the curriculum',
    triggerContext: 'Child is suddenly very interested in ancient Egypt, or insects, or trains, or a historical person, and the planned curriculum is on something else.',
    traditionResponse: "Follow the interest. Mason\u2019s science of relations is exactly this: a child has formed a living connection with ancient Egypt, and the mother\u2019s job now is to feed that connection while it\u2019s warm. A week from now Ava may have moved on, and a week from now the fractions will still be there waiting \u2014 but the appetite for Egypt is present today and will not be present indefinitely.\n\nThe mathematics does not need to stop entirely. Mason ran many subjects in parallel in short lessons, and fractions can have their fifteen minutes each morning. But the big energy of the week should bend toward Egypt: find a living book on the topic (not a \u201Cfacts about\u201D book, a real writer telling the story), read a chapter aloud and ask the child to narrate, let them look at pictures of the Rosetta Stone or the pyramids, let them copy out a phrase in hieroglyphs if they want to, let them find Egypt on the map and trace the Nile. If there is a museum with Egyptian artefacts within a day\u2019s travel, this is the week to go.\n\nWhen the interest fades, let it fade. The goal is not to exhaust the topic but to honour the relationship. Mason\u2019s view of the mind as a spiritual organism with an appetite means that interests rise and fall by their own inner logic, and the parent\u2019s job is to feed them while they\u2019re present, not to schedule them.",
    antiPattern: "Do not turn the interest into a project with milestones. Do not tell the child to wait until the current topic is finished. Do not document the interest into a performance. Do not press the interest beyond its natural duration.",
    tags: ['child_deeply_interested_in_topic', 'child_asking_many_questions_about_something', 'spontaneous_research', 'off_curriculum_engagement'],
    suggestedDraft: false,
    status: 'published',
  },
];

// ---------------------------------------------------------------------------
// Layer 3 — Observational Markers (6)
// ---------------------------------------------------------------------------

const OBSERVATIONAL_MARKERS = [
  {
    _id: 'pedagogyObservationalMarker.cm.001',
    _type: 'pedagogyObservationalMarker' as const,
    framework: CM_REF,
    markerName: 'Quality of Narration',
    whatItIndicates: "The child\u2019s ability to retell a reading, an observation, or an experience in their own words, with appropriate detail, structure, and voice, is Mason\u2019s single most important evidence of learning. Rich narration means the ideas have been made the child\u2019s own \u2014 they are not merely decoded but assimilated. Thin or stilted narration early in the practice is normal and not alarming; what matters is the trajectory over weeks and months.",
    markersToLookFor: [
      'Length and fullness appropriate to age and stage (roughly: a 6-year-old narrating half a minute, a 9-year-old narrating three minutes, a 12-year-old narrating five minutes)',
      'Accurate retention of the key incidents',
      'Voice and personality entering the retelling \u2014 the child is not reciting, they are telling',
      'Use of vocabulary from the original passage without robotic repetition',
      "Ability to narrate a single-reading passage (CM\u2019s signature constraint)",
      'Narration extending to nature observation, not only to readings',
    ],
    tags: ['oral_language', 'comprehension', 'memory', 'composition', 'attention'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyObservationalMarker.cm.002',
    _type: 'pedagogyObservationalMarker' as const,
    framework: CM_REF,
    markerName: 'Habit of Attention',
    whatItIndicates: "The sustained capacity to focus on a single thing \u2014 a lesson, a reading, a living creature, a piece of handwork \u2014 without fidgeting, mind-wandering, or giving up. Mason considers this the master habit from which most other intellectual habits flow. She warns that a wandering mind is a mind at the mercy of associations, and that the habit of attention must be formed deliberately, in short lessons, through the calm expectation that attention will happen.",
    markersToLookFor: [
      'Child can attend to a short lesson (15\u201320 min for younger, 30+ for older) without being called back',
      'Child notices details in observation that a less attentive child would miss',
      'Child can sit with a book and really read, not just flip pages',
      'Child returns to the same task across days if it is unfinished',
      'Child can be in silence without filling it',
    ],
    tags: ['attention', 'executive_function', 'self_regulation'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyObservationalMarker.cm.003',
    _type: 'pedagogyObservationalMarker' as const,
    framework: CM_REF,
    markerName: 'Discriminating Observation (Nature)',
    whatItIndicates: "The child\u2019s capacity to see nature with precision and discernment \u2014 not \u201Ca bird\u201D but \u201Ca chaffinch\u201D, not \u201Ca leaf\u201D but \u201Ca sycamore leaf\u201D, not \u201Cthe pond\u201D but \u201Cthe pond with three cows at the far edge and yellow water-lilies round the rim.\u201D Mason values this as both a trainable habit and the foundation of all later scientific capacity.",
    markersToLookFor: [
      'Child names and distinguishes species (flowers, birds, trees) rather than using generic terms',
      'Child notices change over time in familiar places (seasons, growth, weather)',
      'Child draws what they see with accuracy appropriate to age \u2014 not stylised, but observed',
      'Child\u2019s nature diary or drawings show increasing discrimination over weeks',
      'Child spontaneously comments on features others miss',
    ],
    tags: ['scientific_observation', 'biology', 'environmental_awareness', 'visual_discrimination', 'drawing'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyObservationalMarker.cm.004',
    _type: 'pedagogyObservationalMarker' as const,
    framework: CM_REF,
    markerName: 'Habits of Body and Moral Habit',
    whatItIndicates: "Mason considered certain everyday habits \u2014 personal cleanliness, neatness, obedience, truthfulness, perfect execution of work undertaken \u2014 as the structural scaffolding of character. These are not nags; in her view they are brain-level changes that make later virtue possible. Observable progress in these everyday habits is evidence that the child\u2019s character is being formed.",
    markersToLookFor: [
      'Child follows through on "do the next thing" without being asked repeatedly',
      'Work (copywork, drawing, handicraft) completed without careless smudges or rushed endings',
      'Child tells the truth in small matters',
      'Child responds to a first "please do X" from the parent rather than requiring repetition',
      'Child puts things away without being prompted',
      'Personal care habits appropriate to age (dressing, hand-washing) are consistent',
    ],
    tags: ['self_regulation', 'executive_function', 'fine_motor', 'personal_responsibility'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyObservationalMarker.cm.005',
    _type: 'pedagogyObservationalMarker' as const,
    framework: CM_REF,
    markerName: 'Relationships Formed (Science of Relations)',
    whatItIndicates: "Mason\u2019s \u201Cscience of relations\u201D is the cumulative web of living connections the child has formed with things, people, ideas, times, and places. A child who knows six trees by name, three birds, two poems by heart, a period of history, a country on the map, and a musical piece has formed relations. Mason measures education by the density and quality of these relations, not by test scores.",
    markersToLookFor: [
      'Count and variety of things the child can name, identify, or describe in a familiar domain',
      'Personal connection to particular poems, songs, paintings, or historical figures ("favourite" items that the child returns to)',
      'Spontaneous reference to past learning in new contexts ("that\u2019s the same bird we saw by the creek last autumn")',
      'Expanding map of familiar places \u2014 both local and remote \u2014 that the child "knows" in some meaningful sense',
      'The child\u2019s own growing list of "things I care about"',
    ],
    tags: ['general_knowledge', 'memory', 'cross_domain_connection', 'personal_engagement'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyObservationalMarker.cm.006',
    _type: 'pedagogyObservationalMarker' as const,
    framework: CM_REF,
    markerName: 'The Way of the Will',
    whatItIndicates: "Mason\u2019s careful treatment of the will distinguishes \u201CI want\u201D from \u201CI will\u201D \u2014 the ability to choose and persist in what one has willed, including against immediate preference. She explicitly treats this as a higher faculty than intellect and considers its cultivation more important than any academic subject. Observable signs of a strengthening will are markers of deep educational progress.",
    markersToLookFor: [
      'Child can stay with a task they chose even when it becomes hard',
      'Child can wait for a promised reward or outing without asking repeatedly',
      'Child turns away from a temptation without being forbidden',
      'Child returns to an unfinished piece of work after an interruption rather than abandoning it',
      'Child can take a small "no" from the parent without collapse \u2014 evidence the will is becoming self-governing, not externally governed',
      'Over time, the child shows less flailing between impulses',
    ],
    tags: ['self_regulation', 'executive_function', 'persistence', 'moral_reasoning'],
    suggestedDraft: false,
    status: 'published',
  },
];

// ---------------------------------------------------------------------------
// Layer 4 — Facilitation Vocabulary (1 singleton)
// ---------------------------------------------------------------------------

const FACILITATION_VOCABULARY = [
  {
    _id: 'pedagogyFacilitationVocabulary.cm',
    _type: 'pedagogyFacilitationVocabulary' as const,
    framework: CM_REF,
    verbs: [
      { verb: 'Set the feast', meaning: 'Provide rich material \u2014 living books, real things, real places, real music, real art \u2014 and then let the child eat as they will. The parent is the curator of a generous table, not the feeder of spoonfuls.' },
      { verb: 'Form a habit', meaning: 'Deliberately and calmly repeat an expectation until the brain structure adjusts. This is different from enforcing a rule. The parent forms habits without heat and without lecture.' },
      { verb: 'Withdraw', meaning: 'After the feast is set and the lesson begun, the parent actively steps back. Masterly inactivity is not absence \u2014 the parent is present, watchful, ready \u2014 but not directing.' },
      { verb: 'Read aloud once', meaning: 'The book is opened, the passage read with care and voice, and then closed. The child knows there is no second reading and listens accordingly.' },
      { verb: 'Invite narration', meaning: 'After a reading or observation, the parent says simply "Tell me about it" or "What did you see?" \u2014 not a quiz, an invitation.' },
      { verb: 'Correct in the moment', meaning: 'A careless bit of copywork is corrected right then, not at the end of a session full of careless work. The habit of perfect execution is formed by not letting imperfect work pass unnoticed.' },
      { verb: 'Let alone', meaning: 'When a child is absorbed, the parent does not speak. This is active discipline, not passive neglect.' },
    ],
    characteristicRestraints: [
      'Do not fill the silence after a narration. Wait. The child may add more, or may not. Both are fine.',
      'Do not praise the concentration. Naming it collapses it.',
      'Do not re-read the passage if the narration was short. Trust the single reading.',
      'Do not extend a short lesson because the child is doing well. Twenty minutes is twenty minutes. The habit of stopping at the right time is part of the method.',
      'Do not argue with a refusal. State the expectation calmly and do not negotiate.',
      'Do not use bribes or stickers. The reward for learning is learning.',
      'Do not chatter during a walk in nature. Mason explicitly calls the "perpetual cackle" of adults one of the great evils of modern education.',
    ],
    microScripts: [
      { situation: 'Before a lesson', script: "We\u2019ll read for ten minutes, then you\u2019ll tell me about it." },
      { situation: 'After a brief narration', script: 'Thank you. (And then nothing else.)' },
      { situation: 'When the child asks a question about what they\u2019re observing', script: 'What do you notice about it? (Not "Let me tell you about it.")' },
      { situation: 'When the child is staring at something in silence', script: '(Nothing. The parent stays present but does not speak.)' },
      { situation: 'When the child produces careless work', script: "Let\u2019s do that one again, carefully. (Not a lecture on effort.)" },
      { situation: 'When the child resists', script: "We\u2019re reading now. After that, we\u2019ll go outside. (Not an argument, not a bribe.)" },
    ],
    suggestedDraft: false,
    status: 'published',
  },
];

// ---------------------------------------------------------------------------
// Layer 5 — Contraindications (5)
// ---------------------------------------------------------------------------

const CONTRAINDICATIONS = [
  {
    _id: 'pedagogyContraindication.cm.001',
    _type: 'pedagogyContraindication' as const,
    framework: CM_REF,
    warnedAgainst: 'The dedicated "schoolroom" or child-adapted environment',
    traditionReasoning: "Mason explicitly rejects the notion that the child needs a prepared \u201Cchild environment.\u201D Her view is that the child is a person belonging to an altogether higher estate than ours, and that \u201Cit stultifies a child to bring down his world to the \u2018child\u2019s\u2019 level.\u201D The home itself \u2014 with adult conversation, real tools, real books, real art on the walls \u2014 is the proper educational atmosphere. A schoolroom adapted for the child is a diminishment, not an enrichment.\n\nTension with other traditions: This is a direct point of disagreement with Montessori, whose prepared environment is foundational. Both traditions have coherent internal reasoning for their positions. An Eclectic family should understand that they are choosing between two genuinely different theories of what environment does, not splitting the difference.",
    tags: ['environment', 'atmosphere', 'anti_child_centric', 'montessori_tension'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyContraindication.cm.002',
    _type: 'pedagogyContraindication' as const,
    framework: CM_REF,
    warnedAgainst: 'Twaddle',
    traditionReasoning: "Mason considered twaddle an active harm. The mind is an organism with an appetite for real ideas, and feeding it thin, condescending material stunts that appetite just as a diet of candy would stunt bodily growth. The child who resists twaddle is often showing correct intellectual judgement, not bad attitude.\n\nTension with other traditions: Classical educators share this concern and use the same vocabulary. Unschoolers generally trust the child to self-select away from twaddle. Charlotte Mason is stricter than Montessori about the content side and gentler than Classical about the structure side.",
    tags: ['twaddle', 'living_books', 'anti_dumbing_down', 'content_quality'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyContraindication.cm.003',
    _type: 'pedagogyContraindication' as const,
    framework: CM_REF,
    warnedAgainst: 'Over-talk and the "perpetual cackle"',
    traditionReasoning: "Mason names this directly as one of the great evils of modern education. The child needs space and silence in which to wonder and grow. A parent who cannot stop talking is, however lovingly, crowding out the inner life the child is trying to form.\n\nTension with other traditions: Almost all of Hearth\u2019s supported pedagogies share some version of this concern \u2014 Montessori has the \u201Csilent period\u201D principle, Waldorf emphasises restrained adult presence, Unschooling values not-directing. Mason is the most explicit about the role of silence as an active educational instrument.",
    tags: ['silence', 'parental_restraint', 'over_talk', 'wonder'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyContraindication.cm.004',
    _type: 'pedagogyContraindication' as const,
    framework: CM_REF,
    warnedAgainst: 'Overpressure through wrong work, not through amount',
    traditionReasoning: "Mason\u2019s point is that a child is inexhaustible in seeing, examining, narrating, and making relations with real things. The exhaustion and resistance attributed to \u201Ctoo much\u201D is actually \u201Ctoo much of the wrong thing\u201D \u2014 dry exercises, twaddle, disconnected facts, tests. The cure is not less curriculum but richer curriculum.\n\nTension with other traditions: This runs against Unschooling in a mild way (Unschooling would simply let the child choose) and against the gentler end of Waldorf (which might hold back material to avoid intellectual overstimulation). It agrees with Classical on the richness of curriculum but disagrees with any Classical practice that leans heavily on drill.",
    tags: ['overpressure', 'rich_curriculum', 'anti_drill', 'wrong_work'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyContraindication.cm.005',
    _type: 'pedagogyContraindication' as const,
    framework: CM_REF,
    warnedAgainst: 'External rewards and punishments',
    traditionReasoning: "Mason\u2019s view of the will treats extrinsic motivation as fundamentally corrupting of the will\u2019s development. A child who learns to do their lessons for a sticker has not formed the habit of attention; they have formed the habit of performing for stickers. When the sticker is removed, the habit collapses. Mason is emphatic that the reward for learning is learning, and the consequence of habit is the ease that habit brings.\n\nTension with other traditions: This is one of Mason\u2019s sharpest points. Contemporary behavioural approaches commonly used in mainstream schooling run directly counter to it. Eclectic families who blend CM with reward-chart-based approaches should understand that they are blending approaches that Mason would consider incompatible at the level of the will.",
    tags: ['external_rewards', 'stickers', 'bribes', 'will', 'intrinsic_motivation'],
    suggestedDraft: false,
    status: 'published',
  },
];

// ---------------------------------------------------------------------------
// Layer 6 — Worked Examples (6)
// ---------------------------------------------------------------------------

const WORKED_EXAMPLES = [
  {
    _id: 'pedagogyWorkedExample.cm.001',
    _type: 'pedagogyWorkedExample' as const,
    framework: CM_REF,
    scenario: "Emma (5) spent forty minutes sitting by the creek at the end of the garden this morning. She had been told she could go outside while her mother finished a phone call. When the mother looked out, Emma had not moved from the spot. She said later, \u201CI was watching the water strider. There were three of them and then four and then one went away and it was only three again.\u201D The mother was not sure whether to \u201Ccount this\u201D as a science lesson or not.",
    interpretationInTraditionVoice: "This was a science lesson, and a better one than most her mother could have planned. Emma sat still and watched real creatures in their own element, and she came away with an observation: three, then four, then three again. That small piece of counting-in-context is worth more than a worksheet of sums because it was the child\u2019s own finding from her own looking at her own water strider. The habit of attention was forming in those forty minutes, and the habit of attention is the master habit that makes all later learning possible.\n\nThe mother did exactly right by not calling Emma in, and would do right again by not now pressing her to \u201Ctell everyone what she saw\u201D at dinner, or by turning the incident into a project about water striders. The right move is to get Emma a small notebook, and perhaps next week when the weather allows, to say simply \u201CShall we go and see the creek again?\u201D If Emma wants to draw a water strider, that is perfect. If she wants to name them, tell her the name. If she just wants to sit again, let her sit again. The creek has become a relation now, and relations are exactly what an education consists of.",
    tags: ['scientific_observation', 'attention', 'biology', 'outdoor_free_observation', 'age_4_to_6'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyWorkedExample.cm.002',
    _type: 'pedagogyWorkedExample' as const,
    framework: CM_REF,
    scenario: "The mother read aloud the chapter of Paddington in which Paddington goes to the bank. She asked Liam (7) to tell her what happened. Liam said: \u201CPaddington went to the bank. He wanted some money. Then he did something silly.\u201D She had expected more and was disappointed. She reread the chapter that afternoon thinking she would ask again more carefully.",
    interpretationInTraditionVoice: "The narration the mother got was the narration the child made. Liam captured the central incident \u2014 Paddington went to the bank and did something silly \u2014 and that is the armature of the chapter. He may not have named what the silly thing was, and the narration was shorter than the mother wished, but the essential thing happened: the child made the chapter his own in three sentences of his own language.\n\nThe mother should not re-read the chapter. Re-reading would signal that Liam\u2019s first listening was insufficient, and the whole power of narration rests on the child\u2019s knowing the reading is a single reading. It is the effort of attention under the knowledge of finality that is educative. Re-reading softens this and teaches the child that narrations can be improved by second chances \u2014 which is the opposite of what is wanted.\n\nShe should also not be disappointed. Seven is young, narrations are often brief at this age, and the trajectory over months matters more than any single short narration. Tomorrow she reads another chapter. The day after, another. The habit of narration is forming, and in six months Liam\u2019s retellings will surprise her. \u201CA thing done once is a thing done well, and a thing done every day is a thing done forever.\u201D",
    tags: ['oral_language', 'comprehension', 'memory', 'attention', 'read_aloud_and_narration', 'age_6_to_8'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyWorkedExample.cm.003',
    _type: 'pedagogyWorkedExample' as const,
    framework: CM_REF,
    scenario: "The mother sat down to do a short copywork lesson with Sophie (8). Sophie wrote out the first line carefully, then rushed the second line with smudges and uneven letters. The mother was unsure whether to correct in the moment or to finish the lesson and discuss it afterwards.",
    interpretationInTraditionVoice: "Correct in the moment, gently and without heat. Mason considered the habit of perfect execution one of the critical brain-forming habits of the years between six and nine, and her operational rule was that an imperfect piece of work should never be allowed to pass as finished. The correction is not a punishment; it is the mother\u2019s refusal to let the child form the habit of turning out careless work.\n\nThe script is simple: \u201CLet\u2019s do that line again, carefully.\u201D No lecture on effort. No explanation of why neat handwriting matters. No sticker for the corrected line. Just the expectation that when we write, we write well, and the calm, consistent re-doing of the second line.\n\nIf Sophie is tired and the second line is the sixth line of a long session, the problem is not the child but the length of the session. Mason\u2019s short lessons for this age are ten to fifteen minutes of copywork \u2014 any more and the habit being formed is the habit of getting through, not the habit of careful execution. Shorten the lesson next time and observe whether the careless second line appears at the same place in the pattern.\n\nAlso \u2014 and this is not minor \u2014 the material matters. Sophie should be copying a sentence worth copying. A line of living literature, a piece of a psalm, a phrase from a favourite poem. Not a sentence from a worksheet about spelling patterns. The quality of the line she copies is part of what her attention is being formed around.",
    tags: ['handwriting', 'attention', 'executive_function', 'fine_motor', 'copywork', 'age_7_to_9'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyWorkedExample.cm.004',
    _type: 'pedagogyWorkedExample' as const,
    framework: CM_REF,
    scenario: "It was raining. Jack (6) asked three times in an hour whether he could watch a show. His mother wanted to say no but felt guilty denying him entertainment on a rainy day. She was not sure what CM would say about this.",
    interpretationInTraditionVoice: "Say no, without guilt, and then put Jack in the way of real things. Mason would not hand him a screen, and she would not feel guilty about not handing it to him. Her view of boredom is that a child who has been over-entertained has lost the capacity to meet his own interest, and the cure is not more entertainment but the restoration of real occupation. The rainy day is an opportunity, not an obstacle.\n\nOperationally: let Jack into the kitchen with a lump of dough, or the coal bin with a drawing pad, or the bookshelf with three living books he has not yet met. Put him outdoors in proper rain clothes \u2014 Mason insists that wet weather walks are part of the full outdoor life, and some of the best observation a child can do is in the rain. Give him a bowl of water and some leaves and sticks and let him make currents. Turn on no screen. And then, crucially, withdraw. Do not propose activities, do not stay by him entertaining him, and do not apologise for the \u201Cboring\u201D day.\n\nIf Jack continues to ask for the screen, hold the position without argument. \u201CNo screen today. If you don\u2019t know what to do, come outside with me.\u201D The fourth request gets the same answer as the first. This is masterly inactivity in its most direct form \u2014 the parent is not unkind, not angry, just firm. And by the end of the afternoon, Jack will have found something \u2014 he will always find something \u2014 and that finding is the reform his inner life is asking for.",
    tags: ['self_regulation', 'attention', 'inner_life', 'boredom_management', 'age_5_to_7'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyWorkedExample.cm.005',
    _type: 'pedagogyWorkedExample' as const,
    framework: CM_REF,
    scenario: "The mother had planned a week of mathematics lessons focused on fractions using manipulatives. On day two, Ava (9) became fixated on a book about ancient Egypt that had been on the shelf unread for months. She was reading it at every spare moment and asking questions the mother could not answer. The mother felt torn between the plan and the interest.",
    interpretationInTraditionVoice: "Follow the interest. Mason\u2019s science of relations is exactly this: a child has formed a living connection with ancient Egypt, and the mother\u2019s job now is to feed that connection while it\u2019s warm. A week from now Ava may have moved on, and a week from now the fractions will still be there waiting \u2014 but the appetite for Egypt is present today and will not be present indefinitely.\n\nThe mathematics does not need to stop entirely. Mason ran many subjects in parallel in short lessons, and fractions can have their fifteen minutes each morning. But the big energy of the week should bend toward Egypt: find a living book on Egyptian history (not a \u201Cfacts about Egypt\u201D book, a real writer telling the story), read a chapter aloud and ask Ava to narrate, let her look at pictures of the Rosetta Stone or the pyramids, let her copy out a phrase in hieroglyphs if she wants to, let her find Egypt on the map and trace the Nile. If there is a museum with Egyptian artefacts within a day\u2019s travel, this is the week to go.\n\nThe questions Ava is asking that the mother cannot answer \u2014 these are the best evidence of authentic learning. The mother should not pretend to know the answers, and should not pretend to look them up for Ava either. The correct response is \u201CI don\u2019t know. Shall we find out together?\u201D or \u201CI don\u2019t know. See what the book says.\u201D This models for Ava that real learning often begins at the edge of what anyone in the room knows.\n\nWhen the interest fades \u2014 and it will fade \u2014 the mother returns gently to fractions, or moves on to something else that has arisen. The goal was never to complete a unit on Egypt. The goal was to honour the relation that formed. And the capability that grew during that week \u2014 the habit of reading to satisfy one\u2019s own question \u2014 is worth more than the fractions would have been.",
    tags: ['self_directed_learning', 'comprehension', 'history', 'curiosity', 'spontaneous_interest', 'age_8_to_10'],
    suggestedDraft: false,
    status: 'published',
  },
  {
    _id: 'pedagogyWorkedExample.cm.006',
    _type: 'pedagogyWorkedExample' as const,
    framework: CM_REF,
    scenario: "The mother is writing up a week in the Logger and realises the week did not go as planned. Two days were entirely unstructured because she had been unwell. One day the children had been to their grandmother\u2019s. Two days had rough morning lessons that tapered off by lunch. She is writing the week up with a heavy feeling that she is \u201Cfailing at homeschool.\u201D",
    interpretationInTraditionVoice: "The mother is measuring this week against a standard Mason herself would not have recognised. Her three instruments of education \u2014 atmosphere, habit, and living ideas \u2014 are not produced by completed lesson plans. They are produced by a home in which real people live thoughtfully alongside children, in which real things are encountered, in which real conversation and real silence both have their place. That happened this week, even on the days she counts as \u201Cfailed.\u201D\n\nThe two unstructured days in which the mother was unwell were not empty days. The children were in their own home, presumably with books and toys and windows and each other, and whatever they did with those hours was forming them in some way. The day at the grandmother\u2019s was not a homeschool day, it was a relationship-with-grandmother day, and Mason\u2019s science of relations counts that relation as educational substance. The two tapering morning lessons were partial lessons, yes, but a partial lesson is not a lost lesson \u2014 the short work that got done is the short work that got done.\n\nThe self-criticism the mother is directing at herself right now is one of the things Mason would most want her to stop doing. \u201CThinking love\u201D is not anxious love. It is the mother\u2019s own attention, cheerfulness, and disciplined restraint \u2014 and she cannot bring any of those to her children if she is busy prosecuting herself for a week that did not match an imagined ideal.\n\nThe only thing the Mason method asks the mother to do differently next week is not \u201Ctry harder\u201D but \u201Ctry the same, with less anxiety.\u201D If the atmosphere is warm, the habits are being formed calmly and consistently, and the children are encountering living things and living ideas \u2014 then the education is proceeding, whether or not the schedule ran clean.",
    tags: ['parent_reflection', 'parent_burnout', 'atmosphere', 'thinking_love', 'all_ages'],
    suggestedDraft: false,
    status: 'published',
  },
];

// ---------------------------------------------------------------------------
// Ingest all documents
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ALL_DOCS: Array<Record<string, any> & { _id: string; _type: string }> = [
  ...SOURCE_EXCERPTS,
  ...PRACTICE_PATTERNS,
  ...OBSERVATIONAL_MARKERS,
  ...FACILITATION_VOCABULARY,
  ...CONTRAINDICATIONS,
  ...WORKED_EXAMPLES,
];

async function run() {
  console.log(`Ingesting ${ALL_DOCS.length} Charlotte Mason PKB documents\u2026`);
  console.log(`  Source Excerpts:        ${SOURCE_EXCERPTS.length}`);
  console.log(`  Practice Patterns:      ${PRACTICE_PATTERNS.length}`);
  console.log(`  Observational Markers:  ${OBSERVATIONAL_MARKERS.length}`);
  console.log(`  Facilitation Vocab:     ${FACILITATION_VOCABULARY.length}`);
  console.log(`  Contraindications:      ${CONTRAINDICATIONS.length}`);
  console.log(`  Worked Examples:        ${WORKED_EXAMPLES.length}`);

  const BATCH_SIZE = 20;
  for (let i = 0; i < ALL_DOCS.length; i += BATCH_SIZE) {
    const batch = ALL_DOCS.slice(i, i + BATCH_SIZE);
    const tx = client.transaction();
    for (const doc of batch) {
      tx.createOrReplace(doc);
    }
    await tx.commit();
    console.log(`  Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} docs)`);
  }

  console.log('\nDone. Documents created:');
  for (const doc of ALL_DOCS) {
    console.log(`  \u2713 ${doc._id}`);
  }
}

run().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
