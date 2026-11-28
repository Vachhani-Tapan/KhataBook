import { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../../api';
import { removeToken } from '../../storage';

const rupees = (paise) => {
  const v = Math.abs(paise) / 100;
  return `₹ ${Number.isInteger(v) ? v.toLocaleString('en-IN') : v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const initials = (name) => {
  const w = name.trim().split(/\s+/);
  return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase();
};

const timeAgo = (date) => {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min > 1 ? 's' : ''} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? 's' : ''} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? 's' : ''} ago`;
};

export default function Parties() {
  const router = useRouter();
  const [type, setType] = useState('customer'); // 'customer' | 'supplier'
  const [search, setSearch] = useState('');
  const [parties, setParties] = useState([]);
  const [summary, setSummary] = useState({ youWillGet: 0, youWillGive: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isCustomer = type === 'customer';
  const accent = isCustomer ? '#a50f4b' : '#00707f';

  const load = async (t = type, q = search) => {
    try {
      const data = await apiGet(`/parties?type=${t}&search=${encodeURIComponent(q.trim())}`);
      setParties(data.parties);
      setSummary(data.summary);
    } catch (error) {
      if (error.status === 401) {
        await removeToken();
        router.replace('/login');
        return;
      }
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [type])
  );

  const switchType = (t) => {
    if (t === type) return;
    setLoading(true);
    setSearch('');
    setType(t);
  };

  const onSearch = (text) => {
    setSearch(text);
    load(type, text);
  };

  const renderParty = ({ item }) => {
    const get = item.balance > 0;
    const give = item.balance < 0;
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/party/[id]', params: { id: item._id } })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(item.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.ago}>{timeAgo(item.updatedAt)}</Text>
        </View>
        <View style={[styles.amountBox, get && styles.getBg]}>
          <Text style={[styles.amount, get && { color: '#a50f1f' }, give && { color: '#1a7f4b' }]}>
            {rupees(item.balance)}
          </Text>
          {get && isCustomer && <Text style={styles.remind}>REMIND ›</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Blue header area */}
      <View style={styles.header}>
        <View style={styles.tabs}>
          {['customer', 'supplier'].map((t) => (
            <TouchableOpacity key={t} style={styles.tab} onPress={() => switchType(t)}>
              <Text style={[styles.tabText, type === t && styles.tabActive]}>
                {t === 'customer' ? 'CUSTOMERS' : 'SUPPLIERS'}
              </Text>
              {type === t && <View style={styles.tabLine} />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>You will give</Text>
            <Text style={[styles.summaryAmount, { color: '#1a7f4b' }]}>{rupees(summary.youWillGive)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>You will get</Text>
            <Text style={[styles.summaryAmount, { color: '#a50f1f' }]}>{rupees(summary.youWillGet)}</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={22} color="#1a7f4b" />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${isCustomer ? 'Customer' : 'Supplier'}`}
          placeholderTextColor="#999"
          value={search}
          onChangeText={onSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1a7f4b" />
      ) : (
        <FlatList
          data={parties}
          keyExtractor={(p) => p._id}
          renderItem={renderParty}
          contentContainerStyle={parties.length === 0 ? styles.emptyWrap : { paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              colors={['#1a7f4b']}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color="#bbb" />
              <Text style={styles.emptyTitle}>
                {search ? 'No match found' : `No ${isCustomer ? 'customers' : 'suppliers'} yet`}
              </Text>
              <Text style={styles.emptyText}>
                {search ? 'Try a different name' : 'Tap the button below to add one'}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent }]}
        onPress={() => router.push({ pathname: '/add-party', params: { type } })}
      >
        <Ionicons name="person-add" size={22} color="#fff" />
        <Text style={styles.fabText}>{isCustomer ? 'ADD CUSTOMER' : 'ADD SUPPLIER'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#1a7f4b', paddingBottom: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8 },
  tab: { marginRight: 28, paddingVertical: 10 },
  tabText: { color: '#cfe9da', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  tabActive: { color: '#fff' },
  tabLine: { height: 3, backgroundColor: '#f5b83d', marginTop: 6, borderRadius: 2 },

  summaryCard: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12,
    borderRadius: 10, paddingVertical: 14,
  },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#e5e5e5' },
  summaryLabel: { fontSize: 15, color: '#444' },
  summaryAmount: { fontSize: 22, fontWeight: 'bold', marginTop: 4 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fafafa',
    margin: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 11, marginLeft: 10 },

  row: {
    flexDirection: 'row', alignItems: 'center', paddingLeft: 14,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f1f1',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#555' },
  name: { fontSize: 18, color: '#222' },
  ago: { fontSize: 14, color: '#777', marginTop: 2 },
  amountBox: {
    minWidth: 130, alignSelf: 'stretch', justifyContent: 'center',
    alignItems: 'flex-end', paddingHorizontal: 16, backgroundColor: '#f6f6f6',
  },
  getBg: { backgroundColor: '#fcefef' },
  amount: { fontSize: 18, color: '#666' },
  remind: { fontSize: 13, color: '#1a7f4b', fontWeight: '600', marginTop: 4 },

  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#444', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#888', marginTop: 4, textAlign: 'center' },

  fab: {
    position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingVertical: 15, borderRadius: 30, elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 5, shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10, letterSpacing: 1 },
});