import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ImageRatio from "../../components/ImageRatio";

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function ClosetMain() {
  const [selected, setSelected] = useState("상의");
  const [items, setItems] = useState([]);
  const [userName, setUserName] = useState("");
  const [categories, setCategories] = useState(["상의", "하의", "아우터"]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();

   
  useEffect(() => {
    const init = async () => {
      try {
        const rawName =
          (await AsyncStorage.getItem("name")) ||
          (await AsyncStorage.getItem("username"));
        setUserName(rawName ? rawName : "사용자");

        const saved = await AsyncStorage.getItem("categories");
        if (saved) {
          const list = JSON.parse(saved);
          setCategories([...new Set(["상의", "하의", "아우터", ...list])]);
        }
      } catch {
        setUserName("사용자");
      } finally {
        setLoadingUser(false);
      }
    };
    init();
  }, []);

   
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

   
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadClothes();
    } finally {
      setRefreshing(false);
    }
  }, [selected]);

   
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

   
  const handleCategoryLongPress = (name) => {
    if (["상의", "하의", "아우터"].includes(name)) {
      Alert.alert("기본 옷장은 수정/삭제할 수 없습니다.");
      return;
    }

    Alert.alert(`"${name}" 옷장 관리`, "원하는 작업을 선택하세요.", [
      {
        text: "이름 수정",
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
        text: "삭제",
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
    ]);
  };

  if (loadingUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#18b36a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{userName}의 옷장</Text>
            <Text style={styles.headerSubtitle}>오늘도 옷장 정리를 통해 지구를 지켜보세요.</Text>
          </View>
        </View>

        {/* 카테고리 */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.sectionLabel}>카테고리</Text>
            <TouchableOpacity style={styles.categoryAddBtn} onPress={addCategory}>
              <Ionicons name="add" size={16} color="#0f7a4c" />
              <Text style={styles.categoryAddText}>새 옷장</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.tab,
                  selected === cat ? styles.activeTab : styles.inactiveTab,
                ]}
                onPress={() => setSelected(cat)}
                onLongPress={() => handleCategoryLongPress(cat)}
              >
                <Text
                  style={[styles.tabText, selected === cat && styles.activeText]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 옷 리스트 */}
        {loading ? (
          <ActivityIndicator size="large" color="#18b36a" style={styles.listLoader} />
        ) : items.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.grid}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {items.map((item) => {
              const imgUri = item.image_path
                ? `${BASE_URL}/uploads/clothes/${encodeURIComponent(item.image_path)}`
                : null;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/closet/detail",
                      params: {
                        id: String(item.id),
                        name: item.name,
                        category: item.category,
                        image: `${BASE_URL}/uploads/clothes/${item.image_path}`,
                        material: item.material ?? "",
                        washing: item.washing_info ?? "",
                        materialBreakdown: item.material_breakdown ?? "",
                      },
                    })
                  }
                >
                  {imgUri ? (
                    <ImageRatio source={{ uri: imgUri }} style={styles.image} fit="cover" />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                      <Ionicons name="shirt-outline" size={40} color="#b0d8c5" />
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.badge}>
                      <Ionicons name="leaf-outline" color="#0f7a4c" size={14} />
                      <Text style={styles.badgeText}>{item.category}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.emptyCard}>
            <Ionicons name="shirt-outline" size={26} color="#18b36a" />
              <Text style={styles.emptyText}>등록된 {selected}가 없습니다.</Text>
              <Text style={styles.emptySub}>
                자주 입는 옷부터 천천히 추가해보세요.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/(tabs)/closet/add")}
              >
                <Text style={styles.emptyButtonText}>새 옷 등록</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* + 버튼 */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(tabs)/closet/add")}
            style={styles.fab}
          >
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  container: { flex: 1, padding: 18, backgroundColor: "#ffffff" },
  centered: { justifyContent: "center", alignItems: "center" },

  header: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: "#e6f7ef",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  headerLabel: { color: "#4a8a68", fontSize: 13, fontWeight: "600" },
  headerTitle: { color: "#0f4228", fontSize: 24, fontWeight: "800", marginTop: 2 },
  headerSubtitle: { color: "#4a8a68", marginTop: 6, fontSize: 14 },
  headerAction: {
    backgroundColor: "#d4f1e0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerActionText: { color: "#0f7a4c", fontWeight: "600" },

  categorySection: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: "#3d4d42",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: { color: "#526057", fontSize: 15, fontWeight: "600" },
  categoryAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eefaf3",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  categoryAddText: { color: "#0f7a4c", fontSize: 13, fontWeight: "600" },

  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  inactiveTab: {
    backgroundColor: "#f1f5f2",
  },
  activeTab: {
    backgroundColor: "#18b36a",
    shadowColor: "#18b36a",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  tabText: { color: "#5a6b61", fontSize: 14, fontWeight: "500" },
  activeText: { color: "#fff", fontWeight: "600" },

  listLoader: { marginTop: 40 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 120,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e8f1ea",
    shadowColor: "#90a29a",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#eef7f1",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  name: { flex: 1, fontWeight: "700", fontSize: 15, color: "#10281c" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e1f6eb",
  },
  badgeText: { color: "#0f7a4c", fontSize: 12, fontWeight: "600" },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#dcefe4",
  },
  emptyText: { color: "#143520", fontSize: 17, fontWeight: "700" },
  emptySub: { color: "#5b6f63", textAlign: "center", fontSize: 14 },
  emptyButton: {
    marginTop: 10,
    backgroundColor: "#18b36a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyButtonText: { color: "#fff", fontWeight: "700" },

  fabContainer: {
    position: "absolute",
    bottom: 30,
    right: 25,
    zIndex: 999,
    elevation: 10,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#18b36a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1b9155",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
  },
});
