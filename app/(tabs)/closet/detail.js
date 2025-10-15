import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);

  // ✅ 사진 변경
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
        Alert.alert("수정 완료 ✅", `"${editedName}" 정보가 업데이트되었습니다.`);
        setEditMode(false);
        router.replace("/(tabs)/closet");
      } else {
        Alert.alert("오류", data.detail || "수정 실패");
      }
    } catch (err) {
      console.error("❌ 수정 오류:", err);
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
              Alert.alert("삭제 완료 ✅", `"${name}"이(가) 삭제되었습니다.`);
              router.replace("/(tabs)/closet");
            } else {
              const errData = await res.json();
              Alert.alert("삭제 실패", errData.detail || "삭제 중 오류 발생");
            }
          } catch (err) {
            console.error("❌ 삭제 오류:", err);
            Alert.alert("오류", "서버에 연결할 수 없습니다.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={26} color="#000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 이미지 */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          {editMode && (
            <TouchableOpacity style={styles.cameraBtn} onPress={changePhoto}>
              <Ionicons name="camera-outline" size={26} color="#fff" />
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
              {["상의", "하의", "아우터"].map((cat) => (
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
          </>
        )}

        {/* 버튼 */}
        <View style={styles.btnRow}>
          {editMode ? (
            <TouchableOpacity
              onPress={handleUpdate}
              style={[styles.actionBtn, { backgroundColor: "#23422D" }]}
              disabled={loading}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.btnText}>
                {loading ? "저장 중..." : "저장"}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setEditMode(true)}
                style={[styles.actionBtn, { backgroundColor: "#23422D" }]}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.actionBtn, { backgroundColor: "#B3261E" }]}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>삭제</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  backBtn: { position: "absolute", top: 60, left: 20, zIndex: 10 },
  content: { alignItems: "center", paddingTop: 100, paddingBottom: 60 },
  imageContainer: { position: "relative" },
  image: { width: 260, height: 260, borderRadius: 16, marginBottom: 25 },
  cameraBtn: {
    position: "absolute",
    bottom: 25,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 25,
    padding: 8,
  },
  name: { fontSize: 26, fontWeight: "700", color: "#23422D", marginBottom: 6 },
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
    justifyContent: "space-around",
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
  catBtnActive: { backgroundColor: "#23422D", borderColor: "#23422D" },
  catText: { color: "#777", fontSize: 15 },
  catTextActive: { color: "#fff", fontWeight: "600" },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
