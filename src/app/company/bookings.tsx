
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL } from '../../constants/api';

type BookingItem = {
  id: number;
  quantityKg: string;
  pricePerKg: string;
  subtotal: string;
  scrapItem: {
    id: number;
    name: string;
  };
};

type Booking = {
  id: number;
  status: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  instructions: string | null;
  estimatedAmount: string;
  pickupDateTime: string | null;
  createdAt: string;
  items: BookingItem[];
};

export default function CompanyBookingsScreen() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    try {
      const token = await SecureStore.getItemAsync('scrapgo_token');

      if (!token) {
        router.replace('/customer/login');
        return;
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
        throw new Error(data.message || 'Unable to load bookings.');
      }

      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Fetch company bookings error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to load bookings.'
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

  const updateBookingStatus = async (
    bookingId: number,
    action: 'accept' | 'reject'
  ) => {
    try {
      setProcessingId(bookingId);

      const token = await SecureStore.getItemAsync('scrapgo_token');

      const response = await fetch(
        `${API_URL}/api/company/bookings/${bookingId}/${action}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update booking.');
      }

      Alert.alert('Success', data.message);
      await fetchBookings();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    } finally {
      setProcessingId(null);
    }
  };

  const confirmAction = (
    bookingId: number,
    action: 'accept' | 'reject'
  ) => {
    Alert.alert(
      action === 'accept' ? 'Accept Booking' : 'Reject Booking',
      `Are you sure you want to ${action} booking #${bookingId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'accept' ? 'Accept' : 'Reject',
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: () => updateBookingStatus(bookingId, action),
        },
      ]
    );
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.bookingId}>Booking #{item.id}</Text>
        <Text style={[
          styles.status,
          item.status === 'PENDING' ? styles.pending :
          item.status === 'ACCEPTED' ? styles.accepted :
          item.status === 'SCHEDULED' ? styles.scheduled :
          item.status === 'REJECTED' ? styles.rejected :
          styles.otherStatus,
        ]}>
          {item.status}
        </Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Customer Details</Text>
      <Text style={styles.detail}>Name: {item.customerName}</Text>
      <Text style={styles.detail}>Phone: {item.customerPhone}</Text>
      <Text style={styles.detail}>Address: {item.pickupAddress}</Text>

      {item.instructions ? (
        <Text style={styles.detail}>
          Instructions: {item.instructions}
        </Text>
      ) : null}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Requested Scrap Items</Text>

      {item.items.map((bookingItem) => (
        <View key={bookingItem.id} style={styles.itemRow}>
          <Text style={styles.itemName}>
            {bookingItem.scrapItem.name} - {bookingItem.quantityKg} kg
          </Text>
          <Text style={styles.itemPrice}>
            ₹{bookingItem.subtotal}
          </Text>
        </View>
      ))}

      <Text style={styles.amount}>
        Estimated Amount: ₹{item.estimatedAmount}
      </Text>

      {item.status === 'PENDING' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.acceptButton}
            disabled={processingId === item.id}
            onPress={() => confirmAction(item.id, 'accept')}
          >
            <Text style={styles.buttonText}>
              {processingId === item.id ? 'Please wait...' : 'Accept'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectButton}
            disabled={processingId === item.id}
            onPress={() => confirmAction(item.id, 'reject')}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'ACCEPTED' && (
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={() =>
            router.push(`/company/schedule-pickup?bookingId=${item.id}`)
          }
        >
          <Text style={styles.buttonText}>Schedule Pickup</Text>
        </TouchableOpacity>
      )}

      {item.status === 'SCHEDULED' && (
  <TouchableOpacity
    style={styles.scheduleButton}
    onPress={() =>
      router.push(
        `/company/collect-booking?bookingId=${item.id}`
      )
    }
  >
    <Text style={styles.buttonText}>
      Record Scrap Collection
    </Text>
  </TouchableOpacity>
)}


{item.status === 'COLLECTED' && (
  <TouchableOpacity
    style={styles.scheduleButton}
    onPress={() => {
      Alert.alert(
        'Complete Booking',
        'Are you sure you want to mark this booking as completed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Complete',
            onPress: async () => {
              try {
                const token = await SecureStore.getItemAsync(
                  'scrapgo_token'
                );

                const response = await fetch(
                  `${API_URL}/api/company/bookings/${item.id}/complete`,
                  {
                    method: 'PUT',
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                const data = await response.json();

                if (!response.ok) {
                  Alert.alert(
                    'Error',
                    data.message || 'Unable to complete booking.'
                  );
                  return;
                }

                Alert.alert(
                  'Success',
                  'Booking completed successfully.',
                  [
                    {
                      text: 'OK',
                      onPress: () =>
                        router.replace('/company/bookings'),
                    },
                  ]
                );
              } catch (error) {
                Alert.alert(
                  'Error',
                  'Something went wrong. Please try again.'
                );
              }
            },
          },
        ]
      );
    }}
  >
    <Text style={styles.buttonText}>
      Complete Booking
    </Text>
  </TouchableOpacity>
)}


      {item.pickupDateTime && (
        <Text style={styles.pickupDate}>
          Pickup: {new Date(item.pickupDateTime).toLocaleString('en-IN')}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading pickup requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pickup Requests</Text>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBooking}
        contentContainerStyle={styles.list}
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
          <View style={styles.center}>
            <Text>No pickup requests available.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
    padding: 16,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 15,
    marginTop: 100,
  },
  list: {
    paddingBottom: 25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  pending: { color: '#D97706' },
  accepted: { color: '#2563EB' },
  scheduled: { color: '#059669' },
  rejected: { color: '#DC2626' },
  otherStatus: { color: '#64748B' },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
  },
  detail: {
    color: '#475569',
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  itemName: {
    color: '#334155',
  },
  itemPrice: {
    fontWeight: '600',
  },
  amount: {
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButton: {
    backgroundColor: '#2563EB',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pickupDate: {
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
