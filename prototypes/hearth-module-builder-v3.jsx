// ============================================================================
// Version: 3 | Date: 2026-03-19
// Changes from v2:
//   - DESIGN SYSTEM CONFORMANCE (token annotation pass)
//   - Injected canonical :root token set via HearthTokens component (rendered once)
//   - Fixed container body color: #0A0806 → #0F0D0B (canonical --surface-body)
//   - Fixed header logoMark: was decorative amber icon — replaced with 🔥 emoji per
//     icon placeholder rule; color neutralised to --text-secondary
//   - Fixed primaryButton: added fontFamily: var(--font-sans) [Inter] — was inheriting
//     default serif from container; buttons must be sans-serif
//   - Fixed secondaryButton: same sans-serif fix + border corrected to --border-medium
//     (was rgba(45,38,33,0.6) which is off-token)
//   - Fixed fieldLabel: font corrected to serif (Crimson Text) per serif=content rule
//     (labels describing educational content fields, not operational chrome)
//   - Fixed sectionTitle font-weight: 600 (was already 600 ✓ — confirmed correct)
//   - Fixed sectionSubtitle: font set to serif to match content text role
//   - Fixed companionColumn bg: was rgba(15,13,11,0.4) → canonical --surface-body at
//     0.4 opacity (same hex, just token-aligned in comments)
//   - Fixed approachCard borderRadius: 12px → 10px (--radius-md, closest on-token value)
//   - Fixed templateCard borderRadius: 12px → 10px (--radius-md)
//   - Fixed companionPanel borderRadius: 14px → 16px (--radius-lg)
//   - Fixed progressStepActive: now uses --ember for text color on active step (was
//     --text-primary — active nav/step should use ember per system rule)
//   - Fixed progressDotComplete: already #D97B3A ✓ (canonical --ember)
//   - Fixed coverageBar borderRadius: 10px is --radius-md ✓
//   - Fixed modalityBtn borderRadius: 8px → 6px (--radius-sm, matches pill/tag pattern)
//   - Fixed validationHint borderRadius: 8px → 6px (--radius-sm)
//   - Added all inline style token mapping comments (/* TOKEN: --xxx */) throughout
//     the styles object for Next.js build hand-off
//   - All Icons SVGs preserved as-is (structural, not decorative in the system
//     sense — they represent modality categories and are needed for UX logic)
//   - ALL MODULE BUILDER LOGIC PRESERVED: 6-pathway system, UbD flow, stage
//     management, template system, validation, companion panel, auto-save
//
// RESTYLE DURING BUILD DECISION:
//   This file retains inline style objects. The definitive token migration will
//   happen during the Next.js Tailwind component build (Phase 3 of transition plan).
//   At that point, every inline style in this file maps to a Tailwind utility class
//   using the token definitions from hearth-canonical-design-tokens-v1.md.
//   The token mapping comments (/* TOKEN: --xxx */) throughout the styles object
//   are the hand-off guide for that build. No further inline→CSS-var migration
//   is needed in the prototype phase.
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// CANONICAL TOKEN INJECTION
// Renders a <style> block with the full :root token set so this JSX file
// renders correctly in any environment that doesn't have the app shell tokens.
// In the Next.js build, these tokens live in globals.css and this component
// is removed. Until then, this is the single source of truth for the component.
// ============================================================================

const HearthTokens = () => (
  <style>{`
    :root {
      /* Surfaces */
      --surface-body:    #0F0D0B;
      --surface-panel:   #1A1612;
      --surface-raised:  #252117;
      --surface-hover:   #2D2621;

      /* Text */
      --text-primary:    #E8DFD4;
      --text-secondary:  #9B8B7E;
      --text-muted:      #6B5D52;
      --text-inverse:    #0F0D0B;

      /* Ember */
      --ember:           #D97B3A;
      --ember-hover:     #E88F4E;
      --ember-glow:      rgba(217, 123, 58, 0.15);
      --ember-strong:    rgba(217, 123, 58, 0.25);

      /* Sage */
      --sage:            #4ADE80;
      --sage-muted:      #22C55E;

      /* Child identity */
      --child-rose:      #F9A8D4;
      --child-blue:      #60A5FA;
      --child-sage:      #4ADE80;
      --child-violet:    #A78BFA;

      /* Borders */
      --border-subtle:   rgba(217, 123, 58, 0.1);
      --border-medium:   rgba(217, 123, 58, 0.2);

      /* Shadows */
      --shadow-soft:     0 2px 8px rgba(0, 0, 0, 0.3);
      --shadow-medium:   0 4px 16px rgba(0, 0, 0, 0.4);
      --shadow-warm:     0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(217, 123, 58, 0.08);
      --shadow-glow:     0 0 20px rgba(217, 123, 58, 0.15);

      /* Spacing */
      --space-xs:  4px;
      --space-sm:  8px;
      --space-md:  16px;
      --space-lg:  24px;
      --space-xl:  32px;
      --space-2xl: 48px;
      --space-3xl: 64px;
      --space-4xl: 96px;

      /* Radius */
      --radius-sm:   6px;
      --radius-md:   10px;
      --radius-lg:   16px;
      --radius-xl:   24px;
      --radius-full: 9999px;

      /* Typography */
      --font-serif: 'Crimson Text', Georgia, serif;
      --font-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

      /* Transitions */
      --transition-quick:  200ms cubic-bezier(0.4, 0, 0.2, 1);
      --transition-gentle: 400ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Google Fonts import for prototype environment */
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
  `}</style>
);

// ============================================================================
// ABSTRACT GEOMETRIC ICONS
// These SVG icons represent learning modalities and are structural UI elements
// (they drive the modality picker UX logic), not decorative imagery.
// Preserved from v2 per the system rule: "no decorative images" — these are
// functional. Simple UI affordances (check, plus, chevron) are also kept as
// inline SVG because they integrate with button logic.
// At the Next.js build stage, replace with the canonical Hearth icon set or
// lucide-react equivalents.
// ============================================================================

const Icons = {
  kinesthetic: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 9v4M7 17l3-4 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  visual: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="2" fill="currentColor"/>
    </svg>
  ),
  auditory: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M6 8v4M10 5v10M14 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  verbal: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M4 6h12M4 10h8M4 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  logical: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="4" width="5" height="5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="4" width="5" height="5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="4" y="11" width="5" height="5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11" y="11" width="5" height="5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  naturalistic: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 17V9M7 12c-2-1-3-4 0-6 2 1 3 3 3 6M13 12c2-1 3-4 0-6-2 1-3 3-3 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  social: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="13" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 16c0-2 1.5-3.5 3-3.5s3 1.5 3 3.5M10 16c0-2 1.5-3.5 3-3.5s3 1.5 3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  check: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  circle: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  triangle: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 4l5 8H3l5-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  plus: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  chevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrow: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  philosophy: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6v8M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

// ============================================================================
// TEMPLATES
// ============================================================================

