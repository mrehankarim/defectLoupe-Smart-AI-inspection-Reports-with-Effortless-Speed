import { describe, it, expect } from 'vitest';
import React from 'react';
import Button from './Button';

describe('Button component', () => {
  it('renders default primary button', () => {
    const el = Button({ children: 'Click me' });
    expect(el).toBeDefined();
    expect(el.props.children).toBe('Click me');
    expect(el.props.className).toContain('bg-brand-500');
  });

  it('renders secondary variant', () => {
    const el = Button({ variant: 'secondary', children: 'Cancel' });
    expect(el.props.className).toContain('bg-gray-100');
  });

  it('respects disabled state', () => {
    const el = Button({ disabled: true, children: 'Disabled' });
    expect(el.props.disabled).toBe(true);
  });
});
