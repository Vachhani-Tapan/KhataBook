import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import ReportShell, { reportStyles as s } from '../../components/ReportShell';
import { apiGet } from '../../api';

export default function LowStock() {
  const [period, setPeriod] = useState('today');
  const [items, setItems] = useState(null);

  useEffect(() => {
    apiGet('/items').then((d) => setItems(d.items)).catch(() => setItems([]));
  }, []);

  const low = (items || []).filter((i) => i.lowStockAlert > 0 && i.currentStock <= i.lowStockAlert);

  return (
    <ReportShell title="Low Stock Summary Report" period="today" setPeriod={() => {}} showPeriod={false}>
      {!items ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1a7f4b" />
      ) : (
        <ScrollView>
          <View style={s.stats}>
            <View style={s.stat}>
              <Text style={s.statLabel}>Low / Out of stock Items</Text>
              <Text style={s.statValue}>{low.length}</Text>
            </View>
          </View>

          {low.length === 0 && <Text style={s.empty}>No low stock items</Text>}

          {low.map((i) => (
            <View key={i._id} style={s.card}>
              <Text style={s.cardTitle}>{i.name}</Text>
              <View style={s.grid}>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>Current Stock</Text>
                  <Text style={[s.cellValue, { color: '#c0392b' }]}>{i.currentStock}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>Low Stock level</Text>
                  <Text style={s.cellValue}>{i.lowStockAlert}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </ReportShell>
  );
}