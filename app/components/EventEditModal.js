import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EventEditModal({
  visible,
  onClose,
  event,
  onDelete,
  onUpdate,
}) {
  const [selectedDate, setSelectedDate] = useState(
    event ? new Date(event.date) : new Date()
  );
  const [selectedType, setSelectedType] = useState(event?.type || "wear");

  if (!event) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* ✅ 제목 */}
          <Text style={styles.title}>기록 수정</Text>

          {/* ✅ 날짜 선택 */}
          <View style={styles.section}>
            <Text style={styles.label}>날짜 변경</Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(e, date) => date && setSelectedDate(date)}
              style={{ alignSelf: "center" }}
            />
          </View>

          {/* ✅ 타입 선택 */}
          <View style={styles.section}>
            <Text style={styles.label}>종류 변경</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === "wear" && styles.activeType,
                ]}
                onPress={() => setSelectedType("wear")}
              >
                <Text
                  style={[
                    styles.typeText,
                    selectedType === "wear" && styles.activeTypeText,
                  ]}
                >
                  👕 착용
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === "wash" && styles.activeType,
                ]}
                onPress={() => setSelectedType("wash")}
              >
                <Text
                  style={[
                    styles.typeText,
                    selectedType === "wash" && styles.activeTypeText,
                  ]}
                >
                  🧺 세탁
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ✅ 수정 & 삭제 버튼 */}
          <View style={styles.actionRow}>
            {/* ✅ 저장 버튼 */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#23422D" }]}
              onPress={() => {
                // ✅ 타임존 보정 (UTC → KST)
                const local = new Date(selectedDate);
                local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
                const formatted = local.toISOString().split("T")[0]; // YYYY-MM-DD
                console.log("🧩 최종 전송 날짜:", formatted);
                onUpdate(formatted, selectedType);
              }}
            >
              <Text style={styles.actionText}>저장</Text>
            </TouchableOpacity>

            {/* ✅ 삭제 버튼 */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#B71C1C" }]}
              onPress={onDelete}
            >
              <Text style={styles.actionText}>삭제</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ 닫기 버튼 */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "88%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#23422D",
    marginBottom: 16,
    textAlign: "center",
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#23422D",
    marginBottom: 6,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  typeButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeType: {
    backgroundColor: "#23422D",
    borderColor: "#23422D",
  },
  typeText: { color: "#23422D", fontWeight: "600", fontSize: 16 },
  activeTypeText: { color: "#fff" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeBtn: {
    marginTop: 20,
    alignSelf: "center",
    paddingVertical: 10,
  },
  closeText: {
    color: "#23422D",
    fontWeight: "700",
    fontSize: 16,
  },
});
