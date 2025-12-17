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

  const handleSave = () => {
    if (!selectedDate || !selectedType) {
      return;   
    }
    onConfirm(selectedDate, selectedType);
    setSelectedDate("");
    setSelectedType("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{cloth?.name}</Text>

          {/*  날짜 선택 */}
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={
              selectedDate
                ? {
                    [selectedDate]: {
                      selected: true,
                      selectedColor:
                        selectedType === "wash"
                          ? "#6AB7FF"   
                          : "#b8e2b1",   
                    },
                  }
                : {}
            }
            theme={{
              todayTextColor: "#23422D",
              arrowColor: "#23422D",
            }}
          />

          {/*  착용 / 세탁 버튼 */}
          <View style={styles.typeContainer}>
            {/* 착용 */}
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

            {/* 세탁 */}
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

          {/*  저장 버튼 */}
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveBtn,
              (!selectedDate || !selectedType) && { opacity: 0.4 },
            ]}
          >
            <Text style={styles.saveText}>저장</Text>
          </TouchableOpacity>

          {/*  닫기 버튼 */}
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
  typeText: {
    fontSize: 18,
    color: "#23422D",
    fontWeight: "600",
  },

    
  saveBtn: {
    alignSelf: "center",
    marginTop: 25,
    paddingVertical: 16,
    paddingHorizontal: 50,
  },
  saveText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#23422D",   
  },

    
  closeBtn: {
    marginTop: 14,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 35,
  },
  closeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#23422D",   
  },
});
