// app/(tabs)/index.js

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function HomeScreen() {
  const router = useRouter();

  const handleCameraPress = () => {
    const mockScanResult = '✅ [Mock] 찬물 손세탁 권장, 건조기 사용 금지';
    router.push({
      pathname: '/result',
      params: { scanResult: mockScanResult },
    });
  };

  // 새로 추가된 버튼을 위한 함수
  const handleSelectPress = () => {
    Alert.alert("알림", "직접 선택하기 페이지는 아직 준비 중입니다.");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Re:wear</Text>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="person-circle-outline" size={32} color="black" />
        </TouchableOpacity>
      </View>

      {/* 오늘의 알림 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>오늘의 알림</Text>
        <Text>오늘은 청바지를 세탁할 차례입니다!</Text>
      </View>
      
      {/* --- 케어라벨 검색 섹션 수정 --- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>케어라벨 검색</Text>
        {/* 버튼들을 가로로 묶어줄 View */}
        <View style={styles.buttonContainer}>
          {/* 기존 라벨 촬영하기 버튼 */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleCameraPress}>
            <Ionicons name="camera-outline" size={24} color="white" />
            <Text style={styles.primaryButtonText}>라벨 촬영하기</Text>
          </TouchableOpacity>
          {/* 새로 추가된 직접 선택하기 버튼 */}
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSelectPress}>
            <Ionicons name="checkbox-outline" size={24} color="#333" />
            <Text style={styles.secondaryButtonText}>직접 선택하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- 스타일 시트 수정 ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
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
    marginBottom: 15, // 여백 조정
  },
  // 버튼 컨테이너 스타일 추가
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 버튼 사이에 공간을 줌
    gap: 10, // 버튼 사이의 최소 간격
  },
  // 기존 버튼 스타일 이름 변경 및 수정
  primaryButton: {
    flex: 1, // 공간을 차지하는 비율
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
    fontSize: 15, // 폰트 크기 조정
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // 새로운 버튼 스타일 추가
  secondaryButton: {
    flex: 1,
    backgroundColor: '#e9e9e9', // 다른 배경색
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#333', // 다른 글자색
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default HomeScreen;