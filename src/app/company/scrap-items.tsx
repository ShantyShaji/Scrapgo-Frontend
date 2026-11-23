
import { Ionicons } from '@expo/vector-icons';
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

type ScrapItem = {
  id: number;
  name: string;
  pricePerKg: string | number;
  isActive: boolean;
};

export default function CompanyScrapItems() {
  const router = useRouter();

  const [items, setItems] = useState<ScrapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScrapItems = async () => {
    try {
      const token = await SecureStore.getItemAsync('scrapgo_token');

      if (!token) {
        Alert.alert('Error', 'Please login again.');
        return;
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
        throw new Error(data.message || 'Unable to load scrap items');
      }

      setItems(data.items || data.scrapItems || []);

    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchScrapItems();
    }, [])
  );
  const handleDeleteScrapItem = (id: number) => {
    Alert.alert(
      'Deactivate Scrap Item',
      'Are you sure you want to remove this item from your active list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('scrapgo_token');

              const response = await fetch(
                `${API_URL}/api/company/scrap-items/${id}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ isActive: false }),
                }
              );

              const data = await response.json();

              if (response.ok) {
                Alert.alert('Success', 'Scrap item removed successfully');
                fetchScrapItems();
              } else {
                Alert.alert('Error', data.message || 'Unable to remove item');
              }
            } catch (error) {
              Alert.alert('Error', 'Unable to connect to the server');
            }
          },
        },
      ]
    );
  };

  const toggleStatus = (item: ScrapItem) => {
    Alert.alert(
      item.isActive ? 'Deactivate Scrap Item' : 'Activate Scrap Item',
      `Are you sure you want to ${item.isActive ? 'deactivate' : 'activate'
      } ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync(
                'scrapgo_token'
              );

              const response = await fetch(
                `${API_URL}/api/company/scrap-items/${item.id}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    isActive: !item.isActive,
                  }),
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.message || 'Unable to update item.');
              }

              Alert.alert('Success', data.message || 'Status updated.');
              fetchScrapItems();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Update failed.'
              );
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ScrapItem }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.price}>
            ₹{item.pricePerKg}/kg
          </Text>
          <Text
            style={{
              color: item.isActive ? '#16A34A' : '#DC2626',
              fontWeight: 'bold',
              marginTop: 5,
            }}
          >
            {item.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>

        <View style={styles.actions}>
         <TouchableOpacity
  style={styles.editButton}
  onPress={() => {
    console.log('Selected scrap item ID:', item.id);

    router.push({
      pathname: '/company/add-scrap-item',
      params: { id: String(item.id) },
    });
  }}
>
  <Ionicons name="pencil" size={18} color="#FFFFFF" />
</TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusButton,
              {
                backgroundColor: item.isActive ? '#DC2626' : '#16A34A',
              },
            ]}
            onPress={() => toggleStatus(item)}
          >
            <Text style={styles.buttonText}>
              {item.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading scrap items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Scrap Items</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/company/add-scrap-item')}
      >
        <Text style={styles.buttonText}>+ Add New Scrap Item</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchScrapItems();
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No scrap items added yet.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 15,
    marginTop: 100,
  },
  addButton: {
    backgroundColor: '#16A34A',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    marginTop: 5,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#0ccbf6',
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  statusButton: {
    padding: 10,
    borderRadius: 7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#777777',
  },
  section: {
    marginTop: 25,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  scrapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },

  scrapName: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  scrapPrice: {
    fontSize: 15,
    color: '#16834A',
    marginTop: 5,
  },

  scrapStatus: {
    fontSize: 12,
    marginTop: 5,
    color: '#666',
  },

  actionButtons: {
    gap: 8,
    marginLeft: 10,
  },

  deleteButton: {
    backgroundColor: '#D93636',
    padding: 9,
    borderRadius: 6,
    alignItems: 'center',
  },

  emptyText: {
    color: '#777',
    marginTop: 10,
  },
});
