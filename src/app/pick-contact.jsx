import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts/legacy';
import { setPickedContact } from '../pickedContact';

// Keep the last 10 digits (removes +91, spaces, dashes)
const cleanPhone = (raw) => {
  const digits = (raw || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
};

export default function PickContact() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // loading | denied | ready
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { status: perm } = await Contacts.requestPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      });

      const list = [];
      data.forEach((c) => {
        if (!c.name) return;
        const phone = cleanPhone(c.phoneNumbers?.[0]?.number);
        list.push({ id: c.id, name: c.name, phone });
      });

      setContacts(list);
      setStatus('ready');
    })();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [contacts, search]);

  const choose = (c) => {
    setPickedContact({ name: c.name, phone: c.phone });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Choose Contact',
          headerStyle: { backgroundColor: '#1a7f4b' },
          headerTintColor: '#fff',
        }}
      />

      {status === 'loading' && (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1a7f4b" />
      )}

      {status === 'denied' && (
        <View style={styles.denied}>
          <Ionicons name="lock-closed-outline" size={56} color="#bbb" />
          <Text style={styles.deniedTitle}>Contact permission needed</Text>
          <Text style={styles.deniedText}>
            Allow contacts access to add parties from your phonebook.
          </Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsText}>OPEN SETTINGS</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'ready' && (
        <>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#1a7f4b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contact"
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <FlatList
            data={visible}
            keyExtractor={(c) => c.id}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            ListEmptyComponent={<Text style={styles.empty}>No contacts found</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => choose(item)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.phone}>{item.phone ? `+91 ${item.phone}` : 'No valid number'}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa',
    margin: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 11, marginLeft: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#e8f5ee',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 17, fontWeight: '700', color: '#1a7f4b' },
  name: { fontSize: 17, color: '#222' },
  phone: { fontSize: 14, color: '#777', marginTop: 2 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
  denied: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  deniedTitle: { fontSize: 18, fontWeight: '600', color: '#444', marginTop: 12 },
  deniedText: { fontSize: 14, color: '#888', marginTop: 6, textAlign: 'center' },
  settingsBtn: { backgroundColor: '#1a7f4b', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 6, marginTop: 20 },
  settingsText: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
});