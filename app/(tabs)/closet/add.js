// ============================================
// AddClothesScreen — 미션 연동 완성본
// ============================================
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function AddClothesScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("상의");
  const [categories, setCategories] = useState(["상의", "하의", "아우터"]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // 팁 모달
  const [showTipModal, setShowTipModal] = useState(false);
  const [hideTipNextTime, setHideTipNextTime] = useState(false);
  const [triggerCamera, setTriggerCamera] = useState(false);

  // ======================
  // 유저 로드
  // ======================
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("user_id");
      if (id) setUserId(id);
    })();
  }, []);

  // ======================
  // 카테고리 로드
  // ======================
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("categories");
      if (saved) {
        const list = JSON.parse(saved);
        setCategories([...new Set(["상의", "하의", "아우터", ...list])]);
      }
    })();
  }, []);

  // 파일 확장자 → MIME
  const resolveMime = (extRaw) => {
    const ext = (extRaw || "").toLowerCase();
    if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    if (["heic", "heif"].includes(ext)) return "image/jpeg";
    return "image/jpeg";
  };

  // ======================
  // 카메라
  // ======================
  const launchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert("권한 필요", "카메라 권한을 허용해주세요.");

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("카메라 오류", err.message);
    }
  };

  const openCamera = async () => {
    if (!userId) return;

    const key = `hide_camera_tip_${userId}`;
    const skip = await AsyncStorage.getItem(key);

    if (skip === "true") {
      await launchCamera();
    } else {
      setShowTipModal(true);
    }
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("권한 필요", "사진 접근 권한을 허용해주세요.");

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets?.length > 0) setImage(result.assets[0].uri);
  };

  const pickImage = async () => {
    const options = ["카메라로 촬영", "앨범에서 선택", "취소"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        async (i) => {
          if (i === 0) await openCamera();
          if (i === 1) await openGallery();
        }
      );
    } else {
      Alert.alert("사진 선택", "선택하세요", [
        { text: "카메라", onPress: openCamera },
        { text: "앨범", onPress: openGallery },
        { text: "취소", style: "cancel" },
      ]);
    }
  };

  const handleConfirmTip = async () => {
    if (hideTipNextTime) {
      await AsyncStorage.setItem(`hide_camera_tip_${userId}`, "true");
    }
    setTriggerCamera(true);
    setShowTipModal(false);
  };

  // ======================
  // 🟩 add_cloth 미션 자동 완료 함수
  // ======================
  const completeAddClothMission = async () => {
    try {
      if (!userId) return;

      const today = new Date().toISOString().split("T")[0];
      const dateKey = `daily_mission_date_${userId}`;
      const missionKey = `daily_missions_${userId}`;

      const storedDate = await AsyncStorage.getItem(dateKey);
      const missionsRaw = await AsyncStorage.getItem(missionKey);

      if (!missionsRaw) return;

      // 날짜가 바뀌었으면 무시 (DailyMissionTab이 자동 초기화함)
      if (storedDate !== today) return;

      const missions = JSON.parse(missionsRaw);
      const target = missions.find((m) => m.key === "add_cloth");

      // 이미 완료면 패스
      if (!target || target.done) return;

      const updated = missions.map((m) =>
        m.key === "add_cloth" ? { ...m, done: true } : m
      );

      await AsyncStorage.setItem(missionKey, JSON.stringify(updated));

      console.log("🟩 옷 등록 미션 완료됨");
    } catch (err) {
      console.log("미션 처리 오류:", err);
    }
  };

  // ======================
  // 등록 처리
  // ======================
  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert("입력 오류", "옷 이름을 입력하세요!");
    if (!image) return Alert.alert("입력 오류", "사진을 선택하세요.");

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("access_token");
      const filename = image.split("/").pop() || `photo_${Date.now()}.jpg`;
      const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
      const mime = resolveMime(ext);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("image", { uri: image, name: filename, type: mime });

      const res = await fetch(`${BASE_URL}/clothes/add`, {
        method: "POST",
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

      if (!res.ok) {
        return Alert.alert("오류", data.detail || "등록 실패");
      }

      // 🟩 미션 완료!
      await completeAddClothMission();

      Alert.alert("등록 완료", `"${name}"이 등록되었습니다!`);

      router.replace({
        pathname: "/(tabs)/closet/detail",
        params: {
          id: String(data.id),
          name,
          category,
          image: `${BASE_URL}/uploads/clothes/${data.image_path}`,
          material: data?.ai?.material ?? "",
          washing: data?.ai?.washing ? JSON.stringify(data.ai.washing) : "",
          materialBreakdown: data?.material_breakdown ?? "",
        },
      });
    } catch (err) {
      Alert.alert("오류", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>새 옷 등록</Text>

        <TouchableOpacity style={styles.imageBox} onPress={pickImage} disabled={loading}>
          {image ? <Image source={{ uri: image }} style={styles.image} /> : <Ionicons name="camera" size={40} color="#aaa" />}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="옷 이름"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, category === cat && styles.catBtnActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>{loading ? "전송 중..." : "등록하기"}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 팁 모달 */}
      <Modal
        isVisible={showTipModal}
        backdropOpacity={0.4}
        onBackdropPress={() => setShowTipModal(false)}
        onModalHide={() => {
          if (triggerCamera) {
            setTriggerCamera(false);
            setTimeout(() => launchCamera(), 300);
          }
        }}
      >
        <View style={styles.tipModal}>
          <Text style={styles.tipTitle}>촬영 안내</Text>
          <Text style={styles.tipText}>옷을 평평하게 두고 접힘 없이 촬영해주세요.</Text>

          <View style={styles.switchRow}>
            <Switch value={hideTipNextTime} onValueChange={setHideTipNextTime} />
            <Text style={styles.switchText}>다시 보지 않기</Text>
          </View>

          <View style={styles.tipBtnRow}>
            <TouchableOpacity style={[styles.tipBtn, { backgroundColor: "#ddd" }]} onPress={() => setShowTipModal(false)}>
              <Text>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tipBtn, { backgroundColor: "#2e7d32" }]} onPress={handleConfirmTip}>
              <Text style={{ color: "#fff" }}>촬영하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { alignItems: "center", paddingTop: 40, paddingBottom: 70 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: "#2e7d32" },
  imageBox: {
    width: 180,
    height: 180,
    borderRadius: 12,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  image: { width: "100%", height: "100%", borderRadius: 12 },
  input: {
    width: "90%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "90%",
    justifyContent: "center",
    marginBottom: 30,
    gap: 10,
  },
  catBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  catBtnActive: { backgroundColor: "#2e7d32", borderColor: "#2e7d32" },
  catText: { fontSize: 15, color: "#777" },
  catTextActive: { color: "#fff", fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 50,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  tipModal: { backgroundColor: "#fff", padding: 24, borderRadius: 12 },
  tipTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  tipText: { fontSize: 15, marginBottom: 20, textAlign: "center" },
  switchRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  switchText: { marginLeft: 10 },
  tipBtnRow: { flexDirection: "row", justifyContent: "space-between" },
  tipBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
});
