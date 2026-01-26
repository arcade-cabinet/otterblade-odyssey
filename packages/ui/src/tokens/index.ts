/**
 * Otterblade Odyssey Design Tokens
 * Brand colors, typography, spacing derived from BRAND.md
 */

export const colors = {
  // Primary brand colors
  hearthgold: {
    50: '#FFF9E6',
    100: '#FFF2CC',
    200: '#FFE599',
    300: '#FFD966',
    400: '#FFCC33',
    500: '#FFBF00', // Primary hearthgold
    600: '#CC9900',
    700: '#997300',
    800: '#664C00',
    900: '#332600',
  },

  // Woodland green
  willowgreen: {
    50: '#F0F7F4',
    100: '#D9ECE3',
    200: '#B3D9C7',
    300: '#8CC6AB',
    400: '#66B38F',
    500: '#4A9D72', // Primary willowgreen
    600: '#3B7E5B',
    700: '#2C5E44',
    800: '#1D3F2D',
    900: '#0F1F17',
  },

  // Stone gray
  stonegray: {
    50: '#F5F5F5',
    100: '#E8E8E8',
    200: '#D1D1D1',
    300: '#BABABA',
    400: '#A3A3A3',
    500: '#8C8C8C', // Primary stonegray
    600: '#707070',
    700: '#545454',
    800: '#383838',
    900: '#1C1C1C',
  },

  // Shadow (for depth)
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.25)',
    dark: 'rgba(0, 0, 0, 0.4)',
  },

  // Functional colors
  danger: '#B91C1C',
  success: '#059669',
  warning: '#D97706',
  info: '#2563EB',
} as const;

export const typography = {
  fonts: {
    // Storybook-style serif for narrative
    heading: '"Crimson Pro", "Georgia", serif',
    // Clean sans for UI
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    // Monospace for debug
    mono: '"JetBrains Mono", "Consolas", monospace',
  },

  sizes: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
