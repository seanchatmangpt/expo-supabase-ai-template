import { renderHook } from '@testing-library/react-native';
import { useA11y } from '../hooks/useA11y';
import { AutoA11yOptions } from '../types';

describe('useA11y', () => {
  it('returns empty object when no options provided', () => {
    const { result } = renderHook(() => useA11y({}));
    expect(result.current).toEqual({});
  });

  it('maps label and hint correctly', () => {
    const options: AutoA11yOptions = {
      label: 'Submit Button',
      hint: 'Submits the form',
    };
    const { result } = renderHook(() => useA11y(options));
    expect(result.current.accessibilityLabel).toBe('Submit Button');
    expect(result.current.accessibilityHint).toBe('Submits the form');
  });

  it('maps role correctly', () => {
    const options: AutoA11yOptions = {
      role: 'button',
    };
    const { result } = renderHook(() => useA11y(options));
    expect(result.current.accessibilityRole).toBe('button');
  });
});
