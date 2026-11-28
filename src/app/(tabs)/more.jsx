import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { removeToken } from '../../storage';

export default function More() {
  const router = useRouter();

  const handleLogout = async () => {
    await removeToken();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>REPORTS</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/reports')}>
          <Ionicons name="bar-chart-outline" size={22} color="#1a7f4b" />
          <Text style={styles.rowText}>Reports</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { marginTop: 24 }]}>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#c0392b" />
          <Text style={[styles.rowText, { color: '#c0392b' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  sectionTitle: { fontSize: 13, color: '#777', letterSpacing: 0.5, margin: 16, marginBottom: 8 },
  section: { backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowText: { flex: 1, fontSize: 16, color: '#222', marginLeft: 14 },
});