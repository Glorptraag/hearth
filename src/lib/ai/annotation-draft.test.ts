import { describe, it, expect } from 'vitest';
import { annotationSystem } from './annotation-draft';

describe('annotationSystem (jurisdiction-aware prompt)', () => {
  it('threads the family regulator into the system prompt', () => {
    const qld = annotationSystem('Home Education Unit (HEU)');
    expect(qld).toContain('Home Education Unit (HEU) work-sample annotation');

    const nsw = annotationSystem('Department of Education (DoE)');
    expect(nsw).toContain('Department of Education (DoE) work-sample annotation');
    expect(nsw).not.toContain('Home Education Unit');
  });

  it('keeps the output-contract rules regardless of jurisdiction', () => {
    const prompt = annotationSystem('Victorian Registration and Qualifications Authority (VRQA)');
    expect(prompt).toContain('Output ONLY valid JSON');
    expect(prompt).toContain('"observations"');
    expect(prompt).toContain('"planning"');
  });
});
