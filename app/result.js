// app/result.js

import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

function ResultScreen() {
  // 다른 페이지에서 전달받은 파라미터(데이터)를 가져옵니다.
  const { scanResult } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      {/* 페이지 상단 헤더 설정 */}
      <Stack.Screen options={{ title: '분석 결과' }} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>케어라벨 분석 결과입니다</Text>
        <Text style={styles.resultText}>{scanResult}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  resultText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c7a7b', // 결과 텍스트에 포인트 색상
    textAlign: 'center',
  },
});

export default ResultScreen;