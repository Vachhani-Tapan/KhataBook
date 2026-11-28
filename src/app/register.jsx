import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiPost } from '../api';
import { saveToken } from '../storage';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) return Alert.alert('Missing details', 'Please enter your name');
    if (!shopName.trim()) return Alert.alert('Missing details', 'Please enter your shop name');
    if (!emailRegex.test(email.trim())) return Alert.alert('Invalid email', 'Please enter a valid email address');
    if (phone.length !== 10) return Alert.alert('Invalid number', 'Please enter a 10-digit mobile number');
    if (password.length < 6) return Alert.alert('Weak password', 'Password must be at least 6 characters');

    try {
      setLoading(true);
      const data = await apiPost('/auth/register', {
        name: name.trim(),
        shopName: shopName.trim(),
        email: email.trim(),
        phone,
        password,
      });
      await saveToken(data.token);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Registration failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>KhataBook</Text>
        <Text style={styles.heading}>Create your shop account</Text>

        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="e.g. Ramesh Patel"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Shop name</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="e.g. Patel General Store"
          value={shopName}
          onChangeText={setShopName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Phone number</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="10-digit number"
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="At least 6 characters"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 34, fontWeight: 'bold', color: '#1a7f4b', textAlign: 'center', marginBottom: 24 },
  heading: { fontSize: 22, fontWeight: '600', color: '#222', marginBottom: 8 },
  label: { fontSize: 14, color: '#333', marginBottom: 8, marginTop: 12 },
  fieldInput: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 16,
  },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12,
  },
  prefix: { fontSize: 16, marginRight: 8, color: '#333' },
  phoneInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12,
  },
  passwordInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  button: { backgroundColor: '#1a7f4b', padding: 16, borderRadius: 8, marginTop: 28 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#555', fontSize: 14 },
  link: { color: '#1a7f4b', fontSize: 14, fontWeight: '600' },
});