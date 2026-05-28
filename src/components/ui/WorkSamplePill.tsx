import { ClipboardText } from '@/components/icons';

interface WorkSamplePillProps {
  size?: 'sm' | 'md';
  quality?: number | null;
}

export default function WorkSamplePill({ size = 'md' }: WorkSamplePillProps) {
  const sizeCls =
    size === 'sm'
      ? 'px-sm py-[1px] text-[10px]'
      : 'px-sm py-[2px] text-[11px]';
  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <span
      className={`inline-flex items-center gap-xs rounded-full bg-sage/15 text-sage font-sans font-semibold ${sizeCls}`}
    >
      <ClipboardText size={iconSize} aria-hidden="true" /> Work Sample
    </span>
  );
}
