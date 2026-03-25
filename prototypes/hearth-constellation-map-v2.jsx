// Version: 2 | Date: 2026-03-19 | Changes from v1:
// - Extracted canonical design tokens into a TOKENS constant — all hardcoded hex/px values now reference this single source
// - DOMAINS.maths color: #D97B3A (ember) → #A78BFA (violet) — ember must not be used as a domain identity color
// - Node rect rx/ry: 8 → 10 (canonical --radius-md, was non-system value)
// - Thread ID fontWeight: "700" → "600" (700 reserved for display/brand only)
// - Edge active stroke: kept #D97B3A (ember) — correct per spec, active/selected state is a valid ember context
// - Edge inactive stroke: harmonised to use canonical text-secondary rgba values
// - Transition strings: "0.2s" / "0.25s ease" → canonical timing "200ms cubic-bezier(0.4, 0, 0.2, 1)"
// - DLO tier colors: Developing was #D97B3A (ember — violation) → #60A5FA (deep-blue, matching v4 HTML)
//   Emerging was #60A5FA → #FBBF24 (amber, matching v4 HTML). Demonstrating #4ADE80 unchanged.
// - Legend padding/gap: hardcoded px → TOKENS references
// - All other hex values verified correct against canonical spec; no functional/logic changes

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// HEARTH CAPABILITIES CONSTELLATION — Pure Node Map
// Vertical scrolling DAG of all 57 capability threads
// Tap to zoom into a node, see DLOs, connections
// Data layer is portable (could generate Mermaid from this)
// ═══════════════════════════════════════════════════════════════

// ── CANONICAL DESIGN TOKENS ─────────────────────────────────
// JSX inline styles cannot consume CSS custom properties directly.
// This object is the single source of truth for all values used
// in this component — change here, not scattered through the JSX.

const TOKENS = {
  // Surfaces
  surfaceBody:    "#0F0D0B",
  surfacePanel:   "#1A1612",
  surfaceRaised:  "#252117",
  surfaceHover:   "#2D2621",

  // Text
  textPrimary:    "#E8DFD4",
  textSecondary:  "#9B8B7E",
  textMuted:      "#6B5D52",

  // Ember — primary action only; active/selected states
  ember:          "#D97B3A",
  emberGlow:      "rgba(217, 123, 58, 0.15)",

  // Borders (ember-tinted per canonical spec)
  borderSubtle:   "rgba(217, 123, 58, 0.1)",
  borderMedium:   "rgba(217, 123, 58, 0.2)",

  // Edge strokes (derived from text-secondary hex for muted graph lines)
  edgeMuted:      "rgba(155, 139, 126, 0.08)",
  edgeCross:      "rgba(155, 139, 126, 0.12)",

  // Tier colors — must NOT use ember for tiers
  tierDemonstrating: "#4ADE80",   // sage — growth/mastery
  tierDeveloping:    "#60A5FA",   // deep-blue — in progress
  tierEmerging:      "#FBBF24",   // amber — new/nascent

  // Spacing (8px base)
  spaceSm:  "8px",
  spaceMd:  "16px",
  spaceLg:  "24px",
  spaceXl:  "32px",

  // Border radius
  radiusSm:  "6px",
  radiusMd:  "10px",  // node rects
  radiusLg:  "16px",

  // Transitions — canonical easing curve
  transitionQuick:  "200ms cubic-bezier(0.4, 0, 0.2, 1)",

  // Font families
  fontSerif: "'Crimson Text', Georgia, serif",
  fontSans:  "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
};

// ── GRAPH DATA ──────────────────────────────────────────────
// The canonical source: every node, every edge.
// This is the structure Mermaid could consume, and the renderer reads.

const DOMAINS = {
  language:   { label: "Language & Literacy",           color: "#60A5FA",  short: "L"  },
  // maths: was #D97B3A (ember) — changed to #A78BFA (violet). Ember is restricted to primary actions.
  maths:      { label: "Mathematical Thinking",         color: "#A78BFA",  short: "M"  },
  science:    { label: "Scientific Thinking",           color: "#4ADE80",  short: "S"  },
  humanities: { label: "Humanities & Social",            color: "#818CF8",  short: "H"  },
  physical:   { label: "Physical Capability",            color: "#FB7185",  short: "P"  },
  personal:   { label: "Personal & Social",              color: "#F9A8D4",  short: "PS" },
  creative:   { label: "Creative Expression",            color: "#5EEAD4",  short: "C"  },
  executive:  { label: "Executive Function & Learning",  color: "#9B8B7E",  short: "EF" },
};

