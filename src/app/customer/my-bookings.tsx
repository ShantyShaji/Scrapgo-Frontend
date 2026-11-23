
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
  pickupAddress: string;
  estimatedAmount: string;
  finalAmount: string | null;
  pickupDateTime: string | null;
  createdAt: string;
  company: {
    id: number;
    name: string;
    phone: string;
    address: string;
  };
  items: BookingItem[];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return '#D97706';
    case 'ACCEPTED':
      return '#2563EB';
    case 'SCHEDULED':
      return '#059669';
    case 'REJECTED':
      return '#DC2626';
    case 'COLLECTED':
      return '#7C3AED';
    case 'COMPLETED':
      return '#15803D';
    default:
      return '#64748B';
  }
};


const bookingSteps = [
  'PENDING',
  'ACCEPTED',
  'SCHEDULED',
  'COLLECTED',
  'COMPLETED',
];

const renderBookingTimeline = (status: string) => {
  if (status === 'REJECTED') {
    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.rejectedText}>
          ✕ This booking request was rejected.
        </Text>
      </View>
    );
  }

  const currentIndex = bookingSteps.indexOf(status);

  return (
    <View style={styles.timelineContainer}>
      {bookingSteps.map((step, index) => {
        const completed = index <= currentIndex;

        return (
          <View key={step} style={styles.timelineStep}>
            <View style={styles.timelineIndicator}>
              <View
                style={[
                  styles.timelineCircle,
                  completed && styles.timelineCircleActive,
                ]}
              >
                {completed && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>

              {index !== bookingSteps.length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    index < currentIndex && styles.timelineLineActive,
                  ]}
                />
              )}
            </View>

            <Text
              style={[
                styles.timelineLabel,
                completed && styles.timelineLabelActive,
              ]}
            >
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
};


export default function MyBookingsScreen() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const token = await SecureStore.getItemAsync('scrapgo_token');

      if (!token) {
        Alert.alert('Login Required', 'Please log in again.');
        router.replace('/customer/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/bookings/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load bookings.');
      }

      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Fetch bookings error:', error);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.bookingId}>Booking #{item.id}</Text>
          <Text style={styles.companyName}>{item.company.name}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

<Text style={styles.sectionTitle}>Booking Progress</Text>

{renderBookingTimeline(item.status)}

<View style={styles.divider} />

<Text style={styles.sectionTitle}>Scrap Items</Text>


      {item.items.map((bookingItem) => (
        <View key={bookingItem.id} style={styles.itemRow}>
          <Text style={styles.itemName}>
            {bookingItem.scrapItem.name} ({bookingItem.quantityKg} kg)
          </Text>
          <Text style={styles.itemPrice}>₹{bookingItem.subtotal}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <Text style={styles.detail}>
        <Text style={styles.bold}>Pickup Address: </Text>
        {item.pickupAddress}
      </Text>

      <Text style={styles.detail}>
        <Text style={styles.bold}>Company Phone: </Text>
        {item.company.phone}
      </Text>

      <Text style={styles.detail}>
        <Text style={styles.bold}>Estimated Amount: </Text>
        ₹{item.estimatedAmount}
      </Text>

{item.finalAmount !== null &&
 item.finalAmount !== undefined && (
  <Text style={styles.finalAmount}>
    Final Amount: ₹{item.finalAmount}
  </Text>
)}


      {item.pickupDateTime && (
        <Text style={styles.pickupDate}>
          Pickup: {formatDate(item.pickupDateTime)}
        </Text>
      )}

      <Text style={styles.createdDate}>
        Booked on: {formatDate(item.createdAt)}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      <Text style={styles.subtitle}>Track your scrap pickup requests</Text>

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
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>
              Your scrap pickup requests will appear here.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/customer/companies')}
            >
              <Text style={styles.buttonText}>Explore Companies</Text>
            </TouchableOpacity>
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 100,
  },
  subtitle: {
    color: '#64748B',
    marginTop: 5,
    marginBottom: 15,
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
    fontSize: 13,
    color: '#64748B',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#166534',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 13,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  itemName: {
    color: '#334155',
  },
  itemPrice: {
    fontWeight: '600',
  },
  detail: {
    marginBottom: 8,
    color: '#475569',
  },
  bold: {
    fontWeight: 'bold',
    color: '#1E293B',
  },
  pickupDate: {
    color: '#15803D',
    fontWeight: 'bold',
    marginTop: 5,
  },
  createdDate: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#16A34A',
    padding: 13,
    borderRadius: 8,
    marginTop: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },


timelineContainer: {
  marginTop: 12,
  marginBottom: 8,
  paddingVertical: 10,
},
timelineStep: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  minHeight: 42,
},
timelineIndicator: {
  alignItems: 'center',
  width: 25,
  marginRight: 12,
},
timelineCircle: {
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 2,
  borderColor: '#CBD5E1',
  backgroundColor: '#FFFFFF',
  justifyContent: 'center',
  alignItems: 'center',
},
timelineCircleActive: {
  backgroundColor: '#16A34A',
  borderColor: '#16A34A',
},
checkmark: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 'bold',
},
timelineLine: {
  width: 2,
  height: 20,
  backgroundColor: '#CBD5E1',
},
timelineLineActive: {
  backgroundColor: '#16A34A',
},
timelineLabel: {
  color: '#94A3B8',
  fontSize: 13,
  paddingTop: 3,
},
timelineLabelActive: {
  color: '#166534',
  fontWeight: 'bold',
},
rejectedText: {
  color: '#DC2626',
  fontWeight: 'bold',
  fontSize: 14,
},
finalAmount: {
  fontSize: 16,
  fontWeight: 'bold',
  color: 'green',
  marginTop: 8,
},

});
