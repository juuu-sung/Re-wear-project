// app/reform.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native';

import StarIcon from '../assets/icons/star.svg';
import ContentList from './components/ui/ContentList';

// 임시 리폼 데이터
const MOCK_REFORM_DATA = [
  { id: 'r1', title: '늘어난 목 되돌리기', author: 'Re:wear', thumbnail_url: 'https://placehold.co/60x60/2e7d32/white?text=Neck' },
  { id: 'r2', title: '청바지 워싱 직접 하기', author: '리폼장인', thumbnail_url: 'https://placehold.co/60x60/2e7d32/white?text=Washing' },
];
// (즐겨찾기 저장용 고유 키)
const FAVORITES_KEY = '@reform_favorites';

export default function ReformScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const loadFavorites = async () => {
      const saved = await AsyncStorage.getItem(FAVORITES_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    };
    loadFavorites();
  }, []);

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
      {/* --- 헤더 설정 (즐겨찾기 버튼 추가) --- */}
      <Stack.Screen
        options={{
          title: '리폼',
          headerRight: () => (
            <TouchableOpacity
              sytle={{ marginRight: 15 }}
              onPress={() => router.push({ pathname: '/favorites', params: { type: 'reform' } })}>
              <StarIcon width={24} height={24} fill="#FFD700" />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* --- 콘텐츠 리스트 --- */}
      <ContentList
        items={MOCK_REFORM_DATA}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
});