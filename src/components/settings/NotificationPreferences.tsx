'use client';

interface NotificationPrefs {
  dailyReminder?: boolean;
  weeklyDigest?: boolean;
  complianceAlerts?: boolean;
}

interface NotificationPreferencesProps {
  prefs: NotificationPrefs;
  onChange: (prefs: NotificationPrefs) => void;
}

const TOGGLES = [
  {
    key: 'dailyReminder' as const,
    label: 'Daily log reminder',
    description: 'A gentle nudge if you haven\'t logged by afternoon.',
  },
  {
    key: 'weeklyDigest' as const,
    label: 'Weekly digest',
    description: 'Summary of the week\'s learning every Sunday evening.',
  },
  {
    key: 'complianceAlerts' as const,
    label: 'Compliance deadline alerts',
    description: 'Reminders before your reporting date.',
  },
];

export default function NotificationPreferences({ prefs, onChange }: NotificationPreferencesProps) {
  function toggle(key: keyof NotificationPrefs) {
    onChange({ ...prefs, [key]: !prefs[key] });
  }

  return (
    <div className="flex flex-col gap-xs">
      {TOGGLES.map(({ key, label, description }) => {
        const enabled = prefs[key] ?? true;
        return (
          <div
            key={key}
            className="flex items-center gap-md rounded-[10px] border border-border-subtle bg-surface-panel p-md transition duration-[var(--motion-quick)] hover:border-border-medium"
          >
            <div className="flex-1">
              <p className="font-sans text-sm font-semibold text-text-primary">{label}</p>
              <p className="mt-xs font-sans text-xs text-text-muted">{description}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`hit-target relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-[var(--motion-quick)] ${
                enabled ? 'bg-ember' : 'bg-surface-hover border border-border-medium'
              }`}
              aria-checked={enabled}
              role="switch"
            >
              <span
                className={`hearth-switch-knob absolute top-[2px] h-5 w-5 rounded-full bg-white shadow ${
                  enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
