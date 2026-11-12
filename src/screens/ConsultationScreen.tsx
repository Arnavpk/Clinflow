import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Badge, Button, Card, CardHead, Checkbox, DateInput, EmptyBox, ErrBox, Field, Grid, Icon, IconButton, Input, Note, PageHead, Radio, Select, StatusBadge, T, type TextInputRef,
} from '../components/ui';
import { PatientSummary, RxCard, VisitCard } from '../components/domain';
import { Page } from '../layout/Page';
import { C, useBp } from '../theme/tokens';
import { useStore } from '../store/AppStore';
import { apiSavePrescription, type RxPayload } from '../services/api';
import { patientById, rxById, visitById } from '../services/selectors';
import { cfNew, cfNormalize, cfPersist, cfSummary } from '../services/medicine';
import { CF_CUSTOM, CF_MEDICINES, CF_PERIODS, UNITS } from '../data/constants';
import { fmtDate, todayISO } from '../utils/format';
import type { CfMed, ConsultationDraft, PresetKind } from '../types';

/* ------------------------------------------------------------------ preset quick field (symptoms / diagnosis) */
function QuickField({ kind, label, value, onChange }: { kind: PresetKind; label: string; value: string; onChange: (v: string) => void }) {
  const { enabledPresets } = useStore();
  const [q, setQ] = useState('');
  /* the prototype draws preset chips once the field is used (cfQuickDraw on input) */
  const [touched, setTouched] = useState(false);
  const ref = useRef<TextInputRef>(null);
  const data = enabledPresets(kind);
  const chips = data.filter((x) => !q || x.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const add = (val: string) => {
    if (!val) return;
    const vals = value.split(',').map((x) => x.trim()).filter(Boolean);
    if (!vals.some((x) => x.toLowerCase() === val.toLowerCase())) vals.push(val);
    onChange(vals.join(', '));
    setQ('');
    setTouched(true);
    ref.current?.focus();
  };
  return (
    <Field label={label} hint="Choose presets or enter free text.">
      <View style={{ marginBottom: 9 }}>
        <Input
          ref={ref}
          testID={'cf-quick-' + kind}
          value={q}
          onChangeText={(t) => { setQ(t); setTouched(true); }}
          onFocus={() => setTouched(true)}
          placeholder={'Search ' + label.toLowerCase() + ', then Enter…'}
          autoCorrect={false}
          submitBehavior="submit"
          onSubmitEditing={() => {
            const val = q.trim();
            if (!val) return;
            add(data.find((x) => x.toLowerCase().includes(val.toLowerCase())) || val);
          }}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
          {(touched ? chips : []).map((x) => (
            <Pressable key={x} testID={'cf-chip-' + kind + '-' + x} onPress={() => add(x)} style={({ pressed }) => [st.chip, pressed && { backgroundColor: C.pri50, borderColor: C.pri300 }]}>
              <T style={{ fontSize: 12, color: C.ink2 }}>{x}</T>
            </Pressable>
          ))}
        </View>
      </View>
      <Input testID={'cf-text-' + kind} multiline rows={2} value={value} onChangeText={onChange} placeholder="Selected presets or free text…" />
    </Field>
  );
}

/* ------------------------------------------------------------------ medicine card */
function MedCard({ m, i, target, onTarget, onChange, onDelete }: { m: CfMed; i: number; target: boolean; onTarget: () => void; onChange: (patch: Partial<CfMed>) => void; onDelete: () => void }) {
  const { narrow } = useBp();
  const bits = (m.frequency || '0-0-0-0').split('-');
  const toggle = (j: number) => {
    const b = m.frequency.split('-');
    b[j] = b[j] === '1' ? '0' : '1';
    onChange({ frequency: b.join('-') });
  };
  return (
    <Pressable onPress={onTarget} style={[st.med, target && st.medTarget]} testID={'cf-med-' + i}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <T style={st.medT}>{'Medicine ' + String(i + 1).padStart(2, '0') + (target ? ' · SHORTCUT TARGET' : '')}</T>
        <IconButton icon="trash" variant="danger" small title="Remove medicine" onPress={onDelete} testID={'cf-del-' + i} />
      </View>
      <View style={{ flexDirection: narrow ? 'column' : 'row', gap: 12 }}>
        <Field label="Medicine Name" style={{ flex: 1.6 }}>
          <Input testID={'cf-name-' + i} value={m.name} onChangeText={(v) => onChange({ name: v })} />
        </Field>
        <Field label="Dosage" style={{ flex: 1 }}>
          <Input testID={'cf-dose-' + i} value={m.dosage} onChangeText={(v) => onChange({ dosage: v })} />
        </Field>
      </View>
      <View style={{ marginTop: 14 }}>
        <T style={st.lbl}>Frequency</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>
          {CF_PERIODS.map((x, j) => (
            <FreqBtn key={x} label={x} on={bits[j] === '1'} disabled={m.customMode} onPress={() => toggle(j)} testID={'cf-freq-' + i + '-' + j} />
          ))}
          <FreqBtn
            label="Custom"
            on={m.customMode}
            testID={'cf-custom-' + i}
            onPress={() => onChange(m.customMode ? { customMode: false, customValue: '' } : { customMode: true, frequency: '0-0-0-0' })}
          />
        </View>
      </View>
      {m.customMode ? (
        <Field label="Custom Schedule" style={{ marginTop: 10 }}>
          <Select testID={'cf-customval-' + i} value={m.customValue} onChange={(v) => onChange({ customValue: v })} placeholder="Select schedule" options={CF_CUSTOM} />
        </Field>
      ) : null}
      <View style={{ flexDirection: narrow ? 'column' : 'row', gap: 12, marginTop: 10 }}>
        <Field label="Duration" style={narrow ? undefined : { width: 100 }}>
          <Input testID={'cf-dur-' + i} keyboardType="number-pad" value={m.duration} onChangeText={(v) => onChange({ duration: v.replace(/[^0-9]/g, '') })} />
        </Field>
        <Field label="Duration Unit" style={{ flex: 1 }}>
          <Select testID={'cf-unit-' + i} value={m.unit} onChange={(v) => onChange({ unit: v })} options={UNITS} title="Duration Unit" />
        </Field>
      </View>
      <View style={{ marginTop: 10 }}>
        <T style={st.lbl}>Meal Timing (optional)</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 }}>
          {['Before food', 'After food', ''].map((x) => (
            <Radio key={x || 'none'} label={x || 'Not specified'} checked={(m.mealTiming || '') === x} onPress={() => onChange({ mealTiming: x })} testID={'cf-meal-' + i + '-' + (x || 'none')} />
          ))}
        </View>
      </View>
      <Field label="Instructions (optional)" style={{ marginTop: 12 }}>
        <Input testID={'cf-instr-' + i} value={m.instructions} onChangeText={(v) => onChange({ instructions: v })} placeholder="e.g. Take with water" />
      </Field>
      <View style={st.sum}>
        <T style={{ fontSize: 12, color: C.pri700 }}>{cfSummary(m)}</T>
      </View>
    </Pressable>
  );
}

