// app/scan.js  (🚨 기존 내용 다 지우고 이걸로 덮어쓰세요!)

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

// -----------------------------------------------------------
// (필수) 본인 컴퓨터 IP 주소 (이전과 동일)
// -----------------------------------------------------------
const BACKEND_API_URL = 'http://192.168.45.175:8000/laundry/scan';
// -----------------------------------------------------------

export default function ScanScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 화면이 열리자마자 1번 실행
  useEffect(() => {
    // 🚨 0.5초 딜레이를 줘서 모달이 열릴 시간을 줍니다.
    const timer = setTimeout(() => {
      launchNativeCamera();
    }, 500); // 0.5초 (500ms)

    // 화면을 나가면 타이머를 취소합니다. (메모리 누수 방지)
    return () => clearTimeout(timer);
  }, []);

  // "add.js"의 카메라 실행 로직을 가져왔습니다.
  const launchNativeCamera = async () => {
    setIsLoading(true);
    try {
      // 1. 카메라 권한 요청
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('권한 필요', '카메라 접근 권한을 허용해주세요.');
        router.back(); // 홈으로 돌아가기
        return;
      }

      // 2. "아이폰 기본 카메라" 실행
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // 🚨 편집 없이 원본 비율 사용
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      // 3. 사진을 찍은 경우
      if (!result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        // 4. 백엔드로 업로드
        await uploadImage(imageUri);
      } else {
        // 5. 사용자가 "취소" 누른 경우
        console.log('카메라 촬영 취소');
        router.back(); // 홈으로 돌아가기
      }
    } catch (err) {
      console.error('❌ 카메라 실행 오류:', err);
      Alert.alert('카메라 오류', String(err?.message || err));
      router.back();
    }
    setIsLoading(false);
  };

  // 백엔드로 이미지 업로드 (결과 페이지로 이동하도록 수정됨)
  const uploadImage = async (imageUri) => {
    setIsLoading(true);
    let manipResult;
    try {
      // 1. 이미지 리사이징
      manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }], // 가로 800으로 리사이징
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // 2. 'FormData' 형식으로 만들기
      const formData = new FormData();
      formData.append('file', {
        uri: manipResult.uri,
        name: `scan_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      // 3. 백엔드로 'POST' 전송
      const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '서버 오류');
      }

      console.log('✅ 스캔 결과:', result.detections);

      // -------------------------------------------------
      // ✅ 4. (중요!) 결과 페이지로 '이동'
      // -------------------------------------------------
      router.replace({
        pathname: '/scanResult', // "결과 확인" 새 스크린으로 이동
        params: {
          detections: JSON.stringify(result.detections), // 스캔된 기호 목록
          imageUri: manipResult.uri, // 사용자가 찍은 사진
        },
      });
      // -------------------------------------------------

    } catch (error) {
      console.error('❌ 업로드 실패:', error);
      Alert.alert('업로드 실패', '서버에 연결할 수 없거나 오류가 발생했습니다.');
      setIsLoading(false);
      router.back(); // 실패 시 홈으로
    }
  };

  // 이 화면은 카메라가 켜지거나, 로딩 중이거나, 다른 화면으로 이동하기 때문에
  // 사용자에게는 이 로딩 화면만 잠시 보이게 됩니다.
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
});