import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import AnnotatedSamples from './AnnotatedSamples';
import { BAND_SENTENCE, type AnnotatedSampleGroup } from '@/lib/report/annotated-samples';

function sample(id: string, overrides: Partial<AnnotatedSampleGroup['samples'][number]> = {}) {
  return {
    entryId: id,
    title: 'Nature journal',
    dateOccurred: '2026-03-10',
    parentWords: 'Sam drew the leaves and labelled each one.',
    noticed: null,
    photos: [{ ref: 'evidence/fam/a.jpg', caption: null }],
    dlos: [
      {
        dloId: 'dlo.S5.developing',
        threadId: 'S5',
        threadName: 'Scientific Observation',
        tier: 'developing' as const,
        line: 'Records what they notice, in words or pictures',
        bandSentence: BAND_SENTENCE.developing('Sam'),
      },
    ],
    requiredSlot: null,
    ...overrides,
  };
}

const GROUPS: AnnotatedSampleGroup[] = [
  { area: 'english', label: 'English', samples: [sample('e1', { title: 'Letter to Nan' })] },
  {
    area: 'science',
    label: 'Science',
    samples: [sample('e2', { requiredSlot: 'early_choice', noticed: 'He counted the veins.' })],
  },
];

describe('AnnotatedSamples', () => {
  it('renders nothing while loading', () => {
    const { container } = render(<AnnotatedSamples groups={null} learnerName="Sam" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the authored empty copy when there are no samples', () => {
    render(<AnnotatedSamples groups={[]} learnerName="Sam" />);
    expect(screen.getByRole('heading', { name: 'Annotated work samples' })).toBeInTheDocument();
    expect(screen.getByText(/confirm what Sam showed, it appears here/)).toBeInTheDocument();
  });

  it('groups samples per learning area with the parent words, objective, band and sentence', () => {
    render(<AnnotatedSamples groups={GROUPS} learnerName="Sam" domainPill={{ science: 'bg-domain-science/15' }} />);
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['English1 sample', 'Science1 sample']);

    const items = screen.getAllByRole('listitem').filter((li) => li.querySelector('img'));
    const science = within(items[1]);
    expect(science.getByText('Sam drew the leaves and labelled each one.')).toBeInTheDocument();
    expect(science.getByText('He counted the veins.')).toBeInTheDocument();
    expect(science.getByText('Records what they notice, in words or pictures')).toBeInTheDocument();
    expect(science.getByText('Developing')).toBeInTheDocument();
    expect(science.getByText(BAND_SENTENCE.developing('Sam'))).toBeInTheDocument();
    expect(science.getByText('Also your Early Science/HASS sample')).toBeInTheDocument();
  });

  it('serves photos through the authenticated evidence proxy', () => {
    render(<AnnotatedSamples groups={GROUPS} learnerName="Sam" />);
    const img = screen.getAllByRole('img')[0] as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(`/api/evidence?ref=${encodeURIComponent('evidence/fam/a.jpg')}`);
    expect(img).toHaveAttribute('alt', 'Photo from Letter to Nan');
  });

  it('marks a photo-only sample instead of inventing words', () => {
    render(
      <AnnotatedSamples
        groups={[{ area: 'other', label: 'Across learning areas', samples: [sample('e3', { parentWords: null })] }]}
        learnerName="Sam"
      />,
    );
    expect(screen.getByText('Saved with a photo only.')).toBeInTheDocument();
  });
});
