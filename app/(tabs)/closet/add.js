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

  // ✅ 사용자 정의 옷장 목록 불러오기
  useEffect(() => {
    const loadCategories = async () => {
      const saved = await AsyncStorage.getItem("categories");
      if (saved) {
        const list = JSON.parse(saved);
        setCategories([...new Set(["상의", "하의", "아우터", ...list])]);
      }
    };
    loadCategories();
  }, []);

  // ✅ 카메라 열기
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
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // ✅ 갤러리 열기
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
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // ✅ 이미지 선택 (ActionSheet)
  const pickImage = async () => {
    const options = ["카메라로 촬영", "앨범에서 선택", "취소"];
    const cancelIndex = 2;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        async (buttonIndex) => {
          if (buttonIndex === 0) await openCamera();
          if (buttonIndex === 1) await openGallery();
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

  // ✅ 등록 요청
  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert("입력 오류", "옷 이름을 입력하세요.");
    if (!image) return Alert.alert("입력 오류", "사진을 선택하세요.");

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return Alert.alert("로그인 필요", "다시 로그인해주세요.");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      const filename = image.split("/").pop();
      const ext = filename.split(".").pop();
      formData.append("image", { uri: image, name: filename, type: `image/${ext}` });

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

      if (res.ok) {
        Alert.alert("등록 완료 ✅", `"${name}"이(가) 등록되었습니다.`);
        router.replace("/(tabs)/closet");
      } else {
        Alert.alert("오류", data.detail || "등록 실패");
      }
    } catch (err) {
      console.error("❌ 등록 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>새 옷 등록</Text>

        {/* ✅ 사진 선택 */}
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
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
        />

        {/* ✅ 카테고리 선택 */}
        <View style={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, category === cat && styles.catBtnActive]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[styles.catText, category === cat && styles.catTextActive]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ 등록 버튼 */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? "전송 중..." : "등록하기"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#23422D", marginBottom: 20 },
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
    width: "100%",
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
    width: "100%",
    marginBottom: 30,
  },
  catBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  catBtnActive: { backgroundColor: "#23422D", borderColor: "#23422D" },
  catText: { color: "#777", fontSize: 15 },
  catTextActive: { color: "#fff", fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#23422D",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
