import { ImageResponse } from 'next/og';

/**
 * Apple touch icon — iOS home-screen installs don't render SVG icons, so
 * Next.js rasterizes this file into a 180x180 PNG at build time. The design
 * must stay aligned with:
 *   - packages/ui/src/logo.tsx (in-app header mark)
 *   - apps/web/src/app/icon.svg (browser-tab favicon)
 *
 * Colors mirror the `accent-gradient` and `accent-glow` tokens from
 * packages/ui/src/tailwind-preset.ts.
 */

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2f74ff 0%, #5390ff 100%)',
        boxShadow: 'inset 0 0 0 6px rgba(47,116,255,0.35), 0 18px 60px -16px rgba(47,116,255,0.55)',
        borderRadius: 40,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 9999,
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 0 44px rgba(255,255,255,0.65)',
        }}
      />
    </div>,
    { ...size },
  );
}
