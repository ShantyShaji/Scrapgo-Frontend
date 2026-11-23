import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { GlobalLogoutButton } from '@/components/global-logout-button';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
    // Hide logout button on the first (index) page
  const isHomePage = pathname === '/';
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="customer/login" />
        <Stack.Screen name="customer/register" />
      </Stack>
       {!isHomePage && <GlobalLogoutButton />}
    </ThemeProvider>
  );
}
