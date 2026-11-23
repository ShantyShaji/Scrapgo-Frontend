
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { API_URL } from '../../constants/api';

type BookingItem = {
  id: number;
  quantityKg: string | number;
  pricePerKg: string | number;
  subtotal: string | number;
  scrapItem: {
    name: string;
  };
};

type Booking = {
  id: number;
  status: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  estimatedAmount: string | number;
  finalAmount: string | number | null;
  pickupDateTime: string | null;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  company: {
    name: string;
    phone: string;
  };
  items: BookingItem[];
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const token = await SecureStore.getItemAsync('scrapgo_token');

      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch bookings.');
      }

      setBookings(data.bookings || []);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to load bookings.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#D97706';
      case 'ACCEPTED':
        return '#2563EB';
      case 'SCHEDULED':
        return '#7C3AED';
      case 'COLLECTED':
        return '#0891B2';
      case 'COMPLETED':
        return '#16A34A';
      case 'REJECTED':
        return '#DC2626';
      default:
        return '#555555';
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.bookingId}>
          Booking #{item.id}
        </Text>

        <Text
          style={[
            styles.status,
            { color: getStatusColor(item.status) },
          ]}
        >
          {item.status}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Customer Details</Text>
      <Text style={styles.detail}>
        Name: {item.customerName || item.customer?.name}
      </Text>
      <Text style={styles.detail}>
        Phone: {item.customerPhone || item.customer?.phone}
      </Text>
      <Text style={styles.detail}>
        Email: {item.customer?.email || 'N/A'}
      </Text>

      <Text style={styles.sectionTitle}>Company Details</Text>
      <Text style={styles.detail}>
        Company: {item.company?.name}
      </Text>
      <Text style={styles.detail}>
        Phone: {item.company?.phone}
      </Text>

      <Text style={styles.sectionTitle}>Scrap Items</Text>

      {item.items.map((bookingItem) => (
        <Text key={bookingItem.id} style={styles.detail}>
          {bookingItem.scrapItem.name} - {bookingItem.quantityKg} kg
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Pickup Details</Text>
      <Text style={styles.detail}>
        Address: {item.pickupAddress}
      </Text>

      {item.pickupDateTime && (
        <Text style={styles.detail}>
          Pickup Date: {new Date(item.pickupDateTime).toLocaleString()}
        </Text>
      )}

      <Text style={styles.amount}>
        Estimated Amount: ₹{item.estimatedAmount}
      </Text>

      {item.finalAmount !== null && (
        <Text style={styles.finalAmount}>
          Final Amount: ₹{item.finalAmount}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Bookings</Text>

      <Text style={styles.total}>
        Total Bookings: {bookings.length}
      </Text>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBooking}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBookings();
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No bookings available.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
    marginTop: 100,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 5,
    color: '#166534',
  },
  detail: {
    fontSize: 14,
    color: '#444444',
    marginBottom: 5,
  },
  amount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 12,
  },
  finalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16A34A',
    marginTop: 6,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#777777',
  },
});
