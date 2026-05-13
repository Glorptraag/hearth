/* Per-thread DLO descriptors, three tiers each: [emerging, developing, demonstrating].
   These are stand-ins until Sanity ships real DLO content keyed to thread IDs.
   They follow the prototype's voice: short, observable, parent-readable.
   Threads not listed fall back to a generic "{label} {threadName}" descriptor. */

export const DLO_DESCRIPTORS: Record<string, [string, string, string]> = {
  // ─── Literacy ─────────────────────────────────────────────
  L1: ['Initiates a conversation', 'Sustains back-and-forth', 'Adapts register to audience'],
  L2: ['Hears rhyme and onset', 'Segments words by sound', 'Manipulates phonemes fluently'],
  L3: ['Recalls what was read', 'Infers from text', 'Synthesises across texts'],
  L4: ['Notices new words', 'Uses new words in context', 'Selects precise words for effect'],
  L5: ['Forms letters legibly', 'Composes structured paragraphs', 'Drafts for a specific reader'],
  L6: ['Spells common words', 'Applies spelling patterns', 'Edits grammar independently'],
  L7: ['Identifies story shape', 'Plans a beginning–middle–end', 'Subverts narrative form purposefully'],
  L8: ['States a preference with a reason', 'Builds a short argument', 'Marshals evidence to persuade'],
  L9: ['Names what they enjoyed', 'Notices author choices', 'Reads as a literary critic'],

  // ─── Mathematics ──────────────────────────────────────────
  M1: ['Recognises quantities', 'Compares and orders numbers', 'Reasons about number relationships'],
  M2: ['Adds and subtracts within 10', 'Operates within 100 mentally', 'Chooses efficient strategies'],
  M3: ['Shares fairly into halves', 'Compares unit fractions', 'Operates on fractions confidently'],
  M4: ['Finds the missing number', 'Generalises a pattern', 'Manipulates symbolic expressions'],
  M5: ['Compares lengths directly', 'Uses informal units', 'Applies standard units accurately'],
  M6: ['Names 2D shapes', 'Visualises rotation & reflection', 'Reasons about 3D from 2D'],
  M7: ['Sorts and tallies', 'Reads a simple graph', 'Designs a question and collects data'],
  M8: ['Talks about chance in words', 'Lists possible outcomes', 'Reasons about likelihood numerically'],
  M9: ['Notices when maths fits a real problem', 'Sets up a simple model', 'Refines a model with evidence'],

  // ─── Science ──────────────────────────────────────────────
  S1: ['Asks "what if?"', 'Predicts an outcome', 'Designs a fair test'],
  S2: ['Names living things', 'Describes a life cycle', 'Reasons about ecosystems'],
  S3: ['Notices materials change', 'Sorts substances by property', 'Predicts chemical behaviour'],
  S4: ['Notices forces in play', 'Names cause & effect', 'Predicts physical behaviour'],
  S5: ['Notices details', 'Records observations', 'Sustains attention to detail over time'],
  S6: ['Notices weather and seasons', 'Tracks the moon and stars', 'Connects scales of time'],

  // ─── Humanities ───────────────────────────────────────────
  H1: ['Listens to stories from the past', 'Orders events on a timeline', 'Constructs a historical argument'],
  H2: ['Notices where information came from', 'Asks who said what and why', 'Weighs sources against each other'],
  H3: ['Names familiar places', 'Reads a simple map', 'Reasons about place and people'],
  H4: ['Names community helpers', 'Knows local civic structures', 'Participates in civic life'],
  H5: ['Knows money is exchange', 'Plans a simple budget', 'Reasons about value and trade-offs'],
  H6: ['Notices cultural difference', 'Compares cultures respectfully', 'Engages cultures as living things'],

  // ─── Physical / Personal ──────────────────────────────────
  P1: ['Runs, climbs, jumps freely', 'Controls speed and direction', 'Performs sustained physical effort'],
  P2: ['Holds a pencil', 'Cuts and threads precisely', 'Operates fine tools confidently'],
  P3: ['Names body parts', 'Knows body in space', 'Adjusts effort to context'],
  P4: ['Joins group games', 'Plays by simple rules', 'Plays a position with strategy'],
  P5: ['Floats and moves in water', 'Swims short distances', 'Swims competently across strokes'],

  // ─── Psychosocial ─────────────────────────────────────────
  PS1: ['Notices others’ feelings', 'Adjusts behaviour for others', 'Imagines another’s standpoint'],
  PS2: ['Greets and farewells', 'Sustains friendships', 'Builds relationships across difference'],
  PS3: ['Names what they’re feeling', 'Takes a moment before reacting', 'Recovers without prompting'],
  PS4: ['Names own preferences', 'Talks about own background', 'Articulates own values'],
  PS5: ['Looks after own belongings', 'Follows through on a task', 'Owns the outcome of a choice'],
  PS6: ['Tolerates a small setback', 'Tries again after frustration', 'Sustains effort across long arcs'],
  PS7: ['Knows the household rules', 'Anticipates unsafe situations', 'Decides for own safety independently'],

  // ─── Creative ─────────────────────────────────────────────
  C1: ['Makes marks with intent', 'Composes within a frame', 'Develops a personal visual voice'],
  C2: ['Keeps a beat', 'Sings or plays in tune', 'Improvises within a key'],
  C3: ['Pretends in role', 'Sustains a character', 'Builds drama with structure'],
  C4: ['Moves to music freely', 'Learns short sequences', 'Choreographs original phrases'],
  C5: ['Records something on a device', 'Edits to tell a clearer story', 'Composes media with purpose'],
  C6: ['Joins materials', 'Builds from a plan', 'Designs and revises with materials'],
  C7: ['Notices what they like', 'Articulates why they like it', 'Develops considered taste'],

  // ─── Executive Function ───────────────────────────────────
  EF1: ['Attends for a short stretch', 'Returns after distraction', 'Sustains attention for an hour'],
  EF2: ['Holds two-step instructions', 'Holds a list while working', 'Manipulates information in mind'],
  EF3: ['Switches with help', 'Switches between two tasks', 'Holds multiple frames at once'],
  EF4: ['Sequences a familiar task', 'Plans a multi-step task', 'Plans across days and weeks'],
  EF5: ['Notices a contradiction', 'Asks a sharpening question', 'Weighs claims against evidence'],
  EF6: ['Works alongside another', 'Coordinates a shared task', 'Leads or follows by need'],
  EF7: ['Notices what they’ve learned', 'Names what worked or didn’t', 'Plans how to learn next time'],
  EF8: ['Spots a familiar pattern', 'Applies a skill in a new place', 'Transfers principles across domains'],
};

/* Use this when a descriptor is missing — surface a clean fallback. */
export function fallbackDescriptor(threadName: string, tierLabel: string): string {
  return `${tierLabel} ${threadName.toLowerCase()}`;
}
