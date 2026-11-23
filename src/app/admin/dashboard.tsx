
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL } from '../../constants/api';

export default function AdminDashboard() {
  const router = useRouter();

  const [adminName, setAdminName] = useState('Admin');
  const [companyCount, setCompanyCount] = useState(0);
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
        setAdminName(user.name || 'Admin');
      }

      // Fetch companies
      const companyResponse = await fetch(
        `${API_URL}/api/companies`
      );

      const companyData = await companyResponse.json();

      if (companyResponse.ok) {
        setCompanyCount(companyData.companies?.length || 0);
      }

      // Fetch bookings
      const bookingResponse = await fetch(
        `${API_URL}/api/admin/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const bookingData = await bookingResponse.json();

      if (bookingResponse.ok) {
        setBookingCount(bookingData.bookings?.length || 0);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to load dashboard information.');
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ScrapGo Admin</Text>

      <Text style={styles.welcome}>
        Welcome, {adminName}!
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Companies</Text>
        <Text style={styles.count}>{companyCount}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Bookings</Text>
        <Text style={styles.count}>{bookingCount}</Text>
      </View>

      <View style={styles.actionRow}>
  {/* Manage Companies */}
  <TouchableOpacity
    style={styles.actionCard}
    onPress={() => router.push('/admin/companies')}
  >
    <Ionicons
      name="business-outline"
      size={30}
      color="#ffffff"
    />
    <Text style={styles.actionText}>Manage Companies</Text>
  </TouchableOpacity>

  {/* Add New Company */}
  <TouchableOpacity
    style={styles.actionCard}
    onPress={() => router.push('/admin/add-company')}
  >
    <Ionicons
      name="add-circle-outline"
      size={30}
      color="#ffffff"
    />
    <Text style={styles.actionText}>Add New Company</Text>
  </TouchableOpacity>

  {/* View All Bookings */}
  <TouchableOpacity
    style={styles.actionCard}
    onPress={() => router.push('/admin/bookings')}
  >
    <Ionicons
      name="clipboard-outline"
      size={30}
      color="#ffffff"
    />
    <Text style={styles.actionText}>View All Bookings</Text>
  </TouchableOpacity>
</View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 100,
    marginBottom: 10,
    color: '#166534',
  },
  welcome: {
    fontSize: 18,
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    color: '#555555',
  },
  count: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16A34A',
    marginTop: 10,
  },
 actionRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 10,
  marginTop: 12,
},

actionCard: {
  width: '48%',
  minHeight: 115,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#156f34',
  borderRadius: 12,
  padding: 15,
  elevation: 3,
},
actionText: {
  color: '#ffffff',
  fontSize: 12,
  fontWeight: 'bold',
  textAlign: 'center',
  marginTop: 10,
},
});
