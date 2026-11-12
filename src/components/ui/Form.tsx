import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Icon, T } from './Icon';
import type { IconName } from './icons';
import { C, SH } from '../../theme/tokens';
import { MONTHS_LONG, fmtDate, iso, parseISO, todayISO } from '../../utils/format';

/* ------------------------------------------------------------------ Field */
export function Field({
  label,
  req,
  err,
  hint,
  children,
  style,
}: {
  label?: string;
  req?: boolean;
  err?: string;
  hint?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {label ? (
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
          <T style={s.lbl}>{label}</T>
          {req ? <T style={[s.lbl, { color: C.rose }]}>*</T> : null}
        </View>
      ) : null}
      {children}
      {err ? (
        <View style={s.errRow}>
          <Icon name="alert-circle" size={13} color={C.rose} />
          <T style={s.errTxt}>{err}</T>
        </View>
      ) : hint ? (
        <T style={s.hint}>{hint}</T>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ Input */
export interface InputProps extends TextInputProps {
  err?: boolean;
  lead?: IconName;
  right?: React.ReactNode;
  big?: boolean;
  rows?: number;
}

const webNoOutline: TextStyle = Platform.OS === 'web' ? ({ outlineWidth: 0 } as TextStyle) : {};

export type TextInputRef = React.ComponentRef<typeof TextInput>;
export const Input = React.forwardRef<TextInputRef, InputProps>(function Input(
  { err, lead, right, big, rows, style, multiline, onFocus, onBlur, ...rest },
  ref,
) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ justifyContent: 'center' }}>
      {lead ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 13, zIndex: 1, top: multiline ? 12 : undefined }}>
          <Icon name={lead} size={15} color={C.placeholder} />
        </View>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={C.placeholder}
        multiline={multiline}
        onFocus={(e) => {
          setFocus(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          onBlur?.(e);
        }}
        style={[
          s.input,
          webNoOutline,
          lead ? { paddingLeft: 38 } : null,
          right ? { paddingRight: 38 } : null,
          big ? { paddingVertical: 12, fontSize: 15 } : null,
          multiline ? { minHeight: Math.max(64, (rows || 3) * 22 + 20), textAlignVertical: 'top' } : null,
          focus ? s.focus : null,
          err ? { borderColor: '#fda4af' } : null,
          rest.editable === false ? { opacity: 0.6 } : null,
          style,
        ]}
        {...rest}
      />
      {right ? <View style={{ position: 'absolute', right: 8 }}>{right}</View> : null}
    </View>
  );
});

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search…',
  big,
  onSubmit,
  autoFocus,
  testID,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  big?: boolean;
  onSubmit?: () => void;
  autoFocus?: boolean;
  testID?: string;
}) {
  return (
    <Input
      testID={testID}
      lead="search"
      big={big}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoFocus={autoFocus}
      returnKeyType="search"
      onSubmitEditing={onSubmit}
      autoCapitalize="none"
      autoCorrect={false}
      right={
        value ? (
          <Pressable accessibilityLabel="Clear search" onPress={() => onChangeText('')} hitSlop={8} style={{ padding: 5, borderRadius: 8 }}>
            <Icon name="x" size={13} color={C.placeholder} />
          </Pressable>
        ) : null
      }
    />
  );
}

/* ------------------------------------------------------------------ Select */
export interface Opt {
  value: string;
  label: string;
}
const toOpts = (o: (string | Opt)[]): Opt[] => o.map((x) => (typeof x === 'string' ? { value: x, label: x } : x));

