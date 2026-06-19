'use client';

/**
 * Hearth icon system — central import point.
 *
 * Rules: docs/hearth-icon-system-v1.md
 * Decision: docs/hearth-decisions-log-v1.md (S14)
 *
 * Why this file exists:
 *   App code MUST import icons from `@/components/icons`, never from
 *   `@phosphor-icons/react` directly. This is the single swap point when
 *   custom illustrator marks land (per-child shapes, brand mark, badges).
 *
 * Constraints:
 *   - Phosphor `regular` weight only. The one exception (badge earned →
 *     `fill`) is documented at the badge component file, not here.
 *   - Sizes from `--icon-xs` / `--icon-sm` / `--icon-md` / `--icon-lg` /
 *     `--icon-xl` only (14 / 16 / 18 / 22 / 32). Default 18.
 *   - Icons inherit `currentColor`. Never set `color` on an icon.
 *   - Add a name here only if it's listed in the icon system rules doc.
 *
 * The re-export list below is curated to match the semantic icons used
 * across `src/lib/icon-registry.ts`. Adding a new Phosphor icon to app
 * code is a design decision — extend this file and the rules doc, not
 * a developer call to add a one-off import.
 */

import * as React from 'react';
import { IconContext } from '@phosphor-icons/react';

// ── Navigation ─────────────────────────────────────────────────────
export { House } from '@phosphor-icons/react';                       // nav.home, location.home (when distinct), welcome.home
export { PencilSimpleLine } from '@phosphor-icons/react';            // nav.log, action.edit-text, intent.writing
export { BookOpenText } from '@phosphor-icons/react';                // nav.story, subject.english, state.empty-story
export { Compass } from '@phosphor-icons/react';                     // nav.explore, intent.explore, settings.approach
export { CalendarBlank } from '@phosphor-icons/react';               // nav.plan, state.nothing-planned, project.duration
export { Gear } from '@phosphor-icons/react';                        // nav.settings (technologies uses Cpu — disambiguates 1.0 emoji clash)
export { Bell } from '@phosphor-icons/react';                        // nav.notifications, settings.notifications
export { Sparkle } from '@phosphor-icons/react';                     // nav.capabilities, state.success, creator.default, intent.inspiration, welcome.capabilities, insight.sparkle
export { FileText } from '@phosphor-icons/react';                    // nav.portfolio, story.report, landing.compliance (alt)
export { Storefront } from '@phosphor-icons/react';                  // nav.marketplace

// ── Subjects ───────────────────────────────────────────────────────
// (subject.english uses BookOpenText above)
export { MathOperations } from '@phosphor-icons/react';              // subject.mathematics, insight.subject-hint
export { Atom } from '@phosphor-icons/react';                        // subject.science (Microscope reserved for investigation.research alternative)
export { Globe } from '@phosphor-icons/react';                       // subject.hass, value.real-world
export { Palette } from '@phosphor-icons/react';                     // subject.arts, value.arts, preference.art
export { Cpu } from '@phosphor-icons/react';                         // subject.technologies (frees ⚙️ for nav.settings only)
export { PersonSimpleRun } from '@phosphor-icons/react';             // subject.hpe, preference.active
export { ChatsCircle } from '@phosphor-icons/react';                 // subject.languages, preference.discussion
export { HandHeart } from '@phosphor-icons/react';                   // subject.psychosocial
export { Strategy } from '@phosphor-icons/react';                    // subject.executive-function (Brain reserved for memory work)

// ── Activity types ─────────────────────────────────────────────────
export { Leaf } from '@phosphor-icons/react';                        // activity.free-exploration
export { ClipboardText } from '@phosphor-icons/react';               // activity.guided, value.structured (consider Ruler if visual clash)
export { BookOpen } from '@phosphor-icons/react';                    // activity.read-aloud, intent.read, pathway.material, practice.living-books
export { Hammer } from '@phosphor-icons/react';                      // activity.project
export { MapTrifold } from '@phosphor-icons/react';                  // activity.field-trip
export { PaintBrushBroad } from '@phosphor-icons/react';             // activity.creative, pedagogy.waldorf
export { SoccerBall } from '@phosphor-icons/react';                  // activity.physical
export { CookingPot } from '@phosphor-icons/react';                  // activity.life-skills, preference.cooking

// ── Location / Setting ────────────────────────────────────────────
export { HouseLine } from '@phosphor-icons/react';                   // location.home (vs nav.home House)
export { Tree } from '@phosphor-icons/react';                        // location.outdoors, pedagogy.charlotte-mason
export { Bank } from '@phosphor-icons/react';                        // location.community, pedagogy.classical
export { Monitor } from '@phosphor-icons/react';                     // location.online
export { ArrowsClockwise } from '@phosphor-icons/react';             // location.either

