import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Image, Alert, Modal, Switch, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiGet, apiPost, apiPut, apiUpload } from '../api';
import { imageUrl } from '../config';

const UNITS = [
  'Number', 'Pieces', 'Liter', 'Box', 'Cans', 'Dozens', 'Meters',
  'Packs', 'Pairs', 'Thousands', 'Tonnes', 'Unit', 'Quantity', 'Other',
];

const isServerPath = (p) => p && p.startsWith('/uploads');

export default function AddItem() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEdit = !!id;

  const [loadingItem, setLoadingItem] = useState(isEdit);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null); // local file uri OR server path
  const [unit, setUnit] = useState('Pieces');
  const [unitModal, setUnitModal] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [openingStock, setOpeningStock] = useState('');
  const [lowStock, setLowStock] = useState('');

  useEffect(() => {
    if (!isEdit) return;

    const loadItem = async () => {
      try {
        const { item } = await apiGet(`/items/${id}`);
        setName(item.name);
        setPhoto(item.photo || null);
        setUnit(item.unit);
        setSalePrice(item.salePrice ? String(item.salePrice / 100) : '');
        setPurchasePrice(item.purchasePrice ? String(item.purchasePrice / 100) : '');
        setTaxIncluded(item.taxIncluded);
        setOpeningStock(item.openingStock ? String(item.openingStock) : '');
        setLowStock(item.lowStockAlert ? String(item.lowStockAlert) : '');
      } catch (error) {
        Alert.alert('Error', error.message);
        router.back();
      } finally {
        setLoadingItem(false);
      }
    };

    loadItem();
  }, [id]);

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow gallery access to add a photo');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) {
      console.log('PICKED:', result.assets[0].uri, result.assets[0].mimeType);
      setPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow camera access to take a photo');
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) {
      console.log('PICKED:', result.assets[0].uri, result.assets[0].mimeType);
      setPhoto(result.assets[0].uri);
    }
  };

  const handlePhoto = () => {
    const buttons = [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Gallery', onPress: pickFromGallery },
    ];
    if (photo) buttons.push({ text: 'Remove photo', style: 'destructive', onPress: () => setPhoto(null) });
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Item photo', 'Choose an option', buttons);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Upload only if the photo is a newly picked local file
      let photoPath = '';
      if (photo) {
        photoPath = isServerPath(photo) ? photo : (await apiUpload('/upload', photo)).url;
      }

      const body = {
        name: name.trim(),
        unit,
        photo: photoPath,
        salePrice,
        purchasePrice,
        taxIncluded,
        openingStock,
        lowStockAlert: lowStock,
      };

      if (isEdit) await apiPut(`/items/${id}`, body);
      else await apiPost('/items', body);

      router.back();
    } catch (error) {
      Alert.alert('Could not save item', error.message);
    } finally {
      setLoading(false);
    }
  };

  const canSave = name.trim().length > 0;
  const photoSource = photo ? (isServerPath(photo) ? imageUrl(photo) : photo) : null;

  if (loadingItem) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a7f4b" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEdit ? 'Edit Item' : 'Add Item',
          headerStyle: { backgroundColor: '#1a7f4b' },
          headerTintColor: '#fff',
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled">
          <View style={[styles.section, styles.nameRow]}>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter item name here *"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
            <TouchableOpacity style={styles.photoBox} onPress={handlePhoto}>
              {photoSource ? (
                <Image source={{ uri: photoSource }} style={styles.photoImage} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={28} color="#aaa" />
                  <Text style={styles.photoText}>Photo</Text>
                </>
              )}
              <View style={styles.plusBadge}>
                <Ionicons name={photoSource ? 'pencil' : 'add'} size={12} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Primary Unit</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setUnitModal(true)}>
              <Text style={styles.dropdownText}>{unit}</Text>
              <Ionicons name="chevron-down" size={20} color="#1a7f4b" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.twoCol}>
              <View style={styles.col}>
                <Text style={styles.label}>Sale Price</Text>
                <View style={styles.inputRow}>
                  <Text style={[styles.rupee, { color: '#1a7f4b' }]}>₹</Text>
                  <TextInput
                    style={styles.rowInput}
                    placeholder="Enter price"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={salePrice}
                    onChangeText={setSalePrice}
                  />
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Purchase Price</Text>
                <View style={styles.inputRow}>
                  <Text style={[styles.rupee, { color: '#c0392b' }]}>₹</Text>
                  <TextInput
                    style={styles.rowInput}
                    placeholder="Enter price"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={purchasePrice}
                    onChangeText={setPurchasePrice}
                  />
                </View>
              </View>
            </View>

            <View style={styles.taxRow}>
              <Text style={styles.taxText}>Tax included</Text>
              <Switch
                value={taxIncluded}
                onValueChange={setTaxIncluded}
                trackColor={{ true: '#7ed3a4', false: '#ccc' }}
                thumbColor={taxIncluded ? '#1a7f4b' : '#f4f4f4'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.twoCol}>
              <View style={styles.col}>
                <Text style={styles.label}>Opening Stock</Text>
                <TextInput
                  style={styles.box}
                  placeholder="Enter count"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={openingStock}
                  onChangeText={setOpeningStock}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Low Stock Alert</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.rowInput}
                    placeholder="Enter count"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                    value={lowStock}
                    onChangeText={setLowStock}
                  />
                  <Ionicons name="notifications-outline" size={20} color="#1a7f4b" />
                </View>
              </View>
            </View>

            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>As of date </Text>
              <Text style={styles.dateValue}>Today</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, (!canSave || loading) && styles.saveDisabled]}
            onPress={handleSave}
            disabled={!canSave || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>{isEdit ? 'UPDATE ITEM' : 'SAVE ITEM'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={unitModal} transparent animationType="fade" onRequestClose={() => setUnitModal(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setUnitModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Unit</Text>
            <ScrollView>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={styles.unitItem}
                  onPress={() => { setUnit(u); setUnitModal(false); }}
                >
                  <Text style={[styles.unitText, u === unit && styles.unitActive]}>{u}</Text>
                  {u === unit && <Ionicons name="checkmark" size={20} color="#1a7f4b" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f2f2f2' },
  section: { backgroundColor: '#fff', padding: 16, marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  nameInput: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 14, fontSize: 16, backgroundColor: '#fafafa',
  },
  photoBox: {
    width: 84, height: 84, marginLeft: 14, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 6, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center',
  },
  photoImage: { width: '100%', height: '100%', borderRadius: 6 },
  photoText: { color: '#1a7f4b', fontSize: 14, marginTop: 2 },
  plusBadge: {
    position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#1a7f4b', justifyContent: 'center', alignItems: 'center',
  },
  label: { fontSize: 15, color: '#444', marginBottom: 8 },
  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12,
    paddingVertical: 14, backgroundColor: '#fafafa',
  },
  dropdownText: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  twoCol: { flexDirection: 'row', gap: 14 },
  col: { flex: 1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 6, paddingHorizontal: 12, backgroundColor: '#fafafa',
  },
  rupee: { fontSize: 18, marginRight: 6 },
  rowInput: { flex: 1, fontSize: 16, paddingVertical: 14 },
  box: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12,
    paddingVertical: 14, fontSize: 16, backgroundColor: '#fafafa',
  },
  taxRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f5f5f5', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, marginTop: 14,
  },
  taxText: { fontSize: 14, color: '#333' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  dateLabel: { fontSize: 15, color: '#333' },
  dateValue: { fontSize: 15, color: '#1a7f4b', fontWeight: '600' },
  footer: { padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  saveButton: { backgroundColor: '#1a7f4b', padding: 16, borderRadius: 6 },
  saveDisabled: { backgroundColor: '#c8c8c8' },
  saveText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 10, maxHeight: '70%', paddingVertical: 8 },
  modalTitle: { fontSize: 18, fontWeight: '600', padding: 16, color: '#222' },
  unitItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  unitText: { fontSize: 16, color: '#333' },
  unitActive: { color: '#1a7f4b', fontWeight: '600' },
});