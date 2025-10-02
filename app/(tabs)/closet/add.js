// app/(tabs)/closet/add.js

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddClothScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams(); // 이전 화면에서 전달받은 이미지 주소

  // 백엔드 연동 전, 임시 자동분류 기능
  const [category, setCategory] = useState('상의'); 
  const [name, setName] = useState('');

  const handleRegister = () => {
    if (!name) {
      Alert.alert("입력 오류", "옷 이름을 입력해주세요.");
      return;
    }
    // 나중에 실제 데이터 저장 로직 추가
    console.log("등록된 옷 정보:", { name, category, imageUri });
    Alert.alert("등록 완료", "새 옷이 옷장에 추가되었습니다.", [
      { text: "확인", onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>이름</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="옷의 이름을 입력하세요 (예: 회색 맨투맨)"/>
            </View>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>분류 (자동분류됨)</Text>
                <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="옷의 분류를 입력하세요"/>
            </View>
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                <Text style={styles.registerButtonText}>옷장에 등록하기</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  image: { width: '100%', aspectRatio: 1 },
  form: { padding: 25 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, },
  registerButton: { backgroundColor: 'green', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20, },
  registerButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});