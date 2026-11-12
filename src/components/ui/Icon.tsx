import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Text as RNText, type TextProps, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';
import { IC, type IconName } from './icons';
import { C } from '../../theme/tokens';

export function Icon({ name, size = 18, color = C.ink2, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const xml = useMemo(
    () =>
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      IC[name] + '</svg>',
    [name, size],
  );
  return <SvgXml xml={xml} width={size} height={size} color={color} style={style} />;
}

/** Rotating ring used for loading buttons and loading boxes (the `.spin` keyframe). */
export function Spinner({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [rot]);
  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" color={color}>
        <Circle cx="12" cy="12" r="10" stroke={color} strokeOpacity={0.25} strokeWidth={3} />
        <Path d="M22 12a10 10 0 0 0-10-10" stroke={color} strokeWidth={3} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

/** Base text with the prototype's default body font size and ink colour. */
export function T({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={[{ fontSize: 14, color: C.ink }, style]} />;
}
