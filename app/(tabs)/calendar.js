// app/calendar.js

import { Stack } from 'expo-router';
import { useState } from 'react'; // <--- 이 부분이 수정되었습니다!
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// 캘린더를 한국어로 설정
LocaleConfig.locales['kr'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';

function CalendarScreen() {
  const [activeTab, setActiveTab] = useState('wear'); // 'wear' 또는 'wash'

  // 가상의 데이터 (Mock Data)
  const wearData = {
    '2025-10-02': { marked: true, dotColor: 'green' },
    '2025-10-05': { marked: true, dotColor: 'green' },
    '2025-10-12': { marked: true, dotColor: 'green' },
    '2025-10-13': { marked: true, dotColor: 'green' },
    '2025-10-20': { marked: true, dotColor: 'green' },
    '2025-10-23': { marked: true, dotColor: 'green' },
  };

  const washData = {
    '2025-10-03': { marked: true, dotColor: 'blue' },
    '2025-10-14': { marked: true, dotColor: 'blue' },
    '2025-10-21': { marked: true, dotColor: 'blue' },
  };

  // 현재 활성화된 탭에 따라 보여줄 데이터를 결정
  const markedDates = activeTab === 'wear' ? wearData : washData;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>한태희의 캘린더</Text>
      </View>

      {/* 캘린더 카드 */}
      <View style={styles.card}>
        {/* 착용/세탁 탭 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab('wear')}>
            <Text style={[styles.tab, activeTab === 'wear' && styles.activeTab]}>착용</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('wash')}>
            <Text style={[styles.tab, activeTab === 'wash' && styles.activeTab]}>세탁</Text>
          </TouchableOpacity>
        </View>

        {/* 캘린더 라이브러리 컴포넌트 */}
        <Calendar
          current={'2025-10-01'} // 초기 달력 월
          markedDates={markedDates}
          // 달력 헤더 스타일
          theme={{
            arrowColor: 'green',
            'stylesheet.calendar.header': {
              dayTextAtIndex0: { color: 'red' },
              dayTextAtIndex6: { color: 'blue' },
            },
            todayTextColor: 'orange',
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  tab: {
    fontSize: 16,
    color: 'lightgray',
    fontWeight: 'bold',
  },
  activeTab: {
    color: 'black',
    borderBottomWidth: 2,
    borderBottomColor: 'green',
  },
});

export default CalendarScreen;