
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { API_URL } from '../../constants/api';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type ScrapItem = {
  id: number;
  name: string;
  pricePerKg: string | number;
};

type Company = {
  id: number;
  name: string;
  scrapItems: ScrapItem[];
};

type SelectedItem = {
  scrapItemId: number;
  name: string;
  pricePerKg: number;
  quantity: string;
};

export default function BookPickupScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(Boolean(companyId));

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [address, setAddress] = useState('');

const [showMap, setShowMap] = useState(false);
const [searchPlace, setSearchPlace] = useState('');
const [selectedLocation, setSelectedLocation] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);

const [mapRegion, setMapRegion] = useState<Region>({
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 15,
  longitudeDelta: 15,
});

const [locationLoading, setLocationLoading] = useState(false);

const osmMapHtml = useMemo(() => {
  const markerScript = selectedLocation
    ? `
      const marker = L.marker(
        [${selectedLocation.latitude}, ${selectedLocation.longitude}],
        { draggable: true }
      ).addTo(map);
      marker.on('dragend', function(event) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'map-click',
          latitude: event.target.getLatLng().lat,
          longitude: event.target.getLatLng().lng
        }));
      });
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const map = L.map('map').setView(
            [${mapRegion.latitude}, ${mapRegion.longitude}],
            ${selectedLocation ? 15 : 5}
          );
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          ${markerScript}
          map.on('click', function(event) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'map-click',
              latitude: event.latlng.lat,
              longitude: event.latlng.lng
            }));
          });
        </script>
      </body>
    </html>
  `;
}, [mapRegion, selectedLocation]);

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/companies/${companyId}`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to load company.');
        }

        setCompany(result.company);
      } catch (error: unknown) {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'Unable to load company.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      loadCompany();
    }
  }, [companyId]);

  const addScrapItem = (item: ScrapItem) => {
    const alreadyAdded = selectedItems.some(
      (selected) => selected.scrapItemId === item.id
    );

    if (alreadyAdded) {
      Alert.alert('Already Added', 'This scrap item is already selected.');
      return;
    }

    setSelectedItems((previous) => [
      ...previous,
      {
        scrapItemId: item.id,
        name: item.name,
        pricePerKg: Number(item.pricePerKg),
        quantity: '',
      },
    ]);
  };

  const updateQuantity = (itemId: number, quantity: string) => {
    setSelectedItems((previous) =>
      previous.map((item) =>
        item.scrapItemId === itemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeScrapItem = (itemId: number) => {
    setSelectedItems((previous) =>
      previous.filter((item) => item.scrapItemId !== itemId)
    );
  };

  const pickPhotos = async () => {
    if (photos.length >= 5) {
      Alert.alert('Photo Limit', 'You can upload a maximum of 5 photos.');
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow photo library access to upload scrap photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotos((previous) =>
        [...previous, ...result.assets].slice(0, 5)
      );
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos((previous) => previous.filter((photo) => photo.uri !== uri));
  };

  // Convert coordinates into a readable address
const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
) => {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (results.length > 0) {
      const place = results[0];

      const formattedAddress = [
        place.name,
        place.street,
        place.district,
        place.city,
        place.region,
        place.postalCode,
        place.country,
      ]
        .filter(Boolean)
        .filter(
          (value, index, array) => array.indexOf(value) === index
        )
        .join(', ');

      setAddress(formattedAddress);
    } else {
      Alert.alert('Address Not Found', 'Unable to find this address.');
    }
  } catch {
    Alert.alert('Error', 'Unable to get the address for this location.');
  }
};


// Select a location and update the address
const selectMapLocation = async (
  latitude: number,
  longitude: number
) => {
  setSelectedLocation({ latitude, longitude });

  setMapRegion({
    latitude,
    longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  await getAddressFromCoordinates(latitude, longitude);
};


// Get current location
const useCurrentLocation = async () => {
  try {
    setLocationLoading(true);

    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow location access to use your current location.'
      );
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    await selectMapLocation(
      location.coords.latitude,
      location.coords.longitude
    );
  } catch {
    Alert.alert('Location Error', 'Unable to get your current location.');
  } finally {
    setLocationLoading(false);
  }
};


// Search for a place
const searchLocation = async () => {
  if (!searchPlace.trim()) {
    Alert.alert('Search Location', 'Please enter a place name.');
    return;
  }

  try {
    setLocationLoading(true);

    const results = await Location.geocodeAsync(searchPlace.trim());

    if (results.length === 0) {
      Alert.alert('Not Found', 'No matching location found.');
      return;
    }

    await selectMapLocation(
      results[0].latitude,
      results[0].longitude
    );
  } catch {
    Alert.alert('Search Error', 'Unable to search this location.');
  } finally {
    setLocationLoading(false);
  }
};

  const validateForm = () => {
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Required Fields', 'Please fill in your name, phone and address.');
      return false;
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return false;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Select Scrap', 'Please select at least one scrap item.');
      return false;
    }

    const invalidQuantity = selectedItems.some(
      (item) =>
        item.quantity.trim() === '' ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
    );

    if (invalidQuantity) {
      Alert.alert(
        'Invalid Quantity',
        'Please enter a valid quantity greater than zero for every selected item.'
      );
      return false;
    }

    return true;
  };

  
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    setSubmitting(true);

    const token = await SecureStore.getItemAsync('scrapgo_token');

    if (!token) {
      Alert.alert('Login Required', 'Please log in again.');
      return;
    }

    const bookingData = {
      companyId: Number(companyId),
      customerName: customerName.trim(),
      customerPhone: phone.trim(),
      pickupAddress: address.trim(),
      instructions: instructions.trim(),
      items: selectedItems.map(item => ({
        scrapItemId: Number(item.scrapItemId),
        quantityKg: Number(item.quantity),
      })),
    };

    const response = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Booking failed.');
    }

   
Alert.alert(
  'Booking Successful!',
  `Your booking #${data.booking.id} has been submitted successfully.`,
  [
    {
      text: 'OK',
      onPress: () => {
        router.replace('/customer/dashboard');
      },
    },
  ],
  { cancelable: false }
);

  } catch (error) {
    console.error('Booking submission error:', error);

    Alert.alert(
      'Booking Failed',
      error instanceof Error ? error.message : 'Something went wrong.'
    );
  } finally {
    setSubmitting(false);
  }
};


  const estimatedTotal = selectedItems.reduce(
    (total, item) =>
      total + item.pricePerKg * (Number(item.quantity) || 0),
    0
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Loading booking form...</Text>
      </View>
    );
  }

  if (!company) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Company not found.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <Text style={styles.heading}>Book Scrap Pickup</Text>
        <Text style={styles.subtitle}>Enter your pickup details below.</Text>
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.companyCard}>
          <Text style={styles.companyLabel}>Selected Company</Text>
          <Text style={styles.companyName}>{company.name}</Text>
        </View>

        <Text style={styles.sectionTitle}>Customer Details</Text>

      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={customerName}
        onChangeText={setCustomerName}
      />

      <Text style={styles.label}>Phone Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 10-digit phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
      />

      <Text style={styles.sectionTitle}>Select Scrap Items</Text>
      <Text style={styles.hint}>Tap an item to add it to your booking.</Text>

      {company.scrapItems.map((item) => {
        const isSelected = selectedItems.some(
          (selected) => selected.scrapItemId === item.id
        );

        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemOption, isSelected && styles.selectedOption]}
            onPress={() => addScrapItem(item)}
            disabled={isSelected}
          >
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>
                ₹{Number(item.pricePerKg).toFixed(2)}/kg
              </Text>
            </View>
            <Text style={styles.addText}>
              {isSelected ? 'Added ✓' : '+ Add'}
            </Text>
          </TouchableOpacity>
        );
      })}

      {selectedItems.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Your Selected Items</Text>

          {selectedItems.map((item) => (
            <View key={item.scrapItemId} style={styles.selectedItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  ₹{item.pricePerKg.toFixed(2)}/kg
                </Text>
              </View>

              <TextInput
                style={styles.quantityInput}
                placeholder="Qty (kg)"
                keyboardType="decimal-pad"
                value={item.quantity}
                onChangeText={(value) =>
                  updateQuantity(item.scrapItemId, value)
                }
              />

              <TouchableOpacity
                onPress={() => removeScrapItem(item.scrapItemId)}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Estimated Amount</Text>
            <Text style={styles.totalAmount}>
              ₹{estimatedTotal.toFixed(2)}
            </Text>
            <Text style={styles.hint}>
              Final amount will depend on actual weight and quality.
            </Text>
          </View>
        </>
      )}

      
<Text style={styles.sectionTitle}>Pickup Address</Text>

{/* Choose location from map */}
<TouchableOpacity
  style={styles.mapOptionButton}
  onPress={() => setShowMap(!showMap)}
>
  <Text style={styles.mapOptionText}>
    📍 {showMap ? 'Hide Map' : 'Pin Location on Map'}
  </Text>
</TouchableOpacity>

{showMap && (
  <View style={styles.mapContainer}>

    {/* Search a place */}
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search area, street or place..."
        value={searchPlace}
        onChangeText={setSearchPlace}
        onSubmitEditing={searchLocation}
        returnKeyType="search"
      />

      <TouchableOpacity
        style={styles.searchButton}
        onPress={searchLocation}
        disabled={locationLoading}
      >
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
    </View>

    {/* Current location */}
    <TouchableOpacity
      style={styles.currentLocationButton}
      onPress={useCurrentLocation}
      disabled={locationLoading}
    >
      <Text style={styles.currentLocationText}>
        📍 {locationLoading ? 'Finding Location...' : 'Use Current Location'}
      </Text>
    </TouchableOpacity>

    {Platform.OS === 'web' ? (
      <View style={styles.webMapMessage}>
        <Text style={styles.webMapMessageText}>
          Interactive maps are available in the mobile app. Use Search or
          Use Current Location on the web.
        </Text>
      </View>
    ) : (
      <WebView
        originWhitelist={['*']}
        source={{ html: osmMapHtml }}
        style={styles.map}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'map-click') {
              selectMapLocation(message.latitude, message.longitude);
            }
          } catch {
            Alert.alert('Map Error', 'Unable to select that map location.');
          }
        }}
      />
    )}

    {selectedLocation && (
      <TouchableOpacity
        style={styles.confirmLocationButton}
        onPress={() => setShowMap(false)}
      >
        <Text style={styles.confirmLocationText}>
          Confirm Location
        </Text>
      </TouchableOpacity>
    )}

  </View>
 )}

      <Text style={styles.label}>Selected Pickup Address</Text>

      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Your selected location will appear here"
        value={address}
        onChangeText={setAddress}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.sectionTitle}>Upload Scrap Photos</Text>
      <TouchableOpacity style={styles.photoButton} onPress={pickPhotos}>
        <Text style={styles.photoButtonText}>📷 Choose Photos</Text>
      </TouchableOpacity>

      <View style={styles.photoList}>
        {photos.map((photo) => (
          <View key={photo.uri} style={styles.photoContainer}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.photoRemove}
              onPress={() => removePhoto(photo.uri)}
            >
              <Text style={styles.photoRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Additional Instructions</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Any additional information (optional)"
        value={instructions}
        onChangeText={setInstructions}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit Booking'}</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        * Your request will be sent to the selected company for confirmation.
      </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  fixedHeader: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 18,
    paddingTop: 100,
    paddingBottom: 8,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#166534',
  },
  subtitle: {
    color: '#666',
    marginTop: 6,
    marginBottom: 20,
  },
  companyCard: {
    backgroundColor: '#166534',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },
  companyLabel: {
    color: '#DCFCE7',
    fontSize: 13,
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginTop: 22,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 7,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9,
    padding: 13,
    fontSize: 15,
    marginBottom: 14,
  },
  multilineInput: {
    minHeight: 85,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#777',
    marginBottom: 10,
  },
  itemOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  itemPrice: {
    fontSize: 13,
    color: '#16A34A',
    marginTop: 5,
  },
  addText: {
    color: '#16A34A',
    fontWeight: 'bold',
  },
  selectedItem: {
    backgroundColor: '#FFFFFF',
    padding: 13,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    width: 90,
    padding: 9,
    textAlign: 'center',
  },
  removeText: {
    color: '#DC2626',
    fontSize: 19,
    fontWeight: 'bold',
    padding: 5,
  },
  totalCard: {
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 10,
    marginTop: 5,
  },
  totalLabel: {
    color: '#166534',
    fontSize: 14,
  },
  totalAmount: {
    color: '#166534',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  photoButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 9,
    padding: 15,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#166534',
    fontWeight: 'bold',
    fontSize: 15,
  },
  photoList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 85,
    height: 85,
    borderRadius: 8,
  },
  photoRemove: {
    position: 'absolute',
    top: -7,
    right: -7,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#16A34A',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
    marginTop: 15,
    marginBottom: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 15,
  },

mapOptionButton: {
  backgroundColor: '#DCFCE7',
  borderWidth: 1,
  borderColor: '#16A34A',
  borderRadius: 10,
  padding: 14,
  alignItems: 'center',
  marginBottom: 15,
},

mapOptionText: {
  color: '#166534',
  fontSize: 15,
  fontWeight: 'bold',
},

mapContainer: {
  backgroundColor: '#FFFFFF',
  padding: 10,
  borderRadius: 12,
  marginBottom: 15,
  borderWidth: 1,
  borderColor: '#DCFCE7',
},

searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 10,
},

searchInput: {
  flex: 1,
  backgroundColor: '#F9FAFB',
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 8,
  padding: 12,
  fontSize: 14,
},

searchButton: {
  backgroundColor: '#166534',
  padding: 13,
  borderRadius: 8,
},

searchButtonText: {
  color: '#FFFFFF',
  fontWeight: 'bold',
},

currentLocationButton: {
  backgroundColor: '#EFF6FF',
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginBottom: 10,
},

currentLocationText: {
  color: '#1D4ED8',
  fontWeight: 'bold',
},

map: {
  width: '100%',
  height: 300,
  borderRadius: 10,
},

webMapMessage: {
  backgroundColor: '#EFF6FF',
  padding: 16,
  borderRadius: 10,
},

webMapMessageText: {
  color: '#1D4ED8',
  textAlign: 'center',
},

mapHint: {
  fontSize: 12,
  color: '#666666',
  marginTop: 10,
  textAlign: 'center',
},

confirmLocationButton: {
  backgroundColor: '#16A34A',
  padding: 14,
  borderRadius: 8,
  alignItems: 'center',
  marginTop: 12,
},

confirmLocationText: {
  color: '#FFFFFF',
  fontWeight: 'bold',
  fontSize: 15,
},

});
