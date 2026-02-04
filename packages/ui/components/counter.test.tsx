import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Counter } from './counter';

describe('Counter', () => {
  it('renders with initial count of 0', () => {
    render(<Counter />);
    const button = screen.getByRole('button', { name: /0/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('0');
  });

  it('increments count on click', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('0');
    
    await user.click(button);
    expect(button).toHaveTextContent('1');
    
    await user.click(button);
    expect(button).toHaveTextContent('2');
  });

  it('has correct button type', () => {
    render(<Counter />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('has correct id', () => {
    render(<Counter />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('id', 'counter');
  });

  it('increments multiple times', async () => {
    const user = userEvent.setup();
    render(<Counter />);
    
    const button = screen.getByRole('button');
    
    for (let i = 0; i < 5; i++) {
      await user.click(button);
      expect(button).toHaveTextContent(String(i + 1));
    }
  });
});

