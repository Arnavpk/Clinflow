import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { T } from './Icon';
import { IconButton } from './Button';
import { LoadingBox } from './Display';
import { C } from '../../theme/tokens';

export interface Col<R> {
  key: string;
  title: string;
  /** Base column width in px. Columns grow proportionally when the card is wider than the table. */
  w: number;
  align?: 'left' | 'right';
  render: (r: R) => React.ReactNode;
}

/** `.tbl` inside `.tblwrap` — horizontally scrollable on narrow screens, exactly like overflow-x:auto. */
export function Table<R>({
  cols,
  rows,
  rowKey,
  empty,
  loading,
  loadingLabel,
  testID,
}: {
  cols: Col<R>[];
  rows: R[];
  rowKey: (r: R) => string;
  empty?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  testID?: string;
}) {
  const [cw, setCw] = useState(0);
  const base = cols.reduce((a, c) => a + c.w, 0);
  /* columns may compress slightly before the table starts scrolling (HTML tables shrink cells to fit) */
  const total = Math.max(cw, Math.round(base * 0.97));
  const scale = total / base;
  return (
    <View testID={testID} onLayout={(e) => setCw(Math.floor(e.nativeEvent.layout.width))}>
      <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled bounces={false}>
        <View style={{ width: total }}>
          <View style={st.head}>
            {cols.map((c) => (
              <View key={c.key} style={[st.th, { width: c.w * scale }]}>
                <T style={[st.thTxt, c.align === 'right' && { textAlign: 'right' }]}>
                  {c.title}
                </T>
              </View>
            ))}
          </View>
          {!loading &&
            rows.map((r, i) => (
              <Pressable
                key={rowKey(r)}
                style={({ pressed }) => [st.row, i === rows.length - 1 && { borderBottomWidth: 0 }, pressed && { backgroundColor: C.hoverRow }]}
              >
                {cols.map((c) => (
                  <View key={c.key} style={[st.td, { width: c.w * scale }, c.align === 'right' && { alignItems: 'flex-end' }]}>
                    {c.render(r)}
                  </View>
                ))}
              </Pressable>
            ))}
        </View>
      </ScrollView>
      {loading ? <LoadingBox label={loadingLabel} /> : !rows.length ? empty : null}
    </View>
  );
}

/** Numbered pagination with ellipses (ported from the Patients page). */
export function Pagination({ page, size, total, onPage, noun = 'patients' }: { page: number; size: number; total: number; onPage: (p: number) => void; noun?: string }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  let nums: (number | '…')[];
  if (pages <= 7) nums = Array.from({ length: pages }, (_, i) => i + 1);
  else {
    nums = [1];
    if (page > 3) nums.push('…');
    for (let p = Math.max(2, page - 1); p <= Math.min(pages - 1, page + 1); p++) nums.push(p);
    if (page < pages - 2) nums.push('…');
    nums.push(pages);
  }
  const from = total ? (page - 1) * size + 1 : 0;
  const to = Math.min(total, page * size);
  return (
    <View style={st.pag}>
      <T style={{ fontSize: 12, color: C.ink3 }}>
        Showing <T style={st.pagB}>{from + '–' + to}</T> of <T style={st.pagB}>{total}</T> {noun}
      </T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <IconButton icon="chevron-left" small title="Previous" disabled={page === 1} onPress={() => onPage(page - 1)} />
        {nums.map((n, i) =>
          n === '…' ? (
            <T key={'e' + i} style={{ fontSize: 12, color: C.ink3, paddingHorizontal: 4 }}>
              …
            </T>
          ) : (
            <Pressable
              key={n}
              accessibilityLabel={'Page ' + n}
              onPress={() => onPage(n)}
              style={({ pressed }) => [st.pnum, n === page ? { backgroundColor: C.pri600 } : pressed ? { backgroundColor: C.hoverBg } : null]}
            >
              <T style={{ fontSize: 13, fontWeight: '600', color: n === page ? C.white : C.ink2 }}>{n}</T>
            </Pressable>
          ),
        )}
        <IconButton icon="chevron-right" small title="Next" disabled={page === pages} onPress={() => onPage(page + 1)} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', backgroundColor: C.surface2, borderBottomWidth: 1, borderBottomColor: C.line },
  th: { paddingVertical: 12, paddingHorizontal: 16 },
  thTxt: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9, color: C.ink3 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.lineSoft, alignItems: 'center' },
  td: { paddingVertical: 14, paddingHorizontal: 16, justifyContent: 'center' },
  pag: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 14, paddingHorizontal: 20 },
  pagB: { fontSize: 12, fontWeight: '700', color: C.ink2 },
  pnum: { minWidth: 32, height: 32, paddingHorizontal: 8, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