function FreqBtn({ label, on, disabled, onPress, testID }: { label: string; on: boolean; disabled?: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: on, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[st.freq, on && { backgroundColor: C.pri600, borderColor: C.pri600 }, disabled && { opacity: 0.4 }]}
    >
      <T style={{ fontSize: 12, fontWeight: '700', color: on ? C.white : C.ink2 }}>{label}</T>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ screen */
export function ConsultationScreen({ visitId }: { visitId: string }) {
  const store = useStore();
  const { db, mutate, toast, openModal, go, user, draft, saveDraft, clearDraft, handoff } = store;
  const { xxl, sm, md } = useBp();
  const v = visitById(db, visitId);
  const p = v ? patientById(db, v.patientId) : undefined;
  const saved = v?.prescriptionId ? rxById(db, v.prescriptionId) : undefined;

  const [c, setC] = useState<ConsultationDraft | null>(() => {
    if (!v) return null;
    if (draft && draft.visitId === v.id) return draft;
    if (handoff.current.consSnap && handoff.current.consSnap.visitId === v.id) {
      const s = handoff.current.consSnap;
      handoff.current.consSnap = null;
      return s;
    }
    return {
      visitId: v.id,
      symptoms: v.symptoms || '',
      diagnosis: v.diagnosis || '',
      meds: saved ? saved.medicines.map(cfNormalize) : [],
      advice: saved ? saved.advice || '' : '',
      followUp: saved ? saved.followUp || '' : '',
    };
  });
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(-1);
  const [shortcuts, setShortcuts] = useState(true);
  const [mq, setMq] = useState('');
  const [active, setActive] = useState(-1);
  const searchRef = useRef<TextInputRef>(null);

  /** Every edit is persisted as the unfinished-consultation draft (localStorage → AsyncStorage). */
  const cRef = useRef(c);
  cRef.current = c;
  const update = useCallback(
    (fn: (d: ConsultationDraft) => ConsultationDraft) => {
      const cur = cRef.current;
      if (!cur) return;
      const next = fn(cur);
      cRef.current = next;
      setC(next);
      saveDraft(next);
    },
    [saveDraft],
  );
  const setField = (k: 'symptoms' | 'diagnosis' | 'advice' | 'followUp', val: string) => update((d) => ({ ...d, [k]: val }));
  const setMed = (i: number, patch: Partial<CfMed>) => update((d) => ({ ...d, meds: d.meds.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const addMed = (name: string, dose?: string) => {
    setTarget(c ? c.meds.length : 0);
    update((d) => ({ ...d, meds: [...d.meds, cfNew(name, dose)] }));
    setMq('');
    setActive(-1);
    searchRef.current?.focus();
  };
  const delMed = (i: number) => {
    setTarget((t) => Math.min(t, (c ? c.meds.length : 1) - 2));
    update((d) => ({ ...d, meds: d.meds.filter((_, j) => j !== i) }));
  };

  const matches = useMemo(() => (mq ? CF_MEDICINES.filter((x) => x[0].toLowerCase().includes(mq.toLowerCase())).slice(0, 7) : []), [mq]);

  /* M / A / E / N keyboard shortcuts (hardware keyboard on web), toggling the target medicine's slots. */
  const stateRef = useRef({ c, target, shortcuts });
  stateRef.current = { c, target, shortcuts };
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const { c: cur, target: tg, shortcuts: on } = stateRef.current;
      if (!on || !cur) return;
      const j = ({ m: 0, a: 1, e: 2, n: 3 } as Record<string, number>)[e.key.toLowerCase()];
      if (j === undefined) return;
      const m = cur.meds[tg];
      if (!m || m.customMode) return;
      const b = m.frequency.split('-');
      b[j] = b[j] === '1' ? '0' : '1';
      setMed(tg, { frequency: b.join('-') });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!v || !p || !c)
    return (
      <Page>
        <Card>
          <ErrBox title="Unable to load consultation" msg={'Visit ' + visitId + ' was not found. It may have been removed.'} retry="Back to Queue" onRetry={() => go('/visits')} />
        </Card>
      </Page>
    );

  const pastV = db.visits.filter((x) => x.patientId === p.id && x.id !== v.id && x.date !== todayISO()).sort((a, b) => b.date.localeCompare(a.date));
  const pastR = db.prescriptions.filter((r) => r.patientId === p.id && (!saved || r.id !== saved.id)).sort((a, b) => b.date.localeCompare(a.date));
  const named = c.meds.filter((m) => m.name.trim()).length;
  const from = '/consultation/' + v.id;

  const payload = (): RxPayload => ({
    visitId: v.id,
    patientId: v.patientId,
    symptoms: c.symptoms.trim(),
    diagnosis: c.diagnosis.trim(),
    medicines: c.meds.filter((m) => m.name.trim()).map(cfPersist),
    advice: c.advice.trim(),
    followUp: c.followUp || null,
  });
  const needMed = () => {
    if (payload().medicines.length) return false;
    toast('warning', 'Add at least one medicine', 'A prescription needs at least one medicine with a name.');
    return true;
  };
  const save = (complete: boolean) => {
    if (needMed()) return;
    setBusy(true);
    setTimeout(() => {
      const { rx, created } = mutate((d) => apiSavePrescription(d, payload(), complete, user?.name || db.clinic.doctorName));
      setBusy(false);
      toast('success', created ? 'Prescription ' + rx.id + ' saved' : 'Prescription ' + rx.id + ' updated', complete ? v.token + ' marked as completed — great work.' : 'You can still print or complete the visit.');
      if (complete) {
        clearDraft(v.id);
        go('/visits');
      } else saveDraft(c);
    }, 350);
  };
  const preview = (mode: false | 'print' | 'pdf') => {
    if (needMed()) return;
    const pl = payload();
    handoff.current.consSnap = JSON.parse(JSON.stringify(c));
    handoff.current.draftRx = { id: saved ? saved.id : null, patientId: pl.patientId, doctor: user?.name || db.clinic.doctorName, date: todayISO(), medicines: pl.medicines, advice: pl.advice, followUp: pl.followUp };
    handoff.current.draftReturn = from;
    handoff.current.autoPrint = mode;
    if (mode === 'pdf') toast('info', 'Preparing PDF', 'The A4 prescription will open in the share sheet so you can save or send it.');
    go('/prescriptions/preview');
  };
  const reuse = (rxId: string) => {
    const rx = rxById(db, rxId);
    if (!rx) return;
    update((d) => ({ ...d, meds: rx.medicines.map(cfNormalize), advice: rx.advice || '', followUp: rx.followUp || '' }));
    toast('info', 'Prescription reused', rx.id + ' loaded as a NEW prescription for this visit — the original stays untouched.');
  };

  const bs = sm ? 'md' : 'sm';
  const bst = sm ? undefined : { flexGrow: 1 };
  const bar = (
    <>
      {sm ? (
        <T style={{ marginRight: 'auto', fontSize: 12, color: C.ink3 }} testID="cons-sum">
          {named + ' medicine(s)' + (saved ? ' · updating ' + saved.id : '') + (c.followUp ? ' · follow-up ' + fmtDate(c.followUp) : '')}
        </T>
      ) : null}
      <Button s={bs} style={bst} v="s" icon="eye" label="Preview" onPress={() => preview(false)} testID="rx-preview" />
      <Button s={bs} style={bst} v="s" icon="save" label="Save Prescription" loading={busy} onPress={() => save(false)} testID="rx-save" />
      <Button
        s={bs}
        style={bst}
        icon="check-circle"
        label="Save & Complete Visit"
        loading={busy}
        testID="rx-complete"
        onPress={() =>
          openModal({
            type: 'confirm',
            tone: 'primary',
            label: 'Save & Complete',
            title: 'Complete visit ' + v.token + '?',
            msg: 'The prescription will be saved and the patient marked as completed in today’s queue.',
            onConfirm: () => save(true),
          })
        }
      />
      <Button s={bs} style={bst} v="g" icon="printer" label="Print Prescription" onPress={() => preview('print')} testID="rx-print" />
      <Button s={bs} style={bst} v="g" icon="download" label="Generate PDF" onPress={() => preview('pdf')} testID="rx-pdf" />
    </>
  );

  return (
    <Page bottomBar={bar}>
      <PageHead
        title={'Consultation — ' + v.token}
        sub={p.name + ' · ' + p.id}
        crumbs={[{ label: 'Visits', href: '/visits' }, { label: 'Consultation · ' + v.token }]}
        actions={
          <>
            <StatusBadge status={v.status} />
            <Button v="s" icon="user" label="Open Patient" onPress={() => go('/patients/' + p.id)} />
          </>
        }
      />
      {v.status === 'completed' ? <Note tone="amber" icon="info">This visit is already completed. You can still edit notes and print — but there is no need to complete it again.</Note> : null}
      <Grid weights={xxl ? [2, 1] : undefined} gap={20}>
        <View style={{ gap: 20 }}>
          <Card style={{ padding: 20 }}>
            <PatientSummary p={p} token={v.token} />
          </Card>
          <Card>
            <CardHead icon="stethoscope" title="Symptoms & Diagnosis" sub="Pick presets or type freely — both are saved with the visit" />
            <View style={{ padding: 20, gap: 16, flexDirection: md ? 'row' : 'column' }}>
              <View style={md ? { flex: 1, minWidth: 0 } : undefined}>
                <QuickField kind="symptoms" label="Symptoms" value={c.symptoms} onChange={(x) => setField('symptoms', x)} />
              </View>
              {md ? <View style={{ width: 1, backgroundColor: C.line }} /> : null}
              <View style={md ? { flex: 1, minWidth: 0 } : undefined}>
                <QuickField kind="diagnosis" label="Diagnosis" value={c.diagnosis} onChange={(x) => setField('diagnosis', x)} />
              </View>
            </View>
          </Card>
          <Card>
            <CardHead
              icon="pill"
              title="Prescription"
              sub={saved ? 'Saved as ' + saved.id + ' — edits update this visit’s prescription only' : 'Each medicine is a separate item with its own dosage'}
            />
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Icon name="pill" size={17} color={C.pri600} />
                <T style={{ fontWeight: '700' }}>Medicines</T>
                <Badge tone="p" label={named + ' added'} />
              </View>
              <View style={{ zIndex: 25, marginBottom: 12 }}>
                <Input
                  ref={searchRef}
                  testID="cf-med-search"
                  value={mq}
                  onChangeText={(t) => { setMq(t); setActive(-1); }}
                  placeholder="Search medicine, use ↑ ↓ and Enter to add…"
                  autoCorrect={false}
                  autoCapitalize="none"
                  submitBehavior="submit"
                  onSubmitEditing={() => {
                    const m = matches[active];
                    if (m) addMed(m[0], m[1]);
                    else if (mq.trim()) addMed(mq.trim(), '1 tablet');
                  }}
                  onKeyPress={(e) => {
                    const k = e.nativeEvent.key;
                    if ((k === 'ArrowDown' || k === 'ArrowUp') && matches.length) {
                      setActive((a) => Math.max(0, Math.min(matches.length - 1, a + (k === 'ArrowDown' ? 1 : -1))));
                    } else if (k === 'Escape') setMq('');
                  }}
                />
                {mq ? (
                  <View style={st.suggest} testID="cf-suggest">
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 240 }}>
                      {matches.length ? (
                        matches.map((m, i) => (
                          <Pressable
                            key={m[0]}
                            testID={'cf-opt-' + i}
                            onPress={() => addMed(m[0], m[1])}
                            style={({ pressed }) => [st.opt, (pressed || i === active) && { backgroundColor: C.pri50 }]}
                          >
                            <T style={{ flex: 1 }}>{m[0]}</T>
                            <T style={{ fontSize: 12, color: C.ink3 }}>{m[1]}</T>
                          </Pressable>
                        ))
                      ) : (
                        <Pressable style={st.opt} onPress={() => addMed(mq.trim(), '1 tablet')} testID="cf-opt-custom">
                          <T>No match — press Enter to add custom medicine</T>
                        </Pressable>
                      )}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
              <Checkbox
                checked={shortcuts}
                onChange={setShortcuts}
                label={'M / A / E / N shortcuts for selected medicine (when not typing)' + (Platform.OS === 'web' ? '' : ' — hardware keyboard')}
                style={{ marginBottom: 14 }}
              />
              {c.meds.length ? (
                c.meds.map((m, i) => (
                  <MedCard key={i} m={m} i={i} target={i === target} onTarget={() => setTarget(i)} onChange={(patch) => setMed(i, patch)} onDelete={() => delMed(i)} />
                ))
              ) : (
                <View style={st.medEmpty}>
                  <T style={{ fontSize: 13, color: C.ink3, textAlign: 'center' }}>No medicines yet. Search above and press Enter to add one.</T>
                </View>
              )}
              <Field label="Advice" style={{ marginTop: 20 }}>
                <Input testID="cf-advice" multiline rows={3} value={c.advice} onChangeText={(x) => setField('advice', x)} placeholder="General advice…" />
              </Field>
              <Field label="Follow-up Date" hint="Optional" style={{ marginTop: 14 }}>
                <DateInput testID="cf-followup" value={c.followUp} onChange={(x) => setField('followUp', x)} />
              </Field>
            </View>
          </Card>
        </View>
        <View style={{ gap: 20 }}>
          <Card>
            <CardHead icon="history" title="Patient History" sub={pastV.length + ' previous visit(s)'} />
            <ScrollView nestedScrollEnabled style={{ maxHeight: 430 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
              {pastV.length ? pastV.map((x) => <VisitCard key={x.id} v={x} from={from} />) : <EmptyBox icon="inbox" title="First visit" msg="No previous visits on record for this patient." compact />}
            </ScrollView>
          </Card>
          <Card>
            <CardHead icon="file-text" title="Previous Prescriptions" sub="Reuse loads them into a new prescription" />
            <ScrollView nestedScrollEnabled style={{ maxHeight: 420 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
              {pastR.length ? pastR.map((rx) => <RxCard key={rx.id} rx={rx} from={from} onReuse={() => reuse(rx.id)} />) : <EmptyBox icon="pill" title="No past prescriptions" msg="Nothing to reuse yet." compact />}
            </ScrollView>
          </Card>
        </View>
      </Grid>
    </Page>
  );
}

const st = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 9, paddingVertical: 6, paddingHorizontal: 10 },
  med: { borderWidth: 1, borderColor: C.line, backgroundColor: '#f8faf980', borderRadius: 14, padding: 16, marginBottom: 12 },
  medTarget: { borderColor: C.pri500, boxShadow: '0px 0px 0px 2px ' + C.pri100 },
  medT: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase', color: C.ink3, flexShrink: 1 },
  lbl: { fontSize: 13, fontWeight: '700' },
  freq: { borderWidth: 1, borderColor: C.line, backgroundColor: C.white, borderRadius: 9, paddingVertical: 9, paddingHorizontal: 12 },
  sum: { backgroundColor: C.pri50, padding: 9, borderRadius: 8, marginTop: 12 },
  suggest: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 12, boxShadow: '0px 12px 30px #16261f20', zIndex: 24, elevation: 6, overflow: 'hidden' },
  opt: { paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.line, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  medEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: C.line, backgroundColor: '#f8faf980', borderRadius: 14, padding: 20 },
});