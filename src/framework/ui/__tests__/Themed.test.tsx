import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View, useThemedColor } from '../Themed';
import { ThemeProvider } from '../theme/ThemeContext';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('Themed Components', () => {
  describe('useThemedColor', () => {
    const TestComponent = ({ colorName }: { colorName: 'text' | 'background' }) => {
      const color = useThemedColor(colorName);
      return <View style={{ backgroundColor: color }} testID="themed-view" />;
    };

    it('returns themed class for text', () => {
      const { getByTestId } = renderWithTheme(<TestComponent colorName="text" />);
      expect(getByTestId('themed-view')).toBeTruthy();
    });

    it('returns themed class for background', () => {
      const { getByTestId } = renderWithTheme(<TestComponent colorName="background" />);
      expect(getByTestId('themed-view')).toBeTruthy();
    });
  });

  describe('Text component', () => {
    it('renders correctly with default styles', () => {
      const { getByText } = renderWithTheme(<Text>Hello World</Text>);
      const text = getByText('Hello World');
      expect(text).toBeTruthy();
    });
  });
});
