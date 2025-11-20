import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { careLabelInfo, defaultCareLabelInfo } from './util/careLabelDescriptions';

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? '').toString().trim();
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

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
  const [geminiGuide, setGeminiGuide] = useState(null);
  const [geminiSummary, setGeminiSummary] = useState('');
  const [geminiError, setGeminiError] = useState('');
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);

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

  useEffect(() => {
    if (!detections.length) {
      setGeminiGuide(null);
      setGeminiSummary('');
      setGeminiError('');
      setIsLoadingGemini(false);
      return;
    }

    if (!BASE_URL) {
      setGeminiGuide(null);
      setGeminiSummary('');
      setGeminiError('서버 주소가 설정되지 않았어요. EXPO_PUBLIC_BASE_URL을 확인해 주세요.');
      setIsLoadingGemini(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchGeminiSummary = async () => {
      try {
        setIsLoadingGemini(true);
        setGeminiGuide(null);
        setGeminiError('');

        const payload = {
          detections: detections.map((item) => {
            const info = careLabelInfo[item.class_name] || defaultCareLabelInfo;
            return {
              class_name: item.class_name,
              description: info.description,
              confidence: item.confidence,
            };
          }),
        };

        const response = await fetch(`${BASE_URL}/laundry/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.detail || 'Gemini 응답 실패');
        }
        if (isMounted) {
          const summaryPayload = data?.summary;
          if (summaryPayload && typeof summaryPayload === 'object' && !Array.isArray(summaryPayload)) {
            setGeminiGuide(summaryPayload);
            setGeminiSummary('');
          } else if (typeof summaryPayload === 'string') {
            setGeminiGuide(null);
            setGeminiSummary(summaryPayload.trim());
          } else {
            setGeminiGuide(null);
            setGeminiSummary('');
          }
          setGeminiError('');
        }
      } catch (error) {
        if (isMounted) {
          if (error?.name === 'AbortError') return;
          setGeminiGuide(null);
          setGeminiSummary('');
          setGeminiError(error?.message || 'Gemini 요약을 불러오지 못했어요.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingGemini(false);
        }
      }
    };

    fetchGeminiSummary();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [detectionsString, BASE_URL]);

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
              const info = careLabelInfo[item.class_name] || defaultCareLabelInfo;
              return (
                <View 
                  key={index} 
                  style={[
                    styles.resultItem,
                    { borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: 5 }
                  ]}
                >
                  <View style={styles.resultContent}>
                    {info.image ? (
                      <Image source={info.image} style={styles.resultIcon} />
                    ) : (
                      <View style={styles.resultIconPlaceholder}>
                        <Text style={styles.resultIconPlaceholderText}>?</Text>
                      </View>
                    )}
                    {/* 👇 3. (NEW) 텍스트를 담을 컨테이너와 '설명' 텍스트를 추가합니다. */}
                    <View style={styles.textContainer}>
                      <Text style={styles.className}>{item.class_name}</Text>
                      <Text style={styles.description}>{info.description}</Text>
                    </View>
                  </View>

                  <Text style={styles.confidence}>
                    {Math.round(item.confidence * 100)}%
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {detections.length > 0 && (
          <View style={styles.geminiContainer}>
            <View style={styles.geminiHeader}>
              <Text style={styles.geminiTitle}>세탁 요약 (Gemini)</Text>
              <Text style={styles.geminiBadge}>AI</Text>
            </View>

            {isLoadingGemini ? (
              <View style={styles.geminiLoading}>
                <ActivityIndicator color="#2e7d32" />
                <Text style={styles.geminiLoadingText}>세탁 요약을 불러오는 중...</Text>
              </View>
            ) : geminiError ? (
              <Text style={styles.geminiError}>{geminiError}</Text>
            ) : geminiGuide ? (
              <>
                {geminiGuide.headline ? (
                  <Text style={styles.geminiHeadline}>{geminiGuide.headline}</Text>
                ) : null}

                {geminiGuide.alert ? (
                  <View style={styles.geminiAlert}>
                    <Text style={styles.geminiAlertText}>{geminiGuide.alert}</Text>
                  </View>
                ) : null}

                {Array.isArray(geminiGuide.steps) && geminiGuide.steps.length > 0 ? (
                  <View style={styles.geminiSteps}>
                    {geminiGuide.steps.map((step, idx) => (
                      <View key={`step-${idx}`} style={styles.geminiStepRow}>
                        <View style={styles.geminiStepBadge}>
                          <Text style={styles.geminiStepBadgeText}>{idx + 1}</Text>
                        </View>
                        <View style={styles.geminiStepContent}>
                          <Text style={styles.geminiStepTitle}>{step.title}</Text>
                          <Text style={styles.geminiStepDescription}>{step.description}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                {geminiGuide.tips ? (
                  <View style={styles.geminiTips}>
                    <Text style={styles.geminiTipsLabel}>추가 팁</Text>
                    <Text style={styles.geminiTipsText}>{geminiGuide.tips}</Text>
                  </View>
                ) : null}
              </>
            ) : geminiSummary ? (
              <Text style={styles.geminiSummary}>{geminiSummary}</Text>
            ) : (
              <Text style={styles.geminiLoadingText}>
                요약 결과가 비어 있어요. 잠시 후 다시 시도해 주세요.
              </Text>
            )}
          </View>
        )}

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
  
  resultContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  resultIcon: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
    marginRight: 12,
  },
  resultIconPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultIconPlaceholderText: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },

  // --- 👇 4. (NEW) 텍스트 관련 스타일 추가/수정 ---
  textContainer: {
    flex: 1, // (중요) 퍼센트 텍스트를 제외한 모든 공간을 차지
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

  geminiContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginTop: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#dbe5d5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  geminiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  geminiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  geminiBadge: {
    fontSize: 13,
    color: '#1b5e20',
    backgroundColor: '#e1f5e0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: 'bold',
  },
  geminiHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 10,
    lineHeight: 22,
  },
  geminiSummary: {
    fontSize: 15,
    lineHeight: 23,
    color: '#333',
  },
  geminiAlert: {
    backgroundColor: '#eff8e7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  geminiAlertText: {
    color: '#4a7a1f',
    fontSize: 14,
    lineHeight: 20,
  },
  geminiSteps: {
    borderTopWidth: 1,
    borderTopColor: '#eef2ec',
    paddingTop: 10,
    marginBottom: 10,
  },
  geminiStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f4f1',
  },
  geminiStepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0f0e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  geminiStepBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  geminiStepContent: {
    flex: 1,
  },
  geminiStepTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  geminiStepDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
  },
  geminiTips: {
    borderRadius: 8,
    backgroundColor: '#f6faf4',
    padding: 12,
  },
  geminiTipsLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#5b7d4e',
    marginBottom: 4,
  },
  geminiTipsText: {
    fontSize: 14,
    color: '#4f5b46',
    lineHeight: 20,
  },
  geminiLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geminiLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#555',
  },
  geminiError: {
    fontSize: 14,
    color: '#d32f2f',
  },

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
