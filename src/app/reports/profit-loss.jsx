import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import ReportShell, { reportStyles as s } from '../../components/ReportShell';

export default function ProfitLoss() {
  const [period, setPeriod] = useState('today');
  const rows = []; // filled from bills later: { name, qty, sales, profit }

  const totalSales = rows.reduce((a, r) => a + r.sales, 0);
  const totalProfit = rows.reduce((a, r) => a + r.profit, 0);
  const totalQty = rows.reduce((a, r) => a + r.qty, 0);

  return (
    <ReportShell title="Profit & Loss Report" period={period} setPeriod={setPeriod}>
      <ScrollView>
        <View style={s.stats}>
          <View style={s.stat}>
            <Text style={s.statLabel}>Total Sales</Text>
            <Text style={s.statValue}>₹ {totalSales}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Total Profit</Text>
            <Text style={s.statValue}>₹ {totalProfit}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Total Sales Qty</Text>
            <Text style={s.statValue}>{totalQty.toFixed(1)}</Text>
          </View>
        </View>

        {rows.length === 0 && <Text style={s.empty}>No sales in this period</Text>}

        {rows.map((r) => (
          <View key={r.name} style={s.card}>
            <Text style={s.cardTitle}>{r.name}</Text>
            <View style={s.grid}>
              <View style={s.cell}>
                <Text style={s.cellLabel}>Sales qty in time period</Text>
                <Text style={s.cellValue}>{r.qty.toFixed(1)}</Text>
              </View>
              <View style={s.cell}>
                <Text style={s.cellLabel}>Net Sales in time period</Text>
                <Text style={s.cellValue}>₹ {r.sales}</Text>
              </View>
              <View style={s.cell}>
                <Text style={s.cellLabel}>Net profit in time period</Text>
                <Text style={s.cellValue}>₹ {r.profit}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </ReportShell>
  );
}