// Strict frontmatter parser for corpus vault entries.
//
// Deliberately not YAML: the grammar below is the complete set of shapes a
// vault entry may use, and anything outside it is a hard error. A compile
// gate should fail loudly on drift, not guess. No dependency needed.
//
// Supported value forms:
//   key: bare string
//   key: "quoted string"          (required when the value contains ':' or '#')
//   key: true | false
//   key: [a, b, "c d"]            (inline string array)
//   key:                          (block string array)
//     - item one
//     - "item: two"

import type { FrontmatterValue } from './types';

export interface FrontmatterResult {
  values: Record<string, FrontmatterValue>;
  /** The body after the closing delimiter, with leading blank lines trimmed. */
  body: string;
}

export function parseFrontmatter(raw: string): FrontmatterResult {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    throw new Error('file must start with a `---` frontmatter delimiter');
  }

  const values: Record<string, FrontmatterValue> = {};
  let i = 1;
  let pendingListKey: string | null = null;

  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') break;

    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const listItem = line.match(/^\s+- (.*)$/);
    if (listItem) {
      if (!pendingListKey) {
        throw new Error(`line ${i + 1}: list item without a preceding \`key:\` line`);
      }
      (values[pendingListKey] as string[]).push(parseScalarString(listItem[1].trim(), i + 1));
      continue;
    }

    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):(.*)$/);
    if (!kv) {
      throw new Error(`line ${i + 1}: expected \`key: value\`, got: ${line.trim()}`);
    }
    const key = kv[1];
    const rawValue = kv[2].trim();
    if (key in values) {
      throw new Error(`line ${i + 1}: duplicate key "${key}"`);
    }

    if (rawValue === '') {
      values[key] = [];
      pendingListKey = key;
      continue;
    }
    pendingListKey = null;
    values[key] = parseValue(rawValue, i + 1);
  }

  if (i >= lines.length) {
    throw new Error('frontmatter is missing its closing `---` delimiter');
  }

  let bodyStart = i + 1;
  while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  const body = lines.slice(bodyStart).join('\n');

  return { values, body };
}

function parseValue(raw: string, lineNo: number): FrontmatterValue {
  if (raw === 'true') return true;
  if (raw === 'false') return false;

  if (raw.startsWith('[')) {
    if (!raw.endsWith(']')) {
      throw new Error(`line ${lineNo}: inline array is not closed`);
    }
    const inner = raw.slice(1, -1).trim();
    if (inner === '') return [];
    return splitInlineArray(inner).map((item) => parseScalarString(item.trim(), lineNo));
  }

  return parseScalarString(raw, lineNo);
}

/** Split on commas that are not inside double quotes. */
function splitInlineArray(inner: string): string[] {
  const items: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of inner) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === ',' && !inQuotes) {
      items.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (inQuotes) throw new Error('unterminated quote in inline array');
  items.push(current);
  return items;
}

function parseScalarString(raw: string, lineNo: number): string {
  if (raw.startsWith('"')) {
    if (raw.length < 2 || !raw.endsWith('"')) {
      throw new Error(`line ${lineNo}: unterminated quoted string`);
    }
    return raw.slice(1, -1).replace(/\\"/g, '"');
  }
  if (raw.includes('"')) {
    throw new Error(`line ${lineNo}: bare strings may not contain quotes — quote the whole value`);
  }
  return raw;
}

/** Serialise values back to the vault frontmatter grammar (used by seeders). */
export function serialiseFrontmatter(values: Record<string, FrontmatterValue>): string {
  const lines: string[] = ['---'];
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      const inline = `[${value.map(quoteIfNeeded).join(', ')}]`;
      if (inline.length <= 100) {
        lines.push(`${key}: ${inline}`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) lines.push(`  - ${quoteIfNeeded(item)}`);
      }
    } else {
      lines.push(`${key}: ${quoteIfNeeded(value)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function quoteIfNeeded(value: string): string {
  if (/[":#,[\]]/.test(value) || value !== value.trim() || value === '') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}
