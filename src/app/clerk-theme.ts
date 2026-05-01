type Theme = 'dark' | 'gathering';

// Hearth Design System v2 + v2.1: Clerk components can't read CSS custom
// properties, so the palette objects are duplicated here. Kept in lockstep
// with src/app/globals.css.
const DARK = {
  surface: {
    body: '#15110D',         // v2: warmed from #0F0D0B
    panel: '#1A1612',
    raised: '#252117',
    hover: '#2D2621',
  },
  text: {
    primary: '#E8DFD4',
    secondary: '#9B8B7E',
    muted: '#726458',        // WCAG override (v2 spec is #6B5D52)
    inverse: '#15110D',      // tracks surface-body
  },
  ember: {
    base: '#D97B3A',
    hover: '#E88F4E',
    glow: 'rgba(217,123,58,0.15)',
  },
  border: {
    subtle: 'rgba(232,223,212,0.06)',  // v2 S11: cream-tinted default
    medium: 'rgba(232,223,212,0.10)',
  },
};

const GATHERING = {
  surface: {
    body: '#FDF6F0',
    panel: '#FAF8F5',
    raised: '#F5F5F0',
    hover: '#ECE8E2',        // v2.1: warmed from cool #E2E8F0
  },
  text: {
    primary: '#2C2418',
    secondary: '#4A5568',
    muted: '#718096',
    inverse: '#FFFFFF',      // WCAG override on ember-button background
  },
  ember: {
    base: '#C05621',
    hover: '#92400E',
    glow: 'rgba(192,86,33,0.10)',  // v2.1: 0.12 → 0.10
  },
  border: {
    subtle: 'rgba(44,36,24,0.06)',  // v2.1: warm-dark-tinted, S11 light equivalent
    medium: 'rgba(44,36,24,0.10)',
  },
};

// Hearth Design System v2: Fraunces (variable, SOFT axis) + DM Sans (variable).
// Clerk components can't read CSS custom properties, so the font-family strings
// are duplicated here. Family names are matched by next/font's @font-face injection
// in src/app/layout.tsx.
const fontSans = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const fontSerif = "'Fraunces', Georgia, serif";

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
        // v2 S13: default surfaces lift via surface step + border, not ember halo.
        // The Clerk card was a default-shadow site — strip the 60px ember glow.
        boxShadow:
          theme === 'gathering'
            ? '0 4px 16px rgba(44,36,24,0.08)'
            : '0 4px 16px rgba(0,0,0,0.30)',
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
      colorNeutral: t.text.primary,
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
