
import { Ionicons } from '@expo/vector-icons';
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
import { API_URL } from '../../constants/api';

export default function CompanyDashboard() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = await SecureStore.getItemAsync('scrapgo_token');
      const savedUser = await SecureStore.getItemAsync('scrapgo_user');

      if (!token) {
        router.replace('/customer/login');
        return;
      }

      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCompanyName(user.name || 'Company');
      }

      const response = await fetch(
        `${API_URL}/api/company/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load dashboard.');
      }

      setBookingCount(data.count || 0);
    } catch (error) {
      console.error('Company dashboard error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to load dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ScrapGo Company</Text>

      <Text style={styles.welcome}>
        Welcome, {companyName}!
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Pickup Requests</Text>
        <Text style={styles.count}>{bookingCount}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/company/bookings')}
        >
          <Ionicons
            name="eye-outline"
            size={32}
            color="#ffffff"
          />
          <Text style={styles.actionText}>View Pickup Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/company/scrap-items')}
        >
          <Ionicons
            name="document-text-outline"
            size={32}
            color="#ffffff"
          />
          <Text style={styles.actionText}>Manage Scrap Items</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
    padding: 20,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
  },
  welcome: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    marginBottom: 25,
  },
  cardTitle: {
    fontSize: 16,
    color: '#64748B',
  },
  count: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#16A34A',
    marginTop: 10,
  },
  
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 5,
  },

  actionCard: {
    flex: 1,
    backgroundColor: '#156f34',
    paddingVertical: 22,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    minHeight: 120,
  },

  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
});
