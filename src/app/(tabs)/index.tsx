
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.logoContainer}>
          <Text style={styles.logo}>♻️</Text>
          <Text style={styles.appName}>ScrapGo</Text>
        </View>

        <Text style={styles.heading}>
          Turn Your Scrap Into Cash!
        </Text>

        <Text style={styles.description}>
          Sell your unused scrap materials.
          We collect them right from your doorstep.
        </Text>

        <View style={styles.illustration}>
          <Text style={styles.illustrationEmoji}>📦 📰 ♻️</Text>
          <Text style={styles.illustrationText}>
            Recycle Today, Save Tomorrow
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/customer/login')}
        >
          <Text style={styles.primaryButtonText}>
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/company/login')}
        >
          <Text style={styles.secondaryButtonText}>
            Company Login
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          A cleaner tomorrow starts with you 🌱
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F1',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 65,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#198754',
  },
  heading: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#185C35',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#526B59',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 35,
  },
  illustration: {
    backgroundColor: '#DCEFE0',
    width: '100%',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  illustrationEmoji: {
    fontSize: 45,
    marginBottom: 15,
  },
  illustrationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#277344',
  },
  primaryButton: {
    backgroundColor: '#198754',
    width: '100%',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#198754',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#198754',
    fontSize: 17,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    fontSize: 13,
    color: '#66806C',
  },
});
