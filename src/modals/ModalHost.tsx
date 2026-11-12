import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import {
  Badge, Button, Checkbox, EmptyBox, Field, Icon, IdChip, Input, ModalFrame, ModalShell, Note, B, SearchInput, Select, T,
} from '../components/ui';
import { PatientCard, PatientFormFields, PatientSummary } from '../components/domain';
import { C, MONO } from '../theme/tokens';
import { useStore } from '../store/AppStore';
import { apiAddStaff, apiCreatePatient, apiCreateVisit, apiUpdatePatient, apiUpdateStaff, apiUpdateVisit } from '../services/api';
import { patientById, patientName, visitById } from '../services/selectors';
import { printHtml, receiptHtml } from '../services/print';
import { PAYMENT_METHODS, ROLE_META, STAFF_DESIGNATIONS } from '../data/constants';
import {
  emptyPatientForm, hasErrors, patientFormToData, searchPatients, validatePatient, validateStaff, type Errors, type PatientForm, type StaffForm,
} from '../utils/validation';
import type { ModalState, Patient, Platform3, Visit, VisitOptions, VisitType } from '../types';

type M<T extends ModalState['type']> = Extract<ModalState, { type: T }>;

/** Renders whichever modal is active in the store (the prototype's renderModal()). */
export function ModalHost() {
  const { modal, closeModal } = useStore();
  return (
    <ModalShell visible={!!modal} onClose={closeModal}>
      {modal ? <ActiveModal key={modal.type} modal={modal} /> : null}
    </ModalShell>
  );
}

function ActiveModal({ modal }: { modal: ModalState }) {
  switch (modal.type) {
    case 'addPatient':
      return <AddPatientModal />;
    case 'reg':
      return <RegModal m={modal} />;
    case 'visit':
      return <VisitModal m={modal} />;
    case 'edit':
      return <EditPatientModal m={modal} />;
    case 'confirm':
      return <ConfirmModal m={modal} />;
    case 'staffAdd':
    case 'staffEdit':
      return <StaffModal m={modal} />;
    case 'dupDesk':
      return <DupDeskModal m={modal} />;
    case 'visitChoice':
      return <VisitChoiceModal m={modal} />;
    case 'billing':
      return <BillingModal m={modal} />;
    case 'prompt':
      return <PromptModal m={modal} />;
  }
}

/* ------------------------------------------------------------------ duplicate-mobile table (shared) */
function DupTable({ mobile, matches, onView }: { mobile: string; matches: Patient[]; onView: (id: string) => void }) {
  return (
    <>
      <Note tone="amber" icon="alert-triangle">
        The mobile <B mono>{mobile}</B> is already registered for the patient(s) below. TriSetu never merges records automatically — you can open the existing patient, or continue creating a separate new patient.
      </Note>
      <View style={{ borderWidth: 1, borderColor: C.line, borderRadius: 12, overflow: 'hidden' }}>
        {matches.map((p, i) => (
          <View key={p.id} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: i < matches.length - 1 ? 1 : 0, borderBottomColor: C.lineSoft }}>
            <IdChip value={p.id} />
            <T style={{ fontWeight: '700', flexGrow: 1, flexBasis: 90 }} numberOfLines={1}>{p.name}</T>
            <T style={{ fontFamily: MONO, fontSize: 13, color: C.ink2 }}>{p.mobile}</T>
            <Button v="s" s="xs" icon="eye" label="View Patient" onPress={() => onView(p.id)} testID={'dup-view-' + p.id} />
          </View>
        ))}
      </View>
    </>
  );
}

