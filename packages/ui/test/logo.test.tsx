import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from '../src/logo';

describe('Logo', () => {
  it('renders the wordmark by default', () => {
    render(<Logo />);
    expect(screen.getByText('Leucent')).toBeInTheDocument();
  });

  it('hides the wordmark when showWordmark=false', () => {
    render(<Logo showWordmark={false} />);
    expect(screen.queryByText('Leucent')).toBeNull();
  });

  it('respects the size prop', () => {
    const { container, rerender } = render(<Logo size="sm" data-testid="l" />);
    expect(container.querySelector('.h-5.w-5')).not.toBeNull();
    rerender(<Logo size="lg" data-testid="l" />);
    expect(container.querySelector('.h-9.w-9')).not.toBeNull();
  });

  it('forwards classes via className prop', () => {
    render(<Logo className="extra-class" data-testid="l" />);
    expect(screen.getByTestId('l').className).toContain('extra-class');
  });
});
