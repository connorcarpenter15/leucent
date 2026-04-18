import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteFooter } from '../src/site-footer';

describe('SiteFooter', () => {
  it('renders the default tagline and column headings', () => {
    render(<SiteFooter />);
    expect(screen.getByText('Synchronous, observable technical interviews.')).toBeInTheDocument();
    for (const heading of ['Product', 'Resources', 'Company']) {
      expect(screen.getByText(heading)).toBeInTheDocument();
    }
  });

  it('renders the current year in the legal row', () => {
    render(<SiteFooter />);
    expect(screen.getByText(new RegExp(`${new Date().getFullYear()}`))).toBeInTheDocument();
  });

  it('renders the system-status indicator', () => {
    render(<SiteFooter />);
    expect(screen.getByText('All systems nominal')).toBeInTheDocument();
  });

  it('renders custom columns when supplied', () => {
    render(
      <SiteFooter
        columns={[
          {
            heading: 'Custom',
            links: [
              { href: '/x', label: 'X' },
              { href: 'https://ex.com', label: 'Ex', external: true },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.queryByText('Product')).toBeNull();
    const ext = screen.getByRole('link', { name: 'Ex' });
    expect(ext.getAttribute('target')).toBe('_blank');
    expect(ext.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders trailing content above the legal row', () => {
    render(<SiteFooter trailing={<span>Trailing content</span>} />);
    expect(screen.getByText('Trailing content')).toBeInTheDocument();
  });

  it('uses a custom tagline when provided', () => {
    render(<SiteFooter tagline="Hello there" />);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.queryByText('Synchronous, observable technical interviews.')).toBeNull();
  });
});
