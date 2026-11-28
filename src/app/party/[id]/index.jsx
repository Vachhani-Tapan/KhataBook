import { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { apiGet, apiPost, apiDelete } from '../../../api';

const rupees = (paise) => {
  const v = Math.abs(paise) / 100;
  return `₹ ${v.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2 })}`;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

export default function PartyDetail() {
  const { id } = useLocalSearchParams();
  const [party, setParty] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialog, setDialog] = useState(null); // 'gave' | 'got'
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await apiGet(`/parties/${id}/transactions`);
      setParty(data.party);
      setTransactions(data.transactions);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [id]));

  const openDialog = (type) => {
    setAmount('');
    setNote('');
    setDialog(type);
  };

  const submit = async () => {
    try {
      setSaving(true);
      const data = await apiPost(`/parties/${id}/transactions`, {
        type: dialog, amount, note: note.trim(),
      });
      setParty(data.party);
      setTransactions((prev) => [data.transaction, ...prev]);
      setDialog(null);
    } catch (error) {
      Alert.alert('Could not save', error.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (tx) => {
    Alert.alert('Delete entry', `Delete this ${rupees(tx.amount)} entry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const data = await apiDelete(`/parties/${id}/transactions/${tx._id}`);
            setParty(data.party);
            setTransactions((prev) => prev.filter((t) => t._id !== tx._id));
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  if (loading || !party) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerShown: true, title: '' }} />
        <ActivityIndicator size="large" color="#1a7f4b" />
      </View>
    );
  }

  const get = party.balance > 0;
  const give = party.balance < 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: party.name,
          headerStyle: { backgroundColor: '#1a7f4b' },
          headerTintColor: '#fff',
        }}
      />

      {/* Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>
          {get ? 'You will get' : give ? 'You will give' : 'Settled up'}
        </Text>
        <Text style={[styles.balanceAmount, get && { color: '#a50f1f' }, give && { color: '#1a7f4b' }]}>
          {rupees(party.balance)}
        </Text>
        {!!party.phone && <Text style={styles.phone}>+91 {party.phone}</Text>}
      </View>

      {/* Column headers */}
      <View style={styles.colHeader}>
        <Text style={[styles.colText, { flex: 1 }]}>ENTRIES</Text>
        <Text style={[styles.colText, styles.colAmt]}>YOU GAVE</Text>
        <Text style={[styles.colText, styles.colAmt]}>YOU GOT</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(t) => t._id}
        contentContainerStyle={transactions.length === 0 ? styles.emptyWrap : { paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No entries yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.txRow} onLongPress={() => confirmDelete(item)} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDate}>{fmtDate(item.date)}</Text>
              {!!item.note && <Text style={styles.txNote} numberOfLines={2}>{item.note}</Text>}
            </View>
            <View style={[styles.colAmt, item.type === 'gave' && styles.gaveBg]}>
              {item.type === 'gave' && <Text style={[styles.txAmt, { color: '#a50f1f' }]}>{rupees(item.amount)}</Text>}
            </View>
            <View style={[styles.colAmt, item.type === 'got' && styles.gotBg]}>
              {item.type === 'got' && <Text style={[styles.txAmt, { color: '#1a7f4b' }]}>{rupees(item.amount)}</Text>}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#c0392b' }]} onPress={() => openDialog('gave')}>
          <Text style={styles.btnText}>YOU GAVE ₹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#1a7f4b' }]} onPress={() => openDialog('got')}>
          <Text style={styles.btnText}>YOU GOT ₹</Text>
        </TouchableOpacity>
      </View>

      {/* Entry dialog */}
      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => setDialog(null)}>
        <KeyboardAvoidingView
          style={styles.modalBg}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {dialog === 'gave' ? 'You gave' : 'You got'} {party.name}
            </Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Amount"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                autoFocus
                value={amount}
                onChangeText={setAmount}
              />
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a note (optional)"
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancel} onPress={() => setDialog(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirm,
                  { backgroundColor: dialog === 'gave' ? '#c0392b' : '#1a7f4b' },
                  (!amount || saving) && { opacity: 0.5 },
                ]}
                onPress={submit}
                disabled={!amount || saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>SAVE</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  balanceCard: { backgroundColor: '#fff', padding: 18, alignItems: 'center', marginBottom: 8 },
  balanceLabel: { fontSize: 15, color: '#666' },
  balanceAmount: { fontSize: 30, fontWeight: 'bold', color: '#444', marginTop: 4 },
  phone: { fontSize: 14, color: '#888', marginTop: 6 },

  colHeader: {
    flexDirection: 'row', backgroundColor: '#ececec', paddingLeft: 14, paddingVertical: 8,
  },
  colText: { fontSize: 12, color: '#666', letterSpacing: 0.5 },
  colAmt: { width: 105, alignItems: 'flex-end', paddingRight: 12, textAlign: 'right' },

  txRow: {
    flexDirection: 'row', backgroundColor: '#fff', paddingLeft: 14,
    borderBottomWidth: 1, borderBottomColor: '#eee', minHeight: 58,
  },
  txDate: { fontSize: 14, color: '#444', marginTop: 10 },
  txNote: { fontSize: 13, color: '#888', marginTop: 2, marginBottom: 8 },
  gaveBg: { backgroundColor: '#fcefef', justifyContent: 'center' },
  gotBg: { backgroundColor: '#eaf6ef', justifyContent: 'center' },
  txAmt: { fontSize: 16, fontWeight: '600' },

  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#888', fontSize: 15 },

  footer: { flexDirection: 'row', gap: 10, padding: 10, backgroundColor: '#fff' },
  btn: { flex: 1, paddingVertical: 15, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 14 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 6, paddingHorizontal: 12, backgroundColor: '#fafafa',
  },
  rupee: { fontSize: 22, color: '#444', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 22, paddingVertical: 12 },
  noteInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12,
    paddingVertical: 12, fontSize: 16, backgroundColor: '#fafafa', marginTop: 12,
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancel: { flex: 1, paddingVertical: 13, borderRadius: 6, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  cancelText: { color: '#444', fontWeight: '600' },
  confirm: { flex: 1, paddingVertical: 13, borderRadius: 6, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
});