import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // ✅ 페이지 이동용
import { useMemo, useRef, useState } from "react";
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

// 더미 데이터 (임시)
const WEAR_EVENTS = {
  "2025-10-03": [{ id: "w1", title: "니트 착용" }],
  "2025-10-05": [{ id: "w2", title: "청바지 착용" }],
  "2025-10-11": [{ id: "w3", title: "셔츠 착용" }],
};
const WASH_EVENTS = {
  "2025-10-02": [{ id: "1", title: "청바지 세탁" }],
  "2025-10-10": [{ id: "2", title: "흰 셔츠 세탁" }],
  "2025-10-25": [{ id: "3", title: "운동화 손빨래" }],
};

const todayString = new Date().toISOString().split("T")[0];
const COLORS = { wear: "#8ef57a", wash: "#7ac8f5" };

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [mode, setMode] = useState("wash");
  const anim = useRef(new Animated.Value(0)).current; // 0 = wash, 1 = wear

  // 🔹 Wear/Wash 토글
  const toggleMode = () => {
    const newMode = mode === "wash" ? "wear" : "wash";
    setMode(newMode);
    Animated.timing(anim, {
      toValue: newMode === "wear" ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.wash, COLORS.wear],
  });
  const textColor = borderColor;
  const circleColor = borderColor;
  const fabColor = borderColor;
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [4, 92] });

  const currentEvents = mode === "wear" ? WEAR_EVENTS : WASH_EVENTS;
  const selectedDayEvents = currentEvents[selectedDate] || [];

  // 🔹 달력 점 표시
  const markedDates = useMemo(() => {
    const marks = {};
    for (const date in currentEvents) {
      marks[date] = {
        marked: true,
        dotColor: mode === "wear" ? COLORS.wear : COLORS.wash,
      };
    }
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: mode === "wear" ? COLORS.wear : COLORS.wash,
    };
    return marks;
  }, [selectedDate, mode]);

  // 🔹 + 버튼 클릭 → Add 페이지로 이동
  const handleAdd = () => {
    router.push({
      pathname: "/add",
      params: { mode, date: todayString },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>캘린더</Text>

        {/* 토글 */}
        <Pressable onPress={toggleMode}>
          <Animated.View style={[styles.toggleButton, { borderColor }]}>
            <Animated.Text style={[styles.toggleText, { color: textColor }]}>
              {mode === "wear" ? "Wear" : "Wash"}
            </Animated.Text>
            <Animated.View
              style={[
                styles.circle,
                { backgroundColor: circleColor, transform: [{ translateX }] },
              ]}
            >
              <Ionicons name="checkmark" size={18} color="white" />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>

      {/* 캘린더 */}
      <Calendar
        current={todayString}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        monthFormat={"yyyy년 MM월"}
        theme={{
          todayTextColor: mode === "wear" ? COLORS.wear : COLORS.wash,
          arrowColor: "#000",
        }}
      />

      <View style={styles.divider} />

      {/* 선택된 날짜의 기록 */}
      <View style={styles.eventListContainer}>
        <Text
          style={[
            styles.eventListTitle,
            { color: mode === "wear" ? COLORS.wear : COLORS.wash },
          ]}
        >
          {selectedDate} ({mode === "wear" ? "착용 기록" : "세탁 기록"})
        </Text>

        <FlatList
          data={selectedDayEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventItem}>
              <Text>{item.title}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              이 날에는 {mode === "wear" ? "착용" : "세탁"} 기록이 없습니다.
            </Text>
          }
        />
      </View>

      {/* + 버튼 */}
      <Animated.View style={[styles.fabContainer, { backgroundColor: fabColor }]}>
        <Pressable onPress={handleAdd} style={styles.fabButton}>
          <Ionicons name="add" size={32} color="white" />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

// ================= 스타일 =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  toggleButton: {
    width: 130,
    height: 45,
    borderWidth: 2,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  toggleText: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "600" },
  circle: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 10, backgroundColor: "#f0f0f0", marginVertical: 10 },
  eventListContainer: { flex: 1, paddingHorizontal: 20 },
  eventListTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  eventItem: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  emptyText: { textAlign: "center", marginTop: 20, color: "gray" },
  fabContainer: {
    position: "absolute",
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },
  fabButton: { flex: 1, alignItems: "center", justifyContent: "center" },
});
