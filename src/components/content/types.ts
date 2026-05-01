// Shared types for content access UX primitives

export type AssetKind = 'template' | 'worksheet' | 'reference' | 'card_set' | 'handout' | 'audio' | 'manipulative';
export type CommonsTextKind = 'fable' | 'fairy_tale' | 'folk_tale' | 'scripture' | 'parable' | 'psalm' | 'proverb' | 'poem' | 'nursery_rhyme' | 'myth' | 'primary_source' | 'story';
export type ItemRole = 'core' | 'optional' | 'extension';
export type PresentationMode = 'read_aloud' | 'child_reads' | 'reference_only' | 'memorisation';
export type CommonsLength = 'micro' | 'short' | 'medium' | 'long';

// Dereferenced asset from Sanity query (client-side — fileUrl excluded for security)
export interface ContentAsset {
  _id: string;
  title: string;
  slug?: { current: string };
  kind: AssetKind;
  pageCount?: number;
  description?: string;
  printGuidance?: string;
  ageBand?: string;
  status: string;
  thumbnailUrl?: string;
}

// Dereferenced commons text from Sanity query
export interface CommonsTextItem {
  _id: string;
  title: string;
  slug?: { current: string };
  kind: CommonsTextKind;
  tradition?: string;
  body?: unknown[]; // portableText
  shortBody?: unknown[];
  readAloudVersion?: unknown[];
  estimatedReadAloudMinutes?: number;
  length?: CommonsLength;
  source?: string;
  status: string;
}

// Activity-level asset reference (with role context)
export interface ActivityAssetRef {
  _key: string;
  role: ItemRole;
  notes?: string;
  asset: ContentAsset;
}

// Activity-level commons text reference (with role + presentation context)
export interface ActivityCommonsTextRef {
  _key: string;
  role: ItemRole;
  presentationMode?: PresentationMode;
  notes?: string;
  text: CommonsTextItem;
}

// Unified material item for PrintSheet and MaterialItemRow
export interface PrintableItem {
  id: string;
  kind: 'asset' | 'commonsText';
  assetKind?: AssetKind;
  commonsKind?: CommonsTextKind;
  title: string;
  thumbnailUrl?: string | null;
  pageCount: number;
  description?: string;
  role: ItemRole;
  isPrintable: boolean;
  module?: { id: string; title: string };
  activity?: { id: string; title: string };
}

// Print Sheet selection state
export interface PrintSelection {
  itemIds: string[];
  copies: number;
  combine: boolean;
}

// Print bundle API request
export interface PrintBundleRequest {
  items: Array<{ id: string; kind: 'asset' | 'commonsText' }>;
  copies: number;
  combine: boolean;
  grouping?: 'module' | 'day' | 'kind' | 'none';
  coverTitle?: string;
}

// Print bundle API response
export interface PrintBundleResponse {
  status: 'ready' | 'error';
  url?: string;
  filename?: string;
  pageCount?: number;
  error?: string;
  warnings?: Array<{ itemId: string; reason: string }>;
}

/**
 * Call the bundle API and convert the streamed PDF response into a PrintBundleResponse.
 * The API returns a binary PDF (not JSON), so we create a local blob URL.
 */
export async function fetchPrintBundle(
  items: Array<{ id: string; kind: 'asset' | 'commonsText' }>,
  options: { copies: number; combine: boolean; coverTitle?: string },
): Promise<PrintBundleResponse> {
  const res = await fetch('/api/print/bundle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, ...options }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return {
      status: 'error',
      error: err?.message ?? err?.error ?? 'Failed to generate bundle',
      warnings: err?.warnings,
    };
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const disposition = res.headers.get('Content-Disposition');
  const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] ?? 'hearth-materials.pdf';
  const pageCount = parseInt(res.headers.get('X-Bundle-Page-Count') ?? '0', 10);
  const warningsHeader = res.headers.get('X-Bundle-Warnings');
  const warnings = warningsHeader ? JSON.parse(warningsHeader) : undefined;

  return { status: 'ready', url, filename, pageCount, warnings };
}

// Emoji indicators by asset kind — kept for backward compatibility with any
// remaining demo/print-export consumers. New UI code should use ASSET_KIND_ICON.
export const ASSET_KIND_EMOJI: Record<AssetKind, string> = {
  template: '📄',
  worksheet: '📄',
  reference: '🖼',
  card_set: '🃏',
  handout: '📋',
  audio: '🔊',
  manipulative: '✂️',
};

export const COMMONS_KIND_EMOJI = '📖';

import type { ComponentType } from 'react';
import {
  FilePdf,
  Image as ImageIcon,
  Cards,
  ClipboardText,
  SpeakerHigh,
  Scissors,
  BookOpen,
} from '@/components/icons';

type IconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

/** Phosphor icon by asset kind. Preferred over ASSET_KIND_EMOJI for UI. */
export const ASSET_KIND_ICON: Record<AssetKind, IconC> = {
  template:     FilePdf,
  worksheet:    FilePdf,
  reference:    ImageIcon,
  card_set:     Cards,
  handout:      ClipboardText,
  audio:        SpeakerHigh,
  manipulative: Scissors,
};

export const COMMONS_KIND_ICON: IconC = BookOpen;

export function getItemEmoji(item: PrintableItem): string {
  if (item.kind === 'commonsText') return COMMONS_KIND_EMOJI;
  return ASSET_KIND_EMOJI[item.assetKind ?? 'template'];
}

/** Pick the right Phosphor icon component for a printable item. */
export function getItemIcon(item: PrintableItem): IconC {
  if (item.kind === 'commonsText') return COMMONS_KIND_ICON;
  return ASSET_KIND_ICON[item.assetKind ?? 'template'];
}

export function isPrintableAssetKind(kind: AssetKind): boolean {
  return kind !== 'audio';
}