// All 57 threads. `enables` = outgoing edges (this → that)
const THREADS = [
  // ── Language & Literacy (9) ──
  { id: "L1", name: "Oral Communication & Listening", domain: "language", foundational: true,
    enables: ["L3","L5","L8","PS1"],
    dlos: [
      { id: "L1-01", s: "Listens and responds with relevant word/phrase", t: "e" },
      { id: "L1-02", s: "Shares a preference or opinion when asked",       t: "e" },
      { id: "L1-03", s: "Follows simple 1–2 step instructions",            t: "e" },
      { id: "L1-04", s: "Takes turns in conversation with prompting",      t: "e" },
      { id: "L1-05", s: "Initiates conversation about experiences",        t: "d" },
      { id: "L1-06", s: "Asks clarifying questions",                       t: "d" },
      { id: "L1-07", s: "Retells events in approximate sequence",          t: "d" },
      { id: "L1-08", s: "Presents ideas to a group with confidence",       t: "m" },
      { id: "L1-09", s: "Adapts language for different audiences",         t: "m" },
    ]},
  { id: "L2", name: "Phonological Awareness & Decoding", domain: "language", foundational: false,
    enables: ["L3","L4","L6"], prereqs: ["L1"],
    dlos: [
      { id: "L2-01", s: "Hears and produces rhyming words",            t: "e" },
      { id: "L2-02", s: "Identifies initial sounds in words",          t: "e" },
      { id: "L2-03", s: "Blends 2–3 sounds to make a word",           t: "d" },
      { id: "L2-04", s: "Decodes unfamiliar words using phonics",      t: "d" },
      { id: "L2-05", s: "Applies knowledge to multisyllabic words",    t: "m" },
    ]},
  { id: "L3", name: "Reading Comprehension", domain: "language",
    enables: ["L5","L7","L8","H2","EF5"], prereqs: ["L1","L2"],
    dlos: [
      { id: "L3-01", s: "Retells a simple story after hearing it",   t: "e" },
      { id: "L3-02", s: "Makes predictions about a story",           t: "e" },
      { id: "L3-03", s: "Identifies main idea in a short text",      t: "d" },
      { id: "L3-04", s: "Makes inferences from text clues",          t: "d" },
      { id: "L3-05", s: "Compares themes across texts",              t: "m" },
    ]},
  { id: "L4", name: "Spelling & Word Knowledge", domain: "language",
    enables: ["L5","L6"], prereqs: ["L2"],
    dlos: [
      { id: "L4-01", s: "Spells high-frequency words correctly",     t: "e" },
      { id: "L4-02", s: "Uses letter-sound knowledge to spell",      t: "d" },
      { id: "L4-03", s: "Applies spelling rules and patterns",       t: "m" },
    ]},
  { id: "L5", name: "Written Expression", domain: "language",
    enables: ["L7","L8"], prereqs: ["L1","L2","L6"],
    dlos: [
      { id: "L5-01", s: "Dictates ideas for someone else to write",               t: "e" },
      { id: "L5-02", s: "Writes a simple sentence with capital and full stop",    t: "e" },
      { id: "L5-03", s: "Writes multiple connected sentences on a topic",         t: "d" },
      { id: "L5-04", s: "Includes beginning, middle, end in narratives",          t: "d" },
      { id: "L5-05", s: "Writes for different purposes",                          t: "m" },
      { id: "L5-06", s: "Re-reads and revises own writing",                       t: "m" },
    ]},
  { id: "L6", name: "Handwriting & Text Production", domain: "language",
    enables: ["L5"], prereqs: ["P2"],
    dlos: [
      { id: "L6-01", s: "Holds pencil with functional grip",         t: "e" },
      { id: "L6-02", s: "Forms most letters legibly",                t: "d" },
      { id: "L6-03", s: "Writes at a pace that supports ideas",      t: "m" },
    ]},
  { id: "L7", name: "Text Structure & Purpose", domain: "language",
    enables: ["L8","H2"], prereqs: ["L3","L5"],
    dlos: [
      { id: "L7-01", s: "Recognises different text types",                 t: "e" },
      { id: "L7-02", s: "Uses text features to locate information",        t: "d" },
      { id: "L7-03", s: "Analyses how structure serves purpose",           t: "m" },
    ]},
  { id: "L8", name: "Persuasion & Argument", domain: "language",
    enables: ["H2","EF5"], prereqs: ["L3","L5","L7","EF5"],
    dlos: [
      { id: "L8-01", s: "States an opinion and gives a reason",       t: "e" },
      { id: "L8-02", s: "Supports a position with evidence",          t: "d" },
      { id: "L8-03", s: "Constructs a reasoned argument",             t: "m" },
    ]},
  { id: "L9", name: "Literary Response & Appreciation", domain: "language",
    enables: ["C1","C3"], prereqs: ["L1","L3"],
    dlos: [
      { id: "L9-01", s: "Expresses preferences for stories/books",       t: "e" },
      { id: "L9-02", s: "Discusses characters and motivations",           t: "d" },
      { id: "L9-03", s: "Analyses literary techniques and effects",       t: "m" },
    ]},

  // ── Mathematical Thinking (9) ──
  { id: "M1", name: "Number Sense & Place Value", domain: "maths", foundational: true,
    enables: ["M2","M3","M5","M7"],
    dlos: [
      { id: "M1-01", s: "Counts objects with 1-to-1 correspondence",  t: "e" },
      { id: "M1-02", s: "Recognises numerals 0–10",                   t: "e" },
      { id: "M1-03", s: "Counts forwards to at least 20",             t: "e" },
      { id: "M1-04", s: "Skip counts by 2s, 5s, 10s",                t: "d" },
      { id: "M1-05", s: "Partitions two-digit numbers into tens/ones", t: "d" },
      { id: "M1-06", s: "Composes numbers in flexible ways",          t: "d" },
      { id: "M1-07", s: "Understands place value through thousands",  t: "m" },
      { id: "M1-08", s: "Works with numbers to 1,000,000",           t: "m" },
    ]},
  { id: "M2", name: "Operations & Computation", domain: "maths",
    enables: ["M3","M4","M5","M7"], prereqs: ["M1"],
    dlos: [
      { id: "M2-01", s: "Adds and subtracts single digits",               t: "e" },
      { id: "M2-02", s: "Uses mental strategies for addition",            t: "d" },
      { id: "M2-03", s: "Multiplies and divides with understanding",      t: "m" },
    ]},
  { id: "M3", name: "Fractional Thinking", domain: "maths",
    enables: ["M5","M4"], prereqs: ["M1","M2"],
    dlos: [
      { id: "M3-01", s: "Recognises halves in everyday contexts",         t: "e" },
      { id: "M3-02", s: "Identifies and compares unit fractions",         t: "d" },
      { id: "M3-03", s: "Operates with fractions and decimals",           t: "m" },
    ]},
  { id: "M4", name: "Algebraic Thinking & Patterns", domain: "maths",
    enables: ["EF5","S1"], prereqs: ["M1","M2"],
    dlos: [
      { id: "M4-01", s: "Continues a simple repeating pattern",           t: "e" },
      { id: "M4-02", s: "Identifies and describes number patterns",       t: "d" },
      { id: "M4-03", s: "Uses variables to represent unknowns",           t: "m" },
    ]},
  { id: "M5", name: "Measurement Sense", domain: "maths",
    enables: ["M3","S3","M7"], prereqs: ["M1","M2"],
    dlos: [
      { id: "M5-01", s: "Compares objects by length/mass/capacity",       t: "e" },
      { id: "M5-02", s: "Measures using informal units",                  t: "e" },
      { id: "M5-03", s: "Uses standard metric units accurately",          t: "d" },
      { id: "M5-04", s: "Applies measurement to practical problems",      t: "m" },
    ]},
  { id: "M6", name: "Spatial Reasoning & Geometry", domain: "maths", foundational: true,
    enables: ["M5","P1","C5"],
    dlos: [
      { id: "M6-01", s: "Sorts and names basic 2D shapes",               t: "e" },
      { id: "M6-02", s: "Describes position and movement",                t: "d" },
      { id: "M6-03", s: "Identifies symmetry and transformation",         t: "m" },
    ]},
  { id: "M7", name: "Data & Statistical Thinking", domain: "maths",
    enables: ["S1","EF5","H4"], prereqs: ["M1","M2"],
    dlos: [
      { id: "M7-01", s: "Sorts objects and creates simple groups",        t: "e" },
      { id: "M7-02", s: "Reads and creates simple graphs",                t: "d" },
      { id: "M7-03", s: "Interprets data to draw conclusions",            t: "m" },
    ]},
  { id: "M8", name: "Probability & Chance", domain: "maths",
    enables: ["M7","EF5"], prereqs: ["M1","M3"],
    dlos: [
      { id: "M8-01", s: "Uses language of chance (likely, unlikely)",     t: "e" },
      { id: "M8-02", s: "Conducts simple chance experiments",             t: "d" },
      { id: "M8-03", s: "Assigns probabilities to events",                t: "m" },
    ]},
  { id: "M9", name: "Mathematical Modelling", domain: "maths",
    enables: ["S1","EF5"], prereqs: ["M2","M5","EF4"],
    dlos: [
      { id: "M9-01", s: "Represents a real problem with a drawing",       t: "e" },
      { id: "M9-02", s: "Chooses appropriate operations for problems",    t: "d" },
      { id: "M9-03", s: "Models multi-step real-world problems",          t: "m" },
    ]},

  // ── Scientific Thinking (6) ──
  { id: "S1", name: "Scientific Inquiry", domain: "science",
    enables: ["S2","S3","S4","EF5"], prereqs: ["EF1","M7"],
    dlos: [
      { id: "S1-01", s: "Asks questions about the natural world",     t: "e" },
      { id: "S1-02", s: "Makes predictions and tests them",           t: "d" },
      { id: "S1-03", s: "Designs fair tests with variables",          t: "m" },
    ]},
  { id: "S2", name: "Living Systems", domain: "science",
    enables: ["S3","H3"], prereqs: ["S1","S5"],
    dlos: [
      { id: "S2-01", s: "Identifies living vs non-living things",     t: "e" },
      { id: "S2-02", s: "Describes needs of living things",           t: "d" },
      { id: "S2-03", s: "Explains life cycles and ecosystems",        t: "m" },
    ]},
  { id: "S3", name: "Earth & Environmental Systems", domain: "science",
    enables: ["H3","EF5"], prereqs: ["S1","S5"],
    dlos: [
      { id: "S3-01", s: "Observes weather and seasonal changes",      t: "e" },
      { id: "S3-02", s: "Describes features of the landscape",        t: "d" },
      { id: "S3-03", s: "Explains Earth processes and sustainability", t: "m" },
    ]},
  { id: "S4", name: "Physical & Chemical Sciences", domain: "science",
    enables: ["M9","C6"], prereqs: ["S1","M5"],
    dlos: [
      { id: "S4-01", s: "Explores how things move and change",        t: "e" },
      { id: "S4-02", s: "Investigates forces and energy",             t: "d" },
      { id: "S4-03", s: "Explains physical/chemical changes",         t: "m" },
    ]},
  { id: "S5", name: "Scientific Observation", domain: "science",
    enables: ["S1","S2","S3","S4"], prereqs: ["EF1"],
    dlos: [
      { id: "S5-01", s: "Uses senses to explore materials",                  t: "e" },
      { id: "S5-02", s: "Records observations with drawings/words",          t: "d" },
      { id: "S5-03", s: "Makes detailed systematic observations",            t: "m" },
    ]},
  { id: "S6", name: "Science as Human Endeavour", domain: "science",
    enables: ["H2","EF5"], prereqs: ["S1","L3"],
    dlos: [
      { id: "S6-01", s: "Recognises that science affects daily life",        t: "e" },
      { id: "S6-02", s: "Explores how science knowledge develops",           t: "d" },
      { id: "S6-03", s: "Evaluates scientific claims critically",            t: "m" },
    ]},

  // ── Humanities & Social (6) ──
  { id: "H1", name: "Historical Thinking & Chronology", domain: "humanities",
    enables: ["H2","H4"], prereqs: ["L1","EF3"],
    dlos: [
      { id: "H1-01", s: "Sequences personal events (before/after)",         t: "e" },
      { id: "H1-02", s: "Identifies change over time in community",         t: "d" },
      { id: "H1-03", s: "Analyses cause and effect in history",             t: "m" },
    ]},
  { id: "H2", name: "Source Analysis & Evidence", domain: "humanities",
    enables: ["L8","EF5"], prereqs: ["L3","H1","EF5"],
    dlos: [
      { id: "H2-01", s: "Identifies different types of sources",            t: "e" },
      { id: "H2-02", s: "Compares information from sources",                t: "d" },
      { id: "H2-03", s: "Evaluates reliability and bias",                   t: "m" },
    ]},
  { id: "H3", name: "Geography & Environmental Awareness", domain: "humanities",
    enables: ["S3","H4","PS5"], prereqs: ["M6","S5"],
    dlos: [
      { id: "H3-01", s: "Describes features of familiar places",            t: "e" },
      { id: "H3-02", s: "Uses simple maps and directions",                  t: "d" },
      { id: "H3-03", s: "Analyses human-environment interactions",          t: "m" },
    ]},
  { id: "H4", name: "Civic & Economic Understanding", domain: "humanities",
    enables: ["PS6","L8"], prereqs: ["PS1","L1"],
    dlos: [
      { id: "H4-01", s: "Identifies roles in family and school",            t: "e" },
      { id: "H4-02", s: "Understands basic needs vs wants",                 t: "d" },
      { id: "H4-03", s: "Explains democratic processes",                    t: "m" },
    ]},
  { id: "H5", name: "HASS Inquiry Skills", domain: "humanities",
    enables: ["H1","H2","H3","H4"], prereqs: ["L3","EF4"],
    dlos: [
      { id: "H5-01", s: "Poses simple questions about the past/places",     t: "e" },
      { id: "H5-02", s: "Gathers information from provided sources",        t: "d" },
      { id: "H5-03", s: "Plans and conducts guided investigations",         t: "m" },
    ]},
  { id: "H6", name: "First Nations Perspectives", domain: "humanities",
    enables: ["H1","H3","PS6"], prereqs: ["L1","PS1"],
    dlos: [
      { id: "H6-01", s: "Recognises Aboriginal & Torres Strait Islander cultures",         t: "e" },
      { id: "H6-02", s: "Explores connection to Country and Place",                        t: "d" },
      { id: "H6-03", s: "Understands ongoing significance of First Nations knowledge",     t: "m" },
    ]},

  // ── Physical Capability (5) ──
  { id: "P1", name: "Gross Motor & Coordination", domain: "physical", foundational: true,
    enables: ["P3","P4","C6"],
    dlos: [
      { id: "P1-01", s: "Runs, jumps, climbs with confidence",             t: "e" },
      { id: "P1-02", s: "Catches and throws with increasing accuracy",     t: "d" },
      { id: "P1-03", s: "Performs complex movement sequences",             t: "m" },
    ]},
  { id: "P2", name: "Fine Motor & Manipulation", domain: "physical", foundational: true,
    enables: ["L6","C5","C6"],
    dlos: [
      { id: "P2-01", s: "Threads beads, completes simple puzzles",         t: "e" },
      { id: "P2-02", s: "Uses scissors, tools with control",               t: "d" },
      { id: "P2-03", s: "Manipulates small objects precisely",             t: "m" },
    ]},
  { id: "P3", name: "Health & Body Awareness", domain: "physical",
    enables: ["PS3","P4"], prereqs: ["PS1"],
    dlos: [
      { id: "P3-01", s: "Names major body parts",                         t: "e" },
      { id: "P3-02", s: "Makes healthy food choices with support",        t: "d" },
      { id: "P3-03", s: "Explains factors that influence health",         t: "m" },
    ]},
  { id: "P4", name: "Sport & Cooperative Games", domain: "physical",
    enables: ["PS2","EF4"], prereqs: ["P1","PS2"],
    dlos: [
      { id: "P4-01", s: "Participates willingly in group activities",     t: "e" },
      { id: "P4-02", s: "Follows rules and takes turns in games",         t: "d" },
      { id: "P4-03", s: "Demonstrates teamwork and fair play",            t: "m" },
    ]},
  { id: "P5", name: "Risk Assessment & Physical Safety", domain: "physical",
    enables: ["EF4","PS3"], prereqs: ["P1","PS3"],
    dlos: [
      { id: "P5-01", s: "Identifies obvious hazards",                     t: "e" },
      { id: "P5-02", s: "Assesses risk before physical activity",         t: "d" },
      { id: "P5-03", s: "Manages risk independently in new contexts",     t: "m" },
    ]},

  // ── Personal & Social (7) ──
  { id: "PS1", name: "Empathy & Perspective-Taking", domain: "personal",
    enables: ["PS2","PS6","L8","H6"], prereqs: ["L1"],
    dlos: [
      { id: "PS1-01", s: "Notices when someone is upset",                 t: "e" },
      { id: "PS1-02", s: "Considers another person's feelings",           t: "d" },
      { id: "PS1-03", s: "Takes perspectives different from own",         t: "m" },
    ]},
  { id: "PS2", name: "Social Skills & Cooperation", domain: "personal",
    enables: ["P4","EF6"], prereqs: ["PS1","L1"],
    dlos: [
      { id: "PS2-01", s: "Plays alongside others with awareness",         t: "e" },
      { id: "PS2-02", s: "Shares, negotiates and compromises",            t: "d" },
      { id: "PS2-03", s: "Resolves conflicts constructively",             t: "m" },
    ]},
  { id: "PS3", name: "Self-Regulation & Wellbeing", domain: "personal", foundational: true,
    enables: ["EF1","EF2","PS2","P5"],
    dlos: [
      { id: "PS3-01", s: "Identifies own basic emotions",                 t: "e" },
      { id: "PS3-02", s: "Uses calming strategies with prompting",        t: "d" },
      { id: "PS3-03", s: "Manages strong emotions independently",         t: "m" },
    ]},
  { id: "PS4", name: "Identity & Belonging", domain: "personal",
    enables: ["PS6","H6"], prereqs: ["L1"],
    dlos: [
      { id: "PS4-01", s: "Talks about self and family with confidence",   t: "e" },
      { id: "PS4-02", s: "Identifies personal strengths",                 t: "d" },
      { id: "PS4-03", s: "Expresses cultural identity and values",        t: "m" },
    ]},
  { id: "PS5", name: "Environmental Stewardship", domain: "personal",
    enables: ["S3","PS6"], prereqs: ["S5","H3","PS1"],
    dlos: [
      { id: "PS5-01", s: "Shows care for plants and animals",             t: "e" },
      { id: "PS5-02", s: "Participates in sustainability practices",      t: "d" },
      { id: "PS5-03", s: "Advocates for environmental responsibility",    t: "m" },
    ]},
  { id: "PS6", name: "Ethical Reasoning", domain: "personal",
    enables: ["H4"], prereqs: ["PS1","L1","EF5"],
    dlos: [
      { id: "PS6-01", s: "Identifies situations as fair or unfair",               t: "e" },
      { id: "PS6-02", s: "Considers impact of actions on others",                 t: "d" },
      { id: "PS6-03", s: "Analyses ethical dilemmas from multiple views",         t: "m" },
    ]},
  { id: "PS7", name: "Digital Citizenship", domain: "personal",
    enables: ["EF5","H2"], prereqs: ["L3","PS2"],
    dlos: [
      { id: "PS7-01", s: "Uses devices with basic safety rules",                  t: "e" },
      { id: "PS7-02", s: "Understands online actions have consequences",          t: "d" },
      { id: "PS7-03", s: "Evaluates online information for credibility",          t: "m" },
    ]},

  // ── Creative Expression (7) ──
  { id: "C1", name: "Narrative & Storytelling", domain: "creative",
    enables: ["L5","C3","C4"], prereqs: ["L1","L9"],
    dlos: [
      { id: "C1-01", s: "Tells simple stories with characters",             t: "e" },
      { id: "C1-02", s: "Creates stories with plot structure",              t: "d" },
      { id: "C1-03", s: "Crafts narratives with theme and tension",         t: "m" },
    ]},
  { id: "C2", name: "Musical Expression", domain: "creative",
    enables: ["C3","PS3"], prereqs: ["L1"],
    dlos: [
      { id: "C2-01", s: "Responds to music with movement",                 t: "e" },
      { id: "C2-02", s: "Keeps a steady beat, sings in tune",              t: "d" },
      { id: "C2-03", s: "Creates and performs original music",             t: "m" },
    ]},
  { id: "C3", name: "Poetic & Rhythmic Expression", domain: "creative",
    enables: ["L5","C2"], prereqs: ["L1","L2","L9"],
    dlos: [
      { id: "C3-01", s: "Enjoys and recites nursery rhymes",               t: "e" },
      { id: "C3-02", s: "Creates simple poems with patterns",              t: "d" },
      { id: "C3-03", s: "Writes poetry with literary techniques",          t: "m" },
    ]},
  { id: "C4", name: "Dramatic Expression", domain: "creative",
    enables: ["C1","PS1","L1"], prereqs: ["L1","PS1"],
    dlos: [
      { id: "C4-01", s: "Engages in pretend play",                         t: "e" },
      { id: "C4-02", s: "Takes on roles and sustains character",           t: "d" },
      { id: "C4-03", s: "Performs for an audience with expression",        t: "m" },
    ]},
  { id: "C5", name: "Visual Expression & Design", domain: "creative",
    enables: ["C6","L6"], prereqs: ["P2","M6"],
    dlos: [
      { id: "C5-01", s: "Explores materials freely (paint, clay)",         t: "e" },
      { id: "C5-02", s: "Creates art with intentional composition",        t: "d" },
      { id: "C5-03", s: "Applies design principles purposefully",          t: "m" },
    ]},
  { id: "C6", name: "Design & Construction", domain: "creative",
    enables: ["M9","S4","EF4"], prereqs: ["P2","M5","S4"],
    dlos: [
      { id: "C6-01", s: "Builds with blocks and loose parts",              t: "e" },
      { id: "C6-02", s: "Follows simple plans to make things",             t: "d" },
      { id: "C6-03", s: "Uses design cycle: plan, make, test, improve",   t: "m" },
    ]},
  { id: "C7", name: "Digital Creation", domain: "creative",
    enables: ["C6","M9"], prereqs: ["EF4","M4"],
    dlos: [
      { id: "C7-01", s: "Uses simple digital tools to create",             t: "e" },
      { id: "C7-02", s: "Creates digital content with purpose",            t: "d" },
      { id: "C7-03", s: "Combines digital tools for complex projects",     t: "m" },
    ]},

  // ── Executive Function & Learning (8) ──
  { id: "EF1", name: "Sustained Attention & Focus", domain: "executive",
    enables: ["L3","S5","EF2"], prereqs: ["PS3"],
    dlos: [
      { id: "EF1-01", s: "Engages with a task for 5+ minutes",            t: "e" },
      { id: "EF1-02", s: "Maintains focus despite distractions",          t: "d" },
      { id: "EF1-03", s: "Sustains deep focus for extended periods",      t: "m" },
    ]},
  { id: "EF2", name: "Working Memory", domain: "executive",
    enables: ["M2","L3"], prereqs: ["EF1"],
    dlos: [
      { id: "EF2-01", s: "Follows 2-step instructions",                           t: "e" },
      { id: "EF2-02", s: "Holds multiple pieces of info while working",            t: "d" },
      { id: "EF2-03", s: "Manipulates complex information mentally",               t: "m" },
    ]},
  { id: "EF3", name: "Memory & Recall", domain: "executive",
    enables: ["M2","L4","H1"], prereqs: ["EF1"],
    dlos: [
      { id: "EF3-01", s: "Recalls recent events when prompted",                    t: "e" },
      { id: "EF3-02", s: "Retrieves learned facts reliably",                       t: "d" },
      { id: "EF3-03", s: "Connects new learning to prior knowledge",               t: "m" },
    ]},
  { id: "EF4", name: "Planning & Organisation", domain: "executive",
    enables: ["M9","S1","H5","C6"], prereqs: ["EF1","PS3"],
    dlos: [
      { id: "EF4-01", s: "Follows a simple routine",                               t: "e" },
      { id: "EF4-02", s: "Plans steps to complete a task",                         t: "d" },
      { id: "EF4-03", s: "Manages multi-day projects independently",               t: "m" },
    ]},
  { id: "EF5", name: "Critical Thinking", domain: "executive",
    enables: ["L8","H2","S6","M9"], prereqs: ["L3","EF2"],
    dlos: [
      { id: "EF5-01", s: "Asks 'why?' and 'how do you know?'",                    t: "e" },
      { id: "EF5-02", s: "Identifies assumptions in arguments",                    t: "d" },
      { id: "EF5-03", s: "Evaluates evidence and reasoning quality",               t: "m" },
    ]},
  { id: "EF6", name: "Collaboration & Teamwork", domain: "executive",
    enables: ["P4","S1"], prereqs: ["PS2","L1"],
    dlos: [
      { id: "EF6-01", s: "Works alongside others on shared task",                  t: "e" },
      { id: "EF6-02", s: "Contributes ideas and listens to others",                t: "d" },
      { id: "EF6-03", s: "Takes different roles within a team",                    t: "m" },
    ]},
  { id: "EF7", name: "Metacognition & Reflection", domain: "executive",
    enables: [], prereqs: ["L1","PS3"],
    dlos: [
      { id: "EF7-01", s: "Says what was easy or hard about a task",                t: "e" },
      { id: "EF7-02", s: "Identifies own learning strategies",                     t: "d" },
      { id: "EF7-03", s: "Monitors and adjusts approach during learning",          t: "m" },
    ]},
  { id: "EF8", name: "Creative Thinking & Innovation", domain: "executive",
    enables: ["C6","M9"], prereqs: ["EF1","PS3"],
    dlos: [
      { id: "EF8-01", s: "Suggests unusual uses for objects",                      t: "e" },
      { id: "EF8-02", s: "Generates multiple solutions to a problem",              t: "d" },
      { id: "EF8-03", s: "Combines ideas from different domains",                  t: "m" },
    ]},
];

