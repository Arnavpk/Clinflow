import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import {
  Avatar, Badge, Button, Dropdown, EmptyBox, Field, Grid, Icon, IdChip, Input, KLabel, Pulse, Select, StatusBadge, T,
} from './ui';
import { C, MONO, SH, useBp } from '../theme/tokens';
import { fmtDate } from '../utils/format';
import { useStore } from '../store/AppStore';
import { lastVisitOf, patientById } from '../services/selectors';
import { useActions } from '../hooks/useActions';
import type { Patient, Prescription, Role, Visit } from '../types';
import type { Errors, PatientForm } from '../utils/validation';
import { durationText } from '../services/medicine';
import { BLOOD_GROUPS } from '../data/constants';

/* ------------------------------------------------------------------ patient summary / card */
export function PatientSummary({ p, token, compact }: { p: Patient; token?: string | null; compact?: boolean }) {
  const { db } = useStore();
  const last = lastVisitOf(db, p.id);
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <Avatar name={p.name} size={compact ? 'md' : 'lg'} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <T style={{ fontWeight: '800', fontSize: 15 }}>{p.name}</T>
          <IdChip value={p.id} />
          {token ? <Badge tone="p" icon="hash" label={token} /> : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginTop: 6 }}>
          <T style={st.meta}>{p.age + ' yrs · ' + p.gender}</T>
          {p.bloodGroup ? <BloodBadge group={p.bloodGroup} /> : null}
          <View style={st.metaRow}>
            <Icon name="phone" size={12} color={C.ink2} />
            <T style={st.meta}>{p.mobile}</T>
          </View>
          {!compact && last ? (
            <View style={st.metaRow}>
              <Icon name="history" size={12} color={C.ink2} />
              <T style={st.meta}>{'Last visit ' + fmtDate(last.date)}</T>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function PatientCard({ p, onPress, testID }: { p: Patient; onPress: () => void; testID?: string }) {
  const { db } = useStore();
  const last = lastVisitOf(db, p.id);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={'Select ' + p.name + ' ' + p.id}
      onPress={onPress}
      style={({ pressed }) => [st.pcard, pressed && { borderColor: C.pri300, backgroundColor: C.hoverRow }]}
    >
      <Avatar name={p.name} size="sm" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <T style={{ fontWeight: '800', fontSize: 14 }}>{p.name}</T>
          <IdChip value={p.id} />
        </View>
        <T style={{ fontSize: 12, color: C.ink3, marginTop: 2 }}>
          {p.age + ' yrs · ' + p.gender + (p.bloodGroup ? ' · ' + p.bloodGroup : '') + ' · ' + p.mobile + (last ? ' · last visit ' + fmtDate(last.date) : '')}
        </T>
      </View>
      <Icon name="chevron-right" size={16} color={C.ink3} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ visit / prescription cards */
export function VisitCard({ v, from }: { v: Visit; from?: string }) {
  const { db } = useStore();
  const { rxView } = useActions();
  return (
    <View style={st.vcard}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <View style={st.metaRow}>
          <Icon name="calendar" size={14} color={C.ink2} />
          <T style={{ fontWeight: '700', fontSize: 14 }}>{fmtDate(v.date)}</T>
        </View>
        <IdChip value={v.token} />
        <View style={{ marginLeft: 'auto' }}>
          <StatusBadge status={v.status} />
        </View>
      </View>
      <Grid cols={2} gap={16} style={{ marginTop: 12 }}>
        <View>
          <KLabel>Symptoms</KLabel>
          <T style={{ marginTop: 4 }}>{v.symptoms || '—'}</T>
        </View>
        <View>
          <KLabel>Diagnosis</KLabel>
          <T style={{ marginTop: 4 }}>{v.diagnosis || '—'}</T>
        </View>
      </Grid>
      <View style={st.cardFoot}>
        <View style={st.metaRow}>
          <Icon name="stethoscope" size={13} color={C.ink3} />
          <T style={{ fontSize: 12, color: C.ink3 }}>{v.doctor || db.clinic.doctorName}</T>
        </View>
        {v.prescriptionId && from ? <Button v="s" s="xs" icon="file-text" label="View Prescription" onPress={() => rxView(v.prescriptionId!, from)} /> : null}
      </View>
    </View>
  );
}

export function RxCard({ rx, from, onReuse }: { rx: Prescription; from: string; onReuse?: () => void }) {
  const { rxView } = useActions();
  const more = rx.medicines.length - 3;
  return (
    <View style={[st.vcard, { borderRadius: 16 }]}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <IdChip value={rx.id} alt />
        <T style={{ fontWeight: '700', fontSize: 14 }}>{fmtDate(rx.date)}</T>
        {rx.followUp ? <Badge tone="a" icon="calendar" label={'Follow-up ' + fmtDate(rx.followUp)} /> : null}
      </View>
      <View style={{ marginTop: 10 }}>
        {rx.medicines.slice(0, 3).map((m, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 6 }}>
            <Icon name="pill" size={14} color={C.pri500} style={{ marginTop: 3 }} />
            <T style={{ flex: 1, fontSize: 14, color: C.slate700 }}>
              <T style={{ fontWeight: '700', color: C.slate700 }}>{m.name}</T>
              {' · ' + (m.dosage || '—') + ' · ' + (m.frequency || '—') + ' · ' + durationText(m)}
            </T>
          </View>
        ))}
        {more > 0 ? <T style={{ fontSize: 12, color: C.ink3, paddingLeft: 22, marginTop: 4 }}>{'+' + more + ' more medicine' + (more > 1 ? 's' : '')}</T> : null}
      </View>
      {rx.advice ? (
        <T numberOfLines={1} style={{ fontSize: 12, color: C.ink2, marginTop: 8, paddingLeft: 22 }}>
          {'Advice: ' + rx.advice}
        </T>
      ) : null}
      <View style={[st.cardFoot, { justifyContent: 'flex-end', gap: 8 }]}>
        <Button v="s" s="xs" icon="eye" label="View" onPress={() => rxView(rx.id, from)} />
        {onReuse ? <Button v="g" s="xs" icon="copy" label="Reuse" onPress={onReuse} /> : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ token card */
export function TokenCard({ v }: { v?: Visit }) {
  const { db } = useStore();
  const p = v ? patientById(db, v.patientId) : undefined;
  return (
    <View style={st.token}>
      <Svg style={{ position: 'absolute', bottom: -12, left: 0, width: '100%', height: 48 }} viewBox="0 0 240 40" preserveAspectRatio="none">
        <Polyline points="0,22 40,22 52,22 60,8 70,34 78,22 130,22 138,15 146,22 240,22" stroke="#57b7a41a" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {v ? <Pulse /> : <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffffff33' }} />}
        <T style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', color: '#bce5d9e0' }}>Now Serving</T>
      </View>
      <T style={{ fontFamily: MONO, fontSize: 44, fontWeight: '700', marginTop: 12, letterSpacing: -1, color: C.white, opacity: v ? 1 : 0.25 }}>{v ? v.token : '—'}</T>
      <T numberOfLines={1} style={{ fontSize: 14, color: '#bce5d99c', marginTop: 8 }}>
        {v && p ? p.name + ' · ' + p.age + ' yrs · ' + p.gender + (p.bloodGroup ? ' · ' + p.bloodGroup : '') : 'No patient in consultation'}
      </T>
    </View>
  );
}

/* ------------------------------------------------------------------ queue cards */
const QSTATUS: Record<Visit['status'], { accent: string; bg: string; border: string; label: string }> = {
  waiting: { accent: '#f59e0b', bg: C.white, border: C.line, label: 'Waiting' },
  in_consultation: { accent: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', label: 'In Consultation' },
  completed: { accent: '#10b981', bg: C.white, border: C.line, label: 'Completed' },
  cancelled: { accent: '#94a3b8', bg: C.surface2, border: C.line, label: 'Cancelled' },
};
type QFilter = 'all' | Visit['status'];

/** One patient in today's queue, shown as a card with token, patient details, status and actions. */
export function QueueCard({ v, role, from }: { v: Visit; role: Role; from: string }) {
  const { db } = useStore();
  const a = useActions();
  const p = patientById(db, v.patientId);
  const q = QSTATUS[v.status];
  const billing = <Button key="bill" v="s" s="xs" icon="receipt" label="Billing" onPress={() => a.openBilling(v.id)} testID={'q-bill-' + v.id} />;
  const open = <Button key="open" v="g" s="xs" icon="user" label="Open" onPress={() => a.qOpen(v.id)} testID={'q-open-' + v.id} />;
  const canCancel = v.status === 'waiting' || v.status === 'in_consultation';
  let btns: React.ReactNode[];
  if (v.status === 'cancelled') btns = [open];
  else if (v.status === 'completed')
    btns = [v.prescriptionId ? <Button key="rx" v="s" s="xs" icon="file-text" label="View Rx" onPress={() => a.rxView(v.prescriptionId!, from)} /> : null, billing, open];
  else if (v.status === 'in_consultation')
    btns = [role === 'doctor' ? <Button key="c" v="ok" s="xs" icon="check" label="Complete" onPress={() => a.qComplete(v.id)} testID={'q-complete-' + v.id} /> : null, billing, open];
  else btns = [role === 'doctor' ? <Button key="s" s="xs" icon="play" label="Start" onPress={() => a.qStart(v.id)} testID={'q-start-' + v.id} /> : null, billing, open];

  return (
    <View testID={'q-card-' + v.id} style={[st.qcard, { backgroundColor: q.bg, borderColor: q.border, borderLeftColor: q.accent }, v.status === 'cancelled' && { opacity: 0.75 }]}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <View style={st.qtoken}>
          <T style={{ fontFamily: MONO, fontSize: 16, fontWeight: '800', color: C.pri800 }}>{v.token}</T>
        </View>
        <View style={st.metaRow}>
          <Icon name="clock" size={13} color={C.ink3} />
          <T style={{ fontSize: 13, color: C.ink2, fontWeight: '600' }}>{v.time}</T>
        </View>
        <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <StatusBadge status={v.status} />
          {canCancel ? (
            <Dropdown testID={'q-dd-' + v.id} items={[{ label: 'Cancel Visit', icon: 'ban', danger: true, onPress: () => a.qCancel(v.id), testID: 'q-cancel-' + v.id }]} />
          ) : null}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Open ' + (p ? p.name : 'patient')}
        onPress={() => a.qOpen(v.id)}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, borderRadius: 10 }, pressed && { opacity: 0.7 }]}
      >
        <Avatar name={p ? p.name : '?'} size="md" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T style={{ fontWeight: '800', fontSize: 15, textDecorationLine: v.status === 'cancelled' ? 'line-through' : 'none' }}>{p ? p.name : 'Unknown patient'}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 4, marginTop: 4 }}>
            <IdChip value={v.patientId} />
            {p ? <T style={{ fontSize: 12, color: C.ink2 }}>{p.age + ' yrs · ' + p.gender}</T> : null}
            {p?.bloodGroup ? <BloodBadge group={p.bloodGroup} /> : null}
          </View>
        </View>
      </Pressable>
      {v.visitType === 'online' ? (
        <View style={[st.metaRow, { marginTop: 10 }]}>
          <Icon name="phone" size={12} color={C.sky} />
          <T style={{ fontSize: 12, color: C.sky, fontWeight: '600' }}>{'Online · ' + ({ whatsapp: 'WhatsApp', meet: 'Google Meet', teams: 'Microsoft Teams', '': '' } as const)[v.platform || '']}</T>
        </View>
      ) : null}
      <View style={st.qactions}>{btns}</View>
    </View>
  );
}

/**
 * Today's queue as a responsive grid of patient cards (1 column on phones, 2–3 on wider screens),
 * with status filter chips and counts.
 */
export function QueueCards({ visits, role, from, empty }: { visits: Visit[]; role: Role; from: string; empty?: React.ReactNode }) {
  const [w, setW] = useState(0);
  const [filter, setFilter] = useState<QFilter>('all');
  /* each card needs ~330px so the status, menu and actions sit on one line */
  const cols = w >= 1020 ? 3 : w >= 680 ? 2 : 1;
  const count = (f: QFilter) => (f === 'all' ? visits.length : visits.filter((v) => v.status === f).length);
  const shown = filter === 'all' ? visits : visits.filter((v) => v.status === filter);
  const chips: [QFilter, string][] = [['all', 'All'], ['waiting', 'Waiting'], ['in_consultation', 'In Consultation'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];
  if (!visits.length) return <>{empty}</>;
  return (
    <View testID="queue-cards" onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {chips.map(([k, label]) => {
          const on = filter === k;
          const dot = k === 'all' ? C.pri500 : QSTATUS[k].accent;
          return (
            <Pressable
              key={k}
              testID={'q-filter-' + k}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setFilter(k)}
              style={[st.qchip, on && { backgroundColor: C.pri600, borderColor: C.pri600 }]}
            >
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: on ? C.white : dot }} />
              <T style={{ fontSize: 12, fontWeight: '700', color: on ? C.white : C.ink2 }}>{label}</T>
              <T style={{ fontSize: 12, fontWeight: '800', color: on ? C.white : C.ink }}>{count(k)}</T>
            </Pressable>
          );
        })}
      </View>
      {shown.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 12 }}>
          {shown.map((v) => (
            <View key={v.id} style={{ width: (100 / cols + '%') as `${number}%`, paddingHorizontal: 6 }}>
              <QueueCard v={v} role={role} from={from} />
            </View>
          ))}
        </View>
      ) : (
        <EmptyBox icon="inbox" title={'No ' + QSTATUS[filter as Visit['status']].label.toLowerCase() + ' visits'} msg="Choose another filter to see the rest of today's queue." compact />
      )}
    </View>
  );
}

