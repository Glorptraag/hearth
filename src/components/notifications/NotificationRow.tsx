import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { ComponentType } from 'react';
import {
  NotePencil,
  MedalMilitary,
  ShieldCheck,
  Lightbulb,
  CalendarBlank,
  ChatCircleDots,
  Confetti,
  ChartBar,
  Plant,
  Bell,
  MoonStars,
  X,
} from '@/components/icons';

type IconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

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
  onSnooze: (id: string) => void;
  basePath?: string;
}

// Tier 1 = ember left border, Tier 2 = violet, Tier 3 = muted
const TIER_LEFT_ACCENT: Record<string, string> = {
  whisper: 'border-l-[3px] border-l-ember',
  nudge:   'border-l-[3px] border-l-child-violet',
  chime:   'border-l-[3px] border-l-text-muted/40',
};

// Per-type icon following spec semantics (NotePencil = Resume,
// Bell = Respond, ChatCircleDots = Reconnect, etc.)
const TYPE_ICON: Record<string, IconC> = {
  draft_resume:       NotePencil,
  pause_ack:          NotePencil,
  badge_ready:        MedalMilitary,
  compliance_nudge:   ShieldCheck,
  log_invitation:     Lightbulb,
  prep_reminder:      CalendarBlank,
  streak_prompt:      ChatCircleDots,
  streak_celebration: Confetti,
  weekly_digest:      ChartBar,
  capability_growth:  Plant,
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
  onSnooze,
  basePath = '',
}: NotificationRowProps) {
  const isUnread = notification.state === 'visible';
  const accent = TIER_LEFT_ACCENT[notification.tier] ?? TIER_LEFT_ACCENT.chime;
  const Icon = TYPE_ICON[notification.type] ?? Bell;
  const actionLabel =
    notification.bodyData?.actionLabel ??
    TYPE_ACTION_LABEL[notification.type] ??
    'View';

  const timeLabel = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : null;

  return (
    <div
      className={`group relative rounded-[10px] border border-border-subtle bg-surface-panel p-md shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:border-border-medium hover:bg-surface-raised hover:shadow-hover hover:-translate-y-[2px] cursor-pointer ${accent}`}
      onClick={() => isUnread && onMarkRead(notification.id)}
    >
      <div className="flex items-start gap-md">
        {/* Tier icon */}
        <span
          className="mt-[2px] shrink-0 inline-flex h-5 w-5 items-center justify-center text-text-secondary"
          aria-hidden="true"
        >
          <Icon size={22} />
        </span>

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

        {/* Snooze + Dismiss — visible on hover */}
        <div className="mt-[-4px] mr-[-4px] flex shrink-0 flex-col gap-[2px] opacity-0 transition-all duration-200 group-hover:opacity-100">
          {isUnread && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnooze(notification.id);
              }}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-md text-text-muted hover:bg-surface-raised hover:text-text-secondary"
              aria-label="Snooze for 4 hours"
              title="Snooze"
            >
              <MoonStars size={14} aria-hidden="true" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notification.id);
            }}
            className="flex h-[28px] w-[28px] items-center justify-center rounded-md text-text-muted hover:bg-surface-raised hover:text-text-secondary"
            aria-label="Dismiss"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
