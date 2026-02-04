import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with a label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('associates label with input using id', () => {
    render(<Input id="email-input" label="Email" />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute('id', 'email-input');
  });

  it('displays placeholder text', () => {
    render(<Input placeholder="Enter your email" />);
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
  });

  it('displays helper text', () => {
    render(<Input label="Username" helperText="Choose a unique username" />);
    expect(screen.getByText(/choose a unique username/i)).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toHaveClass('text-red-600');
  });

  it('prioritizes error over helper text', () => {
    render(
      <Input
        label="Email"
        helperText="Helper text"
        error="Error message"
      />
    );
    expect(screen.getByText(/error message/i)).toBeInTheDocument();
    expect(screen.queryByText(/helper text/i)).not.toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    const { container } = render(<Input error="Error" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('border-red-500');
  });

  it('handles text input', async () => {
    const user = userEvent.setup();
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test@example.com');
    
    expect(input).toHaveValue('test@example.com');
  });

  it('supports password type', () => {
    render(<Input type="password" />);
    const input = document.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles password visibility when showPasswordToggle is enabled', async () => {
    const user = userEvent.setup();
    render(<Input type="password" showPasswordToggle />);
    
    const input = document.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
    
    // Find and click the eye icon
    const toggleButton = input.parentElement?.querySelector('svg');
    expect(toggleButton).toBeInTheDocument();
    
    if (toggleButton) {
      await user.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
    }
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(<Input className="custom-input" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('custom-input');
  });

  it('forwards other input props', () => {
    render(<Input name="email" required aria-label="Email address" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-label', 'Email address');
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('sets aria-describedby for error', () => {
    render(<Input id="test-input" error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
  });

  it('sets aria-describedby for helper text', () => {
    render(<Input id="test-input" helperText="Helper text" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'test-input-helper');
  });
});

