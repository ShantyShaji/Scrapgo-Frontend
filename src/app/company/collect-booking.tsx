
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  items: BookingItem[];
};

export default function CollectBookingScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const token = await SecureStore.getItemAsync('scrapgo_token');

      if (!token) {
        Alert.alert('Login Required', 'Please log in again.');
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
        throw new Error(data.message || 'Unable to load booking.');
      }

      const selectedBooking = (data.bookings || []).find(
        (item: Booking) => item.id === Number(bookingId)
      );

      if (!selectedBooking) {
        throw new Error('Booking not found.');
      }

      setBooking(selectedBooking);

      const initialQuantities: Record<number, string> = {};

      selectedBooking.items.forEach((item: BookingItem) => {
        initialQuantities[item.id] = String(item.quantityKg);
      });

      setQuantities(initialQuantities);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to load booking.'
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalAmount = () => {
    if (!booking) return 0;

    return booking.items.reduce((total, item) => {
      const quantity = Number(quantities[item.id] || 0);
      const price = Number(item.pricePerKg);

      return total + quantity * price;
    }, 0);
  };

  const handleCollect = async () => {
    if (!booking) return;

    const invalidQuantity = booking.items.some((item) => {
      const quantity = Number(quantities[item.id]);

      return (
        !quantities[item.id]?.trim() ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      );
    });

    if (invalidQuantity) {
      Alert.alert(
        'Invalid Quantity',
        'Please enter a valid weight for every scrap item.'
      );
      return;
    }

    Alert.alert(
      'Confirm Collection',
      `Final amount: ₹${calculateFinalAmount().toFixed(2)}. Confirm that all items have been collected?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: submitCollection,
        },
      ]
    );
  };

  const submitCollection = async () => {
    if (!booking) return;

    try {
      setSubmitting(true);

      const token = await SecureStore.getItemAsync('scrapgo_token');

      const response = await fetch(
        `${API_URL}/api/company/bookings/${booking.id}/collect`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: booking.items.map((item) => ({
              bookingItemId: item.id,
              actualQuantityKg: Number(quantities[item.id]),
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to confirm collection.');
      }

      Alert.alert(
        'Collection Successful',
        `Final amount: ₹${Number(data.booking.finalAmount).toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/company/bookings'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Collection failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading booking...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text>Booking not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Scrap Collection</Text>
      <Text style={styles.subtitle}>Booking #{booking.id}</Text>

      {booking.items.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.itemName}>{item.scrapItem.name}</Text>

          <Text style={styles.info}>
            Estimated Weight: {item.quantityKg} kg
          </Text>

          <Text style={styles.info}>
            Price per kg: ₹{item.pricePerKg}
          </Text>

          <Text style={styles.label}>Actual Collected Weight (kg)</Text>

          <TextInput
            style={styles.input}
            value={quantities[item.id] || ''}
            onChangeText={(value) =>
              setQuantities((previous) => ({
                ...previous,
                [item.id]: value,
              }))
            }
            keyboardType="decimal-pad"
            placeholder="Enter actual weight"
          />
        </View>
      ))}

      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Final Amount</Text>
        <Text style={styles.amount}>
          ₹{calculateFinalAmount().toFixed(2)}
        </Text>
        <Text style={styles.note}>
          Calculated using actual weight and saved price per kg.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, submitting && styles.disabledButton]}
        onPress={handleCollect}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Confirm Scrap Collection</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 35 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 5,
    marginTop: 100,
  },
  subtitle: {
    color: '#64748B',
    marginTop: 5,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 10,
  },
  info: {
    color: '#475569',
    marginBottom: 6,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#334155',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  amountCard: {
    backgroundColor: '#DCFCE7',
    padding: 18,
    borderRadius: 12,
    marginTop: 5,
  },
  amountLabel: {
    color: '#166534',
    fontWeight: '600',
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#15803D',
    marginTop: 5,
  },
  note: {
    color: '#166534',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#16A34A',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