// ── Modality ───────────────────────────────────────────────────────
export { HandsClapping } from '@phosphor-icons/react';               // modality.kinesthetic
export { Eye } from '@phosphor-icons/react';                         // modality.visual, investigation.observe
export { Ear } from '@phosphor-icons/react';                         // modality.auditory
export { Quotes } from '@phosphor-icons/react';                      // modality.narrative
export { UsersThree } from '@phosphor-icons/react';                  // modality.social, settings.learners, misc.multiple-learners
export { BookmarkSimple } from '@phosphor-icons/react';              // modality.reading
export { Binoculars } from '@phosphor-icons/react';                  // modality.exploratory, state.not-found

// ── Energy ─────────────────────────────────────────────────────────
export { Wind } from '@phosphor-icons/react';                        // energy.calm (preferred over PersonSimpleTaiChi — atmospheric reads softer than literal pose)
export { Lightning } from '@phosphor-icons/react';                   // energy.moderate
export { Flame } from '@phosphor-icons/react';                       // energy.active, landing.existing, welcome.ready

// ── Pedagogy ───────────────────────────────────────────────────────
// pedagogy.charlotte-mason → Tree (above)
// pedagogy.classical → Bank (above)
export { PuzzlePiece } from '@phosphor-icons/react';                 // pedagogy.montessori
// pedagogy.waldorf → PaintBrushBroad (above)
export { Plant } from '@phosphor-icons/react';                       // pedagogy.unschooling, value.nature, state.growth, notification.capability-growth, insight.thread-hint, landing.new
export { Shuffle } from '@phosphor-icons/react';                     // pedagogy.eclectic

// ── Pedagogy values ────────────────────────────────────────────────
export { BabyCarriage } from '@phosphor-icons/react';                // value.child-led
export { Ruler } from '@phosphor-icons/react';                       // value.structured (use when ClipboardText competes for the slot)
export { GraduationCap } from '@phosphor-icons/react';               // value.academic, creator.educator
export { Waves } from '@phosphor-icons/react';                       // value.flexibility
export { HeartHalf } from '@phosphor-icons/react';                   // value.whole-child
export { Bird } from '@phosphor-icons/react';                        // value.independence
export { Target } from '@phosphor-icons/react';                      // value.mastery, pathway.goal, misc.family-fit

// ── Pedagogy practices ─────────────────────────────────────────────
export { Timer } from '@phosphor-icons/react';                       // practice.short-lessons
export { Buildings } from '@phosphor-icons/react';                   // practice.extended-projects
export { Hand } from '@phosphor-icons/react';                        // practice.hands-on
export { Microphone } from '@phosphor-icons/react';                  // practice.narration, action.voice
export { Flower } from '@phosphor-icons/react';                      // practice.nature-journaling
export { MusicNotes } from '@phosphor-icons/react';                  // practice.movement
export { Repeat } from '@phosphor-icons/react';                      // practice.rhythm
export { FolderOpen } from '@phosphor-icons/react';                  // practice.documentation, story.portfolio
export { GameController } from '@phosphor-icons/react';              // practice.free-play
export { Brain } from '@phosphor-icons/react';                       // practice.memory-work, intent.memorise
export { PencilLine } from '@phosphor-icons/react';                  // practice.copywork, action.log-stage

// ── Creator types ──────────────────────────────────────────────────
export { FlowerLotus } from '@phosphor-icons/react';                 // creator.content-team (Phosphor has no Sprout in v2.1)
// creator.educator → GraduationCap (above)
export { Heart } from '@phosphor-icons/react';                       // creator.parent

// ── UI actions ─────────────────────────────────────────────────────
export { PencilSimple } from '@phosphor-icons/react';                // action.edit
export { Camera } from '@phosphor-icons/react';                      // action.photo
// action.voice → Microphone (above)
export { ChatCircle } from '@phosphor-icons/react';                  // action.words
export { Note } from '@phosphor-icons/react';                        // action.note
export { LinkSimple } from '@phosphor-icons/react';                  // action.link, project.dependency
export { MagnifyingGlass } from '@phosphor-icons/react';             // action.search

// ── States ─────────────────────────────────────────────────────────
export { HandWaving } from '@phosphor-icons/react';                  // state.welcome
export { Confetti } from '@phosphor-icons/react';                    // state.celebration, notification.streak-celebration
// state.not-found → Binoculars (above)
// state.nothing-planned → CalendarBlank (above)
export { Moon } from '@phosphor-icons/react';                        // state.quiet
export { Sun } from '@phosphor-icons/react';                         // state.returning, session.morning
export { NotePencil } from '@phosphor-icons/react';                  // state.draft, notification.draft, notification.pause, landing.capture, welcome.capture
export { MagnifyingGlassPlus } from '@phosphor-icons/react';         // state.searching, investigation.research
export { TrendUp } from '@phosphor-icons/react';                     // state.growth-moment
export { Lock } from '@phosphor-icons/react';                        // state.private

