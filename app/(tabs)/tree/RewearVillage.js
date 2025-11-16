import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { useFocusEffect } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const TOP_RATIO = 0.65;
const BOTTOM_RATIO = 1 - TOP_RATIO;
const TOP_H = SCREEN_H * TOP_RATIO;

// ✅ 일일미션 탭 컴포넌트
function DailyMissionTab({ userRP, setUserRP }) {
  const [missions, setMissions] = useState([]);

  const FIXED_MISSIONS = [
    { id: 1, title: "1회 접속", key: "login", reward: 10 },
    { id: 2, title: "캘린더에 착용기록 추가하기", key: "add_wear", reward: 30 },
    { id: 3, title: "캘린더에 세탁기록 추가하기", key: "add_wash", reward: 50 },
    { id: 4, title: "옷장에 옷 등록하기", key: "add_cloth", reward: 40 },
    { id: 5, title: "친구들 맵에 추가하기", key: "touch_friends", reward: 20 },
    { id: 6, title: "오늘의 환경뉴스 읽기", key: "read_news", reward: 30 },
  ];

  useEffect(() => {
  const initMissions = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const storedDate = await AsyncStorage.getItem("daily_mission_date");
      const saved = await AsyncStorage.getItem("daily_missions");

      // 🔹 오늘 날짜면: 저장된 미션 그대로 불러옴
      if (storedDate === today && saved) {
        setMissions(JSON.parse(saved));
      } 
      // 🔹 날짜가 바뀌었거나 처음 실행이면: 새로 초기화
      else {
        const list = FIXED_MISSIONS.map((m) => ({
          ...m,
          done: m.key === "login",  // 접속 미션 자동 완료
          claimed: false,
        }));

        await AsyncStorage.setItem("daily_missions", JSON.stringify(list));
        await AsyncStorage.setItem("daily_mission_date", today);
        setMissions(list);
      }
    } catch (err) {
      console.error("❌ 일일미션 초기화 실패:", err);
    }
  };

  // ✅ 최초 실행
  initMissions();

  // ✅ 1분마다 날짜 체크 → 자정 지나면 자동 초기화
  const timer = setInterval(async () => {
    const today = new Date().toISOString().split("T")[0];
    const storedDate = await AsyncStorage.getItem("daily_mission_date");
    if (storedDate !== today) {
      await AsyncStorage.removeItem("daily_missions");
      await AsyncStorage.removeItem("daily_mission_date");
      initMissions();
    }
  }, 60000); // 1분마다 확인

  return () => clearInterval(timer);
}, []);

// ✅ 화면이 다시 포커스될 때 (예: Calendar에서 돌아올 때) 최신 미션 반영
useFocusEffect(
  useCallback(() => {
    const refreshMissions = async () => {
      const stored = await AsyncStorage.getItem("daily_missions");
      if (stored) {
        const parsed = JSON.parse(stored);
        setMissions(parsed);
        console.log("🔄 미션 상태 새로고침됨");
      }
    };
    refreshMissions();
  }, [])
);

// ✅ 개별 보상 수령
const claimReward = async (mission) => {
  if (!mission.done || mission.claimed) return;
  const newRP = userRP + mission.reward;
  setUserRP(newRP);
  await AsyncStorage.setItem("user_rp", String(newRP));

  const updated = missions.map((m) =>
    m.id === mission.id ? { ...m, claimed: true } : m
  );
  setMissions(updated);
  await AsyncStorage.setItem("daily_missions", JSON.stringify(updated));

  Alert.alert("🎉 미션 완료!", `+${mission.reward} RP 획득!`);
};

