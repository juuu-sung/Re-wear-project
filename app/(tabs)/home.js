// app/(tabs)/index.js

import { useRouter } from 'expo-router';
import { FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 아이콘들을 불러옵니다.
import AddIcon from '../../assets/icons/add.svg';
import CameraIcon from '../../assets/icons/camera-outline.svg';
import CheckboxIcon from '../../assets/icons/checkbox-outline.svg';
import ProfileIcon from '../../assets/icons/person-circle-outline.svg';

// 옷장 페이지에 있던 임시 옷 데이터 (최근 추가된 3개만 잘라서 사용)
const clothesData = [
  { id: '6', name: '청바지', category: '하의', image: 'https://image.msscdn.net/images/goods_img/20220818/2722137/2722137_1_500.jpg' },
  { id: '5', name: '블랙 슬랙스', category: '하의', image: 'https://image.msscdn.net/images/goods_img/20230321/3163339/3163339_16934661858567_500.jpg' },
  { id: '4', name: '회색 맨투맨', category: '상의', image: 'https://image.msscdn.net/images/goods_img/20210823/2072120/2072120_1_500.jpg' },
].reverse(); // 최신순으로 보이게 배열을 뒤집습니다.

export default function HomeScreen() {
  const router = useRouter();

  const goToProfile = () => {
    router.push('/profile');
  };

  // 미니 옷장 아이템 렌더링 함수
  const renderClosetItem = ({ item }) => {
    if (item.type === 'add') {
      return (
        <TouchableOpacity style={styles.addItemContainer} onPress={() => router.push('/closet')}>
          <AddIcon width={40} height={40} fill="gray" />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={styles.closetItem} onPress={() => router.push(`/closet/${item.id}`)}>
        <Image source={{ uri: item.image }} style={styles.closetItemImage} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 1. 상단 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Re:wear</Text>
          <TouchableOpacity onPress={goToProfile}>
            <ProfileIcon width={32} height={32} fill="black" />
          </TouchableOpacity>
        </View>

        {/* 2. 오늘의 알림 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>오늘의 알림</Text>
          <Text>오늘은 청바지를 세탁할 차례입니다!</Text>
        </View>
        
        {/* 3. 케어라벨 검색 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>케어라벨 검색</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton}>
              <CameraIcon width={24} height={24} />
              <Text style={styles.primaryButtonText}>라벨 촬영하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <CheckboxIcon width={24} height={24} stroke="#333" />
              <Text style={styles.secondaryButtonText}>직접 선택하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- 4. 미니 옷장 섹션 (새로 추가) --- */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>옷을 추가해 보세요!</Text>
            <FlatList
              data={[...clothesData, { type: 'add' }]} // 기존 옷 데이터에 '추가' 버튼용 데이터를 합칩니다.
              renderItem={renderClosetItem}
              keyExtractor={(item, index) => item.id || `add-${index}`}
              horizontal // 가로 스크롤
              showsHorizontalScrollIndicator={false} // 스크롤바 숨기기
              contentContainerStyle={{ gap: 15 }}
            />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 스타일 코드
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4a4a4a',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#e9e9e9',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // --- 미니 옷장 스타일 (새로 추가) ---
  closetItem: {
    width: 100,
    height: 100,
  },
  closetItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  addItemContainer: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
});