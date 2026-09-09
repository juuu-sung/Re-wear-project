import { CLOTHING_CATEGORIES, mergeClothingCategories } from "../../../src/constants/clothingCategories";
 
 
 
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActionSheetIOS, Alert, Image, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from "react-native-modal";

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function AddClothesScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("auto");
  const [categories, setCategories] = useState(CLOTHING_CATEGORIES);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

   
  const [showTipModal, setShowTipModal] = useState(false);
  const [hideTipNextTime, setHideTipNextTime] = useState(false);
  const [triggerCamera, setTriggerCamera] = useState(false);

   
   
   
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("user_id");
      if (id) setUserId(id);
    })();
  }, []);

   
   
   
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("categories");
      if (saved) {
        const list = JSON.parse(saved);
        setCategories((current) => mergeClothingCategories(current, list));
      }
    })();
  }, []);

   

   
   
   
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

   
   
   
  const completeAddClothMission = async () => {
    try {
      if (!userId) return;

      const today = new Date().toISOString().split("T")[0];
      const dateKey = `daily_mission_date_${userId}`;
      const missionKey = `daily_missions_${userId}`;

      const storedDate = await AsyncStorage.getItem(dateKey);
      const missionsRaw = await AsyncStorage.getItem(missionKey);

      if (!missionsRaw) return;

       
      if (storedDate !== today) return;

      const missions = JSON.parse(missionsRaw);
      const target = missions.find((m) => m.key === "add_cloth");

       
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

   
   
   
  const handleSubmit = async () => {
    if (loading) return;
    if (!name.trim()) return Alert.alert("입력 오류", "옷 이름을 입력하세요!");
    if (!image) return Alert.alert("입력 오류", "사진을 선택하세요.");

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("image", new File(image));

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

       
      await completeAddClothMission();

      const savedCategory = data.category || (category === "auto" ? "미분류" : category);
      const categoryNotice = savedCategory === "미분류"
        ? "\n카테고리를 확인하지 못했어요. 상세 화면의 수정에서 직접 선택해 주세요."
        : `\n카테고리: ${savedCategory}`;
      Alert.alert("등록 완료", `"${name}"이 등록되었습니다!${categoryNotice}`);

      router.replace({
        pathname: "/(tabs)/closet/detail",
        params: {
          id: String(data.id),
          name,
          category: savedCategory,
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Re:wear Closet</Text>
          <Text style={styles.heroTitle}>새 옷 등록</Text>
          <Text style={styles.heroSubtitle}>사진과 정보를 기록하면 관리가 더 쉬워져요.</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>옷 사진</Text>
            <Text style={styles.sectionSub}>카테고리를 알아볼 수 있도록 옷 전체가 보이게 촬영해 주세요.</Text>
          </View>

          <TouchableOpacity
            style={[styles.imageBox, loading && { opacity: 0.5 }]}
            onPress={pickImage}
            disabled={loading}
            activeOpacity={0.85}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={36} color="#8fb29f" />
                <Text style={styles.imagePlaceholderText}>사진 추가</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="pricetag-outline" size={18} color="#5a6b61" />
            <TextInput
              style={styles.input}
              placeholder="옷 이름을 입력하세요"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          <Text style={styles.sectionSub}>카테고리</Text>
          <Text style={styles.sectionSub}>자동 분류를 선택하면 등록할 때 소재와 카테고리를 함께 분석해요. 직접 선택할 수도 있어요.</Text>
          <View style={styles.categoryRow}>
            <TouchableOpacity
              style={[styles.catBtn, category === "auto" && styles.catBtnActive]}
              onPress={() => setCategory("auto")}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={[styles.catText, category === "auto" && styles.catTextActive]}>자동 분류</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catBtn, category === cat && styles.catBtnActive]}
                onPress={() => setCategory(cat)}
                disabled={loading}
                activeOpacity={0.9}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>{loading ? "사진 분석 및 등록 중..." : "등록하기"}</Text>
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
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 20, paddingBottom: 90, gap: 18 },
  heroCard: {
    backgroundColor: "#e6f7ef",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#cfe9da",
  },
  heroLabel: { color: "#4a8a68", fontSize: 13, fontWeight: "600" },
  heroTitle: { color: "#0f4228", fontSize: 24, fontWeight: "800", marginTop: 6 },
  heroSubtitle: { color: "#4a8a68", fontSize: 14, marginTop: 4 },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e0ebe4",
    shadowColor: "#0d1f14",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0f4228" },
  sectionSub: { fontSize: 13, color: "#5a6b61", marginTop: 4 },
  imageBox: {
    height: 200,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d6ebdf",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%", borderRadius: 18 },
  imagePlaceholder: { alignItems: "center", gap: 6 },
  imagePlaceholderText: { color: "#5a6b61", fontSize: 13, fontWeight: "600" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dce7df",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: "#f9fcfb",
  },
  input: { flex: 1, fontSize: 15, color: "#0f4228" },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  catBtn: {
    borderWidth: 1,
    borderColor: "#dbe4dd",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#f5f7f6",
  },
  catBtnActive: {
    backgroundColor: "#18b36a",
    borderColor: "#18b36a",
    shadowColor: "#18b36a",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  catText: { fontSize: 14, color: "#5a6b61", fontWeight: "500" },
  catTextActive: { color: "#fff", fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#18b36a",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#138351",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "700" },
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
