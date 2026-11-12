import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text as RNText, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, Spinner, T } from './Icon';
import type { IconName } from './icons';
import { Button } from './Button';
import { C, MONO, SH, useBp } from '../../theme/tokens';
import { initials } from '../../utils/format';
import { useStore } from '../../store/AppStore';

/* ------------------------------------------------------------------ badges */
export type Tone = 'gray' | 'p' | 'a' | 'g' | 's' | 'r';
const TONES: Record<Tone, { bg: string; bd: string; fg: string }> = {
  gray: { bg: '#f1f5f4', bd: '#e2e8e6', fg: '#51655e' },
  p: { bg: C.pri50, bd: C.pri100, fg: C.pri700 },
  a: { bg: '#fffbeb', bd: '#fde68a', fg: '#b45309' },
  g: { bg: '#ecfdf5', bd: '#a7f3d0', fg: '#047857' },
  s: { bg: '#f0f9ff', bd: '#bae6fd', fg: '#0369a1' },
  r: { bg: '#fff1f2', bd: '#fecdd3', fg: '#be123c' },
};
export const toneColors = TONES;

export function Badge({ tone = 'gray', label, icon, style }: { tone?: Tone; label: string; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  const t = TONES[tone];
  return (
    <View style={[st.badge, { backgroundColor: t.bg, borderColor: t.bd }, style]}>
      {icon ? <Icon name={icon} size={11} color={t.fg} /> : null}
      <T style={{ fontSize: 11, fontWeight: '700', color: t.fg }} numberOfLines={1}>
        {label}
      </T>
    </View>
  );
}

const STATUS: Record<string, { label: string; bg: string; bd: string; fg: string; dot: string }> = {
  waiting: { label: 'Waiting', bg: '#fffbeb', bd: '#fde68a', fg: '#b45309', dot: '#f59e0b' },
  in_consultation: { label: 'In Consultation', bg: '#f0f9ff', bd: '#bae6fd', fg: '#0369a1', dot: '#0ea5e9' },
  completed: { label: 'Completed', bg: '#ecfdf5', bd: '#a7f3d0', fg: '#047857', dot: '#10b981' },
  active: { label: 'Active', bg: '#ecfdf5', bd: '#a7f3d0', fg: '#047857', dot: '#10b981' },
  cancelled: { label: 'Cancelled', bg: '#f1f5f4', bd: '#e2e8e6', fg: '#64748b', dot: '#94a3b8' },
  inactive: { label: 'Inactive', bg: '#f1f5f4', bd: '#e2e8e6', fg: '#64748b', dot: '#94a3b8' },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] || STATUS.cancelled;
  return (
    <View style={[st.status, { backgroundColor: s.bg, borderColor: s.bd }]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.dot }} />
      <T style={{ fontSize: 11, fontWeight: '600', color: s.fg }} numberOfLines={1}>
        {STATUS[status]?.label || status}
      </T>
    </View>
  );
}

export function IdChip({ value, alt }: { value: string; alt?: boolean }) {
  return (
    <View style={[st.idchip, alt && { borderColor: C.line, backgroundColor: C.surface2 }]}>
      <T style={{ fontFamily: MONO, fontSize: 12, fontWeight: '600', color: alt ? C.ink2 : C.pri800 }} numberOfLines={1}>
        {value}
      </T>
    </View>
  );
}
export function TokChip({ value }: { value: string }) {
  return (
    <View style={[st.idchip, { paddingVertical: 4, paddingHorizontal: 8 }]}>
      <T style={{ fontFamily: MONO, fontSize: 13, fontWeight: '700', color: C.pri800 }}>{value}</T>
    </View>
  );
}

