
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_URL } from '../../constants/api';

export default function SchedulePickupScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [pickupDateTime, setPickupDateTime] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (selectedDate) {
      const updatedDate = new Date(pickupDateTime);
      updatedDate.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setPickupDateTime(updatedDate);
    }
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    setShowTimePicker(false);

    if (selectedTime) {
      const updatedDate = new Date(pickupDateTime);
      updatedDate.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0,
        0
      );
      setPickupDateTime(updatedDate);
    }
  };

  const handleSchedule = async () => {
    if (!bookingId) {
      Alert.alert('Error', 'Booking ID is missing.');
      return;
    }

    if (pickupDateTime <= new Date()) {
      Alert.alert('Invalid Schedule', 'Please select a future date and time.');
      return;
    }

    try {
      setSubmitting(true);

      const token = await SecureStore.getItemAsync('scrapgo_token');

      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/customer/login');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/company/bookings/${bookingId}/schedule`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickupDateTime: pickupDateTime.toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to schedule pickup.');
      }

      Alert.alert(
        'Pickup Scheduled',
        'The pickup date and time have been saved successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Pickup</Text>

      <Text style={styles.bookingId}>Booking #{bookingId}</Text>

      <Text style={styles.label}>Selected Pickup Date</Text>

      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.pickerText}>
          {pickupDateTime.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Selected Pickup Time</Text>

      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowTimePicker(true)}
      >
        <Text style={styles.pickerText}>
          {pickupDateTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={pickupDateTime}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={pickupDateTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Pickup Schedule</Text>
        <Text style={styles.summaryText}>
          Date: {pickupDateTime.toLocaleDateString()}
        </Text>
        <Text style={styles.summaryText}>
          Time:{' '}
          {pickupDateTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, submitting && styles.disabledButton]}
        onPress={handleSchedule}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirm Pickup Schedule</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#1b4332',
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 25,
  },
  pickerText: {
    fontSize: 17,
    color: '#222',
  },
  summary: {
    backgroundColor: '#e8f5e9',
    padding: 18,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 25,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1b4332',
  },
  summaryText: {
    fontSize: 15,
    marginBottom: 5,
    color: '#333',
  },
  button: {
    backgroundColor: '#2d6a4f',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
