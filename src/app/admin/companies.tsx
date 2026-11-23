
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
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL } from '../../constants/api';

type Company = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  description?: string | null;
  isActive: boolean;
  scrapItems: {
    id: number;
    name: string;
    pricePerKg: string | number;
    isActive: boolean;
  }[];
};

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompanies = async () => {
    try {
      const token = await SecureStore.getItemAsync('scrapgo_token');

      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/companies`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to fetch companies.');
      }

      setCompanies(data.companies || []);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to load companies.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCompanies();
    }, [])
  );

  const toggleCompanyStatus = (company: Company) => {
    const newStatus = !company.isActive;

    Alert.alert(
      newStatus ? 'Activate Company' : 'Deactivate Company',
      `Are you sure you want to ${
        newStatus ? 'activate' : 'deactivate'
      } ${company.name}?`,
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
                `${API_URL}/api/admin/companies/${company.id}/status`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    isActive: newStatus,
                  }),
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.message || 'Unable to update company.'
                );
              }

              Alert.alert('Success', data.message);
              fetchCompanies();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Unable to update company.'
              );
            }
          },
        },
      ]
    );
  };

  const renderCompany = ({ item }: { item: Company }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.companyName}>{item.name}</Text>

        <Text
          style={[
            styles.status,
            {
              color: item.isActive ? '#16A34A' : '#DC2626',
            },
          ]}
        >
          {item.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Text>
      </View>

      <Text style={styles.detail}>Email: {item.email}</Text>
      <Text style={styles.detail}>Phone: {item.phone}</Text>
      <Text style={styles.detail}>Address: {item.address}</Text>

      <Text style={styles.sectionTitle}>Accepted Scrap Items</Text>

      {item.scrapItems.length > 0 ? (
        item.scrapItems.map((scrap) => (
          <Text key={scrap.id} style={styles.detail}>
            {scrap.name} - ₹{scrap.pricePerKg}/kg
            {!scrap.isActive ? ' (Inactive)' : ''}
          </Text>
        ))
      ) : (
        <Text style={styles.detail}>No scrap items added.</Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: item.isActive ? '#DC2626' : '#16A34A',
          },
        ]}
        onPress={() => toggleCompanyStatus(item)}
      >
        <Text style={styles.buttonText}>
          {item.isActive ? 'Deactivate Company' : 'Activate Company'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text>Loading companies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Companies</Text>

      <Text style={styles.total}>
        Total Companies: {companies.length}
      </Text>

      <FlatList
        data={companies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCompany}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchCompanies();
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No companies available.</Text>
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
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  status: {
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 14,
    color: '#444444',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 12,
    marginBottom: 6,
  },
  button: {
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#777777',
  },
});