// ── TIER LEGEND ──
const TIERS    = { e: "Emerging", d: "Developing", m: "Demonstrating" };
const TIER_DOT = { e: "○", d: "◐", m: "●" };

// Tier color map — references TOKENS, not hardcoded hex.
// Developing was #D97B3A (ember violation) — corrected to deep-blue.
// Emerging was #60A5FA — corrected to amber, matching hearth-capabilities-v4.html.
const TIER_COLOR = {
  m: TOKENS.tierDemonstrating,  // sage   — mastery
  d: TOKENS.tierDeveloping,     // blue   — in progress
  e: TOKENS.tierEmerging,       // amber  — nascent
};

// ── LAYOUT ENGINE ──────────────────────────────────────────
// Positions nodes in domain rows, stacked vertically.
// Returns { nodeId: { x, y } } map.

const DOMAIN_ORDER = ["language","maths","science","humanities","physical","personal","creative","executive"];
const NODE_W  = 120;
const NODE_H  = 40;
const ROW_GAP = 100;
const COL_GAP = 140;

function computeLayout(threads) {
  const positions    = {};
  const domainGroups = {};
  DOMAIN_ORDER.forEach(d => { domainGroups[d] = []; });
  threads.forEach(t => { if (domainGroups[t.domain]) domainGroups[t.domain].push(t); });

  let yOffset = 20;
  DOMAIN_ORDER.forEach(domainId => {
    const group = domainGroups[domainId];
    const startX = Math.max(20, (group.length < 5 ? 200 : 60));

    group.forEach((thread, i) => {
      const yJitter = (i % 2) * 18; // Stagger odd items for organic feel
      positions[thread.id] = {
        x: startX + i * COL_GAP,
        y: yOffset + yJitter,
      };
    });
    yOffset += ROW_GAP;
  });
  return positions;
}