const AV_TONES = [
  ['#d9f2ea', '#226758'],
  ['#e0f2fe', '#0369a1'],
  ['#fef3c7', '#b45309'],
  ['#ffe4e6', '#be123c'],
  ['#ede9fe', '#6d28d9'],
  ['#d1fae5', '#047857'],
];
const AV_SIZES = { xs: [28, 10], sm: [34, 12], md: [40, 14], lg: [46, 15], xl: [62, 20] } as const;
export function Avatar({ name, size = 'md' }: { name: string; size?: keyof typeof AV_SIZES }) {
  const tone = [...String(name || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0) % 6;
  const [dim, fs] = AV_SIZES[size];
  return (
    <View style={{ width: dim, height: dim, borderRadius: dim / 2, backgroundColor: AV_TONES[tone][0], alignItems: 'center', justifyContent: 'center' }}>
      <T style={{ fontSize: fs, fontWeight: '700', color: AV_TONES[tone][1] }}>{initials(name)}</T>
    </View>
  );
}

/* ------------------------------------------------------------------ cards */
export function Card({ children, style, testID }: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <View testID={testID} style={[st.card, style]}>
      {children}
    </View>
  );
}
export function CardHead({ icon, title, sub, right }: { icon?: IconName; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={st.cardH}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1, minWidth: 0 }}>
        {icon ? <Icon name={icon} size={17} color={C.pri600} /> : null}
        <View style={{ flexShrink: 1 }}>
          <T style={{ fontSize: 14, fontWeight: '800' }}>{title}</T>
          {sub ? <T style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{sub}</T> : null}
        </View>
      </View>
      {right}
    </View>
  );
}
export const CardBody = ({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[{ padding: 20 }, style]}>{children}</View>;

const STAT_TONES = { p: [C.pri50, C.pri600], s: ['#e0f2fe', C.sky], a: ['#fef3c7', C.amber], g: ['#d1fae5', C.green] } as const;
export type StatTone = keyof typeof STAT_TONES;
export function StatIcon({ icon, tone = 'p', size = 40 }: { icon: IconName; tone?: StatTone; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: STAT_TONES[tone][0], alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={size > 36 ? 18 : 17} color={STAT_TONES[tone][1]} />
    </View>
  );
}
export function StatCard({
  label, value, sub, icon, tone = 'p', dark, mono, loading,
}: { label: string; value: string | number | null; sub?: string; icon: IconName; tone?: StatTone; dark?: boolean; mono?: boolean; loading?: boolean }) {
  return (
    <View style={[st.stat, dark && { backgroundColor: C.pri950, borderColor: C.pri950 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <T style={{ fontSize: 13, fontWeight: '600', color: dark ? '#bce5d9e6' : C.ink2 }}>{label}</T>
        {dark ? (
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff1a', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={18} color={C.pri200} />
          </View>
        ) : (
          <StatIcon icon={icon} tone={tone} />
        )}
      </View>
      <T style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 10, color: dark ? C.white : C.ink, fontFamily: mono ? MONO : undefined }}>
        {loading || value == null ? '—' : String(value)}
      </T>
      {sub ? (
        <T numberOfLines={1} style={{ fontSize: 12, color: dark ? '#8dd2c0cc' : C.ink3, marginTop: 4 }}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ notes / states */
const NOTE_TONES = {
  sky: { bg: '#f0f9ff', bd: '#bae6fd', fg: '#0c4a6e', ic: C.sky },
  amber: { bg: '#fffbeb', bd: '#fde68a', fg: '#78350f', ic: C.amber },
  pri: { bg: C.pri50, bd: C.pri200, fg: C.pri900, ic: C.pri600 },
};
export function Note({ tone, icon, children, style }: { tone: keyof typeof NOTE_TONES; icon: IconName; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = NOTE_TONES[tone];
  return (
    <View style={[st.note, { backgroundColor: t.bg, borderColor: t.bd }, style]}>
      <Icon name={icon} size={16} color={t.ic} style={{ marginTop: 2 }} />
      <T style={{ flex: 1, fontSize: 13, lineHeight: 20, color: t.fg }}>{children}</T>
    </View>
  );
}
/** Bold run inside a Note / paragraph. */
export const B = ({ children, mono }: { children: React.ReactNode; mono?: boolean }) => (
  <RNText style={{ fontWeight: '700', fontFamily: mono ? MONO : undefined }}>{children}</RNText>
);

export function EmptyBox({ icon = 'inbox', title, msg, action, compact }: { icon?: IconName; title: string; msg?: string; action?: React.ReactNode; compact?: boolean }) {
  const d = compact ? 44 : 56;
  return (
    <View style={{ paddingVertical: compact ? 22 : 44, paddingHorizontal: compact ? 16 : 24, alignItems: 'center' }}>
      <View style={{ width: d, height: d, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={compact ? 20 : 24} color={C.placeholder} />
      </View>
      <T style={{ marginTop: compact ? 10 : 14, fontSize: compact ? 14 : 15, fontWeight: '700', textAlign: 'center' }}>{title}</T>
      {msg ? <T style={{ marginTop: 6, fontSize: 13, color: C.ink2, maxWidth: 340, lineHeight: 20, textAlign: 'center' }}>{msg}</T> : null}
      {action ? <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'center', gap: 12 }}>{action}</View> : null}
    </View>
  );
}
export function LoadingBox({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 44 }}>
      <Spinner size={18} color={C.pri600} />
      <T style={{ color: C.ink2, fontSize: 14, fontWeight: '600' }}>{label}</T>
    </View>
  );
}
export function ErrBox({ title, msg, retry, onRetry }: { title: string; msg: string; retry?: string; onRetry?: () => void }) {
  return (
    <View style={{ paddingVertical: 44, paddingHorizontal: 24, alignItems: 'center' }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#fecdd3', backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="alert-triangle" size={24} color="#f43f5e" />
      </View>
      <T style={{ marginTop: 14, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>{title}</T>
      <T style={{ marginTop: 6, fontSize: 13, color: C.ink2, maxWidth: 380, lineHeight: 20, textAlign: 'center' }}>{msg}</T>
      {retry ? (
        <View style={{ marginTop: 16 }}>
          <Button v="s" icon="refresh" label={retry} onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ crumbs / page head */
export interface Crumb {
  label: string;
  href?: string;
}
export function Crumbs({ items, style }: { items: Crumb[]; style?: StyleProp<ViewStyle> }) {
  const { go } = useStore();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }, style]}>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 ? <Icon name="chevron-right" size={12} color={C.ink3} /> : null}
            {it.href && !last ? (
              <Pressable onPress={() => go(it.href!)} hitSlop={6}>
                <T style={{ fontSize: 13, color: C.ink3, fontWeight: '600' }}>{it.label}</T>
              </Pressable>
            ) : (
              <T numberOfLines={1} style={{ fontSize: 13, flexShrink: 1, color: last ? C.ink : C.ink3, fontWeight: last ? '700' : '400' }}>
                {it.label}
              </T>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export function PageHead({ title, sub, crumbs, actions }: { title: string; sub?: string; crumbs?: Crumb[]; actions?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
      <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 200 }}>
        {crumbs && crumbs.length ? <Crumbs items={crumbs} style={{ marginBottom: 8 }} /> : null}
        <T style={{ fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }} accessibilityRole="header">
          {title}
        </T>
        {sub ? <T style={{ fontSize: 14, color: C.ink2, marginTop: 4 }}>{sub}</T> : null}
      </View>
      {actions ? <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>{actions}</View> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ tabs / stepper */
export function Tabs<K extends string>({ tabs, value, onChange }: { tabs: { key: K; label: string; count?: number }[]; value: K; onChange: (k: K) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }} style={{ borderBottomWidth: 1, borderBottomColor: C.line }}>
      {tabs.map((t) => {
        const on = t.key === value;
        return (
          <Pressable key={t.key} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(t.key)} style={[st.tab, on && { borderBottomColor: C.pri600 }]}>
            <T style={{ fontSize: 14, fontWeight: '700', color: on ? C.pri700 : C.ink2 }}>{t.label}</T>
            {t.count != null ? (
              <View style={st.tabCnt}>
                <T style={{ fontSize: 11, color: C.ink2 }}>{t.count}</T>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const { lg } = useBp();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }}>
      {steps.map((label, i) => {
        const done = i < current;
        const on = i === current;
        return (
          <React.Fragment key={label}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={[
                  st.stepDot,
                  done && { backgroundColor: C.pri600, borderColor: C.pri600 },
                  on && { borderWidth: 2, borderColor: C.pri600 },
                ]}
              >
                {done ? <Icon name="check" size={13} color={C.white} /> : <T style={{ fontSize: 12, fontWeight: '700', color: on ? C.pri700 : C.ink3 }}>{i + 1}</T>}
              </View>
              <T style={{ fontSize: 12, fontWeight: '700', color: done || on ? C.ink : C.ink3 }}>{label}</T>
            </View>
            {i < steps.length - 1 ? <View style={[st.stepLine, { width: lg ? 48 : 36 }, done && { backgroundColor: C.pri500 }]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ grids */
/**
 * Responsive grid. `cols` is the column count; `weights` gives fractional columns (e.g. [2,1] for 2fr 1fr).
 * Collapses to a single column when `stack` is true.
 */
export function Grid({ cols = 1, weights, gap = 16, stack, children, style }: { cols?: number; weights?: number[]; gap?: number; stack?: boolean; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const kids = React.Children.toArray(children).filter(Boolean);
  if (stack || (!weights && cols <= 1)) return <View style={[{ gap }, style]}>{kids}</View>;
  if (weights) {
    return (
      <View style={[{ flexDirection: 'row', gap, alignItems: 'flex-start' }, style]}>
        {kids.map((k, i) => (
          <View key={i} style={{ flex: weights[i] ?? 1, minWidth: 0 }}>
            {k}
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gap / 2, rowGap: gap }, style]}>
      {kids.map((k, i) => (
        <View key={i} style={{ width: `${100 / cols}%`, paddingHorizontal: gap / 2 }}>
          {k}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ animation helpers */
/** `.anim` fadeUp — runs once when a screen mounts. */
export function FadeUp({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [a]);
  return <Animated.View style={[{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }, style]}>{children}</Animated.View>;
}

/** Live "now serving" pulse dot (`.pulse` ping keyframe). */
export function Pulse() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(a, { toValue: 1, duration: 1600, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <View style={{ width: 10, height: 10 }}>
      <Animated.View
        style={{
          position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#34d399',
          opacity: a.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 0, 0] }),
          transform: [{ scale: a.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 2.4, 2.4] }) }],
        }}
      />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#34d399' }} />
    </View>
  );
}

export const KLabel = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={style}>
    <T style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, color: C.ink3 }}>{children}</T>
  </View>
);

export const Divider = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[{ height: 1, backgroundColor: C.line }, style]} />;

const st = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, borderWidth: 1, paddingVertical: 2, paddingHorizontal: 10, alignSelf: 'flex-start' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  idchip: { borderRadius: 8, borderWidth: 1, borderColor: C.pri100, backgroundColor: C.pri50, paddingVertical: 2, paddingHorizontal: 8, alignSelf: 'flex-start' },
  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 16, boxShadow: SH.card },
  cardH: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.line },
  stat: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 20, boxShadow: SH.card, overflow: 'hidden' },
  note: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 20 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabCnt: { backgroundColor: '#f1f5f4', borderWidth: 1, borderColor: C.line, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, marginLeft: 6 },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  stepLine: { height: 2, backgroundColor: C.line, marginHorizontal: 12, borderRadius: 2 },
});
