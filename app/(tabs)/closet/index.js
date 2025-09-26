// app/closet/index.js

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 가상의 옷 데이터 (Mock Data)
const clothesData = [
  { id: '1', name: '소라색 얇은 니트', category: '상의' },
  { id: '2', name: '스트라이프 니트', category: '상의' },
  { id: '3', name: '네이비 카라티', category: '상의' },
  { id: '4', name: '회색 맨투맨', category: '상의' },
  { id: '5', name: '블랙 슬랙스', category: '하의' },
  { id: '6', name: '청바지', category: '하의' },
];

function ClosetScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('상의');

  const filteredClothes = clothesData.filter(item => item.category === activeCategory);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => router.push(`/closet/${item.id}`)}>
      <View style={styles.itemImagePlaceholder} />
      <Text style={styles.itemName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>한태희의 옷장</Text>
      </View>

      {/* 카테고리 탭 */}
      <View style={styles.categoryContainer}>
        {['상의', '하의', '아우터', '악세사리'].map(cat => (
          <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)}>
            <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 옷 목록 그리드 */}
      <FlatList
        data={filteredClothes}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
      />
      
      {/* 옷 추가 버튼 */}
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  categoryText: { fontSize: 16, color: 'gray' },
  activeCategoryText: { color: 'green', fontWeight: 'bold' },
  gridContainer: { paddingHorizontal: 10 },
  itemContainer: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 8,
  },
  itemName: { fontSize: 14 },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});

export default ClosetScreen;