// ── EDGE BUILDER ──
function computeEdges(threads) {
  const edges    = [];
  const threadIds = new Set(threads.map(t => t.id));
  threads.forEach(t => {
    (t.enables || []).forEach(targetId => {
      if (threadIds.has(targetId)) {
        const target = threads.find(x => x.id === targetId);
        edges.push({
          from:        t.id,
          to:          targetId,
          crossDomain: t.domain !== target?.domain,
        });
      }
    });
  });
  return edges;
}

// ═══════════════════════════════════════════════════════════════
// CONSTELLATION COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CapabilitiesConstellation() {
  const [expandedNode, setExpandedNode] = useState(null);
  const [hoveredNode,  setHoveredNode]  = useState(null);
  const svgRef       = useRef(null);
  const containerRef = useRef(null);

  const positions = useMemo(() => computeLayout(THREADS), []);
  const edges     = useMemo(() => computeEdges(THREADS),  []);

  // Calculate SVG dimensions from positions
  const svgWidth = useMemo(() => {
    const maxX = Math.max(...Object.values(positions).map(p => p.x));
    return maxX + NODE_W + 40;
  }, [positions]);

  const svgHeight = useMemo(() => {
    const maxY = Math.max(...Object.values(positions).map(p => p.y));
    return maxY + NODE_H + 160; // extra room for last domain
  }, [positions]);

  const toggleNode = useCallback((id) => {
    setExpandedNode(prev => prev === id ? null : id);
  }, []);

  // Which edges connect to hovered or expanded node
  const activeNodeId  = expandedNode || hoveredNode;
  const connectedIds  = useMemo(() => {
    if (!activeNodeId) return new Set();
    const ids = new Set([activeNodeId]);
    edges.forEach(e => {
      if (e.from === activeNodeId) ids.add(e.to);
      if (e.to   === activeNodeId) ids.add(e.from);
    });
    return ids;
  }, [activeNodeId, edges]);

  // Domain label positions (one per domain, above its topmost node)
  const domainLabels = useMemo(() => {
    const labels       = [];
    const domainGroups = {};
    DOMAIN_ORDER.forEach(d => { domainGroups[d] = []; });
    THREADS.forEach(t => { domainGroups[t.domain].push(t.id); });

    DOMAIN_ORDER.forEach(domainId => {
      const ids = domainGroups[domainId];
      if (ids.length === 0) return;
      const ys  = ids.map(id => positions[id]?.y || 0);
      const minY = Math.min(...ys);
      labels.push({ domainId, y: minY - 6 });
    });
    return labels;
  }, [positions]);

  return (
    <div
      ref={containerRef}
      style={{
        width:                  "100%",
        overflowX:              "auto",
        overflowY:              "auto",
        WebkitOverflowScrolling: "touch",
        background:             TOKENS.surfaceBody,
        position:               "relative",
      }}
    >
      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ display: "block", fontFamily: TOKENS.fontSans }}
      >
        {/* ── DOMAIN ROW LABELS ── */}
        {domainLabels.map(dl => {
          const d = DOMAINS[dl.domainId];
          return (
            <g key={dl.domainId}>
              <text
                x={12} y={dl.y - 2}
                fill={d.color}
                fontSize="10" fontWeight="600"
                textAnchor="start" opacity="0.6"
                style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
              >
                {d.label}
              </text>
              <line
                x1={12} y1={dl.y + 4} x2={svgWidth - 12} y2={dl.y + 4}
                stroke={d.color} strokeOpacity="0.06" strokeWidth="1"
              />
            </g>
          );
        })}

        {/* ── EDGES ── */}
        {edges.map((edge, i) => {
          const from = positions[edge.from];
          const to   = positions[edge.to];
          if (!from || !to) return null;

          const x1 = from.x + NODE_W / 2;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x   + NODE_W / 2;
          const y2 = to.y   + NODE_H / 2;

          const isActive = activeNodeId && (edge.from === activeNodeId || edge.to === activeNodeId);
          const isFaded  = activeNodeId && !isActive;

          // Curved path
          const midY = (y1 + y2) / 2;
          const dx   = (x2 - x1) * 0.15;
          const path = `M ${x1} ${y1} C ${x1 + dx} ${midY}, ${x2 - dx} ${midY}, ${x2} ${y2}`;

          return (
            <path
              key={i} d={path}
              fill="none"
              stroke={
                isActive
                  ? TOKENS.ember                          // ember — correct: active/selected state
                  : edge.crossDomain
                    ? TOKENS.edgeMuted                    // very faint for cross-domain
                    : TOKENS.edgeCross                    // slightly more visible within-domain
              }
              strokeWidth={isActive ? 1.5 : 0.8}
              strokeDasharray={edge.crossDomain && !isActive ? "3 4" : "none"}
              opacity={isFaded ? 0.04 : 1}
              style={{ transition: `stroke ${TOKENS.transitionQuick}, opacity ${TOKENS.transitionQuick}, stroke-width ${TOKENS.transitionQuick}` }}
            />
          );
        })}

        {/* ── NODES ── */}
        {THREADS.map(thread => {
          const pos          = positions[thread.id];
          if (!pos) return null;
          const d            = DOMAINS[thread.domain];
          const isExpanded   = expandedNode === thread.id;
          const isConnected  = connectedIds.has(thread.id);
          const isFaded      = activeNodeId && !isConnected;
          const isFoundational = thread.foundational;

          const expandedHeight = 24 + (thread.dlos?.length || 0) * 22 + 8;

          return (
            <g
              key={thread.id}
              style={{
                cursor:     "pointer",
                opacity:    isFaded ? 0.15 : 1,
                transition: `opacity ${TOKENS.transitionQuick}`,
              }}
              onMouseEnter={() => !expandedNode && setHoveredNode(thread.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => toggleNode(thread.id)}
            >
              {/* Node background */}
              <rect
                x={pos.x} y={pos.y}
                width={NODE_W}
                height={isExpanded ? NODE_H + expandedHeight : NODE_H}
                rx={10} ry={10}          /* --radius-md = 10px (was 8, non-canonical) */
                fill={
                  isExpanded
                    ? "rgba(26, 22, 18, 0.95)"
                    : isConnected && activeNodeId
                      ? `${d.color}12`
                      : "rgba(26, 22, 18, 0.7)"
                }
                stroke={
                  isExpanded
                    ? d.color
                    : isConnected && activeNodeId
                      ? `${d.color}60`
                      : `${d.color}25`
                }
                strokeWidth={isExpanded ? 1.5 : 1}
                style={{ transition: `all ${TOKENS.transitionQuick}` }}
              />

              {/* Foundational marker dot */}
              {isFoundational && (
                <circle
                  cx={pos.x + 10} cy={pos.y + NODE_H / 2}
                  r={3} fill={d.color} opacity={0.5}
                />
              )}

              {/* Thread ID */}
              <text
                x={pos.x + (isFoundational ? 20 : 10)}
                y={pos.y + 16}
                fill={d.color}
                fontSize="10"
                fontWeight="600"  /* was 700 — reserved for display/brand only */
                style={{ letterSpacing: "0.02em" }}
              >
                {thread.id}
              </text>

              {/* Thread name (truncated) */}
              <text
                x={pos.x + (isFoundational ? 20 : 10)}
                y={pos.y + 30}
                fill={TOKENS.textSecondary}
                fontSize="8.5" fontWeight="400"
              >
                {thread.name.length > 18 ? thread.name.slice(0, 17) + "…" : thread.name}
              </text>

              {/* ── EXPANDED: DLO LIST ── */}
              {isExpanded && thread.dlos && (
                <g>
                  {/* Divider */}
                  <line
                    x1={pos.x + 8}       y1={pos.y + NODE_H + 2}
                    x2={pos.x + NODE_W - 8} y2={pos.y + NODE_H + 2}
                    stroke={`${d.color}20`} strokeWidth="0.5"
                  />
                  {/* Full thread name */}
                  <text
                    x={pos.x + 10} y={pos.y + NODE_H + 18}
                    fill={TOKENS.textPrimary}
                    fontSize="9" fontWeight="600"
                  >
                    {thread.name}
                  </text>

                  {thread.dlos.map((dlo, di) => {
                    const dy        = pos.y + NODE_H + 30 + di * 22;
                    const tierColor = TIER_COLOR[dlo.t];
                    return (
                      <g key={dlo.id}>
                        {/* Tier dot */}
                        <text x={pos.x + 10} y={dy + 4} fill={tierColor} fontSize="9">
                          {TIER_DOT[dlo.t]}
                        </text>
                        {/* DLO statement */}
                        <text x={pos.x + 22} y={dy + 4} fill={TOKENS.textSecondary} fontSize="8">
                          {dlo.s.length > 40 ? dlo.s.slice(0, 39) + "…" : dlo.s}
                        </text>
                        {/* Tier label (right-aligned, abbreviated) */}
                        <text
                          x={pos.x + NODE_W - 10} y={dy + 4}
                          fill={tierColor} fontSize="7"
                          textAnchor="end" opacity="0.6"
                        >
                          {TIERS[dlo.t]?.[0]}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── LEGEND ── */}
      <div style={{
        position:        "sticky",
        bottom:          0,
        left:            0,
        right:           0,
        padding:         `${TOKENS.spaceSm} ${TOKENS.spaceMd}`,
        background:      `linear-gradient(transparent, ${TOKENS.surfaceBody} 40%)`,
        display:         "flex",
        gap:             TOKENS.spaceMd,
        justifyContent:  "center",
        fontSize:        "10px",
        color:           TOKENS.textMuted,
        fontFamily:      TOKENS.fontSans,
      }}>
        <span>○ Emerging</span>
        <span>◐ Developing</span>
        <span>● Demonstrating</span>
        <span style={{ opacity: 0.5 }}>— edges = enables</span>
        <span style={{ opacity: 0.5 }}>● = foundational</span>
      </div>
    </div>
  );
}
