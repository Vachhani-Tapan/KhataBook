import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const icon = (name) => ({ color, size }) => (
  <Ionicons name={name} size={size} color={color} />
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1a7f4b',
        headerStyle: { backgroundColor: '#1a7f4b' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen name="parties" options={{ title: 'Parties', tabBarIcon: icon('people-outline') }} />
      <Tabs.Screen name="bills" options={{ title: 'Bills', tabBarIcon: icon('receipt-outline') }} />
      <Tabs.Screen name="items" options={{ title: 'Items', tabBarIcon: icon('cube-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('ellipsis-horizontal') }} />
    </Tabs>
  );
}