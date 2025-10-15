import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function ClosetMain() {
  const [selected, setSelected] = useState("상의");
  const [items, setItems] = useState([]);
  const [userName, setUserName] = useState("");
  const [categories, setCategories] = useState(["상의", "하의", "아우터"]);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();

  // ✅ 사용자 이름 + 카테고리 불러오기
  useEffect(() => {
    const init = async () => {
      try {
        const rawName =
          (await AsyncStorage.getItem("name")) ||
          (await AsyncStorage.getItem("username"));
        if (rawName) setUserName(rawName);
        else setUserName("사용자");

        const saved = await AsyncStorage.getItem("categories");
        if (saved) {
          const list = JSON.parse(saved);
          setCategories([...new Set(["상의", "하의", "아우터", ...list])]);
        }
      } catch (err) {
        console.log("❌ 사용자 이름 불러오기 실패:", err);
        setUserName("사용자");
      } finally {
        setLoadingUser(false);
      }
    };
    init();
  }, []);

  // ✅ 카테고리 추가
  const addCategory = () => {
    Alert.prompt("새 옷장 추가", "추가할 옷장 이름을 입력하세요.", async (text) => {
      const name = text?.trim();
      if (!name) return;
      if (categories.includes(name)) {
        Alert.alert("중복된 이름", `"${name}"은 이미 존재합니다.`);
        return;
      }
      const updated = [...categories, name];
      setCategories(updated);
      await AsyncStorage.setItem("categories", JSON.stringify(updated));
      Alert.alert("추가 완료", `"${name}" 옷장이 추가되었습니다.`);
    });
  };

  // ✅ 카테고리 길게 누르면 삭제 or 수정 선택
  const handleCategoryLongPress = (name) => {
    if (["상의", "하의", "아우터"].includes(name)) {
      Alert.alert("기본 옷장은 수정/삭제할 수 없습니다.");
      return;
    }

    Alert.alert(
      `"${name}" 옷장 관리`,
      "원하는 작업을 선택하세요.",
      [
        {
          text: "이름 수정 ✏️",
          onPress: () => {
            Alert.prompt(
              "옷장 이름 수정",
              `"${name}" 옷장의 새 이름을 입력하세요.`,
              async (text) => {
                const newName = text?.trim();
                if (!newName) return;
                if (categories.includes(newName)) {
                  Alert.alert("중복된 이름", `"${newName}"은 이미 존재합니다.`);
                  return;
                }

                const updated = categories.map((c) => (c === name ? newName : c));
                setCategories(updated);
                await AsyncStorage.setItem("categories", JSON.stringify(updated));

                if (selected === name) setSelected(newName);

                Alert.alert("수정 완료", `"${name}" → "${newName}"으로 변경되었습니다.`);
              }
            );
          },
        },
        {
          text: "삭제 ❌",
          style: "destructive",
          onPress: async () => {
            const updated = categories.filter((c) => c !== name);
            setCategories(updated);
            await AsyncStorage.setItem("categories", JSON.stringify(updated));

            if (selected === name) setSelected("상의");

            Alert.alert("삭제 완료", `"${name}" 옷장이 삭제되었습니다.`);
          },
        },
        { text: "취소", style: "cancel" },
      ]
    );
  };

  // ✅ 옷 목록 불러오기
  const loadClothes = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return;
      const res = await fetch(`${BASE_URL}/clothes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const filtered = data.filter((i) => i.category === selected);
        setItems(filtered);
      }
    } catch (err) {
      console.error("❌ 서버 연결 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClothes();
  }, [selected]);

  useFocusEffect(
    useCallback(() => {
      loadClothes();
    }, [selected])
  );

  // ✅ FAB 애니메이션
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    if (currentY > lastScrollY.current + 10) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 50, duration: 250, useNativeDriver: true }),
      ]).start();
    } else if (currentY < lastScrollY.current - 10) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
    lastScrollY.current = currentY;
  };

  if (loadingUser) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#23422D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerText}>{userName}의 옷장</Text>
      </View>

      {/* ✅ 카테고리 목록 */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, selected === cat && styles.activeTab]}
              onPress={() => setSelected(cat)} // 짧게: 선택
              onLongPress={() => handleCategoryLongPress(cat)} // 길게: 수정 or 삭제
            >
              <Text style={[styles.tabText, selected === cat && styles.activeText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addTabBtn} onPress={addCategory}>
            <Ionicons name="add" size={20} color="#000" />
          </TouchableOpacity>
        </ScrollView>

        {/* ✅ 회색 구분선 */}
        <View style={styles.divider} />
      </View>

      {/* ✅ 옷 목록 or 없음 문구 */}
      {loading ? (
        <ActivityIndicator size="large" color="#23422D" style={{ marginTop: 40 }} />
      ) : items.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.grid}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/closet/detail",
                  params: {
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    image: `${BASE_URL}/uploads/clothes/${item.image_path}`,
                  },
                })
              }
            >
              {item.image_path ? (
                <Image
                  source={{ uri: `${BASE_URL}/uploads/clothes/${item.image_path}` }}
                  style={styles.image}
                />
              ) : (
                <View
                  style={[
                    styles.image,
                    { justifyContent: "center", alignItems: "center" },
                  ]}
                >
                  <Ionicons name="shirt-outline" size={40} color="#ccc" />
                </View>
              )}
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>등록된 {selected}가 없습니다.</Text>
      )}

      {/* ✅ 추가 버튼 */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={() =>
            Animated.spring(scaleAnim, { toValue: 1.1, useNativeDriver: true }).start()
          }
          onPressOut={() => {
            Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
            setTimeout(() => router.push("/(tabs)/closet/add"), 80);
          }}
          style={styles.fab}
        >
          <Ionicons name="add" size={36} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 5,
    alignItems: "flex-start",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#23422D",
  },
  categoryContainer: {
    marginTop: 8,
    marginBottom: 10,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginTop: 4,
  },
  tab: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  activeTab: { backgroundColor: "#23422D", borderColor: "#23422D" },
  tabText: { color: "#777", fontSize: 15 },
  activeText: { color: "#fff", fontWeight: "600" },
  addTabBtn: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 20,
    padding: 8,
    marginLeft: 5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100,
  },
  card: {
    width: "47%",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 20,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: { width: "100%", height: 150, borderRadius: 8 },
  name: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
    marginTop: 8,
    color: "#23422D",
  },
  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 30,
    fontSize: 16,
  },
  fabContainer: { position: "absolute", bottom: 30, right: 25 },
  fab: {
    backgroundColor: "#23422D",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
});
