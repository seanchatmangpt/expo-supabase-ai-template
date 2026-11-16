import React from 'react';
import { render } from '@testing-library/react-native';
import { AmbientBiometricHologram } from '../AmbientBiometricHologram';
import { useAnimationComplexity } from '../../../2030/optimization/useOptimizationProfile';
import { useHolographicSensors } from '../../../2030/ui-holographic/useHolographicSensors';

// Mock optimization hooks
jest.mock('../../../2030/optimization/useOptimizationProfile', () => ({
  useAnimationComplexity: jest.fn(),
}));

jest.mock('../../../2030/ui-holographic/useHolographicSensors', () => ({
  useHolographicSensors: jest.fn(),
}));

// Mock react-three-fiber and skia
jest.mock(
  '@react-three/fiber/native',
  () => {
    const React = require('react');
    return {
      Canvas: ({ children, testID }: any) =>
        React.createElement('Canvas', { testID: testID || 'webgl-canvas-inner' }, children),
      useFrame: jest.fn(),
    };
  },
  { virtual: true }
);

jest.mock(
  '@shopify/react-native-skia',
  () => {
    const React = require('react');
    return {
      Canvas: ({ children, testID }: any) =>
        React.createElement('SkiaCanvas', { testID: testID || 'skia-canvas-inner' }, children),
      Rect: ({ children }: any) => React.createElement('Rect', null, children),
      Shader: () => React.createElement('Shader'),
      useSharedValue: (initial: any) => ({ value: initial }),
      useTime: () => ({ value: 0 }),
    };
  },
  { virtual: true }
);

describe('AmbientBiometricHologram Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders volumetric 3D particle sphere under "full" optimization profile', () => {
    (useAnimationComplexity as jest.Mock).mockReturnValue('full');
    (useHolographicSensors as jest.Mock).mockReturnValue({
      sensor: { value: { roll: 0.1, pitch: 0.2 } },
    });

    const { getByTestId, queryByTestId } = render(
      <AmbientBiometricHologram heartRate={72} proofVerified={true} />
    );

    expect(getByTestId('hologram-3d-canvas')).toBeTruthy();
    expect(queryByTestId('hologram-skia-canvas')).toBeNull();
    expect(queryByTestId('hologram-static-fallback')).toBeNull();
  });

  it('renders volumetric 3D particle sphere under "reduced" optimization profile', () => {
    (useAnimationComplexity as jest.Mock).mockReturnValue('reduced');
    (useHolographicSensors as jest.Mock).mockReturnValue({
      sensor: { value: { roll: 0.1, pitch: 0.2 } },
    });

    const { getByTestId, queryByTestId } = render(
      <AmbientBiometricHologram heartRate={72} proofVerified={false} />
    );

    expect(getByTestId('hologram-3d-canvas')).toBeTruthy();
    expect(queryByTestId('hologram-skia-canvas')).toBeNull();
    expect(queryByTestId('hologram-static-fallback')).toBeNull();
  });

  it('renders Shopify Skia fluid fallback under "minimal" optimization profile', () => {
    (useAnimationComplexity as jest.Mock).mockReturnValue('minimal');

    const { getByTestId, queryByTestId } = render(
      <AmbientBiometricHologram heartRate={85} proofVerified={true} />
    );

    expect(getByTestId('hologram-skia-canvas')).toBeTruthy();
    expect(queryByTestId('hologram-3d-canvas')).toBeNull();
    expect(queryByTestId('hologram-static-fallback')).toBeNull();
  });

  it('renders static SVG fallback under "none" optimization profile', () => {
    (useAnimationComplexity as jest.Mock).mockReturnValue('none');

    const { getByTestId, queryByTestId } = render(
      <AmbientBiometricHologram heartRate={90} proofVerified={true} />
    );

    expect(getByTestId('hologram-static-fallback')).toBeTruthy();
    expect(queryByTestId('hologram-3d-canvas')).toBeNull();
    expect(queryByTestId('hologram-skia-canvas')).toBeNull();
  });
});
