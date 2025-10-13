// app/profile.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import ChevronIcon from '../assets/icons/chevron-forward.svg';
import PencilIcon from '../assets/icons/pencil.svg';

const accountMenuItems = [
  { id: '1', title: '계정 정보 변경', screen: '/account-settings' },
  { id: '2', title: '로그아웃', screen: '/logout' },
];

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function ProfileScreen() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [isMounted, setIsMounted] = useState(true); // ✅ 컴포넌트 생존 여부 체크용

  // ✅ 프로필 정보 불러오기
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        console.log("🟢 저장된 토큰:", token);
        if (!token) {
          if (isMounted) {
            console.log("🚫 토큰 없음 → 로그인 화면으로 이동");
            setIsMounted(false);
            router.replace("/"); // 로그인 화면으로 이동
          }
          return;
        }

        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("📡 /auth/me 응답 상태:", res.status);
        const data = await res.json();
        console.log("📩 /auth/me 응답 데이터:", data);

        if (!res.ok) {
          console.warn("❌ 사용자 정보 불러오기 실패:", data);
          return;
        }

        if (isMounted) {
          setUserInfo({ name: data.name, email: data.email });
        }
      } catch (err) {
        console.error("❌ 네트워크 오류:", err);
      }
    };

    fetchProfile();

    // ✅ cleanup (컴포넌트가 사라질 때 무한루프 방지)
    return () => setIsMounted(false);
  }, [isMounted]);

  // ✅ 로그아웃 기능
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("access_token"); // 토큰 삭제
      setUserInfo({ name: "", email: "" }); // 프로필 초기화
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
        {/* 상단 프로필 정보 */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder} /> 
            <TouchableOpacity style={styles.editIcon}>
              <PencilIcon width={18} height={18} stroke="#333" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{userInfo.name || "???"}</Text>
          <Text style={styles.email}>{userInfo.email || " "}</Text>
        </View>

        {/* 설정 섹션 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>설정</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuRow}>
              <Text style={styles.menuText}>테마</Text>
              <Switch
                trackColor={{ false: "#767577", true: "green" }}
                thumbColor={isDarkMode ? "white" : "#f4f3f4"}
                onValueChange={() => setIsDarkMode(prev => !prev)}
                value={isDarkMode}
              />
            </View>
            <View style={[styles.menuRow, styles.noBorder]}>
              <Text style={styles.menuText}>알림</Text>
              <Switch
                trackColor={{ false: "#767577", true: "green" }}
                thumbColor={isNotificationsEnabled ? "white" : "#f4f3f4"}
                onValueChange={() => setIsNotificationsEnabled(prev => !prev)}
                value={isNotificationsEnabled}
              />
            </View>
          </View>
        </View>

        {/* 계정 섹션 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.menuCard}>
            {accountMenuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuRow, index === accountMenuItems.length - 1 && styles.noBorder]}
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

// ✅ 스타일 — UI 그대로 유지
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  profileSection: { backgroundColor: 'white', alignItems: 'center', paddingVertical: 30 },
  profileImageContainer: { position: 'relative', marginBottom: 15 },
  profileImagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e9e9e9' },
  editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'white', borderRadius: 15, padding: 6, borderWidth: 1, borderColor: '#eee' },
  name: { fontSize: 22, fontWeight: 'bold' },
  email: { fontSize: 16, color: 'gray', marginTop: 5 },
  menuSection: { marginTop: 25, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, color: 'gray', marginBottom: 10, marginLeft: 10 },
  menuCard: { backgroundColor: 'white', borderRadius: 10 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  noBorder: { borderBottomWidth: 0 },
  menuText: { fontSize: 16 },
});