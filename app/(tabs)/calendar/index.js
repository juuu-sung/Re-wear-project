import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { Calendar } from "react-native-calendars";
import ClosetPickerModal from "../../components/ClosetPickerModal";
import EventEditModal from "../../components/EventEditModal";
import EventSelectModal from "../../components/EventSelectModal";

// ✅ 서버 주소 설정
const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function CalendarScreen() {
  const [userId, setUserId] = useState(null);
  const [calendarDots, setCalendarDots] = useState({});
  const [allEvents, setAllEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCloth, setSelectedCloth] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [closetItems, setClosetItems] = useState([]);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // ✅ 유저 ID 불러오기
  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    const id = await AsyncStorage.getItem("user_id");
    if (id) setUserId(Number(id));
  };

  // ✅ userId 세팅 후 이벤트 로드
  useEffect(() => {
    if (userId !== null && !isNaN(userId)) {
      const today = new Date().toISOString().split("T")[0];
      fetchCalendar(today, userId);
      fetchEvents(userId);
    }
  }, [userId]);

  // ✅ 옷장 데이터 불러오기
  const loadClosetItems = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;
      const res = await fetch(`${BASE_URL}/clothes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setClosetItems(data);
    } catch (err) {
      console.error("옷장 불러오기 실패:", err);
    }
  };

  // ✅ 캘린더 dot 정보 불러오기
  const fetchCalendar = async (date, uid) => {
    const [y, m] = date.split("-");
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(`${BASE_URL}/events/calendar?month=${y}-${m}&user_id=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const formatted = {};
      const wearDates = Array.isArray(data.wear) ? data.wear : Object.keys(data.wear || {});
      const washDates = Array.isArray(data.wash) ? data.wash : Object.keys(data.wash || {});

      wearDates.forEach((d) => {
        const dateKey = d.split("T")[0];
        formatted[dateKey] = { dots: [{ color: "#2E7D32" }], marked: true };
      });
      washDates.forEach((d) => {
        const dateKey = d.split("T")[0];
        if (formatted[dateKey]) formatted[dateKey].dots.push({ color: "#1565C0" });
        else formatted[dateKey] = { dots: [{ color: "#1565C0" }], marked: true };
      });

      setCalendarDots(formatted);
    } catch (err) {
      console.error("캘린더 로드 실패:", err);
    }
  };

  // ✅ 전체 이벤트 불러오기
  const fetchEvents = async (uid) => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(`${BASE_URL}/events?user_id=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const data = await res.json();
      console.log("📦 서버에서 받은 이벤트:", data);

      const grouped = {};
      data.forEach((e) => {
        const d = e.date ? e.date.split("T")[0] : "unknown";
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(e);
      });

      setAllEvents(grouped);
    } catch (err) {
      console.error("이벤트 로드 실패:", err);
    }
  };

  // ✅ 이벤트 추가 (포인트 적립 추가됨)
  // ✅ 이벤트 추가 (일일미션 완료 알림으로 변경)
// ✅ 이벤트 추가 (일일미션 자동 완료 반영)
// ✅ 이벤트 추가 (RP 및 알림 제거됨 — 미션 상태만 갱신)
const saveEvent = async (date, newEvent) => {
  try {
    const payload = {
      date,
      type: newEvent.type,
      garment_id: newEvent.cloth_id,
    };

    const token = await AsyncStorage.getItem("access_token");
    const res = await fetch(`${BASE_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("이벤트 저장 실패");

    // ==============================
    // ⭐ Daily Mission 연동 (수정됨)
    // ==============================
    const missionKey =
      newEvent.type === "wear"
        ? "add_wear"
        : newEvent.type === "wash"
        ? "add_wash"
        : null;

    if (missionKey && userId) {
      const today = new Date().toISOString().split("T")[0];

      const dateKey = `daily_mission_date_${userId}`;
      const missionStorageKey = `daily_missions_${userId}`;

      const storedDate = await AsyncStorage.getItem(dateKey);
      const missionsRaw = await AsyncStorage.getItem(missionStorageKey);

      if (missionsRaw && storedDate === today) {
        const missions = JSON.parse(missionsRaw);

        const target = missions.find((m) => m.key === missionKey);

        // 아직 완료되지 않은 경우만 처리
        if (target && !target.done) {
          const updated = missions.map((m) =>
            m.key === missionKey ? { ...m, done: true } : m
          );

          await AsyncStorage.setItem(
            missionStorageKey,
            JSON.stringify(updated)
          );

          console.log(`🎯 미션 '${missionKey}' 완료 처리됨`);
        }
      }
    }

    // ==============================
    // 캘린더 갱신
    // ==============================
    fetchCalendar(date, userId);
    fetchEvents(userId);

  } catch (err) {
    console.error("이벤트 저장 실패:", err);
    Alert.alert("저장 실패", "서버와 통신 중 문제가 발생했습니다.");
  }
};





  // ✅ 이벤트 삭제
  const deleteEvent = async (eventId, date) => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      await fetch(`${BASE_URL}/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCalendar(date, userId);
      fetchEvents(userId);
      Alert.alert("삭제 완료", "기록이 삭제되었습니다.");
    } catch (err) {
      console.error("기록 삭제 실패:", err);
    }
  };

  // ✅ 이벤트 수정
  const updateEvent = async (eventId, newDate, newType) => {
    try {
      const payload = {
        date: newDate,
        type: newType,
        garment_id: editingEvent.garment_id,
      };
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(`${BASE_URL}/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchCalendar(newDate, userId);
        fetchEvents(userId);
        Alert.alert("수정 완료", "기록이 수정되었습니다.");
      } else {
        Alert.alert("수정 실패", "서버와의 통신 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("기록 수정 실패:", err);
    }
  };

  // ✅ 날짜 클릭 → 해당 날짜 이벤트 표시
  const handleDayPress = (day) => {
    const date = day.dateString;
    setSelectedDate(date);
    setSelectedEvents(allEvents[date] || []);
  };

  // ✅ 이미지 경로 처리
  const getImageSource = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return { uri: path };
    if (path.startsWith("/uploads")) return { uri: `${BASE_URL}${path}` };
    return { uri: `${BASE_URL}/uploads/clothes/${path}` };
  };

  useFocusEffect(
    useCallback(() => {
      loadClosetItems();
    }, [])
  );

  useEffect(() => {
    if (modalVisible) loadClosetItems();
  }, [modalVisible]);

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>캘린더</Text>
        </View>
        <View style={styles.headerDivider} />

        <Calendar
          markingType="multi-dot"
          markedDates={calendarDots}
          onDayPress={handleDayPress}
          onMonthChange={(month) => {
            const y = month.year.toString();
            const m = month.month.toString().padStart(2, "0");
            fetchCalendar(`${y}-${m}-01`, userId);
          }}
          theme={{
            todayTextColor: "#2e7d32",
            arrowColor: "#2e7d32",
            monthTextColor: "#000000ff",
          }}
        />

        <View style={styles.divider} />

        {selectedDate && (
          <View style={styles.eventSection}>
            <Text style={styles.eventTitle}> {selectedDate} 기록</Text>
            {selectedEvents.length > 0 ? (
              selectedEvents.map((e, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.eventItemBox}
                  onPress={() => {
                    setEditingEvent(e);
                    setEditModalVisible(true);
                  }}
                >
                  <View style={styles.row}>
                    {e.clothes?.image_path ? (
                      <TouchableOpacity
                        onPress={() => {
                          const img = e.clothes.image_path;
                          setPreviewImage(getImageSource(img));
                          setImageModalVisible(true);
                        }}
                      >
                        <Image
                          source={getImageSource(e.clothes.image_path)}
                          style={styles.thumb}
                        />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.thumbPlaceholder}>
                        <Ionicons name="shirt-outline" size={22} color="#999" />
                      </View>
                    )}

                    <Text style={styles.eventItemText}>
                      {e.type === "wear" ? "착용" : "세탁"} -{" "}
                      {e.clothes?.name || "이름 없음"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: "#777", fontSize: 16 }}>기록이 없습니다.</Text>
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={34} color="#fff" />
      </TouchableOpacity>

      <ClosetPickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        closetItems={closetItems}
        onSelectCloth={(cloth) => {
          setSelectedCloth(cloth);
          setModalVisible(false);
          setEventModalVisible(true);
        }}
      />

      <EventSelectModal
        visible={eventModalVisible}
        onClose={() => setEventModalVisible(false)}
        cloth={selectedCloth}
        onConfirm={(date, type) => {
          saveEvent(date, {
            type,
            cloth_id: selectedCloth.id,
            image_path: selectedCloth.image_path || null,
          });
          setEventModalVisible(false);
        }}
      />

      <EventEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        event={editingEvent}
        onDelete={() => {
          deleteEvent(editingEvent.id, selectedDate);
          setEditModalVisible(false);
        }}
        onUpdate={(newDate, newType) => {
          updateEvent(editingEvent.id, newDate, newType);
          setEditModalVisible(false);
        }}
      />

      <Modal visible={imageModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setImageModalVisible(false)}>
          <View style={styles.imageModalOverlay}>
            <TouchableWithoutFeedback>
              <Image
                source={previewImage}
                style={styles.imageModalPreview}
              />
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#2e7d32", marginBottom: 6 },
  headerDivider: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  divider: { borderBottomWidth: 1, borderColor: "#ddd", marginTop: 8 },
  eventSection: { padding: 16 },
  eventTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12, color: "#000" },
  eventItemBox: {
    backgroundColor: "#f6f6f6",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  row: { flexDirection: "row", alignItems: "center" },
  thumb: { width: 40, height: 40, borderRadius: 8, marginRight: 10 },
  thumbPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  eventItemText: { fontSize: 17, color: "#000", flexShrink: 1 },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 25,
    backgroundColor: "#2e7d32",
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 5 },
    }),
  },

  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalPreview: {
    width: "85%",
    height: "65%",
    resizeMode: "contain",
    borderRadius: 12,
  },
});
