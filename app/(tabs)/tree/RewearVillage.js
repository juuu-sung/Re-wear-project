// ===============================================================
// RewearVillage.js — DAILY MISSION + 게임 화면 전체
// ===============================================================

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// 🔥 서버 URL 적용
const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const TOP_RATIO = 0.65;
const BOTTOM_RATIO = 1 - TOP_RATIO;
const TOP_H = SCREEN_H * TOP_RATIO;

// ======================================================
// ⭐ DAILY MISSION TAB
// ======================================================
function DailyMissionTab({ userRP, setUserRP, selectedTab }) {
  const [missions, setMissions] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("user_id");
      if (id) setUserId(id);
    })();
  }, []);

  // 기본 미션 목록
  const FIXED_MISSIONS = [
    { id: 1, title: "1회 접속", key: "login", reward: 10 },
    { id: 2, title: "캘린더에 착용기록 추가하기", key: "add_wear", reward: 30 },
    { id: 3, title: "캘린더에 세탁기록 추가하기", key: "add_wash", reward: 50 },
    { id: 4, title: "옷장에 옷 등록하기", key: "add_cloth", reward: 40 },
    { id: 5, title: "세탁 라벨 검색하기", key: "scan_label", reward: 40 },
    { id: 6, title: "친구들 맵에 추가(제거)하기", key: "touch_friends", reward: 20 },
    { id: 7, title: "오늘의 환경뉴스 읽기", key: "read_news", reward: 30 },
  ];

  // ✅ 유저/탭 상태에 따라 미션 초기화 & 리로드
  useEffect(() => {
    if (!userId) return;
    if (selectedTab !== "mission") return; // 미션 탭일 때만 동작

    const init = async () => {
      const today = new Date().toISOString().split("T")[0];

      const storedDate = await AsyncStorage.getItem(
        `daily_mission_date_${userId}`
      );
      const saved = await AsyncStorage.getItem(`daily_missions_${userId}`);

      if (storedDate !== today || !saved) {
        const newList = FIXED_MISSIONS.map((m) => ({
          ...m,
          done: m.key === "login", // 접속 미션은 자동 완료
          claimed: false,
        }));

        await AsyncStorage.setItem(
          `daily_missions_${userId}`,
          JSON.stringify(newList)
        );
        await AsyncStorage.setItem(`daily_mission_date_${userId}`, today);
        setMissions(newList);
      } else {
        setMissions(JSON.parse(saved));
      }
    };

    init();
  }, [userId, selectedTab]);

  // ⭐ 미션 보상 받기
  const claimReward = async (mission) => {
    if (!mission.done || mission.claimed) return;

    const newRP = userRP + mission.reward;

    // 1) 프론트 로컬 저장
    setUserRP(newRP);
    await AsyncStorage.setItem("user_rp", String(newRP));

    // 2) 서버(DB)에 저장
    const userId = await AsyncStorage.getItem("user_id");
    await fetch(`${BASE_URL}/v1/game/rp/set?user_id=${userId}&rp=${newRP}`, {
      method: "POST",
    });

    const updated = missions.map((m) =>
      m.id === mission.id ? { ...m, claimed: true } : m
    );

    setMissions(updated);
    await AsyncStorage.setItem(
      `daily_missions_${userId}`,
      JSON.stringify(updated)
    );

    Alert.alert("미션 완료!", `+${mission.reward} RP 획득!`);
  };

  // ⭐ 모두 받기
  const claimAll = async () => {
    const claimable = missions.filter((m) => m.done && !m.claimed);
    if (claimable.length === 0)
      return Alert.alert("알림", "받을 보상이 없습니다!");

    const total = claimable.reduce((acc, m) => acc + m.reward, 0);
    const newRP = userRP + total;

    // 1) 프론트 로컬 저장
    setUserRP(newRP);
    await AsyncStorage.setItem("user_rp", String(newRP));

    // 2) 서버(DB)에 저장
    const userId = await AsyncStorage.getItem("user_id");
    await fetch(`${BASE_URL}/v1/game/rp/set?user_id=${userId}&rp=${newRP}`, {
      method: "POST",
    });

    const updated = missions.map((m) =>
      m.done ? { ...m, claimed: true } : m
    );

    setMissions(updated);
    await AsyncStorage.setItem(
      `daily_missions_${userId}`,
      JSON.stringify(updated)
    );

    Alert.alert("🎁 모두 받기 완료!", `총 +${total} RP`);
  };

  return (
    <View style={{ marginTop: 10 }}>
      <View style={styles.missionHeader}>
        <Text style={styles.missionTitle}>일일 미션</Text>

        <TouchableOpacity style={styles.allClaimBtn} onPress={claimAll}>
          <Ionicons name="gift-outline" size={18} color="#fff" />
          <Text style={{ color: "#fff", marginLeft: 6, fontWeight: "600" }}>
            모두 받기
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {missions.map((m) => (
          <View key={m.id} style={styles.missionRow}>
            <View>
              <Text style={styles.missionName}>{m.title}</Text>
              <Text style={styles.missionReward}>{m.reward} RP</Text>
            </View>

            <TouchableOpacity
              disabled={!m.done || m.claimed}
              onPress={() => claimReward(m)}
              style={[
                styles.rewardBtn,
                m.claimed && { backgroundColor: "#bbb" },
                !m.done && { backgroundColor: "#ccc" },
              ]}
            >
              <Text style={styles.rewardText}>
                {m.claimed ? "완료" : m.done ? "보상 받기" : "미완료"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ===============================================================
// RewearVillage — MAIN SCREEN
// ===============================================================
export default function RewearVillage() {
  const BG_PATH = require("../../../assets/game/grass.png");
  const TWINKLE_PATH = require("../../../assets/game/twinkle.json");

  const [isNight, setIsNight] = useState(false);
  const [userRP, setUserRP] = useState(500);

  const [ownedAnimals, setOwnedAnimals] = useState([]);
  const [ownedObjects, setOwnedObjects] = useState([]);
  const [activeAnimals, setActiveAnimals] = useState([]);

  const [selectedTab, setSelectedTab] = useState("shop");

  const [balloons, setBalloons] = useState({});
  const [stars, setStars] = useState([]);
  const [directions, setDirections] = useState([]);

  const positions = useRef({}).current;

  const [placedObjects, setPlacedObjects] = useState([]);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [scaleValue, setScaleValue] = useState(1);

  // ⭐ 백엔드: 동물 상태 저장
  const saveActiveAnimals = async (updated) => {
    const userId = await AsyncStorage.getItem("user_id");
    if (!userId) return;

    await fetch(`${BASE_URL}/v1/game/active/set?user_id=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  // ======================================================
  // ⭐ SHOP ITEM LIST
  // ======================================================
  const shopItems = [
    { id: 1, type: "animal", name: "브로콜리", desc: "건강한 마을 주민!", price: 0, anim: require("../../../assets/game/walk_broccoli.json") },
    { id: 2, type: "animal", name: "강아지", desc: "활발한 친구!", price: 400, anim: require("../../../assets/game/walk_dog.json") },
    { id: 3, type: "animal", name: "꿀벌", desc: "언제나 분주한 일꾼!", price: 0, anim: require("../../../assets/game/walk_bee.json") },
    { id: 4, type: "animal", name: "원숭이", desc: "장난꾸러기!", price: 0, anim: require("../../../assets/game/walk_monkey.json") },
    { id: 5, type: "animal", name: "토끼", desc: "귀여운 친구!", price: 0, anim: require("../../../assets/game/walk_rabbit.json") },
    { id: 6, type: "animal", name: "여우", desc: "영리한 사냥꾼!", price: 0, anim: require("../../../assets/game/walk_fox.json") },
    { id: 7, type: "animal", name: "아보카도", desc: "건강한 미식가!", price: 0, anim: require("../../../assets/game/walk_avocado.json") },
    { id: 8, type: "animal", name: "오렌지", desc: "상큼한 에너지!", price: 0, anim: require("../../../assets/game/walk_orange.json") },
    { id: 9, type: "animal", name: "강아지2", desc: "멋진 강아지!", price: 0, anim: require("../../../assets/game/walk_dog2.json") },
    { id: 10, type: "animal", name: "새", desc: "귀여운 새!", price: 0, anim: require("../../../assets/game/walk_bird.json") },
    { id: 11, type: "animal", name: "말", desc: "빠른 말!", price: 0, anim: require("../../../assets/game/walk_horse.json") },
    { id: 12, type: "animal", name: "새2", desc: "꽃을 전달하는 새!", price: 0, anim: require("../../../assets/game/peace.json") },

    { id: 101, type: "object", name: "완두콩", desc: "귀여운 완두!", price: 0, anim: require("../../../assets/game/peas.json") },
    { id: 102, type: "object", name: "점퍼", desc: "귀염뽀짝 점퍼!", price: 0, anim: require("../../../assets/game/jump_pear.json") },
    { id: 103, type: "object", name: "바나나", desc: "노랗고 매력적!", price: 0, anim: require("../../../assets/game/banana.json") },
    { id: 104, type: "object", name: "장미", desc: "흩날리는 장미", price: 0, anim: require("../../../assets/game/rose.json") },
    { id: 105, type: "object", name: "트리", desc: "크리스마스다!", price: 0, anim: require("../../../assets/game/christmas-tree.json") },
    { id: 106, type: "object", name: "벌", desc: "물리면 아파요!", price: 0, anim: require("../../../assets/game/bee.json") },
    { id: 107, type: "object", name: "토네이도", desc: "바람이 슝슝!", price: 0, anim: require("../../../assets/game/tornado.json") },
    
  ];

  // ======================================================
  // ⭐ 백엔드에서 초기 데이터 로드 (RP 포함)
  // ======================================================
  useEffect(() => {
    const loadAll = async () => {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) return;

      const res = await fetch(`${BASE_URL}/v1/game/load/${userId}`);
      const data = await res.json();

      setOwnedAnimals(data.ownedAnimals || []);
      setOwnedObjects(data.ownedObjects || []);
      setPlacedObjects(data.placedObjects || []);
      setActiveAnimals(data.activeAnimals || []);

      // 서버 RP → 프론트 반영
      if (data.rp !== undefined) {
        setUserRP(data.rp);
        await AsyncStorage.setItem("user_rp", String(data.rp));
      }
    };

    loadAll();
  }, []);

  // ======================================================
  // ⭐ DAY/NIGHT 모드 변경
  // ======================================================
  useEffect(() => {
    const updateMode = () => {
      const now = new Date();
      const hour = (now.getUTCHours() + 9) % 24; // KST
      setIsNight(hour < 6 || hour >= 18);
    };

    updateMode();
    const timer = setInterval(updateMode, 60000);
    return () => clearInterval(timer);
  }, []);

  // ======================================================
  // ⭐ ACTIVE ANIMAL MOVEMENT
  // ======================================================
  useEffect(() => {
    activeAnimals.forEach((id, idx) => {
      if (!positions[id]) {
        positions[id] = new Animated.ValueXY({
          x: SCREEN_W * (0.2 + 0.15 * (idx % 5)),
          y: TOP_H * 0.6,
        });
      }
    });

    setDirections((prev) => {
      const copy = { ...prev };
      activeAnimals.forEach((id) => {
        if (!copy[id]) copy[id] = 1;
      });
      return copy;
    });

    activeAnimals.forEach((id) => {
      const pos = positions[id];
      if (!pos) return;

      const loopMove = () => {
        const dx = (Math.random() - 0.5) * 200;
        const dy = (Math.random() - 0.5) * 80;
        const duration = (isNight ? 4500 : 3000) + Math.random() * 2000;

        pos.flattenOffset();
        const nextX = Math.max(40, Math.min(SCREEN_W - 100, pos.x._value + dx));
        const nextY = Math.max(
          TOP_H * 0.2,
          Math.min(TOP_H * 0.85, pos.y._value + dy)
        );

        setDirections((prev) => ({ ...prev, [id]: dx >= 0 ? 1 : -1 }));

        Animated.timing(pos, {
          toValue: { x: nextX, y: nextY },
          duration,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => {
          if (activeAnimals.includes(id)) loopMove();
        });
      };

      if (!pos._isMoving) {
        pos._isMoving = true;
        loopMove();
      }
    });
  }, [activeAnimals, isNight]);

  const handleAnimalPress = (id) => {
    setBalloons((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setBalloons((prev) => ({ ...prev, [id]: false }));
    }, 1500);
  };

  // ======================================================
  // ⭐ TOUCH → 별 생성 OR 구조물 설치
  // ======================================================
  const handleTouch = (e) => {
    const { locationX, locationY } = e.nativeEvent;

    if (locationY > TOP_H) return;

    // 구조물 설치 모드
    if (pendingPlacement) {
      const newObj = {
        id: Date.now(),
        object_id: pendingPlacement.id,
        x: locationX,
        y: locationY,
        scale: scaleValue,
      };

      setPlacedObjects((prev) => [...prev, newObj]);
      setPendingPlacement(null);
      Alert.alert(`${pendingPlacement.name} 설치 완료!`);
      return;
    }

    // 별 생성
    if (!isNight) return;

    const opacity = new Animated.Value(1);
    const size = 700;

    const newStar = {
      id: Date.now(),
      x: locationX,
      y: locationY,
      size,
      opacity,
    };

    setStars((prev) => [...prev, newStar]);

    Animated.timing(opacity, {
      toValue: 0,
      duration: 3500,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start(() => {
      setStars((prev) => prev.filter((s) => s.id !== newStar.id));
    });
  };

  // ======================================================
  // ⭐ PURCHASE (포인트 DB 저장도 함께 적용)
  // ======================================================
  const handlePurchase = async (item) => {
    const currentRP = parseInt(
      (await AsyncStorage.getItem("user_rp")) || "500",
      10
    );

    if (item.type === "animal" && ownedAnimals.includes(item.id)) return;
    if (item.type === "object" && ownedObjects.includes(item.id)) return;

    if (currentRP < item.price) {
      Alert.alert("RP 부족", "포인트가 부족해요!");
      return;
    }

    const newRP = currentRP - item.price;

    // 1) 프론트 저장
    await AsyncStorage.setItem("user_rp", newRP.toString());
    setUserRP(newRP);

    // 2) 서버 저장
    const userId = await AsyncStorage.getItem("user_id");
    await fetch(`${BASE_URL}/v1/game/rp/set?user_id=${userId}&rp=${newRP}`, {
      method: "POST",
    });

    // 구매 처리
    if (item.type === "animal") {
      await fetch(
        `${BASE_URL}/v1/game/buy/animal?user_id=${userId}&animal_id=${item.id}`,
        {
          method: "POST",
        }
      );
      setOwnedAnimals((prev) => [...prev, item.id]);
      Alert.alert(`${item.name} 구매 완료!`);
    } else if (item.type === "object") {
      await fetch(
        `${BASE_URL}/v1/game/buy/object?user_id=${userId}&object_id=${item.id}`,
        {
          method: "POST",
        }
      );
      setOwnedObjects((prev) => [...prev, item.id]);
      setSelectedTab("decorate");
      setPendingPlacement(item);
      Alert.alert(`${item.name} 설치 위치를 선택하세요!`);
    }
  };

  // ======================================================
  // ⭐ 친구 미션
  // ======================================================
  const completeFriendMission = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const userId = await AsyncStorage.getItem("user_id");

      if (!userId) return;

      const dateKey = `daily_mission_date_${userId}`;
      const missionKey = `daily_missions_${userId}`;

      const storedDate = await AsyncStorage.getItem(dateKey);
      const missionsRaw = await AsyncStorage.getItem(missionKey);

      if (!missionsRaw || storedDate !== today) return;

      const missionsData = JSON.parse(missionsRaw);
      const target = missionsData.find((m) => m.key === "touch_friends");

      if (target?.done) return;

      const updated = missionsData.map((m) =>
        m.key === "touch_friends" ? { ...m, done: true } : m
      );

      await AsyncStorage.setItem(missionKey, JSON.stringify(updated));
      Alert.alert("미션 완료!", "'친구들 맵에 추가하기' 완료!");
    } catch (err) {
      console.error("❌ 친구 미션 처리 오류:", err);
    }
  };

  // ======================================================
  // ⭐ 동물 맵 추가/제거
  // ======================================================
  const handleAddToMap = async (id) => {
    completeFriendMission();

    let updated;

    if (activeAnimals.includes(id)) {
      updated = activeAnimals.filter((a) => a !== id);
      setActiveAnimals(updated);
    } else {
      if (activeAnimals.length >= 5)
        return Alert.alert("제한", "맵에는 최대 5마리까지 표시할 수 있어요!");

      updated = [...activeAnimals, id];
      setActiveAnimals(updated);
    }

    await saveActiveAnimals(updated);
  };

  // ======================================================
  // ⭐ 구조물 제거
  // ======================================================
  const handleLongPressObject = (objId) => {
    Alert.alert("삭제", "이 구조물을 제거할까요?", [
      { text: "취소" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () =>
          setPlacedObjects((prev) => prev.filter((o) => o.id !== objId)),
      },
    ]);
  };

  // ======================================================
  // ⭐ RENDER
  // ======================================================
  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPressIn={handleTouch}>
        <View style={styles.topVillage}>
          <Image source={BG_PATH} style={styles.bgFill} />
          {isNight && <View style={styles.nightOverlay} />}

          {stars.map((s) => (
            <Animated.View
              key={s.id}
              style={{
                position: "absolute",
                top: s.y - s.size / 2,
                left: s.x - s.size / 2,
                opacity: s.opacity,
                zIndex: 9999,
              }}
            >
              <LottieView
                source={TWINKLE_PATH}
                autoPlay
                loop={false}
                style={{ width: s.size, height: s.size }}
              />
            </Animated.View>
          ))}

          {placedObjects.map((obj) => {
            const item = shopItems.find((i) => i.id === obj.object_id);
            if (!item) return null;

            return (
              <TouchableWithoutFeedback
                key={obj.id}
                onLongPress={() => handleLongPressObject(obj.id)}
              >
                <View
                  style={{
                    position: "absolute",
                    top: obj.y - 40,
                    left: obj.x - 40,
                    transform: [{ scale: obj.scale }],
                  }}
                >
                  <LottieView
                    source={item.anim}
                    autoPlay
                    loop
                    style={{ width: 100, height: 100 }}
                  />
                </View>
              </TouchableWithoutFeedback>
            );
          })}

          {activeAnimals.map((id) => {
            const animal = shopItems.find((a) => a.id === id);
            const pos = positions[id];
            if (!animal || !pos) return null;

            return (
              <TouchableWithoutFeedback
                key={id}
                onPress={() => handleAnimalPress(id)}
              >
                <Animated.View
                  style={[
                    styles.animalContainer,
                    { transform: [...pos.getTranslateTransform()] },
                  ]}
                >
                  {balloons[id] && (
                    <View style={styles.bubbleOverlay}>
                      <Text style={styles.bubbleText}>{animal.name}!</Text>
                    </View>
                  )}

                  <View style={{ transform: [{ scaleX: directions[id] || 1 }] }}>
                    <LottieView
                      source={animal.anim}
                      autoPlay
                      loop
                      style={{ width: 90, height: 90 }}
                    />
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            );
          })}

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{activeAnimals.length}/5</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* BOTTOM PANEL */}
      <View style={styles.bottomShop}>
        <View style={styles.tabHeader}>
          <View style={{ flexDirection: "row" }}>
            {["shop", "owned", "decorate", "mission"].map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setSelectedTab(tab)}>
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab && styles.tabActive,
                  ]}
                >
                  {tab === "shop"
                    ? "상점"
                    : tab === "owned"
                    ? "내친구들"
                    : tab === "decorate"
                    ? "꾸미기"
                    : "일일미션"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rpContainer}>
            <Text style={styles.rpText}>{userRP.toLocaleString()} RP</Text>
            <Ionicons
              name="cash-outline"
              color="#333"
              size={18}
              style={{ marginLeft: 6 }}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          {/* SHOP TAB */}
          {selectedTab === "shop" &&
            shopItems.map((item) => {
              const owned =
                (item.type === "animal" && ownedAnimals.includes(item.id)) ||
                (item.type === "object" && ownedObjects.includes(item.id));

              return (
                <View key={item.id} style={styles.shopItem}>
                  <LottieView
                    source={item.anim}
                    autoPlay
                    loop
                    style={{ width: 54, height: 54 }}
                  />

                  <View style={{ flex: 1, marginHorizontal: 8 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDesc}>{item.desc}</Text>
                    <Text style={styles.itemPrice}>{item.price} RP</Text>
                  </View>

                  <TouchableOpacity
                    disabled={owned}
                    style={[
                      styles.buyButton,
                      owned && { backgroundColor: "#bbb" },
                    ]}
                    onPress={() => handlePurchase(item)}
                  >
                    <Text style={styles.buyText}>
                      {owned ? "구매완료" : "구매"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

          {/* OWNED ANIMALS */}
          {selectedTab === "owned" &&
            (ownedAnimals.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#666", marginTop: 10 }}
              >
                아직 친구들이 없어요.
              </Text>
            ) : (
              ownedAnimals.map((id) => {
                const item = shopItems.find((a) => a.id === id);

                return (
                  <View key={id} style={styles.shopItem}>
                    <LottieView
                      source={item.anim}
                      autoPlay
                      loop
                      style={{ width: 54, height: 54 }}
                    />

                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDesc}>{item.desc}</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.mapToggleBtn,
                        activeAnimals.includes(id) && {
                          backgroundColor: "#F39C12",
                        },
                      ]}
                      onPress={() => handleAddToMap(id)}
                    >
                      <Text style={styles.buyText}>
                        {activeAnimals.includes(id) ? "맵에서 제거" : "맵에 추가"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ))}

          {/* DECORATE TAB */}
          {selectedTab === "decorate" &&
            (ownedObjects.length === 0 ? (
              <Text
                style={{ textAlign: "center", color: "#666", marginTop: 10 }}
              >
                아직 구조물이 없어요.
              </Text>
            ) : (
              ownedObjects.map((id) => {
                const item = shopItems.find((a) => a.id === id);

                return (
                  <View key={id} style={styles.shopItem}>
                    <LottieView
                      source={item.anim}
                      autoPlay
                      loop
                      style={{ width: 54, height: 54 }}
                    />

                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDesc}>{item.desc}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.mapToggleBtn}
                      onPress={() => setPendingPlacement(item)}
                    >
                      <Text style={styles.buyText}>설치하기</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ))}

          {/* DAILY MISSION */}
          {selectedTab === "mission" && (
            <DailyMissionTab
              userRP={userRP}
              setUserRP={setUserRP}
              selectedTab={selectedTab}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ===============================================================
// 🎨 STYLE
// ===============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  topVillage: { height: TOP_H, position: "relative", overflow: "hidden" },

  bgFill: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "stretch",
  },

  nightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,50,0.4)",
  },

  animalContainer: { position: "absolute" },

  bubbleOverlay: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  bubbleText: { fontSize: 13, color: "#333" },

  countBadge: {
    position: "absolute",
    top: 38,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  countText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  bottomShop: {
    height: SCREEN_H * BOTTOM_RATIO,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
  },

  tabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
    marginRight: 14,
  },

  tabActive: { color: "#000", textDecorationLine: "underline" },

  rpContainer: { flexDirection: "row", alignItems: "center" },

  rpText: { fontSize: 16, fontWeight: "700", color: "#333" },

  shopItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 5,
  },

  itemName: { fontSize: 15, fontWeight: "700", color: "#222" },
  itemDesc: { fontSize: 12, color: "#666", marginTop: 2 },
  itemPrice: { fontSize: 12, color: "#444", marginTop: 2 },

  buyButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  mapToggleBtn: {
    backgroundColor: "#4C7AF5",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  buyText: { color: "#fff", fontWeight: "600" },

  missionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  missionTitle: { fontSize: 18, fontWeight: "700", color: "#23422D" },

  allClaimBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  missionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f6f6f6",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 5,
  },

  missionName: { fontSize: 15, fontWeight: "600", color: "#23422D" },
  missionReward: { fontSize: 13, color: "#777", marginTop: 3 },

  rewardBtn: {
    backgroundColor: "#1C7C54",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  rewardText: { color: "#fff", fontWeight: "600" },
});
