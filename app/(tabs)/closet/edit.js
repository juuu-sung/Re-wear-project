// app/(tabs)/closet/edit.js

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// 이 데이터는 상세 페이지와 동일해야 합니다.
const clothesData = [
    { id: '1', name: '소라색 얇은 니트', category: '상의' },
    { id: '2', name: '스트라이프 니트', category: '상의' },
    { id: '3', name: '네이비 카라티', category: '상의' },
    { id: '4', name: '회색 맨투맨', category: '상의' },
    { id: '5', name: '블랙 슬랙스', category: '하의' },
    { id: '6', name: '청바지', category: '하의' },
];

export default function EditClothScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams(); // URL에서 id 가져오기

    // 수정할 옷의 원본 데이터 찾기
    const originalCloth = clothesData.find(item => item.id === id);

    // useState를 사용해 입력값을 관리합니다. 초기값은 원본 옷의 정보입니다.
    const [clothName, setClothName] = useState(originalCloth?.name || '');
    const [clothCategory, setClothCategory] = useState(originalCloth?.category || '');

    // 저장 버튼을 눌렀을 때 실행될 함수
    const handleSave = () => {
        // 여기에 나중에 실제 데이터베이스에 저장하는 로직을 추가합니다.
        console.log('수정된 정보:', { id, name: clothName, category: clothCategory });
        
        Alert.alert("저장 완료", "옷 정보가 성공적으로 수정되었습니다.", [
            {
                text: "확인",
                onPress: () => router.back(), // 확인 버튼을 누르면 이전 페이지로 돌아가기
            },
        ]);
    };

    if (!originalCloth) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>수정할 옷 정보를 찾을 수 없습니다.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.form}>
                {/* 이름 입력 필드 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>이름</Text>
                    <TextInput
                        style={styles.input}
                        value={clothName}
                        onChangeText={setClothName} // 텍스트가 바뀔 때마다 clothName 상태 업데이트
                        placeholder="옷 이름을 입력하세요"
                    />
                </View>

                {/* 분류 입력 필드 */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>분류</Text>
                    <TextInput
                        style={styles.input}
                        value={clothCategory}
                        onChangeText={setClothCategory}
                        placeholder="분류를 입력하세요 (예: 상의, 하의)"
                    />
                </View>

                {/* 저장 버튼 */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>저장하기</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    form: {
        padding: 20,
        marginTop: 20,
    },
    inputGroup: {
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: 'green',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});