import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, EmptyBox, Grid, Icon, IdChip, KLabel, PageHead, SearchInput, Stepper, T } from '../components/ui';
import { PatientCard, PatientFormFields, PatientSummary } from '../components/domain';
import { Page } from '../layout/Page';
import { C, MONO, useBp } from '../theme/tokens';
import { useStore } from '../store/AppStore';
import { apiCreatePatient, apiCreateVisit } from '../services/api';
import { patientById, patientName } from '../services/selectors';
import { emptyPatientForm, hasErrors, patientFormToData, searchPatients, validatePatient, type Errors, type PatientForm } from '../utils/validation';
import type { Visit, VisitOptions } from '../types';

export function ReceptionDesk({ initialQ }: { initialQ?: string }) {
  const { db, mutate, toast, go, biz, openModal } = useStore();
  const { xxl } = useBp();
  const [q, setQ] = useState(initialQ || '');
  const [sel, setSel] = useState<string | null>(null);
  const [tok, setTok] = useState<Visit | null>(null);
  const [reg, setReg] = useState(false);
  const [form, setForm] = useState<PatientForm>(emptyPatientForm);
  const [errs, setErrs] = useState<Errors<PatientForm>>({});
  const [busy, setBusy] = useState(false);

  const step = tok ? 3 : sel ? 2 : 0;
  const qq = q.trim();
  const results = searchPatients(db.patients, q).slice(0, 6);
  const recent = db.patients.slice(-4).reverse();
  const selP = sel ? patientById(db, sel) : undefined;

  const setMode = (r: boolean) => {
    setReg(r);
    setErrs({});
  };

  const register = (ack: boolean) => {
    const e = validatePatient(form);
    setErrs(e);
    if (hasErrors(e)) return;
    const matches = db.patients.filter((p) => p.mobile === form.mobile.trim());
    if (matches.length && !ack) {
      openModal({
        type: 'dupDesk',
        matches,
        mobile: form.mobile,
        onView: (id) => go('/patients/' + id),
        onContinue: () => register(true),
      });
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const p = mutate((d) => apiCreatePatient(d, patientFormToData(form)));
      setBusy(false);
      setSel(p.id);
      setReg(false);
      setForm(emptyPatientForm());
      toast('success', 'Patient registered · ' + p.id, p.name + ' is selected — create the visit to generate a token.');
    }, 450);
  };

  const createVisit = (opts?: VisitOptions) => {
    if (!sel) return;
    const v = mutate((d) => apiCreateVisit(d, sel, biz, opts));
    setTok(v);
    toast('success', 'Token ' + v.token + ' generated', patientName(db, v.patientId) + ' is now waiting in the doctor’s queue.');
  };
  const onCreate = () => {
    if (biz.onlineEnabled) openModal({ type: 'visitChoice', onConfirm: (o) => createVisit(o) });
    else createVisit();
  };

  const left = reg ? (
    <Card style={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <View style={{ flexShrink: 1 }}>
          <T style={{ fontWeight: '800', fontSize: 14 }}>Register new patient</T>
          <T style={{ fontSize: 12, color: C.ink3 }}>The Patient ID is generated automatically</T>
        </View>
        <Button v="g" s="sm" icon="arrow-left" label="Back to Search" onPress={() => setMode(false)} />
      </View>
      <PatientFormFields f={form} errs={errs} set={(k, v) => setForm((x) => ({ ...x, [k]: v }))} />
      <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
        <Button v="s" label="Cancel" onPress={() => setMode(false)} />
        <Button icon="user-plus" label="Register & Select" loading={busy} onPress={() => register(false)} testID="desk-submit" />
      </View>
    </Card>
  ) : (
    <Card style={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <View style={{ flexShrink: 1 }}>
          <T style={{ fontWeight: '800', fontSize: 14 }}>Find patient</T>
          <T style={{ fontSize: 12, color: C.ink3 }}>Search by name, Patient ID or mobile number</T>
        </View>
        <Button v="s" s="sm" icon="user-plus" label="Register New Patient" onPress={() => setMode(true)} testID="desk-reg" />
      </View>
      <SearchInput testID="desk-q" big value={q} onChangeText={setQ} placeholder="e.g. Rahul, PAT001, 98220…" />
      <View style={{ gap: 8, marginTop: 14 }}>
        {qq ? (
          results.length ? (
            results.map((p) => <PatientCard key={p.id} p={p} onPress={() => { setSel(p.id); setTok(null); }} testID={'desk-pick-' + p.id} />)
          ) : (
            <EmptyBox
              icon="search"
              title="No patient found"
              msg={'Nobody matches “' + qq + '”. Register them as a new patient.'}
              action={<Button s="sm" icon="user-plus" label="Register New Patient" onPress={() => setMode(true)} />}
              compact
            />
          )
        ) : (
          <>
            <KLabel style={{ padding: 4 }}>RECENT PATIENTS</KLabel>
            {recent.map((p) => (
              <PatientCard key={p.id} p={p} onPress={() => { setSel(p.id); setTok(null); }} testID={'desk-pick-' + p.id} />
            ))}
          </>
        )}
      </View>
    </Card>
  );

  const right = (
    <Card style={{ padding: 20 }} testID="desk-side">
      {tok ? (
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#a7f3d0', backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check-circle" size={24} color={C.green} />
          </View>
          <T style={{ fontWeight: '800', marginTop: 10, fontSize: 16 }}>Visit Created</T>
          <T style={{ color: C.ink2, fontSize: 14, marginTop: 6 }}>{patientName(db, tok.patientId)}</T>
          <View style={{ marginTop: 6 }}>
            <IdChip value={tok.patientId} />
          </View>
          <View style={{ marginTop: 14, alignSelf: 'stretch', borderWidth: 2, borderStyle: 'dashed', borderColor: C.pri300, backgroundColor: '#f0faf790', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' }}>
            <T style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: '#226758b3' }}>TOKEN</T>
            <T style={{ fontFamily: MONO, fontSize: 34, fontWeight: '700', color: C.pri800, marginTop: 4 }} testID="desk-token">{tok.token}</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 20, alignSelf: 'stretch' }}>
            <View style={{ flex: 1 }}>
              <Button v="s" label="Done" full onPress={() => { setSel(null); setTok(null); setQ(''); }} testID="desk-done" />
            </View>
            <View style={{ flex: 1 }}>
              <Button icon="clipboard" label="View Queue" full onPress={() => go('/visits')} />
            </View>
          </View>
        </View>
      ) : selP ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <T style={{ fontWeight: '800', fontSize: 14 }}>Selected Patient</T>
            <Button v="g" s="xs" icon="x" label="Change" onPress={() => setSel(null)} />
          </View>
          <View style={{ borderWidth: 1, borderColor: C.line, backgroundColor: '#f8faf980', borderRadius: 12, padding: 16 }}>
            <PatientSummary p={selP} compact />
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: C.line, marginTop: 20, paddingTop: 20 }}>
            <Button s="lg" full icon="plus" label="Create Visit & Generate Token" onPress={onCreate} testID="desk-create" />
          </View>
          <T style={{ fontSize: 12, color: C.ink3, textAlign: 'center', marginTop: 10 }}>The token is added to today’s doctor queue as “Waiting”.</T>
        </>
      ) : (
        <EmptyBox icon="user-plus" title="No patient selected" msg="Search for an existing patient or register a new one — then create the visit here to generate a token." />
      )}
    </Card>
  );

  return (
    <Page>
      <PageHead title="Reception Desk" sub="The fast lane: find (or register) a patient, create the visit, hand over the token." />
      <Card style={{ paddingVertical: 14, paddingHorizontal: 20 }}>
        <Stepper steps={['Search Patient', 'Confirm Patient', 'Create Visit', 'Token']} current={step} />
      </Card>
      <Grid weights={xxl ? [3, 2] : undefined} gap={20} style={{ marginTop: 20 }}>
        {left}
        {right}
      </Grid>
    </Page>
  );
}
