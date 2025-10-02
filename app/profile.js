// app/profile.js

import { useState } from 'react'; // useState를 추가합니다.
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'; // Switch를 추가합니다.

// 사용할 SVG 아이콘들을 불러옵니다.
import ChevronIcon from '../assets/icons/chevron-forward.svg';
import PencilIcon from '../assets/icons/pencil.svg';

// 클릭하면 다른 페이지로 이동하는 메뉴
const accountMenuItems = [
  { id: '1', title: '계정 정보 변경', screen: '/account-settings' },
  { id: '2', title: '로그아웃', screen: '/logout' },
];

export default function ProfileScreen() {
  // 토글 버튼의 상태를 관리하는 useState
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 상단 프로필 정보 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImagePlaceholder} /> 
            <TouchableOpacity style={styles.editIcon}>
              <PencilIcon width={18} height={18} stroke="#333" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>한태희</Text>
          <Text style={styles.email}>xogml4180@gmail.com</Text>
        </View>

        {/* 설정 섹션 (토글 버튼) */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>설정</Text>
          <View style={styles.menuCard}>
            {/* 테마 설정 */}
            <View style={styles.menuRow}>
              <Text style={styles.menuText}>테마</Text>
              <Switch
                trackColor={{ false: "#767577", true: "green" }}
                thumbColor={isDarkMode ? "white" : "#f4f3f4"}
                onValueChange={() => setIsDarkMode(previousState => !previousState)}
                value={isDarkMode}
              />
            </View>
            {/* 알림 설정 */}
            <View style={[styles.menuRow, styles.noBorder]}>
              <Text style={styles.menuText}>알림</Text>
               <Switch
                trackColor={{ false: "#767577", true: "green" }}
                thumbColor={isNotificationsEnabled ? "white" : "#f4f3f4"}
                onValueChange={() => setIsNotificationsEnabled(previousState => !previousState)}
                value={isNotificationsEnabled}
              />
            </View>
          </View>
        </View>

        {/* 계정 섹션 (페이지 이동 버튼) */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.menuCard}>
            {accountMenuItems.map((item, index) => (
              <TouchableOpacity key={item.id} style={[styles.menuRow, index === accountMenuItems.length - 1 && styles.noBorder]}>
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
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  profileSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e9e9e9',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 6,
    borderWidth: 1,
    borderColor: '#eee'
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: 'gray',
    marginTop: 5,
  },
  menuSection: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 10,
    marginLeft: 10,
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 10,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 16,
  },
});