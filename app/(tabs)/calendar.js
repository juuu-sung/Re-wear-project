// app/(tabs)/calendar.js

import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

// 나중에 백엔드에서 가져올 세탁 기록 데이터 (임시)
const MOCK_EVENTS = {
  '2025-10-02': [{ id: '1', title: '청바지 세탁' }],
  '2025-10-10': [{ id: '2', title: '흰 셔츠 3벌 세탁' }, { id: '3', title: '소라색 니트 드라이클리닝 맡기기' }],
  '2025-10-25': [{ id: '4', title: '운동화 손빨래' }],
};

// 오늘 날짜를 YYYY-MM-DD 형식의 문자열로 구하기
const todayString = new Date().toISOString().split('T')[0];

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(todayString);

  // 달력에 표시할 날짜들을 계산 (선택된 날짜 + 이벤트가 있는 날짜)
  const markedDates = useMemo(() => {
    const marks = {};

    // 이벤트가 있는 날짜들에 파란 점 찍기
    for (const date in MOCK_EVENTS) {
      marks[date] = { marked: true, dotColor: 'blue' };
    }

    // 현재 선택된 날짜에 파란 원 표시하기
    marks[selectedDate] = {
      ...marks[selectedDate], // 기존에 점이 있었다면 유지
      selected: true,
      selectedColor: 'blue',
    };
    
    return marks;
  }, [selectedDate]);

  // 선택된 날짜의 이벤트 목록
  const selectedDayEvents = MOCK_EVENTS[selectedDate] || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>캘린더</Text>
      </View>

      {/* 캘린더 컴포넌트 */}
      <Calendar
        current={todayString} // 초기 달력 월
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
        markedDates={markedDates}
        monthFormat={'yyyy년 MM월'}
        theme={{
          todayTextColor: 'blue',
          arrowColor: 'blue',
        }}
      />

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 선택된 날짜의 기록 */}
      <View style={styles.eventListContainer}>
        <Text style={styles.eventListTitle}>{selectedDate}</Text>
        <FlatList
          data={selectedDayEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventItem}>
              <Text>{item.title}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>이 날에는 기록이 없습니다.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  divider: {
    height: 10,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  eventListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  eventItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'gray',
  }
});