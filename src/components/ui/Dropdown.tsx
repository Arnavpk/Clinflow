import React, { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Icon, T } from './Icon';
import type { IconName } from './icons';
import { IconButton } from './Button';
import { C, SH } from '../../theme/tokens';

export interface DDItem {
  label: string;
  icon: IconName;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
}

/**
 * `.dd` dropdown menu. The menu is rendered in a transparent Modal positioned under the trigger,
 * so it is never clipped by horizontally-scrolling tables (the web version used position:absolute).
 */
export function Dropdown({
  items,
  trigger,
  children,
  align = 'right',
  minWidth = 180,
  testID,
  title = 'Actions',
}: {
  items?: DDItem[];
  trigger?: (open: () => void) => React.ReactNode;
  children?: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  minWidth?: number;
  testID?: string;
  title?: string;
}) {
  const ref = useRef<React.ComponentRef<typeof View>>(null);
  const [pos, setPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const { width, height } = useWindowDimensions();

  const open = () => {
    const node = ref.current;
    if (!node || typeof node.measureInWindow !== 'function') {
      setPos({ x: width - 16, y: 80, w: 0, h: 0 });
      return;
    }
    node.measureInWindow((x: number, y: number, w: number, h: number) => setPos({ x, y, w, h }));
  };
  const close = () => setPos(null);

  const menuW = Math.min(Math.max(minWidth, 180), width - 24);
  let left = 0;
  if (pos) {
    left = align === 'right' ? pos.x + pos.w - menuW : pos.x;
    left = Math.max(12, Math.min(left, width - menuW - 12));
  }
  const top = pos ? Math.min(pos.y + pos.h + 6, height - 80) : 0;

  return (
    <View ref={ref} collapsable={false}>
      {trigger ? trigger(open) : <IconButton testID={testID} icon="more-h" variant="ghost" small title={title} onPress={open} />}
      <Modal visible={!!pos} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close menu" />
        {pos ? (
          <View style={[st.menu, { top, left, width: menuW, maxHeight: height - top - 20 }]}>
            {children
              ? children(close)
              : items?.map((it) => (
                  <Pressable
                    key={it.label}
                    testID={it.testID}
                    accessibilityRole="menuitem"
                    onPress={() => {
                      close();
                      it.onPress();
                    }}
                    style={({ pressed }) => [st.item, pressed && { backgroundColor: '#f1f5f4' }]}
                  >
                    <Icon name={it.icon} size={15} color={it.danger ? '#f43f5e' : C.placeholder} />
                    <T style={{ fontSize: 13, fontWeight: '600', color: it.danger ? C.rose : C.slate700 }}>{it.label}</T>
                  </Pressable>
                ))}
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

export const ddStyles = StyleSheet.create({
  sep: { borderTopWidth: 1, borderTopColor: C.line, margin: 6 },
});

const st = StyleSheet.create({
  menu: { position: 'absolute', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 12, boxShadow: SH.menu, padding: 6, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8 },
});
