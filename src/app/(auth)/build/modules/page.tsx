'use client';

import { useState, useEffect } from 'react';

type Pathway = 'material' | 'process' | 'inquiry' | 'retrospective' | 'goal';

const RESOURCE_TYPES = [
  { id: 'book', label: '📚 Book' },
  { id: 'video', label: '🎬 Video' },
  { id: 'kit', label: '🧰 Kit' },
  { id: 'app', label: '📱 App' },
  { id: 'place', label: '📍 Place' },
  { id: 'audio', label: '🎵 Audio' },
  { id: 'other', label: '📦 Other' },
];

const USAGE_INTENTS = [
  { id: 'read', label: '📖 Read / watch together' },
  { id: 'inspire', label: '🎨 Inspiration for a project' },
  { id: 'explore', label: '🔍 Explore a topic' },
  { id: 'discuss', label: '🗣️ Discuss and reflect' },
  { id: 'do', label: '🧪 Do the activity / experiment' },
  { id: 'write', label: '✍️ Writing / drawing starting point' },
  { id: 'memorise', label: '🧠 Memorise / learn by heart' },
];

type TemplateStep = { title: string; instructions: string; observationHint: string };
type TemplateKey = string;
const SESSION_TEMPLATES: Record<string, Record<TemplateKey, TemplateStep[]>> = {
  book: {
    'read': [
      { title: 'Before reading', instructions: 'Look at the cover together. What do you think this will be about?', observationHint: 'Notice what predictions they make and what details they pick up on' },
      { title: 'Read aloud', instructions: 'Read through the book together. Pause at natural points to wonder aloud.', observationHint: 'Watch for questions they ask or connections they make' },
      { title: 'Talk about it', instructions: 'Ask what they noticed, what surprised them, or what they want to know more about. Follow their lead.', observationHint: 'Listen for new understanding — are they connecting the story to the wider world?' },
      { title: 'Extend', instructions: 'Choose an activity inspired by the book to deepen the learning.', observationHint: 'Notice which ideas from the book they carry into the activity' },
    ],
    'inspire': [
      { title: 'Read together', instructions: 'Read the book. As you go, wonder aloud: what could we make or do inspired by this?', observationHint: 'Notice which ideas they respond to most' },
      { title: 'Plan the project', instructions: 'Choose one idea. What will you need? How will you start?', observationHint: 'Watch for planning skills — can they break it into steps?' },
      { title: 'Create', instructions: 'Make the project inspired by the book content.', observationHint: 'Notice problem-solving and creative choices' },
      { title: 'Connect back', instructions: 'How does your creation connect to the book? What did you learn by making it?', observationHint: 'Listen for connections between the story and their project' },
    ],
    'explore': [
      { title: 'Introduce the topic', instructions: 'Read the book together. Then ask: what do we want to find out more about?', observationHint: 'Notice what questions they form' },
      { title: 'Investigate', instructions: 'Explore the topic the book introduced — through experiments, observation, or research.', observationHint: 'Watch for curiosity and sustained attention' },
      { title: 'Record findings', instructions: 'Draw, write, or photograph what you discovered.', observationHint: 'Notice the detail in their recording' },
      { title: 'Share', instructions: 'Present your findings to someone — a family member, a friend, or a stuffed animal audience.', observationHint: 'Listen for how they explain what they learned in their own words' },
    ],
    'discuss': [
      { title: 'Read together', instructions: "Read the book aloud. Don't rush — let silences happen.", observationHint: 'Watch for emotional reactions, laughter, confusion' },
      { title: 'First impressions', instructions: 'What did you think? What was the best part? Anything you didn\'t like?', observationHint: 'Notice whether they express opinions or wait for yours' },
      { title: 'Go deeper', instructions: 'Ask 2–3 questions that explore the themes of the book more deeply.', observationHint: "Listen for reasoning — are they supporting their views with evidence from the story?" },
      { title: 'Personal connection', instructions: 'Has anything like this happened to you? What would you have done?', observationHint: 'Watch for empathy and perspective-taking' },
    ],
    'write': [
      { title: 'Read and notice', instructions: 'Read the book together. Pay attention to the illustrations, the language, or the structure.', observationHint: 'Notice what they respond to — the words, the pictures, or the story shape' },
      { title: 'Choose a starting point', instructions: 'What would you like to write or draw? A new ending, a different character, a picture of your favourite scene, your own version?', observationHint: 'Watch for creative initiative — do they need prompting or jump in?' },
      { title: 'Create', instructions: "Write, draw, or both. There's no wrong way.", observationHint: 'Notice their process — are they planning or discovering as they go?' },
      { title: 'Share and celebrate', instructions: 'Read it aloud or show your drawing. What are you most proud of?', observationHint: 'Listen for confidence and self-awareness about their creative choices' },
    ],
    'memorise': [
      { title: 'First encounter', instructions: 'Read the passage together slowly. What stands out? What do they notice?', observationHint: 'Notice which phrases catch their attention naturally' },
      { title: 'Understand it', instructions: 'Talk about what it means. Ask: what is this saying in your own words?', observationHint: 'Listen for comprehension — can they paraphrase before memorising?' },
      { title: 'Start learning it', instructions: 'Read it aloud together 2–3 times. Try covering a line and seeing if they can fill in the missing words.', observationHint: 'Watch for which sections they pick up quickly and which need more repetition' },
      { title: 'Practice and celebrate', instructions: 'Over the next few days, practise together. When they can say it from memory, celebrate!', observationHint: 'Notice their confidence growing — are they reciting with meaning or just words?' },
    ],
  },
  video: {
    'inspire': [
      { title: 'Watch a segment', instructions: 'Watch together. Pause when something sparks an idea.', observationHint: 'Notice what excites them — what do they want to try or make?' },
      { title: 'Plan the project', instructions: 'What did the video inspire? Choose a project. What do you need?', observationHint: 'Watch for connections between what they saw and what they want to create' },
      { title: 'Create', instructions: 'Make the project inspired by the video content.', observationHint: 'Notice whether they reference what they watched as they work' },
      { title: 'Reflect', instructions: 'How is your project connected to what we watched? What did you learn by doing it?', observationHint: 'Listen for transfer — are they applying ideas from the video?' },
    ],
    'explore': [
      { title: 'Pre-watch questions', instructions: 'What do you already know about this topic? What do you expect to learn?', observationHint: 'Notice their prior knowledge and assumptions' },
      { title: 'Watch together', instructions: 'Watch the relevant section. Pause to discuss or replay moments that surprise.', observationHint: 'Watch for engagement — what grabs their attention?' },
      { title: 'Investigate further', instructions: 'Follow up with an activity that extends the video topic.', observationHint: 'Watch for deeper questions that go beyond what the video covered' },
      { title: 'Record and share', instructions: 'Draw, write, or explain what you discovered. Could you teach someone else?', observationHint: 'Listen for understanding in their own words, not just repeating the video' },
    ],
    'discuss': [
      { title: 'Before watching', instructions: 'What do you already know about this topic? What do you expect to see?', observationHint: 'Notice their prior knowledge and assumptions' },
      { title: 'Watch a segment', instructions: "Watch together. Pause at natural points — don't try to get through the whole thing.", observationHint: 'Watch for their reactions — what surprises them, what confuses them' },
      { title: 'Discuss', instructions: 'What stood out? What was surprising? Do you agree with everything?', observationHint: 'Listen for critical thinking — are they questioning or accepting?' },
      { title: 'Follow up', instructions: 'Extend the discussion into an activity or further investigation.', observationHint: 'Notice which ideas from the video they carry into further exploration' },
    ],
    'write': [
      { title: 'Watch for inspiration', instructions: 'Watch together. Ask: what would you like to draw, write about, or create from this?', observationHint: 'Notice what visuals or ideas capture their imagination' },
      { title: 'Plan', instructions: 'What will you create? A diagram, a comic, a story, a poster? Sketch your idea.', observationHint: 'Watch for how they translate moving images into their own medium' },
      { title: 'Create', instructions: 'Make it. Rewatch sections if you need reference.', observationHint: 'Notice their attention to detail — are they capturing key ideas?' },
      { title: 'Present', instructions: 'Show what you made. Explain the connection to what we watched.', observationHint: 'Listen for how they articulate what they learned through creating' },
    ],
  },
  kit: {
    'do': [
      { title: 'Unbox and explore', instructions: 'Look at the materials together. What do you see? What do you think each piece is for?', observationHint: "Notice prediction-making and curiosity about materials" },
      { title: 'Build / create / do', instructions: 'Follow the kit instructions or your own instinct. Take it step by step.', observationHint: "Watch for problem-solving when things don't go as expected" },
      { title: 'What happened?', instructions: 'Talk about what you made, what worked, and what was tricky.', observationHint: 'Listen for cause-and-effect reasoning' },
      { title: 'Connect the dots', instructions: "Why does this matter? What does this remind you of in everyday life?", observationHint: 'Notice connections between the activity and the wider world' },
    ],
    'explore': [
      { title: "What's in the box?", instructions: "Look at everything before starting. What topic does this kit explore? What do you already know about it?", observationHint: 'Notice their predictions and prior knowledge' },
      { title: 'Do the activity', instructions: 'Complete the kit activity together.', observationHint: 'Watch for moments of discovery during the activity' },
      { title: 'Dig deeper', instructions: 'Extend beyond the kit — what else can you investigate about this topic?', observationHint: 'Notice whether they form new questions from what they experienced' },
      { title: 'Record what you learned', instructions: 'Draw, photograph, or write about what you discovered. What surprised you?', observationHint: "Watch for understanding that goes beyond the kit's instructions" },
    ],
  },
  app: {
    'do': [
      { title: 'Explore the app', instructions: "Open it together. What do you notice? What can you do?", observationHint: 'Watch for independent navigation and curiosity' },
      { title: 'Focused task', instructions: 'Choose a specific challenge or activity within the app to focus on.', observationHint: 'Notice problem-solving and persistence' },
      { title: 'Step away from the screen', instructions: "What did you learn or create? Can you show or explain it without the device?", observationHint: "Listen for transfer — can they explain the concept without the app?" },
      { title: 'Extend offline', instructions: 'Connect what you learned digitally to a physical activity.', observationHint: 'Watch for connections between digital and physical understanding' },
    ],
    'explore': [
      { title: 'Explore freely', instructions: 'Spend a few minutes exploring the app. What can it do? What interests you?', observationHint: 'Notice what they gravitate toward without direction' },
      { title: 'Guided exploration', instructions: 'Choose a specific task or challenge within the app to explore more deeply.', observationHint: 'Watch for how they approach a structured task vs free exploration' },
      { title: 'Go further', instructions: 'Extend the digital topic into a real-world investigation.', observationHint: 'Notice whether they connect what they saw on screen to the real world' },
      { title: 'Share your findings', instructions: "What did you discover? Teach someone else what you learned.", observationHint: 'Listen for understanding beyond app interaction' },
    ],
  },
  place: {
    'explore': [
      { title: 'Before we go', instructions: "What do you think we'll see? What do you want to find out?", observationHint: 'Notice what they predict and what questions they form' },
      { title: 'Explore and observe', instructions: "Walk around with curiosity. Sketch, photograph, or note things that stand out.", observationHint: 'Watch for detail-oriented observation and question-asking' },
      { title: 'Deep focus', instructions: 'Find one thing to study closely. Spend extra time with it.', observationHint: 'Notice sustained attention and follow-up questions' },
      { title: 'Reflect on the way home', instructions: "What was the most interesting thing? Any new questions?", observationHint: "Listen for connections to previous experiences — 'Remember when we saw...'" },
    ],
    'discuss': [
      { title: 'Before we go', instructions: "What do you know about this place? What questions do you have?", observationHint: 'Notice their expectations and curiosity' },
      { title: 'Experience the place', instructions: "Explore together. Take photos of things you want to talk about later.", observationHint: 'Watch for what they choose to document — that shows what matters to them' },
      { title: 'Discuss what you saw', instructions: "Look at your photos. What surprised you? What do you want to know more about?", observationHint: 'Listen for critical thinking and follow-up questions' },
      { title: 'Connect', instructions: "How does this place connect to what we've been learning?", observationHint: 'Watch for connections to broader themes or other experiences' },
    ],
    'do': [
      { title: 'Prepare', instructions: "What are we going to do there? What do we need to bring?", observationHint: 'Notice their planning and preparation skills' },
      { title: 'Do the activity', instructions: 'Complete the main activity at this place — guided walk, nature survey, sketching, etc.', observationHint: 'Watch for engagement and focus during the activity' },
      { title: 'Record', instructions: "Photograph, sketch, or write about what you did and what you noticed.", observationHint: 'Notice the detail and care in their recording' },
      { title: 'Reflect', instructions: "What was the best part? What would you do differently next time?", observationHint: 'Listen for self-reflection and iteration thinking' },
    ],
    'write': [
      { title: 'Observe carefully', instructions: "Before drawing or writing, spend a few quiet minutes just looking. What do you notice?", observationHint: "Watch for the quality of their observation — are they slowing down?" },
      { title: 'Sketch or write', instructions: "Draw what you see, or write about what you notice. Capture the place as you experience it.", observationHint: 'Notice their choices — what do they include, what do they leave out?' },
      { title: 'Add detail', instructions: "Go back to your sketch or writing. What can you add? Look again more carefully.", observationHint: 'Watch for revision and deepening — are they willing to look more closely?' },
      { title: 'Share your work', instructions: "Show someone what you created. What was the hardest part to capture?", observationHint: 'Listen for self-awareness about their creative process' },
    ],
  },
  audio: {
    'read': [
      { title: 'Set the scene', instructions: "Get comfortable. What do you think this will be about?", observationHint: 'Notice their predictions and attention readiness' },
      { title: 'Listen together', instructions: "Listen to the audio. Pause if they have questions or reactions.", observationHint: 'Watch for engagement — are they absorbed, fidgeting, asking to replay?' },
      { title: 'Talk about it', instructions: "What did you hear? What was your favourite part? What do you want to know more about?", observationHint: 'Listen for comprehension and personal connections' },
      { title: 'Extend', instructions: 'Choose an activity inspired by the audio content to deepen the learning.', observationHint: 'Notice which ideas from the audio they carry into the activity' },
    ],
    'explore': [
      { title: 'Listen', instructions: "Listen to the audio together. What topic does it cover?", observationHint: 'Notice what captures their attention and what confuses them' },
      { title: 'Discuss and question', instructions: "What did you learn? What do you want to know more about?", observationHint: 'Listen for questions that go beyond what the audio covered' },
      { title: 'Investigate', instructions: 'Follow up with an activity that extends the audio topic.', observationHint: 'Watch for connections between what they heard and what they discover' },
      { title: 'Share', instructions: "Explain what you learned to someone who didn't hear the audio.", observationHint: "Listen for their ability to summarise and explain independently" },
    ],
    'discuss': [
      { title: 'Listen together', instructions: "Listen to the audio. It's okay to pause and react as you go.", observationHint: 'Watch for spontaneous reactions — laughter, surprise, disagreement' },
      { title: 'First thoughts', instructions: "What did you think? What stood out?", observationHint: 'Notice whether they have strong opinions or are still processing' },
      { title: 'Go deeper', instructions: 'Ask discussion questions based on the audio content.', observationHint: 'Listen for reasoning and perspective-taking' },
      { title: 'Connect', instructions: "Does this remind you of anything? How does it relate to your life?", observationHint: 'Watch for personal connections and empathy' },
    ],
    'memorise': [
      { title: 'Listen together', instructions: "Play the audio all the way through. Just listen.", observationHint: 'Watch for natural engagement — do they start mouthing along?' },
      { title: 'Understand what you hear', instructions: "Play it again, pausing after each section. What does this part mean?", observationHint: 'Listen for questions or connections they make' },
      { title: 'Learn section by section', instructions: "Play one section at a time. Pause. Repeat it together. Move on when ready.", observationHint: 'Notice their strategy — are they using melody, rhythm, or meaning as memory hooks?' },
      { title: 'Recite without the audio', instructions: "Turn it off and try from memory. Use the audio to check. Celebrate progress!", observationHint: 'Watch for confidence and accuracy. Meaning matters more than perfection.' },
    ],
  },
  other: {
    'default': [
      { title: 'Introduce it', instructions: "Show them the resource. What do they notice?", observationHint: 'Watch for initial curiosity and questions' },
      { title: 'Dive in', instructions: "Spend time with it together. Follow their lead.", observationHint: 'Notice what they gravitate toward' },
      { title: 'Reflect', instructions: "What did we learn? What was interesting?", observationHint: 'Listen for new understanding' },
    ],
  },
};

