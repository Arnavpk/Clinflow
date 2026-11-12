import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Card, CardHead, EmptyBox, Grid, Icon, PageHead, SearchInput, StatCard, StatusBadge, T, TokChip } from '../components/ui';
import { QueueCards, TokenCard } from '../components/domain';
import { Page } from '../layout/Page';
import { C, useBp } from '../theme/tokens';
import { useStore } from '../store/AppStore';
import { useActions } from '../hooks/useActions';
import { patientById, patientName, todaysVisits } from '../services/selectors';
import { dayPart, fmtLong, todayISO } from '../utils/format';

export function DoctorDashboard() {
  const { db, user } = useStore();
  const a = useActions();
  const { sm, lg, xl } = useBp();
  const [ref, setRef] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);
  const tv = todaysVisits(db);
  const waitingL = tv.filter((v) => v.status === 'waiting');
  const current = tv.find((v) => v.status === 'in_consultation');
  const done = tv.filter((v) => v.status === 'completed').length;
  const canc = tv.filter((v) => v.status === 'cancelled').length;
  const pToday = new Set(tv.map((v) => v.patientId)).size;
  const refresh = () => {
    setRef(true);
    t.current = setTimeout(() => setRef(false), 500);
  };
  return (
    <Page>
      <PageHead
        title={'Good ' + dayPart() + ', ' + (user?.name || '').replace('Dr. ', '')}
        sub={fmtLong(todayISO()) + ' · ' + db.clinic.name}
        actions={
          <>
            <Button v="s" icon="refresh" label="Refresh" loading={ref} onPress={refresh} testID="dash-refresh" />
            <Button icon="user-plus" label="New Patient" onPress={a.openAddPatient} testID="new-patient" />
          </>
        }
      />
      <Grid cols={xl ? 4 : sm ? 2 : 1}>
        <StatCard label="Patients Today" value={pToday} sub={'across ' + tv.length + ' visits'} icon="users" tone="p" loading={ref} />
        <StatCard label="Waiting" value={waitingL.length} sub="Awaiting consultation" icon="clock" tone="a" loading={ref} />
        <StatCard label="Completed" value={done} sub="Finished today" icon="check-circle" tone="g" loading={ref} />
        <StatCard label="Cancelled" value={canc} sub="Cancelled today" icon="ban" tone="s" loading={ref} />
      </Grid>
      <Grid weights={lg ? [2, 1] : undefined} gap={20} style={{ marginTop: 20 }}>
        <Card>
          <CardHead icon="clipboard" title={'Today’s Queue'} sub={'Live view of today’s visits'} />
          <QueueCards
            visits={tv}
            role="doctor"
            from="/doctor/dashboard"
            empty={<EmptyBox icon="inbox" title="No visits today" msg="When the reception desk creates visits, they will appear here." />}
          />
        </Card>
        <View style={{ gap: 20 }}>
          <TokenCard v={current} />
          <Card>
            <CardHead icon="clock" title="Waiting" sub={waitingL.length + ' patient(s) in the waiting area'} />
            <View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
              {waitingL.length ? (
                waitingL.slice(0, 5).map((v, i) => (
                  <Pressable
                    key={v.id}
                    testID={'wait-row-' + v.id}
                    onPress={() => a.qOpen(v.id)}
                    style={({ pressed }) => [
                      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 8 },
                      i < Math.min(waitingL.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: C.lineSoft },
                      pressed && { backgroundColor: C.hoverRow },
                    ]}
                  >
                    <TokChip value={v.token} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T numberOfLines={1} style={{ fontWeight: '700', fontSize: 14 }}>{patientName(db, v.patientId)}</T>
                      <T style={{ fontSize: 12, color: C.ink3 }}>{v.time + ' · ' + (patientById(db, v.patientId)?.age ?? '') + ' yrs'}</T>
                    </View>
                    <StatusBadge status={v.status} />
                  </Pressable>
                ))
              ) : (
                <EmptyBox icon="check-circle" title="Nobody waiting" msg="The waiting area is clear right now." compact />
              )}
            </View>
          </Card>
        </View>
      </Grid>
    </Page>
  );
}

export function ReceptionDashboard() {
  const { db, go } = useStore();
  const a = useActions();
  const { sm, xl } = useBp();
  const [q, setQ] = useState('');
  const tv = todaysVisits(db);
  const current = tv.find((v) => v.status === 'in_consultation');
  const waiting = tv.filter((v) => v.status === 'waiting');
  const pToday = new Set(tv.map((v) => v.patientId)).size;
  const deskGo = () => {
    if (q.trim()) go('/reception/desk?q=' + encodeURIComponent(q.trim()));
  };
  return (
    <Page>
      <PageHead title="Reception Overview" sub={fmtLong(todayISO()) + ' · ' + db.clinic.name} />
      <Grid cols={xl ? 3 : sm ? 2 : 1}>
        <StatCard label="Patients Today" value={pToday} sub={'across ' + tv.length + ' visits'} icon="users" tone="p" />
        <StatCard label="Current Token" value={current ? current.token : '—'} sub={current ? patientName(db, current.patientId) : 'No active consultation'} icon="play" dark mono />
        <StatCard label="Pending Queue" value={waiting.length} sub={waiting[0] ? 'Next: ' + waiting[0].token : 'Queue clear'} icon="clock" tone="a" />
      </Grid>
      <Card style={{ marginTop: 20, padding: 20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
          <View style={{ flexGrow: 1, flexBasis: 260, minWidth: 0 }}>
            <T style={{ fontWeight: '800', fontSize: 14 }}>Find a patient quickly</T>
            <T style={{ fontSize: 12, color: C.ink3, marginTop: 4 }}>Search by name, Patient ID or mobile — then create a visit at the desk.</T>
            <View style={{ marginTop: 10, maxWidth: 520 }}>
              <SearchInput testID="rd-q" big value={q} onChangeText={setQ} onSubmit={deskGo} placeholder="Search a patient to create a visit…" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Button icon="user-plus" label="Register Patient" onPress={a.openAddPatient} testID="rd-register" />
            <Button v="s" icon="plus" label="Create Visit" onPress={() => a.openVisit()} testID="rd-create-visit" />
            <Button v="g" iconRight="arrow-right" label="View Queue" onPress={() => go('/visits')} />
          </View>
        </View>
      </Card>
      <Card style={{ marginTop: 20 }}>
        <CardHead
          icon="clipboard"
          title={'Today’s Queue'}
          sub={tv.length + ' visit(s) · reception can open patients or cancel visits'}
          right={
            <Pressable onPress={() => go('/queue')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <T style={{ fontSize: 13, fontWeight: '700', color: C.pri700 }}>Full queue view</T>
              <Icon name="chevron-right" size={14} color={C.pri700} />
            </Pressable>
          }
        />
        <QueueCards
          visits={tv}
          role="reception"
          from="/reception/dashboard"
          empty={<EmptyBox icon="inbox" title="No visits today" msg={'Register a patient and create a visit to start today’s queue.'} action={<Button icon="user-plus" label="Register Patient" onPress={a.openAddPatient} />} />}
        />
      </Card>
    </Page>
  );
}