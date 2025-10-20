import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// 나무의 5단계를 정의합니다.
const treeStages = [
  { level: 1, name: '새싹', visual: '🌱' },
  { level: 2, name: '묘목', visual: '🪴' },
  { level: 3, name: '어린 나무', visual: '🌲' },
  { level: 4, name: '성목', visual: '🌳' },
  { level: 5, name: '울창한 나무', visual: '🌳✨' },
];

// 현재 레벨에 맞는 나무 정보를 가져오는 함수
const getTreeInfo = (level) => {
  return treeStages.find((stage) => stage.level === level) || treeStages[0];
};

export default function TreeScreen() {
  // 1. 포인트 상태 (기본 500)
  const [points, setPoints] = useState(500);
  // 2. 총 물 준 횟수 (성장 계산용)
  const [waterCount, setWaterCount] = useState(0);
  // 3. 현재 나무 레벨 (1~5)
  const [treeLevel, setTreeLevel] = useState(1);
  // 4. 사용자 이름
  const [userName, setUserName] = useState("사용자");

  // 마운트될 때 사용자 이름 가져오기
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        // ✅ "name"과 "username"을 모두 확인하는 로직
        const rawName =
          (await AsyncStorage.getItem("name")) ||
          (await AsyncStorage.getItem("username"));
          
        if (rawName) {
          setUserName(rawName);
        } else {
          setUserName("사용자");
        }
      } catch (e) {
        console.error("Failed to fetch user name:", e);
        setUserName("사용자");
      }
    };
    fetchUserName();
  }, []);

  // "물 주기" 버튼을 눌렀을 때 실행될 함수
  const handleWatering = () => {
    if (points < 5) {
      Alert.alert('포인트 부족', '나무에게 물을 주려면 5 포인트가 필요합니다.');
      return;
    }

    setPoints((prevPoints) => prevPoints - 5);

    if (treeLevel === 5) {
      Alert.alert(
        '물 주기',
        '나무가 최대 레벨에 도달했습니다! 꾸준히 관리해주세요. (5P 차감)'
      );
      setWaterCount((prevCount) => prevCount + 1);
      return;
    }

    const newTotalWaterCount = waterCount + 1;
    setWaterCount(newTotalWaterCount);

    const newLevel = Math.min(Math.floor(newTotalWaterCount / 5) + 1, 5);

    if (newLevel > treeLevel) {
      setTreeLevel(newLevel);
      Alert.alert(
        '나무 성장!',
        `나무가 LV.${newLevel} (${getTreeInfo(newLevel).name})로 성장했습니다!`
      );
    }
  };

  // --- 렌더링에 필요한 변수들 ---
  const treeInfo = getTreeInfo(treeLevel);
  const waterProgress = waterCount % 5;
  const isMaxLevel = treeLevel === 5;

  // --- 화면 렌더링 ---
  return (
    <View style={styles.container}>
      {/* --- 1. 상단 헤더 --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{userName}의 숲</Text>
        <View style={styles.pointBox}>
          <Text style={styles.pointText}>P {points}</Text>
        </View>
      </View>
      <View style={styles.headerDivider} />

      {/* --- 2. 가운데 나무 (사라졌던 부분) --- */}
      <View style={styles.treeContainer}>
        <Text style={styles.treeVisual}>{treeInfo.visual}</Text>
        <Text style={styles.treeName}>
          LV.{treeInfo.level} {treeInfo.name}
        </Text>
      </View>

      {/* --- 3. 하단 컨트롤러 (사라졌던 부분) --- */}
      <View style={styles.controller}>
        <View style={styles.growthInfo}>
          <Text style={styles.growthText}>
            {isMaxLevel
              ? '최대 레벨에 도달했습니다!'
              : `다음 성장까지: ${waterProgress} / 5`}
          </Text>
        </View>
        <TouchableOpacity style={styles.waterButton} onPress={handleWatering}>
          <Text style={styles.buttonText}>💧 물 주기 (5P 차감)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- 스타일시트 ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2e7d32',
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  pointBox: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  pointText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  treeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  treeVisual: {
    fontSize: 150,
    marginBottom: 20,
  },
  treeName: {
    fontSize: 22,
    fontWeight: '600',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
  controller: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 30, // 하단 여백 추가
  },
  growthInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  growthText: {
    fontSize: 16,
    color: '#555',
  },
  waterButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});