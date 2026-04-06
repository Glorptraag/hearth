const surface = {
  body: '#0F0D0B',
  panel: '#1A1612',
  raised: '#252117',
  hover: '#2D2621',
};

const text = {
  primary: '#E8DFD4',
  secondary: '#9B8B7E',
  muted: '#6B5D52',
  inverse: '#0F0D0B',
};

const ember = {
  base: '#D97B3A',
  hover: '#E88F4E',
  glow: 'rgba(217,123,58,0.15)',
};

const border = {
  subtle: 'rgba(217,123,58,0.1)',
  medium: 'rgba(217,123,58,0.2)',
};

const fontSans = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const fontSerif = "'Crimson Text', Georgia, serif";

export const clerkAppearance = {
  elements: {
    rootBox: {
      width: '100%',
      maxWidth: '420px',
    },
    card: {
      backgroundColor: surface.panel,
      border: `1px solid ${border.subtle}`,
      borderRadius: '16px',
      boxShadow:
        '0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(217,123,58,0.08)',
      padding: '48px',
    },
    headerTitle: {
      fontFamily: fontSerif,
      color: text.primary,
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    headerSubtitle: {
      fontFamily: fontSerif,
      color: text.secondary,
      fontSize: '0.875rem',
    },
    socialButtonsBlockButton: {
      backgroundColor: surface.raised,
      border: `1px solid ${border.subtle}`,
      color: text.secondary,
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
      backgroundColor: border.subtle,
    },
    dividerText: {
      fontFamily: fontSans,
      fontSize: '0.75rem',
      color: text.muted,
    },
    formFieldLabel: {
      fontFamily: fontSans,
      fontSize: '0.75rem',
      fontWeight: 500,
      color: text.secondary,
    },
    formFieldInput: {
      backgroundColor: surface.body,
      border: `1px solid ${border.subtle}`,
      color: text.primary,
      fontFamily: fontSans,
      fontSize: '0.875rem',
      borderRadius: '10px',
    },
    formButtonPrimary: {
      backgroundColor: ember.base,
      color: text.inverse,
      fontFamily: fontSans,
      fontWeight: 600,
      fontSize: '0.875rem',
      borderRadius: '10px',
      boxShadow: `0 4px 16px rgba(217,123,58,0.3), 0 0 20px ${ember.glow}`,
      transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
    },
    footerActionLink: {
      color: ember.base,
      fontFamily: fontSans,
      fontSize: '0.875rem',
      fontWeight: 500,
      transition: 'color 200ms cubic-bezier(0.4,0,0.2,1)',
    },
    footerActionText: {
      fontFamily: fontSans,
      fontSize: '0.875rem',
      color: text.muted,
    },
    identityPreviewEditButton: {
      color: ember.base,
    },
    formFieldAction: {
      color: ember.base,
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
      backgroundColor: surface.body,
      border: `1px solid ${border.subtle}`,
      color: text.primary,
      borderRadius: '6px',
    },
    formResendCodeLink: {
      color: ember.base,
      fontFamily: fontSans,
      fontSize: '0.75rem',
    },
    badge: {
      backgroundColor: ember.glow,
      color: ember.base,
      fontFamily: fontSans,
      fontSize: '0.75rem',
    },
    userButtonPopoverCard: {
      backgroundColor: surface.panel,
      border: `1px solid ${border.subtle}`,
    },
  },
  variables: {
    colorPrimary: ember.base,
    colorBackground: surface.panel,
    colorText: text.primary,
    colorTextSecondary: text.secondary,
    colorInputBackground: surface.body,
    colorInputText: text.primary,
    borderRadius: '10px',
    fontFamily: fontSans,
    fontFamilyButtons: fontSans,
  },
};