function getTemplateSteps(resourceType: string, usageIntents: string[]): Array<{ id: string; title: string; instructions: string; observationHint: string }> {
  const typeMap: Record<string, string> = {
    book: 'book', video: 'video', kit: 'kit', app: 'app', place: 'place', audio: 'audio', other: 'other',
  };
  const intentMap: Record<string, string> = {
    read: 'read', inspire: 'inspire', explore: 'explore', discuss: 'discuss', do: 'do', write: 'write', memorise: 'memorise',
  };
  const templateType = typeMap[resourceType] ?? 'other';
  const templates = SESSION_TEMPLATES[templateType];
  if (!templates) return [];
  const primaryIntent = usageIntents.length > 0 ? intentMap[usageIntents[0]] ?? 'default' : 'default';
  const steps = templates[primaryIntent] ?? templates['default'] ?? SESSION_TEMPLATES.other.default;
  return steps.map((s, i) => ({ id: `step-${i}`, title: s.title, instructions: s.instructions, observationHint: s.observationHint }));
}

const SUBJECT_TAGS = [
  'English', 'Mathematics', 'Science', 'HASS', 'Arts',
  'Technologies', 'HPE', 'Languages', 'Nature Study', 'Life Skills',
];

const AGE_RANGES = ['3–5', '5–7', '7–9', '9–11', '11–13', '13–15', '15+', 'All ages'];

const DURATION_OPTIONS = ['15 min', '30 min', '45 min', '1 hour', '1.5 hours', '2 hours', 'Half day'];
const SETTINGS = [
  { id: 'either', label: 'Either' },
  { id: 'indoor', label: 'Indoor' },
  { id: 'outdoor', label: 'Outdoor' },
];

const INVESTIGATION_TYPES = [
  { id: 'observe', label: '🔍 Observe closely' },
  { id: 'test', label: '🧪 Test it out' },
  { id: 'research', label: '📚 Look it up' },
  { id: 'ask', label: '🗣️ Ask an expert' },
  { id: 'visit', label: '📍 Go somewhere' },
  { id: 'make', label: '🔧 Build or make' },
];

const TIERS = ['Emerging', 'Developing', 'Demonstrating'];

const ACTIVITY_PREFERENCES = [
  { id: 'outdoors', label: '🌿 Outdoors' },
  { id: 'art', label: '🎨 Art / craft' },
  { id: 'books', label: '📚 Books' },
  { id: 'games', label: '🎲 Games' },
  { id: 'cooking', label: '🧑‍🍳 Cooking' },
  { id: 'experiments', label: '🔬 Experiments' },
  { id: 'active', label: '🏃 Active' },
  { id: 'discussion', label: '🗣️ Discussion' },
];

const CAPABILITY_THREADS = [
  { id: 'M1', domain: 'Mathematics', name: 'Number Sense & Place Value' },
  { id: 'M2', domain: 'Mathematics', name: 'Addition & Subtraction' },
  { id: 'M3', domain: 'Mathematics', name: 'Measurement Sense' },
  { id: 'M4', domain: 'Mathematics', name: 'Shape & Space' },
  { id: 'S1', domain: 'Science', name: 'Scientific Inquiry' },
  { id: 'S2', domain: 'Science', name: 'Scientific Observation' },
  { id: 'S3', domain: 'Science', name: 'Living Things & Habitats' },
  { id: 'L1', domain: 'Language & Literacy', name: 'Oral Communication' },
  { id: 'L2', domain: 'Language & Literacy', name: 'Reading Comprehension' },
  { id: 'L3', domain: 'Language & Literacy', name: 'Writing & Expression' },
  { id: 'EF1', domain: 'Executive Function', name: 'Planning & Organisation' },
  { id: 'EF2', domain: 'Executive Function', name: 'Self-Regulation' },
];

