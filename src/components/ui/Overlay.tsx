import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, T } from './Icon';
import { IconButton } from './Button';
import { C, SH, useBp } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import type { ToastType } from '../../types';
import type { IconName } from './icons';

const SIZES = { sm: 400, md: 520, lg: 672 };

/**
 * `.mbk .modal` frame — bottom sheet under 640px, centred dialog above (same as the CSS media query).
 * Toasts are re-rendered inside so they stay above the dialog, like the original z-index stack.
 */
export function ModalFrame({
  title,
  sub,
  size = 'md',
  onClose,
  children,
  footer,
  testID,
}: {
  title?: string;
  sub?: string;
  size?: keyof typeof SIZES;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
}) {
  const { sm } = useBp();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[st.bk, sm ? { justifyContent: 'center', padding: 24 } : null]}>
        <Pressable style={[StyleSheet.absoluteFill, st.ov]} onPress={onClose} accessibilityLabel="Close dialog" />
        <View testID={testID} style={[st.modal, { maxWidth: SIZES[size] }, sm ? { borderRadius: 18 } : { paddingBottom: insets.bottom }]}>
          <View style={st.head}>
            <View style={{ flex: 1 }}>
              {title ? <T style={{ fontSize: 16, fontWeight: '700' }}>{title}</T> : null}
              {sub ? <T style={{ fontSize: 13, color: C.ink2, marginTop: 2 }}>{sub}</T> : null}
            </View>
            <IconButton icon="x" variant="ghost" title="Close" onPress={onClose} />
          </View>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={[st.foot, sm ? null : { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>{footer}</View> : null}
        </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Single native Modal that hosts whichever dialog is active, so switching dialogs
 * (e.g. Register → Success → Create Visit) swaps content instead of re-presenting a native modal.
 */
export function ModalShell({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {children}
      <ToastHost />
    </Modal>
  );
}

const TOAST: Record<ToastType, [IconName, string, string]> = {
  success: ['check-circle', '#10b981', C.green],
  error: ['x-circle', '#f43f5e', '#e11d48'],
  warning: ['alert-triangle', '#f59e0b', C.amber],
  info: ['info', '#0ea5e9', C.sky],
};

/** `.toasts` stack, bottom-right (full-width on phones). */
export function ToastHost() {
  const { toasts, dismissToast } = useStore();
  const insets = useSafeAreaInsets();
  const { width, sm } = useBp();
  if (!toasts.length) return null;
  /* Phones: stack under the top bar so toasts never cover sheet footers, the sticky action bar or the header controls. */
  const pos = sm ? { bottom: 20 + insets.bottom, right: 20 } : { top: insets.top + 72, right: 20 };
  return (
    <View pointerEvents="box-none" style={[st.toasts, pos, { width: Math.min(380, width - 40) }]}>
      {toasts.map((t) => {
        const [ic, border, fg] = TOAST[t.type];
        return (
          <View key={t.id} style={[st.toast, { borderLeftColor: border }]} accessibilityLiveRegion="polite" accessibilityRole="alert">
            <Icon name={ic} size={18} color={fg} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T style={{ fontWeight: '800', fontSize: 14 }}>{t.title}</T>
              {t.msg ? <T style={{ fontSize: 13, color: C.ink2, marginTop: 2, lineHeight: 19 }}>{t.msg}</T> : null}
            </View>
            <IconButton icon="x" variant="ghost" small title="Dismiss" onPress={() => dismissToast(t.id)} />
          </View>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  bk: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  ov: { backgroundColor: '#16261f66' },
  modal: { width: '100%', backgroundColor: C.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, boxShadow: SH.modal, maxHeight: '92%', overflow: 'hidden' },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingTop: 20, paddingBottom: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: C.line },
  foot: { paddingVertical: 14, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.surface2, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12 },
  toasts: { position: 'absolute', gap: 12, zIndex: 70 },
  toast: { flexDirection: 'row', gap: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderLeftWidth: 4, borderRadius: 14, padding: 14, boxShadow: SH.toast },
});
