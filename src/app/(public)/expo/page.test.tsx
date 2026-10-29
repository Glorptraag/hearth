import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExpoPage from './page';
import { expoCopy } from './expoCopy';

describe('/expo landing page', () => {
  it('renders the banner, three verbs, four points and the founding CTA', () => {
    render(<ExpoPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Any curriculum. Or none. Ready for the HEU.' }),
    ).toBeTruthy();
    for (const v of ['Snap', 'Confirm', 'Report']) {
      expect(screen.getByRole('heading', { level: 3, name: v })).toBeTruthy();
    }
    for (const p of expoCopy.points.items) {
      expect(screen.getByText(p.title)).toBeTruthy();
    }
    expect(screen.getByText('$99')).toBeTruthy();
    expect(screen.getByText('14-day free trial')).toBeTruthy();
    const ctas = screen.getAllByRole('link', { name: /free trial/i });
    expect(ctas.some((a) => a.getAttribute('href') === '/sign-up')).toBe(true);
  });

  it('mentions no Spark or Servo and uses no em dashes', () => {
    const text = JSON.stringify(expoCopy);
    expect(text).not.toMatch(/spark|servo/i);
    expect(text).not.toMatch(/—/);
  });
});
