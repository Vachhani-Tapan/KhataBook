import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const REPORTS = [
  { title: 'Stock Summary', sub: 'Stock and value of every item', icon: 'cube-outline', path: '/reports/stock-summary' },
  { title: 'Low Stock Summary Report', sub: 'Items running low or out of stock', icon: 'alert-circle-outline', path: '/reports/low-stock' },
  { title: 'Profit & Loss Report', sub: 'Sales and profit by item', icon: 'trending-up-outline', path: '/reports/profit-loss' },
];

export default function Reports() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Reports',
          headerStyle: { backgroundColor: '#1a7f4b' },
          headerTintColor: '#fff',
        }}
      />
      <View style={styles.container}>
        {REPORTS.map((r) => (
          <TouchableOpacity key={r.path} style={styles.card} onPress={() => router.push(r.path)}>
            <View style={styles.iconBox}>
              <Ionicons name={r.icon} size={24} color="#1a7f4b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{r.title}</Text>
              <Text style={styles.sub}>{r.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', padding: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, borderRadius: 8, marginBottom: 10,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#e8f5ee',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#222' },
  sub: { fontSize: 13, color: '#777', marginTop: 2 },
});