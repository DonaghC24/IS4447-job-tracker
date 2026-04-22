// root layout - the entry point of the entire app
// sets up global providers, loads fonts, seeds the database and configures notifications
// splash screen is kept visible until fonts are ready

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/AuthContext';
import { AppThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { seedIfEmpty } from '@/db/seed';
import * as Notifications from 'expo-notifications';

// configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

// re-export expo-router's error boundary for unhandled route errors
export {
  ErrorBoundary
} from 'expo-router';

// set the initial route to the tabs screen
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// prevent the splash screen from hiding until we are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // load custom fonts needed across the app
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // seed the sqlite database with sample data on first launch
  useEffect(() => {
    try {
      seedIfEmpty();
    } catch (e) {
      console.error('Seed error:', e);
    }
  }, []);

  // bubble font loading errors up to the error boundary
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    // wrap the entire app in theme and auth providers
    <AppThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </AppThemeProvider>
  );
}

// separate component so it can access the theme context for react-navigation
function RootLayoutNav() {
  const { mode } = useAppTheme();

  return (
    // pass the correct react-navigation theme based on light or dark mode
    <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* main app tabs - header hidden as each tab has its own header */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* auth screens - header hidden as login/register have custom layouts */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}