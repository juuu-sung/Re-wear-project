import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image } from "expo-image";
import brandsData from "../../assets/data/slowfashion_brands.json";


 
 
 
const openLink = async (url) => {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch (error) {
    console.log("브라우저 열기 실패:", error);
  }
};


 
 
 
const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef(null);

   
  const [userId, setUserId] = useState(null);
  const [closetItems, setClosetItems] = useState([]);
  const [calendarDots, setCalendarDots] = useState({});
  const [weekDates, setWeekDates] = useState([]);
  const [allEvents, setAllEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [todayAlerts, setTodayAlerts] = useState([]);
  const [userName, setUserName] = useState("사용자");

  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [likedBrands, setLikedBrands] = useState([]);
  const [likedPopupVisible, setLikedPopupVisible] = useState(false);

  const [displayBrands, setDisplayBrands] = useState([]);

   
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


   
   
   
  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("user_id");
      if (id) setUserId(Number(id));

      const rawName =
        (await AsyncStorage.getItem("name")) ||
        (await AsyncStorage.getItem("username"));
      if (rawName && rawName.trim()) {
        setUserName(rawName.trim());
      } else {
        setUserName("사용자");
      }
    };
    loadUser();
  }, []);


   
   
   
  useEffect(() => {
    const loadLikedFromServer = async () => {
      const myId = await AsyncStorage.getItem("user_id");
      const token = await AsyncStorage.getItem("access_token");

      if (!myId || !token) {
        setLikedBrands([]);
        return;
      }

      try {
        const res = await fetch(
          `${BASE_URL}/v1/brands/liked?user_id=${myId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(data.items)
            ? data.items
            : [];

        setLikedBrands(list);
      } catch (err) {
        console.log("좋아요 브랜드 로드 실패:", err);
        setLikedBrands([]);
      }
    };

    loadLikedFromServer();
  }, []);


   
   
   
  const toggleLike = async (name) => {
    const myId = await AsyncStorage.getItem("user_id");
    const token = await AsyncStorage.getItem("access_token");

    const already = likedBrands.includes(name);

    if (already) {
      await fetch(`${BASE_URL}/v1/brands/like`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: myId, brand_name: name }),
      });

      setLikedBrands(likedBrands.filter((n) => n !== name));
    } else {
      await fetch(`${BASE_URL}/v1/brands/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: myId, brand_name: name }),
      });

      setLikedBrands([...likedBrands, name]);
    }
  };
  const likedBrandList = brandsData.brands.filter((b) =>
    likedBrands.includes(b.name)
  );


   const loadTodayAlerts = async () => {
    if (!userId) return;

    try {
      const token = await AsyncStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await fetch(`${BASE_URL}/alerts/today?user_id=${userId}`, { headers });

      if (!res.ok) {
        const bodyText = await res.text();
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${bodyText}`);
      }

      const data = await res.json();
      setTodayAlerts(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.log("오늘의 알림 로드 실패:", err);
    }
  };

  const loadClosetPreview = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await fetch(`${BASE_URL}/clothes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const sorted = data.sort((a, b) => b.id - a.id);
      setClosetItems(sorted.slice(0, 5));
    } catch (err) {
      console.log("옷장 로드 실패:", err);
    }
  };


   
   
   
  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - day);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);

      const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

      week.push(localDate);
    }
    setWeekDates(week);
  }, []);


   
   
   
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
      const wearDates = Array.isArray(data.wear) ? data.wear : [];
      const washDates = Array.isArray(data.wash) ? data.wash : [];

      wearDates.forEach((d) => {
        const key = d.split("T")[0];
        formatted[key] = { dots: [{ color: "#2E7D32" }] };
      });

      washDates.forEach((d) => {
        const key = d.split("T")[0];
        if (formatted[key]) formatted[key].dots.push({ color: "#1565C0" });
        else formatted[key] = { dots: [{ color: "#1565C0" }] };
      });

      setCalendarDots(formatted);

      const res2 = await fetch(`${BASE_URL}/events?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const eventData = await res2.json();

      const grouped = {};
      eventData.forEach((e) => {
        const date = e.date.split("T")[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(e);
      });

      setAllEvents(grouped);
    } catch (err) {
      console.log("캘린더 로드 실패:", err);
    }
  };


   
   
   
  const handleDatePress = (date) => {
    const events = allEvents[date] || [];
    setSelectedDate(date);
    setSelectedEvents(events);
    setModalVisible(true);
  };


   
   
   
 
const completeNewsMission = async () => {
  if (!userId) return;

  const dateKey = `daily_mission_date_${userId}`;
  const missionKey = `daily_missions_${userId}`;

  const today = new Date().toISOString().split("T")[0];
  const storedDate = await AsyncStorage.getItem(dateKey);
  const missionsRaw = await AsyncStorage.getItem(missionKey);

  if (!storedDate || !missionsRaw) return;
  if (storedDate !== today) return;  

  const missions = JSON.parse(missionsRaw);
  const target = missions.find((m) => m.key === "read_news");

   
  if (target && target.done) {
    console.log("📰 '환경 뉴스' 미션 이미 완료됨");
    return;
  }

   
  const updated = missions.map((m) =>
    m.key === "read_news" ? { ...m, done: true } : m
  );

  await AsyncStorage.setItem(missionKey, JSON.stringify(updated));
  console.log("🎉 '환경 뉴스' 미션 완료됨");
};


  const loadNews = async () => {
    try {
      setLoadingNews(true);
      spin();
      const res = await axios.get(`${BASE_URL}/v1/news?refresh=${Date.now()}`);
      setNews(res.data);
    } catch (err) {
      console.log("뉴스 로드 실패:", err);
    } finally {
      setLoadingNews(false);
    }
  };


  useEffect(() => {
    if (!userId) return;

    loadNews();
    const interval = setInterval(loadNews, 12 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);


  useEffect(() => {
    const interval = setInterval(() => {
      setNews((current) => [...current].sort(() => Math.random() - 0.5));
    }, 15000);
    return () => clearInterval(interval);
  }, []);


   
   
   
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


   
   
   
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;

      loadClosetPreview();
      loadCalendarPreview();
      loadTodayAlerts();
    }, [userId])
  );


   
   
   
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadTodayAlerts(),
      loadClosetPreview(),
      loadCalendarPreview(),
    ]);
    loadNews();
    setRefreshing(false);
  };


   
   
   
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.topBar}>
          <Text style={styles.logo}>Re:wear</Text>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Ionicons name="person-circle-outline" size={38} color="#0f4228" />
          </TouchableOpacity>
        </View>

        {/* 헤더 */}
        <View style={{ marginBottom: 18 }}>
          <View style={styles.heroAlertBox}>
            <View style={styles.heroAlertHeader}>
              <Text style={styles.heroAlertTitle}>오늘의 알림</Text>
              <TouchableOpacity onPress={() => router.push("/alert-detail")}>
                <Text style={styles.heroAlertAction}>더보기</Text>
              </TouchableOpacity>
            </View>

            {todayAlerts.length === 0 ? (
              <Text style={styles.heroAlertText}>
                오늘은 세탁이 필요한 옷이 없어요.
              </Text>
            ) : (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.heroAlertSub}>
                  오늘은 세탁이 필요한 옷이 {todayAlerts.length}개 있어요.
                </Text>
                {todayAlerts.slice(0, 3).map((item, idx) => (
                  <Text key={idx} style={styles.heroAlertList}>
                    · {item.name} ({item.wear_count}회 착용)
                  </Text>
                ))}
                {todayAlerts.length > 3 && (
                  <Text style={styles.heroAlertMore}>
                    · 외 {todayAlerts.length - 3}개
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>


        {/* 케어라벨 */}
        <View style={[styles.card, { paddingVertical: 22 }]}>
          <Text style={[styles.title, { marginBottom: 14 }]}>케어라벨 검색</Text>
          <View style={[styles.row, { marginTop: 4 }]}>
            <TouchableOpacity
              style={styles.iconBox}
              onPress={() => router.push("/scan")}
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


        {/* 옷장 */}
        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <Text style={styles.title}>옷을 추가해 보세요!</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/closet")}>
              <Ionicons name="add-circle-outline" size={26} color="#1C7C54" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.closetRow}
          >
            {closetItems.map((cloth) => (
              <Image
                key={cloth.id}
                source={`${BASE_URL}/uploads/clothes/${cloth.image_path}`}
                style={styles.clothImg}
                contentFit="cover"
                cachePolicy="memory-disk"
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
                style={[styles.weekCell, isToday && styles.weekCellToday]}
                onPress={() => handleDatePress(date)}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.weekDay,
                    isToday && styles.weekDayToday,
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


        {/* 뉴스 */}
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newsRow}
          >
            {news.map((n, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={async () => {
                  await completeNewsMission();    
                  openLink(n.url);                
                }}
                style={styles.newsCard}
              >
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {n.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>


        {/* 브랜드 */}
        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <View>
              <Text style={styles.title}>슬로우패션 브랜드</Text>
              <Text style={{ color: "#aaa", fontSize: 13 }}>
                1시간마다 브랜드가 바뀝니다.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setLikedPopupVisible(true)}
              style={styles.likedBtn}
            >
              <Text style={styles.likedBtnText}>좋아요 누른 브랜드 보기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.brandRow}>
            {displayBrands.map((brand, idx) => {
              const isLiked = likedBrands.includes(brand.name);

              return (
                <View key={idx} style={styles.brandCard}>
                  <TouchableOpacity onPress={() => openLink(brand.url)}>
                    <Image
                      source={brand.image}
                      style={styles.brandImage}
                      contentFit="contain"
                      cachePolicy="memory-disk"
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



      {/* 좋아요 브랜드 팝업 */}
      <Modal visible={likedPopupVisible} transparent animationType="slide">
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
                    <Ionicons name="close" size={24} color="#0f4228" />
                  </TouchableOpacity>
                </View>

                {likedBrandList.length === 0 ? (
                  <Text style={{ textAlign: "center", color: "#666", marginTop: 20 }}>
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
                          source={brand.image}
                          style={styles.likedBrandImage}
                          contentFit="cover"
                          cachePolicy="memory-disk"
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


      {/* 캘린더 상세 모달 */}
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
                          ? "  세탁"
                          : "📦 기타"}
                      </Text>

                      {event.description && (
                        <Text style={styles.eventDesc}>메모: {event.description}</Text>
                      )}

                      {event.clothes && (
                        <View style={styles.clothRow}>
                          {event.clothes.image_url && (
                            <Image
                              source={event.clothes.image_url}
                              style={styles.eventImage}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                            />
                          )}
                          <Text style={styles.clothName}>{event.clothes.name}</Text>
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
  safe: { flex: 1, backgroundColor: "#ffffff" },
  container: { flex: 1 },
  content: { padding: 18, paddingBottom: 40 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: { fontSize: 34, fontWeight: "800", color: "#1c5c36" },
  heroCard: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    gap: 16,
    marginBottom: 18,
  },
  heroLabel: { color: "#4a8a68", fontSize: 13, fontWeight: "600" },
  heroTitle: { color: "#0f4228", fontSize: 24, fontWeight: "800", marginTop: 4 },
  heroSubtitle: { color: "#4a8a68", marginTop: 6, fontSize: 14, lineHeight: 20 },
  heroStatsContainer: {
    flexDirection: "row",
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dbeee3",
    overflow: "hidden",
  },
  heroStatBox: {
    flex: 1,
    backgroundColor: "#f5fffa",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  heroStatLeft: {
    borderRightWidth: 1,
    borderRightColor: "#dbeee3",
  },
  heroStatRight: {},
  heroStatLabel: { color: "#5a6b61", fontSize: 12, fontWeight: "600" },
  heroStatValue: { color: "#0f4228", fontSize: 24, fontWeight: "800", marginTop: 4 },
  heroAlertBox: {
    marginTop: 18,
    backgroundColor: "#f5fffa",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbeee3",
  },
  heroAlertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  heroAlertTitle: { color: "#0f4228", fontSize: 16, fontWeight: "700" },
  heroAlertAction: { color: "#0f7a4c", fontWeight: "700", fontSize: 13 },
  heroAlertText: { color: "#4a5f53", fontSize: 14, marginTop: 4 },
  heroAlertSub: { color: "#4a5f53", fontSize: 14, marginBottom: 6 },
  heroAlertList: { color: "#0f4228", fontSize: 13, marginBottom: 4 },
  heroAlertMore: { color: "#5c6f63", fontSize: 13, marginTop: 2 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e6efe7",
    shadowColor: "#1d2a23",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0f4228" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  iconBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#d6eadd",
  },
  iconText: { marginTop: 8, fontSize: 13, fontWeight: "600", color: "#0f4228" },
  clothImg: {
    width: 92,
    height: 92,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#eef6f0",
    borderWidth: 1,
    borderColor: "#deece3",
  },
  closetRow: { paddingTop: 12, paddingBottom: 4 },

  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  weekCell: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  weekCellToday: {
    backgroundColor: "#e6f8ee",
    borderColor: "#c5e8d4",
  },
  weekDay: { fontSize: 13, color: "#6b736f" },
  weekDayToday: { color: "#0f7a4c", fontWeight: "700" },
  weekDate: { fontSize: 16, color: "#13261b", marginTop: 4, fontWeight: "700" },
  dotContainer: { flexDirection: "row", marginTop: 6 },

  newsRow: { paddingTop: 12 },
  newsCard: {
    width: 280,
    marginRight: 14,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#d9f0e1",
  },
  newsTitle: { fontSize: 16, fontWeight: "700", color: "#0f4228", lineHeight: 22 },

  brandRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  brandCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    width: "31%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0ebe4",
    shadowColor: "#152218",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  brandImage: { width: 64, height: 64, borderRadius: 10, marginBottom: 8, backgroundColor: "#fff" },
  brandName: { fontWeight: "700", color: "#0f4228", fontSize: 14, textAlign: "center" },
  brandDesc: { fontSize: 12, color: "#5b6f63", textAlign: "center", marginTop: 4 },

  likedBtn: {
    backgroundColor: "#eef9f3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  likedBtnText: { color: "#0f7a4c", fontSize: 12, fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  likedModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: "65%",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: "60%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0f4228", marginBottom: 12 },

  likedBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fbf9",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0ebe4",
  },
  likedBrandImage: { width: 52, height: 52, borderRadius: 10, backgroundColor: "#fff" },
  likedBrandName: { fontSize: 15, fontWeight: "600", color: "#0f4228" },

  eventItem: {
    marginBottom: 14,
    backgroundColor: "#f6fbf8",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e1efe6",
  },
  eventType: { fontSize: 16, fontWeight: "600", color: "#0f4228" },
  eventDesc: { fontSize: 13, color: "#4c5b52", marginTop: 4 },
  clothRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  eventImage: { width: 52, height: 52, borderRadius: 10, marginRight: 10, backgroundColor: "#fff" },
  clothName: { fontSize: 14, color: "#13261b", fontWeight: "600" },
});
