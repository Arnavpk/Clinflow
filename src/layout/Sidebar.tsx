import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon, T } from '../components/ui';
import { C } from '../theme/tokens';
import { NAV, ROLE_META } from '../data/constants';
import { useStore } from '../store/AppStore';
import { todayISO } from '../utils/format';
import type { Role } from '../types';

export function RoleSwitch({ light }: { light?: boolean }) {
  const { user, switchRole } = useStore();
  if (!user) return null;
  return (
    <View style={[st.rswitch, light && { margin: 0, marginTop: 0, borderColor: C.line, backgroundColor: C.white }]}>
      {(['doctor', 'reception'] as Role[]).map((r) => {
        const on = user.role === r;
        return (
          <Pressable
            key={r}
            testID={(light ? 'top' : 'side') + '-role-' + r}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => (on ? undefined : switchRole(r))}
            style={[st.rbtn, light && { paddingHorizontal: 12 }, on && { backgroundColor: light ? C.pri600 : '#ffffff1a' }]}
          >
            <T style={{ fontSize: 12, fontWeight: '700', color: on ? C.white : light ? C.ink2 : '#ffffff73' }}>{ROLE_META[r].label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

function SidebarContent() {
  const { user, db, go, signOut, replace, setSidebar } = useStore();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  if (!user) return null;
  const waiting = db.visits.filter((v) => v.date === todayISO() && v.status === 'waiting').length;
  return (
    <View style={[st.sidebar, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={st.brand}>
        <View style={st.bmark}>
          <Icon name="heart-pulse" size={18} color={C.pri950} />
        </View>
        <View>
          <T style={{ fontWeight: '800', fontSize: 17, letterSpacing: -0.3, color: C.white }}>TriSetu</T>
          <T style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: '#8dd2c0aa', marginTop: 1 }}>CMS · V1</T>
        </View>
      </View>
      <RoleSwitch />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 12, paddingBottom: 16 }}>
        {NAV[user.role].map((it, i) => {
          if ('sec' in it)
            return (
              <View key={'s' + i} style={[{ paddingTop: 18, paddingHorizontal: 12, paddingBottom: 8 }, it.line && { borderTopWidth: 1, borderTopColor: '#ffffff10', marginTop: 8 }]}>
                <T style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', color: '#ffffff59' }}>{it.sec}</T>
              </View>
            );
          const on = it.m.some((m) => path === m || path.startsWith(m + '/')) || path === it.r;
          return (
            <Pressable
              key={it.r}
              testID={'nav-' + it.r}
              accessibilityRole="link"
              accessibilityState={{ selected: on }}
              onPress={() => {
                setSidebar(false);
                if (path !== it.r) go(it.r);
              }}
              style={({ pressed }) => [st.nlink, (on || pressed) && { backgroundColor: on ? '#ffffff14' : '#ffffff0d' }]}
            >
              {on ? <View style={st.indicator} /> : null}
              <Icon name={it.ic} size={17} color={on ? C.pri300 : '#ffffff66'} />
              <T style={{ fontSize: 14, fontWeight: '600', color: on ? C.white : '#ffffff8c' }}>{it.l}</T>
              {it.badge === 'waiting' && waiting > 0 ? (
                <View style={st.nbadge}>
                  <T style={{ fontSize: 11, fontWeight: '700', color: '#fcd34d' }}>{waiting}</T>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={st.suser}>
        <Avatar name={user.name} size="sm" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: C.white }}>{user.name}</T>
          <T style={{ fontSize: 11, color: '#ffffff73', textTransform: 'capitalize' }}>{user.role + ' access'}</T>
        </View>
        <Pressable
          testID="side-logout"
          accessibilityLabel="Logout"
          onPress={() => {
            signOut();
            replace('/login');
          }}
          style={({ pressed }) => [st.sout, pressed && { backgroundColor: '#ffffff1a' }]}
        >
          <Icon name="logout" size={16} color="#ffffff80" />
        </Pressable>
      </View>
    </View>
  );
}

/** Fixed sidebar on ≥1024px, slide-in drawer below that (the `.sidebar.open` + `.s-ov` behaviour). */
export function Sidebar({ drawer }: { drawer?: boolean }) {
  const { sidebar, setSidebar } = useStore();
  const x = useRef(new Animated.Value(-256)).current;
  useEffect(() => {
    if (drawer) Animated.timing(x, { toValue: sidebar ? 0 : -256, duration: 200, useNativeDriver: true }).start();
  }, [sidebar, drawer, x]);
  if (!drawer) return <SidebarContent />;
  return (
    <View pointerEvents={sidebar ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
      {sidebar ? <Pressable testID="sidebar-overlay" accessibilityLabel="Close menu" onPress={() => setSidebar(false)} style={[StyleSheet.absoluteFill, { backgroundColor: '#16261f66' }]} /> : null}
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 256, transform: [{ translateX: x }] }}>
        <SidebarContent />
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  sidebar: { width: 256, flex: 1, backgroundColor: C.pri950 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, height: 64, borderBottomWidth: 1, borderBottomColor: '#ffffff14' },
  bmark: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.pri500, alignItems: 'center', justifyContent: 'center' },
  rswitch: { marginTop: 14, marginHorizontal: 16, padding: 4, borderWidth: 1, borderColor: '#ffffff1a', backgroundColor: '#ffffff0a', borderRadius: 12, flexDirection: 'row' },
  rbtn: { flex: 1, paddingVertical: 7, borderRadius: 9, alignItems: 'center' },
  nlink: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 2 },
  indicator: { position: 'absolute', left: -12, top: '50%', marginTop: -10, width: 4, height: 20, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: C.pri400 },
  nbadge: { marginLeft: 'auto', backgroundColor: '#f59e0b26', borderWidth: 1, borderColor: '#f59e0b33', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  suser: { borderTopWidth: 1, borderTopColor: '#ffffff14', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sout: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
