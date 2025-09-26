// app/(tabs)/_layout.js

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'green',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="closet"
        options={{
          // 이 옵션이 closet 폴더의 자체 _layout.js를 사용하게 만듭니다.
          headerShown: false,
          title: 'Closet',
          tabBarIcon: ({ color }) => <Ionicons name="shirt" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}