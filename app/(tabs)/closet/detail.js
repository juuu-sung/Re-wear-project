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
  const { id, name, category, image } = useLocalSearchParams();
  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedCategory, setEditedCategory] = useState(category);
  const [imageUri, setImageUri] = useState(image);
  const [washingInfo, setWashingInfo] = useState("");
  const [categories, setCategories] = useState(["상의", "하의", "아우터"]);
  const [loading, setLoading] = useState(false);

  // ✅ 사용자 추가 카테고리 불러오기
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const saved = await AsyncStorage.getItem("categories");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCategories([...new Set(["상의", "하의", "아우터", ...parsed])]);
        }
      } catch (err) {
        console.log("카테고리 불러오기 실패:", err);
      }
    };
    loadCategories();
  }, []);

  // ✅ 사진 변경 (카메라/앨범 선택)
  const changePhoto = async () => {
    const options = ["카메라로 촬영", "앨범에서 선택", "취소"];
    const cancelIndex = 2;

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
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    };

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
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        (buttonIndex) => {
          if (buttonIndex === 0) openCamera();
          if (buttonIndex === 1) openGallery();
        }
      );
    } else {
      Alert.alert("사진 변경", "사용할 방법을 선택하세요", [
        { text: "카메라", onPress: openCamera },
        { text: "앨범", onPress: openGallery },
        { text: "취소", style: "cancel" },
      ]);
    }
  };

  // ✅ 옷 수정 (PUT)
  const handleUpdate = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("로그인 필요", "다시 로그인해주세요.");
        return;
      }

      const formData = new FormData();
      formData.append("name", editedName);
      formData.append("category", editedCategory);
      formData.append("washing_info", washingInfo || "");

      if (imageUri && !imageUri.startsWith(BASE_URL)) {
        const filename = imageUri.split("/").pop();
        const ext = filename.split(".").pop();
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

      if (res.ok) {
        Alert.alert("수정 완료", `"${editedName}" 정보가 업데이트되었습니다.`);
        setEditMode(false);
        router.replace("/(tabs)/closet");
      } else {
        Alert.alert("오류", data.detail || "수정 실패");
      }
    } catch (err) {
      console.error("수정 오류:", err);
      Alert.alert("서버 오류", "수정 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 옷 삭제 (DELETE)
  const handleDelete = async () => {
    Alert.alert("삭제 확인", `"${name}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("access_token");
            if (!token) {
              Alert.alert("로그인 필요", "다시 로그인해주세요.");
              return;
            }

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

          {/* 연필 버튼 */}
          {editMode && (
            <TouchableOpacity style={styles.editPhotoBtn} onPress={changePhoto}>
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* 이름 / 카테고리 */}
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
                  style={[styles.catBtn, editedCategory === cat && styles.catBtnActive]}
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

            {/* 세탁법 */}
            <View style={styles.washDisplay}>
              <Ionicons
                name="water-outline"
                size={20}
                color="#1C7C54"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.washText}>
                {washingInfo
                  ? washingInfo
                  : "세탁법을 입력하거나 AI가 분석하면 여기에 표시됩니다."}
              </Text>
            </View>
          </>
        )}

        {/* 버튼 */}
        <View style={styles.btnRow}>
          {editMode ? (
            <>
              <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                <View style={styles.textButton}>
                  <Ionicons name="checkmark" size={20} color="#000" />
                  <Text style={styles.textBtnLabel}>
                    {loading ? "저장 중..." : "저장"}
                  </Text>
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

  // ✅ 연필 버튼
  editPhotoBtn: {
    position: "absolute",
    bottom: 30,
    right: 5,
    backgroundColor: "#1C7C54",
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

  name: { fontSize: 26, fontWeight: "700", color: "#1C7C54", marginBottom: 6 },
  category: { fontSize: 18, color: "#666", marginBottom: 30 },
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
  catBtnActive: { backgroundColor: "#1C7C54", borderColor: "#1C7C54" },
  catText: { color: "#777", fontSize: 15 },
  catTextActive: { color: "#fff", fontWeight: "600" },

  washDisplay: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F5FAF7",
    borderRadius: 12,
    padding: 10,
    width: "90%",
    marginBottom: 30,
  },
  washText: { flex: 1, color: "#333", fontSize: 15, lineHeight: 22 },

  // ✅ 텍스트 버튼 스타일
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "70%",
    marginTop: 10,
  },
  textButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  textBtnLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
});
