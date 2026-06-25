/**
 * WhatSection — Quick-view `minimal` mode (D-LPS-13).
 *
 * Quick Log renders only the description + voice; the per-child discoveries,
 * the activity-type grid, and the lesson-subject picker are Full-view only.
 * Guards that `minimal` hides the extra fields and keeps the core capture.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { WhatSection } from './WhatSection';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';

vi.mock('./SectionHeader', () => ({
  SectionHeader: ({ label }: { label: string }) => <h2>{label}</h2>,
}));

const learner = (id: string, name: string): LearnerRecord => ({
  id,
  name,
  dateOfBirth: null,
  shapeIcon: '●',
  colourToken: 'rose',
});

const renderWhat = (minimal: boolean) =>
  render(
    <WhatSection
      label="What happened?"
      placeholder="What happened?"
      done={false}
      minimal={minimal}
      description=""
      onDescriptionChange={vi.fn()}
      isRecording={false}
      isTranscribing={false}
      audioLevel={0}
      voiceSupported
      onStartVoice={vi.fn()}
      onStopVoice={vi.fn()}
      learners={[learner('l1', 'Emma')]}
      selectedLearners={['l1']}
      discoveries={{}}
      onDiscoveryChange={vi.fn()}
      engagement={{}}
      activityType={null}
      onActivityTypeChange={vi.fn()}
      lessonSubjects={[]}
      onToggleLessonSubject={vi.fn()}
    />,
  );

afterEach(cleanup);

describe('WhatSection minimal (Quick view)', () => {
  it('keeps the description field and voice button in minimal mode', () => {
    renderWhat(true);
    expect(screen.getByPlaceholderText('What happened?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /voice/i })).toBeInTheDocument();
  });

  it('hides discoveries, the activity-type grid, and subjects in minimal mode', () => {
    renderWhat(true);
    expect(screen.queryByText('Activity type')).not.toBeInTheDocument();
    expect(screen.queryByText(/individual discoveries/i)).not.toBeInTheDocument();
  });

  it('shows the activity-type grid and discoveries in full mode', () => {
    renderWhat(false);
    expect(screen.getByText('Activity type')).toBeInTheDocument();
    expect(screen.getByText(/individual discoveries/i)).toBeInTheDocument();
  });
});
