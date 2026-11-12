# TriSetu — Clinic Management (React Native)

A native rebuild of the `TriSetu_Prototype_Fixed.html` prototype using **Expo SDK 58, React Native 0.88, TypeScript and Expo Router**. Every screen, dialog and flow from the HTML file is reproduced with native components — no WebView.

## Requirements

- Node.js 20 or newer (tested with Node 22) and npm
- **Android:** Android Studio with an emulator, or a physical device
- **iOS:** macOS with Xcode and an iOS Simulator, or a physical iPhone
- Optional: the **Expo Go** app (must support SDK 58) for the quickest start

## Install

```bash
cd trisetu-rn
npm install
```

## Run

```bash
npx expo start            # dev server; press a (Android) or i (iOS), or scan the QR code with Expo Go
npm run android           # same as: expo start --android
npm run ios               # same as: expo start --ios
```

Every native module used here (svg, print, sharing, image picker, async storage, safe area, screens) ships with Expo Go. If your Expo Go build does not match SDK 58, make a development build instead:

```bash
npx expo run:android      # builds and installs a debug app on the emulator/device
npx expo run:ios          # macOS only
```

Store builds go through EAS: `npx eas-cli@latest build -p android` / `-p ios`.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Doctor | doctor@clinicflow.test | clinic123 |
| Reception | reception@clinicflow.test | clinic123 |

The "Use" buttons on the login screen fill these in. The Doctor/Reception switch in the sidebar and top bar changes role instantly, as in the prototype.

## Checks

```bash
npm run typecheck         # tsc --noEmit (strict, no unused locals)
npm test                  # Jest: service logic + native render of every screen and dialog
npm run bundle:android    # Metro production bundle for Android
npm run bundle:ios        # Metro production bundle for iOS
```

## Project structure

```
src/
  app/                    Expo Router routes (same paths as the prototype's hash routes)
    _layout.tsx           Shell: sidebar (fixed ≥1024px, drawer below), top bar, dialogs, toasts
    login.tsx  index.tsx  +not-found.tsx
    doctor/dashboard  reception/{dashboard,desk}  patients/{index,[patientId]}
    visits  queue  consultation/[visitId]  prescriptions/{index,new,[rxId]}
    settings/{index,clinic,staff,consultation,prescription/{index,suggestions,diagnosis,symptoms}}
    profile
  screens/                Screen components (one file per area)
  modals/ModalHost.tsx    All dialogs: register, duplicate check, success, create visit,
                          edit, confirm, staff, visit type, billing & tests, rename
  components/ui/          Design-system primitives (Button, Input, Select, DateInput, Table,
                          Dropdown, ModalFrame, Toasts, Badges, Cards, Icons …)
  components/domain.tsx   Patient/visit/prescription cards, queue table, token card, patient form
  layout/                 Sidebar, Topbar, Page (scroll, footer, sticky bar), Guard
  store/AppStore.tsx      App state, persistence and the `mutate` service boundary
  services/               api.ts (FastAPI-ready mutations), selectors, medicine mapping,
                          print/PDF, storage
  data/                   Seed data and constants
  theme/tokens.ts         Colours, shadows, mono font and breakpoints from the original CSS
  types.ts                Domain types (same shapes as the planned FastAPI schemas)
__tests__/                Jest tests
```

## How web features were replaced

| Prototype (browser) | React Native |
|---|---|
| Hash router + `data-act` registry | Expo Router file routes; Android back button supported |
| Inline SVG icons | Same SVG paths rendered with `react-native-svg` |
| CSS (`:root` tokens, box-shadow, media queries) | `StyleSheet` + tokens, native `boxShadow`, `useWindowDimensions` breakpoints (640/768/1024/1100/1200) |
| `sessionStorage` / `localStorage` | AsyncStorage, same keys (`cf_user`, `trisetuprefs_v1`, `trisetubusiness_v1`, `trisetudraft_v2`) |
| `<select>` | Bottom-sheet style picker (`Select`) |
| `<input type="date">` | Calendar picker (`DateInput`) |
| `prompt()` / `confirm()` | In-app dialogs |
| `window.print()` / "Save as PDF" | `expo-print` system print dialog; PDF via `expo-print` + share sheet (`expo-sharing`) |
| `FileReader` logo upload | `expo-image-picker` (stored as data URI) |
| `wa.me`, `sms:`, `mailto:` links | `Linking.openURL` (opens WhatsApp, Messages, Mail) |
| Overflow-x tables | Horizontally scrolling tables with the same columns |

## Behaviour notes

Things the prototype intended but did not do, now working:

- **Billing & Tests** is reachable: a button in every queue row and on the Visits page (the prototype's injection targeted rows that never rendered it).
- The **Visits** nav item shows the waiting count badge (the prototype checked a route that no longer existed).
- **Reuse** inside a consultation loads the old prescription into the current editor (the prototype compared against the wrong path and always left the screen).
- The Prescriptions **search** filters as you type (the prototype updated a container that did not exist).
- The Reception Desk **duplicate-mobile dialog** appears (the prototype opened a dialog type it never rendered).
- **Print Prescription** and **Generate PDF** start printing/PDF export automatically after the preview opens.
- Meal timing and instructions entered for a medicine are shown on the prescription sheet and in the PDF.
- **Keep me signed in** is honoured: unchecked means the session is not stored on the device.
- A consultation draft is stored when you edit it (not merely by opening a visit), so the "Unfinished consultation draft" banner only appears when there is something to resume.
- On phones, toasts sit under the top bar so they never cover dialog buttons or the sticky action bar.

## Limitations (same as the prototype)

- **Data is mock and in memory.** Patients, visits and prescriptions are seeded on launch and reset when the app restarts; preferences, session and the consultation draft persist. `src/services/api.ts` holds one function per future FastAPI endpoint — replace their bodies with `fetch` calls when the backend exists.
- **No real authentication.** Login checks the two demo emails locally; authorization is enforced only in the UI.
- **Payments are not connected.** "Mark paid" is a manual record; no gateway, bank verification or settlement.
- **Online consultations:** Google Meet / Teams links must be pasted; WhatsApp opens a chat. No meeting is created automatically.
- **Messages and lab requests** open WhatsApp, Messages or Mail with a prepared text; the user sends them. Nothing confirms a lab booking.
- **M / A / E / N shortcuts** in the consultation editor need a hardware keyboard and work in the web build; on phones, tap the Morning/Afternoon/Evening/Night buttons.
- Justdial and other marketing integrations are listed as planned, exactly as in the prototype.