export function BloodBadge({ group }: { group: string }) {
  return <Badge tone="r" icon="droplet" label={group} />;
}

/* ------------------------------------------------------------------ patient form */
export function PatientFormFields({ f, set, errs }: { f: PatientForm; set: (k: keyof PatientForm, v: string) => void; errs: Errors<PatientForm> }) {
  const { narrow } = useBp();
  const half = { width: narrow ? '100%' : '50%', paddingHorizontal: 8 } as const;
  const full = { width: '100%', paddingHorizontal: 8 } as const;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, rowGap: 16 }}>
      <Field label="Full Name" req err={errs.name} style={full}>
        <Input testID="pf-name" value={f.name} onChangeText={(v) => set('name', v)} placeholder="e.g. Rahul Sharma" err={!!errs.name} />
      </Field>
      <Field label="Age" req err={errs.age} style={half}>
        <Input testID="pf-age" value={f.age} onChangeText={(v) => set('age', v.replace(/[^0-9]/g, ''))} placeholder="e.g. 34" keyboardType="number-pad" err={!!errs.age} />
      </Field>
      <Field label="Gender" req err={errs.gender} style={half}>
        <Select testID="pf-gender" value={f.gender} onChange={(v) => set('gender', v)} placeholder="Select" title="Gender" options={['Male', 'Female', 'Other']} err={!!errs.gender} />
      </Field>
      <Field label="Blood Group" err={errs.bloodGroup} hint="Optional" style={half}>
        <Select testID="pf-blood" value={f.bloodGroup} onChange={(v) => set('bloodGroup', v)} placeholder="Not known" title="Blood Group" options={BLOOD_GROUPS} />
      </Field>
      <Field label="Mobile" req err={errs.mobile} hint="10-digit number. Need not be unique." style={half}>
        <Input testID="pf-mobile" value={f.mobile} onChangeText={(v) => set('mobile', v)} placeholder="10-digit mobile" keyboardType="phone-pad" err={!!errs.mobile} />
      </Field>
      <Field label="Email" err={errs.email} hint="Optional" style={full}>
        <Input testID="pf-email" value={f.email} onChangeText={(v) => set('email', v)} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" err={!!errs.email} />
      </Field>
    </View>
  );
}

const st = StyleSheet.create({
  meta: { fontSize: 13, color: C.ink2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pcard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  vcard: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 16, backgroundColor: C.white },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.lineSoft, marginTop: 12, paddingTop: 12, flexWrap: 'wrap', gap: 8 },
  token: { overflow: 'hidden', backgroundColor: C.pri950, borderRadius: 16, padding: 24 },
  qcard: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 14, padding: 16, boxShadow: SH.card, flexGrow: 1 },
  qtoken: { borderWidth: 1, borderColor: C.pri200, backgroundColor: C.pri50, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 },
  qactions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: C.lineSoft, marginTop: 14, paddingTop: 12 },
  qchip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
});