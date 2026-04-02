import { getIconEntry, type IconName } from '@/lib/icon-registry';

type IconSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

const SIZE_MAP: Record<IconSize, string> = {
  xs:   'text-xs',
  sm:   'text-sm',
  base: 'text-base',
  lg:   'text-lg',
  xl:   'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
};

type RegistryProps = {
  name: IconName;
  value?: never;
  fallback?: never;
};

type PassthroughProps = {
  name?: never;
  value: string | null | undefined;
  fallback?: IconName;
};

type HearthIconProps = (RegistryProps | PassthroughProps) & {
  size?: IconSize;
  className?: string;
  label?: string;
};

export default function HearthIcon(props: HearthIconProps) {
  const { size = 'base', className, label } = props;

  let emoji: string;
  let dataIcon: string | undefined;
  let dataCategory: string | undefined;

  if ('name' in props && props.name) {
    const entry = getIconEntry(props.name);
    emoji = entry.value;
    dataIcon = props.name;
    dataCategory = entry.category;
  } else if ('value' in props && props.value) {
    emoji = props.value;
  } else if ('fallback' in props && props.fallback) {
    const entry = getIconEntry(props.fallback);
    emoji = entry.value;
    dataIcon = props.fallback;
    dataCategory = entry.category;
  } else {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center justify-center leading-none ${SIZE_MAP[size]}${className ? ` ${className}` : ''}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-icon={dataIcon}
      data-icon-category={dataCategory}
    >
      {emoji}
    </span>
  );
}
