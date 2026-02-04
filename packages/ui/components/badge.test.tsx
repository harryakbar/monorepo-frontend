import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders with label', () => {
    render(<Badge label="Label" />);
    expect(screen.getByText(/label/i)).toBeInTheDocument();
  });

  it('applies gray variant by default', () => {
    const { container } = render(<Badge label="Badge" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-gray-50');
    expect(badge?.className).toContain('border-gray-300');
  });

  it('applies red variant', () => {
    const { container } = render(<Badge variant="red" label="Badge" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-pink-50');
    expect(badge?.className).toContain('border-pink-300');
    expect(badge?.className).toContain('text-red-700');
  });

  it('applies yellow variant', () => {
    const { container } = render(<Badge variant="yellow" label="Badge" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-yellow-50');
    expect(badge?.className).toContain('border-yellow-300');
    expect(badge?.className).toContain('text-orange-700');
  });

  it('applies green variant', () => {
    const { container } = render(<Badge variant="green" label="Badge" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-green-50');
    expect(badge?.className).toContain('border-green-300');
    expect(badge?.className).toContain('text-green-700');
  });

  it('applies blue variant', () => {
    const { container } = render(<Badge variant="blue" label="Badge" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('bg-blue-50');
    expect(badge?.className).toContain('border-blue-300');
    expect(badge?.className).toContain('text-blue-700');
  });

  it('applies small size', () => {
    const { container } = render(<Badge size="sm" label="Badge" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('px-2.5');
    expect(badge?.className).toContain('py-0.5');
    expect(badge?.className).toContain('text-xs');
  });

  it('applies medium size by default', () => {
    const { container } = render(<Badge label="Badge" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('px-3');
    expect(badge?.className).toContain('py-1');
    expect(badge?.className).toContain('text-sm');
  });

  it('applies large size', () => {
    const { container } = render(<Badge size="lg" label="Badge" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('px-4');
    expect(badge?.className).toContain('py-1.5');
    expect(badge?.className).toContain('text-base');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge label="Badge" className="custom-badge" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('custom-badge');
  });

  it('has rounded-full styling', () => {
    const { container } = render(<Badge label="Badge" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('rounded-full');
  });

  it('forwards other props', () => {
    render(<Badge label="Badge" data-testid="badge" />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });
});

