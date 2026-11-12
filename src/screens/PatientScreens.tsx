import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Avatar, Badge, Button, Card, Col, Dropdown, EmptyBox, ErrBox, Icon, IdChip, LoadingBox, PageHead, Pagination, SearchInput, Select, T, Table, Tabs,
} from '../components/ui';
import { BloodBadge, RxCard, VisitCard } from '../components/domain';
import { Page } from '../layout/Page';
import { C, MONO, useBp } from '../theme/tokens';
import { useStore } from '../store/AppStore';
import { useActions } from '../hooks/useActions';
import { lastVisitOf, patientById } from '../services/selectors';
import { searchPatients, type SearchField } from '../utils/validation';
import { fmtDate } from '../utils/format';
import type { Patient } from '../types';

/** Simulates the network latency of the future GET request (prototype showed a loading state). */
function useFakeLoad(ms: number) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

const PAGE = 8;

export function PatientsScreen() {
  const { db, go } = useStore();
  const a = useActions();
  const { sm } = useBp();
  const loading = useFakeLoad(400);
  const [q, setQ] = useState('');
  const [field, setField] = useState<SearchField>('all');
  const [page, setPage] = useState(1);

  const all = searchPatients(db.patients, q, field);
  const pages = Math.max(1, Math.ceil(all.length / PAGE));
  const cur = page > pages ? 1 : page;
  const rows = all.slice((cur - 1) * PAGE, cur * PAGE);

  const cols: Col<Patient>[] = [
    { key: 'id', title: 'Patient ID', w: 110, render: (p) => <IdChip value={p.id} /> },
    {
      key: 'name', title: 'Name', w: 250,
      render: (p) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar name={p.name} size="sm" />
          <View style={{ flexShrink: 1 }}>
            <T style={{ fontWeight: '700' }} numberOfLines={1}>{p.name}</T>
            {p.email ? <T numberOfLines={1} style={{ fontSize: 12, color: C.ink3 }}>{p.email}</T> : null}
          </View>
        </View>
      ),
    },
    { key: 'age', title: 'Age', w: 64, render: (p) => <T style={{ color: C.ink2 }}>{String(p.age)}</T> },
    { key: 'gender', title: 'Gender', w: 90, render: (p) => <T style={{ color: C.ink2 }}>{p.gender}</T> },
    { key: 'blood', title: 'Blood', w: 84, render: (p) => (p.bloodGroup ? <BloodBadge group={p.bloodGroup} /> : <T style={{ color: C.ink3 }}>—</T>) },
    { key: 'mobile', title: 'Mobile', w: 130, render: (p) => <T style={{ fontFamily: MONO, fontSize: 13, color: C.ink2 }}>{p.mobile}</T> },
    { key: 'last', title: 'Last Visit', w: 120, render: (p) => { const l = lastVisitOf(db, p.id); return <T style={{ color: C.ink2 }}>{l ? fmtDate(l.date) : '—'}</T>; } },
    {
      key: 'act', title: '', w: 60, align: 'right',
      render: (p) => (
        <Dropdown
          testID={'pat-dd-' + p.id}
          items={[
            { label: 'Open Profile', icon: 'user', onPress: () => go('/patients/' + p.id), testID: 'pat-open-' + p.id },
            { label: 'Edit Patient', icon: 'edit', onPress: () => a.openEdit(p.id), testID: 'pat-edit-' + p.id },
            { label: 'Create Visit', icon: 'plus', onPress: () => a.openVisit(p.id), testID: 'pat-visit-' + p.id },
          ]}
        />
      ),
    },
  ];

  let body: React.ReactNode;
  if (loading) body = <LoadingBox label="Loading patients…" />;
  else if (!all.length)
    body = q ? (
      <EmptyBox
        icon="search"
        title="No patients found"
        msg={'No patient matches “' + q + '”. Try a different name, ID or mobile number.'}
        action={<Button v="s" icon="refresh" label="Clear Search" onPress={() => { setQ(''); setField('all'); setPage(1); }} />}
      />
    ) : (
      <EmptyBox icon="users" title="No patients yet" msg="Register your first patient to get started." action={<Button icon="user-plus" label="Add Patient" onPress={a.openAddPatient} />} />
    );
  else
    body = (
      <>
        <Table cols={cols} rows={rows} rowKey={(p) => p.id} testID="patients-table" />
        <Pagination page={cur} size={PAGE} total={all.length} onPage={setPage} />
      </>
    );

  return (
    <Page>
      <PageHead
        title="Patients"
        sub={db.patients.length + ' patients registered at ' + db.clinic.name}
        actions={<Button icon="user-plus" label="Add Patient" onPress={a.openAddPatient} testID="add-patient" />}
      />
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <View style={{ flexGrow: 1, flexBasis: 220, maxWidth: 420 }}>
            <SearchInput testID="pat-q" value={q} onChangeText={(v) => { setQ(v); setPage(1); }} placeholder="Search by name, Patient ID or mobile…" />
          </View>
          <View style={{ width: sm ? 160 : '100%' }}>
            <Select
              testID="pat-field"
              value={field}
              onChange={(v) => { setField(v as SearchField); setPage(1); }}
              title="Search field"
              options={[
                { value: 'all', label: 'Search: All' },
                { value: 'id', label: 'Search: ID' },
                { value: 'name', label: 'Search: Name' },
                { value: 'mobile', label: 'Search: Mobile' },
              ]}
            />
          </View>
        </View>
        {body}
      </Card>
    </Page>
  );
}

