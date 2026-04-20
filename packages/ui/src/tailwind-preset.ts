import type { Config } from 'tailwindcss';

/**
 * Shared Tailwind preset. The Leucent visual language is built from two
 * palettes:
 *
 * - `surface.*` — dark gray neutrals (Tailwind `zinc` with hand-tuned 925/975
 *   stops) that we use for app chrome, cards, borders, and typography.
 * - `accent.*` — a sharp, slightly electric blue used sparingly for primary
 *   actions, focus rings, links, status pills, and the brand mark.
 *
 * Apps consume this preset via `presets: [preset]` in their own
 * `tailwind.config.ts`, which keeps marketing pages, the candidate workspace,
 * and the interviewer console visually consistent.
 */
const preset: Partial<Config> = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans, ui-sans-serif, system-ui)'],
        mono: ['var(--font-mono, ui-monospace, SFMono-Regular)'],
        display: ['var(--font-display, var(--font-sans, ui-sans-serif))'],
      },
      colors: {
        surface: {
          0: '#000000',
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          850: '#1f1f23',
          900: '#18181b',
          925: '#131316',
          950: '#09090b',
          975: '#050507',
        },
        accent: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#b6d3ff',
          300: '#85b3ff',
          400: '#5390ff',
          500: '#2f74ff',
          600: '#1d5cf0',
          700: '#1747c4',
          800: '#163c9c',
          900: '#142f72',
          950: '#0d1d4a',
        },
        leucent: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#b6d3ff',
          300: '#85b3ff',
          400: '#5390ff',
          500: '#2f74ff',
          600: '#1d5cf0',
          700: '#1747c4',
          800: '#163c9c',
          900: '#142f72',
        },
      },
      boxShadow: {
        'accent-glow': '0 0 0 1px rgba(47,116,255,0.35), 0 8px 28px -8px rgba(47,116,255,0.55)',
        elevated: '0 8px 24px -12px rgba(0,0,0,0.6), 0 2px 6px -2px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #2f74ff 0%, #5390ff 100%)',
        'surface-radial':
          'radial-gradient(120% 80% at 50% -10%, rgba(47,116,255,0.12) 0%, rgba(47,116,255,0) 60%)',
        'hairline-x':
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
      },
      ringColor: {
        accent: '#2f74ff',
      },
    },
  },
};

export default preset;
