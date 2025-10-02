// app/(tabs)/closet/index.js

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AddIcon from '../../../assets/icons/add.svg';

// 임시 옷 데이터
const clothesData = [
  { id: '1', name: '소라색 얇은 니트', category: '상의', image: 'https://via.placeholder.com/150' },
  { id: '2', name: '스트라이프 니트', category: '상의', image: 'https://via.placeholder.com/150' },
  { id: '3', name: '네이비 카라티', category: '상의', image: 'https://via.placeholder.com/150' },
  { id: '4', name: '회색 맨투맨', category: '상의', image: 'https://via.placeholder.com/150' },
  { id: '5', name: '블랙 슬랙스', category: '하의', image: 'https://via.placeholder.com/150' },
  { id: '6', name: '청바지', category: '하의', image: 'https://via.placeholder.com/150' },
];

export default function ClosetScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('상의');
  
  // 활성화된 카테고리에 맞는 옷만 필터링
  const filteredClothes = clothesData.filter(item => item.category === activeCategory);

  const handleAddPress = () => {
    Alert.alert(
      "새 옷 추가",
      "사진을 어떻게 가져올까요?",
      [
        { text: "사진 촬영", onPress: takePhoto },
        { text: "앨범에서 선택", onPress: pickImage },
        { text: "취소", style: "cancel" },
      ]
    );
  };

  // 카메라로 사진 찍기
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라를 사용하려면 권한을 허용해야 합니다.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      router.push({ pathname: '/closet/add', params: { imageUri: result.assets[0].uri } });
    }
  };

  // 앨범에서 사진 선택
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '앨범에 접근하려면 권한을 허용해야 합니다.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      router.push({ pathname: '/closet/add', params: { imageUri: result.assets[0].uri } });
    }
  };
  
  // 그리드 아이템 렌더링 함수
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => router.push(`/closet/${item.id}`)} // 상세 페이지로 이동
    >
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <Text style={styles.itemName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>옷장</Text>
      </View>

      {/* 카테고리 선택 탭 */}
      <View style={styles.categoryContainer}>
        {['상의', '하의', '아우터', '신발'].map(category => (
          <TouchableOpacity key={category} onPress={() => setActiveCategory(category)}>
            <Text 
              style={[
                styles.categoryText, 
                activeCategory === category && styles.activeCategoryText
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 옷 목록 그리드 */}
      <FlatList
        data={filteredClothes}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2} // 2열 그리드
        contentContainerStyle={styles.gridContainer}
      />

      {/* 옷 추가 버튼 */}
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/closet/add')}>
        <AddIcon width={32} height={32} fill="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    categoryContainer: { flexDirection: 'row', justifyContent: 'flex-start', gap: 20, paddingVertical: 15, paddingHorizontal: 20, },
    categoryText: { fontSize: 16, color: 'gray' },
    activeCategoryText: { color: 'green', fontWeight: 'bold' },
    gridContainer: { paddingHorizontal: 10 },
    itemContainer: { flex: 1, margin: 10, alignItems: 'center' },
    itemImage: { width: '100%', aspectRatio: 1, backgroundColor: '#f0f0f0', borderRadius: 10, marginBottom: 8, },
    itemName: { fontSize: 14, fontWeight: '500' },
    addButton: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: 'green', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
});