function SheetFrame({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.pickBk}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={s.pickCard}>
          {title ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.line }}>
              <T style={{ fontWeight: '800', fontSize: 14 }}>{title}</T>
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function Select({
  value,
  options,
  onChange,
  placeholder,
  err,
  title,
  testID,
  style,
}: {
  value: string;
  options: (string | Opt)[];
  onChange: (v: string) => void;
  placeholder?: string;
  err?: boolean;
  title?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [open, setOpen] = useState(false);
  const opts = useMemo(() => {
    const base = toOpts(options);
    return placeholder !== undefined ? [{ value: '', label: placeholder }, ...base] : base;
  }, [options, placeholder]);
  const cur = opts.find((o) => o.value === value);
  return (
    <>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={(title || placeholder || 'Select') + ': ' + (cur ? cur.label : '')}
        onPress={() => setOpen(true)}
        style={[s.input, s.selectBox, open ? s.focus : null, err ? { borderColor: '#fda4af' } : null, style]}
      >
        <T numberOfLines={1} style={{ flex: 1, fontSize: 14, color: cur && cur.value !== '' ? C.slate800 : C.placeholder }}>
          {cur ? cur.label : placeholder || 'Select'}
        </T>
        <Icon name="chevron-down" size={15} color={C.placeholder} />
      </Pressable>
      <SheetFrame visible={open} onClose={() => setOpen(false)} title={title || placeholder}>
        <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ padding: 6 }}>
          {opts.map((o) => {
            const on = o.value === value;
            return (
              <Pressable
                key={o.value + o.label}
                testID={testID ? testID + '-opt-' + o.value : undefined}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [s.opt, (pressed || on) && { backgroundColor: on ? C.pri50 : '#f1f5f4' }]}
              >
                <T style={{ flex: 1, fontSize: 14, fontWeight: on ? '700' : '600', color: on ? C.pri700 : C.slate700 }}>{o.label}</T>
                {on ? <Icon name="check" size={15} color={C.pri600} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </SheetFrame>
    </>
  );
}

/* ------------------------------------------------------------------ Date input (replaces <input type=date>) */
const WD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function DateInput({ value, onChange, testID, placeholder = 'dd/mm/yyyy' }: { value: string; onChange: (v: string) => void; testID?: string; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const base = parseISO(value) || new Date();
  const [cursor, setCursor] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const d = parseISO(value);
  const label = d ? fmtDate(value) : '';

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const out: (number | null)[] = Array(lead).fill(null);
    for (let i = 1; i <= days; i++) out.push(i);
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);

  const openPicker = () => {
    const b = parseISO(value) || new Date();
    setCursor({ y: b.getFullYear(), m: b.getMonth() });
    setOpen(true);
  };
  const shift = (n: number) => setCursor((c) => {
    const nd = new Date(c.y, c.m + n, 1);
    return { y: nd.getFullYear(), m: nd.getMonth() };
  });
  const today = todayISO();

  return (
    <>
      <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={'Date: ' + (label || 'not set')} onPress={openPicker} style={[s.input, s.selectBox, { paddingLeft: 38 }]}>
        <View style={{ position: 'absolute', left: 13 }}>
          <Icon name="calendar" size={15} color={C.placeholder} />
        </View>
        <T style={{ flex: 1, fontSize: 14, color: label ? C.slate800 : C.placeholder }}>{label || placeholder}</T>
      </Pressable>
      <SheetFrame visible={open} onClose={() => setOpen(false)}>
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Pressable accessibilityLabel="Previous month" onPress={() => shift(-1)} style={s.calNav}>
              <Icon name="chevron-left" size={16} />
            </Pressable>
            <T style={{ fontWeight: '800', fontSize: 14 }}>
              {MONTHS_LONG[cursor.m]} {cursor.y}
            </T>
            <Pressable accessibilityLabel="Next month" onPress={() => shift(1)} style={s.calNav}>
              <Icon name="chevron-right" size={16} />
            </Pressable>
          </View>
          <View style={s.calGrid}>
            {WD.map((w) => (
              <View key={w} style={s.calCell}>
                <T style={{ fontSize: 11, fontWeight: '800', color: C.ink3 }}>{w}</T>
              </View>
            ))}
            {cells.map((n, i) => {
              if (!n) return <View key={'e' + i} style={s.calCell} />;
              const v = iso(new Date(cursor.y, cursor.m, n));
              const on = v === value;
              const isToday = v === today;
              return (
                <Pressable
                  key={v}
                  testID={testID ? testID + '-day-' + v : undefined}
                  onPress={() => {
                    onChange(v);
                    setOpen(false);
                  }}
                  style={s.calCell}
                >
                  <View style={[s.calDay, isToday && { borderWidth: 1, borderColor: C.pri300 }, on && { backgroundColor: C.pri600 }]}>
                    <T style={{ fontSize: 13, fontWeight: on || isToday ? '800' : '600', color: on ? C.white : C.ink }}>{n}</T>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <Pressable onPress={() => { onChange(''); setOpen(false); }} style={{ padding: 8 }}>
              <T style={{ color: C.pri700, fontWeight: '700', fontSize: 13 }}>Clear</T>
            </Pressable>
            <Pressable onPress={() => { onChange(today); setOpen(false); }} style={{ padding: 8 }}>
              <T style={{ color: C.pri700, fontWeight: '700', fontSize: 13 }}>Today</T>
            </Pressable>
          </View>
        </View>
      </SheetFrame>
    </>
  );
}

/* ------------------------------------------------------------------ Checkbox / Radio */
export function Checkbox({
  checked,
  onChange,
  label,
  children,
  testID,
  style,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  children?: React.ReactNode;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}
    >
      <View style={[s.box, checked && { backgroundColor: C.pri600, borderColor: C.pri600 }]}>
        {checked ? <Icon name="check" size={12} color={C.white} /> : null}
      </View>
      {label ? <T style={{ fontSize: 13, color: C.ink2, flexShrink: 1 }}>{label}</T> : null}
      {children}
    </Pressable>
  );
}

export function Radio({ checked, onPress, label, testID }: { checked: boolean; onPress: () => void; label: string; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="radio" accessibilityState={{ checked }} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={[s.radio, checked && { borderColor: C.pri600 }]}>{checked ? <View style={s.radioDot} /> : null}</View>
      <T style={{ fontSize: 13 }}>{label}</T>
    </Pressable>
  );
}

export const formStyles = StyleSheet.create({
  /** `.fgrid` — two columns on wide screens, one column under 520px. */
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, rowGap: 16 },
  col: { paddingHorizontal: 8 },
});

const s = StyleSheet.create({
  lbl: { fontSize: 13, fontWeight: '700', color: C.ink },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  errTxt: { fontSize: 12, color: C.rose, fontWeight: '600', flexShrink: 1 },
  hint: { fontSize: 12, color: C.ink3, marginTop: 6 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: C.slate800,
    boxShadow: SH.xs,
    minHeight: 42,
  },
  focus: { borderColor: C.pri500, boxShadow: SH.focus },
  selectBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12 },
  pickBk: { flex: 1, backgroundColor: '#16261f66', justifyContent: 'center', alignItems: 'center', padding: 24 },
  pickCard: { width: '100%', maxWidth: 360, backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.line, boxShadow: SH.menu, overflow: 'hidden' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 8 },
  calNav: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, height: 38, alignItems: 'center', justifyContent: 'center' },
  calDay: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  box: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: '#94a3a8', backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#94a3a8', alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.pri600 },
});
