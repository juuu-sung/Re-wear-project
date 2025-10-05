// components/HomeScreenSkeleton.js

import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import SkeletonLoader from './ui/SkeletonLoader'; // ui 폴더 안에 있으니 경로 확인

const HomeScreenSkeleton = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 헤더 스켈레톤 */}
        <View style={styles.header}>
          <SkeletonLoader width={120} height={30} borderRadius={8}/>
          <SkeletonLoader width={32} height={32} borderRadius={16}/>
        </View>

        {/* 카드 스켈레톤 (3개 반복) */}
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.card}>
            <SkeletonLoader width={150} height={24} borderRadius={8} />
            <View style={styles.buttonContainer}>
              <SkeletonLoader width={'48%'} height={55} borderRadius={10}/>
              <SkeletonLoader width={'48%'} height={55} borderRadius={10}/>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 15, padding: 20, marginHorizontal: 20, marginBottom: 20, gap: 15 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default HomeScreenSkeleton;