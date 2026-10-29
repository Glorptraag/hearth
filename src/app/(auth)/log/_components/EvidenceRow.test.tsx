/**
 * EvidenceRow — photo first (W3.1). The camera is the primary action, their
 * words and a link are secondary, and photo capture needs a connection.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EvidenceRow } from './EvidenceRow';
import { noticeCopy } from './noticeCopy';
import type { DraftEvidenceItem } from '@/lib/logger/draft';

afterEach(cleanup);

function renderRow(overrides: Partial<React.ComponentProps<typeof EvidenceRow>> = {}) {
  const props = {
    evidence: [] as DraftEvidenceItem[],
    online: true,
    onAddPhoto: vi.fn(),
    onAdd: vi.fn<(kind: 'quote' | 'link') => void>(),
    onRemove: vi.fn<(index: number) => void>(),
    ...overrides,
  };
  render(<EvidenceRow {...props} />);
  return props;
}

describe('EvidenceRow', () => {
  it('leads with the photo action, described as enough on its own', () => {
    const props = renderRow();
    const buttons = within(screen.getByRole('region', { name: noticeCopy.add })).getAllByRole('button');
    expect(buttons[0]).toHaveAccessibleName(noticeCopy.addPhoto);
    expect(buttons[0]).toHaveAccessibleDescription(noticeCopy.addPhotoHint);
    fireEvent.click(buttons[0]);
    expect(props.onAddPhoto).toHaveBeenCalledTimes(1);
  });

  it('keeps their words and a link as secondary tools', () => {
    const props = renderRow();
    fireEvent.click(screen.getByRole('button', { name: noticeCopy.addWords }));
    fireEvent.click(screen.getByRole('button', { name: noticeCopy.addLink }));
    expect(vi.mocked(props.onAdd).mock.calls).toEqual([['quote'], ['link']]);
    expect(props.onAddPhoto).not.toHaveBeenCalled();
  });

  it('disables the photo action offline and says why; words and links still work', () => {
    renderRow({ online: false });
    const photo = screen.getByRole('button', { name: noticeCopy.addPhoto });
    expect(photo).toBeDisabled();
    expect(photo).toHaveAccessibleDescription(noticeCopy.photosNeedConnection);
    expect(screen.getByRole('button', { name: noticeCopy.addWords })).toBeEnabled();
  });

  it('shows progress and blocks a second photo while one is uploading', () => {
    const props = renderRow({ photoBusy: true });
    const photo = screen.getByRole('button', { name: noticeCopy.addingPhoto });
    expect(photo).toBeDisabled();
    expect(photo).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(photo);
    expect(props.onAddPhoto).not.toHaveBeenCalled();
  });

  it('lists what has been added, with a remove control per item', () => {
    const props = renderRow({
      evidence: [
        { type: 'photo', content: 'evidence/f/p.jpg', caption: '' },
        { type: 'quote', content: 'Look, it floats!' },
      ],
    });
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(noticeCopy.photoLabel);
    expect(items[1]).toHaveTextContent('Look, it floats!');
    fireEvent.click(screen.getByRole('button', { name: noticeCopy.remove(noticeCopy.photoLabel.toLowerCase()) }));
    expect(props.onRemove).toHaveBeenCalledWith(0);
  });
});
