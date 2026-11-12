import { useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Col, DateInput, EmptyBox, Grid, IdChip, Input, PageHead, Select, StatCard, StatusBadge, T, Table } from '../components/ui';
import { Page } from '../layout/Page';
import { C, useBp } from '../theme/tokens';
import { useStore } from '../store/AppStore';
import { useActions } from '../hooks/useActions';
import { dateInRange, patientById, patientName } from '../services/selectors';
import { fmtDate } from '../utils/format';
import type { Visit } from '../types';

const PAGE = 10;

export function VisitsScreen() {
  const { db } = useStore();
  const a = useActions();
  const { sm, xl } = useBp();
  const [period, setPeriod] = useState('month');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [page, setPage] = useState(1);

  const all = db.visits.filter((v) => dateInRange(v.date, period, start, end));
  const ql = q.toLowerCase();
  const rows = all
    .filter((v) => {
      const p = patientById(db, v.patientId);
      return (status === 'all' || v.status === status) && (!ql || (!!p && (p.name.toLowerCase().includes(ql) || p.id.toLowerCase().includes(ql))));
    })
    .sort((x, y) => (y.date + ' ' + y.time).localeCompare(x.date + ' ' + x.time));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages);
  const current = rows.slice((cur - 1) * PAGE, cur * PAGE);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(1); };

  const cols: Col<Visit>[] = [
    { key: 'date', title: 'Date', w: 124, render: (v) => <T numberOfLines={1}>{fmtDate(v.date)}</T> },
    { key: 'pt', title: 'Patient', w: 120, render: (v) => <T>{patientName(db, v.patientId)}</T> },
    { key: 'pid', title: 'Patient ID', w: 106, render: (v) => <IdChip value={v.patientId} /> },
    { key: 'vid', title: 'Visit ID / Token', w: 110, render: (v) => <T>{v.id + ' · ' + v.token}</T> },
    { key: 'time', title: 'Visit Time', w: 80, render: (v) => <T>{v.time}</T> },
    { key: 'st', title: 'Status', w: 150, render: (v) => <StatusBadge status={v.status} /> },
    {
      key: 'rx', title: 'Prescription', w: 116,
      render: (v) => (v.prescriptionId ? <Button v="s" s="xs" label="View Rx" onPress={() => a.rxView(v.prescriptionId!, '/visits')} /> : <T style={{ color: C.ink3 }}>—</T>),
    },
    {
      key: 'act', title: 'Actions', w: 176,
      render: (v) => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button v="g" s="xs" label="Open" onPress={() => a.qOpen(v.id)} testID={'v-open-' + v.id} />
          {v.status !== 'cancelled' ? <Button v="s" s="xs" icon="receipt" label="Billing" onPress={() => a.openBilling(v.id)} testID={'v-bill-' + v.id} /> : null}
        </View>
      ),
    },
  ];

  const ctl = { width: sm ? 'auto' : '100%', minWidth: 150 } as const;
  return (
    <Page>
      <PageHead title="Visits" sub={'Historical visits across all patients · ' + all.length + ' in selected period'} />
      <Grid cols={xl ? 4 : sm ? 2 : 1}>
        <StatCard label="Total Visits" value={all.length} icon="clipboard" tone="p" />
        <StatCard label="Unique Patients" value={new Set(all.map((v) => v.patientId)).size} icon="users" tone="s" />
        <StatCard label="Completed" value={all.filter((v) => v.status === 'completed').length} icon="check-circle" tone="g" />
        <StatCard label="Cancelled" value={all.filter((v) => v.status === 'cancelled').length} icon="ban" tone="a" />
      </Grid>
      <Card style={{ marginTop: 20 }}>
        <View style={{ padding: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <View style={ctl}>
            <Select
              testID="visit-period"
              title="Period"
              value={period}
              onChange={reset(setPeriod)}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'custom', label: 'Custom Range' },
              ]}
            />
          </View>
          {period === 'custom' ? (
            <>
              <View style={ctl}>
                <DateInput testID="visit-start" value={start} onChange={reset(setStart)} placeholder="Start date" />
              </View>
              <View style={ctl}>
                <DateInput testID="visit-end" value={end} onChange={reset(setEnd)} placeholder="End date" />
              </View>
            </>
          ) : null}
          <View style={ctl}>
            <Select
              testID="visit-status"
              title="Status"
              value={status}
              onChange={reset(setStatus)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </View>
          <View style={{ flexGrow: 1, flexBasis: 180 }}>
            <Input testID="visit-q" value={q} onChangeText={reset(setQ)} placeholder="Search patient name or ID" autoCorrect={false} />
          </View>
        </View>
        <Table cols={cols} rows={current} rowKey={(v) => v.id} empty={<EmptyBox icon="inbox" title="No visits found" msg="Adjust the selected filters." />} testID="visits-table" />
        <View style={{ padding: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          <T style={{ fontSize: 12, color: C.ink2 }}>{rows.length + ' matching visits · Page ' + cur + ' of ' + pages}</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button v="s" label="Previous" disabled={cur <= 1} onPress={() => setPage(cur - 1)} testID="visits-prev" />
            <Button v="s" label="Next" disabled={cur >= pages} onPress={() => setPage(cur + 1)} testID="visits-next" />
          </View>
        </View>
      </Card>
    </Page>
  );
}
