import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import ReportShell, { reportStyles as s, getRange } from '../../components/ReportShell';
import { apiGet } from '../../api';

const rs = (paise) => {
  const v = paise / 100;
  return `₹ ${Number.isInteger(v) ? v : v.toFixed(2)}`;
};

export default function StockSummary() {
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);

    const { start, end } = getRange(period);
    apiGet(`/reports/stock-summary?start=${start.toISOString()}&end=${end.toISOString()}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => {
        if (!cancelled) {
          Alert.alert('Error', e.message);
          setData({ rows: [], totalItems: 0, totalStock: 0 });
        }
      });

    return () => { cancelled = true; };
  }, [period]);

  return (
    <ReportShell title="Stock Summary" period={period} setPeriod={setPeriod}>
      {!data ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1a7f4b" />
      ) : (
        <ScrollView>
          <View style={s.stats}>
            <View style={s.stat}>
              <Text style={s.statLabel}>Total Items</Text>
              <Text style={s.statValue}>{data.totalItems}</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statLabel}>Closing Stock Count</Text>
              <Text style={s.statValue}>{data.totalStock}</Text>
            </View>
          </View>

          {data.rows.length === 0 && <Text style={s.empty}>No items in this period</Text>}

          {data.rows.map((i) => (
            <View key={i._id} style={s.card}>
              <Text style={s.cardTitle}>{i.name}</Text>
              <View style={s.grid}>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>Opening Stock</Text>
                  <Text style={s.cellValue}>{i.opening}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>Closing Stock</Text>
                  <Text style={s.cellValue}>{i.closing}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>Stock In</Text>
                  <Text style={[s.cellValue, { color: '#1a7f4b' }]}>{i.stockIn}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>Stock Out</Text>
                  <Text style={[s.cellValue, { color: '#c0392b' }]}>{i.stockOut}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>Value (on Sale Price)</Text>
                  <Text style={s.cellValue}>{rs(i.valueOnSale)}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellLabel}>Value (on Purchase Price)</Text>
                  <Text style={s.cellValue}>{rs(i.valueOnPurchase)}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </ReportShell>
  );
}