export function PatientProfileScreen({ patientId }: { patientId: string }) {
  const { db, user, go } = useStore();
  const a = useActions();
  const loading = useFakeLoad(450);
  const [tab, setTab] = useState<'visits' | 'rx'>('visits');
  if (loading)
    return (
      <Page>
        <Card>
          <LoadingBox label="Loading patient history…" />
        </Card>
      </Page>
    );
  const p = patientById(db, patientId);
  if (!p)
    return (
      <Page>
        <Card>
          <ErrBox title="Patient not found" msg={'No patient exists with ID ' + patientId + '.'} retry="Back to Patients" onRetry={() => go('/patients')} />
        </Card>
      </Page>
    );
  const visits = db.visits.filter((v) => v.patientId === p.id).sort((x, y) => y.date.localeCompare(x.date) || y.id.localeCompare(x.id));
  const rxs = db.prescriptions.filter((r) => r.patientId === p.id).sort((x, y) => y.date.localeCompare(x.date));
  const from = '/patients/' + p.id;
  return (
    <Page>
      <View style={{ gap: 20 }}>
        <Card style={{ paddingVertical: 20, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
            <Avatar name={p.name} size="xl" />
            <View style={{ flexGrow: 1, flexBasis: 220, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <T style={{ fontWeight: '800', fontSize: 20, letterSpacing: -0.4 }} accessibilityRole="header">{p.name}</T>
                <IdChip value={p.id} />
                <Badge tone="gray" label={p.age + ' yrs'} />
                <Badge tone="gray" label={p.gender} />
                {p.bloodGroup ? <BloodBadge group={p.bloodGroup} /> : <Badge tone="gray" icon="droplet" label="Blood group not recorded" />}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, rowGap: 6, marginTop: 10 }}>
                <Meta icon="phone" text={p.mobile} />
                <Meta icon="mail" text={p.email || 'Email not added'} />
                <Meta icon="history" text={'Registered ' + fmtDate(p.registeredOn)} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Button v="s" icon="edit" label="Edit Patient" onPress={() => a.openEdit(p.id)} testID="profile-edit" />
              <Button icon="plus" label="Create Visit" onPress={() => a.openVisit(p.id)} testID="profile-visit" />
            </View>
          </View>
        </Card>
        <Card>
          <View style={{ paddingTop: 12, paddingHorizontal: 20 }}>
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { key: 'visits', label: 'Visit History', count: visits.length },
                { key: 'rx', label: 'Prescriptions', count: rxs.length },
              ]}
            />
          </View>
          <View style={{ padding: 20, gap: 16 }}>
            {tab === 'visits'
              ? visits.length
                ? visits.map((v) => <VisitCard key={v.id} v={v} from={from} />)
                : <EmptyBox icon="inbox" title="No previous visits" msg="Visits will appear here after the first consultation." />
              : rxs.length
                ? rxs.map((rx) => <RxCard key={rx.id} rx={rx} from={from} onReuse={user?.role === 'doctor' ? () => a.rxReuse(rx.id, rx.patientId) : undefined} />)
                : <EmptyBox icon="pill" title="No prescriptions yet" msg="Prescriptions created during consultations will appear here." />}
          </View>
        </Card>
      </View>
    </Page>
  );
}

function Meta({ icon, text }: { icon: 'phone' | 'mail' | 'history'; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={13} color={C.ink2} />
      <T style={{ fontSize: 13, color: C.ink2 }}>{text}</T>
    </View>
  );
}