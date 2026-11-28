import { useCallback, useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image,
  ActivityIndicator, Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost, apiDelete } from '../../api';
import { removeToken } from '../../storage';
import { imageUrl } from '../../config';


const rupees = (paise) => {
  const value = paise / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

export default function Items() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'low'
  const [sort, setSort] = useState('name'); // 'name' | 'high' | 'low'
  const [sortModal, setSortModal] = useState(false);

  // Stock +IN / -OUT dialog
  const [stockDialog, setStockDialog] = useState(null); // { item, type }
  const [qty, setQty] = useState('');
  const [savingStock, setSavingStock] = useState(false);

  const loadItems = async () => {
    try {
      const data = await apiGet('/items');
      setItems(data.items);
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
      loadItems();
    }, [])
  );

  const isLow = (item) => item.lowStockAlert > 0 && item.currentStock <= item.lowStockAlert;

  const summary = useMemo(() => {
    const totalValue = items.reduce((sum, i) => sum + i.currentStock * i.purchasePrice, 0);
    const lowCount = items.filter(isLow).length;
    return { totalValue, lowCount };
  }, [items]);

  const visibleItems = useMemo(() => {
    const list = items.filter((i) => {
      if (filter === 'low' && !isLow(i)) return false;
      if (search.trim() && !i.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });

    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'high') list.sort((a, b) => b.currentStock - a.currentStock);
    else list.sort((a, b) => a.currentStock - b.currentStock);

    return list;
  }, [items, search, filter, sort]);

  const confirmDelete = (item) => {
    Alert.alert('Delete item', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDelete(`/items/${item._id}`);
            setItems((prev) => prev.filter((i) => i._id !== item._id));
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const openStockDialog = (item, type) => {
    setQty('');
    setStockDialog({ item, type });
  };

  const submitStock = async () => {
    try {
      setSavingStock(true);
      const { item: updated } = await apiPost(`/items/${stockDialog.item._id}/stock`, {
        type: stockDialog.type,
        quantity: qty,
      });
      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
      setStockDialog(null);
    } catch (error) {
      Alert.alert('Could not update stock', error.message);
    } finally {
      setSavingStock(false);
    }
  };

  const renderItem = ({ item }) => {
    const low = isLow(item);
    const photo = imageUrl(item.photo);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => router.push({ pathname: '/add-item', params: { id: item._id } })}
        onLongPress={() => confirmDelete(item)}
      >
        <View style={styles.cardTop}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <Ionicons name="image-outline" size={26} color="#bbb" />
            </View>
          )}
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          {low && (
            <View style={styles.lowBadge}>
              <Text style={styles.lowBadgeText}>Low Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.info}>
            <Text style={styles.infoLabel}>Sale Price (₹)</Text>
            <Text style={styles.infoValue}>₹ {rupees(item.salePrice)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.infoLabel}>Current Stock</Text>
            <Text style={[styles.infoValue, low && { color: '#c0392b' }]}>{item.currentStock}</Text>
          </View>
          <TouchableOpacity style={[styles.stockBtn, styles.inBtn]} onPress={() => openStockDialog(item, 'in')}>
            <Text style={[styles.stockBtnText, { color: '#1a7f4b' }]}>+ IN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.stockBtn, styles.outBtn]} onPress={() => openStockDialog(item, 'out')}>
            <Text style={[styles.stockBtnText, { color: '#c0392b' }]}>− OUT</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a7f4b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryWrap}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryBig}>₹ {rupees(summary.totalValue)}</Text>
            <Text style={styles.summarySmall}>Total Stock value</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCell}>
            <Text style={[styles.summaryBig, { color: '#c0392b' }]}>{summary.lowCount}</Text>
            <Text style={styles.summarySmall}>Low Stock Items</Text>
          </View>
          <View style={styles.summaryDivider} />
          <TouchableOpacity style={styles.summaryCell} onPress={() => router.push('/reports')}>
            <Text style={styles.reportsText}>VIEW{'\n'}REPORTS</Text>
            <Ionicons name="chevron-forward" size={18} color="#1a7f4b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search + Sort */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#1a7f4b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Items"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setSortModal(true)}>
          <Ionicons name="swap-vertical" size={22} color="#1a7f4b" />
          <Text style={styles.sortText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.chips}>
        <TouchableOpacity
          style={[styles.chip, filter === 'all' && styles.chipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>All Items</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, filter === 'low' && styles.chipActive]}
          onPress={() => setFilter('low')}
        >
          <Text style={[styles.chipText, filter === 'low' && styles.chipTextActive]}>Low Stock</Text>
          {summary.lowCount > 0 && <View style={styles.redDot} />}
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>MY ITEMS</Text>
        <Text style={styles.listHeaderText}>{items.length} ITEMS ADDED</Text>
      </View>

      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={visibleItems.length === 0 ? styles.emptyWrap : { paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadItems(); }}
            colors={['#1a7f4b']}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={64} color="#bbb" />
            <Text style={styles.emptyTitle}>
              {items.length === 0 ? 'No items yet' : 'No items found'}
            </Text>
            <Text style={styles.emptyText}>
              {items.length === 0
                ? 'Add your products to manage stock and billing'
                : 'Try a different search or filter'}
            </Text>
          </View>
        }
      />

      {/* Floating add button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-item')}>
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.fabText}>ADD PRODUCT</Text>
      </TouchableOpacity>

      {/* +IN / -OUT dialog */}
      <Modal visible={!!stockDialog} transparent animationType="fade" onRequestClose={() => setStockDialog(null)}>
        <KeyboardAvoidingView
          style={styles.modalBg}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {stockDialog?.type === 'in' ? 'Add stock' : 'Remove stock'}
            </Text>
            <Text style={styles.modalSub}>
              {stockDialog?.item.name} (now {stockDialog?.item.currentStock} {stockDialog?.item.unit})
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter quantity"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              autoFocus
              value={qty}
              onChangeText={setQty}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setStockDialog(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  { backgroundColor: stockDialog?.type === 'in' ? '#1a7f4b' : '#c0392b' },
                  (!qty || savingStock) && { opacity: 0.5 },
                ]}
                onPress={submitStock}
                disabled={!qty || savingStock}
              >
                {savingStock ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>{stockDialog?.type === 'in' ? 'ADD' : 'REMOVE'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Sort popup */}
      <Modal visible={sortModal} transparent animationType="fade" onRequestClose={() => setSortModal(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setSortModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sort by</Text>
            {[
              { key: 'name', label: 'Alphabetical (A to Z)' },
              { key: 'high', label: 'Stock: High to Low' },
              { key: 'low', label: 'Stock: Low to High' },
            ].map((o) => (
              <TouchableOpacity
                key={o.key}
                style={styles.sortOption}
                onPress={() => { setSort(o.key); setSortModal(false); }}
              >
                <Text style={[styles.sortOptionText, sort === o.key && styles.sortOptionActive]}>
                  {o.label}
                </Text>
                {sort === o.key && <Ionicons name="checkmark" size={20} color="#1a7f4b" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  summaryWrap: { backgroundColor: '#1a7f4b', paddingHorizontal: 12, paddingBottom: 14, paddingTop: 4 },
  summaryCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, paddingVertical: 14,
  },
  summaryCell: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: '#e5e5e5' },
  summaryBig: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  summarySmall: { fontSize: 13, color: '#777', marginTop: 2 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginTop: 12, gap: 10,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 6, borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 12,
  },
  sortBtn: { alignItems: 'center', paddingHorizontal: 4 },
  sortText: { fontSize: 12, color: '#1a7f4b', marginTop: 1 },
  reportsText: { fontSize: 14, color: '#1a7f4b', fontWeight: '600', textAlign: 'center' },
  sortOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14,
  },
  sortOptionText: { fontSize: 16, color: '#333' },
  sortOptionActive: { color: '#1a7f4b', fontWeight: '600' },

  chips: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff',
  },
  chipActive: { borderColor: '#1a7f4b', backgroundColor: '#e8f5ee' },
  chipText: { fontSize: 15, color: '#444' },
  chipTextActive: { color: '#1a7f4b', fontWeight: '600' },
  redDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#d32f2f', marginLeft: 6 },

  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12,
    paddingVertical: 10, backgroundColor: '#efefef',
  },
  listHeaderText: { fontSize: 13, color: '#666', letterSpacing: 0.5 },

  card: {
    backgroundColor: '#fff', padding: 14, marginBottom: 6,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 52, height: 64, borderRadius: 4, backgroundColor: '#eee' },
  thumbEmpty: { justifyContent: 'center', alignItems: 'center' },
  name: { flex: 1, fontSize: 18, color: '#222', marginLeft: 14 },
  lowBadge: {
    backgroundColor: '#fdecea', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4,
  },
  lowBadgeText: { color: '#d32f2f', fontWeight: '700', fontSize: 14 },

  cardBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  info: { flex: 1.1 },
  infoLabel: { fontSize: 12, color: '#888' },
  infoValue: { fontSize: 19, fontWeight: 'bold', color: '#222', marginTop: 3 },
  stockBtn: {
    flex: 0.9, paddingVertical: 11, borderRadius: 4, borderWidth: 1,
    alignItems: 'center', marginLeft: 8,
  },
  inBtn: { borderColor: '#1a7f4b' },
  outBtn: { borderColor: '#c0392b' },
  stockBtnText: { fontSize: 15, fontWeight: '700' },

  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#444', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#888', marginTop: 4, textAlign: 'center' },

  fab: {
    position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a7f4b', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 30,
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 5, shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8, letterSpacing: 0.5 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 19, fontWeight: '700', color: '#222' },
  modalSub: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 14 },
  modalInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12,
    paddingVertical: 12, fontSize: 18, backgroundColor: '#fafafa',
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalCancel: {
    flex: 1, paddingVertical: 13, borderRadius: 6, borderWidth: 1, borderColor: '#ccc', alignItems: 'center',
  },
  modalCancelText: { color: '#444', fontWeight: '600' },
  modalConfirm: { flex: 1, paddingVertical: 13, borderRadius: 6, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
});