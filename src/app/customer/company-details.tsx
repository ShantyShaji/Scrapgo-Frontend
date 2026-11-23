
import { useLocalSearchParams, useRouter } from 'expo-router';
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

type ScrapItem = {
  id: number;
  name: string;
  pricePerKg: string | number;
};

type Company = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  description?: string | null;
  logo?: string | null;
  scrapItems: ScrapItem[];
};

export default function CompanyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/companies/${id}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to load company details.');
        }

        setCompany(result.company);
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.message || 'Something went wrong.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompany();
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading company details...</Text>
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Company details not found.</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.companyName}>{company.name}</Text>
        <Text style={styles.address}>📍 {company.address}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About Company</Text>
        <Text style={styles.description}>
          {company.description || 'No company description available.'}
        </Text>

        <Text style={styles.contact}>📞 {company.phone}</Text>
        <Text style={styles.contact}>✉️ {company.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Accepted Scrap Items</Text>

        {company.scrapItems.length > 0 ? (
          company.scrapItems.map((item) => (
            <View key={item.id} style={styles.scrapRow}>
              <View>
                <Text style={styles.scrapName}>{item.name}</Text>
                <Text style={styles.unit}>Price per kilogram</Text>
              </View>

              <Text style={styles.price}>
                ₹{Number(item.pricePerKg).toFixed(2)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            This company has not added any scrap items yet.
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          company.scrapItems.length === 0 && styles.disabledButton,
        ]}
        disabled={company.scrapItems.length === 0}
        onPress={() =>
          router.push(`/customer/book-pickup?companyId=${company.id}`)
        }
      >
        <Text style={styles.buttonText}>Book a Scrap Pickup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>Back to Companies</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    padding: 18,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#166534',
    padding: 25,
    borderRadius: 15,
    marginTop: 100,
    marginBottom: 18,
  },
  companyName: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  address: {
    fontSize: 14,
    color: '#DCFCE7',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 13,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 13,
  },
  description: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 22,
  },
  contact: {
    fontSize: 14,
    color: '#444444',
    marginTop: 12,
  },
  scrapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  scrapName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  unit: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  price: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  emptyText: {
    color: '#777777',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#16A34A',
    padding: 17,
    borderRadius: 11,
    alignItems: 'center',
    marginTop: 5,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 25,
  },
  backText: {
    color: '#166534',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 15,
  },
});
