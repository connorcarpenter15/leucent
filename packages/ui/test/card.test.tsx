import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle } from '../src/card';

describe('Card', () => {
  it('renders with the default tone', () => {
    render(<Card data-testid="c">x</Card>);
    expect(screen.getByTestId('c').className).toContain('bg-surface-900/60');
  });

  it('switches to raised tone with the elevated shadow', () => {
    render(
      <Card tone="raised" data-testid="c">
        x
      </Card>,
    );
    expect(screen.getByTestId('c').className).toContain('shadow-elevated');
  });

  it('switches to accent tone with the accent border + glow', () => {
    render(
      <Card tone="accent" data-testid="c">
        x
      </Card>,
    );
    const cls = screen.getByTestId('c').className;
    expect(cls).toContain('border-accent-700/40');
    expect(cls).toContain('shadow-accent-glow');
  });
});

describe('Card sub-components', () => {
  it('composes header/title/description/body/footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Hello</CardTitle>
          <CardDescription>desc</CardDescription>
        </CardHeader>
        <CardBody>body</CardBody>
        <CardFooter>foot</CardFooter>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
    expect(screen.getByText('desc')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.getByText('foot')).toBeInTheDocument();
  });
});