// ── Notifications ──────────────────────────────────────────────────
export { PauseCircle } from '@phosphor-icons/react';                 // (alternative for notification.pause when paused)
export { MedalMilitary } from '@phosphor-icons/react';               // notification.badge-ready
export { ShieldCheck } from '@phosphor-icons/react';                 // notification.compliance, settings.compliance, landing.compliance, welcome.compliance
export { Lightbulb } from '@phosphor-icons/react';                   // notification.invitation, insight.hearth
export { BellSimple } from '@phosphor-icons/react';                  // notification.reminder
export { ChatCircleDots } from '@phosphor-icons/react';              // notification.streak
export { ChartBar } from '@phosphor-icons/react';                    // notification.digest, admin.api-calls

// ── Settings tabs ──────────────────────────────────────────────────
// settings.family → House (above)
// settings.learners → UsersThree (above)
// settings.approach → Compass (above)
// settings.compliance → ShieldCheck (above)
// settings.notifications → Bell (above)
export { Key } from '@phosphor-icons/react';                         // settings.access
export { ShieldStar } from '@phosphor-icons/react';                  // settings.security
export { Diamond } from '@phosphor-icons/react';                     // settings.subscription

// ── Badges & brand ─────────────────────────────────────────────────
export { Star } from '@phosphor-icons/react';                        // (placeholder fallback — see custom marks below)
export { Medal } from '@phosphor-icons/react';                       // badge.default

// ── Session / time ────────────────────────────────────────────────
// session.morning → Sun (above)
export { SunHorizon } from '@phosphor-icons/react';                  // session.afternoon

// ── Resource types ─────────────────────────────────────────────────
export { Book } from '@phosphor-icons/react';                        // resource.book
export { FilmReel } from '@phosphor-icons/react';                    // resource.video
export { Toolbox } from '@phosphor-icons/react';                     // resource.kit
export { DeviceMobile } from '@phosphor-icons/react';                // resource.app
export { MapPin } from '@phosphor-icons/react';                      // resource.place, investigation.visit
export { MusicNote } from '@phosphor-icons/react';                   // resource.audio
export { Package } from '@phosphor-icons/react';                     // resource.other

// ── Pathways ───────────────────────────────────────────────────────
// pathway.material → BookOpen (above)
export { Wrench } from '@phosphor-icons/react';                      // pathway.process, investigation.build
export { ClockCounterClockwise } from '@phosphor-icons/react';       // pathway.retrospective
// pathway.goal → Target (above)

// ── Intents ────────────────────────────────────────────────────────
// intent.read → BookOpen
// intent.inspiration → Sparkle
// intent.explore → Compass
export { ChatCircleText } from '@phosphor-icons/react';              // intent.discuss
export { Flask } from '@phosphor-icons/react';                       // intent.do-activity, investigation.test, preference.experiments
// intent.writing → PencilSimpleLine
// intent.memorise → Brain

// ── Investigation ──────────────────────────────────────────────────
// investigation.observe → Eye
// investigation.test → Flask
// investigation.research → MagnifyingGlassPlus
export { ChatTeardropText } from '@phosphor-icons/react';            // investigation.ask-expert
// investigation.visit → MapPin
// investigation.build → Wrench

// ── Build preferences ──────────────────────────────────────────────
export { TreeEvergreen } from '@phosphor-icons/react';               // preference.outdoors
// preference.art → Palette
export { Books } from '@phosphor-icons/react';                       // preference.books, misc.library
export { DiceFive } from '@phosphor-icons/react';                    // preference.games

// ── Story / hub ────────────────────────────────────────────────────
// story.portfolio → FolderOpen
// story.report → FileText
export { User } from '@phosphor-icons/react';                        // story.learner, project.age, misc.child-mentioned

// ── Landing pillars ────────────────────────────────────────────────
// landing.capture → NotePencil
export { Stack } from '@phosphor-icons/react';                       // landing.content
// landing.compliance → ShieldCheck
// landing.new → Plant
// landing.existing → Flame
export { MonitorPlay } from '@phosphor-icons/react';                 // landing.demo

// ── Admin metrics ──────────────────────────────────────────────────
// admin.api-calls → ChartBar
export { ArrowSquareDown } from '@phosphor-icons/react';             // admin.input-tokens
export { ArrowSquareUp } from '@phosphor-icons/react';               // admin.output-tokens
export { Speedometer } from '@phosphor-icons/react';                 // admin.latency

// ── Project detail ─────────────────────────────────────────────────
// project.duration → CalendarBlank
// project.age → User
export { Paperclip } from '@phosphor-icons/react';                   // project.artifact
// project.dependency → LinkSimple

