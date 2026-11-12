import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, Spinner, T } from './Icon';
import type { IconName } from './icons';
import { C, SH } from '../../theme/tokens';

export type BtnVariant = 'p' | 's' | 'g' | 'd' | 'ok';
export type BtnSize = 'md' | 'sm' | 'xs' | 'lg';

const SIZES: Record<BtnSize, { py: number; px: number; fs: number; r: number; gap: number; ic: number }> = {
  md: { py: 10, px: 16, fs: 14, r: 12, gap: 8, ic: 15 },
  sm: { py: 8, px: 12, fs: 13, r: 10, gap: 6, ic: 15 },
  xs: { py: 6, px: 10, fs: 12, r: 9, gap: 6, ic: 15 },
  lg: { py: 13, px: 20, fs: 15, r: 12, gap: 8, ic: 18 },
};

function colors(v: BtnVariant, pressed: boolean) {
  switch (v) {
    case 'p':
      return { bg: pressed ? C.pri700 : C.pri600, fg: C.white, border: 'transparent', shadow: undefined };
    case 's':
      return { bg: pressed ? C.surface2 : C.white, fg: C.ink, border: pressed ? C.border2 : C.line, shadow: SH.sm };
    case 'g':
      return { bg: pressed ? C.hoverBg : 'transparent', fg: pressed ? C.ink : C.ink2, border: 'transparent', shadow: undefined };
    case 'd':
      return { bg: pressed ? '#be123c' : C.rose, fg: C.white, border: 'transparent', shadow: undefined };
    case 'ok':
      return { bg: pressed ? '#047857' : C.green, fg: C.white, border: 'transparent', shadow: undefined };
  }
}

export interface ButtonProps {
  label?: string;
  onPress?: () => void;
  v?: BtnVariant;
  s?: BtnSize;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Overrides used for "selected" toggle buttons (e.g. visit-type choices). */
  selected?: boolean;
}

export function Button({ label, onPress, v = 'p', s = 'md', icon, iconRight, loading, disabled, full, style, testID, selected }: ButtonProps) {
  const z = SIZES[s];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => {
        const c = colors(v, pressed && !disabled);
        return [
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: z.gap,
            paddingVertical: z.py,
            paddingHorizontal: z.px,
            borderRadius: z.r,
            borderWidth: 1,
            borderColor: selected ? C.pri600 : c.border,
            backgroundColor: c.bg,
            boxShadow: c.shadow,
            opacity: disabled ? 0.5 : 1,
            alignSelf: full ? 'stretch' : 'auto',
          } as ViewStyle,
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const c = colors(v, pressed && !disabled);
        return (
          <>
            {loading ? <Spinner size={s === 'lg' ? 18 : 15} color={c.fg} /> : icon ? <Icon name={icon} size={z.ic} color={c.fg} /> : null}
            {label ? (
              <T style={{ color: c.fg, fontSize: z.fs, fontWeight: '600', lineHeight: z.fs + 2 }} numberOfLines={1}>
                {label}
              </T>
            ) : null}
            {iconRight ? <Icon name={iconRight} size={z.ic} color={c.fg} /> : null}
          </>
        );
      }}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  title,
  variant,
  small,
  disabled,
  color,
  testID,
  style,
  children,
}: {
  icon: IconName;
  onPress?: () => void;
  title?: string;
  variant?: 'ghost' | 'danger';
  small?: boolean;
  disabled?: boolean;
  color?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const dim = small ? 32 : 36;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          width: dim,
          height: dim,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        } as ViewStyle,
        variant
          ? { backgroundColor: pressed ? (variant === 'danger' ? '#fff1f2' : C.hoverBg) : 'transparent' }
          : { borderWidth: 1, borderColor: pressed ? C.border2 : C.line, backgroundColor: pressed ? C.surface2 : C.white, boxShadow: SH.sm },
        style,
      ]}
    >
      <View>
        <Icon name={icon} size={16} color={color || (variant === 'danger' ? C.rose : C.ink2)} />
      </View>
      {children}
    </Pressable>
  );
}
