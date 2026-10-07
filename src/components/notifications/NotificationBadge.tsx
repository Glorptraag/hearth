interface NotificationBadgeProps {
  count: number;
}

export default function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="hearth-pop-in flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ember px-[5px] font-sans text-[10px] font-semibold leading-none text-text-inverse">
      {count > 99 ? '99+' : count}
    </span>
  );
}
