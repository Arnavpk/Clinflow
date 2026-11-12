import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Badge, Button, Card, Checkbox, Field, FadeUp, Icon, Input, T } from '../components/ui';
import { C, MONO, useBp } from '../theme/tokens';
import { DEMO_PASSWORD, DEMO_USERS, ROLE_META } from '../data/constants';
import { useStore } from '../store/AppStore';
import { todaysVisits } from '../services/selectors';
import type { Role } from '../types';

export default function LoginScreen() {
  const { db, signIn, toast, replace } = useStore();
  const { lg } = useBp();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [keep, setKeep] = useState(true);
  const [errs, setErrs] = useState<{ email?: string; pw?: string }>({});
  const [fe, setFe] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tv = todaysVisits(db);
  const waiting = tv.filter((v) => v.status === 'waiting').length;

  const fill = (r: Role) => {
    setEmail(DEMO_USERS[r].email);
    setPw(DEMO_PASSWORD);
    setErrs({});
    setFe('');
  };

  const submit = () => {
    const e: { email?: string; pw?: string } = {};
    if (!email.trim()) e.email = 'Email or mobile is required';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()) && !/^\d{10}$/.test(email.trim())) e.email = 'Enter a valid email or 10-digit mobile';
    if (!pw) e.pw = 'Password is required';
    else if (pw.length < 4) e.pw = 'Password must be at least 4 characters';
    setErrs(e);
    setFe('');
    if (Object.keys(e).length) return;
    setBusy(true);
    /* POST /auth/login — mock accepts the demo accounts (any password ≥ 4 chars, as in the prototype) */
    timer.current = setTimeout(() => {
      const u = Object.values(DEMO_USERS).find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u || pw.length < 4) {
        setBusy(false);
        setFe('Invalid email or password. Use one of the demo accounts below.');
        return;
      }
      signIn(u, keep);
      toast('success', 'Welcome back, ' + u.name.split(' ')[0], 'Signed in to the ' + ROLE_META[u.role].label.toLowerCase() + ' workspace.');
      replace(ROLE_META[u.role].dash);
    }, 900);
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.white }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[st.lform, { paddingTop: 40 + insets.top, paddingBottom: 40 + insets.bottom }]} keyboardShouldPersistTaps="handled">
          <FadeUp style={{ width: '100%', maxWidth: 420 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={st.lmark}>
                <Icon name="heart-pulse" size={22} color={C.white} />
              </View>
              <View>
                <T style={{ fontWeight: '800', fontSize: 18, letterSpacing: -0.4 }}>TriSetu</T>
                <T style={{ fontSize: 12, fontWeight: '800', color: C.ink3, letterSpacing: 1.7, marginTop: 2 }}>CLINIC MANAGEMENT · V1</T>
              </View>
            </View>
            <T style={{ fontWeight: '800', marginTop: 24, fontSize: 24, letterSpacing: -0.5 }} accessibilityRole="header">
              Sign in to your clinic
            </T>
            <T style={{ color: C.ink2, fontSize: 14, marginTop: 6 }}>Use your staff credentials. You will land on the workspace for your role.</T>
            {fe ? (
              <View style={st.lerror} testID="login-error">
                <Icon name="alert-circle" size={16} color="#be123c" />
                <T style={{ color: '#be123c', fontSize: 14, flex: 1 }}>{fe}</T>
              </View>
            ) : null}
            <View style={{ gap: 16, marginTop: 24 }}>
              <Field label="Email or Mobile" err={errs.email}>
                <Input
                  testID="login-email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="doctor@clinicflow.test"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="username"
                  err={!!errs.email}
                  returnKeyType="next"
                />
              </Field>
              <Field label="Password" err={errs.pw}>
                <Input
                  testID="login-pw"
                  value={pw}
                  onChangeText={setPw}
                  placeholder="••••••••"
                  secureTextEntry={!show}
                  autoComplete="password"
                  err={!!errs.pw}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  right={
                    <Pressable testID="toggle-pw" accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow(!show)} hitSlop={6} style={{ padding: 6, borderRadius: 8 }}>
                      <Icon name={show ? 'eye-off' : 'eye'} size={17} color={C.placeholder} />
                    </Pressable>
                  }
                />
              </Field>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <Checkbox checked={keep} onChange={setKeep} label="Keep me signed in" testID="keep-signed" />
                <Pressable onPress={() => toast('info', 'Password reset link sent', 'Check your registered email to reset your password (prototype flow).')} testID="forgot-pw">
                  <T style={{ fontSize: 13, fontWeight: '700', color: C.pri700 }}>Forgot password?</T>
                </Pressable>
              </View>
              <Button testID="login-submit" label="Sign In" s="lg" full iconRight={busy ? undefined : 'arrow-right'} loading={busy} disabled={busy} onPress={submit} />
            </View>
            <Card style={{ marginTop: 24, padding: 16, backgroundColor: C.bg }}>
              <T style={{ fontSize: 12, fontWeight: '800', color: C.ink3, letterSpacing: 1.7 }}>DEMO ACCOUNTS</T>
              <View style={{ gap: 8, marginTop: 10 }}>
                {Object.values(DEMO_USERS).map((u) => (
                  <View key={u.role} style={st.demo}>
                    <Avatar name={u.name} size="sm" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T numberOfLines={1} style={{ fontWeight: '700', fontSize: 13 }}>{u.name}</T>
                      <T numberOfLines={1} style={{ fontSize: 12, color: C.ink3 }}>{u.email}</T>
                    </View>
                    <Badge tone="p" label={ROLE_META[u.role].label} style={{ alignSelf: 'center' }} />
                    <Button v="s" s="xs" label="Use" onPress={() => fill(u.role)} testID={'login-fill-' + u.role} />
                  </View>
                ))}
              </View>
              <T style={{ fontSize: 12, color: C.ink3, marginTop: 10 }}>
                Password for both demo accounts: <T style={{ fontFamily: MONO, fontWeight: '700', color: C.ink2, fontSize: 12 }}>{DEMO_PASSWORD}</T>
              </T>
            </Card>
          </FadeUp>
        </ScrollView>
      </KeyboardAvoidingView>
      {lg ? (
        <View style={st.lside}>
          <Svg style={{ position: 'absolute', left: 0, top: '42%', width: '100%', height: 80 }} viewBox="0 0 480 80" preserveAspectRatio="none">
            <Polyline points="0,44 90,44 110,44 122,20 136,64 148,44 220,44 236,32 250,44 480,44" stroke="#57b7a340" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ backgroundColor: '#ffffff1a', padding: 8, borderRadius: 12 }}>
              <Icon name="heart-pulse" size={18} color="#bce5d9" />
            </View>
            <T style={{ fontWeight: '700', fontSize: 16, color: C.white }}>TriSetu</T>
          </View>
          <View>
            <T style={{ fontSize: 30, fontWeight: '800', letterSpacing: -0.6, lineHeight: 36, maxWidth: 440, color: C.white }}>The paper register, retired.</T>
            <T style={{ marginTop: 16, fontSize: 15, lineHeight: 24, color: '#bce5d9cc', maxWidth: 440 }}>
              Patients, queue tokens and prescriptions in one calm workflow — built for small clinics and individual doctors.
            </T>
            <View style={{ flexDirection: 'row', gap: 24, marginTop: 40, maxWidth: 440 }}>
              {[
                [db.patients.length, 'Patients registered'],
                [tv.length, 'Visits today'],
                [waiting, 'Waiting now'],
              ].map(([v, l]) => (
                <View key={String(l)} style={{ flex: 1 }}>
                  <T style={{ fontSize: 24, fontWeight: '800', color: C.white }}>{String(v)}</T>
                  <T style={{ fontSize: 12, color: '#8dd2c0cc', marginTop: 4 }}>{String(l)}</T>
                </View>
              ))}
            </View>
          </View>
          <T style={{ fontSize: 12, color: '#8dd2c09c' }}>UI prototype · Mock data · Works fully offline</T>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  lform: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  lmark: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.pri600, alignItems: 'center', justifyContent: 'center' },
  lerror: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderColor: '#fecdd3', backgroundColor: '#fff1f2', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginTop: 20 },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  lside: { flex: 1.05, backgroundColor: C.pri950, padding: 48, justifyContent: 'space-between', overflow: 'hidden' },
});
