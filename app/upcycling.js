// app/upcycling.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';

// ✅ SVG 아이콘 import
import StarIcon from '../assets/icons/star.svg';

// ✅ 방금 만든 리스트 컴포넌트 import
import ContentList from './components/ui/ContentList';

// 임시 업사이클링 데이터 (나중에 백엔드에서 가져옴)
const MOCK_UPCYCLING_DATA = [
  { id: 'u1', title: '청바지로 에코백 만들기', author: 'Re:wear', thumbnail_url: 'https://placehold.co/60x60/2e7d32/white?text=EcoBag' },
  { id: 'u2', title: '남는 천으로 컵받침 만들기', author: '슬로우패션', thumbnail_url: 'https://placehold.co/60x60/2e7d32/white?text=Coaster' },
  { id: 'u3', title: '헌 와이셔츠로 파우치 제작', author: '금손', thumbnail_url: 'https://placehold.co/60x60/2e7d32/white?text=Pouch' },
];
// (즐겨찾기 저장용 고유 키)
const FAVORITES_KEY = '@upcycling_favorites';

export default function UpcyclingScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);

  // 1. 앱이 켜질 때 저장된 즐겨찾기 목록 불러오기
  useEffect(() => {
    const loadFavorites = async () => {
      const saved = await AsyncStorage.getItem(FAVORITES_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    };
    loadFavorites();
  }, []);

  // 2. 즐겨찾기 토글 함수
  const toggleFavorite = async (id) => {
    let newFavorites;
    if (favorites.includes(id)) {
      newFavorites = favorites.filter((favId) => favId !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    setFavorites(newFavorites);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- 3. 헤더 설정 (즐겨찾기 버튼 추가) --- */}
      <Stack.Screen
        options={{
          title: '업사이클링',
          headerRight: () => (
            <TouchableOpacity
              sytle={{ marginRight: 15}}
              onPress={() => router.push({ pathname: '/favorites', params: { type: 'upcycling' } })}>
              <StarIcon width={24} height={24} fill="#FFD700"/>
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* --- 4. 콘텐츠 리스트 --- */}
      <ContentList
        items={MOCK_UPCYCLING_DATA}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
});