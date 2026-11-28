import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
];

export function getRange(period) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  if (period === 'week') {
    const day = (start.getDay() + 6) % 7; // Monday = 0
    start.setDate(start.getDate() - day);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 7);
  } else if (period === 'month') {
    start.setDate(1);
    end.setTime(new Date(start.getFullYear(), start.getMonth() + 1, 1).getTime());
  } else if (period === 'year') {
    start.setMonth(0, 1);
    end.setTime(new Date(start.getFullYear() + 1, 0, 1).getTime());
  }
  return { start, end };
}

const fmt = (d) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();

export default function ReportShell({ title, period, setPeriod, children }) {
  const [open, setOpen] = useState(false);
  const { start, end } = getRange(period);
  const lastDay = new Date(end.getTime() - 86400000);
  const label = PERIODS.find((p) => p.key === period).label;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title,
          headerStyle: { backgroundColor: '#1a7f4b' },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.periodBox} onPress={() => setOpen(true)}>
          <Text style={styles.periodText}>{label}</Text>
          <Ionicons name="chevron-down" size={18} color="#1a7f4b" />
        </TouchableOpacity>
        <View style={styles.dateBox}>
          <Text style={styles.dateLabel}>Start Date</Text>
          <Text style={styles.dateValue}>{fmt(start)}</Text>
        </View>
        <View style={styles.dateBox}>
          <Text style={styles.dateLabel}>End Date</Text>
          <Text style={styles.dateValue}>{fmt(lastDay)}</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>{children}</View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footBtn} onPress={() => Alert.alert('Coming soon', 'Download will be added later')}>
          <Text style={styles.footBig}>DOWNLOAD</Text>
          <Text style={styles.footSmall}>PDF, EXCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footBtn} onPress={() => Alert.alert('Coming soon', 'Share will be added later')}>
          <Text style={styles.footBig}>SHARE</Text>
          <Text style={styles.footSmall}>WHATSAPP & OTHERS</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={styles.option}
                onPress={() => { setPeriod(p.key); setOpen(false); }}
              >
                <Text style={[styles.optionText, p.key === period && styles.optionActive]}>{p.label}</Text>
                {p.key === period && <Ionicons name="checkmark" size={20} color="#1a7f4b" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export const reportStyles = StyleSheet.create({
  stats: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, marginBottom: 10 },
  stat: { flex: 1 },
  statLabel: { fontSize: 13, color: '#666' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#222', marginTop: 2 },
  card: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', marginBottom: 12 },
  cellLabel: { fontSize: 13, color: '#888' },
  cellValue: { fontSize: 17, color: '#222', marginTop: 2 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f1f3' },
  filterRow: { flexDirection: 'row', gap: 8, padding: 10 },
  periodBox: {
    flex: 1.1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 10,
  },
  periodText: { fontSize: 15, color: '#222' },
  dateBox: { flex: 1, backgroundColor: '#fff', borderRadius: 6, padding: 8 },
  dateLabel: { fontSize: 11, color: '#777' },
  dateValue: { fontSize: 13, color: '#222', marginTop: 2 },
  footer: { flexDirection: 'row', gap: 10, padding: 10, backgroundColor: '#fff' },
  footBtn: { flex: 1, backgroundColor: '#1a7f4b', borderRadius: 6, paddingVertical: 11, alignItems: 'center' },
  footBig: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  footSmall: { color: '#d8f0e3', fontSize: 11, marginTop: 1, letterSpacing: 1 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 30 },
  modalCard: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 16 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  optionText: { fontSize: 16, color: '#333' },
  optionActive: { color: '#1a7f4b', fontWeight: '600' },
});