/* ------------------------------------------------------------------ add patient (+ duplicate check) */
function AddPatientModal() {
  const { db, mutate, toast, openModal, closeModal, go } = useStore();
  const [form, setForm] = useState<PatientForm>(emptyPatientForm);
  const [errs, setErrs] = useState<Errors<PatientForm>>({});
  const [ack, setAck] = useState(false);
  const [dup, setDup] = useState<Patient[] | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = (acknowledged = ack) => {
    const e = validatePatient(form);
    setErrs(e);
    if (hasErrors(e)) return;
    const matches = db.patients.filter((p) => p.mobile === form.mobile.trim());
    if (matches.length && !acknowledged) {
      setDup(matches);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const p = mutate((d) => apiCreatePatient(d, patientFormToData(form)));
      toast('success', 'Patient registered successfully', p.name + ' · ' + p.id);
      openModal({ type: 'reg', pid: p.id });
    }, 450);
  };
  if (dup)
    return (
      <ModalFrame size="lg" title="Possible Existing Patient" sub="We found patients with this mobile number." onClose={closeModal} testID="modal-dup">
        <DupTable mobile={form.mobile} matches={dup} onView={(id) => { closeModal(); go('/patients/' + id); }} />
        <View style={{ flexDirection: 'row', marginTop: 20 }}>
          <Button v="s" icon="arrow-right" iconRight={undefined} label="Continue Creating New Patient" onPress={() => { setAck(true); setDup(null); }} testID="dup-continue" />
        </View>
      </ModalFrame>
    );
  return (
    <ModalFrame
      size="lg"
      title="Register New Patient"
      sub="Patient ID is generated automatically after registration."
      onClose={closeModal}
      testID="modal-add-patient"
      footer={
        <>
          <Button v="s" label="Cancel" onPress={closeModal} />
          <Button icon="user-plus" label="Register Patient" loading={busy} onPress={() => submit()} testID="patient-submit" />
        </>
      }
    >
      <PatientFormFields f={form} errs={errs} set={(k, v) => { setForm((x) => ({ ...x, [k]: v })); if (k === 'mobile') setAck(false); }} />
    </ModalFrame>
  );
}

function RegModal({ m }: { m: M<'reg'> }) {
  const { db, closeModal, openModal, go } = useStore();
  const p = patientById(db, m.pid);
  if (!p) return null;
  return (
    <ModalFrame
      size="sm"
      onClose={closeModal}
      testID="modal-reg"
      footer={
        <>
          <Button v="s" icon="user" label="View Patient" onPress={() => { closeModal(); go('/patients/' + p.id); }} testID="reg-view" />
          <Button icon="plus" label="Create Visit" onPress={() => openModal({ type: 'visit', pid: p.id })} testID="reg-visit" />
        </>
      }
    >
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: '#a7f3d0', backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check-circle" size={28} color={C.green} />
        </View>
        <T style={{ fontWeight: '800', marginTop: 14, fontSize: 18, textAlign: 'center' }}>Patient Registered Successfully</T>
        <T style={{ color: C.ink2, fontSize: 14, marginTop: 6 }}>{p.name + ' · ' + p.age + ' yrs · ' + p.gender}</T>
        <BigId label="Patient ID" value={p.id} />
        <T style={{ fontSize: 12, color: C.ink3, marginTop: 14, textAlign: 'center' }}>The Patient ID is the permanent identity — keep it handy for future visits.</T>
      </View>
    </ModalFrame>
  );
}

function BigId({ label, value, testID }: { label: string; value: string; testID?: string }) {
  return (
    <View style={{ marginTop: 16, width: '100%', maxWidth: 240, borderWidth: 2, borderStyle: 'dashed', borderColor: C.pri300, backgroundColor: '#f0faf790', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' }}>
      <T style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.8, textTransform: 'uppercase', color: '#226758b3' }}>{label}</T>
      <T testID={testID} style={{ fontFamily: MONO, fontSize: 30, fontWeight: '700', color: C.pri800, marginTop: 4 }}>{value}</T>
    </View>
  );
}

/* ------------------------------------------------------------------ create visit */
const PLATFORMS: [Platform3, string][] = [
  ['whatsapp', 'WhatsApp video'],
  ['meet', 'Google Meet'],
  ['teams', 'Microsoft Teams'],
];

