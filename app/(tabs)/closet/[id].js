// app/closet/[id].js

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 임시로 index.js의 데이터를 다시 사용합니다.
const clothesData = [
  { id: '1', name: '소라색 얇은 니트', category: '상의', method: '세탁기 사용 가능하지만, 울코스로 돌려야 합니다. 드라이클리닝 권장.' },
  // ... (다른 옷 데이터)
];

function ClothDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // URL에서 id 값을 가져옴
  const cloth = clothesData.find(item => item.id === id) || {};

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: '옷장-상세' }} />
      <ScrollView>
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder} />
          <TouchableOpacity style={styles.editIcon} onPress={() => router.push(`/closet/edit?id=${id}`)}>
            <Ionicons name="pencil" size={18} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>이름</Text>
            <Text style={styles.value}>{cloth.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>분류</Text>
            <Text style={styles.value}>{cloth.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>세탁법</Text>
            <Text style={styles.value} numberOfLines={3}>{cloth.method}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>착용/세탁 주기</Text>
            {/* 주기 그래프 등 추가될 공간 */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  imageContainer: { padding: 20, alignItems: 'center' },
  imagePlaceholder: {
    width: '90%',
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  editIcon: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    elevation: 5,
  },
  detailsContainer: { paddingHorizontal: 30 },
  detailRow: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: { fontSize: 14, color: 'gray', marginBottom: 8 },
  value: { fontSize: 16 },
});

export default ClothDetailScreen;