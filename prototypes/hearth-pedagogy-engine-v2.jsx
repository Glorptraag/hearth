// Version: 2 | Date: 2026-03-19 | Changes: Design system conformance pass — canonical tokens, border-subtle as ember-tinted rgba, radius scale (6/10/16/24), transitions (cubic-bezier), body bg #0F0D0B, serif/sans font rules, card anatomy (shadow-soft, padding space-xl, radius-lg), ember restricted to actions only, philosophy tagline no longer ember, subject tags use subject-specific colors, Reggio Emilia removed per N26/UQ7 decisions, compatibility references updated

import React, { useState, useEffect } from 'react';

// ============================================================================
// HEARTH PEDAGOGY ENGINE v2 - Design System Conformance Pass
// Mont Blanc Dark Coffee — Canonical Token Alignment
// ============================================================================

// ============================================================================
// CANONICAL DESIGN TOKENS (from hearth-canonical-design-tokens-v1.md)
// ============================================================================
const tokens = {
  // Surfaces
  surfaceBody:    '#0F0D0B',
  surfacePanel:   '#1A1612',
  surfaceRaised:  '#252117',
  surfaceHover:   '#2D2621',

  // Text
  textPrimary:    '#E8DFD4',
  textSecondary:  '#9B8B7E',
  textMuted:      '#6B5D52',
  textInverse:    '#0F0D0B',

  // Ember
  ember:          '#D97B3A',
  emberHover:     '#E88F4E',
  emberGlow:      'rgba(217, 123, 58, 0.15)',
  emberStrong:    'rgba(217, 123, 58, 0.25)',

  // Sage
  sage:           '#4ADE80',
  sageMuted:      '#22C55E',

  // Borders
  borderSubtle:   'rgba(217, 123, 58, 0.1)',
  borderMedium:   'rgba(217, 123, 58, 0.2)',

  // Shadows
  shadowSoft:     '0 2px 8px rgba(0, 0, 0, 0.3)',
  shadowMedium:   '0 4px 16px rgba(0, 0, 0, 0.4)',
  shadowWarm:     '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(217, 123, 58, 0.08)',
  shadowGlow:     '0 0 20px rgba(217, 123, 58, 0.15)',

  // Radius
  radiusSm:       '6px',
  radiusMd:       '10px',
  radiusLg:       '16px',
  radiusXl:       '24px',
  radiusFull:     '9999px',

  // Spacing
  spaceXs:        '4px',
  spaceSm:        '8px',
  spaceMd:        '16px',
  spaceLg:        '24px',
  spaceXl:        '32px',
  space2xl:       '48px',
  space3xl:       '64px',

  // Fonts
  fontSerif:      "'Crimson Text', Georgia, serif",
  fontSans:       "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",

  // Transitions
  transitionQuick:  '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  transitionGentle: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
};

