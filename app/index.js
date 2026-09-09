 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// TEMP: disable Google Sign-In for Expo Go (native module unavailable)
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { login } from '@react-native-seoul/kakao-login';

 
const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

     
    const handleKakaoLogin = async () => {
        try {
             
            const kakaoToken = await login();

             
            const res = await fetch(`${BASE_URL}/auth/kakao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access_token: kakaoToken.accessToken }),
            });

            const body = await res.json();

            if (!res.ok) {
                throw new Error(body.detail || "서버에서 토큰 교환에 실패했습니다.");
            }


             
            await AsyncStorage.setItem('access_token', body.access_token);
            await AsyncStorage.setItem('user_id', String(body.user_id));
            
             
            Alert.alert("로그인 성공", "환영합니다!");
            router.replace("/home");  

        } catch (error) {
             
            if (error.message.includes('cancelled')) {
                return;
            }
            Alert.alert("로그인 실패", "로그인 중 오류가 발생했습니다. 서버 연결을 확인해주세요.");
        }
    };
 
     
    // GoogleSignin.configure({
    //     webClientId: '472072812397-f51bchihsifn54boars84kf82uv2eeia.apps.googleusercontent.com',
    //     iosClientId: '472072812397-6r17olqpffqsdioudtu0n8s6fjk80n2e.apps.googleusercontent.com',
    //     offlineAccess: true,
    // });

     
    // const handleGoogleLogin = async () => {
    //     try {
    //
    //         await GoogleSignin.hasPlayServices();
    //
    //         const userInfo = await GoogleSignin.signIn();
    //         const idToken = userInfo.data?.idToken;
    //
    //
    //         if (!idToken) {
    //             Alert.alert("오류", "구글 토큰을 가져오지 못했습니다.");
    //             return;
    //         }
    //
    //         const res = await fetch(`${BASE_URL}/auth/google`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ id_token: idToken }),
    //         });
    //
    //         const body = await res.json();
    //
    //         if (res.ok) {
    //             await AsyncStorage.setItem("access_token", body.access_token);
    //             await AsyncStorage.setItem("user_id", String(body.user_id));
    //             router.replace("/(tabs)/home");
    //         } else {
    //             Alert.alert("로그인 실패", body.detail || "구글 로그인 실패");
    //         }
    //
    //     } catch (error) {
    //     }
    // };
     
    const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
    return;
  }

  try {
    setLoading(true);

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


    if (!res.ok) {
      let msg = "로그인에 실패했습니다.";
      if (typeof body === "object" && body.detail) msg = body.detail;
      if (typeof body === "string") msg = body;
      Alert.alert("로그인 실패", msg);
      return;
    }

     
    if (body?.access_token) {
      await AsyncStorage.setItem("access_token", body.access_token);
    } else {
    }

     
    if (body?.user?.id) {
      await AsyncStorage.setItem("user_id", String(body.user.id));
    } else if (body?.id) {
      await AsyncStorage.setItem("user_id", String(body.id));
    } else if (body?.user_id) {
      await AsyncStorage.setItem("user_id", String(body.user_id));
    } else {
    }

     
    if (body?.username) {
      await AsyncStorage.setItem("username", body.username);
    }

     

     
    Alert.alert("로그인 성공", "홈 화면으로 이동합니다.", [
      { text: "확인", onPress: () => router.replace("/home") },
    ]);

  } catch (_err) {
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
                    {/* Google 로그인은 Expo Go에서 비활성화 */}
                    <TouchableOpacity 
                        style={[styles.socialButton, { backgroundColor: '#FEE500' }]}
                        onPress={handleKakaoLogin}  
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
