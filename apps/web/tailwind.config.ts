import type { Config } from 'tailwindcss';
import preset from '@leucent/ui/tailwind-preset';
import typography from '@tailwindcss/typography';

const config: Config = {
  presets: [preset as Config],
  content: ['./src/**/*.{ts,tsx,mdx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  plugins: [typography],
};

export default config;
