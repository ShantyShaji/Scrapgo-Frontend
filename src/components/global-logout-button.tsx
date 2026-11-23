 
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function GlobalLogoutButton() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (
    pathname === '/' ||
    pathname === '/customer/login' ||
    pathname === '/customer/register'
  ) {
    return null;
  }

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await SecureStore.deleteItemAsync('scrapgo_token');
      await SecureStore.deleteItemAsync('scrapgo_user');
      router.replace('/customer/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout failed', 'Unable to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Logout"
      disabled={isLoggingOut}
      onPress={handleLogout}
      style={[
        styles.button,
        {
          top: insets.top + 8,
          right: insets.right + 16,
        },
      ]}
    >
      <Ionicons
        name="person-circle-outline"
        size={21}
        color="#FFFFFF"
      />

      <Text style={styles.buttonText}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    zIndex: 10,
    elevation: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
