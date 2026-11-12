import { Pressable, StyleSheet, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Crumbs, Dropdown, Icon, IconButton, T, ddStyles, toneColors, type Crumb, type IconName, type Tone } from '../components/ui';
import { C, SH, useBp } from '../theme/tokens';
import { ROLE_META } from '../data/constants';
import { useStore } from '../store/AppStore';
import { patientById, patientName, rxById, visitById } from '../services/selectors';
import { todayISO } from '../utils/format';
import { RoleSwitch } from './Sidebar';
import type { Db, User } from '../types';

function topCrumbs(p: string, db: Db, u: User): Crumb[] {
  if (p.startsWith('/patients/')) {
    const pt = patientById(db, p.split('/')[2]);
    return [{ label: 'Patients', href: '/patients' }, { label: pt ? pt.name : 'Patient' }];
  }
  if (p.startsWith('/consultation/')) {
    const v = visitById(db, p.split('/')[2]);
    return [{ label: 'Visits', href: '/visits' }, { label: 'Consultation' + (v ? ' · ' + v.token : '') }];
  }
  if (p.startsWith('/prescriptions/new')) return [{ label: 'Prescriptions', href: '/prescriptions' }, { label: 'New Prescription' }];
  if (p.startsWith('/prescriptions/')) {
    const rx = rxById(db, p.split('/')[2]);
    return u.role === 'doctor'
      ? [{ label: 'Prescriptions', href: '/prescriptions' }, { label: rx ? rx.id : 'Prescription' }]
      : [{ label: 'Patient', href: rx ? '/patients/' + rx.patientId : '/patients' }, { label: 'Prescription' + (rx ? ' · ' + rx.id : '') }];
  }
  const S = { label: 'Settings', href: '/settings' };
  const PS = { label: 'Prescription Settings', href: '/settings/prescription' };
  const map: Record<string, Crumb[]> = {
    '/patients': [{ label: 'Patients' }],
    '/visits': [{ label: 'Visits' }],
    '/queue': [{ label: 'Visits' }],
    '/profile': [{ label: 'Profile' }],
    '/settings': [{ label: 'Settings' }],
    '/settings/clinic': [S, { label: 'Clinic Settings' }],
    '/settings/prescription': [S, { label: 'Prescription Settings' }],
    '/settings/prescription/suggestions': [S, PS, { label: 'Suggestion Templates' }],
    '/settings/prescription/presets': [S, PS, { label: 'Symptoms & Diagnosis' }],
    '/settings/consultation': [S, { label: 'Consultation Settings' }],
    '/settings/staff': [{ label: 'Staff' }],
    '/reception/desk': [{ label: 'Dashboard', href: '/reception/dashboard' }, { label: 'Reception Desk' }],
    '/reception/dashboard': [{ label: 'Dashboard' }],
    '/doctor/dashboard': [{ label: 'Dashboard' }],
  };
  return map[p] || [{ label: ROLE_META[u.role].label + ' Workspace' }];
}

export function Topbar() {
  const { user, db, notifRead, setNotifRead, setSidebar, go, signOut, replace } = useStore();
  const path = usePathname();
  const { lg, sm } = useBp();
  const insets = useSafeAreaInsets();
  if (!user) return null;
  const t = todayISO();
  const waiting = db.visits.filter((v) => v.date === t && v.status === 'waiting');
  const current = db.visits.find((v) => v.date === t && v.status === 'in_consultation');
  const notifs: { ic: IconName; tone: Tone; txt: string }[] = [
    ...(current ? [{ ic: 'play' as IconName, tone: 's' as Tone, txt: current.token + ' — ' + patientName(db, current.patientId) + ' is in consultation' }] : []),
    ...waiting.slice(0, 3).map((v) => ({ ic: 'clock' as IconName, tone: 'a' as Tone, txt: v.token + ' · ' + patientName(db, v.patientId) + ' is waiting' })),
    { ic: 'check-circle', tone: 'g', txt: db.visits.filter((v) => v.date === t && v.status === 'completed').length + ' visits completed today' },
  ];
  return (
    <View style={[st.bar, { paddingTop: insets.top, height: 64 + insets.top, paddingHorizontal: sm ? 24 : 16 }]}>
      {!lg ? <IconButton testID="hamburger" icon="menu" variant="ghost" title="Menu" onPress={() => setSidebar(true)} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Crumbs items={topCrumbs(path, db, user)} style={{ flexWrap: 'nowrap' }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {sm ? <RoleSwitch light /> : null}
        <Dropdown
          minWidth={300}
          trigger={(open) => (
            <IconButton testID="notif-btn" icon="bell" title="Notifications" onPress={open}>
              {!notifRead ? <View style={st.dot} /> : null}
            </IconButton>
          )}
        >
          {() => (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10 }}>
                <T style={{ fontWeight: '800', fontSize: 13 }}>Notifications</T>
                <Pressable testID="notif-read" onPress={() => setNotifRead(true)}>
                  <T style={{ fontSize: 11, fontWeight: '700', color: C.pri700 }}>Mark all read</T>
                </Pressable>
              </View>
              <View style={ddStyles.sep} />
              {notifs.map((n, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10 }}>
                  <View style={[st.nic, { backgroundColor: toneColors[n.tone].bg, borderColor: toneColors[n.tone].bd }]}>
                    <Icon name={n.ic} size={13} color={toneColors[n.tone].fg} />
                  </View>
                  <T style={{ fontSize: 13, lineHeight: 19, flex: 1, color: C.slate700 }}>{n.txt}</T>
                </View>
              ))}
            </View>
          )}
        </Dropdown>
        <Dropdown
          trigger={(open) => (
            <Pressable testID="user-menu" accessibilityLabel="Account menu" onPress={open} style={({ pressed }) => [st.userBtn, pressed && { backgroundColor: C.surface2 }]}>
              <Avatar name={user.name} size="xs" />
              <Icon name="chevron-down" size={14} />
            </Pressable>
          )}
        >
          {(close) => (
            <View>
              <View style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
                <T style={{ fontWeight: '800', fontSize: 13 }}>{user.name}</T>
                <T style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>{user.email}</T>
              </View>
              <View style={ddStyles.sep} />
              <MenuItem icon="user" label="My Profile" onPress={() => { close(); go('/profile'); }} />
              <MenuItem
                icon="logout"
                label="Logout"
                danger
                testID="menu-logout"
                onPress={() => {
                  close();
                  signOut();
                  replace('/login');
                }}
              />
            </View>
          )}
        </Dropdown>
      </View>
    </View>
  );
}

function MenuItem({ icon, label, onPress, danger, testID }: { icon: IconName; label: string; onPress: () => void; danger?: boolean; testID?: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [st.mi, pressed && { backgroundColor: '#f1f5f4' }]}>
      <Icon name={icon} size={15} color={danger ? '#f43f5e' : C.placeholder} />
      <T style={{ fontSize: 13, fontWeight: '600', color: danger ? C.rose : C.slate700 }}>{label}</T>
    </Pressable>
  );
}

const st = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffffe6', borderBottomWidth: 1, borderBottomColor: C.line, zIndex: 30 },
  dot: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: C.rose, borderWidth: 2, borderColor: C.white },
  nic: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  userBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingLeft: 4, paddingRight: 10, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, boxShadow: SH.sm },
  mi: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8 },
});