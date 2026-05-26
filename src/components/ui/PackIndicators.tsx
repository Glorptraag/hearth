'use client';

import type {
  Indicators,
  Materials,
  Printables,
} from '@/lib/sanity/pack-indicators';
import { hasAnyIndicator } from '@/lib/sanity/pack-indicators';

// Emoji glyphs per spec v1 — placeholders pending custom icon system.
// They sit inline with the label, not as a replacement for the dot.
const GLYPH = {
  printables: '\u{1F4C4}', // 📄
  kit: '\u{1F4E6}', // 📦
  materials: '\u{1F9FA}', // 🧺
};

export type PackIndicatorsContext = 'card' | 'card-compact' | 'detail';

export interface PackIndicatorsState {
  printablesDownloaded?: boolean;
  kitOwned?: boolean;
}

interface PackIndicatorsProps {
  printables?: Printables;
  materials?: Materials;
  state?: PackIndicatorsState;
  context: PackIndicatorsContext;
  /** Render a top divider above the row. Only used in card context. */
  withDivider?: boolean;
  className?: string;
}

export function PackIndicators({
  printables,
  materials,
  state,
  context,
  withDivider = false,
  className,
}: PackIndicatorsProps) {
  const indicators: Indicators = { printables, materials };
  if (!hasAnyIndicator(indicators)) return null;

  if (context === 'detail') {
    return (
      <DetailBlock
        printables={printables}
        materials={materials}
        state={state}
        className={className}
      />
    );
  }

  if (context === 'card-compact') {
    return (
      <CompactDots
        printables={printables}
        materials={materials}
        state={state}
        className={className}
      />
    );
  }

  return (
    <CardRow
      printables={printables}
      materials={materials}
      withDivider={withDivider}
      className={className}
    />
  );
}

// ─── Card row (Marketplace card, Library card variant) ──────────────────────
function CardRow({
  printables,
  materials,
  withDivider,
  className,
}: {
  printables?: Printables;
  materials?: Materials;
  withDivider?: boolean;
  className?: string;
}) {
  const items = buildCardItems(printables, materials);
  return (
    <div
      className={[
        'flex flex-wrap items-center gap-md px-lg pt-sm pb-md',
        withDivider ? 'border-t border-border-subtle' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item) => (
        <span
          key={item.key}
          className="inline-flex items-center gap-xs font-sans text-[11px] text-text-muted"
        >
          <Dot />
          <span aria-hidden="true">{item.glyph}</span>
          <span>{item.cardLabel}</span>
        </span>
      ))}
    </div>
  );
}

