import { useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Avatar, Badge, Button, Card, CardHead, Checkbox, Col, EmptyBox, Field, Grid, Icon, Input, PageHead, StatusBadge, T, Table, type IconName,
} from '../components/ui';
import { Page } from '../layout/Page';
import { C, MONO, useBp } from '../theme/tokens';
import { useStore } from '../store/AppStore';
import { apiUpdateClinic, apiUpdateStaff } from '../services/api';
import { ROLE_META } from '../data/constants';
import type { BusinessPrefs, Clinic, PresetKind, Staff } from '../types';

/* ================================================================== settings home */
export function SettingsHome() {
  const { go } = useStore();
  const { sm } = useBp();
  const tile = (icon: IconName, title: string, sub: string, label: string, to: string, testID: string) => (
    <Card>
      <CardHead icon={icon} title={title} sub={sub} />
      <View style={{ padding: 20 }}>
        <Button icon="arrow-right" label={label} onPress={() => go(to)} testID={testID} />
      </View>
    </Card>
  );
  return (
    <Page>
      <PageHead title="Settings" sub="Configure your clinic and prescription workflow." />
      <Grid cols={sm ? 2 : 1}>
        {tile('building', 'Clinic Settings', 'Clinic details, doctor identity, address, timings and logo', 'Open Clinic Settings', '/settings/clinic', 'open-clinic')}
        {tile('file-text', 'Prescription Settings', 'Suggestion templates, symptoms and diagnosis presets', 'Open Prescription Settings', '/settings/prescription', 'open-rx-settings')}
        {tile('receipt', 'Consultation, Billing & Diagnostics', 'Visit options, fees, payment policy and diagnostic communication', 'Open Consultation Settings', '/settings/consultation', 'open-biz')}
      </Grid>
    </Page>
  );
}

/* ================================================================== clinic */
export function ClinicSettings() {
  const { db, mutate, toast, go } = useStore();
  const { sm, lg, narrow } = useBp();
  const [f, setF] = useState<Clinic>(() => ({ ...db.clinic }));
  const dirty = JSON.stringify(f) !== JSON.stringify(db.clinic);
  const set = (k: keyof Clinic, v: string | null) => setF((x) => ({ ...x, [k]: v }));
  const pick = async () => {
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast('warning', 'Photo access needed', 'Allow photo library access to upload a clinic logo.');
        return;
      }
    }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    set('logo', a.base64 ? 'data:' + (a.mimeType || 'image/jpeg') + ';base64,' + a.base64 : a.uri);
  };
  const half = { width: narrow ? '100%' : '50%', paddingHorizontal: 8 } as const;
  const full = { width: '100%', paddingHorizontal: 8 } as const;
  return (
    <Page>
      <PageHead
        title="Clinic Settings"
        sub="Clinic identity used across the app and on printed prescriptions."
        actions={<Button v="s" icon="arrow-left" label="Back to Settings" onPress={() => go('/settings')} />}
      />
      <Grid weights={lg ? [2, 1] : undefined} gap={20}>
        <Card>
          <CardHead icon="building" title="Clinic Information" />
          <View style={{ padding: 20, flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, rowGap: 16 }}>
            <Field label="Clinic Name" req style={half}>
              <Input testID="set-name" value={f.name} onChangeText={(v) => set('name', v)} />
            </Field>
            <Field label="Doctor Name" req style={half}>
              <Input testID="set-doctor" value={f.doctorName} onChangeText={(v) => set('doctorName', v)} />
            </Field>
            <Field label="Phone" style={half}>
              <Input value={f.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
            </Field>
            <Field label="Consultation Timings" style={half}>
              <Input value={f.timings} onChangeText={(v) => set('timings', v)} />
            </Field>
            <Field label="Address" style={full}>
              <Input multiline rows={2} value={f.address} onChangeText={(v) => set('address', v)} />
            </Field>
            <Field label="Registration Number" hint={'Printed under the doctor’s name on prescriptions.'} style={full}>
              <Input value={f.regNo} onChangeText={(v) => set('regNo', v)} />
            </Field>
          </View>
        </Card>
        <Card>
          <CardHead icon="heart-pulse" title="Clinic Logo" />
          <View style={{ padding: 20 }}>
            <View style={st.logoBox}>
              {f.logo ? <Image source={{ uri: f.logo }} style={{ width: '100%', height: '100%' }} accessibilityLabel="Clinic logo" /> : <Icon name="heart-pulse" size={34} color={C.pri600} />}
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Button v="s" s="sm" icon="download" label="Upload" onPress={pick} testID="set-pick" />
              {f.logo ? <Button v="g" s="sm" icon="trash" label="Remove" onPress={() => set('logo', null)} testID="set-rm" /> : null}
            </View>
            <T style={{ fontSize: 12, color: C.ink3, marginTop: 14, lineHeight: 19 }}>
              Square images work best. The logo shows on the prescription header; without one, the TriSetu mark is used.
            </T>
          </View>
        </Card>
      </Grid>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
        <Button v="g" icon="refresh" label="Reset" onPress={() => { setF({ ...db.clinic }); toast('info', 'Changes discarded', 'Restored to the last saved values.'); }} testID="set-reset" />
        <Button
          icon="save"
          label="Save Changes"
          disabled={!dirty || !f.name.trim() || !f.doctorName.trim()}
          testID="set-save"
          onPress={() => {
            mutate((d) => apiUpdateClinic(d, f));
            toast('success', 'Clinic settings saved', 'These details appear on every printed prescription.');
          }}
        />
      </View>
      {sm ? null : <View style={{ height: 8 }} />}
    </Page>
  );
}

