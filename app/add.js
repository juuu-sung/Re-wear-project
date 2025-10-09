import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddScreen() {
  const router = useRouter();
  const { mode, date } = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date(date));
  const [showPicker, setShowPicker] = useState(false);

  const COLORS = { wear: "#8ef57a", wash: "#7ac8f5" };
  const COLOR = COLORS[mode] || COLORS.wash;

  const handleSave = () => {
    console.log("✅ 저장됨:", {
      mode,
      date: selectedDate.toISOString().split("T")[0],
      title,
      note,
    });
    router.push("/calendar");
  };

  const handleChangeDate = (event, newDate) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (newDate) setSelectedDate(newDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ iOS 기본 <(tab) 네비게이션 바 제거 */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 🔹 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "wear" ? "착용 기록 추가" : "세탁 기록 추가"}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {/* 🔹 내용 */}
      <View style={styles.content}>
        {/* 날짜 */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.label}>날짜</Text>
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={18} color={COLOR} />
              <Text style={[styles.dateButtonText, { color: COLOR }]}>
                날짜 변경
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dateText}>
            {selectedDate.toISOString().split("T")[0]}
          </Text>

          {showPicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleChangeDate}
            />
          )}
        </View>

        {/* 옷 이름 */}
        <View style={styles.card}>
          <Text style={styles.label}>옷 이름</Text>
          <TextInput
            placeholder="예: 흰 셔츠, 청바지"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#aaa"
          />
        </View>

        {/* 메모 */}
        <View style={styles.card}>
          <Text style={styles.label}>메모</Text>
          <TextInput
            placeholder="예: 점심 약속에서 착용 / 찬물 세탁"
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            multiline
            placeholderTextColor="#aaa"
          />
        </View>
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: COLOR }]}
        onPress={handleSave}
      >
        <Ionicons name="save-outline" size={20} color="white" />
        <Text style={styles.saveButtonText}>저장하기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },

  // 🔹 상단 헤더 (배경색 제거)
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "white", // 🔸 색 제거
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: {
    color: "black", // 🔸 글씨색 검정
    fontSize: 18,
    fontWeight: "bold",
  },

  // 🔹 내용 영역
  content: {
    paddingHorizontal: 18,
    paddingTop: 15,
  },

  // 🔹 카드 스타일
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: { fontSize: 16, fontWeight: "600", color: "#333" },
  dateText: { fontSize: 16, color: "#555", marginTop: 4 },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f3f3f3",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dateButtonText: { fontSize: 14, fontWeight: "600" },

  input: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  noteInput: {
    height: 100,
    textAlignVertical: "top",
  },

  // 🔹 저장 버튼
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 18,
    marginTop: 10,
    backgroundColor: "#7ac8f5",
    paddingVertical: 15,
    borderRadius: 30,
    gap: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
  },
});
