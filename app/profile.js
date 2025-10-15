import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ChevronIcon from "../assets/icons/chevron-forward.svg";
import PencilIcon from "../assets/icons/pencil.svg";

const accountMenuItems = [
  { id: "1", title: "계정 정보 변경", screen: "/account-settings" },
  { id: "2", title: "로그아웃", screen: "/logout" },
];

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function ProfileScreen() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [isMounted, setIsMounted] = useState(true);
  const [profileImage, setProfileImage] = useState(null); // ✅ 프로필 사진 state 추가

  // ✅ 프로필 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        const savedImage = await AsyncStorage.getItem("profile_image");
        if (savedImage) setProfileImage(savedImage); // ✅ 저장된 이미지 로드

        if (!token) {
          if (isMounted) {
            router.replace("/");
          }
          return;
        }

        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok && isMounted) {
          setUserInfo({ name: data.name, email: data.email });
        } else {
          console.warn("❌ 사용자 정보 불러오기 실패:", data);
        }
      } catch (err) {
        console.error("❌ 네트워크 오류:", err);
      }
    };

    fetchProfile();
    return () => setIsMounted(false);
  }, [isMounted]);

  // ✅ 프로필 사진 선택 함수
  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeImages,
      allowsEditing: true,
      aspect: [1, 1], // 정사각형 자르기
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem("profile_image", uri); // ✅ 로컬 저장
      console.log("🖼️ 프로필 이미지 저장됨:", uri);
    }
  };

  // ✅ 로그아웃 기능 (전체 스토리지 초기화)
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      setUserInfo({ name: "", email: "" });
      setProfileImage(null);
      Alert.alert("로그아웃 완료", "로그인 화면으로 이동합니다.", [
        { text: "확인", onPress: () => router.replace("/") },
      ]);
    } catch (err) {
      console.error("❌ 로그아웃 오류:", err);
      Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 상단 프로필 */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder} />
            )}

            <TouchableOpacity style={styles.editIcon} onPress={pickProfileImage}>
              <PencilIcon width={18} height={18} stroke="#333" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{userInfo.name || "???"}</Text>
          <Text style={styles.email}>{userInfo.email || " "}</Text>
        </View>

        {/* 설정 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>설정</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuRow}>
              <Text style={styles.menuText}>테마</Text>
              <Switch
                trackColor={{ false: "#767577", true: "green" }}
                thumbColor={isDarkMode ? "white" : "#f4f3f4"}
                onValueChange={() => setIsDarkMode((prev) => !prev)}
                value={isDarkMode}
              />
            </View>
            <View style={[styles.menuRow, styles.noBorder]}>
              <Text style={styles.menuText}>알림</Text>
              <Switch
                trackColor={{ false: "#767577", true: "green" }}
                thumbColor={isNotificationsEnabled ? "white" : "#f4f3f4"}
                onValueChange={() =>
                  setIsNotificationsEnabled((prev) => !prev)
                }
                value={isNotificationsEnabled}
              />
            </View>
          </View>
        </View>

        {/* 계정 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.menuCard}>
            {accountMenuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuRow,
                  index === accountMenuItems.length - 1 && styles.noBorder,
                ]}
                onPress={() => {
                  if (item.title === "로그아웃") handleLogout();
                  else Alert.alert(item.title, "해당 기능은 준비 중입니다.");
                }}
              >
                <Text style={styles.menuText}>{item.title}</Text>
                <ChevronIcon width={20} height={20} fill="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f0" },
  profileSection: {
    backgroundColor: "white",
    alignItems: "center",
    paddingVertical: 30,
  },
  profileImageContainer: { position: "relative", marginBottom: 15 },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e9e9e9",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 6,
    borderWidth: 1,
    borderColor: "#eee",
  },
  name: { fontSize: 22, fontWeight: "bold" },
  email: { fontSize: 16, color: "gray", marginTop: 5 },
  menuSection: { marginTop: 25, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 10,
    marginLeft: 10,
  },
  menuCard: { backgroundColor: "white", borderRadius: 10 },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  noBorder: { borderBottomWidth: 0 },
  menuText: { fontSize: 16 },
});
