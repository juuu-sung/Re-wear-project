import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import brandsData from "../../assets/data/slowfashion_brands.json"; // ✅ JSON 파일 불러오기

// ✅ 외부 브라우저 열기 함수
const openLink = async (url) => {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch (error) {
    console.error("❌ 브라우저 열기 실패:", error);
  }
};

// ✅ 백엔드 기본 URL
const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef(null);

  const [closetItems, setClosetItems] = useState([]);
  const [calendarDots, setCalendarDots] = useState({});
  const [userId, setUserId] = useState(null);
  const [weekDates, setWeekDates] = useState([]);
  const [allEvents, setAllEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  // ✅ 뉴스 상태
  const [news, setNews] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);

  // ✅ 좋아요 관련
  const [likedBrands, setLikedBrands] = useState([]);
  const [likedPopupVisible, setLikedPopupVisible] = useState(false);

  // ✅ 회전 애니메이션 설정
  const spinValue = useRef(new Animated.Value(0)).current;
  const spin = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };
  const spinAnimation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // ✅ 이번 주 날짜 계산
 useEffect(() => {
  const today = new Date();
  const day = today.getDay(); // 일=0, 월=1, ... 토=6

  // ✅ 이번 주 일요일(주 시작일)
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - day);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);

    // ✅ 한국 시간대 맞게 변환
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];

    week.push(localDate);
  }

  setWeekDates(week);
}, []);

  // ✅ 사용자 ID 로드
  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("user_id");
      if (id) setUserId(Number(id));
    };
    loadUser();
  }, []);

  // ✅ 옷장 미리보기 로드
  const loadClosetPreview = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(`${BASE_URL}/clothes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "옷장 불러오기 실패");

      const sorted = data.sort((a, b) => b.id - a.id);
      setClosetItems(sorted.slice(0, 5));
    } catch (err) {
      console.error("❌ 옷장 로드 실패:", err);
    }
  };

  // ✅ 캘린더 점 + 이벤트 로드
  const loadCalendarPreview = async () => {
    if (!userId) return;
    const today = new Date().toISOString().split("T")[0];
    const [y, m] = today.split("-");
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(
        `${BASE_URL}/events/calendar?month=${y}-${m}&user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      const formatted = {};
      const wearDates = Array.isArray(data.wear)
        ? data.wear
        : Object.keys(data.wear || {});
      const washDates = Array.isArray(data.wash)
        ? data.wash
        : Object.keys(data.wash || {});

      wearDates.forEach((d) => {
        const dateKey = d.split("T")[0];
        formatted[dateKey] = { dots: [{ color: "#2E7D32" }] };
      });
      washDates.forEach((d) => {
        const dateKey = d.split("T")[0];
        if (formatted[dateKey])
          formatted[dateKey].dots.push({ color: "#1565C0" });
        else formatted[dateKey] = { dots: [{ color: "#1565C0" }] };
      });
      setCalendarDots(formatted);

      const eventRes = await fetch(`${BASE_URL}/events?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const eventData = await eventRes.json();
      const grouped = {};
      eventData.forEach((e) => {
        const date = e.date?.split("T")[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(e);
      });
      setAllEvents(grouped);
    } catch (err) {
      console.error("❌ 캘린더 로드 실패:", err);
    }
  };

  // ✅ 뉴스 로드
  const loadNews = async () => {
    try {
      setLoadingNews(true);
      spin();
      const res = await axios.get(`${BASE_URL}/v1/news?refresh=${Date.now()}`);
      setNews(res.data);
    } catch (err) {
      console.error("❌ 뉴스 불러오기 실패:", err);
    } finally {
      setLoadingNews(false);
    }
  };

  // ✅ 12시간마다 뉴스 새로 불러오기 (크롤링)
  useEffect(() => {
    if (!userId) return;

    // 즉시 한 번 실행
    loadNews();

    // 12시간마다(43200000ms) 반복 실행
    const crawlInterval = setInterval(loadNews, 12 * 60 * 60 * 1000);

    return () => clearInterval(crawlInterval);
  }, [userId]);

// ✅ 15초마다 뉴스 순서만 랜덤하게 섞기
  useEffect(() => {
    const shuffleInterval = setInterval(() => {
      setNews((prev) => [...prev].sort(() => Math.random() - 0.5));
    }, 15000);

    return () => clearInterval(shuffleInterval);
  }, []);


  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadClosetPreview();
        loadCalendarPreview();
      }
    }, [userId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadClosetPreview(), loadCalendarPreview()]);
    loadNews();
    setRefreshing(false);
  };

  // ✅ 날짜 클릭
  const handleDatePress = (date) => {
    const events = allEvents[date] || [];
    setSelectedDate(date);
    setSelectedEvents(events);
    setModalVisible(true);
  };

  // ✅ 좋아요 데이터 로드
  useEffect(() => {
    const loadLiked = async () => {
      try {
        const stored = await AsyncStorage.getItem("liked_brands");
        if (stored) setLikedBrands(JSON.parse(stored));
      } catch (err) {
        console.error("❌ 좋아요 불러오기 실패:", err);
      }
    };
    loadLiked();
  }, []);

  const toggleLike = async (name) => {
    const updated = likedBrands.includes(name)
      ? likedBrands.filter((n) => n !== name)
      : [...likedBrands, name];
    setLikedBrands(updated);
    await AsyncStorage.setItem("liked_brands", JSON.stringify(updated));
  };

  const likedBrandList = brandsData.brands.filter((b) =>
    likedBrands.includes(b.name)
  );

  // ✅ 1시간마다 브랜드 3개 변경
  const [displayBrands, setDisplayBrands] = useState([]);
  useEffect(() => {
    const updateBrands = () => {
      const all = brandsData.brands;
      const hour = new Date().getHours();
      const startIndex = (hour * 3) % all.length;
      const selected = all.slice(startIndex, startIndex + 3);
      setDisplayBrands(
        selected.length < 3
          ? [...selected, ...all.slice(0, 3 - selected.length)]
          : selected
      );
    };

    updateBrands();
    const interval = setInterval(updateBrands, 3600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.logo}>Re:wear</Text>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Ionicons name="person-circle-outline" size={40} color="#23422D" />
          </TouchableOpacity>
        </View>

        {/* 오늘의 알림 */}
        <View style={styles.card}>
          <Text style={styles.title}>오늘의 알림</Text>
        </View>

        {/* 케어라벨 */}
        <View style={[styles.card, { paddingVertical: 22 }]}>
          <Text style={[styles.title, { marginBottom: 14 }]}>케어라벨 검색</Text>
          <View style={[styles.row, { marginTop: 4 }]}>
            <TouchableOpacity
              style={styles.iconBox}
              onPress={() => Alert.alert("라벨 촬영", "카메라 기능은 준비 중입니다.")}
            >
              <Ionicons name="camera-outline" size={32} color="#000" />
              <Text style={styles.iconText}>라벨 촬영하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBox}
              onPress={() => router.push("/carelabel")}
            >
              <Ionicons name="hand-left-outline" size={32} color="#000" />
              <Text style={styles.iconText}>직접 선택하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 옷장 미리보기 */}
        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <Text style={styles.title}>옷을 추가해 보세요!</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/closet")}>
              <Ionicons name="add-circle-outline" size={26} color="#1C7C54" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {closetItems.map((cloth) => (
              <Image
                key={cloth.id}
                source={{ uri: `${BASE_URL}/uploads/clothes/${cloth.image_path}` }}
                style={styles.clothImg}
              />
            ))}
          </ScrollView>
        </View>

        {/* 이번 주 캘린더 */}
        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <Text style={styles.title}>이번 주 캘린더</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/calendar")}>
              <Ionicons name="add-circle-outline" size={26} color="#1C7C54" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {weekDates.map((date) => {
              const dayName = new Date(date).toLocaleDateString("ko-KR", {
                weekday: "short",
              });
              const isToday = date === new Date().toISOString().split("T")[0];
              const dots = calendarDots[date]?.dots || [];

              return (
                <TouchableOpacity
                  key={date}
                  style={styles.weekCell}
                  onPress={() => handleDatePress(date)}
                >
                  <Text
                    style={[
                      styles.weekDay,
                      isToday && { color: "#23422D", fontWeight: "bold" },
                    ]}
                  >
                    {dayName}
                  </Text>
                  <Text style={styles.weekDate}>{date.split("-")[2]}</Text>
                  <View style={styles.dotContainer}>
                    {dots.map((d, i) => (
                      <View
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: d.color,
                          marginHorizontal: 1,
                        }}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 🌱 오늘의 환경 뉴스 */}
        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <Text style={styles.title}>오늘의 환경 뉴스</Text>
            <TouchableOpacity onPress={loadNews} disabled={loadingNews}>
              <Animated.View style={{ transform: [{ rotate: spinAnimation }] }}>
                <Ionicons
                  name="refresh-outline"
                  size={22}
                  color={loadingNews ? "#999" : "#1C7C54"}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {news.map((a, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => openLink(a.url)}
                style={{
                  width: 280,
                  marginRight: 12,
                  backgroundColor: "#f5f9f6",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#23422D",
                  }}
                  numberOfLines={2}
                >
                  {a.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 👗 슬로우패션 브랜드 추천 */}
        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <View>
              <Text style={styles.title}>슬로우패션 브랜드</Text>
              <Text style={{ color: "#c0b4b4ff", fontSize: 13 }}>
                1시간마다 브랜드가 바뀝니다.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setLikedPopupVisible(true)}
              style={{
                backgroundColor: "#e8f5e9df",
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: "#000", fontSize: 12 }}>
                좋아요 누른 브랜드 보기
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.brandRow}>
            {displayBrands.map((brand, idx) => {
              const isLiked = likedBrands.includes(brand.name);
              return (
                <View key={idx} style={styles.brandCard}>
                  <TouchableOpacity
                    onPress={() => openLink(brand.url)}
                    style={{ alignItems: "center" }}
                  >
                    <Image
                      source={{ uri: brand.image }}
                      style={styles.brandImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.brandName}>{brand.name}</Text>
                    <Text style={styles.brandDesc} numberOfLines={2}>
                      {brand.desc}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleLike(brand.name)}
                    style={{ position: "absolute", top: 8, right: 8 }}
                  >
                    <Ionicons
                      name={isLiked ? "heart" : "heart-outline"}
                      size={22}
                      color={isLiked ? "#E91E63" : "#888"}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ❤️ 좋아요 팝업 */}
      <Modal visible={likedPopupVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPressOut={() => setLikedPopupVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.likedModal}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.modalTitle}>내가 좋아요한 브랜드</Text>
                  <TouchableOpacity onPress={() => setLikedPopupVisible(false)}>
                    <Ionicons name="close" size={24} color="#23422D" />
                  </TouchableOpacity>
                </View>

                {likedBrandList.length === 0 ? (
                  <Text
                    style={{
                      color: "#666",
                      textAlign: "center",
                      marginTop: 20,
                    }}
                  >
                    좋아요한 브랜드가 없습니다.
                  </Text>
                ) : (
                  <ScrollView style={{ marginTop: 12 }}>
                    {likedBrandList.map((brand, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => openLink(brand.url)}
                        style={styles.likedBrandRow}
                      >
                        <Image
                          source={{ uri: brand.image }}
                          style={styles.likedBrandImage}
                          resizeMode="contain"
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.likedBrandName}>{brand.name}</Text>
                        </View>
                        <TouchableOpacity onPress={() => toggleLike(brand.name)}>
                          <Ionicons
                            name={
                              likedBrands.includes(brand.name)
                                ? "heart"
                                : "heart-outline"
                            }
                            size={22}
                            color={
                              likedBrands.includes(brand.name)
                                ? "#E91E63"
                                : "#888"
                            }
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 📅 캘린더 모달 */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPressOut={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>
                  {selectedDate ? `${selectedDate}의 기록` : "기록 없음"}
                </Text>
                {selectedEvents.length === 0 ? (
                  <Text style={{ textAlign: "center", color: "#555" }}>
                    기록이 없습니다.
                  </Text>
                ) : (
                  selectedEvents.map((event, idx) => (
                    <View key={idx} style={styles.eventItem}>
                      <Text style={styles.eventType}>
                        {event.type === "wear"
                          ? "👕 착용"
                          : event.type === "wash"
                          ? "🧺 세탁"
                          : "📦 기타"}
                      </Text>
                      {event.description && (
                        <Text style={styles.eventDesc}>
                          메모: {event.description}
                        </Text>
                      )}
                      {event.clothes && (
                        <View style={styles.clothRow}>
                          {event.clothes.image_url && (
                            <Image
                              source={{ uri: event.clothes.image_url }}
                              style={styles.eventImage}
                            />
                          )}
                          <Text style={styles.clothName}>
                            {event.clothes.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f0f2f5" },
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: { fontSize: 36, fontWeight: "bold", color: "#2e7d32" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#2e7d32" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  iconBox: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    paddingVertical: 16,
    marginHorizontal: 6,
  },
  iconText: { marginTop: 6, fontSize: 13, fontWeight: "500" },
  clothImg: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  weekCell: { alignItems: "center", flex: 1 },
  weekDay: { fontSize: 14, color: "#555" },
  weekDate: { fontSize: 16, color: "#222", marginTop: 4 },
  dotContainer: { flexDirection: "row", marginTop: 4 },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  brandCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    width: "31%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  brandImage: { width: 60, height: 60, borderRadius: 8, marginBottom: 8 },
  brandName: { fontWeight: "700", color: "#23422D", fontSize: 14 },
  brandDesc: { fontSize: 12, color: "#555", textAlign: "center", marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  likedModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "65%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 10,
    textAlign: "left",
  },
  likedBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9faf9",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  likedBrandImage: { width: 50, height: 50, borderRadius: 8 },
  likedBrandName: { fontSize: 15, fontWeight: "600", color: "#23422D" },
  eventItem: {
    marginBottom: 14,
    backgroundColor: "#f8f9f8",
    borderRadius: 12,
    padding: 12,
  },
  eventType: { fontSize: 16, fontWeight: "600", color: "#23422D" },
  eventDesc: { fontSize: 13, color: "#444", marginTop: 4 },
  clothRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  eventImage: { width: 50, height: 50, borderRadius: 8, marginRight: 10 },
  clothName: { fontSize: 14, color: "#222", fontWeight: "500" },
});
