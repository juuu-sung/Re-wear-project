// app/closet/edit.js

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// 임시 데이터 (실제 앱에서는 이 데이터가 필요 없을 수 있습니다)
const clothesData = [
    { id: '1', name: '소라색 얇은 니트', category: '상의' },
    // ... 다른 옷 데이터
];

function ClothEditScreen() {
    const router = useRouter(); // useRouter 훅 사용
    const { id } = useLocalSearchParams();
    const cloth = clothesData.find(item => item.id === id) || {};

    const [name, setName] = useState(cloth.name);
    const [category, setCategory] = useState(cloth.category);

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: '옷장-상세수정' }} />
            <ScrollView>
                <View style={styles.imageContainer}>
                    <View style={styles.imagePlaceholder} />
                </View>
                <View style={styles.formContainer}>
                    <Text style={styles.label}>이름</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                    />
                    <Text style={styles.label}>분류</Text>
                    <TextInput
                        style={styles.input}
                        value={category}
                        onChangeText={setCategory}
                    />
                </View>
            </ScrollView>

            {/* --- 바로 이 부분의 onPress를 수정합니다 --- */}
            <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
                <Text style={styles.doneButtonText}>완료</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

// --- 스타일 시트는 이전과 동일합니다 ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    imageContainer: { padding: 20, alignItems: 'center' },
    imagePlaceholder: {
        width: '90%',
        height: 300,
        backgroundColor: '#f0f0f0',
        borderRadius: 15,
    },
    formContainer: { paddingHorizontal: 30 },
    label: { fontSize: 14, color: 'gray', marginTop: 20, marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
    },
    doneButton: {
        backgroundColor: 'green',
        margin: 20,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    doneButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ClothEditScreen;