import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    );
    expect(screen.getByText(/card content/i)).toBeInTheDocument();
  });

  it('renders with a title', () => {
    render(
      <Card title="Card Title">
        <p>Content</p>
      </Card>
    );
    expect(screen.getByText(/card title/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Card Title');
  });

  it('renders without title when not provided', () => {
    render(
      <Card>
        <p>Content</p>
      </Card>
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders footer content', () => {
    render(
      <Card footer={<button>Action</button>}>
        <p>Content</p>
      </Card>
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });

  it('renders without footer when not provided', () => {
    const { container } = render(
      <Card>
        <p>Content</p>
      </Card>
    );
    const footer = container.querySelector('[class*="bg-gray-50"]');
    expect(footer).not.toBeInTheDocument();
  });

  it('renders complete card with title, content, and footer', () => {
    render(
      <Card
        title="Complete Card"
        footer={<button>Save</button>}
      >
        <p>Card body content</p>
      </Card>
    );
    
    expect(screen.getByRole('heading', { name: /complete card/i })).toBeInTheDocument();
    expect(screen.getByText(/card body content/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-card">
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-card');
  });

  it('has proper structure with title', () => {
    const { container } = render(
      <Card title="Title">
        <p>Content</p>
      </Card>
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md');
  });
});

