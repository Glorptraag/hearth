type TemplateStep = { title: string; instructions: string; observationHint: string };
type TemplateKey = string;

export const SESSION_TEMPLATES: Record<string, Record<TemplateKey, TemplateStep[]>> = {
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

export function getTemplateSteps(resourceType: string, usageIntents: string[]): Array<{ id: string; title: string; instructions: string; observationHint: string }> {
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
