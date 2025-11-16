import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// 👇 1. (NEW) 방금 만든 '설명' 파일을 import 합니다.
import { careLabelDescriptions } from './util/careLabelDescriptions';

// ... (COLORS 배열은 동일) ...
const COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#30B0C7',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55',
];

export default function ScanResultScreen() {
  const params = useLocalSearchParams();
  const { imageUri, detections: detectionsString } = params;
  const router = useRouter(); 
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });

  let detections = [];
  try {
    detections = JSON.parse(detectionsString);
  } catch (e) { console.error('결과 파싱 실패:', e); }

  const onImageLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setImageLayout({ width, height });
  };

  const onManualSelect = () => {
    router.push('/carelabel');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '스캔 결과' }} />
      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={styles.header}>촬영된 이미지</Text>
        
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain" 
              onLayout={onImageLayout}
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}

          {/* --- 바운딩 박스 그리는 로직 (동일) --- */}
          {/* (참고: 이미지 위의 라벨은 공간이 좁아서
              긴 설명글이 아닌 '클래스 이름'을 그대로 보여줍니다) */}
          {imageLayout.width > 0 && detections.map((item, index) => {
            const box = item.box;
            const boxStyle = { /* ... (스타일 동일) ... */
              position: 'absolute', left: box.x1 * imageLayout.width,
              top: box.y1 * imageLayout.height, width: (box.x2 - box.x1) * imageLayout.width,
              height: (box.y2 - box.y1) * imageLayout.height, borderWidth: 2,
              borderColor: COLORS[index % COLORS.length],
            };
            const labelStyle = { /* ... (스타일 동일) ... */
              position: 'absolute', left: box.x1 * imageLayout.width,
              top: box.y1 * imageLayout.height - 20, backgroundColor: COLORS[index % COLORS.length],
              color: 'white', paddingHorizontal: 4, paddingVertical: 2,
              fontSize: 12, fontWeight: 'bold',
            };
            return (
              <React.Fragment key={index}>
                <View style={boxStyle} />
                <Text style={labelStyle}>{item.class_name}</Text>
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.header}>AI 분석 결과 (목록)</Text>
        
        <View style={styles.resultsContainer}>
          {detections.length === 0 ? (
            <Text style={styles.noResultText}>
              인식된 세탁 기호가 없습니다.
            </Text>
          ) : (
            detections.map((item, index) => {
              
              // 👇 2. (NEW) 클래스 이름으로 '설명'을 조회합니다.
              const description = careLabelDescriptions[item.class_name] || careLabelDescriptions.default;

              return (
                <View 
                  key={index} 
                  style={[
                    styles.resultItem,
                    { borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: 5 }
                  ]}
                >
                  {/* 👇 3. (NEW) 텍스트를 담을 컨테이너와 '설명' 텍스트를 추가합니다. */}
                  <View style={styles.textContainer}>
                    <Text style={styles.className}>{item.class_name}</Text>
                    <Text style={styles.description}>{description}</Text>
                  </View>
                  
                  <Text style={styles.confidence}>
                    {Math.round(item.confidence * 100)}%
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* --- "직접 선택하기" 버튼 (동일) --- */}
        <TouchableOpacity
          style={styles.manualButton}
          onPress={onManualSelect}
        >
          <Text style={styles.manualButtonText}>
            기호가 잘못되었나요? 직접 선택하기
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ... (SCREEN_WIDTH 부분은 동일) ...
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  // ... (기존 스타일은 동일) ...
  safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
  container: { padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  imageContainer: {
    width: SCREEN_WIDTH - 40, height: (SCREEN_WIDTH - 40) * 1.2,
    backgroundColor: '#eee', borderRadius: 10,
    marginBottom: 30, overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  resultsContainer: { width: '100%' },
  noResultText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 20 },
  
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // (수직 중앙 정렬)
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // --- 👇 4. (NEW) 텍스트 관련 스타일 추가/수정 ---
  textContainer: {
    flex: 1, // (중요) 퍼센트 텍스트를 제외한 모든 공간을 차지
    marginRight: 10, // 퍼센트 텍스트와의 간격
  },
  className: { 
    fontSize: 16, 
    fontWeight: 'bold', // (수정) 클래스 이름을 더 강조
    color: '#333', 
    marginBottom: 4, // 설명과의 간격
  },
  description: {
    fontSize: 14,
    color: '#555', // (NEW) 설명 텍스트 스타일
  },
  confidence: { 
    fontSize: 14, 
    color: '#555', 
    fontWeight: 'bold',
  },
  // --- ----------------------------------- ---

  manualButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  manualButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});