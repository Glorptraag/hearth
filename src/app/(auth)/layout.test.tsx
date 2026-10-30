// Inside the iOS app the native shell owns navigation, so hosted pages must
// render without the web's sidebar, header and bottom nav (native plan v2).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NativeProvider } from '@/components/platform/NativeProvider';
import AuthLayout from './layout';

function renderLayout(isNative: boolean) {
  return render(
    <NativeProvider isNative={isNative}>
      <AuthLayout>
        <p>Page content</p>
      </AuthLayout>
    </NativeProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
});

describe('AuthLayout chrome', () => {
  it('renders the web navigation in a browser', () => {
    renderLayout(false);
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('renders chromeless inside the iOS app', () => {
    renderLayout(true);
    expect(screen.queryAllByRole('navigation')).toHaveLength(0);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });
});
