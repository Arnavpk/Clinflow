import { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Avatar, Badge, Button, Card, Col, DateInput, Dropdown, EmptyBox, ErrBox, Field, Icon, IconButton, IdChip, Input, KLabel, Note, PageHead, SearchInput, Select, T, Table, B,
} from '../components/ui';
import { PatientSummary } from '../components/domain';
import { Page } from '../layout/Page';
import { C, MONO, SH, useBp } from '../theme/tokens';
import { useStore } from '../store/AppStore';
import { useActions } from '../hooks/useActions';
import { apiSavePrescription } from '../services/api';
import { openVisitToday, patientById, rxById } from '../services/selectors';
import { durationText } from '../services/medicine';
import { exportPdf, prescriptionHtml, printHtml } from '../services/print';
import { FREQS, UNITS, emptyMed } from '../data/constants';
import { fmtDate, todayISO } from '../utils/format';
import type { BuilderDraft, DraftRx, EditMed, Prescription } from '../types';

/* ================================================================== list */
export function PrescriptionsScreen() {
  const { db, user, go } = useStore();
  const a = useActions();
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const rows = db.prescriptions
    .filter((rx) => {
      const p = patientById(db, rx.patientId);
      return !ql || rx.id.toLowerCase().includes(ql) || (!!p && (p.name.toLowerCase().includes(ql) || p.id.toLowerCase().includes(ql)));
    })
    .slice()
    .sort((x, y) => y.date.localeCompare(x.date));
  const cols: Col<Prescription>[] = [
    {
      key: 'id', title: 'Prescription', w: 130,
      render: (rx) => (
        <View>
          <IdChip value={rx.id} />
          <T style={{ fontSize: 12, color: C.ink3, marginTop: 4 }}>{fmtDate(rx.date)}</T>
        </View>
      ),
    },
    {
      key: 'pt', title: 'Patient', w: 200,
      render: (rx) => {
        const p = patientById(db, rx.patientId);
        return p ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Avatar name={p.name} size="sm" />
            <View style={{ flexShrink: 1 }}>
              <T style={{ fontWeight: '700' }} numberOfLines={1}>{p.name}</T>
              <T style={{ fontSize: 12, color: C.ink3 }}>{p.id}</T>
            </View>
          </View>
        ) : <T>—</T>;
      },
    },
    {
      key: 'm', title: 'Medicines', w: 170,
      render: (rx) => <T numberOfLines={2} style={{ color: C.ink2 }}>{rx.medicines.length + ' · ' + (rx.medicines[0] ? rx.medicines[0].name : '') + (rx.medicines.length > 1 ? ' +' + (rx.medicines.length - 1) : '')}</T>,
    },
    { key: 'adv', title: 'Advice', w: 220, render: (rx) => <T numberOfLines={1} style={{ color: C.ink2, maxWidth: 220 }}>{rx.advice || '—'}</T> },
    { key: 'fu', title: 'Follow-up', w: 130, render: (rx) => (rx.followUp ? <Badge tone="a" label={fmtDate(rx.followUp)} /> : <T style={{ color: C.ink3 }}>—</T>) },
    {
      key: 'act', title: '', w: 60, align: 'right',
      render: (rx) => (
        <Dropdown
          testID={'rx-dd-' + rx.id}
          items={[
            { label: 'View Prescription', icon: 'eye', onPress: () => a.rxView(rx.id, '/prescriptions'), testID: 'rx-view-' + rx.id },
            { label: 'Reuse into New', icon: 'copy', onPress: () => a.rxReuse(rx.id, rx.patientId), testID: 'rx-reuse-' + rx.id },
            { label: 'Open Patient', icon: 'user', onPress: () => go('/patients/' + rx.patientId) },
          ]}
        />
      ),
    },
  ];
  return (
    <Page>
      <PageHead title="Prescriptions" sub={'All prescriptions issued at ' + db.clinic.name + ' · signed in as ' + (user?.name || '')} />
      <Card>
        <View style={{ paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <View style={{ maxWidth: 420 }}>
            <SearchInput testID="rx-q" value={q} onChangeText={setQ} placeholder="Search by Rx ID, patient name or Patient ID…" />
          </View>
        </View>
        <Table
          cols={cols}
          rows={rows}
          rowKey={(r) => r.id}
          testID="rx-table"
          empty={<EmptyBox icon="pill" title="No prescriptions found" msg={ql ? 'Nothing matches “' + q + '”.' : 'Prescriptions you save during consultations will appear here.'} />}
        />
      </Card>
    </Page>
  );
}

/* ================================================================== builder */
function MedRow({ m, i, canDelete, onChange, onDelete }: { m: EditMed; i: number; canDelete: boolean; onChange: (k: keyof EditMed, v: string) => void; onDelete: () => void }) {
  const { md } = useBp();
  const cell = (span: number): ViewStyle => (md ? { width: `${(span / 12) * 100}%`, paddingHorizontal: 6 } : { width: span >= 4 ? '100%' : '50%', paddingHorizontal: 6 });
  return (
    <View style={st.medrow}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <T style={st.medT}>{'Medicine ' + String(i + 1).padStart(2, '0')}</T>
        <IconButton icon="trash" variant="danger" small title="Remove medicine" disabled={!canDelete} onPress={onDelete} testID={'bld-del-' + i} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, rowGap: 12 }}>
        <Field label="Medicine Name" style={cell(4)}>
          <Input testID={'bld-name-' + i} value={m.name} onChangeText={(v) => onChange('name', v)} placeholder="e.g. Paracetamol" />
        </Field>
        <Field label="Dosage" style={cell(2)}>
          <Input testID={'bld-dose-' + i} value={m.dosage} onChangeText={(v) => onChange('dosage', v)} placeholder="500 mg" />
        </Field>
        <Field label="Frequency" style={cell(2)}>
          <Select testID={'bld-freq-' + i} value={m.frequency} onChange={(v) => onChange('frequency', v)} options={FREQS} title="Frequency" />
        </Field>
        <Field label="Duration" style={cell(2)}>
          <Input testID={'bld-dur-' + i} value={m.duration} onChangeText={(v) => onChange('duration', v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholder="3" />
        </Field>
        <Field label="Time Unit" style={cell(2)}>
          <Select testID={'bld-unit-' + i} value={m.unit} onChange={(v) => onChange('unit', v)} options={UNITS} title="Time Unit" />
        </Field>
      </View>
    </View>
  );
}

export function PrescriptionBuilderScreen({ patientId, fromRx }: { patientId?: string; fromRx?: string }) {
  const { db, user, mutate, toast, go, handoff } = useStore();
  const p = patientById(db, patientId);
  const template = fromRx ? rxById(db, fromRx) : undefined;
  const [b, setB] = useState<BuilderDraft>(() => {
    if (handoff.current.bldSnap) {
      const s = handoff.current.bldSnap;
      handoff.current.bldSnap = null;
      return s;
    }
    return {
      meds: template ? template.medicines.map((m) => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration === '' ? '' : String(m.duration), unit: m.unit })) : [emptyMed()],
      advice: template ? template.advice || '' : '',
      followUp: '',
    };
  });
  const [busy, setBusy] = useState(false);
  if (!p)
    return (
      <Page>
        <Card>
          <ErrBox title="Patient not found" msg="This prescription builder needs a valid patient." retry="Back to Prescriptions" onRetry={() => go('/prescriptions')} />
        </Card>
      </Page>
    );
  const named = b.meds.filter((m) => m.name.trim());
  const todayV = openVisitToday(db, p.id);
  const toMeds = () => named.map((m) => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration ? +m.duration : ('' as const), unit: m.unit }));
  const warn = () => toast('warning', 'Add at least one medicine', 'A prescription needs at least one medicine with a name.');
  const preview = () => {
    if (!named.length) return warn();
    handoff.current.bldSnap = JSON.parse(JSON.stringify(b));
    handoff.current.draftRx = { id: null, patientId: p.id, doctor: user?.name || '', date: todayISO(), medicines: toMeds(), advice: b.advice.trim(), followUp: b.followUp || null };
    handoff.current.draftReturn = '/prescriptions/new?patient=' + p.id + (fromRx ? '&from=' + fromRx : '');
    handoff.current.autoPrint = false;
    go('/prescriptions/preview');
  };
  const save = () => {
    if (!named.length) return warn();
    setBusy(true);
    setTimeout(() => {
      const { rx } = mutate((d) =>
        apiSavePrescription(
          d,
          { patientId: p.id, visitId: todayV ? todayV.id : null, symptoms: todayV?.symptoms || '', diagnosis: todayV?.diagnosis || '', medicines: toMeds(), advice: b.advice.trim(), followUp: b.followUp || null },
          false,
          user?.name || db.clinic.doctorName,
        ),
      );
      setBusy(false);
      toast('success', 'Prescription ' + rx.id + ' created', 'Saved to ' + p.name + '’s history as a brand-new prescription.');
      go('/patients/' + p.id);
    }, 350);
  };
  const setMed = (i: number, k: keyof EditMed, v: string) => setB((x) => ({ ...x, meds: x.meds.map((m, j) => (j === i ? { ...m, [k]: v } : m)) }));
  const bar = (
    <>
      <T style={{ marginRight: 'auto', fontSize: 12, color: C.ink3, flexShrink: 1 }} testID="bld-sum">
        {named.length + ' medicine(s) · will attach to ' + (todayV ? 'today’s visit ' + todayV.token : 'the patient record')}
      </T>
      <Button v="s" icon="printer" label="Preview" onPress={preview} testID="bld-preview" />
      <Button icon="save" label="Save Prescription" loading={busy} onPress={save} testID="bld-save" />
    </>
  );
  return (
    <Page bottomBar={bar}>
      <PageHead
        title="New Prescription"
        crumbs={[{ label: 'Prescriptions', href: '/prescriptions' }, { label: 'New Prescription' }]}
        sub={template ? 'Prefilled from ' + template.id + ' (' + fmtDate(template.date) + ')' : 'Issued by ' + (user?.name || '')}
        actions={<Button v="s" icon="arrow-left" label="Cancel" onPress={() => go(template ? '/patients/' + p.id : '/prescriptions')} />}
      />
      {template ? (
        <Note tone="sky" icon="info">
          This editor was prefilled from prescription <B mono>{template.id}</B>. Saving will create a <B>brand-new prescription</B> — the previous one stays untouched in the patient’s history.
        </Note>
      ) : null}
      <Card style={{ padding: 20 }}>
        <PatientSummary p={p} token={todayV ? todayV.token : null} />
      </Card>
      <Card style={{ marginTop: 20, padding: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="pill" size={17} color={C.pri600} />
            <T style={{ fontWeight: '800', fontSize: 14 }}>Medicines</T>
            <Badge tone="p" label={named.length + ' added'} />
          </View>
          <Button v="s" s="sm" icon="plus" label="Add Medicine" onPress={() => setB((x) => ({ ...x, meds: [...x.meds, emptyMed()] }))} testID="bld-add" />
        </View>
        <View style={{ gap: 12 }}>
          {b.meds.map((m, i) => (
            <MedRow
              key={i}
              m={m}
              i={i}
              canDelete={b.meds.length > 1}
              onChange={(k, v) => setMed(i, k, v)}
              onDelete={() => setB((x) => {
                const meds = x.meds.filter((_, j) => j !== i);
                return { ...x, meds: meds.length ? meds : [emptyMed()] };
              })}
            />
          ))}
        </View>
        <Field label="Advice" hint="General instructions printed on the prescription." style={{ marginTop: 20 }}>
          <Input testID="bld-advice" multiline rows={3} value={b.advice} onChangeText={(v) => setB((x) => ({ ...x, advice: v }))} placeholder="e.g. Take plenty of fluids. Rest for 2 days." />
        </Field>
        <Field label="Follow-up Date" hint="Optional" style={{ marginTop: 14 }}>
          <DateInput testID="bld-followup" value={b.followUp} onChange={(v) => setB((x) => ({ ...x, followUp: v }))} />
        </Field>
      </Card>
    </Page>
  );
}

/* ================================================================== view / A4 sheet */
export function PrescriptionViewScreen({ rxId, from }: { rxId: string; from?: string }) {
  const { db, user, go, toast, handoff } = useStore();
  const { sm } = useBp();
  const insets = useSafeAreaInsets();
  const isDraft = rxId === 'preview';
  const rx: DraftRx | undefined = isDraft ? handoff.current.draftRx || undefined : rxById(db, rxId);
  const auto = useRef(handoff.current.autoPrint);
  const p = rx ? patientById(db, rx.patientId) || { name: 'Unknown', id: rx.patientId, age: '—' as unknown as number, gender: '—', bloodGroup: '' } : undefined;
  const cl = db.clinic;

  const doPrint = async () => {
    if (!rx || !p) return;
    const ok = await printHtml(prescriptionHtml(rx, p, cl));
    if (!ok) toast('error', 'Unable to print', 'The print service is not available on this device.');
  };
  const doPdf = async () => {
    if (!rx || !p) return;
    const r = await exportPdf(prescriptionHtml(rx, p, cl), 'Prescription ' + (rx.id || 'draft'));
    if (r === 'printed') toast('info', 'Opening print dialog', 'Choose “Save as PDF” as the destination to export the file.');
    if (r === 'failed') toast('error', 'PDF export failed', 'The PDF could not be generated on this device.');
  };

  useEffect(() => {
    const mode = auto.current;
    handoff.current.autoPrint = false;
    if (!mode) return;
    const t = setTimeout(() => (mode === 'pdf' ? doPdf() : doPrint()), mode === 'pdf' ? 400 : 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!rx || !p)
    return (
      <View style={[st.prwrap, { paddingTop: 40 + insets.top }]}>
        <Card style={{ maxWidth: 640, width: '100%', alignSelf: 'center' }}>
          <ErrBox
            title="Prescription not found"
            msg="This prescription does not exist or the draft has expired."
            retry="Back"
            onRetry={() => user && go(user.role === 'doctor' ? '/doctor/dashboard' : '/reception/dashboard')}
          />
        </Card>
      </View>
    );
  const backTo = isDraft ? handoff.current.draftReturn || '/visits' : from || (user?.role === 'doctor' ? '/prescriptions' : '/patients/' + rx.patientId);
  const meds = rx.medicines || [];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.printBg }} contentContainerStyle={[st.prwrap, { paddingTop: 32 + insets.top, paddingBottom: 32 + insets.bottom }]}>
      <View style={st.prbar}>
        <Button v="s" icon="arrow-left" label="Back" onPress={() => go(backTo)} testID="rxv-back" />
        <View style={{ flexGrow: 1, flexBasis: 160 }}>
          <T style={{ fontWeight: '800', fontSize: 14 }}>
            Prescription · <T style={{ fontFamily: MONO, fontWeight: '800', fontSize: 14 }}>{rx.id || 'Draft'}</T>
          </T>
          <T style={{ fontSize: 12, color: C.ink3 }}>A4 print-ready layout</T>
        </View>
        {isDraft ? <Badge tone="a" label="Unsaved draft" style={{ alignSelf: 'center' }} /> : null}
        <Button v="s" icon="printer" label="Print" onPress={doPrint} testID="rxv-print" />
        <Button icon="download" label="Generate PDF" onPress={doPdf} testID="rxv-pdf" />
      </View>
      <View style={[st.sheet, { padding: sm ? 48 : 28 }]} testID="rx-sheet">
        <View style={[st.shHead, { flexWrap: sm ? 'nowrap' : 'wrap' }]}>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start', flexShrink: 1 }}>
            <View style={st.logo}>
              {cl.logo ? <Image source={{ uri: cl.logo }} style={{ width: '100%', height: '100%' }} accessibilityLabel="Clinic logo" /> : <Icon name="heart-pulse" size={26} color={C.white} />}
            </View>
            <View style={{ flexShrink: 1 }}>
              <T style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>{cl.name}</T>
              <T style={st.clP}>{cl.address}</T>
              <T style={st.clP}>{cl.phone + ' · ' + cl.timings}</T>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <T style={{ fontSize: 34, fontWeight: '700', color: C.pri700, fontFamily: 'Georgia', lineHeight: 36 }}>℞</T>
            <T style={{ fontWeight: '700', fontSize: 14, marginTop: 6 }}>{rx.doctor || cl.doctorName}</T>
            <T style={{ fontSize: 12, color: C.ink3 }}>{'Reg. No. ' + cl.regNo}</T>
          </View>
        </View>
        <View style={st.shPt}>
          {[
            ['Patient Name', p.name, false],
            ['Patient ID', p.id, true],
            ['Age / Gender', String(p.age) + ' yrs · ' + p.gender, false],
            ['Blood Group', p.bloodGroup || '—', false],
            ['Date', fmtDate(rx.date), false],
          ].map(([k, v, mono]) => (
            <View key={String(k)} style={{ width: sm ? '20%' : '50%', paddingRight: 12 }}>
              <KLabel>{String(k)}</KLabel>
              <T numberOfLines={2} style={{ fontSize: 14, fontWeight: '700', marginTop: 2, fontFamily: mono ? MONO : undefined }}>{String(v)}</T>
            </View>
          ))}
        </View>
        {meds.length ? (
          <ScrollView horizontal={!sm} scrollEnabled={!sm} showsHorizontalScrollIndicator={false} style={{ marginTop: 24 }} contentContainerStyle={sm ? { flexGrow: 1 } : undefined}>
            <View style={{ width: sm ? '100%' : 560 }}>
              <View style={[st.shRow, { borderBottomWidth: 2, borderBottomColor: '#e2e8e6' }]}>
                <T style={[st.shTh, { width: 36 }]}>#</T>
                <T style={[st.shTh, { flex: 2 }]}>Medicine</T>
                <T style={[st.shTh, { flex: 1 }]}>Dosage</T>
                <T style={[st.shTh, { flex: 1 }]}>Frequency</T>
                <T style={[st.shTh, { flex: 1, textAlign: 'right', paddingRight: 0 }]}>Duration</T>
              </View>
              {meds.map((m, i) => (
                <View key={i} style={[st.shRow, { paddingVertical: 12 }]}>
                  <T style={{ width: 36, fontFamily: MONO, fontSize: 12, color: C.ink3 }}>{String(i + 1).padStart(2, '0')}</T>
                  <View style={{ flex: 2, paddingRight: 12 }}>
                    <T style={{ fontWeight: '700' }}>{m.name}</T>
                    {m.mealTiming || m.instructions ? <T style={{ fontSize: 12, color: C.ink2, marginTop: 2 }}>{[m.mealTiming, m.instructions].filter(Boolean).join(' · ')}</T> : null}
                  </View>
                  <T style={{ flex: 1, paddingRight: 12 }}>{m.dosage || '—'}</T>
                  <T style={{ flex: 1, paddingRight: 12 }}>{m.frequency || '—'}</T>
                  <T style={{ flex: 1, textAlign: 'right' }}>{durationText(m)}</T>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={st.noMeds}>
            <T style={{ fontSize: 12, color: C.ink3, textAlign: 'center' }}>No medicines recorded on this prescription.</T>
          </View>
        )}
        {rx.advice ? (
          <View style={{ marginTop: 28 }}>
            <KLabel>Advice</KLabel>
            <View style={{ marginTop: 8, borderLeftWidth: 2, borderLeftColor: C.pri200, paddingLeft: 16 }}>
              <T style={{ fontSize: 14, lineHeight: 22, color: C.slate700 }}>{rx.advice}</T>
            </View>
          </View>
        ) : null}
        {rx.followUp ? (
          <View style={st.fu}>
            <Icon name="calendar" size={15} color="#92400e" />
            <T style={{ fontSize: 13, fontWeight: '700', color: '#92400e' }}>{'Follow-up: ' + fmtDate(rx.followUp)}</T>
          </View>
        ) : null}
        <View style={st.shFoot}>
          <T style={{ fontSize: 12, color: C.ink3, maxWidth: 240, lineHeight: 19, flexShrink: 1 }}>{'Computer-generated prescription · TriSetu CMS V1\n' + fmtDate(rx.date)}</T>
          <View style={st.sign}>
            <T style={{ fontWeight: '700', fontSize: 14, textAlign: 'center' }}>{rx.doctor || cl.doctorName}</T>
            <T style={{ fontSize: 12, color: C.ink3, textAlign: 'center' }}>{cl.name}</T>
          </View>
        </View>
      </View>
      <T style={{ textAlign: 'center', fontSize: 12, color: C.ink3, maxWidth: 794, alignSelf: 'center', marginTop: 16 }}>
        {isDraft ? 'This is an unsaved preview. Use “Back” to return and save the prescription.' : 'Use Print to send the A4 sheet to a printer, or Generate PDF to save or share it.'}
      </T>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  medrow: { borderWidth: 1, borderColor: C.line, backgroundColor: '#f8faf980', borderRadius: 14, padding: 16 },
  medT: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase', color: C.ink3 },
  prwrap: { paddingHorizontal: 16, flexGrow: 1, backgroundColor: C.printBg },
  prbar: { width: '100%', maxWidth: 794, alignSelf: 'center', marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  sheet: { width: '100%', maxWidth: 794, alignSelf: 'center', backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 16, boxShadow: SH.sheet },
  shHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 24, borderBottomWidth: 2, borderBottomColor: C.pri700, paddingBottom: 24 },
  logo: { width: 56, height: 56, borderRadius: 14, backgroundColor: C.pri600, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  clP: { fontSize: 13, color: C.ink2, marginTop: 4, lineHeight: 19 },
  shPt: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12, borderWidth: 1, borderColor: C.line, backgroundColor: '#f8faf980', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 20, marginTop: 24 },
  shRow: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: C.lineSoft, paddingVertical: 8 },
  shTh: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9, color: C.ink3, paddingRight: 12 },
  noMeds: { marginTop: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: C.line, borderRadius: 12, padding: 20 },
  fu: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#fffbeb', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, marginTop: 24 },
  shFoot: { marginTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' },
  sign: { width: 200, borderTopWidth: 1, borderTopColor: C.border2, paddingTop: 8 },
});