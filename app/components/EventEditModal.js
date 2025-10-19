import { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

export default function EventEditModal({ visible, onClose, event, onDelete, onUpdate }) {
  const [selectedDate, setSelectedDate] = useState(event ? event.date : "");
  const [selectedType, setSelectedType] = useState(event?.type || "wear");

  if (!event) return null;

  const handleSave = () => {
    if (!selectedDate || !selectedType) return;
    onUpdate(selectedDate, selectedType);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* ✅ 제목 */}
          <Text style={styles.title}>기록 수정</Text>

          {/* ✅ 달력 (추가 모달과 동일) */}
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={
              selectedDate
                ? {
                    [selectedDate]: {
                      selected: true,
                      selectedColor:
                        selectedType === "wash" ? "#6AB7FF" : "#b8e2b1",
                    },
                  }
                : {}
            }
            theme={{
              todayTextColor: "#23422D",
              arrowColor: "#23422D",
            }}
          />

          {/* ✅ 타입 선택 (추가 모달과 동일) */}
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                selectedType === "wear" && {
                  backgroundColor: "#b8e2b1",
                  borderColor: "#b8e2b1",
                },
              ]}
              onPress={() => setSelectedType("wear")}
            >
              <Text
                style={[
                  styles.typeText,
                  selectedType === "wear" && { color: "#fff" },
                ]}
              >
                착용
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                selectedType === "wash" && {
                  backgroundColor: "#6AB7FF",
                  borderColor: "#6AB7FF",
                },
              ]}
              onPress={() => setSelectedType("wash")}
            >
              <Text
                style={[
                  styles.typeText,
                  selectedType === "wash" && { color: "#fff" },
                ]}
              >
                세탁
              </Text>
            </TouchableOpacity>
          </View>

          {/* ✅ 저장 / 삭제 버튼 (좌우 배치) */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveBtn}
            >
              <Text style={styles.saveText}>저장</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ 닫기 버튼 (맨 아래) */}
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    height: "85%",
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

  // ✅ 타입 선택 영역
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: "#23422D",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  typeText: {
    fontSize: 18,
    color: "#23422D",
    fontWeight: "600",
  },

  // ✅ 저장 / 삭제 버튼 나란히
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
  },
  saveBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  saveText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#23422D",
  },
  deleteBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  deleteText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#B71C1C",
  },

  // ✅ 닫기 버튼 (맨 아래)
  closeBtn: {
    marginTop: 15,
    alignSelf: "center",
    paddingVertical: 12,
  },
  closeText: {
    color: "#23422D",
    fontWeight: "700",
    fontSize: 20,
  },
});
