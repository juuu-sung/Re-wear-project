import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

 
const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
 
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

console.log("  EXPO_PUBLIC_BASE_URL:", process.env.EXPO_PUBLIC_BASE_URL);
console.log(" 최종 BASE_URL:", BASE_URL);


export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('010-');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (text) => {
     
    let clean = text.replace(/[^0-9]/g, '');

     
    if (!clean.startsWith('010')) {
      clean = '010';
    }

     
    if (clean.length > 11) {
      clean = clean.substring(0, 11);
    }

     
    let formatted = clean;
    if (clean.length > 3) {
      formatted = `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    if (clean.length > 7) {
      formatted = `${formatted.slice(0, 8)}-${formatted.slice(8)}`;
    }

    setPhoneNumber(formatted);
  };

   
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/healthz`);
        const body = await res.text();
        console.log(" 서버 연결 성공:", body);
      } catch (err) {
        console.log("❌ 서버 연결 실패:", err.message);
        Alert.alert("서버 연결 실패", "FastAPI 서버가 실행 중인지 확인하세요.");
      }
    })();
  }, []);
  
   
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;  
const PHONE_RE = /^010-\d{4}-\d{4}$/;

  function validateInputs({ name, email, password, confirmPassword , phoneNumber}) {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !phoneNumber.trim()) {
      return "모든 항목을 입력해주세요.";
    }
    if (!PHONE_RE.test(phoneNumber)) {
      return "전화번호 형식이 올바르지 않습니다. (010-0000-0000)";
    }
    if (!EMAIL_RE.test(email.trim())) {
      return "이메일 형식이 올바르지 않습니다.";
    }
    if (!PW_RE.test(password)) {
      return "비밀번호는 영문+숫자 조합 8자 이상이어야 합니다.";
    }
    if (password !== confirmPassword) {
      return "비밀번호가 일치하지 않습니다.";
    }
    return null;
  }

   
  function extractErrorMessage(body) {
    if (typeof body === "string") return body;
  
    if (Array.isArray(body)) {
      return body.map(extractErrorMessage).join("\n");
    }
  
    if (body && typeof body === "object") {
      if (Array.isArray(body.detail)) {
         
        return body.detail
          .map((d) => d.msg || d.detail || JSON.stringify(d))
          .join("\n");
      }
  
      if (typeof body.detail === "string") {
         
        if (body.detail.toLowerCase().includes("already") || body.detail.includes("존재")) {
          return "이미 존재하는 이메일입니다.";
        }
        return body.detail;
      }
  
      if (body.message) {
        if (body.message.toLowerCase().includes("already") || body.message.includes("존재")) {
          return "이미 존재하는 이메일입니다.";
        }
        return String(body.message);
      }
    }
  
    try {
      const text = JSON.stringify(body);
      if (text.toLowerCase().includes("already")) return "이미 존재하는 이메일입니다.";
      return text;
    } catch {
      return "알 수 없는 오류가 발생했습니다.";
    }
  }
  

   
  const handleSignUp = async () => {
    const errMsg = validateInputs({ name, email, password, confirmPassword, phoneNumber });
    if (errMsg) {
      Alert.alert("입력 오류", errMsg);
      return;
    }
  
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone_number: phoneNumber
        }),
      });
  
      const ct = res.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await res.json() : await res.text();
  
      if (!res.ok) {
        if (res.status === 409) {
          Alert.alert("회원가입 실패", "이미 존재하는 이메일입니다.");
          return;
        }
        const msg = extractErrorMessage(body) || "회원가입에 실패했습니다.";
        Alert.alert("회원가입 실패", msg);
        return;
      }
  
      Alert.alert("회원가입 성공", "로그인 페이지로 이동합니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
      console.log(" 회원가입 성공:", body);
  
    } catch (err) {
      console.error("❌ 네트워크 오류:", err);
      Alert.alert("네트워크 오류", "서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
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
            <LabeledInput
              label="닉네임"
              value={name}
              onChangeText={setName}
              placeholder="낙네임을 입력하세요"
            />
            <LabeledInput
              label="전화번호"
              placeholder="010-1234-5678"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="number-pad"
              maxLength={13}
            />
            <LabeledInput
              label="아이디 (이메일)"
              value={email}
              onChangeText={setEmail}
              placeholder="이메일 주소를 입력하세요"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <LabeledInput
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호를 입력하세요"
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
            />
            <LabeledInput
              label="비밀번호 확인"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="비밀번호를 다시 입력하세요"
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
            />
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && { opacity: 0.6 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.signupButtonText}>
              {loading ? "처리 중..." : "회원가입"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LabeledInput({ label, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  innerContainer: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
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
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
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
  signupButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
