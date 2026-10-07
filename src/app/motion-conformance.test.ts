/**
 * Motion conformance — pins the rules in docs/hearth-motion-system-v1.md and
 * CLAUDE.md § Design Rules › Transitions so they cannot silently regress.
 *
 * Each rule scans the UI source tree. Allow-lists are deliberate and tiny;
 * extend them only with a reason in the comment beside the entry.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue;
      walk(full, out);
    } else if (/\.(tsx|ts|css)$/.test(name) && !/\.test\.tsx?$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(ROOT).map((f) => ({ path: relative(ROOT, f), text: readFileSync(f, 'utf8') }));

function offenders(pattern: RegExp, allow: string[] = []): string[] {
  return files
    .filter((f) => !allow.includes(f.path))
    .filter((f) => pattern.test(f.text))
    .map((f) => f.path)
    .sort();
}

describe('motion conformance', () => {
  it('never uses transition-all (animate the scoped list, or [width] for a bar)', () => {
    expect(offenders(/\btransition-all\b/)).toEqual([]);
  });

  it('never ships a spinner', () => {
    expect(offenders(/\banimate-spin\b/)).toEqual([]);
  });

  it('loading states use the hearth skeleton / pulse, not Tailwind animate-pulse', () => {
    expect(offenders(/\banimate-pulse\b/)).toEqual([]);
  });

  it('durations come from tokens, never literal ms in utilities', () => {
    // duration-150 / duration-[250ms] etc. Token form is duration-[var(--motion-*)].
    expect(offenders(/\bduration-(?:\d+|\[\d+m?s\])/)).toEqual([]);
  });

  it('easings come from tokens, never inline cubic-bezier in components', () => {
    expect(
      offenders(/cubic-bezier\(/, [
        'app/globals.css', // token definitions
        'app/clerk-theme.ts', // Clerk cannot read CSS custom properties (see CLAUDE.md › Clerk theming)
        'app/(auth)/our-story/capabilities/_constellation/constellation.css', // var() fallback values only
      ]),
    ).toEqual([]);
  });

  it('the motion utilities file still defines every class the docs promise', () => {
    const css = files.find((f) => f.path === 'app/hearth-motion-utilities.css')!.text;
    for (const cls of [
      'hearth-fade-in', 'hearth-fade-out', 'hearth-lift-card', 'hearth-press', 'hearth-expand',
      'hearth-expand-chevron', 'hearth-backdrop-enter', 'hearth-modal-enter', 'hearth-modal-exit',
      'hearth-toast-enter', 'hearth-popover-enter', 'hearth-page-enter', 'hearth-panel-enter',
      'hearth-reveal', 'hearth-skeleton', 'hearth-pulse', 'hearth-thinking', 'hearth-engagement-select',
      'hearth-pop-in', 'hearth-checkbox', 'hearth-switch-knob', 'hearth-tab-indicator',
      'hearth-badge-arrive', 'hearth-badge-caption', 'hearth-glow-pulse', 'hearth-drawer-enter',
    ]) {
      expect(css, cls).toContain(`.${cls}`);
    }
  });

  it('entrance utilities never persist a transform (fill-mode backwards, not both/forwards)', () => {
    const css = files.find((f) => f.path === 'app/hearth-motion-utilities.css')!.text;
    for (const cls of ['hearth-modal-enter', 'hearth-page-enter', 'hearth-drawer-enter', 'hearth-reveal', 'hearth-popover-enter', 'hearth-toast-enter']) {
      const rule = css.match(new RegExp(`\\.${cls}\\s*\\{[^}]*\\}`))![0];
      expect(rule, cls).toMatch(/backwards/);
      expect(rule, cls).not.toMatch(/\b(both|forwards)\b/);
    }
  });
});
