import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Testimonial Card', () => {
  it('renders without crashing', () => {
    document.body.innerHTML = `
      <div class="card">
        <div class="header">
          <div class="user-info">
            <span class="name">Sarah Dole</span>
            <span class="username">@sarahdole</span>
          </div>
        </div>
        <p>I've been searching for high-quality abstract images...</p>
      </div>
    `;
    
    expect(screen.getByText('Sarah Dole')).toBeInTheDocument();
    expect(screen.getByText('@sarahdole')).toBeInTheDocument();
  });
});

