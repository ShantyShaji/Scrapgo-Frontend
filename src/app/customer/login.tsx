
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL } from '../../constants/api';

export default function CustomerLogin() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
        return;
      }

      // Securely store the JWT token
      await SecureStore.setItemAsync('scrapgo_token', data.token);

      // Store basic user information
      await SecureStore.setItemAsync(
        'scrapgo_user',
        JSON.stringify(data.user)
      );

      Alert.alert('Success', 'Welcome to ScrapGo!');

      if (data.user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (data.user.role === 'COMPANY') {
        router.replace('/company/dashboard');
      } else {
        router.replace('/customer/dashboard');
      }

    } catch (error) {
      console.error('Login error:', error);

      Alert.alert(
        'Connection Error',
        'Unable to connect to ScrapGo server.'
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F0F8F1' }]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {/* <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/company/dashboard')}
          >
            <Text style={styles.homeIcon}>⌂</Text>
            <Text style={styles.homeText}>Home</Text>
          </TouchableOpacity> */}

          <Text style={styles.logo}>♻️</Text>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Login to your ScrapGo customer account
          </Text>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#7A8D7F"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            underlineColorAndroid="transparent"
            cursorColor="#16834A"
          />

          <Text style={styles.label}>Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#7A8D7F"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="password"
              textContentType="password"
              keyboardType="default"
              selectionColor="#16834A"
              underlineColorAndroid="transparent"
              cursorColor="#16834A"
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />

            <TouchableOpacity
              onPressIn={() => setShowPassword((visible) => !visible)}
              style={styles.eyeButton}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={23}
                color="#66806C"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}> {loading ? 'Please wait...' : 'Login'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don&apos;t have an account?
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/customer/register')}
            >
              <Text style={styles.link}> Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F1',
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  logo: {
    fontSize: 55,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#185C35',
    textAlign: 'center',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 15,
    color: '#66806C',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 35,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#185C35',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D5E5D8',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#198754',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#526B59',
    fontSize: 15,
  },
  link: {
    color: '#198754',
    fontSize: 15,
    fontWeight: 'bold',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 15,
  },

  homeIcon: {
    fontSize: 24,
    marginRight: 6,
    color: '#16834A',
  },

  homeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16834A',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5E5D8',
    borderRadius: 10,
    marginBottom: 20,
  },

  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#1F2937',
  },

  eyeButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});
