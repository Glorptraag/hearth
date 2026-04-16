// Per-thread post-save nudge templates.
// Used by TemplateNudgeProvider to surface one actionable "next time" line
// after an entry is saved. Template uses {name} as a placeholder for the
// primary learner's name.
// Covers the full thread taxonomy from enrich.ts VALID_THREAD_IDS.

export type ThreadNudge = {
  text: string;
};

export const THREAD_NUDGES: Record<string, ThreadNudge> = {
  // Literacy
  L1: { text: "Next time, try capturing a short quote — {name}'s exact words in conversation are the strongest oral communication evidence you can log." },
  L2: { text: "If {name} encounters a tricky word while reading aloud, note what they did — sounded it out, guessed, or asked. That moment tells us a lot about phonological awareness." },
  L3: { text: "After {name} finishes a book or passage, ask them to tell you what it was about in their own words. Write down one or two sentences of their retelling." },
  L4: { text: "Did {name} use any new or interesting words today? Capturing a specific word — even just one — builds a richer vocabulary thread over time." },
  L5: { text: "Next time {name} writes anything — a list, a label, a sentence — snap a photo or copy down a line. Written output is direct evidence for this thread." },
  L6: { text: "When {name} corrects their own spelling or edits a sentence, note it down. Self-correction is a strong signal of developing language control." },
  L7: { text: "Try asking {name} to retell what happened in a story or activity — their own sequencing and word choices reveal more than a summary ever could." },
  L8: { text: "If {name} shared an opinion or tried to convince you of something today, write down the gist of their argument. Persuasive thinking develops early." },
  L9: { text: "Next time {name} responds to a book — laughs, pauses, or asks 'why did they do that?' — that's literary appreciation worth capturing." },

  // Mathematics
  M1: { text: "If {name} counts, groups, or works with numbers next time, note what they were counting and whether they needed to recount — it tells us where they are with number sense." },
  M2: { text: "Next time {name} works out how many, how much, or how to share equally, write down their method — not just the answer. The strategy is the evidence." },
  M3: { text: "Did {name} split, halve, or measure portions of anything today? Next time, capture their language — 'half of', 'a bit more than' — it maps directly to fractional thinking." },
  M4: { text: "If {name} notices a pattern or makes a rule ('it always goes up by two'), write that down word-for-word — algebraic thinking starts long before algebra." },
  M5: { text: "Next time {name} measures — time, weight, height, capacity — note what tool they used and whether they understood what they were comparing." },
  M6: { text: "When {name} builds, draws, or arranges things spatially, a photo plus a sentence about what they were working out is excellent spatial reasoning evidence." },
  M7: { text: "If {name} makes a graph, tally, or sorts information, capture their interpretation — what they said the data 'shows' is the most valuable part." },
  M8: { text: "Next time chance or probability comes up ('I bet it will…', 'What are the chances…'), note {name}'s prediction and whether they were reasoning or just guessing." },
  M9: { text: "When {name} gets stuck on a problem and tries a different approach, write down what they changed — that pivot is mathematical modelling in action." },

  // Science
  S1: { text: "If {name} makes a prediction next time ('I think it will…'), write it down before the result — the gap between prediction and outcome is where inquiry lives." },
  S2: { text: "Next time {name} notices an animal or plant, capture what they observed specifically — what it looked like, moved, or did. Detail is the evidence for biological sciences." },
  S3: { text: "When {name} notices a change in a material — melting, mixing, dissolving — write down their explanation. Their 'why' reveals chemical sciences reasoning." },
  S4: { text: "If {name} builds, drops, pushes, or tests anything physical next time, note their prediction and reaction. Forces and energy learning often hides in play." },
  S5: { text: "Strong observation evidence comes from specific detail — next time, ask {name} to describe what they see before you tell them anything. Write their words down." },
  S6: { text: "When {name} notices something about the weather, landscape, or sky, ask them why they think it happens. Their explanations are earth and space science evidence." },
  S7: { text: "If {name} shows curiosity about how something works at a bigger scale — climate, ecosystems, resources — capture the question they asked. That's systems thinking." },

  // HASS
  H1: { text: "If {name} connects something today to 'before' or 'in the past', write down their exact framing — historical thinking starts with time language." },
  H2: { text: "Next time {name} questions where information comes from ('but how do we know?'), write it down. Source analysis reasoning is rare and worth capturing." },
  H3: { text: "When {name} talks about places — location, distance, what a place is like — note their language. Geographical understanding often surfaces in everyday conversation." },
  H4: { text: "If {name} talks about rules, fairness, or how a community should work, capture their reasoning. Civics understanding develops through these everyday discussions." },
  H5: { text: "Next time {name} reasons about needs vs wants, money, or resources, write down their thinking. Economics and business reasoning starts in these concrete moments." },
  H6: { text: "When {name} connects to a cultural practice, tradition, or heritage, note what they said or did. Cultural understanding evidence is often fleeting." },

  // HPE
  P1: { text: "Next time {name} runs, jumps, or climbs, note what they attempted and whether they challenged themselves — gross motor evidence comes from specifics, not just 'they played outside'." },
  P2: { text: "Fine motor evidence is strongest when specific — next time, note what {name} was making, cutting, or manipulating, and how independently they managed it." },
  P3: { text: "If {name} shows good balance, coordination, or body control next time, capture the context — what were they doing, and how did their body manage it?" },
  P4: { text: "When {name} plays a team game or group sport, note whether they followed rules, took turns, or managed a conflict. That's the evidence that matters for this thread." },
  P5: { text: "If {name} has a water safety moment — floating, stroke practice, entering safely — note what they did and what they understood about safety. Each is evidence." },

  // Personal and Social
  PS1: { text: "Next time {name} responds to someone else's feelings — a sibling upset, a character in a book, a friend's frustration — write down what they said or did." },
  PS2: { text: "When {name} navigates a social moment — sharing, compromise, joining a group — a single sentence describing what happened is strong evidence for social skills." },
  PS3: { text: "If {name} manages a big feeling next time — frustration, disappointment, overwhelm — write down what they did to regulate. That's the evidence for self-regulation." },
  PS4: { text: "When {name} talks about themselves, their strengths, or what they're good at, write it down. Identity and self-concept evidence is built from these small moments." },
  PS5: { text: "Next time {name} takes initiative, helps without being asked, or sees something through independently, capture the moment — that's responsibility evidence." },
  PS6: { text: "If {name} pushes through something hard next time — tries again, doesn't give up, reframes a setback — write what they said or did. Resilience lives in those details." },
  PS7: { text: "When {name} reasons about safety — checks before acting, identifies a risk, or follows a boundary — note what triggered the thinking. That's safety awareness evidence." },

  // Creative Arts
  C1: { text: "Next time {name} makes something visual — drawing, painting, collage — note what they were trying to make and any choices they described. That's visual art evidence." },
  C2: { text: "If {name} sings, hums, or responds to music next time, note what they did and whether they were keeping rhythm, recognising pitch, or just enjoying it." },
  C3: { text: "When {name} acts out a role, creates a scenario, or puts on a performance — even informally — write down the story or character they inhabited." },
  C4: { text: "If {name} moves expressively — dances, uses gestures, creates a movement sequence — note what they were expressing and how their body communicated it." },
  C5: { text: "When {name} engages with photography, video, or digital art, capture what they created and any decisions they made about how to frame or present it." },
  C6: { text: "Next time {name} designs and builds something — a structure, a device, a contraption — note their plan (even rough) and what problem they were solving." },
  C7: { text: "When {name} responds to art, music, or a performance — comments on it, asks questions, describes what they noticed — write down their words. That's arts appreciation." },

  // Executive Function
  EF1: { text: "Next time {name} stays with a single task for an extended stretch without prompting, note how long and what held their attention. Sustained focus evidence is specific." },
  EF2: { text: "If {name} needs to hold instructions in mind while doing something, note whether they remembered all the steps or needed reminders. That maps directly to working memory." },
  EF3: { text: "When {name} switches approach, tries something new after a failure, or adapts a plan mid-task, note the pivot. Cognitive flexibility evidence comes from those moments." },
  EF4: { text: "If {name} plans something before starting — lists steps, assembles materials, sketches a sequence — capture that planning behaviour specifically." },
  EF5: { text: "When {name} evaluates options, reasons through a decision, or questions an assumption, write down their reasoning. Critical thinking evidence is in the 'why'." },
  EF6: { text: "Next time {name} works alongside someone, note what role they took, how they contributed, and any moment of genuine collaboration — not just parallel play." },
  EF7: { text: "If {name} talks about their own thinking — 'I knew I should try it differently', 'I remembered from last time' — write that down. Metacognition is rare and powerful." },
  EF8: { text: "When {name} applies something from a previous experience to a new situation, capture the connection they made. Transfer of learning is the strongest evidence of deep understanding." },
};
