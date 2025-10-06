// app/infer.js
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

async function pickImage(source = "camera") {
  const perm = source === "camera"
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("권한 필요", "이미지 접근 권한이 없습니다.");
    return null;
  }
  const picker = source === "camera"
    ? await ImagePicker.launchCameraAsync({ base64: false, quality: 1 })
    : await ImagePicker.launchImageLibraryAsync({ base64: false, quality: 1 });

  if (picker.canceled) return null;

  // 사이즈 줄이기(네트워크 부담↓)
  const m = await ImageManipulator.manipulateAsync(
    picker.assets[0].uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return { uri: m.uri, base64: m.base64 };
}

async function postInfer(path, imageBase64) {
  const endpoint = `${BASE_URL}${path}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: `data:image/jpeg;base64,${imageBase64}` }),
  });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    throw new Error(typeof body === "string" ? body : (body.detail || "서버 오류"));
  }
  return body;
}

export default function InferScreen() {
  const [img, setImg] = useState(null);            // { uri, base64 }
  const [labelRes, setLabelRes] = useState(null);  // { ok, label, ... }
  const [matRes, setMatRes] = useState(null);      // { ok, materials, primary, ... }
  const [loading, setLoading] = useState(false);

  const choose = async (from) => {
    try {
      const picked = await pickImage(from);
      if (picked) {
        setImg(picked);
        setLabelRes(null);
        setMatRes(null);
      }
    } catch (e) {
      Alert.alert("이미지 선택 실패", String(e?.message || e));
    }
  };

  const runLabel = async () => {
    if (!img) return Alert.alert("이미지 없음", "먼저 이미지를 선택하세요.");
    try {
      setLoading(true);
      const data = await postInfer("/infer/label", img.base64);
      setLabelRes(data);
    } catch (e) {
      Alert.alert("라벨 인식 실패", String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const runMaterial = async () => {
    if (!img) return Alert.alert("이미지 없음", "먼저 이미지를 선택하세요.");
    try {
      setLoading(true);
      const data = await postInfer("/infer/material", img.base64);
      setMatRes(data);
    } catch (e) {
      Alert.alert("소재 인식 실패", String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.wrap}>
      <ScrollView contentContainerStyle={s.inner}>
        <Text style={s.title}>AI 추론</Text>

        <View style={s.row}>
          <Btn text="카메라" onPress={() => choose("camera")} />
          <Btn text="앨범" onPress={() => choose("library")} />
        </View>

        {img && (
          <View style={s.previewBox}>
            <Image source={{ uri: img.uri }} style={s.preview} />
          </View>
        )}

        <View style={s.row}>
          <Btn text={loading ? "라벨…" : "라벨 인식"} onPress={runLabel} disabled={loading} />
          <Btn text={loading ? "소재…" : "소재 인식"} onPress={runMaterial} disabled={loading} />
        </View>

        {labelRes && (
          <Card title="라벨 결과">
            <Text>mode: {labelRes.mode}</Text>
            <Text>label: {labelRes.label}</Text>
            {"confidence" in labelRes && <Text>confidence: {Math.round(labelRes.confidence * 100)}%</Text>}
          </Card>
        )}

        {matRes && (
          <Card title="소재 결과">
            <Text>mode: {matRes.mode}</Text>
            <Text>primary: {matRes.primary}</Text>
            {Array.isArray(matRes.materials) &&
              matRes.materials.map((m, i) => (
                <Text key={i}>
                  • {m.name} ({Math.round(m.confidence * 100)}%)
                </Text>
              ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Btn({ text, onPress, disabled }) {
  return (
    <TouchableOpacity style={[s.btn, disabled && { opacity: 0.6 }]} onPress={onPress} disabled={disabled}>
      <Text style={s.btnTxt}>{text}</Text>
    </TouchableOpacity>
  );
}

function Card({ title, children }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#f5f5f5" },
  inner: { padding: 20 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 16 },
  row: { flexDirection: "row", gap: 12, marginVertical: 8 },
  btn: { backgroundColor: "green", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10 },
  btnTxt: { color: "white", fontWeight: "700" },
  previewBox: { marginTop: 12, borderRadius: 10, overflow: "hidden", backgroundColor: "#fff" },
  preview: { width: "100%", height: 280, resizeMode: "cover" },
  card: { backgroundColor: "white", borderRadius: 10, padding: 16, marginTop: 14, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
});
