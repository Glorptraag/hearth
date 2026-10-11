'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLibraryState } from '@/hooks/use-library-state';
import { track } from '@/lib/analytics/posthog';
import { useIsNative } from '@/components/platform/NativeProvider';

/**
 * Context-aware CTA for the pack detail page. Picks one of:
 *   - In Library (disabled)        — pack already added
 *   - Add to Library               — membership-included pack
 *   - Owned                        — premium pack already purchased
 *   - Get Pack                     — premium pack, redirects to Stripe
 *   - Coming soon                  — premium pack without a Stripe price
 *   - (nothing)                    — premium + unowned inside the native shell
 *
 * Mirrors the matrix in MarketplaceCard.tsx so the marketplace and pack
 * detail page never diverge — including the native branch.
 */
export function PackDetailCta({
  packId,
  packTitle,
  availability,
  stripePriceId,
}: {
  packId: string;
  packTitle: string;
  availability?: 'included' | 'premium';
  stripePriceId?: string;
}) {
  const { libraryIds, ownedIds, loading, addToLibrary } = useLibraryState();
  const { toast } = useToast();
  const isNative = useIsNative();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const inLibrary = libraryIds.has(packId);
  const owned = ownedIds.has(packId);
  const isMembership = availability !== 'premium';

  if (loading) {
    return (
      <div className="w-full bg-surface-raised rounded-md px-md py-sm h-10 hearth-skeleton" />
    );
  }

  async function handleAdd() {
    const result = await addToLibrary(packId);
    if (result.ok) {
      track('module_added_to_library');
      toast(`Added ${packTitle} to your library`, 'info');
    } else {
      toast(`Couldn't add to library${result.status ? ` (${result.status})` : ''}`, 'error');
    }
  }

  async function handlePurchase() {
    if (!stripePriceId) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: stripePriceId, packId, packTitle }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast('Could not start checkout — please try again', 'error');
      }
    } catch {
      toast('Something went wrong — please try again', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (inLibrary) {
    return (
      <button
        disabled
        className="w-full bg-sage/20 text-sage font-sans font-semibold rounded-md px-md py-sm text-sm cursor-default"
      >
        In Library
      </button>
    );
  }

  if (isMembership) {
    return (
      <button
        onClick={handleAdd}
        className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember/90 transition duration-[var(--motion-quick)]"
      >
        Add to Library
      </button>
    );
  }

  if (owned) {
    // Owned but not yet in the library — the add is the whole point of the
    // purchase, so this button must act (it shipped disabled: a purchaser
    // literally could not add their pack from this page).
    return (
      <button
        onClick={handleAdd}
        className="w-full bg-sage/20 text-sage font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-sage/30 transition duration-[var(--motion-quick)]"
      >
        Owned — Add to Library
      </button>
    );
  }

  // Premium pack this family does not own, inside the native shell. Render no
  // affordance at all — not a disabled button, not a price, not a pointer to
  // buying on the web. App Review treats a call to action and a hint toward one
  // the same way, and the AU storefront has no external-purchase entitlement to
  // fall back on. The server also 403s the checkout route; this is the visible
  // half. See docs/hearth-native-app-plan-v1.md.
  if (isNative) return null;

  if (stripePriceId) {
    return (
      <button
        onClick={handlePurchase}
        disabled={checkoutLoading}
        className="w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition duration-[var(--motion-quick)] shadow-ember disabled:opacity-50"
      >
        {checkoutLoading ? 'Loading…' : 'Get Pack'}
      </button>
    );
  }

  return (
    <button
      disabled
      className="w-full bg-ember/40 text-text-inverse/50 font-sans font-semibold rounded-md px-md py-sm text-sm cursor-not-allowed"
    >
      Coming soon
    </button>
  );
}