/* ================================================================== prescription settings */
function SettingTile({ title, sub, icon, to, count, testID }: { title: string; sub: string; icon: IconName; to: string; count: string; testID: string }) {
  const { go } = useStore();
  return (
    <Card style={{ flex: 1 }}>
      <View style={{ padding: 20, flex: 1, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name={icon} size={22} color={C.pri600} />
          <View style={{ flex: 1 }}>
            <T style={{ fontSize: 15, fontWeight: '700', marginBottom: 5 }}>{title}</T>
            <T style={{ fontSize: 12, color: C.ink2 }}>{sub}</T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <T style={{ fontSize: 12, color: C.ink2 }}>{count}</T>
          <Button icon="arrow-right" label="Manage" onPress={() => go(to)} testID={testID} />
        </View>
      </View>
    </Card>
  );
}

export function PrescriptionSettings() {
  const { prefs, go } = useStore();
  const { sm } = useBp();
  return (
    <Page>
      <PageHead
        title="Prescription Settings"
        sub="Select a settings card to configure that feature."
        crumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Prescription Settings' }]}
        actions={<Button v="s" icon="arrow-left" label="Back to Settings" onPress={() => go('/settings')} />}
      />
      <Grid cols={sm ? 2 : 1}>
        <SettingTile title="Suggestion Templates" sub="Turn quick suggestions on or off" icon="settings" to="/settings/prescription/suggestions" count={prefs.suggestions ? 'Enabled' : 'Disabled'} testID="manage-suggestions" />
        <SettingTile
          title="Symptoms & Diagnosis Presets"
          sub="Manage the symptom and diagnosis libraries together"
          icon="activity"
          to="/settings/prescription/presets"
          count={prefs.symptoms.length + ' symptoms · ' + prefs.diagnosis.length + ' diagnoses'}
          testID="manage-presets"
        />
      </Grid>
    </Page>
  );
}

export function SuggestionSettings() {
  const { prefs, updatePrefs, go } = useStore();
  return (
    <Page>
      <PageHead
        title="Suggestion Templates"
        sub="Control quick suggestions during consultations."
        actions={<Button v="s" icon="arrow-left" label="Back to Prescription Settings" onPress={() => go('/settings/prescription')} />}
      />
      <Card style={{ padding: 20 }}>
        <Checkbox checked={prefs.suggestions} onChange={(v) => updatePrefs((p) => { p.suggestions = v; })} testID="tri-suggest">
          <View style={{ flexShrink: 1 }}>
            <T style={{ fontWeight: '700' }}>Enable prescription suggestions</T>
            <T style={{ fontSize: 12, color: C.ink2 }}>Doctors can always enter symptoms and diagnoses manually.</T>
          </View>
        </Checkbox>
      </Card>
    </Page>
  );
}

/** One preset library (symptoms or diagnoses) with add, rename, remove and enable/disable. */
function PresetSection({ kind, view }: { kind: PresetKind; view: 'cards' | 'list' }) {
  const { prefs, updatePrefs, toast, openModal } = useStore();
  const [name, setName] = useState('');
  const title = kind === 'diagnosis' ? 'Diagnosis' : 'Symptoms';
  const arr = prefs[kind] || [];
  const enabled = arr.filter((x) => x.enabled).length;
  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (arr.some((x) => x.name.toLowerCase() === n.toLowerCase())) {
      toast('warning', 'Already exists', 'This preset already exists.');
      return;
    }
    updatePrefs((p) => { p[kind].push({ name: n, enabled: true }); });
    setName('');
  };
  const rename = (i: number) =>
    openModal({
      type: 'prompt',
      title: 'Rename preset',
      label: 'Rename preset:',
      value: arr[i].name,
      onSubmit: (v) => {
        const n = v.trim();
        if (!n) return;
        if (arr.some((x, j) => j !== i && x.name.toLowerCase() === n.toLowerCase())) {
          toast('warning', 'Duplicate preset', 'Use a unique name.');
          return;
        }
        updatePrefs((p) => { p[kind][i].name = n; });
      },
    });
  const remove = (i: number) =>
    openModal({
      type: 'confirm',
      tone: 'danger',
      label: 'Remove',
      title: 'Remove ' + arr[i].name + '?',
      msg: 'Remove ' + arr[i].name + ' from ' + title.toLowerCase() + ' suggestions?',
      onConfirm: () => updatePrefs((p) => { p[kind].splice(i, 1); }),
    });
  const toggle = (i: number, v: boolean) => updatePrefs((p) => { p[kind][i].enabled = v; });
  const actions = (i: number) => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button v="s" s="xs" label="Rename" onPress={() => rename(i)} testID={'preset-rename-' + kind + '-' + i} />
      <Button v="s" s="xs" label="Remove" onPress={() => remove(i)} testID={'preset-remove-' + kind + '-' + i} />
    </View>
  );
  return (
    <Card testID={'preset-section-' + kind}>
      <CardHead icon={kind === 'diagnosis' ? 'activity' : 'clipboard'} title={title} sub={arr.length + ' presets · ' + enabled + ' enabled'} />
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Input testID={'preset-new-' + kind} value={name} onChangeText={setName} placeholder={kind === 'diagnosis' ? 'New diagnosis…' : 'New symptom…'} onSubmitEditing={add} />
          </View>
          <Button label="+ Add" onPress={add} testID={'preset-add-' + kind} />
        </View>
        {!arr.length ? (
          <EmptyBox icon="inbox" title="No presets" msg="Add a preset to start offering suggestions." compact />
        ) : view === 'cards' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {arr.map((x, i) => (
              <View key={x.name + i} style={st.presetItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <T style={{ fontWeight: '700', flexShrink: 1, color: x.enabled ? C.ink : C.ink3 }}>{x.name}</T>
                  <Checkbox checked={x.enabled} onChange={(v) => toggle(i, v)} label="Enabled" testID={'preset-toggle-' + kind + '-' + i} />
                </View>
                <View style={{ marginTop: 12 }}>{actions(i)}</View>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {arr.map((x, i) => (
              <View key={x.name + i} style={st.presetRow}>
                <Checkbox checked={x.enabled} onChange={(v) => toggle(i, v)} style={{ flexShrink: 1 }} testID={'preset-toggle-' + kind + '-' + i}>
                  <T style={{ color: x.enabled ? C.ink : C.ink3, flexShrink: 1 }}>{x.name}</T>
                </Checkbox>
                {actions(i)}
              </View>
            ))}
          </View>
        )}
      </View>
    </Card>
  );
}

/** Symptoms and diagnosis preset libraries managed together on one page. */
export function PresetsScreen() {
  const { go } = useStore();
  const { xl } = useBp();
  const [view, setView] = useState<'cards' | 'list'>('list');
  return (
    <Page>
      <PageHead
        title="Symptoms & Diagnosis Presets"
        sub="Add, rename, remove, enable or disable the suggestions shown in the consultation editor."
        crumbs={[{ label: 'Settings', href: '/settings' }, { label: 'Prescription Settings', href: '/settings/prescription' }, { label: 'Symptoms & Diagnosis' }]}
        actions={
          <>
            <Button v={view === 'cards' ? 'p' : 's'} label="Card View" onPress={() => setView('cards')} testID="preset-card-view" />
            <Button v={view === 'list' ? 'p' : 's'} label="List View" onPress={() => setView('list')} testID="preset-list-view" />
            <Button v="s" icon="arrow-left" label="Back" onPress={() => go('/settings/prescription')} />
          </>
        }
      />
      <Grid weights={xl ? [1, 1] : undefined} gap={20}>
        <PresetSection kind="symptoms" view={view} />
        <PresetSection kind="diagnosis" view={view} />
      </Grid>
    </Page>
  );
}

/* ================================================================== consultation / billing / diagnostics */
export function BusinessSettings() {
  const { biz, updateBiz, go } = useStore();
  const { sm } = useBp();
  const num = (k: keyof BusinessPrefs) => (v: string) => updateBiz({ [k]: Math.max(0, Number(v.replace(/[^0-9.]/g, '')) || 0) } as Partial<BusinessPrefs>);
  const txt = (k: keyof BusinessPrefs) => (v: string) => updateBiz({ [k]: v } as Partial<BusinessPrefs>);
  const chk = (k: keyof BusinessPrefs, label: string) => (
    <Checkbox checked={!!biz[k]} onChange={(v) => updateBiz({ [k]: v } as Partial<BusinessPrefs>)} label={label} testID={'biz-' + k} />
  );
  const hint = (s: string) => <T style={{ fontSize: 12, color: C.ink3 }}>{s}</T>;
  return (
    <Page>
      <PageHead
        title="Consultation, Billing & Diagnostics"
        sub="Configure visit options, fees, payment policy and diagnostic communication."
        actions={<Button v="s" label="Back to Settings" onPress={() => go('/settings')} />}
      />
      <Grid cols={sm ? 2 : 1}>
        <Card>
          <CardHead title="Consultation preferences" />
          <View style={{ padding: 20, gap: 12 }}>
            {chk('onlineEnabled', 'Enable online visits')}
            {hint('When disabled, Create Visit goes directly to the existing offline flow.')}
            {chk('prepay', 'Require payment before online consultation')}
            {hint('Payment confirmation is a simulated workflow until a gateway is connected.')}
          </View>
        </Card>
        <Card>
          <CardHead title="Payment & patient messaging" />
          <View style={{ padding: 20, gap: 12 }}>
            {chk('offlinePaymentsEnabled', 'Enable offline visit payments')}
            {chk('onlinePaymentsEnabled', 'Enable online visit payments')}
            <Field label="Clinic messaging contact (India)">
              <Input testID="biz-messagingNumber" keyboardType="phone-pad" value={biz.messagingNumber} onChangeText={txt('messagingNumber')} />
            </Field>
            {hint('This number is shown as the clinic contact in patient messages. WhatsApp and SMS buttons open the device messaging application; automatic sending needs a connected provider.')}
          </View>
        </Card>
        <Card>
          <CardHead title="Consultation fees (₹)" />
          <View style={{ padding: 20, gap: 12 }}>
            {([['offlineFee', 'Offline consultation'], ['onlineFee', 'Online consultation'], ['followupFee', 'Follow-up consultation']] as const).map(([k, n]) => (
              <Field key={k} label={n}>
                <Input testID={'biz-' + k} keyboardType="number-pad" value={String(biz[k])} onChangeText={num(k)} />
              </Field>
            ))}
          </View>
        </Card>
        <Card>
          <CardHead title="Diagnostics provider" />
          <View style={{ padding: 20, gap: 12 }}>
            {chk('diagnosticsEnabled', 'Enable diagnostic requests')}
            {([['providerName', 'Lab / diagnostic centre name', 'default'], ['providerEmail', 'Lab email', 'email-address'], ['providerWhatsApp', 'Lab WhatsApp number (country code)', 'phone-pad']] as const).map(([k, n, kb]) => (
              <Field key={k} label={n}>
                <Input testID={'biz-' + k} value={String(biz[k])} onChangeText={txt(k)} placeholder={n} keyboardType={kb} autoCapitalize="none" />
              </Field>
            ))}
            {hint('Sending email or opening WhatsApp does not confirm a booking.')}
          </View>
        </Card>
        <Card>
          <CardHead title="Payment and marketing integrations" />
          <View style={{ padding: 20, gap: 12 }}>
            {hint('Payment gateway: not connected. Funds cannot be collected through this prototype.')}
            {hint('Justdial partnership: planned; no live booking or advertising API is connected.')}
            {hint('Google Meet / Teams meeting creation: paste a generated meeting link for now. WhatsApp opens a chat to coordinate the call.')}
          </View>
        </Card>
      </Grid>
    </Page>
  );
}

/* ================================================================== staff */
export function StaffScreen() {
  const { db, openModal, mutate, toast } = useStore();
  const toggle = (s: Staff) => {
    const deact = s.status === 'active';
    openModal({
      type: 'confirm',
      tone: deact ? 'danger' : 'primary',
      label: deact ? 'Deactivate' : 'Activate',
      title: (deact ? 'Deactivate ' : 'Activate ') + s.name + '?',
      msg: deact ? 'This account will no longer be able to sign in. Patient records are not affected.' : 'This account will be able to sign in to the reception workspace again.',
      onConfirm: () => {
        mutate((d) => apiUpdateStaff(d, s.id, { status: deact ? 'inactive' : 'active' }));
        toast('success', 'Staff ' + (deact ? 'deactivated' : 'activated'), s.name);
      },
    });
  };
  const cols: Col<Staff>[] = [
    { key: 'name', title: 'Name', w: 180, render: (s) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Avatar name={s.name} size="sm" /><T style={{ fontWeight: '700', flexShrink: 1 }}>{s.name}</T></View> },
    { key: 'desig', title: 'Designation', w: 176, render: (s) => (s.designation ? <Badge tone="p" icon="idcard" label={s.designation} /> : <T style={{ color: C.ink3 }}>—</T>) },
    { key: 'email', title: 'Email', w: 190, render: (s) => <T style={{ color: C.ink2 }}>{s.email}</T> },
    { key: 'mobile', title: 'Mobile', w: 120, render: (s) => <T style={{ fontFamily: MONO, fontSize: 13, color: C.ink2 }}>{s.mobile}</T> },
    { key: 'st', title: 'Status', w: 110, render: (s) => <StatusBadge status={s.status} /> },
    {
      key: 'act', title: 'Actions', w: 200, align: 'right',
      render: (s) => (
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
          <Button v="s" s="xs" icon="edit" label="Edit" onPress={() => openModal({ type: 'staffEdit', id: s.id })} testID={'staff-edit-' + s.id} />
          <Button
            v={s.status === 'active' ? 'g' : 'ok'}
            s="xs"
            icon={s.status === 'active' ? 'ban' : 'check'}
            label={s.status === 'active' ? 'Deactivate' : 'Activate'}
            onPress={() => toggle(s)}
            testID={'staff-toggle-' + s.id}
          />
        </View>
      ),
    },
  ];
  return (
    <Page>
      <PageHead
        title="Staff"
        sub="Manage staff accounts. Only doctors can access this page."
        actions={<Button icon="user-plus" label="Add Staff" onPress={() => openModal({ type: 'staffAdd' })} testID="staff-add" />}
      />
      <Card>
        <Table
          cols={cols}
          rows={db.staff}
          rowKey={(s) => s.id}
          testID="staff-table"
          empty={<EmptyBox icon="idcard" title="No staff members" msg="Add your first staff account." action={<Button icon="user-plus" label="Add Staff" onPress={() => openModal({ type: 'staffAdd' })} />} />}
        />
      </Card>
    </Page>
  );
}

/* ================================================================== profile */
export function ProfileScreen() {
  const { user, db, signOut, replace, toast } = useStore();
  const { sm } = useBp();
  const [pw, setPw] = useState({ c: '', n: '', f: '' });
  const [pe, setPe] = useState<{ c?: string; n?: string; f?: string }>({});
  if (!user) return null;
  const save = () => {
    const e: { c?: string; n?: string; f?: string } = {};
    if (!pw.c) e.c = 'Enter your current password';
    if (pw.n.length < 6) e.n = 'New password must be at least 6 characters';
    if (pw.f !== pw.n) e.f = 'Passwords do not match';
    setPe(e);
    if (Object.keys(e).length) return;
    setPw({ c: '', n: '', f: '' });
    toast('success', 'Password updated', 'Use the new password next time you sign in.');
  };
  return (
    <Page>
      <PageHead title="My Profile" sub="Your account details and security." />
      <Grid cols={sm ? 2 : 1}>
        <Card>
          <CardHead icon="user" title="Account" />
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Avatar name={user.name} size="xl" />
              <View style={{ flexShrink: 1 }}>
                <T style={{ fontWeight: '800', fontSize: 18 }}>{user.name}</T>
                <View style={{ marginTop: 6 }}>
                  <Badge tone="p" icon="shield" label={ROLE_META[user.role].label + ' access'} />
                </View>
              </View>
            </View>
            <View style={{ gap: 12, marginTop: 20, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 20 }}>
              {([['mail', user.email], ['phone', user.mobile], ['building', db.clinic.name]] as const).map(([ic, t]) => (
                <View key={ic} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name={ic} size={15} color={C.ink2} />
                  <T style={{ color: C.ink2 }}>{t}</T>
                </View>
              ))}
            </View>
            <View style={{ marginTop: 20, flexDirection: 'row' }}>
              <Button v="d" icon="logout" label="Sign Out" onPress={() => { signOut(); replace('/login'); }} testID="profile-signout" />
            </View>
          </View>
        </Card>
        <Card>
          <CardHead icon="lock" title="Change Password" />
          <View style={{ padding: 20, gap: 16 }}>
            <Field label="Current Password" err={pe.c}>
              <Input testID="pw-c" secureTextEntry value={pw.c} onChangeText={(v) => setPw((x) => ({ ...x, c: v }))} err={!!pe.c} />
            </Field>
            <Field label="New Password" err={pe.n}>
              <Input testID="pw-n" secureTextEntry value={pw.n} onChangeText={(v) => setPw((x) => ({ ...x, n: v }))} err={!!pe.n} />
            </Field>
            <Field label="Confirm New Password" err={pe.f}>
              <Input testID="pw-f" secureTextEntry value={pw.f} onChangeText={(v) => setPw((x) => ({ ...x, f: v }))} err={!!pe.f} />
            </Field>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button icon="save" label="Update Password" onPress={save} testID="pw-save" />
            </View>
          </View>
        </Card>
      </Grid>
    </Page>
  );
}

const st = StyleSheet.create({
  logoBox: { width: 96, height: 96, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  presetItem: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 16, backgroundColor: C.white, flexGrow: 1, flexBasis: 220 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
});