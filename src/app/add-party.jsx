import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiPost } from '../api';
import { takePickedContact } from '../pickedContact';

export default function AddParty() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState(params.type === 'supplier' ? 'supplier' : 'customer');
  const [showMore, setShowMore] = useState(false);
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Fills the form when you come back from the contact picker
  useFocusEffect(
    useCallback(() => {
      const c = takePickedContact();
      if (c) {
        setName(c.name);
        setPhone(c.phone);
      }
    }, [])
  );

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (phone && phone.length !== 10) {
      return Alert.alert('Invalid number', 'Please enter a 10-digit mobile number');
    }
    try {
      setLoading(true);
      await apiPost('/parties', {
        name: name.trim(),
        phone,
        type,
        gstin: gstin.trim(),
        address: address.trim(),
      });
      router.back();
    } catch (error) {
      Alert.alert('Could not save', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Party',
          headerStyle: { backgroundColor: '#1a7f4b' },
          headerTintColor: '#fff',
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#fff' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.contactBtn} onPress={() => router.push('/pick-contact')}>
            <Ionicons name="person-circle-outline" size={22} color="#1a7f4b" />
            <Text style={styles.contactBtnText}>ADD FROM CONTACTS</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.nameInput}
            placeholder="Party name"
            placeholderTextColor="#777"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.phoneRow}>
            <View style={styles.codeBox}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.code}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Mobile Number"
              placeholderTextColor="#777"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.radioRow}>
            <Text style={styles.radioLabel}>Who are they?</Text>
            {['customer', 'supplier'].map((t) => (
              <TouchableOpacity key={t} style={styles.radio} onPress={() => setType(t)}>
                <View style={styles.radioOuter}>
                  {type === t && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioText}>{t === 'customer' ? 'Customer' : 'Supplier'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => setShowMore(!showMore)}>
            <Text style={styles.moreLink}>
              {showMore ? '− HIDE GSTIN & ADDRESS' : '+ ADD GSTIN & ADDRESS (OPTIONAL)'}
            </Text>
          </TouchableOpacity>

          {showMore && (
            <View style={{ marginTop: 14 }}>
              <TextInput
                style={styles.input}
                placeholder="GSTIN"
                placeholderTextColor="#777"
                autoCapitalize="characters"
                value={gstin}
                onChangeText={setGstin}
              />
              <TextInput
                style={[styles.input, { height: 90, textAlignVertical: 'top', marginTop: 12 }]}
                placeholder="Address"
                placeholderTextColor="#777"
                multiline
                value={address}
                onChangeText={setAddress}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, (!canSave || loading) && styles.saveDisabled]}
            onPress={handleSave}
            disabled={!canSave || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>
                {type === 'customer' ? 'ADD CUSTOMER' : 'ADD SUPPLIER'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1a7f4b', borderRadius: 6, paddingVertical: 13, marginBottom: 16,
  },
  contactBtnText: { color: '#1a7f4b', fontWeight: '700', marginLeft: 8, letterSpacing: 0.5 },
  nameInput: {
    borderWidth: 2, borderColor: '#1a7f4b', borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 15, fontSize: 18,
  },
  phoneRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12,
  },
  flag: { fontSize: 22 },
  code: { fontSize: 18, color: '#333' },
  phoneInput: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 15, fontSize: 18,
  },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, flexWrap: 'wrap' },
  radioLabel: { fontSize: 16, color: '#555', marginRight: 14 },
  radio: { flexDirection: 'row', alignItems: 'center', marginRight: 18 },
  radioOuter: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#1a7f4b',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1a7f4b' },
  radioText: { fontSize: 15, color: '#222' },
  moreLink: { color: '#1a7f4b', fontSize: 16, fontWeight: '600', marginTop: 24 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 14, fontSize: 16,
  },
  footer: { padding: 12, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  saveButton: { backgroundColor: '#1a7f4b', paddingVertical: 16, borderRadius: 6 },
  saveDisabled: { backgroundColor: '#c8c8c8' },
  saveText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
});