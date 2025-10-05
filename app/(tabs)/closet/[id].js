// app/(tabs)/closet/[id].js

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import PencilIcon from '../../../assets/icons/pencil.svg';

// 옷장 목록과 동일한 데이터를 사용해야 합니다. (나중에는 DB에서 가져옵니다)
const clothesData = [
  { id: '1', name: '소라색 얇은 니트', category: '상의', image: require('../../../assets/clothes/sora_knit.jpg'), method: '드라이클리닝 권장, 찬물 손세탁 가능' },
  { id: '2', name: '스트라이프 니트', category: '상의', image: require('../../../assets/clothes/stripe_knit.jpg'), method: '세탁기 사용 가능 (울코스)' },
  { id: '3', name: '네이비 카라티', category: '상의', image: require('../../../assets/clothes/navy_t.jpg'), method: '찬물 단독 세탁' },
  { id: '4', name: '회색 맨투맨', category: '상의', image: require('../../../assets/clothes/gray_mtm.jpg'), method: '세탁기 사용 가능' },
  { id: '5', name: '블랙 슬랙스', category: '하의', image: require('../../../assets/clothes/slacks.jpg'), method: '드라이클리닝' },
  { id: '6', name: '청바지', category: '하의', image: require('../../../assets/clothes/jeans.jpg'), method: '찬물 세탁, 뒤집어서 세탁' },
];

export default function ClothDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // URL에서 id 가져오기
  
  // id에 맞는 옷 데이터 찾기
  const cloth = clothesData.find(item => item.id === id);

  if (!cloth) {
    return (
      <View style={styles.container}>
        <Text>옷 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 옷 이미지와 수정 버튼 */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: cloth.image }} style={styles.image} />
          <TouchableOpacity 
            style={styles.editIcon} 
            onPress={() => router.push(`/closet/edit?id=${id}`)} // 수정 페이지로 id와 함께 이동
          >
            <PencilIcon width={20} height={20} stroke="#333" />
          </TouchableOpacity>
        </View>

        {/* 옷 상세 정보 */}
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
            <Text style={styles.value}>{cloth.method}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  imageContainer: { alignItems: 'center', marginVertical: 20 },
  image: { width: '90%', aspectRatio: 1, borderRadius: 15 },
  editIcon: { position: 'absolute', bottom: 15, right: 30, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 20, padding: 10, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  detailsContainer: { paddingHorizontal: 30, marginTop: 10 },
  detailRow: { marginBottom: 25 },
  label: { fontSize: 14, color: 'gray', marginBottom: 8 },
  value: { fontSize: 20, fontWeight: '500' },
});