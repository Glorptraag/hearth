import type { ShelfResource } from './types';

export interface ShelfMatch {
  resourceId: string;
  level?: string;
  lesson?: number;
  confidence: 'alias' | 'pattern';
}

const MAX_TEXT_LENGTH = 20_000;
const MIN_ALIAS_LENGTH = 2;

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function containsPhrase(haystack: string, phrase: string): boolean {
  return phrase.length >= MIN_ALIAS_LENGTH && ` ${haystack} `.includes(` ${phrase} `);
}

function longestHit(haystack: string, candidates: string[]): number {
  let best = 0;
  for (const candidate of candidates) {
    const phrase = normalize(candidate);
    if (phrase.length > best && containsPhrase(haystack, phrase)) best = phrase.length;
  }
  return best;
}

function detectLevel(haystack: string, resource: ShelfResource): string | undefined {
  let bestName: string | undefined;
  let bestLength = 0;
  for (const level of resource.levels ?? []) {
    const hit = longestHit(haystack, [level.name, ...(level.aliases ?? [])]);
    if (hit > bestLength) {
      bestLength = hit;
      bestName = level.name;
    }
  }
  return bestName;
}

function detectLesson(rawText: string, resource: ShelfResource): number | undefined {
  if (!resource.lessonNumberRegex) return undefined;
  let pattern: RegExp;
  try {
    pattern = new RegExp(resource.lessonNumberRegex, 'i');
  } catch {
    return undefined;
  }
  const captured = pattern.exec(rawText)?.[1];
  if (!captured) return undefined;
  const lesson = Number.parseInt(captured, 10);
  return Number.isFinite(lesson) ? lesson : undefined;
}

function isMatchable(resource: ShelfResource): boolean {
  return resource.status === 'published' && resource.kind !== 'universal' && !resource.isUniversal;
}

function buildMatch(
  resource: ShelfResource,
  rawText: string,
  haystack: string,
  confidence: ShelfMatch['confidence'],
): ShelfMatch {
  const match: ShelfMatch = { resourceId: resource._id, confidence };
  const level = detectLevel(haystack, resource);
  const lesson = detectLesson(rawText, resource);
  if (level !== undefined) match.level = level;
  if (lesson !== undefined) match.lesson = lesson;
  return match;
}

export function matchShelf(printedText: string, resources: ShelfResource[]): ShelfMatch | null {
  const rawText = (printedText ?? '').slice(0, MAX_TEXT_LENGTH);
  const haystack = normalize(rawText);
  if (!haystack) return null;

  const candidates = resources.filter(isMatchable);

  let aliasWinner: ShelfResource | null = null;
  let aliasScore = 0;
  let aliasTied = false;
  for (const resource of candidates) {
    const score = longestHit(haystack, [resource.title, ...(resource.aliases ?? [])]);
    if (score === 0) continue;
    if (score > aliasScore) {
      aliasWinner = resource;
      aliasScore = score;
      aliasTied = false;
    } else if (score === aliasScore) {
      aliasTied = true;
    }
  }

  if (aliasTied) return null;
  if (aliasWinner) return buildMatch(aliasWinner, rawText, haystack, 'alias');

  const patternHits = candidates.filter(
    (resource) => detectLevel(haystack, resource) !== undefined && detectLesson(rawText, resource) !== undefined,
  );
  if (patternHits.length === 1) {
    return buildMatch(patternHits[0], rawText, haystack, 'pattern');
  }
  return null;
}
