// app/care-label-result.js

import { useLocalSearchParams } from 'expo-router';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

// 임시 세탁 정보 데이터
const mockWashingInfo = {
  symbols: [
    { name: '물세탁', description: '세탁기 표준 코스로 세탁 가능합니다.' },
    { name: '표백', description: '염소, 산소계 표백제 사용이 불가능합니다.' },
    { name: '건조', description: '기계 건조가 불가능하며, 옷걸이에 걸어 그늘에서 말려주세요.' },
    { name: '다림질', description: '140~160°C로 다림질이 가능합니다.' },
  ],
  summary: '이 의류는 일반적인 물세탁이 가능하지만, 표백제 사용은 피해야 합니다. 건조기 대신 그늘에서 자연 건조하는 것이 좋습니다.'
};

export default function CareLabelResultScreen() {
  const { imageUri } = useLocalSearchParams(); // 홈 화면에서 전달받은 이미지 주소

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={{ uri: imageUri }} style={styles.image} />
        
        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>분석 결과</Text>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{mockWashingInfo.summary}</Text>
          </View>

          {mockWashingInfo.symbols.map((symbol, index) => (
            <View key={index} style={styles.symbolRow}>
              <View style={styles.symbolIconPlaceholder} />
              <View style={styles.symbolTextContainer}>
                <Text style={styles.symbolName}>{symbol.name}</Text>
                <Text style={styles.symbolDescription}>{symbol.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#f0f0f0' },
  resultSection: { padding: 25 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  summaryCard: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 20, marginBottom: 30 },
  summaryText: { fontSize: 16, lineHeight: 24 },
  symbolRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, },
  symbolIconPlaceholder: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#e9e9e9', marginRight: 15 },
  symbolTextContainer: { flex: 1 },
  symbolName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  symbolDescription: { fontSize: 14, color: 'gray' },
});