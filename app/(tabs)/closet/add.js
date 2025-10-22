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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function AddClothesScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("상의");
  const [categories, setCategories] = useState(["상의", "하의", "아우터"]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ 사용자 정의 옷장 불러오기
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const saved = await AsyncStorage.getItem("categories");
        if (saved) {
          const list = JSON.parse(saved);
          setCategories([...new Set(["상의", "하의", "아우터", ...list])]);
        }
      } catch {}
    };
    loadCategories();
  }, []);

  // 👉 확장자→MIME 매핑 (HEIC도 안전 처리)
  const resolveMime = (extRaw) => {
    const ext = (extRaw || "").toLowerCase();
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    if (ext === "heic" || ext === "heif") return "image/jpeg"; // 서버에서 jpeg로 처리
    return "image/jpeg";
  };

  // ✅ 카메라
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "카메라 접근 권한을 허용해주세요.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  // ✅ 갤러리
  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("권한 필요", "사진 접근 권한을 허용해주세요.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  // ✅ 사진 선택 액션시트
  const pickImage = async () => {
    const options = ["카메라로 촬영", "앨범에서 선택", "취소"];
    const cancelIndex = 2;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        async (i) => {
          if (i === 0) await openCamera();
          if (i === 1) await openGallery();
        }
      );
    } else {
      Alert.alert("사진 선택", "사용할 방법을 선택하세요", [
        { text: "카메라", onPress: openCamera },
        { text: "앨범", onPress: openGallery },
        { text: "취소", style: "cancel" },
      ]);
    }
  };

  // ✅ 등록
  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert("입력 오류", "옷 이름을 입력하세요.");
    if (!image) return Alert.alert("입력 오류", "사진을 선택하세요.");
    if (!BASE_URL) return Alert.alert("설정 오류", "EXPO_PUBLIC_BASE_URL이 비어 있어요.");

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return Alert.alert("로그인 필요", "다시 로그인해주세요.");

      const filename = image.split("/").pop() || `photo_${Date.now()}.jpg`;
      const rawExt = filename.includes(".") ? filename.split(".").pop() : "jpg";
      const mime = resolveMime(rawExt);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("image", { uri: image, name: filename, type: mime });

      const res = await fetch(`${BASE_URL}/clothes/add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // FormData는 Content-Type 자동
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

      Alert.alert("등록 완료 ✅", `"${name}"이(가) 등록되었습니다.`);

      // ✅ 상세 화면으로 이동하며 AI 결과 전달
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
      console.error("❌ 등록 오류:", err);
      Alert.alert("네트워크 오류", String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>새 옷 등록</Text>

        {/* ✅ 사진 선택 */}
        <TouchableOpacity style={styles.imageBox} onPress={pickImage} disabled={loading}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Ionicons name="camera" size={40} color="#aaa" />
          )}
        </TouchableOpacity>

        {/* ✅ 이름 입력 */}
        <TextInput
          style={styles.input}
          placeholder="옷 이름을 입력하세요"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        {/* ✅ 카테고리 선택 */}
        <View style={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, category === cat && styles.catBtnActive, loading && { opacity: 0.6 }]}
              onPress={() => !loading && setCategory(cat)}
              disabled={loading}
            >
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ 등록 버튼 */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>{loading ? "전송 중..." : "등록하기"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  // ⬇️ 사진 박스가 상단에서 안 사라지도록 여백 조정
  content: { alignItems: "center", paddingTop: 40, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: "700", color: "#2e7d32", marginBottom: 20 },
  imageBox: {
    width: 180,
    height: 180,
    backgroundColor: "#f3f3f3",
    borderRadius: 12,
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
    justifyContent: "center",
    gap: 10,
    width: "90%",
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
  submitBtn: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 }
});