const PATHWAYS = [
  {
    id: 'material' as Pathway,
    emoji: '📖',
    label: '"I have a great resource"',
    name: 'Material-Anchored',
    hint: 'Build a module around a book, video, kit, or place',
    badge: null,
  },
  {
    id: 'process' as Pathway,
    emoji: '🔧',
    label: '"I know the steps"',
    name: 'Process',
    hint: 'You already know what to do — capture it as a reusable module',
    badge: null,
  },
  {
    id: 'inquiry' as Pathway,
    emoji: '❓',
    label: '"I have a question to explore"',
    name: 'Inquiry',
    hint: 'Start with curiosity and design an investigation',
    badge: null,
  },
  {
    id: 'retrospective' as Pathway,
    emoji: '🔄',
    label: '"We\'ve already been doing this"',
    name: 'Retrospective Lift',
    hint: 'Turn logged activities into a structured module',
    badge: '3 patterns found',
  },
];

const GOAL_PATHWAY = {
  id: 'goal' as Pathway,
  emoji: '🎯',
  label: '"I want to develop a skill area"',
  name: 'Goal-Forward',
  hint: 'Target a specific capability or learning gap',
  badge: null,
};

// ── Shared UI helpers ──────────────────────────────────────────────────────

function OLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-[0.7rem] font-semibold text-text-muted uppercase tracking-[0.1em] mb-sm">
      {children}
    </p>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'font-sans text-sm font-medium px-md py-xs rounded-md border min-h-[36px] transition-all duration-200 ease-[var(--ease-default)]',
        active
          ? 'bg-ember text-text-inverse border-ember'
          : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-border-medium',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function PathwayHeader({ emoji, name, subtitle, onBack }: { emoji: string; name: string; subtitle: string; onBack: () => void }) {
  return (
    <>
      <div className="flex items-center gap-sm">
        <button
          onClick={onBack}
          className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          ← Back
        </button>
        <span className="text-text-muted font-sans text-sm">/</span>
        <span className="font-sans text-sm text-text-secondary">{name}</span>
      </div>
      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
          {emoji} {name}
        </h2>
        <p className="font-serif text-sm text-text-secondary">{subtitle}</p>
      </div>
    </>
  );
}

