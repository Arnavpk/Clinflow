import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { router, type Href } from 'expo-router';
import type {
  BuilderDraft,
  BusinessPrefs,
  ConsultationDraft,
  Db,
  DraftRx,
  ModalState,
  PresetKind,
  PrescriptionPrefs,
  Role,
  ToastItem,
  ToastType,
  User,
} from '../types';
import { seedDb } from '../data/seed';
import { CF_DIAGNOSES, CF_SYMPTOMS, DEFAULT_BUSINESS, DEMO_USERS, ROLE_META } from '../data/constants';
import { KEYS, readJSON, writeJSON } from '../services/storage';

/** One-shot values handed between screens (preview ⇄ editor), like the prototype's state.* fields. */
export interface Handoff {
  draftRx: DraftRx | null;
  draftReturn: string;
  consSnap: ConsultationDraft | null;
  bldSnap: BuilderDraft | null;
  autoPrint: false | 'print' | 'pdf';
}

const defaultPrefs = (): PrescriptionPrefs => ({
  suggestions: true,
  symptoms: CF_SYMPTOMS.map((name) => ({ name, enabled: true })),
  diagnosis: CF_DIAGNOSES.map((name) => ({ name, enabled: true })),
});

interface StoreValue {
  ready: boolean;
  db: Db;
  /** Applies a mutation to a copy of the database and commits it (the service-layer boundary). */
  mutate: <T>(fn: (d: Db) => T) => T;
  user: User | null;
  signIn: (u: User, keep: boolean) => void;
  signOut: () => void;
  switchRole: (r: Role) => void;
  prefs: PrescriptionPrefs;
  updatePrefs: (fn: (p: PrescriptionPrefs) => void) => void;
  enabledPresets: (kind: PresetKind) => string[];
  biz: BusinessPrefs;
  updateBiz: (patch: Partial<BusinessPrefs>) => void;
  draft: ConsultationDraft | null;
  saveDraft: (d: ConsultationDraft) => void;
  clearDraft: (visitId: string) => void;
  toasts: ToastItem[];
  toast: (type: ToastType, title: string, msg?: string) => void;
  dismissToast: (id: number) => void;
  modal: ModalState | null;
  openModal: (m: ModalState) => void;
  closeModal: () => void;
  sidebar: boolean;
  setSidebar: (v: boolean) => void;
  notifRead: boolean;
  setNotifRead: (v: boolean) => void;
  handoff: React.MutableRefObject<Handoff>;
  go: (to: string) => void;
  replace: (to: string) => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <AppProvider>');
  return v;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function AppProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: User | null }) {
  const dbRef = useRef<Db>(seedDb());
  const [db, setDb] = useState<Db>(dbRef.current);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const keepRef = useRef(true);
  const [prefs, setPrefs] = useState<PrescriptionPrefs>(defaultPrefs);
  const [biz, setBiz] = useState<BusinessPrefs>(DEFAULT_BUSINESS);
  const [draft, setDraft] = useState<ConsultationDraft | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastSeq = useRef(0);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const handoff = useRef<Handoff>({ draftRx: null, draftReturn: '/visits', consSnap: null, bldSnap: null, autoPrint: false });

  /* ---- hydrate persisted state (session, preferences, consultation draft) ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      const [u, p, b, d] = await Promise.all([
        readJSON<User>(KEYS.user),
        readJSON<Partial<PrescriptionPrefs>>(KEYS.prefs),
        readJSON<Partial<BusinessPrefs>>(KEYS.business),
        readJSON<ConsultationDraft>(KEYS.draft),
      ]);
      if (!alive) return;
      if (u && initialUser === undefined) setUser(u);
      if (p) setPrefs({ ...defaultPrefs(), ...p });
      if (b) setBiz({ ...DEFAULT_BUSINESS, ...b });
      if (d) setDraft(d);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [initialUser]);

  const mutate = useCallback(<T,>(fn: (d: Db) => T): T => {
    const next = clone(dbRef.current);
    const r = fn(next);
    dbRef.current = next;
    setDb(next);
    return r;
  }, []);

  const toast = useCallback((type: ToastType, title: string, msg?: string) => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, type, title, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const go = useCallback((to: string) => router.push(to as Href), []);
  const replace = useCallback((to: string) => router.replace(to as Href), []);

  const signIn = useCallback((u: User, keep: boolean) => {
    keepRef.current = keep;
    setUser(u);
    writeJSON(KEYS.user, keep ? u : null);
  }, []);
  const signOut = useCallback(() => {
    setUser(null);
    setModal(null);
    setSidebar(false);
    writeJSON(KEYS.user, null);
  }, []);
  const switchRole = useCallback((r: Role) => {
    const u = DEMO_USERS[r];
    setUser(u);
    setSidebar(false);
    if (keepRef.current) writeJSON(KEYS.user, u);
    router.push(ROLE_META[r].dash as Href);
    toast('info', 'Viewing as ' + ROLE_META[r].label, 'Navigation and permissions updated for this role.');
  }, [toast]);

  const updatePrefs = useCallback((fn: (p: PrescriptionPrefs) => void) => {
    setPrefs((cur) => {
      const next = clone(cur);
      fn(next);
      writeJSON(KEYS.prefs, next);
      return next;
    });
  }, []);
  const enabledPresets = useCallback(
    (kind: PresetKind) => (prefs.suggestions ? (prefs[kind] || []).filter((x) => x.enabled).map((x) => x.name) : []),
    [prefs],
  );
  const updateBiz = useCallback((patch: Partial<BusinessPrefs>) => {
    setBiz((cur) => {
      const next = { ...cur, ...patch };
      writeJSON(KEYS.business, next);
      return next;
    });
  }, []);

  const saveDraft = useCallback((d: ConsultationDraft) => {
    setDraft(d);
    writeJSON(KEYS.draft, d);
  }, []);
  const clearDraft = useCallback((visitId: string) => {
    setDraft((cur) => {
      if (cur && cur.visitId === visitId) {
        writeJSON(KEYS.draft, null);
        return null;
      }
      return cur;
    });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ready, db, mutate, user, signIn, signOut, switchRole, prefs, updatePrefs, enabledPresets, biz, updateBiz,
      draft, saveDraft, clearDraft, toasts, toast, dismissToast, modal, openModal: setModal, closeModal: () => setModal(null),
      sidebar, setSidebar, notifRead, setNotifRead, handoff, go, replace,
    }),
    [ready, db, mutate, user, signIn, signOut, switchRole, prefs, updatePrefs, enabledPresets, biz, updateBiz, draft, saveDraft, clearDraft, toasts, toast, dismissToast, modal, sidebar, notifRead, go, replace],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