const HearthPedagogyEngine = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPhilosophy, setSelectedPhilosophy] = useState(null);
  const [selectedValues, setSelectedValues] = useState([]);
  const [selectedPractices, setSelectedPractices] = useState([]);
  const [expandedInsight, setExpandedInsight] = useState('philosophy');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ============================================================================
  // DATA DEFINITIONS (Reggio Emilia removed per decision N26/UQ7)
  // ============================================================================

  const philosophies = [
    {
      id: 'montessori',
      name: 'Montessori',
      tagline: 'The child constructs themselves through purposeful work',
      description: 'Self-directed activity with hands-on materials. Children choose their work from a prepared environment, developing independence and concentration.',
      keyElements: ['Prepared environment', 'Mixed ages', 'Uninterrupted work periods', 'Concrete to abstract'],
    },
    {
      id: 'charlotte-mason',
      name: 'Charlotte Mason',
      tagline: 'Children are born persons, fed with living ideas',
      description: 'Living books, nature study, and short lessons. Emphasizes narration, habit formation, and treating children as capable thinkers.',
      keyElements: ['Living books', 'Nature journals', 'Narration', 'Short lessons'],
    },
    {
      id: 'waldorf',
      name: 'Waldorf · Steiner',
      tagline: 'The child unfolds in stages, nourished by imagination',
      description: 'Arts-integrated, imagination-rich education following developmental stages. Delays formal academics, emphasizes rhythm and handwork.',
      keyElements: ['Artistic expression', 'Daily rhythm', 'Delayed academics', 'Natural materials'],
    },
    {
      id: 'classical',
      name: 'Classical',
      tagline: 'The mind is trained through the Trivium stages',
      description: 'Grammar, Logic, and Rhetoric stages aligned with child development. Emphasizes great books, memorization, and logical thinking.',
      keyElements: ['Trivium stages', 'Memory work', 'Great books', 'Latin roots'],
    },
    {
      id: 'unschooling',
      name: 'Unschooling',
      tagline: 'Children learn naturally when trusted to follow their interests',
      description: 'Child-led learning without formal curriculum. Life is the classroom; interests drive deep exploration.',
      keyElements: ['Interest-led', 'No curriculum', 'Life as learning', 'Trust the child'],
    },
    {
      id: 'eclectic',
      name: 'Eclectic',
      tagline: 'We draw consciously from multiple traditions',
      description: 'Intentionally combining elements from different philosophies based on what works for your family. Requires more synthesis but offers flexibility.',
      keyElements: ['Flexible approach', 'Take what works', 'Conscious mixing', 'Family-defined'],
      isEclectic: true
    }
  ];

  const values = [
    { id: 'child-led', name: 'Child-Led Exploration', description: 'Following the child\'s interests and questions', compatibleWith: ['unschooling', 'montessori'], tensionWith: ['classical'] },
    { id: 'structured', name: 'Structured Progression', description: 'Clear sequence and milestones', compatibleWith: ['classical', 'charlotte-mason'], tensionWith: ['unschooling'] },
    { id: 'nature', name: 'Nature Connection', description: 'Outdoor learning and environmental awareness', compatibleWith: ['charlotte-mason', 'waldorf'], tensionWith: [] },
    { id: 'arts', name: 'Arts & Creativity', description: 'Artistic expression integrated throughout', compatibleWith: ['waldorf'], tensionWith: [] },
    { id: 'academic', name: 'Academic Rigor', description: 'Strong emphasis on traditional academics', compatibleWith: ['classical', 'charlotte-mason'], tensionWith: ['waldorf', 'unschooling'] },
    { id: 'real-world', name: 'Real-World Application', description: 'Learning connected to practical life', compatibleWith: ['unschooling', 'montessori'], tensionWith: [] },
    { id: 'flexibility', name: 'Flexibility & Flow', description: 'Adapting to daily rhythms and energy', compatibleWith: ['unschooling', 'eclectic'], tensionWith: ['classical'] },
    { id: 'whole-child', name: 'Whole-Child Development', description: 'Social, emotional, physical alongside academic', compatibleWith: ['waldorf', 'montessori'], tensionWith: [] },
    { id: 'independence', name: 'Independence & Self-Direction', description: 'Building autonomous learners', compatibleWith: ['montessori', 'unschooling'], tensionWith: [] },
    { id: 'mastery', name: 'Mastery Before Moving On', description: 'Deep understanding over coverage', compatibleWith: ['montessori', 'classical'], tensionWith: [] }
  ];

  const practices = [
    { id: 'short-lessons', name: 'Short, Focused Lessons', description: '10-20 minute concentrated learning', compatibleWith: ['charlotte-mason'], tensionWith: ['waldorf'] },
    { id: 'extended-projects', name: 'Extended Projects', description: 'Multi-day or multi-week deep dives', compatibleWith: ['waldorf'], tensionWith: ['charlotte-mason'] },
    { id: 'living-books', name: 'Living Books & Literature', description: 'Real books over textbooks', compatibleWith: ['charlotte-mason', 'classical'], tensionWith: [] },
    { id: 'hands-on', name: 'Hands-On Materials', description: 'Concrete manipulatives and materials', compatibleWith: ['montessori', 'waldorf'], tensionWith: [] },
    { id: 'narration', name: 'Narration & Discussion', description: 'Retelling and oral processing', compatibleWith: ['charlotte-mason', 'classical'], tensionWith: [] },
    { id: 'nature-journaling', name: 'Nature Journaling', description: 'Observational drawing and notes', compatibleWith: ['charlotte-mason', 'waldorf'], tensionWith: [] },
    { id: 'movement', name: 'Movement Integration', description: 'Physical activity woven through learning', compatibleWith: ['waldorf', 'montessori'], tensionWith: [] },
    { id: 'rhythm', name: 'Daily & Weekly Rhythms', description: 'Predictable patterns and routines', compatibleWith: ['waldorf', 'charlotte-mason'], tensionWith: ['unschooling'] },
    { id: 'documentation', name: 'Documentation & Portfolios', description: 'Capturing learning as it happens', compatibleWith: [], tensionWith: [] },
    { id: 'free-play', name: 'Unstructured Play Time', description: 'Open-ended exploration without agenda', compatibleWith: ['unschooling', 'waldorf'], tensionWith: ['classical'] },
    { id: 'memory-work', name: 'Memory Work & Recitation', description: 'Poems, facts, and passages committed to memory', compatibleWith: ['classical', 'charlotte-mason'], tensionWith: ['unschooling'] },
    { id: 'copywork', name: 'Copywork & Handwriting', description: 'Careful transcription of quality writing', compatibleWith: ['charlotte-mason', 'classical'], tensionWith: [] }
  ];

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getCompatibilityStatus = (item) => {
    if (!selectedPhilosophy) return 'neutral';
    if (item.compatibleWith.includes(selectedPhilosophy)) return 'compatible';
    if (item.tensionWith.includes(selectedPhilosophy)) return 'tension';
    return 'neutral';
  };

  const moveItem = (list, setList, fromIndex, toIndex) => {
    const newList = [...list];
    const [removed] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, removed);
    setList(newList);
  };

  const toggleSelection = (id, list, setList, maxItems = 5) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else if (list.length < maxItems) {
      setList([...list, id]);
    }
  };

  const getPhilosophyById = (id) => philosophies.find(p => p.id === id);
  const getValueById = (id) => values.find(v => v.id === id);
  const getPracticeById = (id) => practices.find(p => p.id === id);

  const generateSynthesis = () => {
    const philosophy = getPhilosophyById(selectedPhilosophy);
    const topValues = selectedValues.slice(0, 3).map(getValueById);
    const topPractices = selectedPractices.slice(0, 3).map(getPracticeById);

    if (!philosophy) {
      return "Complete your selections to see your synthesised approach.";
    }

    let synthesis = `Your family follows a ${philosophy.name} foundation`;
    
    if (topValues.length > 0) {
      synthesis += `, prioritising ${topValues.map(v => v?.name.toLowerCase()).filter(Boolean).join(', ')}`;
    }
    
    if (topPractices.length > 0) {
      synthesis += `. Your daily learning will feature ${topPractices.map(p => p?.name.toLowerCase()).filter(Boolean).join(', ')}`;
    }

    synthesis += `. Hearth will interpret activities through this lens, offering ${philosophy.name}-informed observations and suggestions that align with your values.`;

    return synthesis;
  };

  // ============================================================================
  // DEMO ACTIVITY INSIGHTS
  // ============================================================================

  const demoActivity = {
    title: "Bug Observation Under Rocks",
    description: "Yesterday we went outside and Emma was looking at bugs under a rock. She found a slater and wanted to know why it rolls up. We looked at it for ages.",
    duration: "30 minutes",
    subjects: ["Science", "Language"]
  };

  // Subject-specific colors per canonical UI Kit
  const subjectColors = {
    'Science': { text: tokens.sage, bg: 'rgba(74,222,128,0.12)' },
    'Language': { text: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    'English': { text: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    'Maths': { text: tokens.ember, bg: tokens.emberGlow },
    'HASS': { text: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
    'Arts': { text: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    'HPE': { text: '#F9A8D4', bg: 'rgba(249,168,212,0.12)' },
  };

  const getPhilosophyInsight = () => {
    const philosophy = getPhilosophyById(selectedPhilosophy);
    if (!philosophy) {
      return {
        title: "Select a philosophy to see insights",
        content: "Your chosen educational philosophy will shape how Hearth interprets this activity."
      };
    }

    const insights = {
      'montessori': {
        title: "Through a Montessori Lens",
        content: "Emma demonstrated concentrated attention and self-directed exploration. The extended observation time shows deep engagement. Consider providing a magnifying glass and specimen containers to extend this prepared environment for future investigations."
      },
      'charlotte-mason': {
        title: "Through a Charlotte Mason Lens", 
        content: "This is classic nature study. Emma showed sustained attention, natural curiosity in asking 'why', and close observation in noticing the rolling behaviour. This calls for a nature journal entry — even a simple drawing captures this living encounter."
      },
      'waldorf': {
        title: "Through a Waldorf Lens",
        content: "Emma entered into relationship with the natural world through wonder and patience. The reverence for small creatures reflects the Waldorf approach to nature. Consider following with a story about the slater's life, drawn from imagination rather than facts."
      },
      'classical': {
        title: "Through a Classical Lens",
        content: "Emma is in the Grammar stage — absorbing facts and asking 'what' and 'why.' This observation provides concrete knowledge to build upon. Consider introducing the proper taxonomic name (Armadillidium vulgare) and its Latin meaning."
      },
      'unschooling': {
        title: "Through an Unschooling Lens",
        content: "Emma's self-initiated inquiry led to extended, joyful learning. Her question emerged naturally from genuine curiosity. The learning was driven entirely by her interest — this is exactly how unschooling works."
      },
      'eclectic': {
        title: "Multiple Perspectives",
        content: "This activity touches several traditions: Charlotte Mason's nature study, Montessori's concentration, and Unschooling's interest-led learning. Your eclectic approach lets you draw insights from each."
      }
    };

    return insights[selectedPhilosophy] || insights['eclectic'];
  };

  const getValuesInsight = () => {
    if (selectedValues.length === 0) {
      return {
        title: "Select values to see alignment",
        content: "Your prioritised values will highlight what matters most in this activity."
      };
    }

    const alignments = [];

    if (selectedValues.includes('child-led')) alignments.push("Emma initiated this exploration entirely on her own — child-led learning in action");
    if (selectedValues.includes('nature')) alignments.push("Direct encounter with living creatures builds lasting nature connection");
    if (selectedValues.includes('whole-child')) alignments.push("This engaged curiosity, patience, observation skills, and emotional wonder");
    if (selectedValues.includes('independence')) alignments.push("Emma directed her own investigation without adult prompting");
    if (selectedValues.includes('mastery')) alignments.push("The extended observation time suggests deep, focused understanding");

    return {
      title: `Values Alignment`,
      content: alignments.length > 0 
        ? alignments.join(". ") + "."
        : "This activity connects to your selected values through authentic, engaged learning."
    };
  };

  const getPracticesInsight = () => {
    if (selectedPractices.length === 0) {
      return {
        title: "Select practices to see suggestions",
        content: "Your chosen practices will shape what Hearth suggests for follow-up."
      };
    }

    const suggestions = [];

    if (selectedPractices.includes('nature-journaling')) suggestions.push("Start a nature journal entry with a drawing of the slater, noting the date and location");
    if (selectedPractices.includes('narration')) suggestions.push("Ask Emma to tell you about the slater in her own words — what did she notice?");
    if (selectedPractices.includes('living-books')) suggestions.push("Read 'Diary of a Wombat' or similar — seeing the world from an animal's perspective");
    if (selectedPractices.includes('documentation')) suggestions.push("Take a photo for Emma's portfolio and record her questions for later investigation");
    if (selectedPractices.includes('extended-projects')) suggestions.push("This could become a 'mini-beast' project — returning daily to observe what lives under rocks");
    if (selectedPractices.includes('hands-on')) suggestions.push("Create a temporary habitat to observe the slater's behaviour up close");

    return {
      title: "Suggested Next Steps",
      content: suggestions.length > 0
        ? suggestions.slice(0, 3).join(". ") + "."
        : "Based on your practices, continue following Emma's curiosity about the natural world."
    };
  };

  const canProceed = () => {
    if (currentStep === 0) return selectedPhilosophy !== null;
    if (currentStep === 1) return selectedValues.length > 0;
    if (currentStep === 2) return selectedPractices.length > 0;
    return true;
  };

  // ============================================================================
  // RESPONSIVE STYLES — All values from canonical tokens
  // ============================================================================

  const getStyles = () => ({
    container: {
      minHeight: '100vh',
      backgroundColor: tokens.surfaceBody,
      fontFamily: tokens.fontSerif,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      color: tokens.textPrimary
    },

    ambientGlow: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `
        radial-gradient(ellipse at 20% 80%, rgba(217, 123, 58, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(217, 123, 58, 0.04) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, rgba(217, 123, 58, 0.02) 0%, transparent 70%)
      `,
      pointerEvents: 'none',
      zIndex: 0
    },

    // Header
    header: {
      backgroundColor: tokens.surfacePanel,
      borderBottom: `1px solid ${tokens.borderSubtle}`,
      padding: isMobile ? `${tokens.spaceSm} ${tokens.spaceMd}` : `${tokens.spaceMd} ${tokens.spaceXl}`,
      position: 'relative',
      zIndex: 10
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? tokens.spaceSm : tokens.spaceSm
    },
    logoText: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '18px' : '1.5rem',
      fontWeight: '700',
      color: tokens.textPrimary,
      letterSpacing: '-0.02em'
    },
    skipButton: {
      background: 'transparent',
      border: `1px solid ${tokens.borderSubtle}`,
      borderRadius: tokens.radiusMd,
      color: tokens.textSecondary,
      fontFamily: tokens.fontSans,
      fontSize: isMobile ? '0.75rem' : '0.8rem',
      fontWeight: '500',
      cursor: 'pointer',
      padding: isMobile ? `${tokens.spaceSm} ${tokens.spaceSm}` : `${tokens.spaceSm} ${tokens.spaceMd}`,
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spaceXs,
      transition: `all ${tokens.transitionQuick}`,
      minHeight: '44px'
    },

    // Step Indicator
    stepIndicator: {
      backgroundColor: tokens.surfacePanel,
      borderBottom: `1px solid ${tokens.borderSubtle}`,
      padding: isMobile ? tokens.spaceMd : `${tokens.spaceLg} ${tokens.spaceXl}`,
      position: 'relative',
      zIndex: 10,
      overflowX: isMobile ? 'auto' : 'visible'
    },
    stepIndicatorInner: {
      maxWidth: '600px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: isMobile ? '400px' : 'auto'
    },
    stepItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isMobile ? tokens.spaceXs : tokens.spaceSm
    },
    stepNumber: {
      width: isMobile ? '32px' : '36px',
      height: isMobile ? '32px' : '36px',
      borderRadius: '50%',
      backgroundColor: tokens.surfaceHover,
      color: tokens.textSecondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: tokens.fontSans,
      fontWeight: '600',
      fontSize: isMobile ? '0.75rem' : '0.8rem',
      transition: `all ${tokens.transitionQuick}`,
      border: '2px solid transparent'
    },
    stepNumberActive: {
      backgroundColor: tokens.ember,
      color: tokens.textInverse,
      boxShadow: `0 0 16px rgba(217, 123, 58, 0.5), 0 0 32px rgba(217, 123, 58, 0.3)`
    },
    stepNumberComplete: {
      backgroundColor: 'transparent',
      border: `2px solid ${tokens.ember}`,
      color: tokens.ember
    },
    stepLabel: {
      fontFamily: tokens.fontSans,
      fontSize: isMobile ? '0.625rem' : '0.7rem',
      fontWeight: '600',
      color: tokens.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.08em'
    },
    stepLabelActive: {
      color: tokens.textPrimary
    },
    stepConnector: {
      width: isMobile ? '32px' : '60px',
      height: '2px',
      backgroundColor: tokens.surfaceHover,
      margin: isMobile ? `0 ${tokens.spaceSm}` : `0 ${tokens.spaceMd}`,
      marginBottom: isMobile ? '20px' : '24px',
      transition: `background ${tokens.transitionGentle}`
    },
    stepConnectorComplete: {
      backgroundColor: tokens.ember
    },

    // Main Content
    main: {
      flex: 1,
      overflow: 'auto',
      position: 'relative',
      zIndex: 1
    },
    stepContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? `${tokens.spaceLg} ${tokens.spaceMd}` : isTablet ? `${tokens.spaceXl} ${tokens.spaceLg}` : `${tokens.space2xl} ${tokens.spaceXl}`
    },
    stepHeader: {
      marginBottom: isMobile ? tokens.spaceLg : tokens.space2xl
    },
    stepTitle: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '1.5rem' : isTablet ? '1.75rem' : '2rem',
      fontWeight: '600',
      color: tokens.textPrimary,
      marginBottom: isMobile ? tokens.spaceSm : tokens.spaceSm,
      letterSpacing: '-0.02em',
      lineHeight: '1.3'
    },
    stepDescription: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.95rem' : '1.05rem',
      color: tokens.textSecondary,
      lineHeight: '1.7',
      maxWidth: '680px'
    },

    // Philosophy Grid
    philosophyGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: isMobile ? tokens.spaceSm : tokens.spaceLg
    },
    philosophyCard: {
      backgroundColor: tokens.surfacePanel,
      borderRadius: tokens.radiusLg,
      padding: isMobile ? tokens.spaceMd : tokens.spaceXl,
      cursor: 'pointer',
      border: `1px solid ${tokens.borderSubtle}`,
      boxShadow: tokens.shadowSoft,
      transition: `all ${tokens.transitionGentle}`,
      position: 'relative',
      overflow: 'hidden',
      WebkitTapHighlightColor: 'transparent'
    },
    philosophyCardSelected: {
      borderColor: tokens.borderMedium,
      boxShadow: tokens.shadowWarm,
      backgroundColor: tokens.surfaceRaised,
      transform: 'translateY(-2px)'
    },
    philosophyHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: tokens.spaceSm,
      gap: tokens.spaceSm
    },
    philosophyName: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '1.05rem' : '1.1rem',
      fontWeight: '600',
      color: tokens.textPrimary,
      margin: 0
    },
    selectedBadge: {
      fontFamily: tokens.fontSans,
      fontSize: '0.625rem',
      fontWeight: '600',
      backgroundColor: tokens.ember,
      color: tokens.textInverse,
      padding: `${tokens.spaceXs} ${tokens.spaceSm}`,
      borderRadius: tokens.radiusSm,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      flexShrink: 0
    },
    philosophyTagline: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.875rem' : '0.95rem',
      fontStyle: 'italic',
      color: tokens.textSecondary,
      marginBottom: tokens.spaceSm,
      lineHeight: '1.6'
    },
    philosophyDescription: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.85rem' : '0.95rem',
      color: tokens.textSecondary,
      lineHeight: '1.6',
      marginBottom: tokens.spaceMd
    },
    keyElements: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: tokens.spaceXs
    },
    keyElement: {
      fontFamily: tokens.fontSans,
      fontSize: isMobile ? '0.625rem' : '0.7rem',
      backgroundColor: tokens.surfaceRaised,
      color: tokens.textSecondary,
      padding: `${tokens.spaceXs} ${tokens.spaceSm}`,
      borderRadius: tokens.radiusSm,
      fontWeight: '500',
      border: `1px solid ${tokens.borderSubtle}`
    },
    eclecticNote: {
      marginTop: tokens.spaceMd,
      padding: tokens.spaceSm,
      backgroundColor: tokens.emberGlow,
      borderRadius: tokens.radiusMd,
      fontSize: isMobile ? '0.7rem' : '0.75rem',
      fontFamily: tokens.fontSerif,
      color: tokens.textSecondary,
      display: 'flex',
      alignItems: 'flex-start',
      gap: tokens.spaceSm,
      border: `1px solid ${tokens.borderMedium}`,
      lineHeight: '1.6'
    },
    eclecticIcon: {
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: tokens.ember,
      color: tokens.textInverse,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: tokens.fontSans,
      fontWeight: '700',
      fontSize: '0.7rem',
      flexShrink: 0
    },

    // Compatibility Legend
    compatibilityLegend: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? tokens.spaceSm : tokens.spaceLg,
      marginTop: isMobile ? tokens.spaceMd : tokens.spaceLg,
      fontFamily: tokens.fontSans,
      fontSize: '0.75rem'
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spaceSm,
      color: tokens.textSecondary
    },
    compatibleDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: tokens.ember,
      boxShadow: `0 0 8px rgba(217, 123, 58, 0.5)`,
      flexShrink: 0
    },
    tensionDot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: tokens.textSecondary,
      border: `2px solid ${tokens.ember}`,
      flexShrink: 0
    },

    // Selection Container
    selectionContainer: {
      display: 'grid',
      gridTemplateColumns: isMobile || isTablet ? '1fr' : '1fr 380px',
      gap: isMobile ? tokens.spaceLg : tokens.spaceXl
    },
    availableSection: {
      order: isMobile || isTablet ? 2 : 1
    },
    selectedSection: {
      backgroundColor: tokens.surfacePanel,
      borderRadius: tokens.radiusLg,
      padding: isMobile ? tokens.spaceMd : tokens.spaceXl,
      border: `1px solid ${tokens.borderSubtle}`,
      boxShadow: tokens.shadowSoft,
      height: 'fit-content',
      position: isMobile || isTablet ? 'relative' : 'sticky',
      top: '20px',
      order: isMobile || isTablet ? 1 : 2
    },
    sectionLabel: {
      fontFamily: tokens.fontSans,
      fontSize: '0.7rem',
      fontWeight: '600',
      color: tokens.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: tokens.spaceMd
    },
    itemGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: tokens.spaceSm
    },
    selectableItem: {
      backgroundColor: tokens.surfacePanel,
      borderRadius: tokens.radiusMd,
      padding: tokens.spaceMd,
      cursor: 'pointer',
      border: `1px solid ${tokens.borderSubtle}`,
      transition: `all ${tokens.transitionQuick}`,
      WebkitTapHighlightColor: 'transparent',
      minHeight: '44px'
    },
    itemCompatible: {
      borderColor: tokens.borderMedium,
      backgroundColor: 'rgba(217, 123, 58, 0.08)'
    },
    itemTension: {
      borderColor: tokens.textSecondary,
      backgroundColor: 'rgba(155, 139, 126, 0.05)'
    },
    itemHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spaceXs
    },
    itemName: {
      fontFamily: tokens.fontSerif,
      fontWeight: '600',
      color: tokens.textPrimary,
      fontSize: isMobile ? '0.875rem' : '0.95rem'
    },
    itemDescription: {
      fontFamily: tokens.fontSerif,
      fontSize: '0.8rem',
      color: tokens.textSecondary,
      margin: 0,
      lineHeight: '1.5'
    },
    compatibleIndicator: {
      color: tokens.ember
    },
    tensionIndicator: {
      color: tokens.textSecondary,
      fontFamily: tokens.fontSans,
      fontWeight: '700',
      fontSize: '0.875rem'
    },

    // Priority List
    emptyState: {
      padding: isMobile ? tokens.spaceLg : tokens.spaceXl,
      textAlign: 'center',
      color: tokens.textMuted,
      fontFamily: tokens.fontSerif,
      fontStyle: 'italic',
      border: `1px dashed ${tokens.textMuted}`,
      borderRadius: tokens.radiusMd,
      fontSize: '0.9rem'
    },
    priorityList: {
      display: 'flex',
      flexDirection: 'column',
      gap: tokens.spaceSm
    },
    priorityItem: {
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spaceSm,
      backgroundColor: tokens.surfaceBody,
      borderRadius: tokens.radiusMd,
      padding: tokens.spaceMd,
      border: `1px solid ${tokens.borderSubtle}`
    },
    priorityNumber: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      backgroundColor: tokens.ember,
      color: tokens.textInverse,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: tokens.fontSans,
      fontWeight: '700',
      fontSize: '0.7rem',
      flexShrink: 0,
      boxShadow: `0 0 12px rgba(217, 123, 58, 0.4)`
    },
    priorityContent: {
      flex: 1,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: tokens.spaceSm
    },
    priorityName: {
      fontFamily: tokens.fontSerif,
      fontWeight: '500',
      color: tokens.textPrimary,
      fontSize: isMobile ? '0.85rem' : '0.875rem'
    },
    priorityControls: {
      display: 'flex',
      gap: tokens.spaceXs,
      flexShrink: 0
    },
    moveButton: {
      width: isMobile ? '36px' : '32px',
      height: isMobile ? '36px' : '32px',
      border: `1px solid ${tokens.borderSubtle}`,
      borderRadius: tokens.radiusSm,
      backgroundColor: tokens.surfacePanel,
      color: tokens.textSecondary,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: `all ${tokens.transitionQuick}`,
      WebkitTapHighlightColor: 'transparent'
    },
    removeButton: {
      width: isMobile ? '36px' : '32px',
      height: isMobile ? '36px' : '32px',
      border: `1px solid ${tokens.borderMedium}`,
      borderRadius: tokens.radiusSm,
      backgroundColor: tokens.emberGlow,
      color: tokens.ember,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: `all ${tokens.transitionQuick}`,
      WebkitTapHighlightColor: 'transparent'
    },

    // Review Step
    reviewLayout: {
      display: 'grid',
      gridTemplateColumns: isMobile || isTablet ? '1fr' : '1fr 1fr',
      gap: isMobile ? tokens.spaceLg : tokens.spaceXl
    },

    // Summary Card
    summaryCard: {
      backgroundColor: tokens.surfacePanel,
      borderRadius: tokens.radiusLg,
      border: `1px solid ${tokens.borderSubtle}`,
      overflow: 'hidden',
      boxShadow: tokens.shadowWarm
    },
    summaryHeader: {
      padding: isMobile ? tokens.spaceMd : `${tokens.spaceLg} ${tokens.spaceLg}`,
      borderBottom: `1px solid ${tokens.borderSubtle}`,
      backgroundColor: tokens.surfaceRaised
    },
    summaryTitle: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '1rem' : '1.1rem',
      fontWeight: '600',
      color: tokens.textPrimary,
      margin: 0,
      letterSpacing: '-0.01em'
    },
    summarySection: {
      padding: isMobile ? tokens.spaceMd : `${tokens.spaceLg} ${tokens.spaceLg}`,
      borderBottom: `1px solid ${tokens.borderSubtle}`
    },
    summarySectionTitle: {
      fontFamily: tokens.fontSans,
      fontSize: '0.625rem',
      fontWeight: '600',
      color: tokens.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: tokens.spaceSm
    },
    summaryPhilosophy: {
      borderLeft: `3px solid ${tokens.ember}`,
      paddingLeft: tokens.spaceMd
    },
    summaryPhilosophyName: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.95rem' : '1.05rem',
      fontWeight: '600',
      color: tokens.textPrimary,
      display: 'block',
      marginBottom: tokens.spaceXs
    },
    summaryPhilosophyTagline: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.85rem' : '0.875rem',
      color: tokens.textSecondary,
      fontStyle: 'italic',
      margin: 0,
      lineHeight: '1.6'
    },
    summaryEmpty: {
      fontFamily: tokens.fontSerif,
      color: tokens.textMuted,
      fontStyle: 'italic',
      fontSize: '0.875rem'
    },
    summaryTags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: tokens.spaceSm
    },
    summaryTag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: tokens.spaceSm,
      backgroundColor: tokens.surfaceRaised,
      color: tokens.textPrimary,
      padding: isMobile ? `${tokens.spaceXs} ${tokens.spaceSm}` : `${tokens.spaceXs} ${tokens.spaceSm}`,
      borderRadius: tokens.radiusSm,
      fontFamily: tokens.fontSans,
      fontSize: isMobile ? '0.7rem' : '0.75rem',
      fontWeight: '500',
      border: `1px solid ${tokens.borderSubtle}`
    },
    tagNumber: {
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: tokens.ember,
      color: tokens.textInverse,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.625rem',
      fontWeight: '700'
    },
    synthesisSection: {
      padding: isMobile ? tokens.spaceMd : tokens.spaceLg,
      backgroundColor: tokens.emberGlow,
      borderTop: `1px solid ${tokens.borderMedium}`
    },
    synthesisTitle: {
      fontFamily: tokens.fontSans,
      fontSize: '0.625rem',
      fontWeight: '600',
      color: tokens.ember,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: tokens.spaceSm
    },
    synthesisText: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.875rem' : '0.95rem',
      lineHeight: '1.7',
      color: tokens.textPrimary,
      margin: 0
    },

    // Demo Section
    demoSection: {},
    demoTitle: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '1rem' : '1.1rem',
      fontWeight: '600',
      color: tokens.textPrimary,
      marginBottom: tokens.spaceSm
    },
    demoSubtitle: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.85rem' : '0.875rem',
      color: tokens.textSecondary,
      marginBottom: tokens.spaceLg,
      lineHeight: '1.6'
    },
    demoCard: {
      backgroundColor: tokens.surfacePanel,
      borderRadius: tokens.radiusLg,
      border: `1px solid ${tokens.borderSubtle}`,
      overflow: 'hidden',
      boxShadow: tokens.shadowWarm
    },
    demoActivityHeader: {
      padding: isMobile ? tokens.spaceMd : `${tokens.spaceLg} ${tokens.spaceLg}`,
      borderBottom: `1px solid ${tokens.borderSubtle}`,
      backgroundColor: tokens.surfaceRaised
    },
    demoActivityTitle: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.95rem' : '1.05rem',
      fontWeight: '600',
      color: tokens.textPrimary,
      marginBottom: tokens.spaceSm
    },
    demoMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spaceSm,
      flexWrap: 'wrap'
    },
    demoDuration: {
      fontFamily: tokens.fontSans,
      fontSize: '0.75rem',
      color: tokens.textMuted
    },
    demoSubjects: {
      display: 'flex',
      gap: tokens.spaceXs
    },
    demoActivityDescription: {
      padding: isMobile ? tokens.spaceMd : `${tokens.spaceLg} ${tokens.spaceLg}`,
      borderBottom: `1px solid ${tokens.borderSubtle}`
    },
    demoQuote: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.85rem' : '0.875rem',
      color: tokens.textSecondary,
      lineHeight: '1.6',
      fontStyle: 'italic',
      margin: 0,
      padding: isMobile ? tokens.spaceSm : `${tokens.spaceSm} ${tokens.spaceMd}`,
      backgroundColor: tokens.surfaceBody,
      borderRadius: tokens.radiusMd,
      borderLeft: `3px solid ${tokens.borderSubtle}`
    },
    insightTabs: {
      display: 'flex',
      borderBottom: `1px solid ${tokens.borderSubtle}`,
      overflowX: 'auto'
    },
    insightTab: {
      flex: isMobile ? 'none' : 1,
      padding: isMobile ? `${tokens.spaceSm} ${tokens.spaceMd}` : tokens.spaceMd,
      border: 'none',
      backgroundColor: 'transparent',
      fontFamily: tokens.fontSans,
      fontSize: isMobile ? '0.7rem' : '0.75rem',
      fontWeight: '500',
      color: tokens.textSecondary,
      cursor: 'pointer',
      transition: `all ${tokens.transitionQuick}`,
      borderBottom: '2px solid transparent',
      whiteSpace: 'nowrap',
      WebkitTapHighlightColor: 'transparent',
      minHeight: '44px'
    },
    insightTabActive: {
      color: tokens.ember,
      borderBottomColor: tokens.ember,
      backgroundColor: 'rgba(217, 123, 58, 0.08)'
    },
    insightContent: {
      padding: isMobile ? tokens.spaceMd : `${tokens.spaceLg} ${tokens.spaceLg}`,
      minHeight: isMobile ? '120px' : '140px'
    },
    insightPanel: {},
    insightPanelTitle: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.875rem' : '0.95rem',
      fontWeight: '600',
      color: tokens.textPrimary,
      marginBottom: tokens.spaceSm
    },
    insightPanelContent: {
      fontFamily: tokens.fontSerif,
      fontSize: isMobile ? '0.85rem' : '0.875rem',
      color: tokens.textSecondary,
      lineHeight: '1.7',
      margin: 0
    },

    // Footer
    footer: {
      backgroundColor: tokens.surfacePanel,
      borderTop: `1px solid ${tokens.borderSubtle}`,
      padding: isMobile ? tokens.spaceMd : `${tokens.spaceLg} ${tokens.spaceXl}`,
      position: 'relative',
      zIndex: 10
    },
    footerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: tokens.spaceMd
    },
    backButton: {
      padding: isMobile ? `${tokens.spaceSm} ${tokens.spaceMd}` : `${tokens.spaceSm} ${tokens.spaceLg}`,
      backgroundColor: 'transparent',
      border: `1px solid ${tokens.borderSubtle}`,
      borderRadius: tokens.radiusMd,
      color: tokens.textSecondary,
      fontFamily: tokens.fontSans,
      fontSize: isMobile ? '0.8rem' : '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spaceSm,
      transition: `all ${tokens.transitionQuick}`,
      WebkitTapHighlightColor: 'transparent',
      minHeight: '44px'
    },
    nextButton: {
      padding: isMobile ? `${tokens.spaceSm} ${tokens.spaceLg}` : `${tokens.spaceSm} ${tokens.spaceLg}`,
      backgroundColor: tokens.ember,
      border: 'none',
      borderRadius: tokens.radiusMd,
      color: tokens.textInverse,
      fontFamily: tokens.fontSans,
      fontSize: isMobile ? '0.8rem' : '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spaceSm,
      boxShadow: `0 4px 16px rgba(217, 123, 58, 0.3), ${tokens.shadowGlow}`,
      transition: `all ${tokens.transitionQuick}`,
      WebkitTapHighlightColor: 'transparent',
      minHeight: '44px'
    },
    nextButtonDisabled: {
      backgroundColor: tokens.surfaceHover,
      color: tokens.textSecondary,
      boxShadow: 'none',
      cursor: 'not-allowed'
    },
    activateButton: {
      padding: isMobile ? `${tokens.spaceSm} ${tokens.spaceLg}` : `${tokens.spaceMd} ${tokens.spaceXl}`,
      backgroundColor: tokens.ember,
      border: 'none',
      borderRadius: tokens.radiusMd,
      color: tokens.textInverse,
      fontFamily: tokens.fontSans,
      fontSize: isMobile ? '0.875rem' : '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      boxShadow: `0 4px 20px rgba(217, 123, 58, 0.5), 0 0 40px rgba(217, 123, 58, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
      transition: `all ${tokens.transitionQuick}`,
      WebkitTapHighlightColor: 'transparent',
      minHeight: '44px'
    }
  });

  const styles = getStyles();

  // ============================================================================
  // STEP COMPONENTS
  // ============================================================================

  const StepIndicator = () => (
    <div style={styles.stepIndicator}>
      <div style={styles.stepIndicatorInner}>
        {['Philosophy', 'Values', 'Practices', 'Review'].map((label, index) => (
          <React.Fragment key={label}>
            <div style={styles.stepItem}>
              <div style={{
                ...styles.stepNumber,
                ...(index === currentStep ? styles.stepNumberActive : {}),
                ...(index < currentStep ? styles.stepNumberComplete : {})
              }}>
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span style={{
                ...styles.stepLabel,
                ...(index === currentStep ? styles.stepLabelActive : {})
              }}>{label}</span>
            </div>
            {index < 3 && <div style={{
              ...styles.stepConnector,
              ...(index < currentStep ? styles.stepConnectorComplete : {})
            }} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const PhilosophyStep = () => (
    <div style={styles.stepContent}>
      <div style={styles.stepHeader}>
        <h2 style={styles.stepTitle}>Your Educational Philosophy</h2>
        <p style={styles.stepDescription}>
          This shapes how Hearth interprets your learning activities. Choose the tradition that 
          resonates most with your family, or select Eclectic if you consciously draw from multiple sources.
        </p>
      </div>

      <div style={styles.philosophyGrid}>
        {philosophies.map(philosophy => (
          <div
            key={philosophy.id}
            onClick={() => setSelectedPhilosophy(philosophy.id)}
            style={{
              ...styles.philosophyCard,
              ...(selectedPhilosophy === philosophy.id ? styles.philosophyCardSelected : {})
            }}
          >
            <div style={styles.philosophyHeader}>
              <h3 style={styles.philosophyName}>{philosophy.name}</h3>
              {selectedPhilosophy === philosophy.id && (
                <span style={styles.selectedBadge}>Selected</span>
              )}
            </div>
            <p style={styles.philosophyTagline}>{philosophy.tagline}</p>
            <p style={styles.philosophyDescription}>{philosophy.description}</p>
            <div style={styles.keyElements}>
              {philosophy.keyElements.map(element => (
                <span key={element} style={styles.keyElement}>{element}</span>
              ))}
            </div>
            {philosophy.isEclectic && (
              <div style={styles.eclecticNote}>
                <span style={styles.eclecticIcon}>i</span>
                <span>Eclectic requires more synthesis — some of all means less depth in each tradition.</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const SelectionStep = ({ items, selected, setSelected, title, description }) => (
    <div style={styles.stepContent}>
      <div style={styles.stepHeader}>
        <h2 style={styles.stepTitle}>{title}</h2>
        <p style={styles.stepDescription}>{description}</p>
        {selectedPhilosophy && (
          <div style={styles.compatibilityLegend}>
            <span style={styles.legendItem}>
              <span style={styles.compatibleDot}></span>
              Aligns with {getPhilosophyById(selectedPhilosophy)?.name}
            </span>
            <span style={styles.legendItem}>
              <span style={styles.tensionDot}></span>
              May need reconciliation
            </span>
          </div>
        )}
      </div>

      <div style={styles.selectionContainer}>
        <div style={styles.selectedSection}>
          <h4 style={styles.sectionLabel}>Your Priorities · {selected.length}/5</h4>
          {selected.length === 0 ? (
            <div style={styles.emptyState}>Tap items below to add them here</div>
          ) : (
            <div style={styles.priorityList}>
              {selected.map((id, index) => {
                const item = items.find(i => i.id === id);
                return (
                  <div key={id} style={styles.priorityItem}>
                    <span style={styles.priorityNumber}>{index + 1}</span>
                    <div style={styles.priorityContent}>
                      <span style={styles.priorityName}>{item?.name}</span>
                      <div style={styles.priorityControls}>
                        {index > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveItem(selected, setSelected, index, index - 1); }}
                            style={styles.moveButton}
                            aria-label="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {index < selected.length - 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveItem(selected, setSelected, index, index + 1); }}
                            style={styles.moveButton}
                            aria-label="Move down"
                          >
                            ↓
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleSelection(id, selected, setSelected); }}
                          style={styles.removeButton}
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.availableSection}>
          <h4 style={styles.sectionLabel}>Available Options</h4>
          <div style={styles.itemGrid}>
            {items.filter(item => !selected.includes(item.id)).map(item => {
              const status = getCompatibilityStatus(item);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelection(item.id, selected, setSelected)}
                  style={{
                    ...styles.selectableItem,
                    ...(status === 'compatible' ? styles.itemCompatible : {}),
                    ...(status === 'tension' ? styles.itemTension : {})
                  }}
                >
                  <div style={styles.itemHeader}>
                    <span style={styles.itemName}>{item.name}</span>
                    {status === 'compatible' && <span style={styles.compatibleIndicator}>✓</span>}
                    {status === 'tension' && <span style={styles.tensionIndicator}>!</span>}
                  </div>
                  <p style={styles.itemDescription}>{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const ReviewStep = () => {
    const philosophy = getPhilosophyById(selectedPhilosophy);
    const philosophyInsight = getPhilosophyInsight();
    const valuesInsight = getValuesInsight();
    const practicesInsight = getPracticesInsight();

    return (
      <div style={styles.stepContent}>
        <div style={styles.stepHeader}>
          <h2 style={styles.stepTitle}>Your Pedagogical Profile</h2>
          <p style={styles.stepDescription}>
            Here is how Hearth will interpret your family's learning. Review the demo to see it in action.
          </p>
        </div>

        <div style={styles.reviewLayout}>
          {/* Summary Card */}
          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <h3 style={styles.summaryTitle}>Your Approach</h3>
            </div>

            <div style={styles.summarySection}>
              <h4 style={styles.summarySectionTitle}>Foundation</h4>
              {philosophy ? (
                <div style={styles.summaryPhilosophy}>
                  <span style={styles.summaryPhilosophyName}>{philosophy.name}</span>
                  <p style={styles.summaryPhilosophyTagline}>{philosophy.tagline}</p>
                </div>
              ) : (
                <div style={styles.summaryEmpty}>No philosophy selected</div>
              )}
            </div>

            <div style={styles.summarySection}>
              <h4 style={styles.summarySectionTitle}>Values · Prioritised</h4>
              {selectedValues.length > 0 ? (
                <div style={styles.summaryTags}>
                  {selectedValues.map((id, index) => {
                    const value = getValueById(id);
                    return (
                      <span key={id} style={styles.summaryTag}>
                        <span style={styles.tagNumber}>{index + 1}</span>
                        {value?.name}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.summaryEmpty}>No values selected</div>
              )}
            </div>

            <div style={styles.summarySection}>
              <h4 style={styles.summarySectionTitle}>Practices · Prioritised</h4>
              {selectedPractices.length > 0 ? (
                <div style={styles.summaryTags}>
                  {selectedPractices.map((id, index) => {
                    const practice = getPracticeById(id);
                    return (
                      <span key={id} style={styles.summaryTag}>
                        <span style={styles.tagNumber}>{index + 1}</span>
                        {practice?.name}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.summaryEmpty}>No practices selected</div>
              )}
            </div>

            <div style={styles.synthesisSection}>
              <h4 style={styles.synthesisTitle}>Your Synthesised Approach</h4>
              <p style={styles.synthesisText}>{generateSynthesis()}</p>
            </div>
          </div>

          {/* Demo Card */}
          <div style={styles.demoSection}>
            <h3 style={styles.demoTitle}>See It In Action</h3>
            <p style={styles.demoSubtitle}>How Hearth interprets a logged activity with your settings</p>
            
            <div style={styles.demoCard}>
              <div style={styles.demoActivityHeader}>
                <h4 style={styles.demoActivityTitle}>{demoActivity.title}</h4>
                <div style={styles.demoMeta}>
                  <span style={styles.demoDuration}>{demoActivity.duration}</span>
                  <div style={styles.demoSubjects}>
                    {demoActivity.subjects.map(subject => {
                      const colors = subjectColors[subject] || { text: tokens.textSecondary, bg: tokens.surfaceRaised };
                      return (
                        <span key={subject} style={{
                          fontFamily: tokens.fontSans,
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          color: colors.text,
                          backgroundColor: colors.bg,
                          padding: `2px ${tokens.spaceSm}`,
                          borderRadius: tokens.radiusSm,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>{subject}</span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={styles.demoActivityDescription}>
                <p style={styles.demoQuote}>"{demoActivity.description}"</p>
              </div>

              <div style={styles.insightTabs}>
                {[
                  { id: 'philosophy', label: 'Philosophy Lens' },
                  { id: 'values', label: 'Values Alignment' },
                  { id: 'practices', label: 'Next Steps' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setExpandedInsight(tab.id)}
                    style={{
                      ...styles.insightTab,
                      ...(expandedInsight === tab.id ? styles.insightTabActive : {})
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={styles.insightContent}>
                {expandedInsight === 'philosophy' && (
                  <div style={styles.insightPanel}>
                    <h5 style={styles.insightPanelTitle}>{philosophyInsight.title}</h5>
                    <p style={styles.insightPanelContent}>{philosophyInsight.content}</p>
                  </div>
                )}
                {expandedInsight === 'values' && (
                  <div style={styles.insightPanel}>
                    <h5 style={styles.insightPanelTitle}>{valuesInsight.title}</h5>
                    <p style={styles.insightPanelContent}>{valuesInsight.content}</p>
                  </div>
                )}
                {expandedInsight === 'practices' && (
                  <div style={styles.insightPanel}>
                    <h5 style={styles.insightPanelTitle}>{practicesInsight.title}</h5>
                    <p style={styles.insightPanelContent}>{practicesInsight.content}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div style={styles.container}>
      {/* Ambient glow background */}
      <div style={styles.ambientGlow} />
      
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <span role="img" aria-label="Hearth" style={{ fontSize: isMobile ? '20px' : '24px' }}>🔥</span>
            <span style={styles.logoText}>Hearth</span>
          </div>
          <button style={styles.skipButton}>
            {isMobile ? 'Skip' : 'Skip for now'} →
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        <StepIndicator />
        
        {currentStep === 0 && <PhilosophyStep />}
        {currentStep === 1 && (
          <SelectionStep 
            items={values}
            selected={selectedValues}
            setSelected={setSelectedValues}
            title="What Matters Most"
            description="Select up to 5 values and drag to prioritise. Your top values will guide how Hearth highlights what's important in your learning activities."
          />
        )}
        {currentStep === 2 && (
          <SelectionStep 
            items={practices}
            selected={selectedPractices}
            setSelected={setSelectedPractices}
            title="Your Daily Practices"
            description="Select up to 5 practices that you use or want to use in your homeschool. These shape the specific suggestions Hearth offers."
          />
        )}
        {currentStep === 3 && <ReviewStep />}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          {currentStep > 0 ? (
            <button 
              onClick={() => setCurrentStep(currentStep - 1)}
              style={styles.backButton}
            >
              ← {isMobile ? '' : 'Back'}
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              style={{
                ...styles.nextButton,
                ...(canProceed() ? {} : styles.nextButtonDisabled)
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              style={styles.activateButton}
              disabled={!selectedPhilosophy}
            >
              🔥 {isMobile ? 'Light the Hearth' : 'Light the Hearth'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default HearthPedagogyEngine;
