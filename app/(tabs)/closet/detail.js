// app/(tabs)/closet/detail.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function ClothesDetail() {
  const {
    id,
    name,
    category,
    image,
    material: initMaterial,
    washing: initWashing,
    materialBreakdown: initMaterialBreakdown,
  } = useLocalSearchParams();

  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState(String(name ?? ""));
  const [editedCategory, setEditedCategory] = useState(String(category ?? ""));
  const [imageUri, setImageUri] = useState(String(image ?? ""));

  // ✅ 소재/세탁법 상태
  const parseBreakdown = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(String(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const [material, setMaterial] = useState(() => (initMaterial ? String(initMaterial) : ""));
  const [washingInfo, setWashingInfo] = useState(""); // string 또는 object
  const [materialBreakdown, setMaterialBreakdown] = useState(() => parseBreakdown(initMaterialBreakdown));

  const [categories, setCategories] = useState(["상의", "하의", "아우터"]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const [sortOrder, setSortOrder] = useState("desc");
  const [showAll, setShowAll] = useState(false);

  // ✅ 최초 진입 시 washing 파라미터가 JSON 문자열이면 파싱
  useEffect(() => {
    if (!initWashing) return;
    try {
      const parsed = JSON.parse(String(initWashing));
      setWashingInfo(parsed);
    } catch {
      setWashingInfo(String(initWashing));
    }
  }, [initWashing]);

  useEffect(() => {
    setMaterialBreakdown(parseBreakdown(initMaterialBreakdown));
  }, [initMaterialBreakdown]);

  // ✅ 카테고리 불러오기
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const saved = await AsyncStorage.getItem("categories");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCategories([...new Set(["상의", "하의", "아우터", ...parsed])]);
        }
      } catch {}
    };
    loadCategories();
  }, []);

  // ✅ “이 옷의 기록” 불러오기
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        const userId = await AsyncStorage.getItem("user_id");
        if (!token || !userId || !BASE_URL) return;

        const eventRes = await fetch(`${BASE_URL}/events?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!eventRes.ok) return;

        const eventData = await eventRes.json();
        const filtered = eventData
          .filter((e) => String(e.garment_id) === String(id))
          .map((e) => ({ date: e.date?.split("T")[0], type: e.type }));
        setHistory(filtered);
      } catch (err) {
        console.log("이 옷의 기록 불러오기 실패:", err);
      }
    };
    fetchHistory();
  }, [id]);

  // ✅ 날짜/정렬
  const sortedHistory = [...history].sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    return sortOrder === "asc" ? da - db : db - da;
  });
  const formatDate = (s) => (s ? String(s).replace(/-/g, ".") : "");

  // ✅ 사진 변경
  const changePhoto = async () => {
    const launch = async (mode) => {
      const result =
        mode === "camera"
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const ensure = async (permFn, mode) => {
      const p = await permFn();
      if (!p.granted) {
        Alert.alert("권한 필요", "사진/카메라 접근 권한을 허용해주세요.");
        return;
      }
      await launch(mode);
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["카메라로 촬영", "앨범에서 선택", "취소"], cancelButtonIndex: 2 },
        (i) => {
          if (i === 0) ensure(ImagePicker.requestCameraPermissionsAsync, "camera");
          if (i === 1) ensure(ImagePicker.requestMediaLibraryPermissionsAsync, "library");
        }
      );
    } else {
      Alert.alert("사진 변경", "사용할 방법을 선택하세요", [
        { text: "카메라", onPress: () => ensure(ImagePicker.requestCameraPermissionsAsync, "camera") },
        { text: "앨범", onPress: () => ensure(ImagePicker.requestMediaLibraryPermissionsAsync, "library") },
        { text: "취소", style: "cancel" },
      ]);
    }
  };

  // ✅ AI 재분석
  const analyzeAgain = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return Alert.alert("로그인 필요", "다시 로그인해주세요.");
      if (!BASE_URL) return Alert.alert("설정 오류", "EXPO_PUBLIC_BASE_URL이 비어 있어요.");

      const res = await fetch(`${BASE_URL}/clothes/analyze/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert("분석 실패", data.detail || "서버 오류");

      setMaterial(data.material ?? "");
      setWashingInfo(data.washing ?? "");
      setMaterialBreakdown(
        Array.isArray(data.top5) && data.top5.length
          ? data.top5
          : parseBreakdown(data.material_breakdown)
      );
      Alert.alert("분석 완료", "AI 세탁 가이드를 업데이트했어요.");
    } catch (e) {
      console.error(e);
      Alert.alert("네트워크 오류", String(e?.message || e));
    }
  };

  // ✅ 수정 저장
  const handleUpdate = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return Alert.alert("로그인 필요", "다시 로그인해주세요.");

      const formData = new FormData();
      formData.append("name", editedName);
      formData.append("category", editedCategory);
      formData.append(
        "washing_info",
        typeof washingInfo === "string" ? washingInfo : JSON.stringify(washingInfo || {})
      );

      if (imageUri && !imageUri.startsWith(BASE_URL)) {
        const filename = imageUri.split("/").pop() || `photo_${Date.now()}.jpg`;
        const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
        formData.append("image", {
          uri: imageUri,
          name: filename,
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });
      }

      const res = await fetch(`${BASE_URL}/clothes/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text };
      }

      if (!res.ok) return Alert.alert("오류", data.detail || "수정 실패");

      Alert.alert("수정 완료", `"${editedName}" 정보가 업데이트되었습니다.`);
      setEditMode(false);
      router.replace("/(tabs)/closet");
    } catch (err) {
      console.error("수정 오류:", err);
      Alert.alert("서버 오류", "수정 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 삭제
  const handleDelete = async () => {
    Alert.alert("삭제 확인", `"${name}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("access_token");
            if (!token) return Alert.alert("로그인 필요", "다시 로그인해주세요.");

            const res = await fetch(`${BASE_URL}/clothes/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
              Alert.alert("삭제 완료", `"${name}"이(가) 삭제되었습니다.`);
              router.replace("/(tabs)/closet");
            } else {
              const errData = await res.json();
              Alert.alert("삭제 실패", errData.detail || "삭제 중 오류 발생");
            }
          } catch (err) {
            console.error("삭제 오류:", err);
            Alert.alert("오류", "서버에 연결할 수 없습니다.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 이미지 */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          {editMode && (
            <TouchableOpacity style={styles.editPhotoBtn} onPress={changePhoto}>
              <Ionicons name="create-outline" size={22} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        {/* 이름 / 카테고리 / 소재 */}
        {editMode ? (
          <>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="옷 이름을 입력하세요"
            />

            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catBtn,
                    editedCategory === cat && styles.catBtnActive,
                  ]}
                  onPress={() => setEditedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catText,
                      editedCategory === cat && styles.catTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.name}>{editedName}</Text>
            <Text style={styles.category}>{editedCategory}</Text>

            {/* ✅ 소재 표기 */}
            <View style={styles.materialHeaderRow}>
              <Text style={styles.material}>
                {material ? `주요 소재: ${material}` : "주요 소재 정보 없음"}
              </Text>
              <TouchableOpacity style={styles.reanalyzeBtn} onPress={analyzeAgain}>
                <Ionicons name="sparkles-outline" size={18} color="#2e7d32" />
                <Text style={styles.reanalyzeText}>AI 재분석</Text>
              </TouchableOpacity>
            </View>
            {materialBreakdown.length > 0 && (
              <View style={styles.materialBreakdownBox}>
                {materialBreakdown.map((m, idx) => {
                  const prob = typeof m.prob === "number" ? m.prob : typeof m.confidence === "number" ? m.confidence : 0;
                  return (
                    <Text key={`${m.name ?? idx}-${idx}`} style={styles.materialBreakdownItem}>
                      • {m.name ?? "-"} ({Math.round(prob * 100)}%)
                    </Text>
                  );
                })}
              </View>
            )}

            {/* 세탁법 */}
            <View style={styles.washDisplay}>
              <Ionicons name="water-outline" size={20} color="#2e7d32" style={{ marginRight: 6 }} />
              <Text style={styles.washText}>
                {washingInfo
                  ? typeof washingInfo === "string"
                    ? washingInfo
                    : `세탁: ${washingInfo.wash ?? "-"}\n` +
                      `건조: ${washingInfo.dry ?? "-"}\n` +
                      `다림질: ${washingInfo.iron ?? "-"}\n` +
                      `표백: ${washingInfo.bleach ?? "-"}`
                  : "세탁법을 입력하거나 AI가 분석하면 여기에 표시됩니다."}
              </Text>
            </View>

            {/* 기록 */}
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>이 옷의 기록</Text>
                <TouchableOpacity onPress={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}>
                  <Ionicons
                    name={sortOrder === "desc" ? "arrow-down-outline" : "arrow-up-outline"}
                    size={20}
                    color="#2e7d32"
                  />
                </TouchableOpacity>
              </View>

              {history.length === 0 ? (
                <Text style={styles.historyEmpty}>아직 기록이 없습니다.</Text>
              ) : (
                (showAll ? sortedHistory : sortedHistory.slice(0, 3)).map((event, idx) => (
                  <View key={`${event.date}-${event.type}-${idx}`} style={styles.historyItem}>
                    <Ionicons
                      name={event.type === "wear" ? "shirt-outline" : "water-outline"}
                      size={18}
                      color={event.type === "wear" ? "#2E8B57" : "#1565C0"}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.historyText}>
                      {formatDate(event.date)} — {event.type === "wear" ? "착용" : "세탁"}
                    </Text>
                  </View>
                ))
              )}

              {sortedHistory.length > 3 && (
                <TouchableOpacity onPress={() => setShowAll(!showAll)} style={styles.moreBtn}>
                  <Text style={styles.moreBtnText}>
                    {showAll ? "접기 ▲" : `더보기 (${sortedHistory.length - 3}개) ▼`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* 하단 버튼들 */}
        <View style={styles.btnRow}>
          {editMode ? (
            <>
              <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                <View style={styles.textButton}>
                  <Ionicons name="checkmark" size={20} color="#000" />
                  <Text style={styles.textBtnLabel}>{loading ? "저장 중..." : "저장"}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDelete}>
                <View style={styles.textButton}>
                  <Ionicons name="trash-outline" size={20} color="#000" />
                  <Text style={styles.textBtnLabel}>삭제</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <View style={styles.textButton}>
                <Ionicons name="create-outline" size={20} color="#000" />
                <Text style={styles.textBtnLabel}>수정</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { alignItems: "center", paddingTop: 100, paddingBottom: 60 },
  imageContainer: { position: "relative" },
  image: { width: 260, height: 260, borderRadius: 16, marginBottom: 25 },
  editPhotoBtn: {
    position: "absolute",
    bottom: 23,
    right: -7,
    backgroundColor: "#FFFFFF00",
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  name: { fontSize: 26, fontWeight: "700", color: "#000", marginBottom: 6 },
  category: { fontSize: 18, color: "#666", marginBottom: 6 },
  materialHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
    marginBottom: 6,
    gap: 8,
  },
  material: { flex: 1, fontSize: 15, color: "#2e7d32" },
  materialBreakdownBox: { width: "90%", alignSelf: "center", marginBottom: 16 },
  materialBreakdownItem: { fontSize: 14, color: "#444", lineHeight: 20, textAlign: "left" },
  input: {
    width: "90%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "90%",
    gap: 10,
    marginBottom: 30,
  },
  catBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  catBtnActive: { backgroundColor: "#2e7d32", borderColor: "#2e7d32" },
  catText: { color: "#777", fontSize: 15 },
  catTextActive: { color: "#fff", fontWeight: "600" },
  washDisplay: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F5FAF7",
    borderRadius: 12,
    padding: 10,
    width: "90%",
    marginBottom: 12,
  },
  washText: { flex: 1, color: "#333", fontSize: 15, lineHeight: 22 },
  reanalyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  reanalyzeText: { color: "#2e7d32", fontWeight: "700" },
  historyContainer: {
    width: "90%",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 30,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyTitle: { fontSize: 17, fontWeight: "700", color: "#000" },
  historyItem: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  historyText: { fontSize: 15, color: "#333" },
  historyEmpty: { fontSize: 14, color: "#888", fontStyle: "italic" },
  moreBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  moreBtnText: { color: "#2e7d32", fontSize: 14, fontWeight: "600" },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "70%",
    marginTop: 10,
  },
  textButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  textBtnLabel: { fontSize: 16, color: "#000", fontWeight: "600" },
});
