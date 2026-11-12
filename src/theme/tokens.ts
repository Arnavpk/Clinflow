import { Platform, useWindowDimensions } from 'react-native';

/** Design tokens ported 1:1 from the original `:root` CSS custom properties. */
export const C = {
  pri50: '#f0faf7',
  pri100: '#d9f2ea',
  pri200: '#bce5d9',
  pri300: '#8dd2c0',
  pri400: '#57b7a0',
  pri500: '#359c85',
  pri600: '#27806c',
  pri700: '#226758',
  pri800: '#1f5349',
  pri900: '#1c463e',
  pri950: '#0c2721',
  bg: '#f4f7f6',
  line: '#e3eae7',
  lineSoft: '#e3eae780',
  ink: '#16261f',
  ink2: '#51655e',
  ink3: '#87988f',
  rose: '#e11d48',
  green: '#059669',
  amber: '#d97706',
  sky: '#0284c7',
  white: '#ffffff',
  surface2: '#f8faf9',
  slate700: '#334155',
  slate800: '#1e293b',
  placeholder: '#94a3a8',
  hoverBg: '#eef2f0',
  hoverRow: '#f0faf780',
  border2: '#cbd5d0',
  printBg: '#e9efec',
} as const;

export const MONO = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
});

/** CSS box-shadow strings — React Native (new architecture) supports `boxShadow` natively. */
export const SH = {
  xs: '0px 1px 1px #10262108',
  sm: '0px 1px 2px #1026210d',
  card: '0px 1px 2px #1026210a',
  menu: '0px 12px 30px #16261f14',
  modal: '0px 25px 60px #16261f40',
  toast: '0px 10px 30px #16261f1a',
  sticky: '0px 12px 32px #16261f14',
  sheet: '0px 8px 30px #16261f14',
  focus: '0px 0px 0px 4px #359c851a',
} as const;

/** Breakpoints used by the original media queries. */
export function useBp() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    sm: width >= 640,
    md: width >= 768,
    lg: width >= 1024,
    xl: width >= 1100,
    xxl: width >= 1200,
    narrow: width <= 520,
  };
}