// ─── Compact dots (Planner, Dashboard Continue, Library, Module sidebar) ────
function CompactDots({
  printables,
  materials,
  state,
  className,
}: {
  printables?: Printables;
  materials?: Materials;
  state?: PackIndicatorsState;
  className?: string;
}) {
  const items = buildCompactItems(printables, materials, state);
  return (
    <div
      className={['inline-flex items-center gap-[6px]', className ?? '']
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label="Pack indicators"
    >
      {items.map((item) => (
        <span
          key={item.key}
          title={item.tooltip}
          aria-label={item.tooltip}
          className="inline-block"
        >
          <Dot tone={item.tone} />
        </span>
      ))}
    </div>
  );
}

// ─── Detail block (Marketplace pack detail modal, PrepMode header) ──────────
function DetailBlock({
  printables,
  materials,
  state,
  className,
}: {
  printables?: Printables;
  materials?: Materials;
  state?: PackIndicatorsState;
  className?: string;
}) {
  const items = buildDetailItems(printables, materials, state);
  return (
    <div
      className={[
        'flex flex-col gap-md border-y border-border-subtle py-md',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {items.map((item) => (
        <div key={item.key} className="flex items-start gap-sm">
          <span className="mt-[6px] shrink-0">
            <Dot size={8} tone={item.tone} />
          </span>
          <div className="min-w-0">
            <p
              className="font-sans text-[12px] font-medium transition-colors duration-[var(--motion-quick)]"
              style={{
                color:
                  item.tone === 'success'
                    ? 'var(--color-sage)'
                    : 'var(--color-text-secondary)',
              }}
            >
              <span aria-hidden="true" className="mr-xs">
                {item.glyph}
              </span>
              {item.label}
            </p>
            {item.description && (
              <p className="font-sans text-[11px] text-text-muted leading-[1.4] mt-[2px]">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Dot primitive ──────────────────────────────────────────────────────────
function Dot({
  size = 6,
  tone = 'muted',
}: {
  size?: 6 | 8;
  tone?: 'muted' | 'success';
}) {
  const bg = tone === 'success' ? 'var(--color-sage)' : 'var(--color-ember-muted)';
  return (
    <span
      aria-hidden="true"
      className="inline-block rounded-full shrink-0 transition-colors duration-[var(--motion-quick)]"
      style={{ width: size, height: size, background: bg }}
    />
  );
}

// ─── Label builders ─────────────────────────────────────────────────────────

interface CardItem {
  key: string;
  glyph: string;
  cardLabel: string;
}

function buildCardItems(printables?: Printables, materials?: Materials): CardItem[] {
  const items: CardItem[] = [];
  if (printables?.available) {
    items.push({ key: 'printables', glyph: GLYPH.printables, cardLabel: 'Printables' });
  }
  if (materials?.mode === 'ships-with') {
    items.push({ key: 'kit', glyph: GLYPH.kit, cardLabel: 'Ships with kit' });
  } else if (materials?.mode === 'required') {
    items.push({ key: 'materials', glyph: GLYPH.materials, cardLabel: 'Needs materials' });
  }
  return items;
}

interface CompactItem {
  key: string;
  tone: 'muted' | 'success';
  tooltip: string;
}

function buildCompactItems(
  printables?: Printables,
  materials?: Materials,
  state?: PackIndicatorsState,
): CompactItem[] {
  const items: CompactItem[] = [];
  if (printables?.available) {
    items.push({
      key: 'printables',
      tone: state?.printablesDownloaded ? 'success' : 'muted',
      tooltip: state?.printablesDownloaded ? 'Printables downloaded' : 'Includes printables',
    });
  }
  if (materials?.mode === 'ships-with') {
    items.push({
      key: 'kit',
      tone: state?.kitOwned ? 'success' : 'muted',
      tooltip: state?.kitOwned ? 'Kit ready' : kitTooltip(materials),
    });
  } else if (materials?.mode === 'required') {
    items.push({ key: 'materials', tone: 'muted', tooltip: 'Needs materials' });
  }
  return items;
}

interface DetailItem {
  key: string;
  glyph: string;
  label: string;
  description?: string;
  tone: 'muted' | 'success';
}

function buildDetailItems(
  printables?: Printables,
  materials?: Materials,
  state?: PackIndicatorsState,
): DetailItem[] {
  const items: DetailItem[] = [];

  if (printables?.available) {
    if (state?.printablesDownloaded) {
      items.push({
        key: 'printables',
        glyph: GLYPH.printables,
        label: 'Printables downloaded',
        tone: 'success',
      });
    } else {
      const count = printables.count ?? 0;
      const label =
        count > 0
          ? `${count} printable ${count === 1 ? 'worksheet' : 'worksheets'}`
          : 'Includes printables';
      items.push({ key: 'printables', glyph: GLYPH.printables, label, tone: 'muted' });
    }
  }

  if (materials?.mode === 'ships-with') {
    if (state?.kitOwned) {
      items.push({
        key: 'kit',
        glyph: GLYPH.kit,
        label: 'Kit ready',
        description: kitContentsSummary(materials),
        tone: 'success',
      });
    } else {
      const price = materials.kitPriceAUD ?? materials.kitRef?.priceAUD;
      const label = price != null ? `Ships with kit — $${price}` : 'Ships with starter kit';
      items.push({
        key: 'kit',
        glyph: GLYPH.kit,
        label,
        description: kitContentsSummary(materials),
        tone: 'muted',
      });
    }
  } else if (materials?.mode === 'required') {
    items.push({
      key: 'materials',
      glyph: GLYPH.materials,
      label: 'Needs materials',
      description: materials.description?.trim() || undefined,
      tone: 'muted',
    });
  }

  return items;
}

function kitTooltip(materials: Materials): string {
  const price = materials.kitPriceAUD ?? materials.kitRef?.priceAUD;
  return price != null ? `Ships with kit — $${price}` : 'Ships with kit';
}

function kitContentsSummary(materials: Materials): string | undefined {
  const contents = materials.kitRef?.contents;
  if (contents && contents.length > 0) return contents.join(', ');
  return undefined;
}
