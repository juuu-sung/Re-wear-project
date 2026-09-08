import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ContentList from './components/ui/ContentList';

 
const MOCK_UPCYCLING_DATA = [
  { id: 'u1', title: '청바지로 에코백 만들기', author: 'Re:wear', thumbnail_url: 'https://placehold.co/60x60/2e7d32/white?text=EcoBag' },
  { id: 'u2', title: '남는 천으로 컵받침 만들기', author: '슬로우패션', thumbnail_url: 'https://placehold.co/60x60/2e7d32/white?text=Coaster' },
  { id: 'u3', title: '헌 와이셔츠로 파우치 제작', author: '금손', thumbnail_url: 'https://placehold.co/60x60/2e7d32/white?text=Pouch' },
];
const MOCK_REFORM_DATA = [
  { id: 'r1', title: '늘어난 목 되돌리기', author: 'Re:wear', thumbnail_url: 'https://placehold.co/60x60/2e7d32/white?text=Neck' },
  { id: 'r2', title: '청바지 워싱 직접 하기', author: '리폼장인', thumbnail_url: 'https://placehold.co/60x60/2e7d32/white?text=Washing' },
];

const FAVORITES_KEYS = {
  upcycling: '@upcycling_favorites',
  reform: '@reform_favorites',
};
const ALL_DATA = {
  upcycling: MOCK_UPCYCLING_DATA,
  reform: MOCK_REFORM_DATA,
};

export default function FavoritesScreen() {
  const { type } = useLocalSearchParams();  
  const [items, setItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  
  const title = type === 'upcycling' ? '업사이클링 즐겨찾기' : '리폼 즐겨찾기';
  const data = ALL_DATA[type] || [];
  const key = FAVORITES_KEYS[type];

   
  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        const saved = await AsyncStorage.getItem(key);
        const favIds = saved ? JSON.parse(saved) : [];
        setFavorites(favIds);
        
         
        const favoritedItems = data.filter(item => favIds.includes(item.id));
        setItems(favoritedItems);
      };
      loadFavorites();
    }, [key, data])
  );

   
  const toggleFavorite = async (id) => {
    let newFavorites;
    if (favorites.includes(id)) {
      newFavorites = favorites.filter((favId) => favId !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    setFavorites(newFavorites);
    await AsyncStorage.setItem(key, JSON.stringify(newFavorites));
    
     
    const favoritedItems = data.filter(item => newFavorites.includes(item.id));
    setItems(favoritedItems);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: title }} />
      {items.length > 0 ? (
        <ContentList
          items={items}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>즐겨찾기한 항목이 없습니다.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: 'gray' },
});