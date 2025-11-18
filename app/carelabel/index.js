import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { bleachLabels } from "./bleachLabels";
import CareLabelModal from "./CareLabelModal";
import { dryLabels } from "./dryLabels";
import { ironLabels } from "./ironLabels";
import { tumbleLabels } from "./tumbleLabels";
import { washLabels } from "./washLabels";

export default function CareLabelScreen() {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(null);

  const labelCategories = [
    { key: "wash", name: "물세탁", color: "#2E7D32", labels: washLabels },
    { key: "bleach", name: "표백", color: "#419D68", labels: bleachLabels },
    { key: "iron", name: "다림질", color: "#5CBF8B", labels: ironLabels },
    { key: "dry", name: "건조", color: "#8AD0AF", labels: dryLabels },
    { key: "tumble", name: "드라이", color: "#B4E4D1", labels: tumbleLabels },
  ];

  const toggleExpand = (key) => {
    setExpandedCategory(expandedCategory === key ? null : key);
  };

  // 🔹 4개씩 나누기 함수 (13개 → [4,4,4,1])
  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: "케어라벨 선택",
          headerTintColor: "#2E7D32",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#f0f2f5" },
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!selectedLabel} // ✅ 모달 열릴 때 스크롤 잠금
      >
        <View style={styles.innerWrapper}>
          <Text style={styles.title}>세탁 라벨 선택</Text>

          {labelCategories.map((cat) => {
            const isExpanded = expandedCategory === cat.key;
            const previewLabels = cat.labels.slice(0, 4);

            return (
              <View
                key={cat.key}
                style={[styles.card, { borderColor: cat.color }]}
              >
                {/* 🔹 헤더 */}
                <View style={styles.headerRow}>
                  <Text
                    style={[styles.categoryTitle, { color: cat.color }]}
                  >
                    {cat.name}
                  </Text>
                  <TouchableOpacity onPress={() => toggleExpand(cat.key)}>
                    <Ionicons
                      name={
                        isExpanded
                          ? "remove-circle-outline"
                          : "add-circle-outline"
                      }
                      size={26}
                      color={cat.color}
                    />
                  </TouchableOpacity>
                </View>

                {/* 🔹 기본 4개 미리보기 */}
                <View style={styles.row}>
                  {previewLabels.map((l) => (
                    <TouchableOpacity
                      key={`${cat.key}-${l.id}`}
                      onPress={() => setSelectedLabel(l)}
                      style={styles.thumbBox}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={l.img}
                        style={styles.thumb}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 🔹 확장 시 전체 (4+4+4+1 자동 왼쪽정렬 & 간격 정렬선 일치) */}
                {isExpanded && cat.labels.length > 0 && (
                  <View style={styles.expandWrapper}>
                    {chunkArray(cat.labels, 4).map((group, idx) => (
                      <View
                        key={`${cat.key}-row-${idx}`}
                        style={[
                          styles.gridRow,
                          group.length < 4 && {
                            justifyContent: "flex-start",
                            marginLeft: 4, // ✅ 왼쪽선 보정
                          },
                        ]}
                      >
                        {group.map((l) => (
                          <TouchableOpacity
                            key={`${cat.key}-${l.id}`}
                            onPress={() => setSelectedLabel(l)}
                            style={styles.labelBox}
                            activeOpacity={0.7}
                          >
                            <Image
                              source={l.img}
                              style={styles.image}
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 🔹 모달 */}
        <CareLabelModal
          label={selectedLabel}
          onClose={() => setSelectedLabel(null)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, paddingHorizontal: 16 },
  innerWrapper: { marginTop: 10 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderColor: "#E0E8E1",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start", // ✅ 위 줄도 같은 기준선 시작
    gap: 12, // ✅ 간격 일정하게
    alignItems: "center",
    marginTop: 5,
  },
  thumbBox: {
    width: 70,
    height: 70,
    backgroundColor: "#f8faf7",
    borderWidth: 1,
    borderColor: "#E0E8E1",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  thumb: { width: 60, height: 60 },
  expandWrapper: { marginTop: 8 },
  gridRow: {
    flexDirection: "row",
    justifyContent: "flex-start", // ✅ 모든 줄 같은 기준선
    gap: 12, // ✅ 위/아래 줄 간격 동일
    marginBottom: 10,
  },
  labelBox: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#f8faf7",
    borderWidth: 1,
    borderColor: "#E0E8E1",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: 60, height: 60 },
});
