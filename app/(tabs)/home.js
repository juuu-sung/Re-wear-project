// app/(tabs)/home.js

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react'; // useState, useEffect import 추가
import { FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/// --- 우리가 만든 컴포넌트들을 import 합니다 ---
import HomeScreenSkeleton from '../../components/HomeScreenSkeleton';
import ErrorMessage from '../../components/ui/ErrorMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// 아이콘들을 불러옵니다.
import CameraIcon from '../../assets/icons/camera-outline.svg';
import CheckboxIcon from '../../assets/icons/checkbox-outline.svg';
import ProfileIcon from '../../assets/icons/person-circle-outline.svg';

// 옷장 페이지에 있던 임시 옷 데이터
const clothesData = [
  { id: '6', name: '청바지', category: '하의', image: require('../../assets/clothes/jeans.jpg') },
  { id: '5', name: '블랙 슬랙스', category: '하의', image: require('../../assets/clothes/slacks.jpg') },
  { id: '4', name: '회색 맨투맨', category: '상의', image: require('../../assets/clothes/gray_mtm.jpg') },
].reverse();

export default function HomeScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [showSpinner, setShowSpinner] = useState(false); // 로딩 스피너 visible 상태 추가

  useEffect(() => {
    // 시나리오: 
    // 1. 처음 2초간은 HomeScreenSkeleton (loading=true)
    // 2. 2초 후, 잠깐 LoadingSpinner를 보여줌 (showSpinner=true)
    // 3. 다시 2초 후, 에러 메시지를 보여줌 (error=true)
    // 4. 다시 2초 후, 실제 홈 화면을 보여줌 (loading=false, error=null)

    // Stage 1: 스켈레톤 -> 스피너
    const timer1 = setTimeout(() => {
      setLoading(false); // 스켈레톤 종료
      setShowSpinner(true); // 스피너 시작
    }, 2000);

    // Stage 2: 스피너 -> 에러
    const timer2 = setTimeout(() => {
      setShowSpinner(false); // 스피너 종료
      setError({ message: "데이터를 불러오는 중 오류가 발생했습니다!" }); // 에러 메시지 표시
    }, 4000); // 총 4초 후 (2초 + 2초)

    // Stage 3: 에러 -> 실제 화면
    const timer3 = setTimeout(() => {
      setError(null); // 에러 메시지 해제
      // 이때 loading은 이미 false이므로 실제 화면 렌더링
    }, 6000); // 총 6초 후 (4초 + 2초)


    // 컴포넌트가 사라질 때 모든 타이머를 정리합니다.
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);


  const goToProfile = () => { /* ... 기존과 동일 ... */ };
  const handleScanLabelPress = () => { /* ... 기존과 동일 ... */ };
  const takePhoto = async () => { /* ... 기존과 동일 ... */ };
  const pickImage = async () => { /* ... 기존과 동일 ... */ };
  const renderClosetItem = ({ item }) => { /* ... 기존과 동일 ... */ };

  // --- 조건부 렌더링 ---
  if (loading) {
    return <HomeScreenSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 로딩 스피너는 항상 렌더링되지만, showSpinner 상태에 따라 보였다 안 보였다 합니다. */}
      <LoadingSpinner visible={showSpinner} /> 

      {/* 에러 메시지는 에러 상태일 때만 보입니다. */}
      {error && <ErrorMessage message={error.message} />}

      {/* 로딩과 에러가 없으면, 실제 홈 화면을 보여줍니다 */}
      {!loading && !error && !showSpinner && (
        <ScrollView>
          {/* ... 기존 홈 화면의 JSX 코드는 그대로 ... */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Re:wear</Text>
            <TouchableOpacity onPress={goToProfile}>
              <ProfileIcon width={32} height={32} fill="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>오늘의 알림</Text>
            <Text>오늘은 청바지를 세탁할 차례입니다!</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>케어라벨 검색</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleScanLabelPress}>
                <CameraIcon width={24} height={24} />
                <Text style={styles.primaryButtonText}>라벨 촬영하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <CheckboxIcon width={24} height={24} stroke="#333" />
                <Text style={styles.secondaryButtonText}>직접 선택하기</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.card}>
              <Text style={styles.cardTitle}>옷을 추가해 보세요!</Text>
              <FlatList
                data={[...clothesData, { type: 'add' }]}
                renderItem={renderClosetItem}
                keyExtractor={(item, index) => item.id || `add-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 15 }}
              />
          </View>
        </ScrollView>
      )}
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