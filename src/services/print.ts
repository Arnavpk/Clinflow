/**
 * Printing & PDF export. Replaces window.print() from the web prototype:
 *  - Print  → expo-print system print dialog (AirPrint / Android print service).
 *  - PDF    → expo-print renders an A4 PDF, expo-sharing opens the share sheet to save/send it.
 * On web, a print window is opened with the same A4 HTML ("Save as PDF" is a destination there).
 */
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Clinic, DraftRx, Patient, Visit } from '../types';
import { fmtDate } from '../utils/format';

const A4 = { width: 595, height: 842 };

const esc = (s: unknown) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const HEART =
  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.51 4.04 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>';

export function prescriptionHtml(rx: DraftRx, p: Pick<Patient, 'name' | 'id' | 'gender'> & { age: number | string; bloodGroup?: string }, cl: Clinic): string {
  const meds = rx.medicines || [];
  const rows = meds
    .map(
      (m, i) =>
        '<tr><td class="mono faint">' + String(i + 1).padStart(2, '0') + '</td><td><b>' + esc(m.name) + '</b>' +
        (m.mealTiming || m.instructions ? '<div class="sub">' + esc([m.mealTiming, m.instructions].filter(Boolean).join(' · ')) + '</div>' : '') +
        '</td><td>' + esc(m.dosage || '—') + '</td><td>' + esc(m.frequency || '—') + '</td><td class="r">' + (m.duration ? esc(m.duration + ' ' + m.unit) : '—') + '</td></tr>',
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page{size:A4;margin:12mm}
  *{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;color:#1e293b;font-size:14px}
  .mono{font-family:ui-monospace,Menlo,Consolas,monospace}.faint{color:#87988f}
  .head{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #226758;padding-bottom:24px}
  .logo{width:56px;height:56px;border-radius:14px;background:#27806c;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none}
  .logo img{width:100%;height:100%;object-fit:cover}
  h1{font-size:22px;font-weight:800;margin:0;color:#16261f;letter-spacing:-.02em}.cl p{font-size:13px;color:#51655e;margin:4px 0 0;line-height:1.5}
  .rx{text-align:right}.sym{font-size:34px;font-weight:700;color:#226758;font-family:Georgia,serif;line-height:1}
  .pt{display:flex;gap:24px;border:1px solid #e3eae7;background:#f8faf9;border-radius:12px;padding:16px 20px;margin-top:24px}
  .k{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#87988f}.v{font-size:14px;font-weight:700;margin-top:2px}
  table{width:100%;border-collapse:collapse;margin-top:24px}th{text-align:left;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#87988f;border-bottom:2px solid #e2e8e6;padding:8px 12px 8px 0}
  td{padding:12px 12px 12px 0;border-bottom:1px solid #e3eae780;vertical-align:top}.r{text-align:right;padding-right:0}.sub{font-size:12px;color:#51655e;margin-top:2px}
  .adv{margin-top:28px}.adv .t{margin-top:8px;border-left:2px solid #bce5d9;padding-left:16px;line-height:1.6;color:#334155;white-space:pre-wrap}
  .fu{display:inline-block;border:1px solid #fde68a;background:#fffbeb;color:#92400e;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700;margin-top:24px}
  .foot{margin-top:48px;display:flex;justify-content:space-between;align-items:flex-end}.sign{width:200px;border-top:1px solid #cbd5d0;padding-top:8px;text-align:center}
  .none{text-align:center;color:#87988f;border:1px dashed #e3eae7;border-radius:12px;padding:20px;margin-top:24px;font-size:12px}
  </style></head><body>
  <div class="head"><div style="display:flex;gap:16px"><div class="logo">${cl.logo ? '<img src="' + esc(cl.logo) + '">' : HEART}</div>
  <div class="cl"><h1>${esc(cl.name)}</h1><p>${esc(cl.address)}</p><p>${esc(cl.phone)} · ${esc(cl.timings)}</p></div></div>
  <div class="rx"><div class="sym">&#8478;</div><div style="font-weight:700;margin-top:6px">${esc(rx.doctor || cl.doctorName)}</div><div class="faint" style="font-size:12px">Reg. No. ${esc(cl.regNo)}</div></div></div>
  <div class="pt"><div><div class="k">Patient Name</div><div class="v">${esc(p.name)}</div></div><div><div class="k">Patient ID</div><div class="v mono">${esc(p.id)}</div></div>
  <div><div class="k">Age / Gender</div><div class="v">${esc(p.age)} yrs · ${esc(p.gender)}</div></div><div><div class="k">Blood Group</div><div class="v">${esc(p.bloodGroup || '—')}</div></div><div><div class="k">Date</div><div class="v">${fmtDate(rx.date)}</div></div></div>
  ${meds.length ? '<table><thead><tr><th style="width:36px">#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th class="r">Duration</th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="none">No medicines recorded on this prescription.</div>'}
  ${rx.advice ? '<div class="adv"><div class="k">Advice</div><div class="t">' + esc(rx.advice) + '</div></div>' : ''}
  ${rx.followUp ? '<div class="fu">Follow-up: ' + fmtDate(rx.followUp) + '</div>' : ''}
  <div class="foot"><p class="faint" style="font-size:12px;max-width:240px;line-height:1.6">Computer-generated prescription · TriSetu CMS V1<br>${fmtDate(rx.date)}</p>
  <div class="sign"><div style="font-weight:700">${esc(rx.doctor || cl.doctorName)}</div><div class="faint" style="font-size:12px">${esc(cl.name)}</div></div></div>
  </body></html>`;
}

export function receiptHtml(v: Visit, patientName: string, clinicName: string): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8"><title>Consultation receipt</title></head><body style="font:16px Arial;padding:32px">' +
    '<h2>Consultation Receipt</h2><p>' + esc(clinicName) + '</p><p>Patient: ' + esc(patientName) + '</p><p>Date: ' + esc(v.date) +
    '</p><p>Visit: ' + esc(v.token) + '</p><h3>₹' + esc(v.fee ?? 0) + '</h3><p>Payment: ' + esc(v.paymentStatus || 'unpaid') + ' · ' + esc(v.paymentMethod || '') +
    '</p><p>Prototype record — manually entered, not bank verified.</p></body></html>'
  );
}

function webPrint(html: string): boolean {
  const g = globalThis as unknown as { open?: (u: string, t: string) => { document: { write: (h: string) => void; close: () => void }; focus: () => void; print: () => void } | null };
  const w = g.open ? g.open('', '_blank') : null;
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
  return true;
}

/** Opens the system print dialog. Returns false if printing could not start. */
export async function printHtml(html: string): Promise<boolean> {
  if (Platform.OS === 'web') return webPrint(html);
  try {
    await Print.printAsync({ html, ...A4 });
    return true;
  } catch {
    return false;
  }
}

/** Renders an A4 PDF and opens the share sheet. On web it falls back to the print dialog. */
export async function exportPdf(html: string, fileLabel: string): Promise<'shared' | 'printed' | 'failed'> {
  if (Platform.OS === 'web') return webPrint(html) ? 'printed' : 'failed';
  try {
    const { uri } = await Print.printToFileAsync({ html, ...A4 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: fileLabel });
      return 'shared';
    }
    await Print.printAsync({ uri });
    return 'printed';
  } catch {
    return 'failed';
  }
}