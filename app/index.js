// app/index.js
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ 추가!
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { login } from '@react-native-seoul/kakao-login';

// ✅ 서버 주소 자동 설정
const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // ✅ 카카오 로그인 버튼을 눌렀을 때 실행될 함수
    const handleKakaoLogin = async () => {
        try {
            console.log("카카오 로그인 시도...");
            // 1. 입구에서 '임시 팔찌' 받기
            const kakaoToken = await login();
            console.log("✅ 카카오 임시 팔찌 확보:", kakaoToken.accessToken);

            // 2. 백엔드 VIP 카운터로 가서 'VIP 팔찌'로 교환 요청
            const res = await fetch(`${BASE_URL}/auth/kakao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: kakaoToken.accessToken }),
            });

            const body = await res.json();

            if (!res.ok) {
                console.error("❌ VIP 팔찌 교환 실패 (백엔드 오류):", body);
                throw new Error(body.detail || "서버에서 토큰 교환에 실패했습니다.");
            }

            console.log("✅ 진짜 VIP 팔찌(JWT) 확보:", body.access_token);

            // 3. 받은 VIP 팔찌와 내 정보를 주머니(AsyncStorage)에 잘 보관
            await AsyncStorage.setItem('access_token', body.access_token);
            await AsyncStorage.setItem('user_id', String(body.user_id));
            
            // 4. 이제 VIP가 되었으니 메인 화면으로 이동!
            Alert.alert("로그인 성공", "환영합니다!");
            router.replace("/home"); // ✅ '/home'은 실제 메인 화면 경로로 수정하세요.

        } catch (error) {
            console.error("❌ 전체 로그인 과정 실패:", error);
            // 사용자가 카카오 창을 그냥 닫은 경우는 'cancelled' 오류가 발생하며, 이건 정상적인 행동이므로 조용히 처리합니다.
            if (error.message.includes('cancelled')) {
                return;
            }
            Alert.alert("로그인 실패", "로그인 중 오류가 발생했습니다. 서버 연결을 확인해주세요.");
        }
    };
// 🔥 [설정] 앱이 켜질 때 한 번만 실행되게 설정 (useEffect 안에 넣어도 됨)
    // "웹 클라이언트 ID"를 넣어야 백엔드가 검증할 수 있는 토큰을 줍니다.
    GoogleSignin.configure({
        webClientId: '472072812397-f51bchihsifn54boars84kf82uv2eeia.apps.googleusercontent.com', 
        iosClientId: '472072812397-6r17olqpffqsdioudtu0n8s6fjk80n2e.apps.googleusercontent.com',
        offlineAccess: true, // 구글은 이거 켜야 idToken을 잘 줍니다.
    });

    // 🔥 [추가] 구글 로그인 핸들러
    const handleGoogleLogin = async () => {
        try {
            console.log("구글 로그인 시도...");
            
            // 1. 구글 플레이 서비스 확인 (안드로이드 필수)
            await GoogleSignin.hasPlayServices();
            
            // 2. 로그인 창 띄우기
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken; // 최신 버전은 구조가 이렇습니다.
            // (혹시 userInfo.idToken 이라면 그걸 쓰세요)

            console.log("✅ 구글 ID 토큰 확보:", idToken);

            if (!idToken) {
                Alert.alert("오류", "구글 토큰을 가져오지 못했습니다.");
                return;
            }

            // 3. 백엔드로 토큰 전송
            const res = await fetch(`${BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: idToken }),
            });

            const body = await res.json();

            if (res.ok) {
                // 로그인 성공! (저장 로직은 카카오와 동일)
                await AsyncStorage.setItem("access_token", body.access_token);
                await AsyncStorage.setItem("user_id", String(body.user_id));
                // 필요하면 이름 등도 저장
                router.replace("/(tabs)/home");
            } else {
                Alert.alert("로그인 실패", body.detail || "구글 로그인 실패");
            }

        } catch (error) {
            console.error("구글 로그인 에러:", error);
        }
    };
    // ✅ 로그인 처리 함수
    const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
    return;
  }

  try {
    setLoading(true);
    console.log("📡 로그인 요청:", `${BASE_URL}/auth/login`);

    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password,
      }),
    });

    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();

    console.log("📩 서버 응답:", body);

    if (!res.ok) {
      let msg = "로그인에 실패했습니다.";
      if (typeof body === "object" && body.detail) msg = body.detail;
      if (typeof body === "string") msg = body;
      Alert.alert("로그인 실패", msg);
      return;
    }

    // ✅ 토큰 저장
    if (body?.access_token) {
      await AsyncStorage.setItem("access_token", body.access_token);
      console.log("✅ 토큰 저장 완료:", body.access_token);
    } else {
      console.warn("⚠️ access_token 없음:", body);
    }

    // ✅ user_id 저장 (서버 구조에 맞게)
    if (body?.user?.id) {
      await AsyncStorage.setItem("user_id", String(body.user.id));
      console.log("💾 저장된 user_id (user.id):", body.user.id);
    } else if (body?.id) {
      await AsyncStorage.setItem("user_id", String(body.id));
      console.log("💾 저장된 user_id (id):", body.id);
    } else if (body?.user_id) {
      await AsyncStorage.setItem("user_id", String(body.user_id));
      console.log("💾 저장된 user_id (user_id):", body.user_id);
    } else {
      console.warn("⚠️ 로그인 응답에 user_id 없음:", body);
    }

    // ✅ username도 저장 (옷장/홈 화면에서 표시용)
    if (body?.username) {
      await AsyncStorage.setItem("username", body.username);
      console.log("💾 저장된 username:", body.username);
    }

    // ✅ 실제 저장 확인 (디버깅용)
    const savedId = await AsyncStorage.getItem("user_id");
    console.log("🧠 AsyncStorage에 저장된 user_id:", savedId);

    // ✅ 로그인 성공 시 홈으로 이동
    Alert.alert("로그인 성공", "홈 화면으로 이동합니다.", [
      { text: "확인", onPress: () => router.replace("/home") },
    ]);

  } catch (err) {
    console.error("❌ 로그인 네트워크 오류:", err);
    Alert.alert("네트워크 오류", "서버와 연결할 수 없습니다.");
  } finally {
    setLoading(false);
  }
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
                    <TouchableOpacity
                        style={[styles.loginButton, loading && { opacity: 0.6 }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.loginButtonText}>
                            {loading ? "로그인 중..." : "로그인"}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.linksContainer}>
                        <TouchableOpacity><Text style={styles.linkText}>아이디 찾기</Text></TouchableOpacity>
                        <Text style={styles.linkSeparator}>|</Text>
                        <TouchableOpacity><Text style={styles.linkText}>비밀번호 찾기</Text></TouchableOpacity>
                        <Text style={styles.linkSeparator}>|</Text>
                        <TouchableOpacity onPress={() => router.push('/signup')}>
                            <Text style={styles.linkText}>회원가입</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 소셜 로그인 */}
                <View style={styles.socialLoginContainer}>
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>또는</Text>
                        <View style={styles.dividerLine} />
                    </View>
                    <TouchableOpacity 
                      style={[styles.socialButton, { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', marginTop: 10 }]} 
            onPress={handleGoogleLogin}
        >
            {/* 구글은 보통 흰 배경에 검은 글씨 or 회색 글씨 */}
            <Text style={[styles.socialButtonText, { color: 'black' }]}>구글로 시작하기</Text>
        </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.socialButton, { backgroundColor: '#FEE500' }]}
                        onPress={handleKakaoLogin} // onPress에 handleKakaoLogin 연결
                    >
                      <Text style={[styles.socialButtonText, { color: '#000000' }]}>카카오로 시작하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.socialButton, styles.naverButton]}>
                        <Text style={styles.socialButtonText}>네이버로 시작하기</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ✅ 스타일 (UI 그대로)
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