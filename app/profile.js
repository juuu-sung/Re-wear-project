import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import ChevronIcon from "../assets/icons/chevron-forward.svg";
import PencilIcon from "../assets/icons/pencil.svg";

const accountMenuItems = [
  { id: "1", title: "계정 정보 변경", screen: "/account-settings" },
  { id: "2", title: "로그아웃", screen: "/logout" },
];

// 서버 주소 설정
const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function ProfileScreen() {
  const router = useRouter();
  
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true); 

  // 설정 상태
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  // 회원탈퇴 관련 상태
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // 화면이 포커스될 때마다 최신 정보 갱신
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  // 🔥 [핵심] 프로필 정보 불러오기
  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log("🚀 프로필 로딩 시작!");

      // 1. 로컬 저장소 확인 (이름표 수정: user_id, access_token)
      const storedId = await AsyncStorage.getItem("user_id");      // 👈 수정됨
      const storedToken = await AsyncStorage.getItem("access_token"); // 👈 수정됨
      const storedUsername = await AsyncStorage.getItem("username");

      console.log("📂 로컬 저장소 확인:", { storedId, hasToken: !!storedToken });

      if (!storedId || !storedToken) {
        console.log("❌ 로그인 정보 없음 (ID나 토큰이 비어있음)");
        setLoading(false);
        return;
      }

      // 일단 로컬에 있는 이름이라도 먼저 보여줌
      if (storedUsername) {
        setUserInfo(prev => ({ ...prev, name: storedUsername }));
      }

      // 2. 백엔드 요청 (최신 정보 및 이메일 가져오기)
      console.log(`📡 서버 요청 보냄: ${BASE_URL}/v1/users/${storedId}`);
      
      const response = await axios.get(`${BASE_URL}/v1/users/${storedId}`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      console.log("✅ 서버 응답 성공:", response.data);

      const { name, email, profile_image, username } = response.data;

      // 받아온 정보로 업데이트
      setUserInfo({ 
        name: name || username || "이름 없음", 
        email: email || "" 
      });

      if (profile_image) {
        const imageUrl = profile_image.startsWith("http") 
          ? profile_image 
          : `${BASE_URL}${profile_image}`;
        setProfileImage(imageUrl);
      }

    } catch (error) {
      console.error("🚨 프로필 불러오기 에러:", error);
      // 에러가 나더라도 로컬에 저장된 이름은 유지
    } finally {
      setLoading(false);
    }
  };

  const handleMenuPress = async (item) => {
    if (item.screen === "/logout") {
      handleLogout();
    } else {
      router.push(item.screen);
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

  // ---------------------------------------------------------
  // 🟢 회원 탈퇴 로직
  // ---------------------------------------------------------
  const handlePressDelete = () => {
    Alert.alert(
      "계정 삭제",
      "정말로 계정을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive", 
          onPress: () => setDeleteModalVisible(true) 
        },
      ]
    );
  };

  const performDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert("알림", "비밀번호를 입력해주세요.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem("access_token"); // 👈 여기도 수정!
      
      await axios.post(`${BASE_URL}/v1/users/delete`, {
        password: deletePassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("탈퇴 완료", "계정이 삭제되었습니다.", [
        { 
          text: "확인", 
          onPress: async () => {
            await AsyncStorage.clear(); 
            router.replace("/"); 
          } 
        }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("탈퇴 실패", "비밀번호가 일치하지 않거나 오류가 발생했습니다.");
    } finally {
      setDeleteModalVisible(false);
      setDeletePassword("");
    }
  };

  // ---------------------------------------------------------
  // 🔵 UI 렌더링
  // ---------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                 <Ionicons name="person" size={50} color="#ccc" />
              </View>
            )}
            <TouchableOpacity style={styles.editIcon}>
              <PencilIcon width={16} height={16} fill="#000" />
            </TouchableOpacity>
          </View>

          {loading && !userInfo.name ? (
            <ActivityIndicator size="small" color="#000" style={{ marginTop: 10 }} />
          ) : (
            <>
              <Text style={styles.name}>{userInfo.name}</Text>
              <Text style={styles.email}>{userInfo.email}</Text>
            </>
          )}
        </View>

        {/* 설정 섹션 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>설정</Text>
          <View style={styles.menuList}>
            <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.menuText}>알림</Text>
              <Switch
                trackColor={{ false: "#767577", true: "green" }}
                thumbColor={isNotificationsEnabled ? "white" : "#f4f3f4"}
                onValueChange={() => setIsNotificationsEnabled((prev) => !prev)}
                value={isNotificationsEnabled}
              />
            </View>
          </View>
        </View>

        {/* 계정 메뉴 섹션 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.menuList}>
            {accountMenuItems.map((item) => (
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

        {/* 회원 탈퇴 버튼 */}
        <TouchableOpacity 
          style={[styles.menuItem, { marginTop: 20, marginHorizontal: 20, padding: 15, backgroundColor: 'white', borderRadius: 10, marginBottom: 40 }]} 
          onPress={handlePressDelete}
        >
          <Text style={{ color: "red", fontSize: 16, fontWeight: "bold", textAlign: 'center' }}>회원 탈퇴</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 비밀번호 입력 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.centeredView}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>본인 확인</Text>
            <Text style={styles.modalText}>계정을 삭제하려면 비밀번호를 입력하세요.</Text>
            
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonClose]} 
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.textStyle}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.buttonDelete]} 
                onPress={performDeleteAccount}
              >
                <Text style={styles.textStyle}>삭제하기</Text>
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
  profileImageContainer: { position: "relative", marginBottom: 15, justifyContent: 'center', alignItems: 'center' },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
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
  name: { fontSize: 22, fontWeight: "bold" },
  email: { fontSize: 16, color: "gray", marginTop: 5 },
  menuSection: { marginTop: 25, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 10,
    marginLeft: 10,
  },
  menuList: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuText: { fontSize: 16 },
  
  // 모달 스타일
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)"
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  modalText: { marginBottom: 15, textAlign: "center", color: "#666" },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20
  },
  modalButtons: { flexDirection: "row", gap: 10 },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    minWidth: 80,
    alignItems: 'center'
  },
  buttonClose: { backgroundColor: "#ccc" },
  buttonDelete: { backgroundColor: "#ff4444" },
  textStyle: { color: "white", fontWeight: "bold" }
});