function VisitModal({ m }: { m: M<'visit'> }) {
  const { db, biz, mutate, toast, closeModal, go } = useStore();
  const [q, setQ] = useState('');
  const [pid, setPid] = useState<string | null>(m.pid || null);
  const [tok, setTok] = useState<Visit | null>(null);
  const [visitType, setVisitType] = useState<VisitType | ''>(biz.onlineEnabled ? '' : 'offline');
  const [platform, setPlatform] = useState<Platform3>('');
  const [link, setLink] = useState('');
  const [fee, setFee] = useState<string | null>(null);
  const [method, setMethod] = useState('');
  const [paid, setPaid] = useState(false);

  const vt: VisitType = visitType || 'offline';
  const payEnabled = vt === 'online' ? biz.onlinePaymentsEnabled : biz.offlinePaymentsEnabled;
  const typeChosen = !biz.onlineEnabled || !!visitType;
  const feeVal = fee ?? String(vt === 'online' ? biz.onlineFee : biz.offlineFee);
  const canCreate = typeChosen && (vt !== 'online' || !!platform);

  const create = () => {
    if (!pid || !canCreate) return;
    const v = mutate((d) =>
      apiCreateVisit(d, pid, biz, {
        visitType: vt,
        platform,
        meetingLink: link.trim(),
        ...(payEnabled ? { fee: Number(feeVal) || 0, paymentMethod: method, paid } : {}),
      }),
    );
    setTok(v);
    toast('success', 'Visit created · Token ' + v.token, patientName(db, pid) + ' added to today’s doctor queue.');
  };

  if (tok) {
    return (
      <ModalFrame
        title="Visit Created"
        sub={'Token generated for today’s queue'}
        onClose={closeModal}
        testID="modal-visit-done"
        footer={
          <>
            <Button v="s" label="Done" onPress={closeModal} testID="visit-done" />
            <Button icon="clipboard" label="View Queue" onPress={() => { closeModal(); go('/visits'); }} />
          </>
        }
      >
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#a7f3d0', backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check-circle" size={24} color={C.green} />
          </View>
          <T style={{ color: C.ink2, fontSize: 14, marginTop: 10 }}>{patientName(db, tok.patientId)}</T>
          <View style={{ marginTop: 6 }}>
            <IdChip value={tok.patientId} />
          </View>
          <BigId label="Token" value={tok.token} testID="visit-token" />
          <T style={{ fontSize: 12, color: C.ink3, marginTop: 14, textAlign: 'center' }}>The patient now appears in the doctor’s queue with status “Waiting”.</T>
        </View>
      </ModalFrame>
    );
  }

  const p = pid ? patientById(db, pid) : undefined;
  if (p) {
    return (
      <ModalFrame
        title="Create Visit"
        sub={'Generate a token and add the patient to today’s queue'}
        onClose={closeModal}
        testID="modal-visit"
        footer={
          <>
            <Button v="s" label="Change Patient" onPress={() => setPid(null)} />
            {canCreate ? (
              <Button icon="plus" label="Create Visit & Token" onPress={create} testID="visit-create" />
            ) : (
              <T style={{ fontSize: 12, color: C.ink2, alignSelf: 'center' }}>{'Choose visit type' + (vt === 'online' ? ' and platform' : '') + ' to continue'}</T>
            )}
          </>
        }
      >
        <View style={{ borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 16 }}>
          <PatientSummary p={p} />
        </View>
        {biz.onlineEnabled ? (
          <View style={[cardSt, { marginTop: 14 }]}>
            <T style={{ fontWeight: '700' }}>1. Select visit type</T>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button v={visitType === 'offline' ? 'p' : 's'} full label="🏥 Offline Visit" onPress={() => { setVisitType('offline'); setPlatform(''); setFee(null); }} testID="vt-offline" />
              </View>
              <View style={{ flex: 1 }}>
                <Button v={visitType === 'online' ? 'p' : 's'} full label="📹 Online Visit" onPress={() => { setVisitType('online'); setPlatform(''); setFee(null); }} testID="vt-online" />
              </View>
            </View>
            {visitType === 'online' ? (
              <>
                <T style={{ fontWeight: '700' }}>2. Choose consultation platform</T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {PLATFORMS.map(([k, n]) => (
                    <View key={k} style={{ flexGrow: 1, flexBasis: 120 }}>
                      <Button v={platform === k ? 'p' : 's'} full label={n} onPress={() => setPlatform(k)} testID={'pf-' + k} />
                    </View>
                  ))}
                </View>
                {platform === 'meet' || platform === 'teams' ? (
                  <Field label="Meeting link (paste a doctor-created link)">
                    <Input value={link} onChangeText={setLink} placeholder="https://..." autoCapitalize="none" keyboardType="url" testID="visit-link" />
                  </Field>
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}
        {typeChosen && payEnabled ? (
          <View style={[cardSt, { marginTop: 14 }]}>
            <T style={{ fontWeight: '700' }}>{'Payment · ' + (vt === 'online' ? 'Online' : 'Offline') + ' consultation'}</T>
            <Field label="Consultation fee (₹)">
              <Input keyboardType="number-pad" value={feeVal} onChangeText={(v) => setFee(v.replace(/[^0-9.]/g, ''))} testID="visit-fee" />
            </Field>
            <Field label="Payment method">
              <Select value={method} onChange={setMethod} placeholder="Select payment method" options={PAYMENT_METHODS} title="Payment method" testID="visit-method" />
            </Field>
            <Checkbox checked={paid} onChange={setPaid} label="Mark as paid manually (demo)" testID="visit-paid" />
            <T style={{ fontSize: 12, color: C.ink3 }}>For online visits, meeting access can be restricted until payment is recorded. No live bank verification is connected.</T>
          </View>
        ) : null}
      </ModalFrame>
    );
  }

  const qq = q.trim();
  const res = searchPatients(db.patients, q).slice(0, 5);
  return (
    <ModalFrame title="Create Visit" sub={'Generate a token and add the patient to today’s queue'} onClose={closeModal} testID="modal-visit-search">
      <SearchInput testID="v-q" value={q} onChangeText={setQ} placeholder="Search by name, Patient ID or mobile…" />
      <View style={{ gap: 8, marginTop: 10 }}>
        {res.length ? (
          res.map((x) => <PatientCard key={x.id} p={x} onPress={() => setPid(x.id)} testID={'v-pick-' + x.id} />)
        ) : (
          <EmptyBox icon="search" title="No patients found" msg={qq ? 'No match for “' + qq + '”. Register the patient first from the Patients page.' : 'Start typing to search patients.'} compact />
        )}
      </View>
    </ModalFrame>
  );
}

const cardSt = { borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 20, gap: 14, backgroundColor: C.white } as const;

/* ------------------------------------------------------------------ edit patient */
function EditPatientModal({ m }: { m: M<'edit'> }) {
  const { db, mutate, toast, closeModal } = useStore();
  const p = patientById(db, m.pid);
  const [form, setForm] = useState<PatientForm>(() => ({ name: p?.name || '', age: String(p?.age ?? ''), gender: p?.gender || '', bloodGroup: p?.bloodGroup || '', mobile: p?.mobile || '', email: p?.email || '' }));
  const [errs, setErrs] = useState<Errors<PatientForm>>({});
  const [busy, setBusy] = useState(false);
  if (!p) return null;
  const submit = () => {
    const e = validatePatient(form);
    setErrs(e);
    if (hasErrors(e)) return;
    setBusy(true);
    setTimeout(() => {
      mutate((d) => apiUpdatePatient(d, p.id, patientFormToData(form)));
      toast('success', 'Patient updated', p.id + ' saved successfully.');
      closeModal();
    }, 350);
  };
  return (
    <ModalFrame
      size="lg"
      title="Edit Patient"
      sub={p.id + ' · ' + p.name}
      onClose={closeModal}
      testID="modal-edit"
      footer={
        <>
          <Button v="s" label="Cancel" onPress={closeModal} />
          <Button icon="save" label="Save Changes" loading={busy} onPress={submit} testID="edit-submit" />
        </>
      }
    >
      <PatientFormFields f={form} errs={errs} set={(k, v) => setForm((x) => ({ ...x, [k]: v }))} />
    </ModalFrame>
  );
}

/* ------------------------------------------------------------------ confirm */
function ConfirmModal({ m }: { m: M<'confirm'> }) {
  const { closeModal } = useStore();
  const danger = m.tone === 'danger';
  return (
    <ModalFrame
      size="sm"
      onClose={closeModal}
      testID="modal-confirm"
      footer={
        <>
          <Button v="s" label="Cancel" onPress={closeModal} testID="confirm-cancel" />
          <Button
            v={danger ? 'd' : 'p'}
            label={m.label || 'Confirm'}
            testID="confirm-yes"
            onPress={() => {
              closeModal();
              m.onConfirm();
            }}
          />
        </>
      }
    >
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: danger ? '#fecdd3' : C.pri100, backgroundColor: danger ? '#fff1f2' : C.pri50 }}>
          <Icon name={danger ? 'alert-triangle' : 'info'} size={20} color={danger ? '#f43f5e' : C.pri600} />
        </View>
        <View style={{ flex: 1 }}>
          <T style={{ fontWeight: '800', fontSize: 15 }}>{m.title}</T>
          <T style={{ color: C.ink2, fontSize: 14, marginTop: 6, lineHeight: 22 }}>{m.msg}</T>
        </View>
      </View>
    </ModalFrame>
  );
}

/* ------------------------------------------------------------------ staff add / edit */
function StaffModal({ m }: { m: M<'staffAdd'> | M<'staffEdit'> }) {
  const { db, mutate, toast, closeModal } = useStore();
  const isEdit = m.type === 'staffEdit';
  const s = isEdit ? db.staff.find((x) => x.id === m.id) : undefined;
  const [form, setForm] = useState<StaffForm>(() => ({ name: s?.name || '', designation: s?.designation || '', email: s?.email || '', mobile: s?.mobile || '' }));
  const [errs, setErrs] = useState<Errors<StaffForm>>({});
  const [busy, setBusy] = useState(false);
  const submit = () => {
    const e = validateStaff(form);
    setErrs(e);
    if (hasErrors(e)) return;
    setBusy(true);
    const data = { name: form.name.trim(), designation: form.designation, email: form.email.trim(), mobile: form.mobile.trim() };
    setTimeout(() => {
      if (isEdit && s) {
        mutate((d) => apiUpdateStaff(d, s.id, data));
        toast('success', 'Staff updated', data.name + '’s details were saved.');
      } else {
        const st = mutate((d) => apiAddStaff(d, data));
        toast('success', 'Staff added', st.name + ' (' + st.designation + ') can now sign in with their email.');
      }
      closeModal();
    }, 350);
  };
  const set = (k: keyof StaffForm) => (v: string) => setForm((x) => ({ ...x, [k]: v }));
  return (
    <ModalFrame
      title={isEdit ? 'Edit Staff' : 'Add Staff'}
      sub={isEdit && s ? s.name + ' · ' + (s.designation || 'Staff') : 'Creates an active staff account.'}
      onClose={closeModal}
      testID="modal-staff"
      footer={
        <>
          <Button v="s" label="Cancel" onPress={closeModal} />
          <Button icon={isEdit ? 'save' : 'user-plus'} label={isEdit ? 'Save Changes' : 'Add Staff'} loading={busy} onPress={submit} testID="staff-submit" />
        </>
      }
    >
      <View style={{ gap: 16 }}>
        <Field label="Full Name" req err={errs.name}>
          <Input testID="sf-name" value={form.name} onChangeText={set('name')} placeholder="e.g. Priya Nair" err={!!errs.name} />
        </Field>
        <Field label="Designation" req err={errs.designation}>
          <Select testID="sf-designation" value={form.designation} onChange={set('designation')} placeholder="Select designation" title="Designation" options={STAFF_DESIGNATIONS} err={!!errs.designation} />
        </Field>
        <Field label="Email" req err={errs.email}>
          <Input testID="sf-email" value={form.email} onChangeText={set('email')} placeholder="name@clinicflow.test" keyboardType="email-address" autoCapitalize="none" err={!!errs.email} />
        </Field>
        <Field label="Mobile" req err={errs.mobile}>
          <Input testID="sf-mobile" value={form.mobile} onChangeText={set('mobile')} placeholder="10-digit mobile" keyboardType="phone-pad" err={!!errs.mobile} />
        </Field>
        <Note tone="pri" icon="shield" style={{ marginBottom: 0 }}>
          <B>Access: {ROLE_META.reception.label}</B> — staff accounts can register patients, manage visits and the queue. Prescriptions, clinic settings and staff management are doctor-only.
        </Note>
      </View>
    </ModalFrame>
  );
}

/* ------------------------------------------------------------------ reception desk duplicate (was missing in the prototype) */
function DupDeskModal({ m }: { m: M<'dupDesk'> }) {
  const { closeModal } = useStore();
  return (
    <ModalFrame size="lg" title="Possible Existing Patient" sub="We found patients with this mobile number." onClose={closeModal} testID="modal-dup-desk">
      <DupTable mobile={m.mobile} matches={m.matches} onView={(id) => { closeModal(); m.onView(id); }} />
      <View style={{ flexDirection: 'row', marginTop: 20 }}>
        <Button v="s" icon="arrow-right" label="Continue Creating New Patient" onPress={() => { closeModal(); m.onContinue(); }} testID="dup-desk-continue" />
      </View>
    </ModalFrame>
  );
}

/* ------------------------------------------------------------------ visit type choice (reception desk, online enabled) */
function VisitChoiceModal({ m }: { m: M<'visitChoice'> }) {
  const { biz, closeModal } = useStore();
  const [kind, setKind] = useState<VisitType | ''>('');
  const [platform, setPlatform] = useState<Platform3>('');
  const [url, setUrl] = useState('');
  const ok = kind === 'offline' || (kind === 'online' && !!platform);
  return (
    <ModalFrame
      title="Choose visit type"
      sub="Select the consultation mode"
      onClose={closeModal}
      testID="modal-visit-choice"
      footer={
        <>
          <Button v="s" label="Cancel" onPress={closeModal} />
          <Button
            label="Create Visit"
            disabled={!ok}
            testID="choice-confirm"
            onPress={() => {
              const o: VisitOptions = { visitType: kind || 'offline', platform: kind === 'online' ? platform : '', meetingLink: url.trim() };
              closeModal();
              m.onConfirm(o);
            }}
          />
        </>
      }
    >
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Button v="s" selected={kind === 'offline'} full label="🏥 Offline visit" onPress={() => setKind('offline')} testID="choice-offline" />
          </View>
          <View style={{ flex: 1 }}>
            <Button v="s" selected={kind === 'online'} full label="📹 Online visit" onPress={() => setKind('online')} testID="choice-online" />
          </View>
        </View>
        {kind === 'online' ? (
          <View>
            <T style={{ fontSize: 13, fontWeight: '700', marginBottom: 6 }}>Video consultation platform</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['whatsapp', 'meet', 'teams'] as Platform3[]).map((k, i) => (
                <View key={k} style={{ flexGrow: 1, flexBasis: 110 }}>
                  <Button v="s" selected={platform === k} full label={['WhatsApp', 'Google Meet', 'Microsoft Teams'][i]} onPress={() => setPlatform(k)} testID={'choice-pf-' + k} />
                </View>
              ))}
            </View>
            <Field label="Meeting URL (optional for Meet / Teams)" style={{ marginTop: 14 }}>
              <Input value={url} onChangeText={setUrl} placeholder="Paste doctor-created meeting URL" autoCapitalize="none" keyboardType="url" />
            </Field>
          </View>
        ) : null}
        <T style={{ fontSize: 12, color: C.ink2 }}>{'Online fee: ₹' + biz.onlineFee + ' · Offline fee: ₹' + biz.offlineFee}</T>
      </View>
    </ModalFrame>
  );
}

/* ------------------------------------------------------------------ billing & investigations */
function BillingModal({ m }: { m: M<'billing'> }) {
  const { db, biz, mutate, toast, closeModal } = useStore();
  const v = visitById(db, m.visitId);
  const [fee, setFee] = useState(String(v?.fee ?? 0));
  const [method, setMethod] = useState(v?.paymentMethod || 'Cash');
  const [link, setLink] = useState(v?.meetingLink || '');
  const [inv, setInv] = useState((v?.investigations || []).join(', '));
  const [home, setHome] = useState(false);
  const [consent, setConsent] = useState(false);
  if (!v) return null;
  const p = patientById(db, v.patientId);
  if (!p) return null;
  const paymentEnabled = v.visitType === 'online' ? biz.onlinePaymentsEnabled : biz.offlinePaymentsEnabled;
  const investigations = inv.split(',').map((x) => x.trim()).filter(Boolean);

  /** Writes the form fields to the visit (PATCH /visits/{id}) and returns the updated record. */
  const commit = (extra: Partial<Visit> = {}): Visit => {
    const patch: Partial<Visit> = { fee: Math.max(0, Number(fee) || 0), paymentMethod: method, investigations, ...extra };
    if (v.visitType === 'online') patch.meetingLink = link.trim();
    mutate((d) => apiUpdateVisit(d, v.id, patch));
    return { ...v, ...patch };
  };
  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      toast('error', 'Unable to open', 'No app on this device can handle this link.');
      return false;
    }
  };
  const messagePatient = (kind: 'whatsapp' | 'sms') => {
    const cur = commit();
    const msg =
      'Hello ' + p.name + ', your ' + (cur.visitType || 'offline') + ' consultation at ' + db.clinic.name + ' has been registered. Fee: ₹' + cur.fee +
      '. Payment status: ' + (cur.paymentStatus || 'unpaid') + '. Clinic contact: +91 ' + biz.messagingNumber + '.';
    const mobile = p.mobile.replace(/\D/g, '');
    const url = kind === 'whatsapp'
      ? 'https://wa.me/91' + mobile + '?text=' + encodeURIComponent(msg)
      : 'sms:+91' + mobile + (Platform.OS === 'ios' ? '&' : '?') + 'body=' + encodeURIComponent(msg);
    open(url).then((ok) => ok && toast('info', 'Messaging app opened', 'Please send the prepared message manually.'));
  };
  const openCall = () => {
    const cur = commit();
    if (biz.prepay && cur.paymentStatus !== 'paid') {
      toast('warning', 'Payment pending', 'Record payment before opening the online consultation.');
      return;
    }
    if (cur.platform === 'whatsapp') open('https://wa.me/91' + encodeURIComponent(p.mobile.replace(/\D/g, '')));
    else if (/^https:\/\//.test(cur.meetingLink || '')) open(cur.meetingLink!);
    else toast('warning', 'Meeting link needed', 'Paste a valid HTTPS meeting link.');
  };
  const requestLab = (kind: 'email' | 'whatsapp') => {
    if (!consent) {
      toast('warning', 'Consent required', 'Confirm patient consent before sharing details.');
      return;
    }
    if (!investigations.length) {
      toast('warning', 'Add investigations', 'Enter at least one test.');
      return;
    }
    if ((kind === 'email' && !biz.providerEmail) || (kind === 'whatsapp' && !biz.providerWhatsApp)) {
      toast('warning', 'Provider contact missing', 'Add provider contact details in Consultation Settings.');
      return;
    }
    const msg =
      'Diagnostic booking REQUEST (not confirmed)\nPatient: ' + p.name + '\nMobile: ' + p.mobile + '\nTests: ' + investigations.join(', ') +
      '\nHome collection requested: ' + (home ? 'Yes' : 'No') + '\nPlease contact patient to confirm availability and timing.';
    const url = kind === 'email'
      ? 'mailto:' + encodeURIComponent(biz.providerEmail) + '?subject=' + encodeURIComponent('Diagnostic booking request') + '&body=' + encodeURIComponent(msg)
      : 'https://wa.me/' + encodeURIComponent(biz.providerWhatsApp.replace(/\D/g, '')) + '?text=' + encodeURIComponent(msg);
    commit({ labStatus: 'Request prepared' });
    open(url).then((ok) => ok && toast('info', 'Request prepared', 'Sending and booking confirmation must be verified with the provider.'));
  };

  return (
    <ModalFrame
      size="lg"
      title="Visit billing & investigations"
      sub={p.name + ' · ' + v.token + ' · ' + (v.visitType || 'offline') + ' visit'}
      onClose={closeModal}
      testID="modal-billing"
      footer={
        <>
          <Button v="s" label="Close" onPress={closeModal} />
          <Button
            label="Save details"
            testID="billing-save"
            onPress={() => {
              commit();
              closeModal();
              toast('success', 'Visit details saved', 'Changes recorded in this demo session.');
            }}
          />
        </>
      }
    >
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          <Field label="Consultation fee (₹)" style={{ flexGrow: 1, flexBasis: 200 }}>
            <Input testID="bill-fee" keyboardType="number-pad" value={fee} onChangeText={(x) => setFee(x.replace(/[^0-9.]/g, ''))} />
          </Field>
          <Field label="Payment method" style={{ flexGrow: 1, flexBasis: 200 }}>
            <Select testID="bill-method" value={method} onChange={setMethod} options={PAYMENT_METHODS} title="Payment method" />
          </Field>
        </View>
        {paymentEnabled ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Button v="s" s="sm" label="Mark paid (manual)" onPress={() => { commit({ paymentStatus: 'paid' }); toast('success', 'Payment record updated', 'Manual status saved for prototype.'); }} testID="bill-paid" />
            <Button v="s" s="sm" label="Mark unpaid" onPress={() => { commit({ paymentStatus: 'unpaid' }); toast('success', 'Payment record updated', 'Manual status saved for prototype.'); }} testID="bill-unpaid" />
            <Button
              v="s"
              s="sm"
              label="Print receipt"
              testID="bill-receipt"
              onPress={async () => {
                const cur = commit();
                const ok = await printHtml(receiptHtml(cur, p.name, db.clinic.name));
                if (!ok) toast('warning', 'Unable to print', 'The print service is not available on this device.');
              }}
            />
            <Button v="s" s="sm" label="WhatsApp patient" onPress={() => messagePatient('whatsapp')} testID="bill-wa" />
            <Button v="s" s="sm" label="SMS patient" onPress={() => messagePatient('sms')} testID="bill-sms" />
          </View>
        ) : (
          <>
            <T style={{ fontSize: 12, color: C.ink3 }}>Payment controls disabled for this visit type in Settings.</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button v="s" s="sm" label="WhatsApp patient" onPress={() => messagePatient('whatsapp')} />
              <Button v="s" s="sm" label="SMS patient" onPress={() => messagePatient('sms')} />
            </View>
          </>
        )}
        <T style={{ fontSize: 12, color: C.ink2 }} testID="bill-status">
          Payment status: <T style={{ fontWeight: '700', fontSize: 12 }}>{v.paymentStatus || 'unpaid'}</T>. This is a manual demo record, not gateway verification or bank settlement.
        </T>
        {v.visitType === 'online' ? (
          <View style={cardSt}>
            <T style={{ fontWeight: '700' }}>Online consultation</T>
            <T style={{ fontSize: 12, color: C.ink2 }}>{'Platform: ' + (v.platform || '') + ' · Prepayment ' + (biz.prepay ? 'required' : 'optional')}</T>
            <Field label="Meeting link">
              <Input value={link} onChangeText={setLink} placeholder="https://meet.google.com/..." autoCapitalize="none" keyboardType="url" />
            </Field>
            <View style={{ flexDirection: 'row' }}>
              <Button v="s" s="sm" label="Open meeting / WhatsApp" onPress={openCall} testID="bill-call" />
            </View>
          </View>
        ) : null}
        {biz.diagnosticsEnabled ? (
          <View style={cardSt}>
            <T style={{ fontWeight: '800', fontSize: 14 }}>Diagnostic request</T>
            <Field label="Investigations (comma-separated)">
              <Input testID="bill-inv" value={inv} onChangeText={setInv} placeholder="CBC, HbA1c, X-ray" />
            </Field>
            <Checkbox checked={home} onChange={setHome} label="Request home collection (subject to provider confirmation)" />
            <Checkbox checked={consent} onChange={setConsent} label="Patient consent to share request and contact details with provider" testID="bill-consent" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Button v="s" s="sm" label="Prepare email" onPress={() => requestLab('email')} testID="bill-email" />
              <Button v="s" s="sm" label="Prepare WhatsApp" onPress={() => requestLab('whatsapp')} testID="bill-lab-wa" />
            </View>
            <T style={{ fontSize: 12, color: C.ink2 }}>{'Booking status: ' + (v.labStatus || 'Not requested') + '. External provider must confirm the appointment.'}</T>
          </View>
        ) : null}
        {v.paymentStatus === 'paid' ? <Badge tone="g" icon="check" label="Paid (manual record)" /> : null}
      </View>
    </ModalFrame>
  );
}

/* ------------------------------------------------------------------ prompt (replaces window.prompt) */
function PromptModal({ m }: { m: M<'prompt'> }) {
  const { closeModal } = useStore();
  const [val, setVal] = useState(m.value);
  const submit = () => {
    closeModal();
    m.onSubmit(val);
  };
  return (
    <ModalFrame
      size="sm"
      title={m.title}
      onClose={closeModal}
      testID="modal-prompt"
      footer={
        <>
          <Button v="s" label="Cancel" onPress={closeModal} />
          <Button icon="save" label="Save" onPress={submit} testID="prompt-save" />
        </>
      }
    >
      <Field label={m.label}>
        <Input testID="prompt-input" value={val} onChangeText={setVal} autoFocus onSubmitEditing={submit} />
      </Field>
    </ModalFrame>
  );
}