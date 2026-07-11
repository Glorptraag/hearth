import { describe, it, expect } from 'vitest';
import { parseFrontmatter, serialiseFrontmatter } from './frontmatter';

describe('parseFrontmatter', () => {
  it('parses scalars, booleans, and inline arrays', () => {
    const { values, body } = parseFrontmatter(
      ['---', 'id: cm.001', 'isParaphrase: false', 'tags: [a, b, "c, d"]', 'status: published', '---', '', '## Text', '', 'Hello'].join(
        '\n'
      )
    );
    expect(values.id).toBe('cm.001');
    expect(values.isParaphrase).toBe(false);
    expect(values.tags).toEqual(['a', 'b', 'c, d']);
    expect(body).toBe('## Text\n\nHello');
  });

  it('parses quoted strings with escaped quotes', () => {
    const { values } = parseFrontmatter(
      ['---', 'pageOrChapter: "Part II, \\"Sight-Seeing\\", p. 47"', 'id: x', '---', ''].join('\n')
    );
    expect(values.pageOrChapter).toBe('Part II, "Sight-Seeing", p. 47');
  });

  it('parses block lists', () => {
    const { values } = parseFrontmatter(['---', 'tags:', '  - one', '  - "two: quoted"', '---', ''].join('\n'));
    expect(values.tags).toEqual(['one', 'two: quoted']);
  });

  it('rejects duplicate keys', () => {
    expect(() => parseFrontmatter(['---', 'id: a', 'id: b', '---', ''].join('\n'))).toThrow(/duplicate key/);
  });

  it('rejects a missing closing delimiter', () => {
    expect(() => parseFrontmatter(['---', 'id: a'].join('\n'))).toThrow(/closing/);
  });

  it('rejects files that do not start with frontmatter', () => {
    expect(() => parseFrontmatter('# Just markdown')).toThrow(/must start/);
  });

  it('rejects bare strings containing quotes', () => {
    expect(() => parseFrontmatter(['---', 'title: has "quotes" inside', '---', ''].join('\n'))).toThrow(
      /quote the whole value/
    );
  });

  it('round-trips through serialiseFrontmatter', () => {
    const values = {
      id: 'cm.019',
      pageOrChapter: 'Part IV, VI. The Habit of Perfect Execution — "notes", p. 159',
      isParaphrase: true,
      tags: ['perfect_execution', 'habit, of excellence', 'short_lessons'],
    };
    const { values: reparsed } = parseFrontmatter(serialiseFrontmatter(values) + '\n');
    expect(reparsed).toEqual(values);
  });
});
