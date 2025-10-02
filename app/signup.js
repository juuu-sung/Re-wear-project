// app/signup.js

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignUpScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignUp = () => {
        // 1. 모든 필드가 채워졌는지 확인
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert("입력 오류", "모든 항목을 입력해주세요.");
            return;
        }

        // 2. 비밀번호와 비밀번호 확인이 일치하는지 확인
        if (password !== confirmPassword) {
            Alert.alert("입력 오류", "비밀번호가 일치하지 않습니다.");
            return;
        }

        // 3. (나중에 추가) 실제 회원가입 로직 (백엔드 API 호출)
        console.log('회원가입 시도:', { name, email, password });

        // 4. 성공 알림 후 로그인 페이지로 이동
        Alert.alert("회원가입 성공", "로그인 페이지로 이동합니다.", [
            {
                text: "확인",
                onPress: () => router.back(), // 이전 페이지(로그인)로 돌아가기
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.innerContainer}>
                    <Text style={styles.title}>회원가입</Text>
                    
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>이름</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="이름을 입력하세요"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>아이디 (이메일)</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="이메일 주소를 입력하세요"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>비밀번호</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="비밀번호를 입력하세요"
                                secureTextEntry
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>비밀번호 확인</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="비밀번호를 다시 한번 입력하세요"
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
                        <Text style={styles.signupButtonText}>회원가입</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    innerContainer: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    form: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
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
    signupButton: {
        backgroundColor: 'green',
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    signupButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});