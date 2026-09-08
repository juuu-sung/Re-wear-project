import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function AccountVerifyScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!password.trim()) {
      Alert.alert("알림", "비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");

      const res = await axios.post(
        `${BASE_URL}/v1/users/check-password`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.valid === true) {
        router.push("/account-settings");
      } else {
        Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("오류", "비밀번호 확인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>본인 확인</Text>

      <TextInput
        style={styles.input}
        placeholder="현재 비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={submit} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "확인 중..." : "확인"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: "#ddd",
    borderRadius: 8, padding: 12, marginBottom: 20
  },
  button: {
    backgroundColor: "green",
    padding: 15, borderRadius: 10,
    alignItems: "center"
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" }
});
