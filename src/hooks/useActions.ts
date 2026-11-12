import { useCallback, useMemo } from 'react';
import { useStore } from '../store/AppStore';
import { apiCancelVisit, apiCompleteVisit, apiStartConsultation } from '../services/api';
import { patientName, visitById } from '../services/selectors';

/** Shared action handlers (the prototype's `Act` registry entries used by several screens). */
export function useActions() {
  const { db, mutate, toast, openModal, go } = useStore();

  const qStart = useCallback(
    (vid: string) => {
      const r = mutate((d) => apiStartConsultation(d, vid, (id) => patientName(d, id)));
      if (r.error) {
        toast('warning', 'Cannot start consultation', r.error);
        return;
      }
      const v = visitById(db, vid);
      if (v) toast('success', 'Consultation started · ' + v.token, patientName(db, v.patientId));
      go('/consultation/' + vid);
    },
    [db, mutate, toast, go],
  );

  const qComplete = useCallback(
    (vid: string) => {
      const v = visitById(db, vid);
      mutate((d) => apiCompleteVisit(d, vid));
      if (v) toast('success', 'Visit completed', v.token + ' · ' + patientName(db, v.patientId));
    },
    [db, mutate, toast],
  );

  const qOpen = useCallback(
    (vid: string) => {
      const v = visitById(db, vid);
      if (v) go('/patients/' + v.patientId);
    },
    [db, go],
  );

  const qCancel = useCallback(
    (vid: string) => {
      const v = visitById(db, vid);
      if (!v) return;
      const name = patientName(db, v.patientId);
      openModal({
        type: 'confirm',
        tone: 'danger',
        label: 'Cancel Visit',
        title: 'Cancel visit ' + v.token + '?',
        msg: name + ' will be removed from today’s active queue. This keeps a record with status “Cancelled”.',
        onConfirm: () => {
          mutate((d) => apiCancelVisit(d, vid));
          toast('info', 'Visit cancelled', v.token + ' · ' + name);
        },
      });
    },
    [db, mutate, toast, openModal],
  );

  const rxView = useCallback((rxId: string, from: string) => go('/prescriptions/' + rxId + '?from=' + encodeURIComponent(from)), [go]);

  const rxReuse = useCallback(
    (rxId: string, pid: string) => {
      toast('info', 'Prescription reused', rxId + ' loaded into a new prescription — the original is never modified.');
      go('/prescriptions/new?patient=' + pid + '&from=' + rxId);
    },
    [toast, go],
  );

  return useMemo(
    () => ({
      qStart,
      qComplete,
      qOpen,
      qCancel,
      rxView,
      rxReuse,
      openBilling: (visitId: string) => openModal({ type: 'billing', visitId }),
      openAddPatient: () => openModal({ type: 'addPatient' }),
      openEdit: (pid: string) => openModal({ type: 'edit', pid }),
      openVisit: (pid?: string) => openModal({ type: 'visit', pid: pid ?? null }),
    }),
    [qStart, qComplete, qOpen, qCancel, rxView, rxReuse, openModal],
  );
}