function QuickSettings({
  duration,
  setting,
  onDuration,
  onSetting,
}: {
  duration: string;
  setting: string;
  onDuration: (v: string) => void;
  onSetting: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-md">
      <div className="flex-1">
        <OLabel>Duration</OLabel>
        <select
          value={duration}
          onChange={(e) => onDuration(e.target.value)}
          className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary outline-none transition-all duration-200 focus:border-ember"
        >
          <option value="">Select…</option>
          {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="flex-1">
        <OLabel>Setting</OLabel>
        <div className="flex flex-wrap gap-sm">
          {SETTINGS.map((s) => (
            <PillButton key={s.id} active={setting === s.id} onClick={() => onSetting(s.id)}>
              {s.label}
            </PillButton>
          ))}
        </div>
      </div>
    </div>
  );
}

function AiCompanionPanel({ hints }: { hints: string[] }) {
  return (
    <aside className="hidden lg:block sticky top-[120px]">
      <div className="bg-surface-raised rounded-lg border border-border-subtle p-lg">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-md">
          Thinking with you
        </p>
        <div className="flex flex-col gap-sm">
          {hints.map((hint, i) => (
            <div key={i} className="bg-surface-panel rounded-md border border-border-subtle p-md">
              <p className="font-serif text-sm text-text-secondary">{hint}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function ModulePreviewCard({ title, subjects, approaches }: { title: string; subjects: string[]; approaches: { title: string; activities: { title: string }[] }[] }) {
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card">
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-ember opacity-70" />
      <div className="mb-sm flex flex-wrap gap-xs">
        {subjects.slice(0, 3).map((s) => (
          <span key={s} className="rounded-full bg-surface-raised px-sm py-[2px] font-sans text-[10px] font-semibold text-text-muted capitalize">{s}</span>
        ))}
      </div>
      <h3 className="font-serif text-lg font-semibold text-text-primary mb-xs">{title || 'Untitled Module'}</h3>
      <p className="font-sans text-xs text-text-muted mb-md">{approaches.length} approach{approaches.length !== 1 ? 'es' : ''} · {approaches.reduce((n, a) => n + (a.activities?.length ?? 0), 0)} activities</p>
      <div className="space-y-xs">
        {approaches.slice(0, 2).map((a, i) => (
          <div key={i} className="rounded-md bg-surface-raised px-md py-xs border border-border-subtle">
            <p className="font-serif text-sm text-text-secondary">{a.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedView({ onBack, preview }: { onBack: () => void; preview?: { title: string; subjects: string[]; approaches: { title: string; activities: { title: string }[] }[] } }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex flex-col items-center gap-lg py-2xl text-center max-w-xl mx-auto">
      <span className="text-4xl" aria-hidden="true">✅</span>
      <h2 className="font-serif text-xl font-semibold text-text-primary">Module published</h2>
      <p className="font-serif text-text-secondary">
        Your module has been saved and published to your family library. It&apos;s available to facilitate now.
      </p>

      {preview && (
        <div className="w-full">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="font-sans text-sm text-ember hover:underline mb-md transition-colors"
          >
            {showPreview ? '▼ Hide preview' : '▶ Show preview'}
          </button>
          {showPreview && (
            <div className="text-left">
              <ModulePreviewCard {...preview} />
            </div>
          )}
        </div>
      )}

      <button
        onClick={onBack}
        className="font-sans text-sm font-semibold text-ember border border-ember rounded-md px-md py-sm min-h-[44px] transition-all duration-200 ease-[var(--ease-default)]"
      >
        Back to pathways
      </button>
    </div>
  );
}

function FormActions({
  saving,
  onDraft,
  onContinue,
  continueLabel,
}: {
  saving: boolean;
  onDraft: () => void;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <div className="flex gap-md pt-sm border-t border-border-subtle">
      <button
        type="button"
        onClick={onDraft}
        disabled={saving}
        className="flex-1 font-sans text-sm font-semibold text-ember border border-ember rounded-md min-h-[44px] px-lg transition-all duration-200 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save as draft'}
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={saving}
        className="flex-1 font-sans text-sm font-semibold text-text-inverse bg-ember rounded-md min-h-[44px] px-lg shadow-ember transition-all duration-200 disabled:opacity-50"
      >
        {saving ? 'Saving…' : (continueLabel ?? 'Continue →')}
      </button>
    </div>
  );
}

async function saveDraft(pathway: string, draftData: unknown, status: 'draft' | 'complete'): Promise<boolean> {
  const res = await fetch('/api/modules/drafts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pathway, draftData, status }),
  });
  return res.ok;
}

function parseRange(raw: string): [number | null, number | null] {
  const m = raw.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return [parseInt(m[1]), parseInt(m[2])];
  const single = raw.match(/(\d+)/);
  if (single) { const n = parseInt(single[1]); return [n, n]; }
  return [null, null];
}

async function publishFromEditData(data: SharedEditData): Promise<boolean> {
  if (!data.title.trim() || !data.targetUnderstanding.trim()) return false;
  if (data.steps.length === 0) return false;

  const [ageMin, ageMax] = parseRange(data.ageRange);
  const [durMin, durMax] = parseRange(data.duration);

  const payload = {
    title: data.title,
    targetUnderstanding: data.targetUnderstanding,
    subjects: data.subjects.length > 0 ? data.subjects : undefined,
    ageRange: ageMin && ageMax ? { min: ageMin, max: ageMax } : undefined,
    duration: durMin && durMax ? { min: durMin, max: durMax } : undefined,
    status: 'published' as const,
    createdVia: data.pathway,
    approaches: [{
      title: 'How to explore this',
      activities: data.steps.map((step) => ({
        title: step.title || 'Activity',
        instructions: step.instructions || step.title,
        observationPrompts: step.observationHint ? [step.observationHint] : undefined,
        materials: data.materials.length > 0
          ? data.materials.map((m) => ({ name: m, required: true }))
          : undefined,
        setting: data.setting === 'indoor' || data.setting === 'outdoor' ? data.setting : 'either' as const,
      })),
    }],
  };

  const res = await fetch('/api/modules/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

// ── Cross-Path Redirect Nudge ─────────────────────────────────────────────

const RESOURCE_KEYWORDS = ['book', 'video', 'kit', 'app', 'youtube', 'documentary', 'podcast', 'website', 'game', 'lego', 'minecraft'];
const QUESTION_KEYWORDS = ['why', 'how', 'what if', 'what would', 'wonder', 'curious', 'asked', 'question'];
const GOAL_KEYWORDS = ['want them to', 'learn to', 'get better at', 'develop', 'improve', 'skill', 'capability', 'goal'];
const PROCESS_KEYWORDS = ['steps', 'first we', 'then we', 'recipe', 'procedure', 'instructions', 'build', 'make', 'cook'];

type NudgeSuggestion = { pathway: Pathway; label: string; reason: string } | null;

function detectCrossPathNudge(currentPathway: Pathway, text: string): NudgeSuggestion {
  const lower = text.toLowerCase();
  if (!lower || lower.length < 15) return null;

  if (currentPathway !== 'material' && RESOURCE_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { pathway: 'material', label: 'Material-Anchored', reason: 'Sounds like you have a resource in mind' };
  }
  if (currentPathway !== 'inquiry' && QUESTION_KEYWORDS.some((kw) => lower.includes(kw))) {
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks > 0 || QUESTION_KEYWORDS.filter((kw) => lower.includes(kw)).length >= 2) {
      return { pathway: 'inquiry', label: 'Inquiry', reason: 'This sounds like a question to explore' };
    }
  }
  if (currentPathway !== 'goal' && GOAL_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { pathway: 'goal', label: 'Goal-Forward', reason: 'Sounds like a learning target' };
  }
  if (currentPathway !== 'process' && PROCESS_KEYWORDS.filter((kw) => lower.includes(kw)).length >= 2) {
    return { pathway: 'process', label: 'Process', reason: 'Sounds like you know the steps already' };
  }
  return null;
}

function CrossPathNudge({
  suggestion,
  onSwitch,
}: {
  suggestion: NudgeSuggestion;
  onSwitch: (pathway: Pathway) => void;
}) {
  if (!suggestion) return null;
  return (
    <div className="rounded-md border border-ember/20 bg-ember-glow/30 px-md py-sm flex items-center justify-between gap-md">
      <p className="font-sans text-xs text-text-secondary">
        <span className="text-ember font-semibold">Hmm —</span> {suggestion.reason}.{' '}
        <button
          type="button"
          onClick={() => onSwitch(suggestion.pathway)}
          className="text-ember font-semibold underline underline-offset-2 transition-colors hover:text-ember-hover"
        >
          Try {suggestion.label} pathway?
        </button>
      </p>
    </div>
  );
}

// ── Module Preview ───────────────────────────────────────────────────────

function ModulePreview({
  data,
  onBack,
  onPublish,
  saving,
}: {
  data: SharedEditData;
  onBack: () => void;
  onPublish: () => void;
  saving: boolean;
}) {
  const provenanceType = data.provenance.type as string | undefined;

  return (
    <div className="flex flex-col gap-lg max-w-2xl mx-auto">
      <div className="flex items-center gap-sm">
        <button onClick={onBack} className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
          ← Back to editing
        </button>
      </div>

      <div>
        <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ember mb-xs">
          Preview
        </p>
        <h2 className="font-serif text-xl font-semibold text-text-primary">
          Review before saving
        </h2>
      </div>

      {/* Module card preview */}
      <div className="bg-surface-panel rounded-lg border border-border-subtle shadow-card p-xl">
        <h3 className="font-serif text-lg font-semibold text-text-primary mb-sm">
          {data.title || 'Untitled module'}
        </h3>

        {data.targetUnderstanding && (
          <p className="font-serif text-sm italic text-text-secondary mb-md leading-relaxed">
            {data.targetUnderstanding}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-md mb-md">
          {data.subjects.length > 0 && (
            <div className="flex flex-wrap gap-xs">
              {data.subjects.map((s) => (
                <span key={s} className="font-sans text-xs rounded-full px-sm py-xs border border-border-subtle bg-surface-raised text-text-secondary">
                  {s}
                </span>
              ))}
            </div>
          )}
          {data.duration && (
            <span className="font-sans text-xs text-text-muted">⏱ {data.duration}</span>
          )}
          {data.setting && data.setting !== 'either' && (
            <span className="font-sans text-xs text-text-muted">
              {data.setting === 'indoor' ? '🏠' : '🌿'} {data.setting}
            </span>
          )}
          {data.ageRange && (
            <span className="font-sans text-xs text-text-muted">👶 {data.ageRange}</span>
          )}
        </div>

        {/* Steps */}
        {data.steps.length > 0 && (
          <div className="mb-md">
            <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">
              Steps ({data.steps.length})
            </p>
            <div className="flex flex-col gap-xs">
              {data.steps.map((step, idx) => (
                <div key={step.id} className="flex gap-sm bg-surface-raised rounded-md border border-border-subtle p-sm">
                  <span className="font-sans text-xs font-semibold text-text-muted shrink-0 mt-[2px]">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-text-primary font-semibold">{step.title}</p>
                    {step.instructions && (
                      <p className="font-serif text-sm text-text-secondary mt-xs leading-relaxed">{step.instructions}</p>
                    )}
                    {step.observationHint && (
                      <p className="font-sans text-xs text-text-muted italic mt-xs">Watch for: {step.observationHint}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Watch-for / Pivot */}
        <div className="flex flex-col sm:flex-row gap-md mb-md">
          {data.watchFor && (
            <div className="flex-1 bg-sage/5 rounded-md border border-sage/20 p-sm">
              <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-sage mb-xs">Watch for</p>
              <p className="font-serif text-sm text-text-secondary">{data.watchFor}</p>
            </div>
          )}
          {data.pivot && (
            <div className="flex-1 bg-ember-glow/20 rounded-md border border-ember/20 p-sm">
              <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ember mb-xs">Pivot</p>
              <p className="font-serif text-sm text-text-secondary">{data.pivot}</p>
            </div>
          )}
        </div>

        {/* Capabilities */}
        {data.capabilities.length > 0 && (
          <div className="mb-md">
            <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">Capabilities</p>
            <div className="flex flex-wrap gap-sm">
              {data.capabilities.map((cap) => {
                const thread = CAPABILITY_THREADS.find((t) => t.id === cap.threadId);
                return (
                  <span key={cap.threadId} className="rounded-full bg-sage/10 border border-sage/30 px-sm py-[3px] font-sans text-xs text-sage">
                    {thread?.name ?? cap.threadId}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Provenance */}
        {provenanceType && (
          <div className="border-t border-border-subtle pt-sm mt-sm">
            <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
              Source: {PROVENANCE_LABELS[provenanceType] ?? provenanceType}
            </p>
          </div>
        )}

        {/* Empty field warnings */}
        {(!data.targetUnderstanding || !data.watchFor || data.steps.length === 0) && (
          <div className="mt-md rounded-md border border-ember/20 bg-ember-glow/20 p-sm">
            <p className="font-sans text-xs text-text-secondary">
              <span className="text-ember font-semibold">Note:</span> Some fields are empty — AI will fill them in when you save.
              {!data.targetUnderstanding && ' (Target understanding)'}
              {!data.watchFor && ' (Watch for)'}
              {data.steps.length === 0 && ' (Steps)'}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-md pt-sm border-t border-border-subtle">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 font-sans text-sm font-semibold text-ember border border-ember rounded-md min-h-[44px] px-lg transition-all duration-200"
        >
          ← Edit
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={saving}
          className="flex-1 font-sans text-sm font-semibold text-text-inverse bg-ember rounded-md min-h-[44px] px-lg shadow-ember transition-all duration-200 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save module'}
        </button>
      </div>
    </div>
  );
}

// ── Shared Editing View ───────────────────────────────────────────────────

interface ModuleStep {
  id: string;
  title: string;
  instructions: string;
  observationHint: string;
}

interface SharedEditData {
  pathway: Pathway;
  title: string;
  targetUnderstanding: string;
  watchFor: string;
  pivot: string;
  steps: ModuleStep[];
  materials: string[];
  subjects: string[];
  duration: string;
  setting: string;
  ageRange: string;
  capabilities: Array<{ threadId: string; confidence: 'explicit' | 'inferred' }>;
  provenance: Record<string, unknown>;
}

function normalizeToEditData(pathway: Pathway, data: Record<string, unknown>): SharedEditData {
  const base: SharedEditData = {
    pathway,
    title: '',
    targetUnderstanding: '',
    watchFor: '',
    pivot: '',
    steps: [],
    materials: [],
    subjects: (data.subjects as string[]) ?? [],
    duration: (data.duration as string) ?? '',
    setting: (data.setting as string) ?? 'either',
    ageRange: (data.ageRange as string) ?? '',
    capabilities: [],
    provenance: {},
  };

  switch (pathway) {
    case 'material': {
      base.title = (data.resourceName as string) ?? '';
      base.provenance = {
        type: 'sourceResource',
        resourceType: data.resourceType,
        resourceName: data.resourceName,
        excitement: data.excitement,
        usageIntents: data.usageIntents,
      };
      const templateSteps = getTemplateSteps(
        (data.resourceType as string) ?? 'other',
        (data.usageIntents as string[]) ?? [],
      );
      if (templateSteps.length > 0) {
        base.steps = templateSteps;
      }
      break;
    }
    case 'process':
      base.title = (data.activityName as string) ?? '';
      if (data.whatHappens) {
        const lines = (data.whatHappens as string).split('\n').filter(Boolean);
        base.steps = lines.map((line, i) => ({
          id: `step-${i}`,
          title: `Step ${i + 1}`,
          instructions: line.trim(),
          observationHint: '',
        }));
      }
      if (data.hasProduct && data.productName) {
        base.materials.push(data.productName as string);
      }
      break;
    case 'inquiry':
      base.title = (data.question as string) ?? '';
      base.provenance = {
        type: 'sourceQuestion',
        question: data.question,
        priorKnowledge: data.priorKnowledge,
        investigationTypes: data.investigationTypes,
      };
      break;
    case 'retrospective':
      base.title = (data.moduleName as string) ?? (data.subject as string) ?? '';
      base.provenance = {
        type: 'sourceLogs',
        subject: data.subject,
        entryIds: data.entryIds,
      };
      break;
    case 'goal':
      base.title = (data.goal as string) ?? (data.threadName as string) ?? '';
      if (data.mode === 'capability') {
        base.provenance = {
          type: 'sourceCapability',
          threadId: data.threadId,
          threadName: data.threadName,
          targetTier: data.tier,
        };
        if (data.threadId) {
          base.capabilities = [{ threadId: data.threadId as string, confidence: 'explicit' }];
        }
      } else {
        base.provenance = {
          type: 'sourceGoal',
          goal: data.goal,
          successLooksLike: data.successLooksLike,
        };
      }
      break;
  }
  return base;
}

const PROVENANCE_LABELS: Record<string, string> = {
  sourceResource: 'Source Resource',
  sourceQuestion: 'Driving Question',
  sourceLogs: 'Lifted from Logs',
  sourceGoal: 'Learning Target',
  sourceCapability: 'Capability Target',
};

function SharedEditView({
  initialData,
  onBack,
  onSaved,
}: {
  initialData: SharedEditData;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  function addStep() {
    const id = `step-${Date.now()}`;
    setForm((f) => ({
      ...f,
      steps: [...f.steps, { id, title: `Step ${f.steps.length + 1}`, instructions: '', observationHint: '' }],
    }));
  }

  function updateStep(id: string, field: keyof ModuleStep, value: string) {
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  }

  function removeStep(id: string) {
    setForm((f) => ({
      ...f,
      steps: f.steps.filter((s) => s.id !== id),
    }));
  }

  function moveStep(idx: number, direction: -1 | 1) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= form.steps.length) return;
    setForm((f) => {
      const steps = [...f.steps];
      [steps[idx], steps[newIdx]] = [steps[newIdx], steps[idx]];
      return { ...f, steps };
    });
  }

  const toggleSubject = (s: string) =>
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s],
    }));

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!form.title.trim()) { setError('Module title is required.'); return; }
    if (status === 'complete' && !form.targetUnderstanding.trim()) {
      setError('Target understanding is required before completing. What will the child understand?');
      return;
    }
    setSaving(true); setError(null);
    const ok = await saveDraft(form.pathway, { ...form }, status);
    setSaving(false);
    if (ok) onSaved();
    else setError('Something went wrong. Please try again.');
  };

  const handlePublishFromPreview = async () => {
    if (!form.targetUnderstanding.trim()) {
      setError('Target understanding is required to publish. This is the heart of UbD — what will the child understand?');
      setPreviewing(false);
      return;
    }
    setSaving(true); setError(null);
    const ok = await saveDraft(form.pathway, { ...form }, 'complete');
    if (ok) {
      publishFromEditData(form).catch(() => {});
    }
    setSaving(false);
    if (ok) onSaved();
    else { setError('Something went wrong. Please try again.'); setPreviewing(false); }
  };

  if (previewing) {
    return (
      <ModulePreview
        data={form}
        onBack={() => setPreviewing(false)}
        onPublish={handlePublishFromPreview}
        saving={saving}
      />
    );
  }

  const provenanceType = form.provenance.type as string | undefined;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <div className="flex items-center gap-sm">
          <button onClick={onBack} className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200">
            ← Back to entry
          </button>
          <span className="text-text-muted font-sans text-sm">/</span>
          <span className="font-sans text-sm text-text-secondary">Edit module</span>
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">Shape your module</h2>
          <p className="font-serif text-sm text-text-secondary">
            Review and refine what Hearth has pre-populated. Edit anything — this is your module.
          </p>
        </div>

        {/* Provenance context */}
        {provenanceType && (
          <div className="bg-surface-raised/50 rounded-lg border border-border-subtle p-md">
            <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
              {PROVENANCE_LABELS[provenanceType] ?? 'Source'}
            </p>
            {provenanceType === 'sourceResource' && (
              <p className="font-serif text-sm text-text-secondary">
                {String(form.provenance.resourceType)} — {String(form.provenance.resourceName)}
                {form.provenance.excitement ? (
                  <span className="block mt-xs text-text-muted italic">&ldquo;{String(form.provenance.excitement)}&rdquo;</span>
                ) : null}
              </p>
            )}
            {provenanceType === 'sourceQuestion' && (
              <p className="font-serif text-sm text-text-secondary italic">&ldquo;{form.provenance.question as string}&rdquo;</p>
            )}
            {provenanceType === 'sourceLogs' && (
              <p className="font-serif text-sm text-text-secondary">
                Built from {(form.provenance.entryIds as string[])?.length ?? 0} logged entries in {form.provenance.subject as string}
              </p>
            )}
            {provenanceType === 'sourceGoal' && (
              <p className="font-serif text-sm text-text-secondary">{form.provenance.goal as string}</p>
            )}
            {provenanceType === 'sourceCapability' && (
              <p className="font-serif text-sm text-text-secondary">
                {form.provenance.threadName as string} — targeting {form.provenance.targetTier as string}
              </p>
            )}
          </div>
        )}

        {/* Module title */}
        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Module title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Give this module a name"
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-base text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember focus:shadow-focus"
          />
        </div>

        {/* Target understanding */}
        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
            What will they understand? <span className="text-ember">*</span>
          </label>
          <textarea
            value={form.targetUnderstanding}
            onChange={(e) => setForm((f) => ({ ...f, targetUnderstanding: e.target.value }))}
            placeholder="The key understanding this module develops — required for publishing."
            rows={2}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember focus:shadow-focus"
          />
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-sm">
            <OLabel>Steps</OLabel>
            <button
              type="button"
              onClick={addStep}
              className="font-sans text-xs font-semibold text-ember transition-colors hover:text-ember-hover"
            >
              + Add step
            </button>
          </div>

          {form.steps.length === 0 && (
            <div className="rounded-md border border-dashed border-border-subtle bg-surface-raised/30 p-md text-center">
              <p className="font-sans text-xs text-text-muted">No steps yet. Add one above, or AI will generate them on save.</p>
            </div>
          )}

          <div className="flex flex-col gap-sm">
            {form.steps.map((step, idx) => (
              <div key={step.id} className="bg-surface-raised rounded-md border border-border-subtle p-sm">
                <div className="flex items-center justify-between mb-xs">
                  <div className="flex items-center gap-xs">
                    <button
                      type="button"
                      onClick={() => moveStep(idx, -1)}
                      disabled={idx === 0}
                      className="font-sans text-xs text-text-muted disabled:opacity-30 hover:text-text-secondary"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(idx, 1)}
                      disabled={idx === form.steps.length - 1}
                      className="font-sans text-xs text-text-muted disabled:opacity-30 hover:text-text-secondary"
                    >
                      ↓
                    </button>
                    <span className="font-sans text-[11px] font-semibold text-text-muted">{idx + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="font-sans text-xs text-text-muted hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                  placeholder="Step title"
                  className="w-full bg-transparent border-b border-border-subtle mb-xs pb-xs font-sans text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-ember"
                />
                <textarea
                  value={step.instructions}
                  onChange={(e) => updateStep(step.id, 'instructions', e.target.value)}
                  placeholder="Instructions..."
                  rows={2}
                  className="w-full bg-transparent font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed"
                />
                <input
                  type="text"
                  value={step.observationHint}
                  onChange={(e) => updateStep(step.id, 'observationHint', e.target.value)}
                  placeholder="Watch for... (optional)"
                  className="w-full bg-transparent border-t border-border-subtle mt-xs pt-xs font-sans text-xs text-text-muted placeholder:text-text-muted outline-none focus:text-text-secondary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Watch-for + Pivot */}
        <div className="flex flex-col sm:flex-row gap-md">
          <div className="flex-1">
            <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Watch for</label>
            <textarea
              value={form.watchFor}
              onChange={(e) => setForm((f) => ({ ...f, watchFor: e.target.value }))}
              placeholder="What moments of understanding should you look for?"
              rows={2}
              className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember"
            />
          </div>
          <div className="flex-1">
            <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Pivot if needed</label>
            <textarea
              value={form.pivot}
              onChange={(e) => setForm((f) => ({ ...f, pivot: e.target.value }))}
              placeholder="If things go sideways, what's a good redirect?"
              rows={2}
              className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember"
            />
          </div>
        </div>

        {/* Settings */}
        <QuickSettings
          duration={form.duration}
          setting={form.setting}
          onDuration={(v) => setForm((f) => ({ ...f, duration: v }))}
          onSetting={(v) => setForm((f) => ({ ...f, setting: v }))}
        />

        {/* Subjects */}
        <div>
          <OLabel>Subject areas</OLabel>
          <div className="flex flex-wrap gap-sm">
            {SUBJECT_TAGS.map((s) => (
              <PillButton key={s} active={form.subjects.includes(s)} onClick={() => toggleSubject(s)}>{s}</PillButton>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        {form.capabilities.length > 0 && (
          <div>
            <OLabel>Mapped capabilities</OLabel>
            <div className="flex flex-wrap gap-sm">
              {form.capabilities.map((cap) => {
                const thread = CAPABILITY_THREADS.find((t) => t.id === cap.threadId);
                return (
                  <span key={cap.threadId} className="rounded-full bg-sage/10 border border-sage/30 px-sm py-[3px] font-sans text-xs text-sage">
                    {thread?.name ?? cap.threadId} ({cap.confidence})
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions
          saving={saving}
          onDraft={() => handleSave('draft')}
          onContinue={() => {
            if (!form.title.trim()) { setError('Module title is required.'); return; }
            if (!form.targetUnderstanding.trim()) { setError('Target understanding is required before preview. What will the child understand?'); return; }
            setPreviewing(true);
          }}
          continueLabel="Preview & Save"
        />
      </div>

      <AiCompanionPanel hints={[
        'Leave fields blank and AI will suggest content on save.',
        'Steps are optional — some modules work better as guided exploration.',
        'Watch-for hints help you know when learning is happening.',
      ]} />
    </div>
  );
}

// ── Material-Anchored Pathway ──────────────────────────────────────────────

interface MaterialDraft {
  resourceType: string;
  resourceName: string;
  excitement: string;
  usageIntents: string[];
  ageRange: string;
  subjects: string[];
}

function MaterialPathwayForm({ onBack, onSwitchPathway }: { onBack: () => void; onSwitchPathway: (p: Pathway) => void }) {
  const [form, setForm] = useState<MaterialDraft>({
    resourceType: '',
    resourceName: '',
    excitement: '',
    usageIntents: [],
    ageRange: '',
    subjects: [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nudge = detectCrossPathNudge('material', form.excitement);

  const toggleSubject = (subject: string) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(subject)
        ? f.subjects.filter((s) => s !== subject)
        : [...f.subjects, subject],
    }));
  };

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!form.resourceName.trim()) { setError('Resource name is required.'); return; }
    if (status === 'complete') {
      setEditing(normalizeToEditData('material', form as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const ok = await saveDraft('material', form, status);
    setSaving(false);
    if (ok) setSaved(true);
    else setError('Something went wrong. Please try again.');
  };

  if (saved) return <SavedView onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} onBack={() => setEditing(null)} onSaved={() => setSaved(true)} />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader emoji="📖" name="Material-Anchored" subtitle="Start with what you have — a book, video, kit, place, or anything that sparked your interest." onBack={onBack} />

        <div>
          <OLabel>What type of resource?</OLabel>
          <div className="flex flex-wrap gap-sm">
            {RESOURCE_TYPES.map((rt) => (
              <PillButton key={rt.id} active={form.resourceType === rt.id} onClick={() => setForm((f) => ({ ...f, resourceType: rt.id }))}>
                {rt.label}
              </PillButton>
            ))}
          </div>
        </div>

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Resource name</label>
          <input
            type="text"
            value={form.resourceName}
            onChange={(e) => setForm((f) => ({ ...f, resourceName: e.target.value }))}
            placeholder="e.g. The Secret Garden, Planet Earth II, LEGO Mindstorms..."
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember focus:shadow-focus"
          />
        </div>

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">What excites you about this?</label>
          <textarea
            value={form.excitement}
            onChange={(e) => setForm((f) => ({ ...f, excitement: e.target.value }))}
            placeholder="What drew you to this resource? What do you hope your learner will get from it?"
            rows={3}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember focus:shadow-focus"
          />
        </div>

        <div>
          <OLabel>How do you imagine using it?</OLabel>
          <p className="font-sans text-[11px] text-text-muted mb-sm -mt-xs">Pick 1–3 that feel right</p>
          <div className="flex flex-wrap gap-sm">
            {USAGE_INTENTS.map((intent) => (
              <PillButton
                key={intent.id}
                active={form.usageIntents.includes(intent.id)}
                onClick={() => setForm((f) => ({
                  ...f,
                  usageIntents: f.usageIntents.includes(intent.id)
                    ? f.usageIntents.filter((x) => x !== intent.id)
                    : f.usageIntents.length < 3 ? [...f.usageIntents, intent.id] : f.usageIntents,
                }))}
              >
                {intent.label}
              </PillButton>
            ))}
          </div>
        </div>

        <div>
          <OLabel>Age range</OLabel>
          <div className="flex flex-wrap gap-sm">
            {AGE_RANGES.map((age) => (
              <PillButton key={age} active={form.ageRange === age} onClick={() => setForm((f) => ({ ...f, ageRange: age }))}>
                {age}
              </PillButton>
            ))}
          </div>
        </div>

        <div>
          <OLabel>Subject areas</OLabel>
          <div className="flex flex-wrap gap-sm">
            {SUBJECT_TAGS.map((subject) => (
              <PillButton key={subject} active={form.subjects.includes(subject)} onClick={() => toggleSubject(subject)}>
                {subject}
              </PillButton>
            ))}
          </div>
        </div>

        <CrossPathNudge suggestion={nudge} onSwitch={onSwitchPathway} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} />
      </div>

      <AiCompanionPanel hints={[
        'Start with what excites you. The curriculum will follow.',
        'Add subject areas to help Hearth surface related activities.',
        'You can save a draft and come back — nothing is lost.',
      ]} />
    </div>
  );
}

// ── Process Pathway ────────────────────────────────────────────────────────

interface ProcessDraft {
  activityName: string;
  whatHappens: string;
  duration: string;
  setting: string;
  hasProduct: boolean;
  productName: string;
  subjects: string[];
  ageRange: string;
}

function ProcessPathwayForm({ onBack, onSwitchPathway }: { onBack: () => void; onSwitchPathway: (p: Pathway) => void }) {
  const [form, setForm] = useState<ProcessDraft>({
    activityName: '',
    whatHappens: '',
    duration: '',
    setting: 'either',
    hasProduct: false,
    productName: '',
    subjects: [],
    ageRange: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nudge = detectCrossPathNudge('process', form.whatHappens);
  const showResourceNudge = /\b(book|read|watch|video|documentary|podcast|resource)\b/i.test(form.activityName);

  const toggleSubject = (s: string) =>
    setForm((f) => ({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s] }));

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!form.activityName.trim()) { setError('Activity name is required.'); return; }
    if (status === 'complete') {
      setEditing(normalizeToEditData('process', form as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const ok = await saveDraft('process', form, status);
    setSaving(false);
    if (ok) setSaved(true);
    else setError('Something went wrong. Please try again.');
  };

  if (saved) {
    const preview = {
      title: form.activityName,
      subjects: form.subjects,
      approaches: [{ title: 'Process', activities: [{ title: form.activityName }] }],
    };
    return <SavedView onBack={onBack} preview={preview} />;
  }
  if (editing) return <SharedEditView initialData={editing} onBack={() => setEditing(null)} onSaved={() => setSaved(true)} />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader emoji="🔧" name="Process" subtitle="You already know what to do — capture it as a reusable module." onBack={onBack} />

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">Activity name</label>
          <input
            type="text"
            value={form.activityName}
            onChange={(e) => setForm((f) => ({ ...f, activityName: e.target.value }))}
            placeholder="e.g. Building a birdhouse, Sourdough bread, Nature journalling..."
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember focus:shadow-focus"
          />
        </div>

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">What happens in this activity?</label>
          <textarea
            value={form.whatHappens}
            onChange={(e) => setForm((f) => ({ ...f, whatHappens: e.target.value }))}
            placeholder="Describe what you do, step by step or in broad strokes. The learning spine will emerge from this."
            rows={4}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember focus:shadow-focus"
          />
        </div>

        <QuickSettings
          duration={form.duration}
          setting={form.setting}
          onDuration={(v) => setForm((f) => ({ ...f, duration: v }))}
          onSetting={(v) => setForm((f) => ({ ...f, setting: v }))}
        />

        {/* Finished product toggle */}
        <div>
          <div className="flex items-center gap-md">
            <OLabel>Is there a finished product?</OLabel>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, hasProduct: !f.hasProduct }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors duration-200 ${
                form.hasProduct ? 'bg-ember border-ember' : 'bg-surface-hover border-border-medium'
              }`}
              role="switch"
              aria-checked={form.hasProduct}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-text-primary shadow ring-0 transition duration-200 mt-[1px] ${
                  form.hasProduct ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {form.hasProduct && (
            <input
              type="text"
              value={form.productName}
              onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
              placeholder="e.g. A painted birdhouse, a loaf of bread..."
              className="mt-sm w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember"
            />
          )}
        </div>

        <div>
          <OLabel>Subject areas</OLabel>
          <div className="flex flex-wrap gap-sm">
            {SUBJECT_TAGS.map((s) => (
              <PillButton key={s} active={form.subjects.includes(s)} onClick={() => toggleSubject(s)}>{s}</PillButton>
            ))}
          </div>
        </div>

        <div>
          <OLabel>Age range</OLabel>
          <div className="flex flex-wrap gap-sm">
            {AGE_RANGES.map((age) => (
              <PillButton key={age} active={form.ageRange === age} onClick={() => setForm((f) => ({ ...f, ageRange: age }))}>{age}</PillButton>
            ))}
          </div>
        </div>

        {showResourceNudge && (
          <div className="mt-sm rounded-md border border-border-subtle bg-surface-raised px-md py-sm flex items-center justify-between gap-md">
            <p className="font-serif text-sm text-text-secondary italic">
              Sounds like a resource — try the <strong>Inquiry pathway</strong> for resource-led learning.
            </p>
            <button
              onClick={() => onSwitchPathway('inquiry')}
              className="shrink-0 font-sans text-xs text-ember hover:underline"
            >
              Switch →
            </button>
          </div>
        )}

        <CrossPathNudge suggestion={nudge} onSwitch={onSwitchPathway} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} continueLabel="Capture the steps →" />
      </div>

      <AiCompanionPanel hints={[
        'Describe what happens first. We\'ll surface the learning in it.',
        'Even simple activities teach — don\'t undersell what you already do.',
        'Add a finished product if there\'s something to show at the end.',
      ]} />
    </div>
  );
}

// ── Inquiry Pathway ────────────────────────────────────────────────────────

interface InquiryDraft {
  question: string;
  priorKnowledge: string;
  investigationTypes: string[];
  duration: string;
  setting: string;
  subjects: string[];
}

function InquiryPathwayForm({ onBack, onSwitchPathway }: { onBack: () => void; onSwitchPathway: (p: Pathway) => void }) {
  const [form, setForm] = useState<InquiryDraft>({
    question: '',
    priorKnowledge: '',
    investigationTypes: [],
    duration: '',
    setting: 'either',
    subjects: [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nudge = detectCrossPathNudge('inquiry', form.question + ' ' + form.priorKnowledge);
  const showGoalNudge = form.question.length < 10 && form.priorKnowledge.length > 50;

  const toggleType = (id: string) =>
    setForm((f) => ({ ...f, investigationTypes: f.investigationTypes.includes(id) ? f.investigationTypes.filter((x) => x !== id) : [...f.investigationTypes, id] }));

  const toggleSubject = (s: string) =>
    setForm((f) => ({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s] }));

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!form.question.trim()) { setError('The question is required.'); return; }
    if (status === 'complete') {
      setEditing(normalizeToEditData('inquiry', form as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const ok = await saveDraft('inquiry', form, status);
    setSaving(false);
    if (ok) setSaved(true);
    else setError('Something went wrong. Please try again.');
  };

  if (saved) {
    const preview = {
      title: form.question,
      subjects: form.subjects,
      approaches: [{ title: 'Inquiry', activities: [{ title: form.question }] }],
    };
    return <SavedView onBack={onBack} preview={preview} />;
  }
  if (editing) return <SharedEditView initialData={editing} onBack={() => setEditing(null)} onSaved={() => setSaved(true)} />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader emoji="❓" name="Inquiry" subtitle="Start with curiosity and design an investigation." onBack={onBack} />

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
            The question
          </label>
          <input
            type="text"
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            placeholder="e.g. Why do leaves change colour in autumn?"
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-base text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember focus:shadow-focus"
          />
          <p className="font-sans text-[11px] text-text-muted mt-xs">Use their exact words if you remember them</p>
        </div>

        <div>
          <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
            What do you already know or think about this?
          </label>
          <textarea
            value={form.priorKnowledge}
            onChange={(e) => setForm((f) => ({ ...f, priorKnowledge: e.target.value }))}
            placeholder="Starting from what you know helps shape the exploration — even guesses count."
            rows={3}
            className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember focus:shadow-focus"
          />
        </div>

        <div>
          <OLabel>How might you explore this?</OLabel>
          <p className="font-sans text-[11px] text-text-muted mb-sm -mt-xs">Pick 1 or 2 that feel right</p>
          <div className="flex flex-wrap gap-sm">
            {INVESTIGATION_TYPES.map((it) => (
              <PillButton key={it.id} active={form.investigationTypes.includes(it.id)} onClick={() => toggleType(it.id)}>
                {it.label}
              </PillButton>
            ))}
          </div>
        </div>

        <div>
          <OLabel>Subject areas</OLabel>
          <div className="flex flex-wrap gap-sm">
            {SUBJECT_TAGS.map((s) => (
              <PillButton key={s} active={form.subjects.includes(s)} onClick={() => toggleSubject(s)}>{s}</PillButton>
            ))}
          </div>
        </div>

        <QuickSettings
          duration={form.duration}
          setting={form.setting}
          onDuration={(v) => setForm((f) => ({ ...f, duration: v }))}
          onSetting={(v) => setForm((f) => ({ ...f, setting: v }))}
        />

        {showGoalNudge && (
          <div className="mt-sm rounded-md border border-border-subtle bg-surface-raised px-md py-sm flex items-center justify-between gap-md">
            <p className="font-serif text-sm text-text-secondary italic">
              Lots of prior knowledge — this might work well as a <strong>Goal-Forward</strong> module instead.
            </p>
            <button
              onClick={() => onSwitchPathway('goal')}
              className="shrink-0 font-sans text-xs text-ember hover:underline"
            >
              Switch →
            </button>
          </div>
        )}

        <CrossPathNudge suggestion={nudge} onSwitch={onSwitchPathway} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} continueLabel="Plan the exploration →" />
      </div>

      <AiCompanionPanel hints={[
        'The question is the whole module. Let it be messy.',
        'Prior knowledge shapes everything — what they think is the starting line.',
        'Pick investigation types that match your energy, not what\'s "educational".',
      ]} />
    </div>
  );
}

// ── Retrospective Lift Pathway ─────────────────────────────────────────────

type LogEntry = {
  id: string;
  title: string;
  dateOccurred: string;
  subjects: string[] | null;
  status: string;
};

type Pattern = {
  subject: string;
  entries: LogEntry[];
  earliest: string;
  latest: string;
};

function RetrospectiveLiftPathwayForm({ onBack }: { onBack: () => void }) {
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [moduleName, setModuleName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/entries')
      .then((r) => r.json())
      .then((data: LogEntry[]) => {
        if (!Array.isArray(data)) { setLoadingEntries(false); return; }
        const published = data.filter((e) => e.status !== 'draft');
        const groups: Record<string, LogEntry[]> = {};
        published.forEach((e) => {
          (e.subjects ?? []).forEach((s) => {
            if (!groups[s]) groups[s] = [];
            groups[s].push(e);
          });
        });
        const found = Object.entries(groups)
          .filter(([, es]) => es.length >= 2)
          .sort(([, a], [, b]) => b.length - a.length)
          .slice(0, 4)
          .map(([subject, es]) => {
            const sorted = [...es].sort((a, b) => a.dateOccurred.localeCompare(b.dateOccurred));
            return {
              subject,
              entries: sorted,
              earliest: sorted[0].dateOccurred,
              latest: sorted[sorted.length - 1].dateOccurred,
            };
          });
        setPatterns(found);
        setLoadingEntries(false);
      })
      .catch(() => setLoadingEntries(false));
  }, []);

  const handleSave = async (status: 'draft' | 'complete') => {
    if (!selectedPattern) { setError('Select a pattern to lift.'); return; }
    const draftData = {
      subject: selectedPattern.subject,
      entryIds: selectedPattern.entries.map((e) => e.id),
      moduleName: moduleName || selectedPattern.subject,
    };
    if (status === 'complete') {
      setEditing(normalizeToEditData('retrospective', draftData as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const ok = await saveDraft('retrospective', draftData, status);
    setSaving(false);
    if (ok) setSaved(true);
    else setError('Something went wrong. Please try again.');
  };

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

  if (saved) return <SavedView onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} onBack={() => setEditing(null)} onSaved={() => setSaved(true)} />;

  return (
    <div className="flex flex-col gap-lg">
      <PathwayHeader emoji="🔄" name="Retrospective Lift" subtitle="We'll find patterns in your logs and turn them into a reusable module." onBack={onBack} />

      {loadingEntries ? (
        <p className="font-sans text-sm text-text-muted animate-pulse">Looking through your logs…</p>
      ) : patterns.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
          <span className="text-3xl mb-md block" aria-hidden="true">📋</span>
          <p className="font-serif text-base font-semibold text-text-primary mb-xs">No patterns yet</p>
          <p className="font-serif text-sm text-text-secondary">
            Log at least 2 activities in the same subject area and we&apos;ll spot the pattern for you.
          </p>
        </div>
      ) : (
        <>
          <div>
            <OLabel>Patterns spotted in your logs</OLabel>
            <div className="flex flex-col gap-sm">
              {patterns.map((pattern) => {
                const active = selectedPattern?.subject === pattern.subject;
                return (
                  <button
                    key={pattern.subject}
                    type="button"
                    onClick={() => { setSelectedPattern(pattern); setModuleName(pattern.subject); }}
                    className={[
                      'flex items-start gap-md rounded-lg border p-md text-left transition-all duration-200',
                      active
                        ? 'border-ember/40 bg-ember-glow'
                        : 'border-border-subtle bg-surface-raised hover:border-border-medium',
                    ].join(' ')}
                  >
                    <span className={`mt-xs h-[10px] w-[10px] flex-shrink-0 rounded-full ${active ? 'bg-ember' : 'bg-border-medium'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-base font-semibold text-text-primary">{pattern.subject}</p>
                      <p className="font-sans text-xs text-text-muted mt-[2px]">
                        {pattern.entries.length} logs · {formatDate(pattern.earliest)} – {formatDate(pattern.latest)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPattern && (
            <>
              <div>
                <OLabel>Matching entries</OLabel>
                <div className="rounded-lg border border-border-subtle bg-surface-raised divide-y divide-border-subtle overflow-hidden">
                  {selectedPattern.entries.map((e) => (
                    <div key={e.id} className="flex items-center gap-sm px-md py-sm">
                      <span className="font-sans text-[10px] text-text-muted w-[56px] flex-shrink-0">{formatDate(e.dateOccurred)}</span>
                      <span className="font-serif text-sm text-text-primary flex-1 truncate">{e.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
                  What would you call this module? <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder={selectedPattern.subject}
                  className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember"
                />
              </div>

              {error && <p className="font-sans text-sm text-red-400">{error}</p>}

              <FormActions saving={saving} onDraft={() => handleSave('draft')} onContinue={() => handleSave('complete')} continueLabel="Review the evidence →" />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Goal-Forward Pathway ───────────────────────────────────────────────────

type GoalMode = 'aspiration' | 'capability';

interface GoalForwardDraft {
  mode: GoalMode;
  goal: string;
  successLooksLike: string;
  duration: string;
  setting: string;
  threadId: string;
  threadName: string;
  tier: string;
  preferences: string[];
}

function GoalForwardPathwayForm({ onBack, onSwitchPathway }: { onBack: () => void; onSwitchPathway: (p: Pathway) => void }) {
  const [mode, setMode] = useState<GoalMode>('aspiration');
  const [form, setForm] = useState<GoalForwardDraft>({
    mode: 'aspiration',
    goal: '',
    successLooksLike: '',
    duration: '',
    setting: 'either',
    threadId: '',
    threadName: '',
    tier: '',
    preferences: [],
  });
  const [threadSearch, setThreadSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<SharedEditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skeletons, setSkeletons] = useState<import('@/lib/sanity/queries').SkeletonRecord[] | null>(null);
  const [selectedSkeleton] = useState<import('@/lib/sanity/queries').SkeletonRecord | null>(null);
  const [loadingSkeletons, setLoadingSkeletons] = useState(false);
  const nudge = detectCrossPathNudge('goal', form.goal + ' ' + form.successLooksLike);

  const togglePref = (id: string) =>
    setForm((f) => ({ ...f, preferences: f.preferences.includes(id) ? f.preferences.filter((x) => x !== id) : [...f.preferences, id] }));

  const filteredThreads = threadSearch.trim()
    ? CAPABILITY_THREADS.filter((t) => t.name.toLowerCase().includes(threadSearch.toLowerCase()) || t.domain.toLowerCase().includes(threadSearch.toLowerCase()))
    : CAPABILITY_THREADS;

  const threadsByDomain = filteredThreads.reduce<Record<string, typeof CAPABILITY_THREADS>>((acc, t) => {
    if (!acc[t.domain]) acc[t.domain] = [];
    acc[t.domain].push(t);
    return acc;
  }, {});

  const handleSave = async (status: 'draft' | 'complete') => {
    if (mode === 'aspiration' && !form.goal.trim()) { setError('Describe your learning goal.'); return; }
    if (mode === 'capability' && (!form.threadId || !form.tier)) { setError('Select a capability thread and a tier.'); return; }
    if (status === 'complete') {
      if (mode === 'capability') {
        setLoadingSkeletons(true);
        try {
          const threadCapDomain: Record<string, string> = {
            M1: 'mathematical', M2: 'mathematical', M3: 'mathematical', M4: 'mathematical', M5: 'mathematical',
            S1: 'scientific', S2: 'scientific', S3: 'scientific',
            L1: 'language', L2: 'language', L3: 'language', L4: 'language', L5: 'language',
            EF1: 'executive_function', EF2: 'executive_function',
            P1: 'physical', P2: 'physical',
            C1: 'creative', C2: 'creative', C3: 'creative',
          };
          const domain = threadCapDomain[form.threadId] ?? 'mathematical';
          const pref = form.preferences[0] ?? 'any';
          const res = await fetch(`/api/skeletons?threadId=${form.threadId}&domain=${domain}&tier=${form.tier?.toLowerCase()}&pref=${pref}`);
          const data = await res.json();
          setSkeletons(Array.isArray(data) ? data : []);
        } catch {
          setSkeletons([]);
        } finally {
          setLoadingSkeletons(false);
        }
        return;
      }
      setEditing(normalizeToEditData('goal', { ...form, mode } as unknown as Record<string, unknown>));
      return;
    }
    setSaving(true); setError(null);
    const ok = await saveDraft('goal', { ...form, mode }, status);
    setSaving(false);
    if (ok) setSaved(true);
    else setError('Something went wrong. Please try again.');
  };

  if (saved) return <SavedView onBack={onBack} />;
  if (editing) return <SharedEditView initialData={editing} onBack={() => setEditing(null)} onSaved={() => setSaved(true)} />;

  if (mode === 'capability' && skeletons !== null && !selectedSkeleton) {
    return (
      <div className="flex flex-col gap-lg">
        <div className="flex items-center gap-sm">
          <button
            onClick={() => setSkeletons(null)}
            className="font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            ← Back
          </button>
        </div>
        <div>
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
            Choose a starting point
          </h2>
          <p className="font-serif text-sm text-text-secondary">
            These are pre-built ideas for {form.threadName} · {form.tier}. Pick one and we&apos;ll pre-fill the editor.
          </p>
        </div>

        {loadingSkeletons ? (
          <p className="font-sans text-sm text-text-muted animate-pulse">Finding ideas for you…</p>
        ) : skeletons.length === 0 ? (
          <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
            <span className="text-3xl mb-md block" aria-hidden="true">🔮</span>
            <p className="font-serif text-base font-semibold text-text-primary mb-xs">No pre-built ideas yet</p>
            <p className="font-serif text-sm text-text-secondary mb-lg">We&apos;re still building the library. Start from scratch — the editor will still help you structure the learning.</p>
            <button
              onClick={() => {
                setEditing(normalizeToEditData('goal', { ...form, mode } as unknown as Record<string, unknown>));
              }}
              className="font-sans text-sm font-semibold bg-ember text-text-inverse rounded-md px-md py-sm min-h-[44px] transition-all duration-200"
            >
              Start from scratch →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-md">
            {skeletons.map((skeleton) => (
              <button
                key={skeleton._id}
                type="button"
                onClick={() => {
                  const editData = normalizeToEditData('goal', { ...form, mode } as unknown as Record<string, unknown>);
                  editData.title = skeleton.title;
                  editData.targetUnderstanding = skeleton.suggestedUnderstanding;
                  editData.steps = skeleton.suggestedSteps.map((s, i) => ({
                    id: `step-${i}`,
                    title: s.title,
                    instructions: s.instructions,
                    observationHint: s.observationHint,
                  }));
                  editData.materials = skeleton.suggestedMaterials.map((m) => m.name);
                  setEditing(editData);
                }}
                className="bg-surface-panel rounded-lg border border-border-subtle p-lg text-left transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:border-border-medium hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:translate-y-[-1px]"
              >
                <div className="flex items-start justify-between gap-sm mb-sm">
                  <h3 className="font-serif text-base font-semibold text-text-primary">{skeleton.title}</h3>
                  {skeleton.confidence === 'curated' && (
                    <span className="font-sans text-[10px] font-semibold bg-sage/10 text-sage border border-sage/20 px-xs py-[2px] rounded-full flex-shrink-0">
                      ✓ Curated
                    </span>
                  )}
                </div>
                <p className="font-serif text-sm text-text-secondary mb-md leading-relaxed">{skeleton.description}</p>
                <div className="flex flex-wrap gap-xs">
                  {skeleton.estimatedDuration && (
                    <span className="font-sans text-xs text-text-muted">⏱ {skeleton.estimatedDuration} min</span>
                  )}
                  {skeleton.setting && skeleton.setting !== 'either' && (
                    <span className="font-sans text-xs text-text-muted">
                      {skeleton.setting === 'indoor' ? '🏠' : '🌿'} {skeleton.setting}
                    </span>
                  )}
                  <span className="font-sans text-xs text-text-muted">{skeleton.suggestedSteps.length} steps</span>
                </div>
              </button>
            ))}

            <button
              onClick={() => setEditing(normalizeToEditData('goal', { ...form, mode } as unknown as Record<string, unknown>))}
              className="font-sans text-sm text-text-muted hover:text-text-secondary text-center underline underline-offset-2 transition-colors duration-200"
            >
              Start from scratch instead
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-xl lg:items-start">
      <div className="flex flex-col gap-lg">
        <PathwayHeader emoji="🎯" name="Goal-Forward" subtitle="Target a specific capability or learning gap." onBack={onBack} />

        {/* Mode switcher */}
        <div className="flex gap-xs rounded-lg border border-border-subtle bg-surface-raised p-xs">
          {(['aspiration', 'capability'] as GoalMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setForm((f) => ({ ...f, mode: m })); }}
              className={[
                'flex-1 rounded-md py-sm font-sans text-sm font-semibold transition-all duration-200',
                mode === m
                  ? 'bg-ember text-text-inverse shadow-[0_2px_8px_rgba(217,123,58,0.3)]'
                  : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              {m === 'aspiration' ? '✏️ I have a goal' : '🧵 I have a thread'}
            </button>
          ))}
        </div>

        {mode === 'aspiration' && (
          <>
            <div>
              <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
                What do you want them to learn or get better at?
              </label>
              <textarea
                value={form.goal}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                placeholder="e.g. I want them to get more confident with fractions, or understand how ecosystems work…"
                rows={3}
                className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember focus:shadow-focus"
              />
            </div>

            <div>
              <label className="font-sans text-xs font-medium text-text-secondary block mb-xs">
                What would it look like if they were getting it? <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={form.successLooksLike}
                onChange={(e) => setForm((f) => ({ ...f, successLooksLike: e.target.value }))}
                placeholder="e.g. They'd start noticing fractions in everyday life, or confidently explain how one living thing affects another…"
                rows={2}
                className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-serif text-sm text-text-primary placeholder:text-text-muted outline-none resize-y leading-relaxed transition-all duration-200 focus:border-ember"
              />
            </div>

            <QuickSettings
              duration={form.duration}
              setting={form.setting}
              onDuration={(v) => setForm((f) => ({ ...f, duration: v }))}
              onSetting={(v) => setForm((f) => ({ ...f, setting: v }))}
            />
          </>
        )}

        {mode === 'capability' && (
          <>
            <div>
              <OLabel>Which capability thread?</OLabel>
              <input
                type="text"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder="Search e.g. fractions, reading, science…"
                className="w-full bg-surface-raised border border-border-subtle rounded-md py-[10px] px-md font-sans text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-ember mb-sm"
              />
              <div className="rounded-lg border border-border-subtle bg-surface-raised overflow-hidden divide-y divide-border-subtle max-h-[280px] overflow-y-auto">
                {Object.entries(threadsByDomain).map(([domain, threads]) => (
                  <div key={domain}>
                    <p className="font-sans text-[10px] font-semibold text-text-muted uppercase tracking-[0.1em] px-md py-xs bg-surface-body/50">
                      {domain}
                    </p>
                    {threads.map((t) => {
                      const active = form.threadId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, threadId: t.id, threadName: t.name }))}
                          className={[
                            'w-full flex items-center gap-sm px-md py-sm text-left transition-colors duration-200',
                            active ? 'bg-ember-glow text-ember' : 'hover:bg-surface-hover text-text-primary',
                          ].join(' ')}
                        >
                          <span className={`h-[8px] w-[8px] flex-shrink-0 rounded-full ${active ? 'bg-ember' : 'bg-border-medium'}`} />
                          <span className="font-serif text-sm">{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {form.threadId && (
              <>
                <div>
                  <OLabel>Where are they now?</OLabel>
                  <div className="flex flex-wrap gap-sm">
                    {TIERS.map((tier) => (
                      <PillButton key={tier} active={form.tier === tier} onClick={() => setForm((f) => ({ ...f, tier }))}>
                        {tier}
                      </PillButton>
                    ))}
                  </div>
                </div>

                <div>
                  <OLabel>What does your family enjoy?</OLabel>
                  <div className="flex flex-wrap gap-sm">
                    {ACTIVITY_PREFERENCES.map((p) => (
                      <PillButton key={p.id} active={form.preferences.includes(p.id)} onClick={() => togglePref(p.id)}>
                        {p.label}
                      </PillButton>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <CrossPathNudge suggestion={nudge} onSwitch={onSwitchPathway} />
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}

        <FormActions
          saving={saving}
          onDraft={() => handleSave('draft')}
          onContinue={() => handleSave('complete')}
          continueLabel={mode === 'capability' ? 'See suggested modules →' : 'Build the module →'}
        />
      </div>

      <AiCompanionPanel hints={
        mode === 'aspiration'
          ? [
              'A loose goal is fine — we\'ll help sharpen it into a module.',
              'Describing what success looks like helps us suggest the right activities.',
              'You don\'t need to know the curriculum. Just describe the learning.',
            ]
          : [
              'Threads come from the Australian Curriculum — but you pick them in plain language.',
              'Tier helps us pitch the difficulty right.',
              'Preferences match the activity to your family\'s style.',
            ]
      } />
    </div>
  );
}

// ── Entry selector ─────────────────────────────────────────────────────────

export default function BuildModulesPage() {
  const [selected, setSelected] = useState<Pathway | null>(null);

  if (selected === 'material') {
    return <div className="px-md py-lg max-w-4xl mx-auto"><MaterialPathwayForm onBack={() => setSelected(null)} onSwitchPathway={setSelected} /></div>;
  }
  if (selected === 'process') {
    return <div className="px-md py-lg max-w-4xl mx-auto"><ProcessPathwayForm onBack={() => setSelected(null)} onSwitchPathway={setSelected} /></div>;
  }
  if (selected === 'inquiry') {
    return <div className="px-md py-lg max-w-4xl mx-auto"><InquiryPathwayForm onBack={() => setSelected(null)} onSwitchPathway={setSelected} /></div>;
  }
  if (selected === 'retrospective') {
    return <div className="px-md py-lg max-w-2xl mx-auto"><RetrospectiveLiftPathwayForm onBack={() => setSelected(null)} /></div>;
  }
  if (selected === 'goal') {
    return <div className="px-md py-lg max-w-4xl mx-auto"><GoalForwardPathwayForm onBack={() => setSelected(null)} onSwitchPathway={setSelected} /></div>;
  }

  return (
    <div className="px-md py-lg max-w-2xl mx-auto">
      <div className="mb-xl">
        <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Build</p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary mb-xs">
          Create a module
        </h1>
        <p className="font-serif text-text-secondary">
          Where does your thinking start? Choose a pathway and we&apos;ll build from there.
        </p>
      </div>

      <div className="flex flex-col gap-sm mb-sm">
        {PATHWAYS.map((pathway) => (
          <button
            key={pathway.id}
            onClick={() => setSelected(pathway.id)}
            className={[
              'flex items-start gap-md bg-surface-panel border rounded-lg p-md text-left w-full shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:bg-surface-hover hover:border-border-medium hover:translate-y-[-1px]',
              pathway.id === 'retrospective' ? 'border-ember/25' : 'border-border-subtle',
            ].join(' ')}
          >
            <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-surface-raised rounded-md text-xl">
              {pathway.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-base font-semibold text-text-primary leading-snug mb-xs">
                {pathway.label}
              </p>
              <p className="font-sans text-sm text-text-secondary leading-snug">
                {pathway.hint}
              </p>
              {pathway.badge && (
                <span className="inline-flex items-center gap-xs font-sans text-xs font-medium text-ember bg-ember-glow px-sm py-[2px] rounded-full mt-[6px]">
                  ✨ {pathway.badge}
                </span>
              )}
            </div>
            <span className="text-text-muted text-base self-center flex-shrink-0">›</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-md my-md">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="font-sans text-xs text-text-muted">More structured</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      <button
        onClick={() => setSelected(GOAL_PATHWAY.id)}
        className="flex items-start gap-md bg-surface-panel border border-border-subtle rounded-lg p-md text-left w-full shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:bg-surface-hover hover:border-border-medium hover:translate-y-[-1px]"
      >
        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-surface-raised rounded-md text-xl">
          {GOAL_PATHWAY.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-base font-semibold text-text-primary leading-snug mb-xs">
            {GOAL_PATHWAY.label}
          </p>
          <p className="font-sans text-sm text-text-secondary leading-snug">
            {GOAL_PATHWAY.hint}
          </p>
        </div>
        <span className="text-text-muted text-base self-center flex-shrink-0">›</span>
      </button>

      <p className="font-sans text-sm text-text-muted text-center mt-lg">
        Not sure where to start?{' '}
        <a href="/explore/activities" className="text-ember underline underline-offset-2 transition-colors duration-200 hover:text-ember-hover">
          Browse Activity Discovery
        </a>
      </p>
    </div>
  );
}
