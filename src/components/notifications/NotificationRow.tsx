import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface NotificationRowProps {
  notification: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    bodyData: Record<string, string>;
    tier: string;
    state: string;
    destinationRoute: string | null;
    createdAt: Date | null;
  };
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
  basePath?: string;
}

// Tier 1 = ember left border, Tier 2 = violet, Tier 3 = muted
const TIER_LEFT_ACCENT: Record<string, string> = {
  whisper: 'border-l-[3px] border-l-ember',
  nudge:   'border-l-[3px] border-l-[#A78BFA]',
  chime:   'border-l-[3px] border-l-text-muted/40',
};

// Per-type emoji following spec: 📝 Resume, 🔔 Respond, 💭 Reconnect
const TYPE_EMOJI: Record<string, string> = {
  draft_resume:      '📝',
  pause_ack:         '📝',
  badge_ready:       '🏅',
  compliance_nudge:  '📋',
  log_invitation:    '💡',
  prep_reminder:     '📅',
  streak_prompt:     '💭',
  streak_celebration:'🎉',
  weekly_digest:     '📊',
  capability_growth: '🌱',
};

// Default action labels per type (overridden by bodyData.actionLabel)
const TYPE_ACTION_LABEL: Record<string, string> = {
  draft_resume:      'Continue',
  pause_ack:         'Pick Up',
  badge_ready:       'Check Now',
  compliance_nudge:  'View Report',
  log_invitation:    'Log It',
  prep_reminder:     'Get Ready',
  streak_prompt:     'Quick Log',
  streak_celebration:'View',
  weekly_digest:     'View',
  capability_growth: 'See Growth',
};

export default function NotificationRow({
  notification,
  onDismiss,
  onMarkRead,
  basePath = '',
}: NotificationRowProps) {
  const isUnread = notification.state === 'visible';
  const accent = TIER_LEFT_ACCENT[notification.tier] ?? TIER_LEFT_ACCENT.chime;
  const emoji = TYPE_EMOJI[notification.type] ?? '🔔';
  const actionLabel =
    notification.bodyData?.actionLabel ??
    TYPE_ACTION_LABEL[notification.type] ??
    'View';

  const timeLabel = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : null;

  return (
    <div
      className={`group relative rounded-[10px] border border-border-subtle bg-surface-panel p-md shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-border-medium hover:bg-surface-raised hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:-translate-y-[2px] cursor-pointer ${accent}`}
      onClick={() => isUnread && onMarkRead(notification.id)}
    >
      <div className="flex items-start gap-md">
        {/* Tier emoji */}
        <span className="mt-[2px] shrink-0 text-xl leading-none">{emoji}</span>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-xs min-w-0">
          <p
            className={`font-serif text-[15px] leading-snug ${
              isUnread ? 'font-semibold text-text-primary' : 'font-normal text-text-secondary'
            }`}
          >
            {notification.title}
          </p>

          {notification.body && (
            <p className="font-serif text-sm text-text-muted leading-relaxed">
              {notification.body}
            </p>
          )}

          {/* Footer: action + timestamp */}
          <div className="mt-sm flex items-center justify-between border-t border-border-subtle pt-sm">
            {notification.destinationRoute ? (
              <Link
                href={`${basePath}${notification.destinationRoute}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isUnread) onMarkRead(notification.id);
                }}
                className="inline-flex items-center rounded-[10px] bg-ember px-[14px] py-[6px] font-sans text-[13px] font-semibold text-text-inverse transition-all duration-200 hover:bg-ember-hover"
              >
                {actionLabel}
              </Link>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-sm">
              {timeLabel && (
                <span className="font-sans text-[11px] text-text-muted">{timeLabel}</span>
              )}
              {isUnread && (
                <span className="block h-2 w-2 shrink-0 rounded-full bg-ember" />
              )}
            </div>
          </div>
        </div>

        {/* Dismiss — visible on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(notification.id);
          }}
          className="mt-[-4px] mr-[-4px] flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-md font-sans text-sm text-text-muted opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-surface-raised hover:text-text-secondary"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
