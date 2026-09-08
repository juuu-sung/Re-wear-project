import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChevronIcon from "../assets/icons/chevron-forward.svg";
import PencilIcon from "../assets/icons/pencil.svg";

 
 
 
const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

 
 
 
function safeUrl(base, path) {
  if (!path || typeof path !== "string") return null;
  if (path.startsWith("http")) return path;
  return `${base}${path}`;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

   
   
   
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);

      const storedId = await AsyncStorage.getItem("user_id");
      const storedToken = await AsyncStorage.getItem("access_token");
      const storedUsername = await AsyncStorage.getItem("username");

      if (!storedId || !storedToken) {
        setLoading(false);
        return;
      }

      if (storedUsername) {
        setUserInfo(prev => ({ ...prev, name: storedUsername }));
      }

      const response = await axios.get(`${BASE_URL}/v1/users/${storedId}`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      const { name, email, profile_image, username } = response.data;

      setUserInfo({
        name: name || username || "이름 없음",
        email: email || ""
      });

      console.log("  서버 profile_image:", profile_image);

      const url = safeUrl(BASE_URL, profile_image);
      if (url) setProfileImage(url);

    } catch (error) {
      console.log("🚨 프로필 로딩 오류:", error);
    } finally {
      setLoading(false);
    }
  };

   
   
   
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("권한 필요", "프로필 사진을 바꾸려면 앨범 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    uploadProfileImage(result.assets[0].uri);
  };

   
   
   
  const uploadProfileImage = async (uri) => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    const userId = await AsyncStorage.getItem("user_id");

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: "profile.jpg",
      type: "image/jpeg",
    });

    const res = await axios.post(
      `${BASE_URL}/v1/users/${userId}/profile-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("  업로드 전체 응답:", res.data);

     
    const savedUrl = res.data?.url;

    if (!savedUrl || typeof savedUrl !== "string") {
      Alert.alert("업로드 실패", "서버에서 URL이 반환되지 않았습니다.");
      return;
    }

    setProfileImage(savedUrl);
    loadProfile();

  } catch (err) {
    console.log("🚨 업로드 에러:", err);
    Alert.alert("업로드 실패", "프로필 사진 업로드 중 문제가 발생했습니다.");
  }
};


   
   
   
  const handleLogout = async () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/");
        },
      },
    ]);
  };

  const handleMenuPress = (item) => {
    if (item.screen === "/logout") return handleLogout();
    router.push(item.screen);
  };

   
   
   
  const performDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert("알림", "비밀번호를 입력해주세요.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("access_token");

      await axios.post(
        `${BASE_URL}/v1/users/delete`,
        { password: deletePassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("탈퇴 완료", "계정이 삭제되었습니다.", [
        {
          text: "확인",
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace("/");
          },
        },
      ]);

    } catch (error) {
      console.log("🚨 회원탈퇴 에러:", error);
      Alert.alert("탈퇴 실패", "비밀번호가 일치하지 않거나 오류가 발생했습니다.");
    } finally {
      setDeleteModalVisible(false);
      setDeletePassword("");
    }
  };

   
   
   
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        {/* 프로필 */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={50} color="#ccc" />
              </View>
            )}

            <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
              <PencilIcon width={16} height={16} fill="#000" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text style={styles.name}>{userInfo.name}</Text>
              <Text style={styles.email}>{userInfo.email}</Text>
            </>
          )}
        </View>

        {/* 설정 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>설정</Text>
          <View style={styles.menuList}>
            <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
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
          <View style={styles.menuList}>
            {[
              { id: "1", title: "계정 정보 변경", screen: "/account-verify" },
              { id: "2", title: "로그아웃", screen: "/logout" },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item)}
              >
                <Text style={styles.menuText}>{item.title}</Text>
                <ChevronIcon width={20} height={20} fill="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 🔴 회원탈퇴 */}
        <TouchableOpacity
          style={[styles.menuItem, { margin: 20, backgroundColor: "white", borderRadius: 10 }]}
          onPress={() => setDeleteModalVisible(true)}
        >
          <Text style={{ color: "red", fontWeight: "bold", textAlign: "center" }}>
            회원 탈퇴
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/*   회원탈퇴 모달 */}
      <Modal
        transparent
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalWrap}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>계정 삭제</Text>
            <Text style={styles.modalSub}>비밀번호를 입력하세요.</Text>

            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              placeholder="비밀번호"
              style={styles.modalInput}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.deleteBtn]}
                onPress={performDeleteAccount}
              >
                <Text style={styles.deleteText}>삭제하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  profileImage: { width: 100, height: 100, borderRadius: 50 },

  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e9e9e9",
    justifyContent: "center",
    alignItems: "center",
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

  name: { fontSize: 22, fontWeight: "700" },
  email: { fontSize: 16, color: "gray", marginTop: 5 },

  menuSection: { marginTop: 25, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, color: "gray", marginBottom: 10 },

  menuList: { backgroundColor: "white", borderRadius: 10, overflow: "hidden" },

  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  modalWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  modalSub: { fontSize: 14, color: "#666", marginBottom: 20 },

  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    height: 45,
    borderRadius: 10,
    marginBottom: 20,
  },

  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtn: { backgroundColor: "#ddd", marginRight: 10 },
  deleteBtn: { backgroundColor: "#ff4444", marginLeft: 10 },

  cancelText: { color: "#333", fontWeight: "700" },
  deleteText: { color: "white", fontWeight: "700" },
});
