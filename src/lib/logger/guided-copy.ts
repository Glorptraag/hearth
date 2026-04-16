// Static "what we're noticing for" hints per logger section.
// Shown in Guided Mode only. Authored once; no LLM.
// Section IDs match the numbered sections in log/page.tsx:
//   1 = Who Was Learning, 2 = What Happened, 3 = How Did It Go,
//   4 = Context, 5 = Observations, 6 = Evidence

export type SectionId = 1 | 2 | 3 | 4 | 5 | 6;

export const GUIDED_SECTION_HINTS: Record<SectionId, string> = {
  1: 'Knowing who was there lets the snapshot build a picture for each child individually.',
  2: 'The description is the richest signal we have — specific details unlock stronger capability evidence than general summaries.',
  3: 'Engagement patterns across entries reveal a child\'s motivational profile. Extremes (loved it / struggled) paired with discoveries are especially valuable.',
  4: 'Setting and duration help contextualise the learning. A 5-minute deep focus at the table reads differently from an hour of outdoor exploration.',
  5: 'Parents who capture *what* a child was doing when they focused build stronger capability evidence over time. One concrete chip + detail beats three vague chips.',
  6: 'Evidence anchors the snapshot in real artefacts. Even a photo of a page or a rough quote counts.',
};
