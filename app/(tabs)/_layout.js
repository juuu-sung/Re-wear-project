// app/(tabs)/_layout.js

import { Tabs } from 'expo-router';

// SVG 아이콘들을 불러옵니다.
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CalendarIcon from '../../assets/icons/calendar.svg';
import HomeIcon from '../../assets/icons/home.svg';
import ShirtIcon from '../../assets/icons/shirt.svg'; // 옷장 아이콘
import SyncGrayIcon from '../../assets/icons/sync-circle-gray.svg';
import SyncGreenIcon from '../../assets/icons/sync-circle-green.svg';


export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'green' }}>
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          headerShown: false,
          tabBarIcon: ({ color }) => <HomeIcon width={24} height={24} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="closet"
        options={{
          headerShown: false,
          title: '옷장',
          tabBarIcon: ({ color }) => <ShirtIcon width={24} height={24} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="recycle"
        options={{
          headerShown: false,
          title: '순환',
          tabBarIcon: ({ focused }) => 
            focused ? (
              <SyncGreenIcon width={24} height={24} />
            ) : (
              <SyncGrayIcon width={24} height={24} />
            ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '캘린더',
          headerShown: false,
          tabBarIcon: ({ color }) => <CalendarIcon width={24} height={24} fill={color} />,
        }}
      />
      <Tabs.Screen
        name="tree" // 👈 (tabs)/tree.js 파일
        options={{
          title: '나의 숲', // ✅ 2. 탭 이름 변경
          headerShown: false,
          tabBarIcon: ({ color }) => ( // ✅ 3. 탭 아이콘 설정
            <FontAwesome size={24} name="tree" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}