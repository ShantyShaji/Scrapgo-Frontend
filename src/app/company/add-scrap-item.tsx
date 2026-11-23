
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

type ScrapItem = {
  id: number;
  name: string;
  pricePerKg: string | number;
  isActive: boolean;
};

export default function AddScrapItem() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchScrapItem();
    }
  }, [id]);

  
const fetchScrapItem = async () => {
  try {
    const token = await SecureStore.getItemAsync('scrapgo_token');

    if (!token) {
      throw new Error('Session expired. Please log in again.');
    }

    const response = await fetch(
      `${API_URL}/api/company/scrap-items`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load scrap items.');
    }

    console.log('Scrap items API response:', data);
    console.log('Requested item ID:', id);

    const items: ScrapItem[] = data.items || data.scrapItems || [];

    const selectedItem = items.find(
      (item) => Number(item.id) === Number(id)
    );

    console.log('Selected item:', selectedItem);

    if (!selectedItem) {
      Alert.alert('Error', 'Scrap item not found.');
      router.back();
      return;
    }

    setName(selectedItem.name);
    setPricePerKg(String(selectedItem.pricePerKg));

  } catch (error) {
    Alert.alert(
      'Error',
      error instanceof Error ? error.message : 'Unable to load item.'
    );
  } finally {
    setLoading(false);
  }
};


  const handleSubmit = async () => {
    if (!name.trim() || !pricePerKg.trim()) {
      Alert.alert('Validation', 'Please enter the item name and price.');
      return;
    }

    const price = Number(pricePerKg);

    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Validation', 'Enter a valid price greater than zero.');
      return;
    }

    try {
      setSubmitting(true);

      const token = await SecureStore.getItemAsync('scrapgo_token');

      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        return;
      }

      const url = isEditing
        ? `${API_URL}/api/company/scrap-items/${id}`
        : `${API_URL}/api/company/scrap-items`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          pricePerKg: price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to save scrap item.'
        );
      }

      Alert.alert(
        'Success',
        isEditing
          ? 'Scrap item updated successfully.'
          : 'Scrap item added successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/company/scrap-items'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Unable to save item.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading scrap item...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        {isEditing ? 'Edit Scrap Item' : 'Add New Scrap Item'}
      </Text>

      <Text style={styles.label}>Scrap Item Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Example: Iron, Plastic, Newspaper"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Price per KG (₹) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter price per kg"
        value={pricePerKg}
        onChangeText={setPricePerKg}
        keyboardType="decimal-pad"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {isEditing ? 'Update Scrap Item' : 'Add Scrap Item'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
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
    marginBottom: 25,
    marginTop: 100,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#16A34A',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
