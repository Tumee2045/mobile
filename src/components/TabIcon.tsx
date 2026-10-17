import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type Name = ComponentProps<typeof Ionicons>['name'];

/** Tab bar icon factory: outline when inactive, filled when focused. */
export const tabIcon =
  (name: Name, focusedName: Name) =>
  ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? focusedName : name} size={size} color={color as string} />
  );