// ── Misc ───────────────────────────────────────────────────────────
export { MagicWand } from '@phosphor-icons/react';                   // misc.no-prebuilt
export { MoonStars } from '@phosphor-icons/react';                   // misc.snooze
export { ChartLine } from '@phosphor-icons/react';                   // misc.no-patterns

// ── Universal UI chrome ────────────────────────────────────────────
export { ArrowLeft, ArrowRight, CaretDown, CaretRight, Plus, Check, X, Trash, List, Play, Pause } from '@phosphor-icons/react';

// ── Tri-state response (yes / sometimes / not-yet) ────────────────
export {
  CheckCircle,    // yes / valid
  CircleHalf,     // sometimes
  Circle,         // not yet
  XCircle,        // error
  TrendDown,      // delta down (badge re-assessment)
  Equals,         // delta zero
} from '@phosphor-icons/react';

// ── Admin chrome ──────────────────────────────────────────────────
export {
  Mountains,      // Content Studio brand mark
  CircleNotch,    // saving/in-progress spinner-like
  CurrencyDollar, // $ for AI-cost / billing tabs
  Scales,         // tier-comparison (count-based vs DLO-derived) analytics tab
  Skull,          // pack-adoption funnel abandon (currently using TrendDown elsewhere)
} from '@phosphor-icons/react';

// ── Error / recovery ──────────────────────────────────────────────
export { Lifebuoy } from '@phosphor-icons/react';                    // global error fallback (deliberately distinct from brand Flame)
export { SealQuestion } from '@phosphor-icons/react';                // inquiry pathway / unknown
export { WifiSlash } from '@phosphor-icons/react';                   // offline state
export { BookOpenUser } from '@phosphor-icons/react';                // pedagogy notes context

// ── Content / asset kinds ─────────────────────────────────────────
export {
  FilePdf,         // template / worksheet / handout (printable)
  Image,           // reference image
  Cards,           // card_set
  SpeakerHigh,     // audio
  Scissors,        // manipulative (cut-out)
  Printer,         // print action
  Crown,           // alternative founding/premium signal (currently unused)
  Asterisk,        // small-emphasis dot (e.g. lens marker)
  WarningCircle,   // warning / large-bundle
  Tray,            // empty inbox / no candidates
} from '@phosphor-icons/react';

/* ──────────────────────────────────────────────────────────────────
 * CUSTOM MARKS — placeholder slots for illustrator-bespoke icons
 *
 * Each child shape and the brand mark currently aliases to a Phosphor
 * icon so app code can import the final name today. When the custom
 * SVGs land in `src/components/icons/<Name>.tsx`, swap the alias here
 * to point at the local component. App code never changes.
 *
 * Stroke specs the illustrator must match (Phosphor regular):
 *   - viewBox 256×256, strokeWidth 16, linecap/linejoin "round"
 *   - single colour via currentColor, stroke only (no fill)
 *   - no internal padding — fill the viewBox
 * ─────────────────────────────────────────────────────────────────── */

export {
  // PLACEHOLDER: Per-child identity shape. Swap target: src/components/icons/ChildShapeRose.tsx
  Star as ChildShapeRose,
  // PLACEHOLDER: src/components/icons/ChildShapeBlue.tsx
  Star as ChildShapeBlue,
  // PLACEHOLDER: src/components/icons/ChildShapeSage.tsx
  Star as ChildShapeSage,
  // PLACEHOLDER: src/components/icons/ChildShapeAmber.tsx
  Star as ChildShapeAmber,
  // PLACEHOLDER: src/components/icons/ChildShapeViolet.tsx (5th child colour in LearnerAvatar)
  Star as ChildShapeViolet,
  // PLACEHOLDER: Hearth wordmark glyph. Swap target: src/components/icons/HearthBrandMark.tsx
  Flame as HearthBrandMark,
} from '@phosphor-icons/react';

/* ──────────────────────────────────────────────────────────────────
 * IconProvider — sets Hearth defaults for every Phosphor icon below.
 *
 * Mount this once near the root of any subtree that uses icons (e.g.
 * the production layout when the dashboard rebuild lands). Until then
 * Phosphor's own defaults (size 32, weight regular) apply.
 *
 * After mounting, <Compass /> renders at 18px (--icon-md) and inherits
 * currentColor — matching the rules doc's "default size if unspecified"
 * and "icons inherit from parent" guarantees.
 * ─────────────────────────────────────────────────────────────────── */

export function IconProvider({ children }: { children: React.ReactNode }) {
  return (
    <IconContext.Provider
      value={{
        size: 18,
        weight: 'regular',
        mirrored: false,
      }}
    >
      {children}
    </IconContext.Provider>
  );
}

export { IconContext };
