'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { type ContentAsset, ASSET_KIND_ICON } from './types';
import { X } from '@/components/icons';

interface AssetPreviewProps {
  isOpen: boolean;
  asset: ContentAsset | null;
  canAccess: boolean;
  upsellPackName?: string;
  upsellPackSlug?: string;
  onClose: () => void;
  onDownload?: (asset: ContentAsset) => void;
  onPrint?: (asset: ContentAsset) => void;
}

export function AssetPreview({
  isOpen,
  asset,
  canAccess,
  upsellPackName,
  upsellPackSlug,
  onClose,
  onDownload,
  onPrint,
}: AssetPreviewProps) {
  const trapRef = useFocusTrap(isOpen);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen || !asset) return null;

  const KindIcon = ASSET_KIND_ICON[asset.kind] ?? ASSET_KIND_ICON.template;
  const kindLabel = asset.kind.replace(/_/g, ' ');
  const metaParts = [
    kindLabel,
    asset.pageCount ? `${asset.pageCount} page${asset.pageCount > 1 ? 's' : ''}` : null,
    'A4',
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-modal transition-opacity duration-[var(--motion-quick)]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-preview-title"
        className="relative z-10 w-full max-w-md max-h-[90dvh] mx-md rounded-[16px] bg-surface-panel border border-border-subtle shadow-float overflow-y-auto transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)]"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-md right-md z-10 p-sm text-text-muted hover:text-text-primary transition-colors duration-[var(--motion-quick)]"
          aria-label="Close preview"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* Thumbnail */}
        <div className="relative w-full aspect-[3/4] max-h-[400px] bg-surface-raised flex items-center justify-center overflow-hidden rounded-t-[16px]">
          {asset.thumbnailUrl ? (
            <>
              <Image
                src={asset.thumbnailUrl}
                alt={asset.title}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-contain"
              />
              {!canAccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-body/30">
                  <span className="font-sans text-lg text-text-muted rotate-[-25deg] select-none opacity-60">
                    Preview
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className="opacity-40 text-text-secondary"><KindIcon size={32} aria-hidden="true" /></span>
          )}
        </div>

        {/* Content */}
        <div className="p-lg">
          <h2 id="asset-preview-title" className="font-serif text-[22px] font-semibold text-text-primary mb-xs">
            {asset.title}
          </h2>
          <p className="font-sans text-[13px] text-text-muted mb-md">
            {metaParts.join(' · ')}
          </p>

          {asset.description && (
            <p className="font-serif text-sm text-text-secondary leading-relaxed mb-md">
              {asset.description}
            </p>
          )}

          {asset.printGuidance && (
            <p className="font-sans text-[12px] text-text-muted mb-lg">
              {asset.printGuidance}
            </p>
          )}

          {/* Actions */}
          {canAccess ? (
            <div className="flex items-center gap-sm">
              {onDownload && (
                <button
                  onClick={() => onDownload(asset)}
                  className="flex-1 font-sans text-sm font-semibold px-md py-sm rounded-[10px] bg-ember text-text-inverse hover:bg-ember/90 transition-all duration-[var(--motion-quick)]"
                >
                  Download
                </button>
              )}
              {onPrint && (
                <button
                  onClick={() => onPrint(asset)}
                  className="flex-1 font-sans text-sm font-semibold px-md py-sm rounded-[10px] bg-transparent text-ember border border-ember/30 hover:border-ember hover:bg-ember/5 transition-all duration-[var(--motion-quick)]"
                >
                  Print
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-md">
              <p className="font-serif text-sm text-text-secondary mb-md">
                Available with the {upsellPackName ?? 'required'} pack.
              </p>
              <a
                href={upsellPackSlug ? `/explore/marketplace?pack=${upsellPackSlug}` : '/explore/marketplace'}
                className="inline-block font-sans text-sm font-semibold px-md py-sm rounded-[10px] bg-ember text-text-inverse hover:bg-ember/90 transition-all duration-[var(--motion-quick)]"
              >
                View in Marketplace
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