// ✅ 모두 받기
const claimAll = async () => {
  const claimable = missions.filter((m) => m.done && !m.claimed);
  if (claimable.length === 0)
    return Alert.alert("알림", "받을 수 있는 보상이 없습니다!");

  const total = claimable.reduce((acc, m) => acc + m.reward, 0);
  const newRP = userRP + total;
  setUserRP(newRP);
  await AsyncStorage.setItem("user_rp", String(newRP));

  const updated = missions.map((m) =>
    m.done ? { ...m, claimed: true } : m
  );
  setMissions(updated);
  await AsyncStorage.setItem("daily_missions", JSON.stringify(updated));

  Alert.alert("🎁 모두 받기 완료!", `총 +${total} RP 적립되었습니다!`);
};

  return (
    <View style={{ marginTop: 10 }}>
      <View style={styles.missionHeader}>
        <Text style={styles.missionTitle}>🌞 일일 미션</Text>
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

export default function RewearVillage() {
  const BG_PATH = require("../../../assets/game/grass.png");
  const TWINKLE_PATH = require("../../../assets/game/twinkle.json");

  const [isNight, setIsNight] = useState(false);
  const [userRP, setUserRP] = useState(500);
  const [missions, setMissions] = useState([]); // ✅ 미션 상태를 상위에서 관리

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

  const shopItems = [
    { id: 1, type: "animal", name: "브로콜리", desc: "건강한 마을 주민!", price: 0, anim: require("../../../assets/game/walk_broccoli.json") },
    { id: 2, type: "animal", name: "강아지", desc: "활발한 친구!", price: 0, anim: require("../../../assets/game/walk_dog.json") },
    { id: 3, type: "animal", name: "꿀벌", desc: "언제나 분주한 일꾼!", price: 0, anim: require("../../../assets/game/walk_bee.json") },
    { id: 4, type: "animal", name: "원숭이", desc: "장난꾸러기!", price: 0, anim: require("../../../assets/game/walk_monkey.json") },
    { id: 5, type: "animal", name: "토끼", desc: "귀엽고 빠른 친구!", price: 0, anim: require("../../../assets/game/walk_rabbit.json") },
    { id: 6, type: "animal", name: "여우", desc: "영리한 사냥꾼!", price: 0, anim: require("../../../assets/game/walk_fox.json") },
    { id: 7, type: "animal", name: "아보카도", desc: "건강한 미식가!", price: 0, anim: require("../../../assets/game/walk_avocado.json") },
    { id: 8, type: "animal", name: "오렌지", desc: "상큼한 에너지!", price: 0, anim: require("../../../assets/game/walk_orange.json") },
    { id: 9, type: "animal", name: "강아지2", desc: "멋진 강아지!", price: 0, anim: require("../../../assets/game/walk_dog2.json") },
    { id: 10, type: "animal", name: "새", desc: "귀여운 새 친구!", price: 0, anim: require("../../../assets/game/walk_bird.json") },

    { id: 101, type: "object", name: "완두콩", desc: "귀여운 완두!", price: 0, anim: require("../../../assets/game/peas.json") },
    { id: 102, type: "object", name: "점퍼", desc: "귀염뽀짝 점퍼!", price: 0, anim: require("../../../assets/game/jump_pear.json") },
    { id: 103, type: "object", name: "바나나", desc: "노랗고 매력적인 조형물!", price: 0, anim: require("../../../assets/game/banana.json") },
  ];

  // ✅ RP 자동 불러오기
  useEffect(() => {
    const loadRP = async () => {
      const stored = await AsyncStorage.getItem("user_rp");
      if (stored) setUserRP(parseInt(stored, 10));
      else await AsyncStorage.setItem("user_rp", "500");
    };
    loadRP();
    const interval = setInterval(loadRP, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🌞 낮/밤 모드
  useEffect(() => {
    const updateMode = () => {
      const now = new Date();
      const hour = (now.getUTCHours() + 9) % 24;
      setIsNight(hour < 6 || hour >= 18);
    };
    updateMode();
    const timer = setInterval(updateMode, 60000);
    return () => clearInterval(timer);
  }, []);

  // 🧭 동물 이동 유지
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
      const updated = { ...prev };
      activeAnimals.forEach((id) => {
        if (!updated[id]) updated[id] = 1;
      });
      return updated;
    });
    activeAnimals.forEach((id) => {
      const current = positions[id];
      if (!current) return;
      const loopMove = () => {
        const randomDX = (Math.random() - 0.5) * 200;
        const randomDY = (Math.random() - 0.5) * 80;
        const duration = (isNight ? 4500 : 3000) + Math.random() * 2000;
        current.flattenOffset();
        let nextX = Math.max(40, Math.min(SCREEN_W - 100, current.x._value + randomDX));
        let nextY = Math.max(TOP_H * 0.2, Math.min(TOP_H * 0.85, current.y._value + randomDY));
        setDirections((prev) => ({ ...prev, [id]: randomDX >= 0 ? 1 : -1 }));
        Animated.timing(current, {
          toValue: { x: nextX, y: nextY },
          duration,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => {
          if (activeAnimals.includes(id)) loopMove();
        });
      };
      if (!current._isMoving) {
        current._isMoving = true;
        loopMove();
      }
    });
  }, [activeAnimals, isNight]);

  // 💬 말풍선
  const handleAnimalPress = (id) => {
    setBalloons((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setBalloons((prev) => ({ ...prev, [id]: false })), 1500);
  };

  // 🌟 밤 하늘 별
  const handleTouch = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    if (locationY > TOP_H) return;
    if (pendingPlacement) {
      const newObj = {
        id: Date.now(),
        item: pendingPlacement,
        x: locationX,
        y: locationY,
        scale: scaleValue,
      };
      setPlacedObjects((prev) => [...prev, newObj]);
      setPendingPlacement(null);
      Alert.alert(`${newObj.item.name} 설치 완료!`);
      return;
    }
    if (!isNight) return;
    const opacity = new Animated.Value(1);
    const starSize = 700;
    const newStar = { id: Date.now(), x: locationX, y: locationY, opacity, size: starSize };
    setStars((prevStars) => [...prevStars, { ...newStar }]);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 3500,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start(() => {
      setStars((prevStars) => prevStars.filter((s) => s.id !== newStar.id));
    });
  };

  // 🛍 구매
  const handlePurchase = async (item) => {
    const currentRP = parseInt((await AsyncStorage.getItem("user_rp")) || "500", 10);
    if (item.type === "animal" && ownedAnimals.includes(item.id)) return;
    if (item.type === "object" && ownedObjects.includes(item.id)) return;
    if (currentRP < item.price) {
      Alert.alert("RP 부족", "포인트가 부족해요!");
      return;
    }
    const newRP = currentRP - item.price;
    await AsyncStorage.setItem("user_rp", newRP.toString());
    setUserRP(newRP);
    if (item.type === "animal") {
      setOwnedAnimals((prev) => [...prev, item.id]);
      Alert.alert(`${item.name} 구매 완료!`, `-${item.price} RP 차감`);
    } else if (item.type === "object") {
      setOwnedObjects((prev) => [...prev, item.id]);
      setSelectedTab("decorate");
      setPendingPlacement(item);
      Alert.alert(`${item.name} 설치 위치를 선택하세요!`, `-${item.price} RP 차감`);
    }
  };

  // ✅ '친구' 미션 완료 처리
// ✅ '친구들' 미션 완료 처리 (하루 1회만)
const completeFriendMission = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const storedDate = await AsyncStorage.getItem("daily_mission_date");
    const missionsRaw = await AsyncStorage.getItem("daily_missions");

    if (!storedDate || !missionsRaw) return;
    if (storedDate !== today) return; // 날짜가 바뀌면 무시

    const missionsData = JSON.parse(missionsRaw);
    const target = missionsData.find((m) => m.key === "touch_friends");

    // 이미 완료된 경우 무시
    if (target && target.done) {
      console.log("👥 '친구들 누르기' 미션 이미 완료됨 (오늘 1회 제한)");
      return;
    }

    // ✅ 처음 완료 시 처리
    const updated = missionsData.map((m) =>
      m.key === "touch_friends" ? { ...m, done: true } : m
    );

    await AsyncStorage.setItem("daily_missions", JSON.stringify(updated));
    setMissions(updated);

    // 🎉 하루에 딱 한 번만 알림 표시
    Alert.alert("🎯 미션 완료!", "'친구들 맵에 추가하기' 미션을 달성했습니다!");
    console.log("🎯 '친구들 맵에 추가하기' 미션 완료 처리됨");
  } catch (err) {
    console.error("❌ 친구 미션 처리 실패:", err);
  }
};



  // 🗺 맵 추가/제거
  const handleAddToMap = (id) => {
    completeFriendMission(); 
    if (activeAnimals.includes(id)) setActiveAnimals((prev) => prev.filter((a) => a !== id));
    else {
      if (activeAnimals.length >= 5)
        return Alert.alert("맵에는 최대 5마리까지만 표시할 수 있어요!");
      setActiveAnimals((prev) => [...prev, id]);
    }
  };

  // 🌳 구조물 삭제
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

          {placedObjects.map((obj) => (
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
                  source={obj.item.anim}
                  autoPlay
                  loop
                  style={{ width: 100, height: 100 }}
                />
              </View>
            </TouchableWithoutFeedback>
          ))}

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

      {/* 설치 모드 */}
      {pendingPlacement && (
        <>
          <View
            style={{
              position: "absolute",
              top: SCREEN_H * 0.25,
              right: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 8,
              zIndex: 99,
            }}
          >
            <Text style={{ color: "#fff", marginBottom: 8, fontSize: 13, fontWeight: "600" }}>
              {scaleValue.toFixed(1)}x
            </Text>
            <View
              style={{
                height: SCREEN_H * 0.25,
                width: 40,
                justifyContent: "center",
                alignItems: "center",
                transform: [{ rotate: "270deg" }],
              }}
            >
              <Slider
                style={{ width: SCREEN_H * 0.25 }}
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.1}
                value={scaleValue}
                onValueChange={(val) => setScaleValue(val)}
                minimumTrackTintColor="#FFD700"
                maximumTrackTintColor="#555"
                thumbTintColor="#fff"
              />
            </View>
          </View>

          <View
            style={{
              position: "absolute",
              top: SCREEN_H * 0.33,
              left: SCREEN_W * 0.4,
              transform: [{ scale: scaleValue }],
              opacity: 0.9,
              zIndex: 50,
            }}
          >
            <LottieView
              source={pendingPlacement.anim}
              autoPlay
              loop
              style={{ width: 100, height: 100 }}
            />
          </View>
        </>
      )}

      {/* 하단 탭 */}
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
            <Ionicons name="cash-outline" color="#333" size={18} style={{ marginLeft: 6 }} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
          {/* 상점 */}
          {selectedTab === "shop" &&
            shopItems.map((item) => {
              const alreadyOwned =
                (item.type === "animal" && ownedAnimals.includes(item.id)) ||
                (item.type === "object" && ownedObjects.includes(item.id));
              return (
                <View key={item.id} style={styles.shopItem}>
                  <LottieView source={item.anim} autoPlay loop style={{ width: 54, height: 54 }} />
                  <View style={{ flex: 1, marginHorizontal: 8 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDesc}>{item.desc}</Text>
                    <Text style={styles.itemPrice}>{item.price} RP</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.buyButton,
                      alreadyOwned && { backgroundColor: "#bbb" },
                    ]}
                    disabled={alreadyOwned}
                    onPress={() => handlePurchase(item)}
                  >
                    <Text style={styles.buyText}>
                      {alreadyOwned ? "구매완료" : "구매"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

          {/* 내친구들 */}
          {selectedTab === "owned" &&
            (ownedAnimals.length === 0 ? (
              <Text style={{ textAlign: "center", color: "#666", marginTop: 10 }}>
                아직 친구들이 없어요.
              </Text>
            ) : (
              ownedAnimals.map((id) => {
                const item = shopItems.find((a) => a.id === id);
                return (
                  <View key={id} style={styles.shopItem}>
                    <LottieView source={item.anim} autoPlay loop style={{ width: 54, height: 54 }} />
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDesc}>{item.desc}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.mapToggleBtn, activeAnimals.includes(id) && { backgroundColor: "#F39C12" }]}
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

          {/* 꾸미기 */}
          {selectedTab === "decorate" &&
            (ownedObjects.length === 0 ? (
              <Text style={{ textAlign: "center", color: "#666", marginTop: 10 }}>
                아직 구조물이 없어요.
              </Text>
            ) : (
              ownedObjects.map((id) => {
                const item = shopItems.find((a) => a.id === id);
                return (
                  <View key={id} style={styles.shopItem}>
                    <LottieView source={item.anim} autoPlay loop style={{ width: 54, height: 54 }} />
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDesc}>{item.desc}</Text>
                    </View>
                    <TouchableOpacity style={styles.mapToggleBtn} onPress={() => setPendingPlacement(item)}>
                      <Text style={styles.buyText}>설치하기</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ))}

          {/* 🌞 일일미션 */}
          {selectedTab === "mission" && (
            <DailyMissionTab
              userRP={userRP}
              setUserRP={setUserRP}
              missions={missions}
              setMissions={setMissions} // ✅ 미션 state 내려줌
            />
      )}

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topVillage: { height: TOP_H, position: "relative", overflow: "hidden" },
  bgFill: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%", resizeMode: "stretch" },
  nightOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,50,0.4)" },
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
  tabHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  tabText: { fontSize: 16, fontWeight: "600", color: "#888", marginRight: 14 },
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
  buyButton: { backgroundColor: "#4CAF50", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 },
  mapToggleBtn: { backgroundColor: "#4C7AF5", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 },
  buyText: { color: "#fff", fontWeight: "600" },

  // ✅ 일일미션
  missionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  missionTitle: { fontSize: 18, fontWeight: "700", color: "#23422D" },
  allClaimBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#4CAF50", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  missionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f6f6f6", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginVertical: 5 },
  missionName: { fontSize: 15, fontWeight: "600", color: "#23422D" },
  missionReward: { fontSize: 13, color: "#777", marginTop: 3 },
  rewardBtn: { backgroundColor: "#1C7C54", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  rewardText: { color: "#fff", fontWeight: "600" },
});
