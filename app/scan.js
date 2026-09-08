 import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

 
 
 
const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
export const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");
export const BACKEND_API_URL = `${BASE_URL}/laundry/scan`;
 

export default function ScanScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

   
  useEffect(() => {
    const timer = setTimeout(() => {
      launchNativeCamera();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const launchNativeCamera = async () => {
    setIsLoading(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("권한 필요", "카메라 접근 권한을 허용해주세요.");
        router.back();
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri);
      } else {
        router.back();
      }
    } catch (err) {
      console.error("❌ 카메라 실행 오류:", err);
      Alert.alert("카메라 오류", String(err?.message || err));
      router.back();
    }
    setIsLoading(false);
  };

   
  const markScanMissionDone = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) return;

      const today = new Date().toISOString().split("T")[0];
      const dateKey = `daily_mission_date_${userId}`;
      const missionKey = `daily_missions_${userId}`;

      const storedDate = await AsyncStorage.getItem(dateKey);
      const missionsRaw = await AsyncStorage.getItem(missionKey);

      if (!missionsRaw || storedDate !== today) return;

      const missions = JSON.parse(missionsRaw);
      const updated = missions.map((m) =>
        m.key === "scan_label" ? { ...m, done: true } : m
      );

      await AsyncStorage.setItem(missionKey, JSON.stringify(updated));
      console.log("세탁 라벨 검색하기 미션 완료 처리");
    } catch (err) {
      console.error("미션 완료 처리 실패:", err);
    }
  };

   
  const uploadImage = async (imageUri) => {
    setIsLoading(true);
    let manipResult;
    try {
       
      manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

       
      const formData = new FormData();
      formData.append("file", {
        uri: manipResult.uri,
        name: `scan_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

       
      const response = await fetch(BACKEND_API_URL, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "서버 오류");
      }

      console.log("스캔 결과:", result.detections);

      
       
      await markScanMissionDone();

       
      await AsyncStorage.setItem("mission_changed", "1");

       
      router.replace({
        pathname: "/scanResult",
        params: {
          detections: JSON.stringify(result.detections),
          imageUri: manipResult.uri,
        },
      });

    } catch (error) {
      console.error("❌ 업로드 실패:", error);
      Alert.alert("업로드 실패", "서버에 연결할 수 없거나 오류가 발생했습니다.");
      router.back();
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.text}>카메라를 여는 중...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
});
