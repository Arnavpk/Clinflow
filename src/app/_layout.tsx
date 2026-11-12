import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useStore } from '../store/AppStore';
import { Sidebar } from '../layout/Sidebar';
import { Topbar } from '../layout/Topbar';
import { ModalHost } from '../modals/ModalHost';
import { Icon, Spinner, T, ToastHost } from '../components/ui';
import { C, useBp } from '../theme/tokens';

/** Standalone routes render without the sidebar/topbar (the A4 prescription sheet). */
const isStandalone = (p: string) => /^\/prescriptions\/(?!new$)[^/]+$/.test(p);

function Splash() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.pri600, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="heart-pulse" size={22} color={C.white} />
      </View>
      <T style={{ fontWeight: '800', fontSize: 18 }}>TriSetu</T>
      <Spinner size={18} color={C.pri600} />
    </View>
  );
}

function Shell() {
  const { ready, user, sidebar, setSidebar } = useStore();
  const path = usePathname();
  const { lg } = useBp();
  const chrome = ready && !!user && path !== '/login' && path !== '/' && !isStandalone(path);

  useEffect(() => {
    if (!sidebar) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSidebar(false);
      return true;
    });
    return () => sub.remove();
  }, [sidebar, setSidebar]);

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.bg }}>
      {chrome && lg ? (
        <View style={{ width: 256 }}>
          <Sidebar />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {chrome ? <Topbar /> : null}
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
      {chrome && !lg ? <Sidebar drawer /> : null}
      <ModalHost />
      <ToastHost />
      {!ready ? <Splash /> : null}
      <StatusBar style="dark" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
