// app/index.js

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // 나중에 실제 로그인 로직 추가
        // 지금은 바로 메인 화면으로 이동
        router.replace('/home'); // 로그인 후 뒤로가기 못하게 replace 사용
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.innerContainer}
            >
                {/* 로고 */}
                <Text style={styles.logo}>Re:wear</Text>

                {/* 로그인 폼 */}
                <View style={styles.card}>
                    <TextInput
                        style={styles.input}
                        placeholder="아이디 또는 이메일"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="비밀번호"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>로그인</Text>
                    </TouchableOpacity>
                    <View style={styles.linksContainer}>
                        <TouchableOpacity><Text style={styles.linkText}>아이디 찾기</Text></TouchableOpacity>
                        <Text style={styles.linkSeparator}>|</Text>
                        <TouchableOpacity><Text style={styles.linkText}>비밀번호 찾기</Text></TouchableOpacity>
                        <Text style={styles.linkSeparator}>|</Text>
                        <TouchableOpacity onPress={() => router.push('/signup')}><Text style={styles.linkText}>회원가입</Text></TouchableOpacity>
                    </View>
                </View>

                {/* 소셜 로그인 */}
                <View style={styles.socialLoginContainer}>
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>또는</Text>
                        <View style={styles.dividerLine} />
                    </View>
                    <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
                        <Text style={styles.socialButtonText}>구글로 시작하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.socialButton, styles.kakaoButton]}>
                        <Text style={[styles.socialButtonText, styles.kakaoButtonText]}>카카오로 시작하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.socialButton, styles.naverButton]}>
                        <Text style={styles.socialButtonText}>네이버로 시작하기</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    innerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    logo: { fontSize: 48, fontWeight: 'bold', color: 'green', marginBottom: 30 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 30, width: '100%', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
    input: { height: 50, borderColor: '#e0e0e0', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
    loginButton: { backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginBottom: 20 },
    loginButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    linksContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    linkText: { color: '#6b7280', fontSize: 14 },
    linkSeparator: { color: '#d1d5db', marginHorizontal: 10 },
    socialLoginContainer: { width: '100%', marginTop: 40 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#d1d5db' },
    dividerText: { color: '#6b7280', marginHorizontal: 10 },
    socialButton: { borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center' },
    googleButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e0e0e0' },
    kakaoButton: { backgroundColor: '#FEE500' },
    naverButton: { backgroundColor: '#03C75A' },
    socialButtonText: { fontSize: 16, fontWeight: '500' },
    kakaoButtonText: { color: '#191919' },
});