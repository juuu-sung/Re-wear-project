// app/carelabel/[carelabel].js
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CareLabelModal from "./CareLabelModal";
import { washLabels } from "./washLabels";
import { bleachLabels } from "./bleachLabels";

export default function CategoryDetail() {
  const { carelabel } = useLocalSearchParams();
  const [selected, setSelected] = useState(null);

  // 카테고리별 분기 (현재는 물세탁만)
  const labels = carelabel === "wash" ? washLabels : [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{carelabel.toUpperCase()} 라벨 선택</Text>

      <View style={styles.grid}>
        {labels.map((l) => (
          <TouchableOpacity key={l.id} onPress={() => setSelected(l)}>
            <Image source={l.img} style={styles.img} resizeMode="contain" />
          </TouchableOpacity>
        ))}
      </View>

      <CareLabelModal label={selected} onClose={() => setSelected(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#23422D", marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" },
  img: { width: 80, height: 80, borderRadius: 8 },
});
