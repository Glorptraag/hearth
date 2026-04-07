type Theme = 'dark' | 'gathering';

const DARK = {
  surface: {
    body: '#0F0D0B',
    panel: '#1A1612',
    raised: '#252117',
    hover: '#2D2621',
  },
  text: {
    primary: '#E8DFD4',
    secondary: '#9B8B7E',
    muted: '#726458',
    inverse: '#0F0D0B',
  },
  ember: {
    base: '#D97B3A',
    hover: '#E88F4E',
    glow: 'rgba(217,123,58,0.15)',
  },
  border: {
    subtle: 'rgba(217,123,58,0.1)',
    medium: 'rgba(217,123,58,0.2)',
  },
};

const GATHERING = {
  surface: {
    body: '#FDF6F0',
    panel: '#FAF8F5',
    raised: '#F5F5F0',
    hover: '#E2E8F0',
  },
  text: {
    primary: '#2C2418',
    secondary: '#4A5568',
    muted: '#718096',
    inverse: '#FFFFFF',
  },
  ember: {
    base: '#C05621',
    hover: '#92400E',
    glow: 'rgba(192,86,33,0.12)',
  },
  border: {
    subtle: 'rgba(44,36,24,0.08)',
    medium: 'rgba(44,36,24,0.12)',
  },
};

const fontSans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const fontSerif = "'Crimson Text', Georgia, serif";

export function getClerkAppearance(theme: Theme = 'dark') {
  const t = theme === 'gathering' ? GATHERING : DARK;

  return {
    elements: {
      rootBox: {
        width: '100%',
        maxWidth: '420px',
      },
      card: {
        backgroundColor: t.surface.panel,
        border: `1px solid ${t.border.subtle}`,
        borderRadius: '16px',
        boxShadow:
          theme === 'gathering'
            ? '0 8px 32px rgba(192,86,33,0.08)'
            : '0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(217,123,58,0.08)',
        padding: '48px',
      },
      headerTitle: {
        fontFamily: fontSerif,
        color: t.text.primary,
        fontSize: '1.125rem',
        fontWeight: 600,
      },
      headerSubtitle: {
        fontFamily: fontSerif,
        color: t.text.secondary,
        fontSize: '0.875rem',
      },
      socialButtonsBlockButton: {
        backgroundColor: t.surface.raised,
        border: `1px solid ${t.border.subtle}`,
        color: t.text.secondary,
        fontFamily: fontSans,
        fontSize: '0.875rem',
        borderRadius: '10px',
        transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
      },
      socialButtonsBlockButtonText: {
        fontFamily: fontSans,
        fontSize: '0.875rem',
        fontWeight: 500,
      },
      dividerLine: {
        backgroundColor: t.border.subtle,
      },
      dividerText: {
        fontFamily: fontSans,
        fontSize: '0.75rem',
        color: t.text.muted,
      },
      formFieldLabel: {
        fontFamily: fontSans,
        fontSize: '0.75rem',
        fontWeight: 500,
        color: t.text.secondary,
      },
      formFieldInput: {
        backgroundColor: t.surface.body,
        border: `1px solid ${t.border.subtle}`,
        color: t.text.primary,
        fontFamily: fontSans,
        fontSize: '0.875rem',
        borderRadius: '10px',
      },
      formButtonPrimary: {
        backgroundColor: t.ember.base,
        color: t.text.inverse,
        fontFamily: fontSans,
        fontWeight: 600,
        fontSize: '0.875rem',
        borderRadius: '10px',
        boxShadow: `0 4px 16px rgba(217,123,58,0.3), 0 0 20px ${t.ember.glow}`,
        transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
      },
      footerActionLink: {
        color: t.ember.base,
        fontFamily: fontSans,
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'color 200ms cubic-bezier(0.4,0,0.2,1)',
      },
      footerActionText: {
        fontFamily: fontSans,
        fontSize: '0.875rem',
        color: t.text.muted,
      },
      identityPreviewEditButton: {
        color: t.ember.base,
      },
      formFieldAction: {
        color: t.ember.base,
        fontFamily: fontSans,
        fontSize: '0.75rem',
      },
      alert: {
        backgroundColor: 'rgba(127,29,29,0.2)',
        border: '1px solid rgba(127,29,29,0.3)',
        color: '#F87171',
        borderRadius: '10px',
      },
      alertText: {
        fontFamily: fontSans,
        fontSize: '0.875rem',
      },
      otpCodeFieldInput: {
        backgroundColor: t.surface.body,
        border: `1px solid ${t.border.subtle}`,
        color: t.text.primary,
        borderRadius: '6px',
      },
      formResendCodeLink: {
        color: t.ember.base,
        fontFamily: fontSans,
        fontSize: '0.75rem',
      },
      badge: {
        backgroundColor: t.ember.glow,
        color: t.ember.base,
        fontFamily: fontSans,
        fontSize: '0.75rem',
      },
      userButtonPopoverCard: {
        backgroundColor: t.surface.panel,
        border: `1px solid ${t.border.subtle}`,
      },
    },
    variables: {
      colorPrimary: t.ember.base,
      colorBackground: t.surface.panel,
      colorText: t.text.primary,
      colorTextSecondary: t.text.secondary,
      colorInputBackground: t.surface.body,
      colorInputText: t.text.primary,
      borderRadius: '10px',
      fontFamily: fontSans,
      fontFamilyButtons: fontSans,
    },
  };
}

// Backwards compatibility — static dark appearance
export const clerkAppearance = getClerkAppearance('dark');