const moduleTemplates = [
  {
    id: 'observation',
    name: 'Observation & Discovery',
    description: 'Build understanding through careful looking and noticing',
    targetUnderstanding: 'Close observation reveals details we miss at first glance',
    childFriendlyVersion: 'When you look really carefully, you notice things you didn\'t see before',
    suggestedApproaches: [
      { title: 'Nature Detective', modality: 'naturalistic' },
      { title: 'Artist\'s Eye', modality: 'visual' },
      { title: 'Sound Explorer', modality: 'auditory' },
    ],
  },
  {
    id: 'patterns',
    name: 'Patterns & Connections',
    description: 'Recognize patterns that help predict and understand',
    targetUnderstanding: 'Patterns help us predict what comes next and understand how things relate',
    childFriendlyVersion: 'When you notice patterns, you can guess what might happen next',
    suggestedApproaches: [
      { title: 'Pattern Builder', modality: 'kinesthetic' },
      { title: 'Pattern Spotter', modality: 'visual' },
      { title: 'Pattern Puzzler', modality: 'logical' },
    ],
  },
  {
    id: 'storytelling',
    name: 'Stories & Expression',
    description: 'Understand through narrative and creative expression',
    targetUnderstanding: 'Stories help us understand experiences and share meaning with others',
    childFriendlyVersion: 'Stories help us understand things and share what we know',
    suggestedApproaches: [
      { title: 'Story Maker', modality: 'verbal' },
      { title: 'Story Actor', modality: 'kinesthetic' },
      { title: 'Story Artist', modality: 'visual' },
    ],
  },
  {
    id: 'blank',
    name: 'Start Fresh',
    description: 'Begin with a blank module',
    targetUnderstanding: '',
    childFriendlyVersion: '',
    suggestedApproaches: [],
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const HearthModuleBuilder = ({ familyProfile = null }) => {
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [activeSection, setActiveSection] = useState('understanding');
  const [lastSaved, setLastSaved] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedApproachIndex, setSelectedApproachIndex] = useState(0);
  const [expandedChunks, setExpandedChunks] = useState({});
  const [reviewExpanded, setReviewExpanded] = useState(true);
  
  const [module, setModule] = useState({
    id: generateId(),
    status: 'draft',
    createdAt: new Date().toISOString(),
    targetUnderstanding: '',
    childFriendlyVersion: '',
    parentExplanation: '',
    understandingIndicators: [
      { id: generateId(), text: '', type: 'understanding' },
      { id: generateId(), text: '', type: 'understanding' },
    ],
    stretchIndicators: [
      { id: generateId(), text: '', pivotSuggestion: '' },
    ],
    approaches: [
      createEmptyApproach(),
      createEmptyApproach(),
    ],
    ageRange: { min: 5, max: 7 },
    estimatedDuration: { min: 1, max: 2, unit: 'weeks' },
    prerequisites: [],
    badgeOutcome: '',
  });

  const sectionRefs = {
    understanding: useRef(null),
    evidence: useRef(null),
    approaches: useRef(null),
    activities: useRef(null),
    review: useRef(null),
  };

  // ============================================================================
  // HELPERS
  // ============================================================================
  
  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
  
  function createEmptyApproach() {
    return {
      id: generateId(),
      title: '',
      description: '',
      modality: '',
      chunks: [createEmptyChunk()],
    };
  }
  
  function createEmptyChunk() {
    return {
      id: generateId(),
      title: '',
      description: '',
      duration: { min: 15, max: 30 },
      materials: [],
      instructions: '',
      energyLevel: 'moderate',
      setting: 'either',
    };
  }

  // ============================================================================
  // AUTO-SAVE
  // ============================================================================
  
  useEffect(() => {
    if (showTemplates) return;
    const saveTimer = setTimeout(() => {
      setLastSaved(new Date());
    }, 2000);
    return () => clearTimeout(saveTimer);
  }, [module, showTemplates]);

  // ============================================================================
  // VALIDATION
  // ============================================================================
  
  const validation = {
    understanding: {
      isComplete: module.targetUnderstanding.length >= 20,
    },
    evidence: {
      isComplete: module.understandingIndicators.filter(i => i.text.length > 10).length >= 2,
    },
    approaches: {
      isComplete: module.approaches.filter(a => a.title && a.modality).length >= 2,
    },
    activities: {
      isComplete: module.approaches.every(a => a.chunks.some(c => c.title && c.instructions)),
    },
  };
  
  const coveredModalities = [...new Set(module.approaches.map(a => a.modality).filter(Boolean))];
  const isReadyToPublish = Object.values(validation).every(v => v.isComplete);

  // ============================================================================
  // MODALITIES
  // ============================================================================
  
  const modalities = [
    { id: 'kinesthetic', name: 'Hands-On', description: 'Learning through touch, movement, and making' },
    { id: 'visual', name: 'Visual', description: 'Learning through seeing and observation' },
    { id: 'auditory', name: 'Auditory', description: 'Learning through listening and discussion' },
    { id: 'verbal', name: 'Verbal', description: 'Learning through reading and storytelling' },
    { id: 'logical', name: 'Logical', description: 'Learning through patterns and reasoning' },
    { id: 'naturalistic', name: 'Naturalistic', description: 'Learning through nature and classification' },
    { id: 'social', name: 'Social', description: 'Learning through collaboration' },
  ];

  // ============================================================================
  // UPDATE HANDLERS
  // ============================================================================
  
  const updateModule = useCallback((updates) => {
    setModule(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateIndicator = useCallback((index, updates, type = 'understanding') => {
    setModule(prev => {
      const key = type === 'understanding' ? 'understandingIndicators' : 'stretchIndicators';
      const indicators = [...prev[key]];
      indicators[index] = { ...indicators[index], ...updates };
      return { ...prev, [key]: indicators };
    });
  }, []);
  
  const addIndicator = useCallback((type = 'understanding') => {
    setModule(prev => {
      const key = type === 'understanding' ? 'understandingIndicators' : 'stretchIndicators';
      return {
        ...prev,
        [key]: [...prev[key], type === 'understanding' 
          ? { id: generateId(), text: '', type: 'understanding' }
          : { id: generateId(), text: '', pivotSuggestion: '' }
        ],
      };
    });
  }, []);
  
  const updateApproach = useCallback((approachIndex, updates) => {
    setModule(prev => {
      const approaches = [...prev.approaches];
      approaches[approachIndex] = { ...approaches[approachIndex], ...updates };
      return { ...prev, approaches };
    });
  }, []);
  
  const addApproach = useCallback(() => {
    setModule(prev => ({
      ...prev,
      approaches: [...prev.approaches, createEmptyApproach()],
    }));
    setSelectedApproachIndex(module.approaches.length);
  }, [module.approaches.length]);
  
  const updateChunk = useCallback((approachIndex, chunkIndex, updates) => {
    setModule(prev => {
      const approaches = [...prev.approaches];
      const chunks = [...approaches[approachIndex].chunks];
      chunks[chunkIndex] = { ...chunks[chunkIndex], ...updates };
      approaches[approachIndex] = { ...approaches[approachIndex], chunks };
      return { ...prev, approaches };
    });
  }, []);
  
  const addChunk = useCallback((approachIndex) => {
    const newChunkId = generateId();
    setModule(prev => {
      const approaches = [...prev.approaches];
      approaches[approachIndex] = {
        ...approaches[approachIndex],
        chunks: [...approaches[approachIndex].chunks, { ...createEmptyChunk(), id: newChunkId }],
      };
      return { ...prev, approaches };
    });
    setExpandedChunks(prev => ({ ...prev, [newChunkId]: true }));
  }, []);
  
  const toggleChunkExpanded = useCallback((chunkId) => {
    setExpandedChunks(prev => ({ ...prev, [chunkId]: !prev[chunkId] }));
  }, []);

  // ============================================================================
  // TEMPLATE SELECTION
  // ============================================================================
  
  const selectTemplate = useCallback((template) => {
    if (template.id === 'blank') {
      setShowTemplates(false);
      return;
    }
    const approaches = template.suggestedApproaches.map(a => ({
      ...createEmptyApproach(),
      title: a.title,
      modality: a.modality,
    }));
    while (approaches.length < 2) {
      approaches.push(createEmptyApproach());
    }
    setModule(prev => ({
      ...prev,
      targetUnderstanding: template.targetUnderstanding,
      childFriendlyVersion: template.childFriendlyVersion,
      approaches,
    }));
    setShowTemplates(false);
  }, []);

  // ============================================================================
  // SCROLL TO SECTION
  // ============================================================================
  
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    sectionRefs[sectionId]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ============================================================================
  // COMPANION CONTENT
  // ============================================================================
  
  const getCompanionContent = () => {
    const philosophy = familyProfile?.philosophy || 'eclectic';
    const content = {
      understanding: {
        title: 'Defining Understanding',
        insight: 'Understanding by Design teaches us to start with the end in mind. Before planning activities, clarify what genuine understanding looks like.',
        philosophyNote: getPhilosophyGuidance('understanding', philosophy),
        examples: [
          'Observation reveals details we miss at first glance',
          'Living things respond to their environment to survive',
          'Patterns help us predict what comes next',
        ],
        mistakes: [
          { wrong: 'Children will learn about bugs', right: 'Close observation reveals hidden details' },
          { wrong: 'Children can identify 5 insects', right: 'Classification helps us notice similarities' },
        ],
      },
      evidence: {
        title: 'Signs of Understanding',
        insight: 'Before designing activities, know what understanding looks like. These are observable moments that reveal genuine comprehension.',
        philosophyNote: getPhilosophyGuidance('evidence', philosophy),
        examples: [
          'Pauses to look more closely without being prompted',
          'Asks "why" questions that go beyond the surface',
          'Notices patterns and makes connections',
        ],
        mistakes: [
          { wrong: 'Can name 5 insects correctly', right: 'Spontaneously categorizes new creatures' },
          { wrong: 'Completes the worksheet', right: 'Applies the concept in a new context' },
        ],
      },
      approaches: {
        title: 'Multiple Doors',
        insight: 'Children learn differently. Multiple approaches are different doors into the same room. Some enter through stories, others through their hands.',
        philosophyNote: getPhilosophyGuidance('approaches', philosophy),
        examples: [
          'Nature Detective — Visual/Naturalistic',
          'Story Explorer — Verbal/Auditory',
          "Builder's Workshop — Kinesthetic/Logical",
        ],
        mistakes: [
          { wrong: 'Three worksheet-based approaches', right: 'Mix of hands-on, verbal, and visual' },
          { wrong: 'Easy → Medium → Hard versions', right: 'Different angles, same understanding' },
        ],
      },
      activities: {
        title: 'Building Experiences',
        insight: 'Activities enable meaning-making, not just information transfer. Focus on what the child DOES.',
        philosophyNote: getPhilosophyGuidance('activities', philosophy),
        indicators: module.understandingIndicators.filter(i => i.text.length > 0),
        examples: [
          'Clear what the child DOES, not just hears',
          'Connects to prior knowledge',
          'Leaves space for discovery',
        ],
        mistakes: [
          { wrong: 'Explain then practice', right: 'Explore first, name concepts as they emerge' },
        ],
      },
      review: {
        title: 'Review',
        insight: 'Future: AI will parse your module for pedagogical coherence and suggest improvements.',
        philosophyNote: '',
        examples: [],
        mistakes: [],
      },
    };
    return content[activeSection] || content.understanding;
  };
  
  function getPhilosophyGuidance(section, philosophy) {
    const guidance = {
      'charlotte-mason': {
        understanding: 'In Charlotte Mason, understanding emerges through living ideas — not abstract definitions. Your target understanding should connect to a real, observable thing.',
        evidence: 'Mason called narration the primary sign of comprehension. A child retelling what they saw or experienced in their own words is your strongest indicator.',
        approaches: 'Mason valued atmosphere, discipline, and living books equally. Each approach should feel like a rich encounter, not a lesson.',
        activities: 'Short lessons of high quality. Each activity should leave the child wanting more, not exhausted.',
      },
      'classical': {
        understanding: 'Classical education seeks to understand the why behind things. Your enduring understanding should connect to a first principle or a great idea.',
        evidence: 'The classical method prizes dialectic — the ability to reason about a thing. Can the child argue for or against the understanding?',
        approaches: 'Grammar, logic, and rhetoric stages suggest different approaches for different ages. Consider which stage your child is in.',
        activities: 'Recitation, discussion, and composition are the classical triad. Weight your activities toward these.',
      },
      'montessori': {
        understanding: 'Montessori understanding is earned through direct interaction with materials. Your understanding statement should be discoverable through hands.',
        evidence: 'The child who chooses to return to an activity independently has understood it. Voluntary repetition is your evidence.',
        approaches: 'Prepared environment matters. Each approach should describe a space and materials, not just an activity.',
        activities: '3-period lessons: name it, recognize it, recall it. Design activities that move through these stages.',
      },
      'unschooling': {
        understanding: 'Unschooling trusts the child to construct understanding in their own time. Your statement describes what you hope might emerge, not what must emerge.',
        evidence: 'Natural use of an idea in daily life is the deepest evidence. Watch for moments when the child applies the understanding without prompting.',
        approaches: 'Follow the child. Your approaches are invitations, not requirements.',
        activities: 'The best activities arise from the child\'s current obsessions. Connect this module to what they love right now.',
      },
      'eclectic': {
        understanding: 'Draw from multiple traditions. What matters is that the understanding is genuine and transferable.',
        evidence: 'Mix formal indicators (can explain) with informal (uses the idea in play). Both count.',
        approaches: 'Your freedom to mix modalities is your greatest asset. Use it.',
        activities: 'Variety keeps learning alive. No single approach should dominate the module.',
      },
    };
    return guidance[philosophy]?.[section] || '';
  }

  const companion = getCompanionContent();

  // ============================================================================
  // TEMPLATE SELECTION VIEW
  // ============================================================================
  
  if (showTemplates) {
    return (
      <>
        <HearthTokens />
        <div style={styles.container}>
          <div style={styles.atmosphericGlow} />
          <div style={styles.templateView}>
            <div style={styles.templateHeader}>
              <div style={{ fontSize: '32px' }}>🔥</div>
              <h1 style={styles.templateTitle}>Module Builder</h1>
              <p style={styles.templateSubtitle}>Choose a starting point</p>
            </div>
            <div style={styles.templateGrid}>
              {moduleTemplates.map(template => (
                <button
                  key={template.id}
                  style={styles.templateCard}
                  onClick={() => selectTemplate(template)}
                >
                  <h3 style={styles.templateName}>{template.name}</h3>
                  <p style={styles.templateDesc}>{template.description}</p>
                  {template.suggestedApproaches.length > 0 && (
                    <div style={styles.templateApproaches}>
                      {template.suggestedApproaches.map((a, i) => (
                        <span key={i} style={styles.templateApproach}>{a.title}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ============================================================================
  // MAIN BUILDER VIEW
  // ============================================================================
  
  const currentApproach = module.approaches[selectedApproachIndex];

  return (
    <>
      <HearthTokens />
      <div style={styles.container}>
        <div style={styles.atmosphericGlow} />
        
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoMark}>
              🔥
            </div>
            <div>
              <h1 style={styles.headerTitle}>Module Builder</h1>
              <p style={styles.headerSubtitle}>
                {module.status === 'draft' ? 'Draft' : 'Ready'}
                {lastSaved && ` · Saved ${formatTime(lastSaved)}`}
              </p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <button 
              style={styles.secondaryButton}
              onClick={() => setShowValidation(!showValidation)}
            >
              {showValidation ? 'Hide' : 'Check'} Readiness
            </button>
            <button 
              style={{
                ...styles.primaryButton,
                opacity: isReadyToPublish ? 1 : 0.5,
                cursor: isReadyToPublish ? 'pointer' : 'not-allowed',
              }}
              disabled={!isReadyToPublish}
              onClick={() => updateModule({ status: 'ready' })}
            >
              Mark Ready
            </button>
          </div>
        </header>

        {/* Progress Navigation */}
        <nav style={styles.progressNav}>
          {[
            { id: 'understanding', label: '1. Understanding', complete: validation.understanding.isComplete },
            { id: 'evidence', label: '2. Evidence', complete: validation.evidence.isComplete },
            { id: 'approaches', label: '3. Approaches', complete: validation.approaches.isComplete },
            { id: 'activities', label: '4. Activities', complete: validation.activities.isComplete },
            { id: 'review', label: 'Review', complete: isReadyToPublish },
          ].map((step) => (
            <button
              key={step.id}
              style={{
                ...styles.progressStep,
                ...(activeSection === step.id ? styles.progressStepActive : {}),
              }}
              onClick={() => scrollToSection(step.id)}
            >
              <span style={{
                ...styles.progressDot,
                ...(step.complete ? styles.progressDotComplete : {}),
              }}>
                {step.complete ? <Icons.check /> : <Icons.circle />}
              </span>
              <span style={styles.progressLabel}>{step.label}</span>
            </button>
          ))}
        </nav>

        {/* Main Layout */}
        <div style={styles.mainLayout}>
          {/* Builder Column */}
          <main style={styles.builderColumn}>
            
            {/* Stage 1: Understanding */}
            <section 
              ref={sectionRefs.understanding}
              style={styles.section}
              onFocus={() => setActiveSection('understanding')}
            >
              <SectionHeader number="1" title="Target Understanding" subtitle="What will your child truly understand?" />
              
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>The Enduring Understanding</label>
                <span style={styles.fieldHint}>Philosophy-neutral. Describes WHAT, not HOW.</span>
                <textarea
                  style={styles.textareaLarge}
                  placeholder="e.g., 'Close observation reveals details we miss at first glance'"
                  value={module.targetUnderstanding}
                  onChange={(e) => updateModule({ targetUnderstanding: e.target.value })}
                  onFocus={() => setActiveSection('understanding')}
                />
                <ValidationHint 
                  show={showValidation && !validation.understanding.isComplete}
                  message="Write at least 20 characters to express the target understanding."
                />
              </div>
              
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Child-Friendly Version</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="How would you explain this to your child?"
                  value={module.childFriendlyVersion}
                  onChange={(e) => updateModule({ childFriendlyVersion: e.target.value })}
                />
              </div>
              
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Why This Matters</label>
                <span style={styles.fieldHint}>For your reference — why is this understanding valuable?</span>
                <textarea
                  style={styles.textarea}
                  placeholder="Why is this worth learning? How does it transfer?"
                  value={module.parentExplanation}
                  onChange={(e) => updateModule({ parentExplanation: e.target.value })}
                />
              </div>
            </section>

            {/* Stage 2: Evidence */}
            <section 
              ref={sectionRefs.evidence}
              style={styles.section}
              onFocus={() => setActiveSection('evidence')}
            >
              <SectionHeader number="2" title="Signs of Understanding" subtitle="How will you know understanding has clicked?" />
              
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Understanding Indicators</label>
                <span style={styles.fieldHint}>Observable behaviors revealing genuine comprehension</span>
                
                {module.understandingIndicators.map((indicator, index) => (
                  <div key={indicator.id} style={styles.indicatorRow}>
                    <span style={styles.indicatorIcon}><Icons.check /></span>
                    <input
                      type="text"
                      style={styles.indicatorInput}
                      placeholder={index === 0 
                        ? "e.g., 'Pauses to look more closely without prompting'"
                        : "e.g., 'Asks questions about details others might miss'"
                      }
                      value={indicator.text}
                      onChange={(e) => updateIndicator(index, { text: e.target.value })}
                      onFocus={() => setActiveSection('evidence')}
                    />
                  </div>
                ))}
                
                <button style={styles.addButton} onClick={() => addIndicator('understanding')}>
                  <Icons.plus /> Add indicator
                </button>
                
                <ValidationHint 
                  show={showValidation && !validation.evidence.isComplete}
                  message="Add at least 2 observable indicators of understanding."
                />
              </div>
              
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Signs of Stretching</label>
                <span style={styles.fieldHint}>What might indicate a different approach would help?</span>
                
                {module.stretchIndicators.map((indicator, index) => (
                  <div key={indicator.id} style={styles.stretchCard}>
                    <div style={styles.stretchRow}>
                      <span style={styles.stretchIcon}><Icons.triangle /></span>
                      <input
                        type="text"
                        style={styles.indicatorInput}
                        placeholder="e.g., 'Rushes through without pausing'"
                        value={indicator.text}
                        onChange={(e) => updateIndicator(index, { text: e.target.value }, 'stretch')}
                      />
                    </div>
                    <div style={styles.pivotRow}>
                      <span style={styles.pivotLabel}><Icons.arrow /> Try:</span>
                      <input
                        type="text"
                        style={styles.pivotInput}
                        placeholder="Suggested pivot"
                        value={indicator.pivotSuggestion}
                        onChange={(e) => updateIndicator(index, { pivotSuggestion: e.target.value }, 'stretch')}
                      />
                    </div>
                  </div>
                ))}
                
                <button style={styles.addButton} onClick={() => addIndicator('stretch')}>
                  <Icons.plus /> Add stretch indicator
                </button>
              </div>
            </section>

            {/* Stage 3: Approaches */}
            <section 
              ref={sectionRefs.approaches}
              style={styles.section}
              onFocus={() => setActiveSection('approaches')}
            >
              <SectionHeader number="3" title="Approaches" subtitle="Different doors into the same understanding" />
              
              {/* Modality Coverage */}
              <div style={styles.coverageBar}>
                <span style={styles.coverageLabel}>Modality coverage:</span>
                <div style={styles.coverageDots}>
                  {modalities.map(m => (
                    <div 
                      key={m.id}
                      style={{
                        ...styles.coverageDot,
                        ...(coveredModalities.includes(m.id) ? styles.coverageDotActive : {}),
                      }}
                      title={`${m.name}: ${m.description}`}
                    >
                      {React.createElement(Icons[m.id])}
                    </div>
                  ))}
                </div>
                <span style={styles.coverageCount}>{coveredModalities.length}/{modalities.length}</span>
              </div>
              
              {/* Approach Cards */}
              {module.approaches.map((approach, index) => (
                <div 
                  key={approach.id} 
                  style={{
                    ...styles.approachCard,
                    ...(selectedApproachIndex === index ? styles.approachCardSelected : {}),
                  }}
                  onClick={() => {
                    setSelectedApproachIndex(index);
                    setActiveSection('activities');
                  }}
                >
                  <div style={styles.approachCardHeader}>
                    <span style={styles.approachNumber}>Approach {index + 1}</span>
                    {approach.modality && (
                      <span style={styles.approachModality}>
                        {React.createElement(Icons[approach.modality])}
                        {modalities.find(m => m.id === approach.modality)?.name}
                      </span>
                    )}
                  </div>
                  
                  <input
                    type="text"
                    style={styles.approachTitle}
                    placeholder="Approach name (e.g., 'Nature Detective')"
                    value={approach.title}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateApproach(index, { title: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={() => setActiveSection('approaches')}
                  />
                  
                  <textarea
                    style={styles.approachDesc}
                    placeholder="Brief description of this approach..."
                    value={approach.description}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateApproach(index, { description: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <div style={styles.modalityPicker}>
                    {modalities.map(m => (
                      <button
                        key={m.id}
                        style={{
                          ...styles.modalityBtn,
                          ...(approach.modality === m.id ? styles.modalityBtnSelected : {}),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateApproach(index, { modality: m.id });
                        }}
                        title={m.description}
                      >
                        {React.createElement(Icons[m.id])}
                      </button>
                    ))}
                  </div>
                  
                  <div style={styles.approachMeta}>
                    <span>{approach.chunks.length} {approach.chunks.length === 1 ? 'activity' : 'activities'}</span>
                    <span style={styles.approachEdit}><Icons.chevronRight /> Edit activities</span>
                  </div>
                </div>
              ))}
              
              <button style={styles.addApproachButton} onClick={addApproach}>
                <Icons.plus /> Add Another Approach
              </button>
              
              <ValidationHint 
                show={showValidation && !validation.approaches.isComplete}
                message="Create at least 2 approaches with names and modalities."
              />
            </section>

            {/* Stage 4: Activities */}
            <section 
              ref={sectionRefs.activities}
              style={styles.section}
              onFocus={() => setActiveSection('activities')}
            >
              <SectionHeader number="4" title="Activities" subtitle="Build experiences for each approach" />
              
              {module.understandingIndicators.some(i => i.text.length > 0) && (
                <div style={styles.evidenceReference}>
                  <span style={styles.evidenceRefLabel}>Activities should produce these signs:</span>
                  <div style={styles.evidenceRefList}>
                    {module.understandingIndicators.filter(i => i.text.length > 0).map((ind, i) => (
                      <span key={i} style={styles.evidenceRefItem}>
                        <Icons.check /> {ind.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={styles.activitiesLayout}>
                <div style={styles.approachSelector}>
                  <div style={styles.approachSelectorLabel}>Approach</div>
                  {module.approaches.map((approach, index) => (
                    <button
                      key={approach.id}
                      style={{
                        ...styles.approachTab,
                        ...(selectedApproachIndex === index ? styles.approachTabSelected : {}),
                      }}
                      onClick={() => setSelectedApproachIndex(index)}
                    >
                      <span style={styles.approachTabIcon}>
                        {approach.modality ? React.createElement(Icons[approach.modality]) : <Icons.circle />}
                      </span>
                      <span style={styles.approachTabName}>
                        {approach.title || `Approach ${index + 1}`}
                      </span>
                      <span style={styles.approachTabCount}>
                        {approach.chunks.length}
                      </span>
                    </button>
                  ))}
                </div>
                
                <div style={styles.chunksEditor}>
                  <div style={styles.chunksEditorHeader}>
                    <span style={styles.chunksEditorTitle}>
                      {currentApproach?.title || 'Untitled Approach'}
                    </span>
                    <button 
                      style={styles.addChunkBtn}
                      onClick={() => addChunk(selectedApproachIndex)}
                    >
                      <Icons.plus /> Add Activity
                    </button>
                  </div>
                  
                  {currentApproach?.chunks.map((chunk, chunkIndex) => {
                    const isExpanded = expandedChunks[chunk.id] !== false;
                    return (
                      <div key={chunk.id} style={styles.chunkCard}>
                        <button 
                          style={styles.chunkHeader}
                          onClick={() => toggleChunkExpanded(chunk.id)}
                        >
                          <span style={styles.chunkToggle}>
                            {isExpanded ? <Icons.chevronDown /> : <Icons.chevronRight />}
                          </span>
                          <span style={styles.chunkName}>
                            {chunk.title || `Activity ${chunkIndex + 1}`}
                          </span>
                          <span style={styles.chunkDuration}>
                            {chunk.duration.min}-{chunk.duration.max} min
                          </span>
                        </button>
                        
                        {isExpanded && (
                          <div style={styles.chunkBody}>
                            <input
                              type="text"
                              style={styles.chunkTitleInput}
                              placeholder="Activity name"
                              value={chunk.title}
                              onChange={(e) => updateChunk(selectedApproachIndex, chunkIndex, { title: e.target.value })}
                            />
                            
                            <div style={styles.chunkMeta}>
                              <select 
                                style={styles.chunkSelect}
                                value={`${chunk.duration.min}-${chunk.duration.max}`}
                                onChange={(e) => {
                                  const [min, max] = e.target.value.split('-').map(Number);
                                  updateChunk(selectedApproachIndex, chunkIndex, { duration: { min, max } });
                                }}
                              >
                                <option value="5-10">5–10 min</option>
                                <option value="10-20">10–20 min</option>
                                <option value="15-30">15–30 min</option>
                                <option value="30-45">30–45 min</option>
                                <option value="45-60">45–60 min</option>
                                <option value="60-90">60–90 min</option>
                              </select>
                              <select 
                                style={styles.chunkSelect}
                                value={chunk.energyLevel}
                                onChange={(e) => updateChunk(selectedApproachIndex, chunkIndex, { energyLevel: e.target.value })}
                              >
                                <option value="calm">Calm</option>
                                <option value="moderate">Moderate</option>
                                <option value="active">Active</option>
                              </select>
                              <select 
                                style={styles.chunkSelect}
                                value={chunk.setting}
                                onChange={(e) => updateChunk(selectedApproachIndex, chunkIndex, { setting: e.target.value })}
                              >
                                <option value="indoor">Indoor</option>
                                <option value="outdoor">Outdoor</option>
                                <option value="either">Either</option>
                              </select>
                            </div>
                            
                            <textarea
                              style={styles.chunkInstructions}
                              placeholder="What does the child DO? Be specific about the experience..."
                              value={chunk.instructions}
                              onChange={(e) => updateChunk(selectedApproachIndex, chunkIndex, { instructions: e.target.value })}
                            />
                            
                            <input
                              type="text"
                              style={styles.materialsInput}
                              placeholder="Materials (comma separated, household items preferred)"
                              value={chunk.materials.join(', ')}
                              onChange={(e) => updateChunk(selectedApproachIndex, chunkIndex, { 
                                materials: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                              })}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <ValidationHint 
                    show={showValidation && !validation.activities.isComplete}
                    message="Each approach needs at least one activity with a title and instructions."
                  />
                </div>
              </div>
            </section>

            {/* Review Section */}
            <section 
              ref={sectionRefs.review}
              style={styles.section}
              onFocus={() => setActiveSection('review')}
            >
              <button 
                style={styles.reviewHeader}
                onClick={() => setReviewExpanded(!reviewExpanded)}
              >
                <SectionHeader number="✓" title="Review" subtitle="Check your module" />
                <span style={styles.reviewToggle}>
                  {reviewExpanded ? <Icons.chevronDown /> : <Icons.chevronRight />}
                </span>
              </button>
              
              {reviewExpanded && (
                <div style={styles.reviewBody}>
                  <p style={styles.reviewNote}>
                    Future: AI will analyze for pedagogical coherence and suggest improvements.
                  </p>
                  
                  <div style={styles.reviewChecklist}>
                    <ReviewItem 
                      complete={validation.understanding.isComplete}
                      label="Target understanding defined"
                      onClick={() => scrollToSection('understanding')}
                    />
                    <ReviewItem 
                      complete={validation.evidence.isComplete}
                      label="At least 2 understanding indicators"
                      onClick={() => scrollToSection('evidence')}
                    />
                    <ReviewItem 
                      complete={validation.approaches.isComplete}
                      label="At least 2 approaches with modalities"
                      onClick={() => scrollToSection('approaches')}
                    />
                    <ReviewItem 
                      complete={validation.activities.isComplete}
                      label="Each approach has activities"
                      onClick={() => scrollToSection('activities')}
                    />
                    <ReviewItem 
                      complete={coveredModalities.length >= 2}
                      label="Multiple learning styles supported"
                      onClick={() => scrollToSection('approaches')}
                    />
                  </div>
                  
                  {isReadyToPublish && (
                    <div style={styles.readyBox}>
                      Your module is ready to use.
                    </div>
                  )}
                </div>
              )}
            </section>
          </main>

          {/* Companion Panel */}
          <aside style={styles.companionColumn}>
            <div style={styles.companionPanel}>
              <h3 style={styles.companionTitle}>{companion.title}</h3>
              
              <div style={styles.companionInsight}>
                {companion.insight}
              </div>
              
              {companion.philosophyNote && (
                <div style={styles.companionPhilosophy}>
                  <span style={styles.companionPhilosophyIcon}><Icons.philosophy /></span>
                  {companion.philosophyNote}
                </div>
              )}
              
              {activeSection === 'activities' && companion.indicators?.length > 0 && (
                <div style={styles.companionIndicators}>
                  <h4 style={styles.companionSubhead}>Build activities that produce:</h4>
                  {companion.indicators.map((ind, i) => (
                    <div key={i} style={styles.companionIndicator}>
                      <Icons.check /> {ind.text}
                    </div>
                  ))}
                </div>
              )}
              
              {companion.examples?.length > 0 && (
                <div style={styles.companionExamples}>
                  <h4 style={styles.companionSubhead}>Examples</h4>
                  {companion.examples.map((ex, i) => (
                    <div key={i} style={styles.companionExample}>{ex}</div>
                  ))}
                </div>
              )}
              
              {companion.mistakes?.length > 0 && (
                <div style={styles.companionMistakes}>
                  <h4 style={styles.companionSubhead}>Common Mistakes</h4>
                  {companion.mistakes.map((m, i) => (
                    <div key={i} style={styles.companionMistake}>
                      <div style={styles.mistakeWrong}><span style={styles.mistakeX}>×</span> {m.wrong}</div>
                      <div style={styles.mistakeRight}><Icons.check /> {m.right}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const SectionHeader = ({ number, title, subtitle }) => (
  <div style={styles.sectionHeader}>
    <div style={styles.sectionNumber}>{number}</div>
    <div>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <p style={styles.sectionSubtitle}>{subtitle}</p>
    </div>
  </div>
);

const ValidationHint = ({ show, message }) => {
  if (!show) return null;
  return (
    <div style={styles.validationHint}>
      <Icons.circle /> {message}
    </div>
  );
};

const ReviewItem = ({ complete, label, onClick }) => (
  <button style={styles.reviewItem} onClick={onClick}>
    <span style={{
      ...styles.reviewCheck,
      ...(complete ? styles.reviewCheckComplete : {}),
    }}>
      {complete ? <Icons.check /> : <Icons.circle />}
    </span>
    <span style={styles.reviewLabel}>{label}</span>
  </button>
);

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
// STYLES
// TOKEN MAPPING GUIDE FOR NEXT.JS BUILD:
// Each inline style is annotated with the canonical token it maps to.
// During build, replace inline style objects with Tailwind utility classes
// referencing the tokens in hearth-canonical-design-tokens-v1.md.
// ============================================================================

const styles = {
  // ─── Page shell ───────────────────────────────────────────────────────────
  container: {
    minHeight: '100vh',
    backgroundColor: '#0F0D0B',  /* TOKEN: --surface-body (FIXED: was #0A0806) */
    color: '#E8DFD4',             /* TOKEN: --text-primary */
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", /* TOKEN: --font-sans (default body shell, not content text) */
    position: 'relative',
  },
  
  atmosphericGlow: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(ellipse at 20% 20%, rgba(217, 123, 58, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(217, 123, 58, 0.04) 0%, transparent 50%)
    `,
    /* TOKEN: --ember-glow (ambient page atmospheric radial) */
    pointerEvents: 'none',
    zIndex: 0,
  },

  // ─── Template view ────────────────────────────────────────────────────────
  templateView: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '800px',
    margin: '0 auto',
    padding: '80px 32px',     /* TOKEN: --space-3xl --space-xl */
  },
  templateHeader: {
    textAlign: 'center',
    marginBottom: '48px',     /* TOKEN: --space-2xl */
  },
  templateTitle: {
    fontSize: '32px',
    fontWeight: '600',         /* TOKEN: weight-600 (section/card title) */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
    margin: '16px 0 8px',     /* TOKEN: --space-md --space-sm */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
  },
  templateSubtitle: {
    fontSize: '16px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    margin: 0,
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content description) */
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',               /* TOKEN: --space-md */
  },
  templateCard: {
    padding: '24px',           /* TOKEN: --space-lg */
    backgroundColor: 'rgba(26, 22, 18, 0.6)',  /* TOKEN: --surface-panel at 0.6 */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED: was rgba(45,38,33,0.6)) */
    borderRadius: '10px',      /* TOKEN: --radius-md (FIXED: was 12px) */
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',  /* TOKEN: --transition-quick */
  },
  templateName: {
    fontSize: '18px',
    fontWeight: '600',         /* TOKEN: weight-600 */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
    margin: '0 0 8px',
    color: '#E8DFD4',          /* TOKEN: --text-primary */
  },
  templateDesc: {
    fontSize: '14px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    margin: '0 0 16px',
    lineHeight: 1.5,
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content description) */
  },
  templateApproaches: {
    display: 'flex',
    gap: '8px',                /* TOKEN: --space-sm */
    flexWrap: 'wrap',
  },
  templateApproach: {
    fontSize: '11px',
    padding: '4px 8px',        /* TOKEN: --space-xs --space-sm */
    backgroundColor: 'rgba(37, 33, 23, 0.6)',  /* TOKEN: --surface-raised at 0.6 */
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (tag/pill) */
  },
  
  // ─── Header ───────────────────────────────────────────────────────────────
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',      /* TOKEN: --space-md --space-xl */
    backgroundColor: 'rgba(15, 13, 11, 0.95)',  /* TOKEN: --surface-body at 0.95 */
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED: was rgba(45,38,33,0.5)) */
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',               /* TOKEN: --space-md */
  },
  logoMark: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',      /* TOKEN: --radius-md */
    backgroundColor: 'rgba(37, 33, 23, 0.6)',  /* TOKEN: --surface-raised at 0.6 */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    /* FIXED: was an SVG icon with --text-secondary color. Emoji placeholder per rule. */
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',         /* TOKEN: weight-600 */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (brand name) */
  },
  headerSubtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (status/metadata) */
  },
  headerRight: {
    display: 'flex',
    gap: '12px',               /* TOKEN: --space-md approx */
  },

  // ─── Buttons ──────────────────────────────────────────────────────────────
  primaryButton: {
    padding: '10px 20px',      /* TOKEN: btn-md (12px 24px canonical, close enough for header) */
    backgroundColor: '#D97B3A', /* TOKEN: --ember */
    color: '#0F0D0B',           /* TOKEN: --text-inverse (FIXED: was #0A0806) */
    border: 'none',
    borderRadius: '10px',       /* TOKEN: --radius-md */
    fontSize: '14px',
    fontWeight: '600',          /* TOKEN: weight-600 */
    fontFamily: "'Inter', -apple-system, sans-serif",  /* TOKEN: --font-sans (FIXED: was inheriting serif) */
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',  /* TOKEN: --transition-quick */
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: '#9B8B7E',            /* TOKEN: --text-secondary */
    border: '1px solid rgba(217, 123, 58, 0.2)',  /* TOKEN: --border-medium (FIXED: was rgba(45,38,33,0.6)) */
    borderRadius: '10px',        /* TOKEN: --radius-md (FIXED: was 8px) */
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: "'Inter', -apple-system, sans-serif",  /* TOKEN: --font-sans (FIXED: was inheriting serif) */
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',  /* TOKEN: --transition-quick */
  },
  
  // ─── Progress Nav ─────────────────────────────────────────────────────────
  progressNav: {
    position: 'sticky',
    top: '73px',
    zIndex: 99,
    display: 'flex',
    justifyContent: 'center',
    gap: '4px',
    padding: '12px 32px',      /* TOKEN: --space-md --space-xl */
    backgroundColor: 'rgba(15, 13, 11, 0.95)',  /* TOKEN: --surface-body at 0.95 */
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle */
  },
  progressStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',                /* TOKEN: --space-sm */
    padding: '8px 16px',       /* TOKEN: --space-sm --space-md */
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',  /* TOKEN: --transition-quick */
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (nav) */
  },
  progressStepActive: {
    backgroundColor: 'rgba(37, 33, 23, 0.5)',  /* TOKEN: --surface-raised at 0.5 */
    color: '#D97B3A',          /* TOKEN: --ember (FIXED: was --text-primary; active nav = ember) */
  },
  progressDot: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
  },
  progressDotComplete: {
    color: '#D97B3A',          /* TOKEN: --ember ✓ (was already correct) */
  },
  progressLabel: {
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans */
  },
  
  // ─── Main Layout ──────────────────────────────────────────────────────────
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  
  builderColumn: {
    padding: '32px 40px',      /* TOKEN: --space-xl --space-2xl approx */
    borderRight: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED: was rgba(45,38,33,0.4)) */
  },
  
  // ─── Section ──────────────────────────────────────────────────────────────
  section: {
    marginBottom: '40px',
    paddingBottom: '40px',
    borderBottom: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED: was rgba(45,38,33,0.25)) */
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',               /* TOKEN: --space-md */
    marginBottom: '28px',
  },
  sectionNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',       /* TOKEN: --radius-sm (FIXED: was 8px) */
    backgroundColor: 'rgba(37, 33, 23, 0.5)',  /* TOKEN: --surface-raised at 0.5 */
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (number label) */
    flexShrink: 0,
  },
  sectionTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '600',         /* TOKEN: weight-600 ✓ */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif ✓ */
  },
  sectionSubtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (FIXED: was inheriting sans) */
  },
  
  // ─── Fields ───────────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: '20px',      /* TOKEN: --space-lg approx */
  },
  fieldLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',         /* TOKEN: weight-600 */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    marginBottom: '4px',       /* TOKEN: --space-xs */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (FIXED: was inheriting sans; labels describe educational content) */
  },
  fieldHint: {
    display: 'block',
    fontSize: '12px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    marginBottom: '8px',       /* TOKEN: --space-sm */
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (hint/metadata) */
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: 'rgba(26, 22, 18, 0.6)',  /* TOKEN: --surface-panel at 0.6 */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED: was rgba(45,38,33,0.6)) */
    borderRadius: '10px',      /* TOKEN: --radius-md (FIXED: was 8px) */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontSize: '15px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content input) */
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: 'rgba(26, 22, 18, 0.6)',  /* TOKEN: --surface-panel at 0.6 */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '10px',      /* TOKEN: --radius-md */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontSize: '15px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px',
    boxSizing: 'border-box',
  },
  textareaLarge: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: 'rgba(26, 22, 18, 0.6)',  /* TOKEN: --surface-panel at 0.6 */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '10px',      /* TOKEN: --radius-md ✓ */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontSize: '16px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
    outline: 'none',
    resize: 'vertical',
    minHeight: '100px',
    boxSizing: 'border-box',
  },
  
  // ─── Indicators ───────────────────────────────────────────────────────────
  indicatorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  indicatorIcon: {
    width: '20px',
    height: '20px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  indicatorInput: {
    flex: 1,
    padding: '10px 12px',
    backgroundColor: 'rgba(26, 22, 18, 0.6)',  /* TOKEN: --surface-panel */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontSize: '14px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content input) */
    outline: 'none',
  },
  
  // ─── Stretch ──────────────────────────────────────────────────────────────
  stretchCard: {
    backgroundColor: 'rgba(26, 22, 18, 0.4)',  /* TOKEN: --surface-panel at 0.4 */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '10px',      /* TOKEN: --radius-md ✓ */
    padding: '14px',
    marginBottom: '10px',
  },
  stretchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  stretchIcon: {
    width: '20px',
    height: '20px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pivotRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingLeft: '30px',
  },
  pivotLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',                /* TOKEN: --space-xs */
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontSize: '12px',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (action label) */
    whiteSpace: 'nowrap',
  },
  pivotInput: {
    flex: 1,
    padding: '8px 10px',
    backgroundColor: 'rgba(26, 22, 18, 0.4)',  /* TOKEN: --surface-panel */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontSize: '13px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
    outline: 'none',
  },
  
  // ─── Add buttons ──────────────────────────────────────────────────────────
  addButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: 'transparent',
    border: '1px dashed rgba(217, 123, 58, 0.2)',  /* TOKEN: --border-medium dashed (FIXED: was rgba(45,38,33,0.5)) */
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontSize: '13px',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (action) */
    cursor: 'pointer',
  },
  
  // ─── Coverage bar ─────────────────────────────────────────────────────────
  coverageBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'rgba(26, 22, 18, 0.4)',  /* TOKEN: --surface-panel at 0.4 */
    borderRadius: '10px',      /* TOKEN: --radius-md ✓ */
    marginBottom: '20px',
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (ADDED for consistency) */
  },
  coverageLabel: {
    fontSize: '13px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (label) */
  },
  coverageDots: {
    display: 'flex',
    gap: '6px',
    flex: 1,
  },
  coverageDot: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    backgroundColor: 'rgba(37, 33, 23, 0.4)',  /* TOKEN: --surface-raised at 0.4 (FIXED: was rgba(45,38,33,...) off-token) */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    opacity: 0.5,
  },
  coverageDotActive: {
    backgroundColor: 'rgba(37, 33, 23, 0.8)',  /* TOKEN: --surface-raised at 0.8 */
    opacity: 1,
    color: '#E8DFD4',          /* TOKEN: --text-primary */
  },
  coverageCount: {
    fontSize: '13px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontFamily: "'Inter', sans-serif",
  },
  
  // ─── Approach cards ───────────────────────────────────────────────────────
  approachCard: {
    padding: '18px',
    backgroundColor: 'rgba(26, 22, 18, 0.5)',  /* TOKEN: --surface-panel at 0.5 */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '10px',      /* TOKEN: --radius-md (FIXED: was 12px) */
    marginBottom: '14px',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',  /* TOKEN: --transition-quick */
  },
  approachCardSelected: {
    borderColor: 'rgba(217, 123, 58, 0.2)',  /* TOKEN: --border-medium (FIXED: was muted brown) */
  },
  approachCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  approachNumber: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (label/overline) */
  },
  approachModality: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontFamily: "'Inter', sans-serif",
  },
  approachTitle: {
    width: '100%',
    padding: '8px 0',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontSize: '18px',
    fontWeight: '500',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content title) */
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '10px',
  },
  approachDesc: {
    width: '100%',
    padding: '8px 0',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontSize: '14px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content description) */
    outline: 'none',
    resize: 'none',
    minHeight: '40px',
    boxSizing: 'border-box',
  },
  modalityPicker: {
    display: 'flex',
    gap: '6px',
    marginTop: '12px',
    marginBottom: '12px',
  },
  modalityBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',       /* TOKEN: --radius-sm (FIXED: was 8px) */
    backgroundColor: 'rgba(37, 33, 23, 0.4)',  /* TOKEN: --surface-raised at 0.4 */
    border: '1px solid transparent',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',  /* TOKEN: --transition-quick */
  },
  modalityBtnSelected: {
    backgroundColor: 'rgba(37, 33, 23, 0.8)',  /* TOKEN: --surface-raised at 0.8 */
    borderColor: 'rgba(217, 123, 58, 0.2)',    /* TOKEN: --border-medium */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
  },
  approachMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (meta) */
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
  },
  approachEdit: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#D97B3A',          /* TOKEN: --ember (action link — FIXED: was inheriting muted) */
  },
  addApproachButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px',
    backgroundColor: 'transparent',
    border: '1px dashed rgba(217, 123, 58, 0.2)',  /* TOKEN: --border-medium dashed (FIXED) */
    borderRadius: '10px',      /* TOKEN: --radius-md (FIXED: was 12px) */
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (action) */
    cursor: 'pointer',
  },
  
  // ─── Evidence reference ───────────────────────────────────────────────────
  evidenceReference: {
    padding: '14px 16px',
    backgroundColor: 'rgba(26, 22, 18, 0.4)',  /* TOKEN: --surface-panel */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '10px',      /* TOKEN: --radius-md */
    marginBottom: '20px',
  },
  evidenceRefLabel: {
    fontSize: '12px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    marginBottom: '8px',
    display: 'block',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (label) */
  },
  evidenceRefList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  evidenceRefItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '13px',
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content) */
  },
  
  // ─── Activities layout ────────────────────────────────────────────────────
  activitiesLayout: {
    display: 'grid',
    gridTemplateColumns: '200px 1fr',
    gap: '20px',
    minHeight: '400px',
  },
  approachSelector: {
    borderRight: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    paddingRight: '20px',
  },
  approachSelectorLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '12px',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (overline label) */
  },
  approachTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',       /* TOKEN: --radius-sm (FIXED: was 8px) */
    textAlign: 'left',
    cursor: 'pointer',
    marginBottom: '4px',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',  /* TOKEN: --transition-quick */
  },
  approachTabSelected: {
    backgroundColor: 'rgba(37, 33, 23, 0.5)',  /* TOKEN: --surface-raised at 0.5 */
  },
  approachTabIcon: {
    width: '20px',
    height: '20px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approachTabName: {
    flex: 1,
    fontSize: '13px',
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content name) */
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  approachTabCount: {
    fontSize: '11px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    backgroundColor: 'rgba(37, 33, 23, 0.5)',  /* TOKEN: --surface-raised */
    padding: '2px 6px',
    borderRadius: '4px',       /* TOKEN: ~--radius-sm (close enough for mini count pill) */
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (count) */
  },
  
  // ─── Chunks editor ────────────────────────────────────────────────────────
  chunksEditor: {
    minHeight: '300px',
  },
  chunksEditorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  chunksEditorTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
  },
  addChunkBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(217, 123, 58, 0.2)',  /* TOKEN: --border-medium (FIXED: was rgba(45,38,33,0.5)) */
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontSize: '12px',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (action) */
    cursor: 'pointer',
  },
  
  // ─── Chunk card ───────────────────────────────────────────────────────────
  chunkCard: {
    backgroundColor: 'rgba(26, 22, 18, 0.4)',  /* TOKEN: --surface-panel */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '10px',      /* TOKEN: --radius-md */
    marginBottom: '10px',
    overflow: 'hidden',
  },
  chunkHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px 14px',
    backgroundColor: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
  },
  chunkToggle: {
    width: '16px',
    height: '16px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chunkName: {
    flex: 1,
    fontSize: '14px',
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content name) */
  },
  chunkDuration: {
    fontSize: '12px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (metadata) */
  },
  chunkBody: {
    padding: '0 14px 14px',
    borderTop: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    paddingTop: '14px',
  },
  chunkTitleInput: {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'rgba(26, 22, 18, 0.4)',  /* TOKEN: --surface-panel */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontSize: '14px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
    outline: 'none',
    marginBottom: '10px',
    boxSizing: 'border-box',
  },
  chunkMeta: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  chunkSelect: {
    padding: '6px 10px',
    backgroundColor: 'rgba(26, 22, 18, 0.4)',  /* TOKEN: --surface-panel */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontSize: '12px',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (control) */
    outline: 'none',
  },
  chunkInstructions: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'rgba(26, 22, 18, 0.4)',  /* TOKEN: --surface-panel */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontSize: '14px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content input) */
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px',
    marginBottom: '10px',
    boxSizing: 'border-box',
  },
  materialsInput: {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'rgba(26, 22, 18, 0.3)',  /* TOKEN: --surface-panel at 0.3 */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '6px',       /* TOKEN: --radius-sm */
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontSize: '12px',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (utility input) */
    outline: 'none',
    boxSizing: 'border-box',
  },
  
  // ─── Validation ───────────────────────────────────────────────────────────
  validationHint: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginTop: '10px',
    padding: '10px 14px',
    backgroundColor: 'rgba(37, 33, 23, 0.4)',  /* TOKEN: --surface-raised */
    borderRadius: '6px',       /* TOKEN: --radius-sm (FIXED: was 8px) */
    fontSize: '13px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (system message) */
  },
  
  // ─── Review ───────────────────────────────────────────────────────────────
  reviewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  reviewToggle: {
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
  },
  reviewBody: {
    marginTop: '20px',
  },
  reviewNote: {
    fontSize: '13px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontStyle: 'italic',
    marginBottom: '20px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (prose note) */
  },
  reviewChecklist: {
    marginBottom: '20px',
  },
  reviewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 0',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    textAlign: 'left',
    cursor: 'pointer',
  },
  reviewCheck: {
    width: '20px',
    height: '20px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCheckComplete: {
    color: '#D97B3A',          /* TOKEN: --ember ✓ */
  },
  reviewLabel: {
    fontSize: '14px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content label) */
  },
  readyBox: {
    padding: '16px',           /* TOKEN: --space-md */
    backgroundColor: 'rgba(37, 33, 23, 0.4)',  /* TOKEN: --surface-raised */
    borderRadius: '10px',      /* TOKEN: --radius-md */
    fontSize: '14px',
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    textAlign: 'center',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (content) */
  },
  
  // ─── Companion panel ──────────────────────────────────────────────────────
  companionColumn: {
    position: 'sticky',
    top: '121px',
    height: 'calc(100vh - 121px)',
    overflowY: 'auto',
    padding: '24px 20px',      /* TOKEN: --space-lg --space-md */
    backgroundColor: 'rgba(15, 13, 11, 0.4)',  /* TOKEN: --surface-body at 0.4 */
  },
  companionPanel: {
    backgroundColor: 'rgba(26, 22, 18, 0.5)',  /* TOKEN: --surface-panel at 0.5 */
    border: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    borderRadius: '16px',      /* TOKEN: --radius-lg (FIXED: was 14px) */
    padding: '20px',
  },
  companionTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: '600',         /* TOKEN: weight-600 */
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
  },
  companionInsight: {
    fontSize: '14px',
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    lineHeight: 1.6,
    marginBottom: '16px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (Hearth voice) */
  },
  companionPhilosophy: {
    display: 'flex',
    gap: '10px',
    padding: '12px',
    backgroundColor: 'rgba(37, 33, 23, 0.3)',  /* TOKEN: --surface-raised at 0.3 */
    borderRadius: '6px',       /* TOKEN: --radius-sm (FIXED: was 8px) */
    marginBottom: '16px',
    fontSize: '13px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    lineHeight: 1.5,
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif (voice/prose) */
  },
  companionPhilosophyIcon: {
    flexShrink: 0,
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
  },
  companionIndicators: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'rgba(37, 33, 23, 0.3)',  /* TOKEN: --surface-raised */
    borderRadius: '6px',       /* TOKEN: --radius-sm */
  },
  companionIndicator: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '13px',
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    marginBottom: '6px',
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
  },
  companionSubhead: {
    margin: '0 0 10px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: "'Inter', sans-serif",  /* TOKEN: --font-sans (overline label) */
  },
  companionExamples: {
    marginBottom: '16px',
  },
  companionExample: {
    padding: '8px 0',
    borderBottom: '1px solid rgba(217, 123, 58, 0.1)',  /* TOKEN: --border-subtle (FIXED) */
    fontSize: '13px',
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
  },
  companionMistakes: {
    marginBottom: '16px',
  },
  companionMistake: {
    padding: '10px',
    backgroundColor: 'rgba(37, 33, 23, 0.3)',  /* TOKEN: --surface-raised */
    borderRadius: '6px',       /* TOKEN: --radius-sm (FIXED: was 8px) */
    marginBottom: '8px',
  },
  mistakeWrong: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    fontSize: '13px',
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    marginBottom: '6px',
    fontFamily: "'Crimson Text', Georgia, serif",
  },
  mistakeX: {
    color: '#9B8B7E',          /* TOKEN: --text-secondary */
    fontWeight: '600',
  },
  mistakeRight: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    fontSize: '13px',
    color: '#E8DFD4',          /* TOKEN: --text-primary */
    fontFamily: "'Crimson Text', Georgia, serif",  /* TOKEN: --font-serif */
  },
};

export default HearthModuleBuilder;
