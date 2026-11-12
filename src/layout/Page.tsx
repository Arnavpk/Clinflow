import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Redirect, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, FadeUp, Icon, T } from '../components/ui';
import { C, SH, useBp } from '../theme/tokens';
import { useStore } from '../store/AppStore';
import { patientName, visitById } from '../services/selectors';
import { ROLE_META } from '../data/constants';
import type { Role } from '../types';

/** Banner shown on the doctor dashboard while an unfinished consultation draft exists. */
function ResumeBanner() {
  const { draft, db, user, go } = useStore();
  const path = usePathname();
  if (!draft || user?.role !== 'doctor' || path !== '/doctor/dashboard') return null;
  const v = visitById(db, draft.visitId);
  if (!v || v.status === 'completed') return null;
  return (
    <Card style={{ marginBottom: 20, borderColor: '#fbbf24', backgroundColor: '#fffbeb' }} testID="resume-banner">
      <View style={{ padding: 20, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexShrink: 1 }}>
          <T style={{ fontWeight: '700' }}>Unfinished consultation draft</T>
          <T style={{ fontSize: 12, color: C.ink2 }}>{patientName(db, v.patientId) + ' · ' + v.token + ' — your unsaved entries are available.'}</T>
        </View>
        <Button label="Resume Consultation" icon="arrow-right" onPress={() => go('/consultation/' + v.id)} testID="resume-consultation" />
      </View>
    </Card>
  );
}

/**
 * `<main class="content">` — scroll container, max-width 1200, responsive padding, fade-in animation
 * and footer. `bottomBar` renders the `.stickybar` pinned at the bottom of the viewport.
 */
export function Page({ children, bottomBar, noFooter, contentStyle }: { children: React.ReactNode; bottomBar?: React.ReactNode; noFooter?: boolean; contentStyle?: StyleProp<ViewStyle> }) {
  const { sm, lg } = useBp();
  const insets = useSafeAreaInsets();
  const pad = lg ? 32 : sm ? 24 : 16;
  const [barH, setBarH] = useState(76);
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        testID="page-scroll"
      >
        <View style={[{ width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: pad, paddingTop: lg ? 32 : sm ? 28 : 24, paddingBottom: bottomBar ? barH + 44 : 24, flexGrow: 1 }, contentStyle]}>
          <FadeUp>
            <ResumeBanner />
            {children}
          </FadeUp>
        </View>
        {!noFooter ? (
          <View style={[st.footer, { paddingBottom: 16 + (bottomBar ? 0 : insets.bottom) }]}>
            <T style={{ fontSize: 12, color: C.ink3 }}>
              TriSetu CMS V1 · UI prototype — offline, mock data, FastAPI-ready service layer. Frontend restrictions are visual only; the backend will enforce authorization.
            </T>
          </View>
        ) : null}
      </ScrollView>
      {bottomBar ? (
        <View style={[st.stickyWrap, { paddingHorizontal: pad, bottom: 16 + insets.bottom }]} pointerEvents="box-none">
          <View style={st.sticky} onLayout={(e) => setBarH(e.nativeEvent.layout.height)}>{bottomBar}</View>
        </View>
      ) : null}
    </View>
  );
}

export function RestrictedView({ role }: { role: Role }) {
  const { user, go } = useStore();
  return (
    <View style={{ maxWidth: 480, alignSelf: 'center', marginVertical: 56, alignItems: 'center' }} testID="restricted">
      <View style={{ width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: '#fecdd3', backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="lock" size={26} color="#f43f5e" />
      </View>
      <T style={{ fontWeight: '800', marginTop: 14, fontSize: 18 }}>Access restricted</T>
      <T style={{ color: C.ink2, fontSize: 14, marginTop: 10, lineHeight: 22, textAlign: 'center' }}>
        This section is only available to the <T style={{ fontWeight: '700' }}>{ROLE_META[role].label}</T> account. The sidebar, actions and routes are filtered by role in the UI — the FastAPI backend will enforce the same authorization rules on every request.
      </T>
      <View style={{ marginTop: 20 }}>
        <Button label="Back to Dashboard" icon="arrow-left" onPress={() => user && go(ROLE_META[user.role].dash)} />
      </View>
    </View>
  );
}

/** Route guard — redirects to login when signed out, shows RestrictedView for the wrong role. */
export function Guard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { ready, user } = useStore();
  if (!ready) return null;
  if (!user) return <Redirect href="/login" />;
  if (!roles.includes(user.role))
    return (
      <Page>
        <RestrictedView role={roles[0]} />
      </Page>
    );
  return <>{children}</>;
}

const st = StyleSheet.create({
  footer: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 16, paddingHorizontal: 24 },
  stickyWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  sticky: {
    width: '100%',
    maxWidth: 1136,
    backgroundColor: '#fffffff7',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    boxShadow: SH.sticky,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
});