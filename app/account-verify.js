import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function AccountVerifyScreen() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

   
  const handleVerify = async () => {
    if (!password.trim()) {
      Alert.alert("알림", "비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");

      await axios.post(
        `${BASE_URL}/v1/users/check-password`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVerified(true);

    } catch {
      Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

   
  const handleSave = async () => {
    if (newPassword.trim() === password.trim()) {
      Alert.alert("알림", "기존에 쓰던 비밀번호를 사용할 수 없습니다.");
      return;
    }

    if (!newName.trim() && !newPassword.trim()) {
      Alert.alert("알림", "변경할 값을 입력해주세요.");
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("access_token");
      const userId = await AsyncStorage.getItem("user_id");

      await axios.patch(
        `${BASE_URL}/v1/users/${userId}`,
        { name: newName, password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("성공", "계정 정보가 변경되었습니다.");
      router.back();

    } catch {
      Alert.alert("오류", "변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* 기존 비밀번호 영역 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>본인 확인</Text>

        <TextInput
          style={[styles.input, verified && styles.disabledInput]}
          placeholder="현재 비밀번호"
          secureTextEntry
          value={password}
          editable={!verified}
          onChangeText={setPassword}
        />

        {!verified && (
          <TouchableOpacity onPress={handleVerify} style={styles.submitButton}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitText}>확인</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 정보 수정 영역 */}
      {verified && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 정보 변경</Text>

          <TextInput
            style={styles.input}
            placeholder="새 이름"
            value={newName}
            onChangeText={setNewName}
          />

          <TextInput
            style={styles.input}
            placeholder="새 비밀번호"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>저장하기</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#efefef",
    padding: 20,
  },

  section: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#555",
  },

  input: {
    backgroundColor: "#f4f4f4",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },

  disabledInput: {
    backgroundColor: "#e8e8e8",
    color: "#777",
  },

  submitButton: {
    backgroundColor: "#f4f4f4",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },

  submitText: {
    fontSize: 15,
    fontWeight: "500",
  },

  saveButton: {
    marginTop: 5,
    backgroundColor: "#000",
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 10,
  },

  saveText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
