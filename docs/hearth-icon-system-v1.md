# Hearth Icon System — v1

> **Status:** Active. Document of record for icon usage in Hearth. **S14 shipped 2026-04-30** — Phosphor is now adopted across all `src/` UI surfaces. The Lucide → Phosphor migration map in §8 remains useful only for any future porting of frozen prototypes (`prototypes/` are reference-only and may still contain Lucide markup).
> **Production library:** [@phosphor-icons/react](https://phosphoricons.com) (regular weight only)
> **Prototype library (historical):** Lucide via CDN — used only in `prototypes/`; do not introduce Lucide into `src/`.
> **Decision record:** `docs/hearth-decisions-log-v1.md` (S14)
> **Token spec:** `docs/hearth-canonical-design-tokens-v1.md` Appendix B (v1 archived; icon Appendix B not yet ported into v2)
> **Implementation:** `src/components/icons/index.tsx` (re-export surface)

---

## 1. Library setup

### Production (Next.js)

```bash
npm install @phosphor-icons/react
```

```tsx
import { Compass, BookOpen, PencilSimpleLine } from '@/components/icons';
```

**Never import directly from `@phosphor-icons/react`.** Always import from `@/components/icons`. This gives Hearth a single swap point when illustrator-bespoke marks (per-child shapes, brand wordmark glyph) replace the Phosphor fallbacks.

The central index at `src/components/icons/index.tsx`:
- Re-exports only the curated subset Hearth uses (not all 1,500 Phosphor icons).
- Aliases placeholder names like `ChildShapeRose` and `HearthBrandMark` to their closest Phosphor fallback today; swaps to the real component when the custom SVG lands.
- Exports an `IconProvider` that sets the Hearth defaults (size 18, weight regular) for any subtree.

Adding a new Phosphor icon to app code is a **design decision**, not a developer call. Extend `index.tsx` and this rules doc together — never reach past the central index.

### Prototypes (HTML)

Use **Lucide** via CDN:

```html
<script src="https://unpkg.com/lucide@latest"></script>
```

Do **not** use a CDN script tag for Phosphor in prototypes — it bloats the bundle and the API differs from `@phosphor-icons/react`.

This is a deliberate split: prototypes use Lucide for speed of iteration, production uses Phosphor for design consistency. The icon shapes are similar enough that prototype-to-production migration is mechanical (name-for-name swap, ~80% have identical names — see migration map at the end).

---

## 2. Weight

`regular` is the only weight Hearth uses. Period.

Do not use `thin`, `light`, `bold`, `fill`, or `duotone` — each breaks a v2 design principle:

- **`thin`** and **`light`** lose presence on dark surfaces below 16px.
- **`bold`** reads as alert/emphasis when most icons are descriptive.
- **`fill`** competes with text and breaks the cream-light aesthetic.
- **`duotone`** introduces a second colour and contradicts single-colour stroke discipline.

```tsx
// Correct
<Compass weight="regular" />

// Wrong — never
<Compass weight="bold" />
<Compass weight="fill" />
```

`regular` is also the default once `IconProvider` is mounted, so `weight` can be omitted. Including it explicitly is fine for code-review clarity but not required.

### Documented exception

The **`fill`** weight is permitted **only** for the earned-badge moment, where the badge icon transitions from `regular` (locked / in-progress) to `fill` (earned). Nowhere else. The badge component file must carry an inline comment documenting this exception so a future audit doesn't quietly relax the rule.

---

## 3. Size

Icons are sized in pixels via the `size` prop. Hearth uses **five sizes only** — anything else is a smell.

| Size | Token | Use |
|---|---|---|
| 14px | `--icon-xs` | Inline with metadata text, action arrows in text links |
| 16px | `--icon-sm` | Inside form chips, button icons next to short labels |
| 18px | `--icon-md` | Nav items, section headers, modal close buttons |
| 22px | `--icon-lg` | Card icons, page header icons, activity-type cards |
| 32px | `--icon-xl` | Empty state illustrations, hero moments |

Tokens are defined in `src/app/globals.css` under `@theme`:

```css
--icon-xs: 14px;
--icon-sm: 16px;
--icon-md: 18px;
--icon-lg: 22px;
--icon-xl: 32px;
```

**Default size if unspecified: 18px.** `<Compass />` without a size prop renders at 18 once `IconProvider` is mounted (Phosphor's own default is 32 — `IconProvider` overrides this).

```tsx
// Correct
<Compass size={18} />
<Compass size={22} />

// Wrong — arbitrary sizes
<Compass size={20} />
<Compass size={24} />
```

If a designer mockup specifies 20px or 24px, round to the nearest token (18 or 22). **Closer to consistency than fidelity.**

### Sizing inside containers

When an icon sits inside a fixed-size container (avatar circle, button square, badge), the icon should be **roughly 55–60% of the container size**, rounded to the nearest token.

| Container size | Icon size |
|---|---|
| 24px | 14px |
| 32px | 18px |
| 36px | 22px |
| 40px | 22px |
| 48px | 22px or 32px (judgement) |
| 80px | 32px |

This keeps icons feeling settled inside their containers rather than cramped (icon too big) or floaty (icon too small).

---

## 4. Colour

Icons inherit `currentColor` by default. **Never set the `color` prop directly on an icon** — colour the parent element via tokens.

```tsx
// Correct — icon inherits from button text colour
<button className="text-text-secondary">
  <Compass size={18} />
</button>

// Correct — using inline style for dynamic state
<span style={{ color: 'var(--color-ember)' }}>
  <Compass size={18} />
</span>

// Wrong — hard-coding colour on the icon itself
<Compass size={18} color="#D97B3A" />
<Compass size={18} weight="regular" color="orange" />
```

### Allowed icon colours (token references only)

| Token | Use |
|---|---|
| `var(--color-text-primary)` | Primary content icons (rare; usually they're secondary) |
| `var(--color-text-secondary)` | Most icons in default state |
| `var(--color-text-muted)` | Metadata, low-importance icons, decorative |
| `var(--color-ember)` | Action signal: active nav item, focused/selected state, primary button icon, Hearth voice signature |
| `var(--color-text-inverse)` | Icons on ember backgrounds (button labels, brand icon) |
| `var(--color-sage)` | Success/completion states only (completed check, badge earned, evidence has-content) |
| `var(--color-child-rose)` / `var(--color-child-blue)` etc. | Per-child contexts only |

### Forbidden

- Hard-coded hex values
- Tailwind colour utilities on the icon (`text-orange-500`, `text-rose-300`)
- Status colours (`--blue`, `--violet`) on icons — those tokens are for backgrounds and tinted state pills, not icon strokes
- Icon colour ≠ surrounding text colour (visually disorienting; if the icon needs different emphasis, the structure is wrong)

---

## 5. Where Phosphor goes

Icons appear in defined contexts only. Adding an icon to a context not on this list requires a design decision, not a developer call.

### Yes

- Navigation items (sidebar, bottom nav, tab bars)
- Card headers (one icon per card max)
- Buttons (one icon per button max, leading or trailing position)
- Form field affordances (search magnifier, calendar trigger, password show/hide)
- Empty states (one large icon, centred)
- Status indicators (sage check for done, ember dot for active)
- Modal title prefixes (one icon, leading)
- Action arrows in text links (`View →` style — use `ArrowRight`, not unicode arrow)
- Per-child identity placeholders (until custom shapes ship — see "Custom marks" below)

### No

- Body text content (write words, not icons)
- Decorative bullet replacements
- Multiple icons in one card or row (unless the row IS a list of icons, e.g. activity-type grid)
- Repeated as a visual pattern (one icon per element max)
- Inside data tables (text columns only; the row affordance is the row itself)
- As a substitute for missing illustrations (pack covers, hero art, marketing imagery — Phosphor is wrong; commission illustration)

---

## 6. Custom marks

When custom-drawn icons are eventually commissioned (per-child shapes, brand wordmark glyph, anything Phosphor doesn't cover), they must match Phosphor regular weight specs:

- **Stroke width:** 1.5px at 24px viewBox (Phosphor's regular spec)
- **Stroke linecap:** `round`
- **Stroke linejoin:** `round`
- **No fills** (stroke only) for UI icons; fill allowed only for badges/identity marks
- **Single colour** via `currentColor`
- **viewBox:** `256×256` (Phosphor's grid) **or** `24×24`, but be consistent within the custom set

Custom icons live in `src/components/icons/` as React components, exported with the same prop signature as Phosphor:

```tsx
type IconProps = {
  size?: number;
  weight?: 'regular' | 'fill';
  className?: string;
  style?: React.CSSProperties;
};

export function ChildShapeRose({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" {...props}>
      <path
        d="..."
        stroke="currentColor"
        strokeWidth="16"  // 1.5px @ 24px ≈ 16px @ 256px
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

Same import surface as Phosphor: `import { ChildShapeRose } from '@/components/icons';`. Until the custom SVG lands, the name aliases to a Phosphor fallback inside `index.tsx`. App code never changes.

### Reserved placeholder slots

Tracked in `src/components/icons/index.tsx`:

| Name | Current alias | Swap target |
|---|---|---|
| `ChildShapeRose` | `Star` | `src/components/icons/ChildShapeRose.tsx` |
| `ChildShapeBlue` | `Star` | `src/components/icons/ChildShapeBlue.tsx` |
| `ChildShapeSage` | `Star` | `src/components/icons/ChildShapeSage.tsx` |
| `ChildShapeAmber` | `Star` | `src/components/icons/ChildShapeAmber.tsx` |
| `ChildShapeViolet` | `Star` | `src/components/icons/ChildShapeViolet.tsx` |
| `HearthBrandMark` | `Flame` | `src/components/icons/HearthBrandMark.tsx` |

---

## 7. Animation

Icons may animate **only** via the motion utilities defined in `hearth-motion-utilities-v1.css` (forward reference — file to follow). Specifically:

- `hearth-press` — scale-on-active for icons inside interactive elements (handled by parent button, never by icon directly)
- Translate `2px` on hover for trailing arrow icons (`<ArrowRight />` in `View →` links)
- `hearth-thinking-pulse` on the Hearth voice icon container (not the icon itself — pulses the background glow)
- Rotate `180°` for chevron icons in expand/collapse — `200ms ease-default`
- Fade in via `hearth-fade-in` when icon is inserted into existing UI (rare)

### Forbidden

- Spin animations on loading icons (use skeleton screens instead)
- Icon-specific bounce/wobble effects
- Scale animations on the icon directly (animate the parent)
- Colour-shift animations (let parent colour change cascade via `currentColor`)

---

## 8. Lucide → Phosphor migration map

For prototype-to-production porting. Most names match. The ones that don't:

| Lucide | Phosphor |
|---|---|
| `home` | `House` |
| `book-open` | `BookOpen` |
| `compass` | `Compass` |
| `pen-line` | `PencilSimpleLine` |
| `hammer` | `Hammer` |
| `settings` | `Gear` |
| `sparkles` | `Sparkle` |
| `notebook-pen` | `NotePencil` |
| `target` | `Target` |
| `trending-up` | `TrendUp` |
| `bell` | `Bell` |
| `arrow-left` | `ArrowLeft` |
| `arrow-right` | `ArrowRight` |
| `chevron-down` | `CaretDown` |
| `flower-2` | (placeholder — replace with custom child shape) |
| `flame` | `Flame` |
| `folder` | `FolderOpen` |
| `clipboard-list` | `ClipboardText` |
| `user-round` | `User` |
| `image` | `Image` |
| `file-text` | `FileText` |
| `palette` | `Palette` |
| `award` | `Medal` |
| `camera` | `Camera` |
| `x` | `X` |
| `plus` | `Plus` |
| `search` | `MagnifyingGlass` |
| `trash-2` | `Trash` |
| `check` | `Check` |
| `mic` | `Microphone` |
| `leaf` | `Leaf` |
| `utensils-crossed` | `ForkKnife` |
| `activity` | `PersonSimpleRun` |
| `users` | `UsersThree` |
| `trees` | `Tree` |
| `landmark` | `Buildings` |
| `laptop` | `Laptop` |
| `message-circle` | `ChatCircle` |
| `link` | `LinkSimple` |
| `smile-plus` | `SmileyWink` |
| `smile` | `Smiley` |
| `meh` | `SmileyMeh` |
| `frown` | `SmileySad` |
| `message-circle-question` | `ChatCircleDots` |
| `star` | `Star` |
| `rocket` | `Rocket` |
| `flask-conical` | `Flask` |
| `square` | `Square` |
| `rotate-ccw` | `ArrowCounterClockwise` |

When porting prototypes, run a find-and-replace in the order above, then visually audit each screen. Phosphor names are PascalCase; Lucide names are kebab-case strings.

---

## 9. Migration policy

Existing Hearth components today rely on the emoji-based registry at `src/lib/icon-registry.ts` (rendered through `<HearthIcon>`). That system stays intact.

Components migrate to the Phosphor system **as they're touched for other reasons** — no big-bang rewrite. The first component to migrate fully should be the **Dashboard** when it gets rebuilt for production. When the Dashboard rebuild lands, mount `<IconProvider>` once at the layout root and the size-18 / regular-weight defaults activate for every subtree.

While both systems coexist:

- The emoji `ICON_REGISTRY` is the source of truth for *what icons exist semantically*.
- `src/components/icons/index.tsx` is the source of truth for *how a Phosphor icon is named and aliased*.
- A given semantic key (e.g. `nav.home`) has an emoji entry today and a Phosphor name reserved in `index.tsx`. Components migrate one at a time.

---

## 10. Non-negotiables

- No icon may be imported directly from `@phosphor-icons/react` in app code. Always import from `@/components/icons`.
- No `weight="bold"`, `weight="fill"`, etc. anywhere except the documented badge-earned exception.
- No hex colours on icons. `currentColor` only.
- No arbitrary sizes. Use the size tokens (14 / 16 / 18 / 22 / 32).
