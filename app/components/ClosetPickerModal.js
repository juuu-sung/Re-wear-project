import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImageRatio from "./ImageRatio";   

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function ClosetPickerModal({
  visible,
  onClose,
  closetItems = [],
  onSelectCloth,
}) {
  const [categories, setCategories] = useState(["상의", "하의", "아우터"]);
  const [selected, setSelected] = useState("상의");

    
  useEffect(() => {
    if (visible) {
      (async () => {
        const saved = await AsyncStorage.getItem("categories");
        if (saved) {
          const list = JSON.parse(saved);
          setCategories([...new Set(["상의", "하의", "아우터", ...list])]);
        } else {
          setCategories(["상의", "하의", "아우터"]);
        }
      })();
    }
  }, [visible]);

  const filtered = closetItems.filter((item) => item.category === selected);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 제목 */}
          <Text style={styles.title}>옷 선택</Text>

          {/* 카테고리 탭 */}
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
                  onPress={() => setSelected(cat)}
                >
                  <Text style={[styles.tabText, selected === cat && styles.activeText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.divider} />
          </View>

          {/* 옷 목록 */}
          <ScrollView contentContainerStyle={styles.grid}>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => onSelectCloth(item)}
                >
                  {item.image_path ? (
                    <ImageRatio
                      source={{
                        uri: `${BASE_URL}/uploads/clothes/${item.image_path}`,
                      }}
                      style={styles.image}
                      fit="cover"
                    />
                  ) : (
                    <View style={styles.noImageBox}>
                      <Text style={{ color: "#aaa" }}>이미지 없음</Text>
                    </View>
                  )}
                  <Text style={styles.itemName}>{item.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>등록된 {selected}가 없습니다.</Text>
            )}
          </ScrollView>

          {/* 닫기 */}
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
    marginBottom: 8,
  },

  categoryContainer: {
    marginBottom: 8,
  },

  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },

  tab: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
  },

  activeTab: {
    backgroundColor: "#23422D",
    borderColor: "#23422D",
  },

  tabText: { color: "#777", fontSize: 15 },
  activeText: { color: "#fff", fontWeight: "600" },

  divider: {
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginTop: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
    paddingBottom: 20,
  },

    
  card: {
    width: "47%",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },

    
  image: {
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
  },

  noImageBox: {
    width: "100%",
    height: 130,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },

  itemName: {
    textAlign: "center",
    fontWeight: "600",
    paddingVertical: 8,
    color: "#23422D",
  },

  emptyText: {
    textAlign: "center",
    color: "#777",
    marginTop: 20,
    width: "100%",
  },

  closeBtn: {
    marginTop: 10,
    alignSelf: "center",
  },
  closeText: {
    color: "#23422D",
    fontWeight: "700",
    fontSize: 16,
  },
});
