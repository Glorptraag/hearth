/**
 * NoticeForm — composition of the Notice rows, banners and Save bar.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { NoticeForm, type NoticeFormProps } from './NoticeForm';
import { noticeCopy } from './noticeCopy';
import { EMPTY_NOTICE } from '@/lib/logger/notice';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';

const learner = (id: string, name: string): LearnerRecord => ({
  id,
  name,
  dateOfBirth: null,
  shapeIcon: '●',
  colourToken: 'rose',
});

const learners = [learner('l1', 'Emma'), learner('l2', 'Noah'), learner('l3', 'Ava')];

const baseProps = (): NoticeFormProps => ({
  fields: EMPTY_NOTICE,
  learners,
  learnersFailed: false,
  onReloadLearners: vi.fn(),
  source: { kind: 'logger' },
  scaffold: null,
  online: true,
  draft: {
    restored: false,
    dateReset: false,
    lastSavedAt: null,
    onDismiss: vi.fn(),
    onStartFresh: vi.fn(),
  },
  voice: {
    isRecording: false,
    isTranscribing: false,
    audioLevel: 0,
    supported: true,
    onStart: vi.fn(),
    onStop: vi.fn(),
  },
  whatPlaceholder: noticeCopy.whatPlaceholderFallback,
  sourceLearnerName: null,
  sourceThreadName: null,
  onToggleLearner: vi.fn(),
  onTextChange: vi.fn(),
  onFelt: vi.fn(),
  onNoticed: vi.fn(),
  onDate: vi.fn(),
  onAddEvidence: vi.fn(),
  onRemoveEvidence: vi.fn(),
  save: { block: 'no-learner', saving: false, onSave: vi.fn() },
});

const renderForm = (overrides: Partial<NoticeFormProps> = {}) =>
  render(<NoticeForm {...baseProps()} {...overrides} />);

afterEach(cleanup);

describe('NoticeForm', () => {
  it('renders the title, rows and the catch-up links', () => {
    renderForm();
    expect(screen.getByRole('heading', { level: 1, name: noticeCopy.title })).toBeInTheDocument();
    expect(screen.getByLabelText(noticeCopy.what)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: noticeCopy.batchLog })).toHaveAttribute('href', '/log/batch');
    expect(screen.getByRole('link', { name: noticeCopy.importCsv })).toHaveAttribute('href', '/log/import');
  });

  it('shows the offline banner only when offline', () => {
    renderForm();
    expect(screen.queryByText(noticeCopy.offlineBanner)).not.toBeInTheDocument();
    cleanup();
    renderForm({ online: false });
    expect(screen.getByRole('status')).toHaveTextContent(noticeCopy.offlineBanner);
    expect(screen.getByRole('button', { name: noticeCopy.addPhoto })).toBeDisabled();
  });

  it('shows the restored-draft banner with the date-reset suffix and both actions', () => {
    const draft = { ...baseProps().draft, restored: true, dateReset: true, lastSavedAt: Date.now() };
    renderForm({ draft });
    const banner = screen.getByText((_, el) => el?.textContent === noticeCopy.draftRestored + noticeCopy.draftDateReset);
    expect(banner).toBeInTheDocument();
    expect(screen.getByRole('button', { name: noticeCopy.dismiss })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: noticeCopy.startFresh })).toBeInTheDocument();
    expect(screen.getByText(/^Draft saved · /)).toBeInTheDocument();
  });

  it('omits the date-reset suffix when the date carried over', () => {
    const draft = { ...baseProps().draft, restored: true };
    renderForm({ draft });
    expect(screen.getByText(noticeCopy.draftRestored)).toBeInTheDocument();
    expect(screen.queryByText(/set the date to today/)).not.toBeInTheDocument();
  });

  it('renders one PerChildRow per selected learner, in selection order', () => {
    renderForm({ fields: { ...EMPTY_NOTICE, learnerIds: ['l3', 'l1'] } });
    const groups = screen.getAllByRole('radiogroup');
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveAccessibleName(noticeCopy.felt('Ava'));
    expect(groups[1]).toHaveAccessibleName(noticeCopy.felt('Emma'));
    expect(screen.queryByLabelText(noticeCopy.noticedLabel('Noah'))).not.toBeInTheDocument();
  });

  it('renders the save hint per block cause and none when ready', () => {
    renderForm({ save: { block: 'no-learner', saving: false, onSave: vi.fn() } });
    const save = screen.getByRole('button', { name: noticeCopy.save });
    expect(save).toBeDisabled();
    expect(save).toHaveAccessibleDescription(noticeCopy.blockedNoLearner);
    cleanup();

    renderForm({ save: { block: 'nothing-noticed', saving: false, onSave: vi.fn() } });
    expect(screen.getByRole('button', { name: noticeCopy.save })).toHaveAccessibleDescription(
      noticeCopy.blockedNothingNoticed,
    );
    cleanup();

    renderForm({ save: { block: null, saving: false, onSave: vi.fn() } });
    const ready = screen.getByRole('button', { name: noticeCopy.save });
    expect(ready).toBeEnabled();
    expect(ready).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText(noticeCopy.blockedNoLearner)).not.toBeInTheDocument();
    cleanup();

    renderForm({ save: { block: null, saving: true, onSave: vi.fn() } });
    expect(screen.getByRole('button', { name: noticeCopy.saving })).toBeDisabled();
  });

  it('never renders a literal arrow glyph', () => {
    const draft = { ...baseProps().draft, restored: true, dateReset: true, lastSavedAt: Date.now() };
    const { container } = renderForm({
      draft,
      online: false,
      source: { kind: 'check_in', learnerId: 'l1', threadId: 'M1' },
      sourceLearnerName: 'Emma',
      sourceThreadName: 'Number sense',
      fields: {
        ...EMPTY_NOTICE,
        learnerIds: ['l1', 'l2'],
        dateOccurred: '2020-01-01',
        evidence: [{ type: 'quote', content: 'Look!' }],
      },
    });
    expect(container.textContent).not.toContain('→');
  });
});
