import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface NotificationRowProps {
  notification: {
    id: string;
    title: string;
    body: string | null;
    tier: string;
    state: string;
    destinationRoute: string | null;
    createdAt: Date | null;
  };
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}

const TIER_ACCENT: Record<string, string> = {
  whisper: 'border-text-muted/30',
  nudge: 'border-ember/40',
  chime: 'border-sage/40',
  flare: 'border-red-400/40',
};

export default function NotificationRow({
  notification,
  onDismiss,
  onMarkRead,
}: NotificationRowProps) {
  const isUnread = notification.state === 'visible';

  const timeLabel = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : null;

  const accent = TIER_ACCENT[notification.tier] ?? TIER_ACCENT.whisper;

  return (
    <div
      className={`group relative flex gap-md rounded-[10px] border border-border-subtle bg-surface-panel p-md transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-border-medium hover:bg-surface-raised ${
        isUnread ? `border-l-2 ${accent}` : ''
      }`}
      onClick={() => isUnread && onMarkRead(notification.id)}
    >
      {/* Unread dot */}
      {isUnread && (
        <div className="mt-[5px] flex-shrink-0">
          <span className="block h-2 w-2 rounded-full bg-ember" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col gap-xs">
        <p
          className={`font-serif text-base leading-snug ${
            isUnread ? 'font-semibold text-text-primary' : 'font-normal text-text-secondary'
          }`}
        >
          {notification.title}
        </p>

        {notification.body && (
          <p className="font-sans text-sm text-text-muted">{notification.body}</p>
        )}

        <div className="flex items-center gap-md">
          {notification.destinationRoute && (
            <Link
              href={notification.destinationRoute}
              onClick={(e) => e.stopPropagation()}
              className="font-sans text-xs font-semibold text-ember transition-colors hover:text-ember-hover"
            >
              Take a look →
            </Link>
          )}
          {timeLabel && (
            <span className="font-sans text-[11px] text-text-muted">{timeLabel}</span>
          )}
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        className="flex-shrink-0 self-start font-sans text-sm text-text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:text-text-secondary"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
