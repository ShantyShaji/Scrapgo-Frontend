 
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CustomerDashboard() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await SecureStore.getItemAsync('scrapgo_user');

        if (!userData) {
          router.replace('/customer/login');
          return;
        }

        const user = JSON.parse(userData);
        setName(user.name);
      } catch (error) {
        Alert.alert('Error', 'Unable to load your account');
        router.replace('/customer/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Loading screen
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  // Dashboard screen
  return (
    <View style={styles.container}>

      <Text style={styles.logo}>♻️ ScrapGo</Text>

      <Text style={styles.heading}>
        Welcome, {name}!
      </Text>

      <Text style={styles.description}>
        Your scrap recycling journey starts here.
      </Text>

      {/* Dashboard Actions */}
      <View style={styles.actionRow}>

        {/* Book Scrap Pickup */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/customer/companies')}
        >
          <Text style={styles.actionIcon}>♻️</Text>

          <Text style={styles.actionTitle}>
            Book Scrap Pickup
          </Text>
        </TouchableOpacity>

        {/* My Bookings */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/customer/my-bookings')}
        >
          <Text style={styles.actionIcon}>📋</Text>

          <Text style={styles.actionTitle}>
            My Bookings
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  logo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#15803D',
    marginBottom: 30,
  },

  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 12,
  },

  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 35,
  },

  actionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 15,
  },

  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 25,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  actionIcon: {
    fontSize: 35,
    marginBottom: 12,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
  },
});
