// app/(tabs)/index.js

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 아이콘들을 불러옵니다.
import AddIcon from '../../assets/icons/add.svg'; // + 아이콘 추가
import CameraIcon from '../../assets/icons/camera-outline.svg';
import CheckboxIcon from '../../assets/icons/checkbox-outline.svg';
import ProfileIcon from '../../assets/icons/person-circle-outline.svg';

// 임시 옷 데이터
const clothesData = [
  { id: '6', name: '청바지', category: '하의', image: 'https://image.msscdn.net/images/goods_img/20220818/2722137/2722137_1_500.jpg' },
  { id: '5', name: '블랙 슬랙스', category: '하의', image: 'https://image.msscdn.net/images/goods_img/20230321/3163339/3163339_16934661858567_500.jpg' },
  { id: '4', name: '회색 맨투맨', category: '상의', image: 'https://image.msscdn.net/images/goods_img/20210823/2072120/2072120_1_500.jpg' },
  { id: '3', name: '네이비 카라티', category: '상의', image: 'https://image.msscdn.net/images/goods_img/20220927/2821408/2821408_1_500.jpg' },
];


export default function HomeScreen() {
  const router = useRouter();

  // 1. 미니 옷장 데이터 가공: 최근 옷 3개와 '추가 버튼' 데이터를 합칩니다.
  const miniClosetData = [
    ...clothesData.slice(0, 3), 
    { id: 'add_button', isAddButton: true }
  ];

  const goToProfile = () => {
    router.push('/profile');
  };

  const handleLabelScanPress = () => {
    Alert.alert(
      "케어라벨 스캔",
      "라벨을 어떻게 가져올까요?",
      [
        { text: "사진 촬영", onPress: takePhoto },
        { text: "앨범에서 선택", onPress: pickImage },
        { text: "취소", style: "cancel" },
      ]
    );
  };

  const takePhoto = async () => {
    // ... (이전과 동일한 내용)
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라를 사용하려면 권한을 허용해야 합니다.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });
    if (!result.canceled) {
      console.log('촬영한 라벨 이미지 URI:', result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    // ... (이전과 동일한 내용)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '앨범에 접근하려면 권한을 허용해야 합니다.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 });
    if (!result.canceled) {
      console.log('선택한 라벨 이미지 URI:', result.assets[0].uri);
    }
  };
  
  // 2. 렌더링 함수 수정: '추가 버튼'일 경우 다른 UI를 보여줍니다.
  const renderClosetItem = ({ item }) => {
    if (item.isAddButton) {
      return (
        <TouchableOpacity style={styles.addItemButton} onPress={handleLabelScanPress}>
          <AddIcon width={40} height={40} fill="#888" />
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
        {/* ... (헤더, 알림 카드, 케어라벨 검색 카드는 이전과 동일) ... */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Re:wear</Text>
          <TouchableOpacity onPress={goToProfile}>
            <ProfileIcon width={32} height={32} fill="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.weatherCard}>
          <Text style={styles.weatherText}>오늘 통영시는 맑음! 세탁하기 좋은 날이에요 ☀️</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>케어라벨 검색</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleLabelScanPress}>
              <CameraIcon width={24} height={24} />
              <Text style={styles.primaryButtonText}>라벨 촬영하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <CheckboxIcon width={24} height={24} stroke="#333" />
              <Text style={styles.secondaryButtonText}>직접 선택하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 미니 옷장 섹션 */}
        <View style={styles.card}>
          <View style={styles.closetHeader}>
            <Text style={styles.cardTitle}>미니 옷장</Text>
            <TouchableOpacity onPress={() => router.push('/closet')}>
              <Text style={styles.viewAllText}>전체보기</Text>
            </TouchableOpacity>
          </View>
          {/* 3. FlatList에 새 데이터 연결 */}
          <FlatList
            data={miniClosetData}
            renderItem={renderClosetItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  // ... (다른 스타일들은 이전과 동일) ...
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  weatherCard: { backgroundColor: 'white', borderRadius: 15, padding: 20, margin: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  weatherText: { fontSize: 16, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginHorizontal: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  primaryButton: { flex: 1, backgroundColor: '#4a4a4a', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: 'white', fontSize: 15, fontWeight: 'bold', marginLeft: 10 },
  secondaryButton: { flex: 1, backgroundColor: '#e9e9e9', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#333', fontSize: 15, fontWeight: '500', marginLeft: 10 },
  closetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  viewAllText: { fontSize: 14, color: 'gray' },
  closetItem: {
    marginRight: 15,
  },
  closetItemImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  // 4. '추가 버튼'을 위한 새 스타일 추가
  addItemButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#f0f0f0', // 회색 배경
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
});