import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Button>Default Button</Button>);
    expect(getByText('Default Button')).toBeTruthy();
  });

  it('renders correctly with different variants', () => {
    const { getByText } = render(<Button variant="primary">Primary Button</Button>);
    expect(getByText('Primary Button')).toBeTruthy();
  });

  it('renders correctly with different sizes', () => {
    const { getByText } = render(<Button size="lg">Large Button</Button>);
    expect(getByText('Large Button')).toBeTruthy();
  });
});
