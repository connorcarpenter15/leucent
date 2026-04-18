import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteHeader } from '../src/site-header';

describe('SiteHeader', () => {
  it('renders the logo with default link to /', () => {
    const { container } = render(<SiteHeader />);
    const logoAnchor = container.querySelector('a[href="/"]');
    expect(logoAnchor).not.toBeNull();
  });

  it('respects a custom logoHref', () => {
    const { container } = render(<SiteHeader logoHref="/dashboard" />);
    expect(container.querySelector('a[href="/dashboard"]')).not.toBeNull();
  });

  it('renders provided nav links and marks the active one', () => {
    render(
      <SiteHeader
        links={[
          { href: '/a', label: 'A' },
          { href: '/b', label: 'B', active: true },
        ]}
      />,
    );
    const activeLink = screen.getByRole('link', { name: 'B' });
    expect(activeLink.className).toContain('bg-surface-800/80');
    const passive = screen.getByRole('link', { name: 'A' });
    expect(passive.className).not.toContain('bg-surface-800/80');
  });

  it('hides nav links when variant=minimal', () => {
    render(<SiteHeader variant="minimal" links={[{ href: '/a', label: 'A' }]} />);
    expect(screen.queryByRole('link', { name: 'A' })).toBeNull();
  });

  it('renders the actions slot', () => {
    render(<SiteHeader actions={<button>Sign out</button>} />);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('applies the sticky class by default', () => {
    const { container } = render(<SiteHeader />);
    const header = container.querySelector('header');
    expect(header?.className).toContain('sticky');
  });

  it('drops the sticky class when sticky=false', () => {
    const { container } = render(<SiteHeader sticky={false} />);
    expect(container.querySelector('header')?.className).not.toContain('sticky');
  });
});
