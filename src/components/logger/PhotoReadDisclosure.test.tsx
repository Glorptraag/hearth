/**
 * The first-photo disclosure (W3.2, P4, D-LP-4): an accessible dialog that
 * says what is sent, what is kept and how to turn it off, and hands back an
 * explicit answer. Its copy obeys the Logger v2 forbidden-word list.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PhotoReadDisclosure } from './PhotoReadDisclosure';
import { photoReadCopy } from './photoReadCopy';

afterEach(cleanup);

function renderSheet(readAvailable = true) {
  const onAnswer = vi.fn();
  const onDismiss = vi.fn();
  render(<PhotoReadDisclosure readAvailable={readAvailable} onAnswer={onAnswer} onDismiss={onDismiss} />);
  return { onAnswer, onDismiss };
}

describe('PhotoReadDisclosure', () => {
  it('is a labelled modal dialog', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog', { name: photoReadCopy.sheet.title });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('says what is sent, what is kept and how to turn it off', () => {
    renderSheet();
    expect(screen.getByText(photoReadCopy.sheet.whatIsSentTitle)).toBeInTheDocument();
    expect(screen.getByText(photoReadCopy.sheet.whatIsSent)).toBeInTheDocument();
    expect(screen.getByText(photoReadCopy.sheet.whatIsKept)).toBeInTheDocument();
    expect(screen.getByText(photoReadCopy.sheet.turnOff)).toBeInTheDocument();
  });

  it('returns an explicit yes or no', () => {
    const { onAnswer, onDismiss } = renderSheet();
    fireEvent.click(screen.getByRole('button', { name: photoReadCopy.sheet.accept }));
    expect(onAnswer).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: photoReadCopy.sheet.decline }));
    expect(onAnswer).toHaveBeenLastCalledWith(false);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('closes without answering on Escape or the close button', () => {
    const { onAnswer, onDismiss } = renderSheet();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: photoReadCopy.sheet.closeLabel }));
    expect(onDismiss).toHaveBeenCalledTimes(2);
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('says so when Read is not switched on for this family yet', () => {
    renderSheet(true);
    expect(screen.queryByText(photoReadCopy.sheet.notYetAvailable)).not.toBeInTheDocument();
    cleanup();
    renderSheet(false);
    expect(screen.getByText(photoReadCopy.sheet.notYetAvailable)).toBeInTheDocument();
  });

  it('keeps every string inside the Logger v2 copy rules', () => {
    const all = JSON.stringify(photoReadCopy);
    for (const word of ['try this', 'next time', 'should', 'sorry', 'insight', 'score', 'complete']) {
      expect(all.toLowerCase()).not.toContain(word);
    }
    expect(all).not.toMatch(/\bAI\b/);
    expect(all).not.toContain('→');
  });
});
