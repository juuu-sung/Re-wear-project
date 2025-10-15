import { useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";

export default function EventSelectModal({ visible, onClose, cloth, onConfirm }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedType, setSelectedType] = useState("");

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>📅 {cloth?.name}</Text>

          {/* 날짜 선택 */}
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={
              selectedDate ? { [selectedDate]: { selected: true, selectedColor: "#b8e2b1" } } : {}
            }
            theme={{
              todayTextColor: "#23422D",
              arrowColor: "#23422D",
            }}
          />

          {/* Wear / Wash 선택 */}
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                selectedType === "wear" && styles.activeBtn,
              ]}
              onPress={() => setSelectedType("wear")}
            >
              <Text
                style={[
                  styles.typeText,
                  selectedType === "wear" && styles.activeText,
                ]}
              >
                👕 착용
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                selectedType === "wash" && styles.activeBtn,
              ]}
              onPress={() => setSelectedType("wash")}
            >
              <Text
                style={[
                  styles.typeText,
                  selectedType === "wash" && styles.activeText,
                ]}
              >
                🧺 세탁
              </Text>
            </TouchableOpacity>
          </View>

          {/* 저장 버튼 */}
          <TouchableOpacity
            disabled={!selectedDate || !selectedType}
            onPress={() => {
              onConfirm(selectedDate, selectedType);
              setSelectedDate("");
              setSelectedType("");
            }}
            style={[
              styles.saveBtn,
              (!selectedDate || !selectedType) && { backgroundColor: "#ccc" },
            ]}
          >
            <Text style={styles.saveText}>저장</Text>
          </TouchableOpacity>

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
  },
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
  activeBtn: {
    backgroundColor: "#23422D",
  },
  typeText: {
    fontSize: 18,
    color: "#23422D",
    fontWeight: "600",
  },
  activeText: {
    color: "#fff",
  },
  saveBtn: {
    backgroundColor: "#23422D",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: { marginTop: 10, alignSelf: "center" },
  closeText: { color: "#23422D", fontWeight: "700", fontSize: 16 },
});
