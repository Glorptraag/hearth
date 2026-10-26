// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { jsPDF } from 'jspdf';
import { get } from '@vercel/blob';
import { renderAnnotatedSamples, loadSampleImages } from './annotated-samples';
import { BAND_SENTENCE, type AnnotatedSampleGroup } from '@/lib/report/annotated-samples';

const FAMILY = 'fam-1';
const PNG = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAEElEQVR4nGP438AARAwoFABkUAj7XH75jwAAAABJRU5ErkJggg==',
    'base64',
  ),
);

function group(overrides: Partial<AnnotatedSampleGroup['samples'][number]> = {}): AnnotatedSampleGroup {
  return {
    area: 'science',
    label: 'Science',
    samples: [
      {
        entryId: 'e1',
        title: 'Nature journal',
        dateOccurred: '2026-03-10',
        parentWords: 'Sam drew the leaves and labelled each one.',
        noticed: 'He counted the veins.',
        photos: [{ ref: `evidence/${FAMILY}/a.png`, caption: null }],
        dlos: [
          {
            dloId: 'dlo.S5.developing',
            threadId: 'S5',
            threadName: 'Scientific Observation',
            tier: 'developing',
            line: 'Records what they notice, in words or pictures',
            bandSentence: BAND_SENTENCE.developing('Sam'),
          },
        ],
        requiredSlot: 'early_choice',
        ...overrides,
      },
    ],
  };
}

/** Text drawn on the doc, via a spy on doc.text. */
function drawnText(doc: jsPDF): string {
  const spy = vi.mocked(doc.text);
  return spy.mock.calls.map((c) => (Array.isArray(c[0]) ? c[0].join(' ') : String(c[0]))).join('\n');
}

function spiedDoc(): jsPDF {
  const doc = new jsPDF();
  vi.spyOn(doc, 'text');
  vi.spyOn(doc, 'addImage');
  vi.spyOn(doc, 'addPage');
  return doc;
}

describe('renderAnnotatedSamples', () => {
  it('draws nothing (and adds no page) when there are no samples', () => {
    const doc = spiedDoc();
    const y = renderAnnotatedSamples(doc, { groups: [], images: new Map(), learnerName: 'Sam', startY: 42 });
    expect(y).toBe(42);
    expect(doc.addPage).not.toHaveBeenCalled();
    expect(doc.text).not.toHaveBeenCalled();
  });

  it('prints the area, the parent words, the DLO line, the band and the slot tag', () => {
    const doc = spiedDoc();
    renderAnnotatedSamples(doc, {
      groups: [group()],
      images: new Map([['e1', { data: PNG, format: 'PNG' as const }]]),
      learnerName: 'Sam',
      startY: 100,
    });
    const text = drawnText(doc);
    expect(text).toContain('Annotated Work Samples');
    expect(text).toContain('Science');
    expect(text).toContain('Sam drew the leaves and labelled each one.');
    expect(text).toContain('He counted the veins.');
    expect(text).toContain('Records what they notice, in words or pictures');
    expect(text).toContain('Developing · Scientific Observation');
    expect(text).toContain(BAND_SENTENCE.developing('Sam'));
    expect(text).toContain('Also your Early Science/HASS sample');
    expect(doc.addImage).toHaveBeenCalledTimes(1);
    expect((vi.mocked(doc.addImage).mock.calls[0] as unknown[])[1]).toBe('PNG');
  });

  it('says the photo is kept in Hearth when it could not be embedded', () => {
    const doc = spiedDoc();
    renderAnnotatedSamples(doc, { groups: [group()], images: new Map(), learnerName: 'Sam', startY: 100 });
    expect(doc.addImage).not.toHaveBeenCalled();
    expect(drawnText(doc)).toContain('Photo kept in Hearth');
  });

  it('marks a photo-only sample without inventing words', () => {
    const doc = spiedDoc();
    renderAnnotatedSamples(doc, {
      groups: [group({ parentWords: null, noticed: null })],
      images: new Map(),
      learnerName: 'Sam',
      startY: 100,
    });
    const text = drawnText(doc);
    expect(text).toContain('Saved with a photo only.');
    expect(text).not.toContain('You noticed');
  });

  it('paginates many samples and still produces a valid PDF', () => {
    const doc = new jsPDF();
    const many: AnnotatedSampleGroup = {
      ...group(),
      samples: Array.from({ length: 12 }, (_, i) => ({ ...group().samples[0], entryId: `e${i}` })),
    };
    const images = new Map(many.samples.map((s) => [s.entryId, { data: PNG, format: 'PNG' as const }]));
    renderAnnotatedSamples(doc, { groups: [many], images, learnerName: 'Sam', startY: 100 });
    expect(doc.getNumberOfPages()).toBeGreaterThan(2);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(0);
  });
});

describe('loadSampleImages', () => {
  it('loads the first photo per sample, keyed by entry, up to the cap', async () => {
    vi.mocked(get).mockImplementation(async () => ({
      statusCode: 200,
      stream: new ReadableStream({ start(c) { c.enqueue(PNG); c.close(); } }),
      blob: { contentType: 'image/png', size: PNG.byteLength },
    }) as never);
    const g = group();
    const two: AnnotatedSampleGroup = { ...g, samples: [g.samples[0], { ...g.samples[0], entryId: 'e2' }] };
    const images = await loadSampleImages([two], FAMILY, 1);
    expect([...images.keys()]).toEqual(['e1']);
    vi.mocked(get).mockReset();
  });

  it('skips a photo another family owns', async () => {
    const images = await loadSampleImages(
      [group({ photos: [{ ref: 'evidence/other/a.png', caption: null }] })],
      FAMILY,
    );
    expect(images.size).toBe(0);
  });
});
