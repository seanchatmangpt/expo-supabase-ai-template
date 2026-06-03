import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
  AvatarRelativeProjectionMatrixView,
  StackProtected,
  TabsProtected,
  Stack,
  Tabs,
} from '../AvatarRelativeProjection';

jest.mock('expo-router', () => {
  const React = require('react');
  const StackComponent = React.forwardRef(
    (
      { children, ...props }: { children?: React.ReactNode; [key: string]: any },
      ref: React.Ref<any>
    ) => <>{children}</>
  );
  const TabsComponent = React.forwardRef(
    (
      { children, ...props }: { children?: React.ReactNode; [key: string]: any },
      ref: React.Ref<any>
    ) => <>{children}</>
  );
  return {
    Stack: Object.assign(StackComponent, { Screen: () => null }),
    Tabs: Object.assign(TabsComponent, { Screen: () => null }),
  };
});

jest.mock('@expo/vector-icons/FontAwesome', () => 'FontAwesome');

jest.mock('../../../lib/truex/avatar/matrix', () => ({
  PROJECTION_MATRIX: {
    volunteer_shortage: jest.fn((data, role) => {
      if (role === 'guest')
        return { visible: false, surface: 'none', allowedActions: [], payload: null };
      return {
        visible: true,
        surface: 'dashboard',
        allowedActions: ['notify'],
        payload: {
          message: 'Shortage info',
          openSlots: data.openSlots,
          candidates: data.candidates,
          shortageRatio: data.shortageRatio,
          runId: data.runId,
          history: data.history,
          topology: data.topology,
          stateHash: data.stateHash,
        },
      };
    }),
  },
}));

describe('AvatarRelativeProjection', () => {
  describe('StackProtected', () => {
    it('renders children when guard is true', () => {
      const { getByText } = render(
        <StackProtected guard={true}>
          <Text>Content</Text>
        </StackProtected>
      );
      expect(getByText('Content')).toBeTruthy();
    });

    it('renders null when guard is false', () => {
      const { queryByText } = render(
        <StackProtected guard={false}>
          <Text>Content</Text>
        </StackProtected>
      );
      expect(queryByText('Content')).toBeNull();
    });
  });

  describe('TabsProtected', () => {
    it('renders children when guard is true', () => {
      const { getByText } = render(
        <TabsProtected guard={true}>
          <Text>Content</Text>
        </TabsProtected>
      );
      expect(getByText('Content')).toBeTruthy();
    });
  });
});
