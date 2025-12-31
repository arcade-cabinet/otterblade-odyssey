/**
 * Material UI Theme for Otterblade Odyssey
 * Aligned with BRAND.md - warm, woodland-epic aesthetic
 *
 * Color palette inspired by:
 * - Warm greens (forest canopy, moss)
 * - Honey gold (candlelight, autumn)
 * - Cool misty blues (dawn mist, shadows)
 * - Warm stone beige (abbey walls)
 */

import { createTheme } from '@mui/material/styles';

// ============================================================================
// Brand Colors
// ============================================================================

export const brandColors = {
  // Primary: Warm forest green
  forestGreen: {
    main: '#4a6741',
    light: '#6b8a5f',
    dark: '#2d4228',
    contrastText: '#fff',
  },
  // Secondary: Honey gold / candlelight
  honeyGold: {
    main: '#d4a84b',
    light: '#e5c77a',
    dark: '#a07c2e',
    contrastText: '#1a1a1a',
  },
  // Accent: Warm stone beige
  stoneBeige: {
    main: '#c9b896',
    light: '#e0d5c0',
    dark: '#a89970',
    contrastText: '#1a1a1a',
  },
  // Misty blue for subtle highlights
  mistyBlue: {
    main: '#7a9eb8',
    light: '#a5c4d9',
    dark: '#4f7591',
    contrastText: '#fff',
  },
  // Deep backgrounds
  deepForest: '#1a2416',
  darkStone: '#2a2520',
  nightSky: '#1a1a2e',

  // Torch/lantern glow
  lanternGlow: '#ff9f43',
  candleWarm: '#ffb347',

  // Error/danger (crimson, not neon)
  crimson: '#8b3a3a',
};

// ============================================================================
// MUI Theme
// ============================================================================

export const otterbladeTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: brandColors.forestGreen,
    secondary: brandColors.honeyGold,
    background: {
      default: brandColors.nightSky,
      paper: brandColors.darkStone,
    },
    text: {
      primary: '#e8e0d4',
      secondary: '#b0a698',
    },
    error: {
      main: brandColors.crimson,
    },
    warning: {
      main: brandColors.lanternGlow,
    },
    success: {
      main: brandColors.forestGreen.main,
    },
    info: {
      main: brandColors.mistyBlue.main,
    },
  },
  typography: {
    fontFamily: '"Crimson Pro", "Georgia", serif',
    h1: {
      fontFamily: '"IM Fell English SC", "Times New Roman", serif',
      fontWeight: 400,
      letterSpacing: '0.05em',
    },
    h2: {
      fontFamily: '"IM Fell English SC", "Times New Roman", serif',
      fontWeight: 400,
      letterSpacing: '0.04em',
    },
    h3: {
      fontFamily: '"IM Fell English SC", "Times New Roman", serif',
      fontWeight: 400,
    },
    h4: {
      fontFamily: '"Crimson Pro", "Georgia", serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Crimson Pro", "Georgia", serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Crimson Pro", "Georgia", serif',
      fontWeight: 600,
    },
    body1: {
      fontFamily: '"Crimson Pro", "Georgia", serif',
      fontSize: '1.1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Crimson Pro", "Georgia", serif',
      fontSize: '0.95rem',
    },
    button: {
      fontFamily: '"Crimson Pro", "Georgia", serif',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    caption: {
      fontFamily: '"Crimson Pro", "Georgia", serif',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          padding: '12px 32px',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: `0 0 20px ${brandColors.honeyGold.main}40`,
          },
        },
        contained: {
          background: `linear-gradient(180deg, ${brandColors.forestGreen.main} 0%, ${brandColors.forestGreen.dark} 100%)`,
          border: `1px solid ${brandColors.forestGreen.light}40`,
          '&:hover': {
            background: `linear-gradient(180deg, ${brandColors.forestGreen.light} 0%, ${brandColors.forestGreen.main} 100%)`,
          },
        },
        outlined: {
          borderColor: brandColors.honeyGold.main,
          color: brandColors.honeyGold.main,
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: `${brandColors.honeyGold.main}15`,
            borderColor: brandColors.honeyGold.light,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: `${brandColors.darkStone}e0`,
          border: `1px solid ${brandColors.stoneBeige.dark}30`,
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        },
      },
    },
  },
});

// ============================================================================
// CSS Variables for Tailwind/CSS integration
// ============================================================================

export const brandCSSVariables = {
  '--brand-forest-green': brandColors.forestGreen.main,
  '--brand-forest-green-light': brandColors.forestGreen.light,
  '--brand-forest-green-dark': brandColors.forestGreen.dark,
  '--brand-honey-gold': brandColors.honeyGold.main,
  '--brand-honey-gold-light': brandColors.honeyGold.light,
  '--brand-stone-beige': brandColors.stoneBeige.main,
  '--brand-misty-blue': brandColors.mistyBlue.main,
  '--brand-deep-forest': brandColors.deepForest,
  '--brand-dark-stone': brandColors.darkStone,
  '--brand-night-sky': brandColors.nightSky,
  '--brand-lantern-glow': brandColors.lanternGlow,
  '--brand-crimson': brandColors.crimson,
};

export default otterbladeTheme;
