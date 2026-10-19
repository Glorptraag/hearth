/**
 * SourceBanner — "working from" context per NoticeSource kind.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SourceBanner } from './SourceBanner';
import { noticeCopy } from './noticeCopy';
import type { ScaffoldData } from '@/hooks/use-scaffold-fetch';

const scaffold: ScaffoldData = {
  session: {
    id: 's1',
    title: 'Bush walk',
    description: null,
    date: '2026-10-03',
    location: null,
    sharedRecord: null,
    hearthId: 'h1',
    hearthName: 'Riverside Hearth',
  },
  evidence: [],
  observations: [],
  attendingLearnerIds: [],
};

afterEach(cleanup);

describe('SourceBanner', () => {
  it('renders nothing for a plain logger visit', () => {
    const { container } = render(
      <SourceBanner source={{ kind: 'logger' }} scaffold={null} learnerName={null} threadName={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('names the Hearth and the session once the scaffold has loaded', () => {
    render(
      <SourceBanner
        source={{ kind: 'hearth_session', sessionId: 's1', hearthId: 'h1' }}
        scaffold={scaffold}
        learnerName={null}
        threadName={null}
      />,
    );
    expect(screen.getByText(noticeCopy.source.hearthTitle('Riverside Hearth'))).toBeInTheDocument();
    expect(screen.getByText(noticeCopy.source.hearthDetail('Bush walk', 'Sat 3 Oct'))).toBeInTheDocument();
  });

  it('shows a generic Hearth title with no detail while the scaffold is still loading', () => {
    render(
      <SourceBanner
        source={{ kind: 'hearth_session', sessionId: 's1', hearthId: null }}
        scaffold={null}
        learnerName={null}
        threadName={null}
      />,
    );
    expect(screen.getByText(noticeCopy.source.hearthTitle('your Hearth'))).toBeInTheDocument();
    expect(screen.queryByText(/pre-filled/)).not.toBeInTheDocument();
  });

  it('shows the project stage, or just Project when the stage is unknown', () => {
    const { rerender } = render(
      <SourceBanner
        source={{ kind: 'project_stage', projectId: 'p1', stageNumber: 2 }}
        scaffold={null}
        learnerName={null}
        threadName={null}
      />,
    );
    expect(screen.getByText(noticeCopy.source.projectTitle)).toBeInTheDocument();
    expect(screen.getByText('Stage 2')).toBeInTheDocument();
    rerender(
      <SourceBanner
        source={{ kind: 'project_stage', projectId: 'p1', stageNumber: null }}
        scaffold={null}
        learnerName={null}
        threadName={null}
      />,
    );
    expect(screen.getByText('Project')).toBeInTheDocument();
  });

  it('phrases a check-in with and without a thread name', () => {
    const { rerender } = render(
      <SourceBanner
        source={{ kind: 'check_in', learnerId: 'l1', threadId: 'M1' }}
        scaffold={null}
        learnerName="Emma"
        threadName="Number sense"
      />,
    );
    expect(screen.getByText('Checking in on Emma’s Number sense')).toBeInTheDocument();
    expect(screen.getByText(noticeCopy.source.checkInDetail)).toBeInTheDocument();

    rerender(
      <SourceBanner
        source={{ kind: 'check_in', learnerId: 'l1', threadId: null }}
        scaffold={null}
        learnerName="Emma"
        threadName={null}
      />,
    );
    expect(screen.getByText('Checking in on Emma')).toBeInTheDocument();

    rerender(
      <SourceBanner
        source={{ kind: 'check_in', learnerId: null, threadId: null }}
        scaffold={null}
        learnerName={null}
        threadName={null}
      />,
    );
    expect(screen.getByText('Checking in')).toBeInTheDocument();
  });
});
