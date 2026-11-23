
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
};

type Company = {
  id: number;
  name: string;
  address: string;
  description?: string | null;
  logo?: string | null;
  scrapItems: ScrapItem[];
};

export default function CompaniesScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchCompanies = async () => {
    try {
      setError('');

      const response = await fetch(`${API_URL}/api/companies`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to load companies.');
      }

      setCompanies(result.companies || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const renderCompany = ({ item }: { item: Company }) => (
    <View style={styles.card}>
      <Text style={styles.companyName}>{item.name}</Text>

      <Text style={styles.address}>📍 {item.address}</Text>

      {item.description ? (
        <Text style={styles.description}>{item.description}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>Accepted Scrap Items</Text>

      {item.scrapItems.length > 0 ? (
        item.scrapItems.slice(0, 3).map((scrap) => (
          <View key={scrap.id} style={styles.scrapRow}>
            <Text style={styles.scrapName}>{scrap.name}</Text>
            <Text style={styles.price}>
              ₹{Number(scrap.pricePerKg).toFixed(2)}/kg
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>
          No scrap items currently available.
        </Text>
      )}

      {item.scrapItems.length > 3 && (
        <Text style={styles.moreText}>
          +{item.scrapItems.length - 3} more items
        </Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push(`/customer/company-details?id=${item.id}`)
        }
      >
        <Text style={styles.buttonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading companies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Scrap Companies</Text>
      <Text style={styles.subtitle}>
        Choose a company for your scrap pickup.
      </Text>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={fetchCompanies}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCompany}
          contentContainerStyle={styles.list}
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
            <Text style={styles.emptyText}>
              No active scrap companies found.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
    padding: 20,
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 100,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    marginBottom: 20,
  },
  list: {
    paddingBottom: 25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    elevation: 3,
  },
  companyName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#166534',
  },
  address: {
    fontSize: 13,
    color: '#666',
    marginTop: 7,
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 17,
    marginBottom: 8,
    color: '#333',
  },
  scrapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  scrapName: {
    fontSize: 14,
    color: '#444',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  emptyText: {
    color: '#777',
    marginVertical: 12,
  },
  button: {
    backgroundColor: '#16A34A',
    padding: 13,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 17,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 10,
  },
});
