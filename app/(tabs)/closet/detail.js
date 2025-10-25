// app/(tabs)/closet/detail.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function ClothesDetail() {
  const {
    id,
    name,
    category,
    image,
    material: initMaterial,
    washing: initWashing,
    materialBreakdown: initMaterialBreakdown,
  } = useLocalSearchParams();

  const router = useRouter();

  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState(String(name ?? ""));
  const [editedCategory, setEditedCategory] = useState(String(category ?? ""));
  const [imageUri, setImageUri] = useState(String(image ?? ""));

  // ✅ 소재/세탁법 상태
  const parseBreakdown = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(String(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const [material, setMaterial] = useState(() => (initMaterial ? String(initMaterial) : ""));
  const [washingInfo, setWashingInfo] = useState(""); // string 또는 object
  const [materialBreakdown, setMaterialBreakdown] = useState(() => parseBreakdown(initMaterialBreakdown));

  const [categories, setCategories] = useState(["상의", "하의", "아우터"]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const [sortOrder, setSortOrder] = useState("desc");
  const [showAll, setShowAll] = useState(false);

  // ✅ Gemini 요약 상태
  const [careSummary, setCareSummary] = useState(null);
  const [careLoading, setCareLoading] = useState(false);
  const [careError, setCareError] = useState(null);

  // 요약 UI 개선 상태
  const [expandCare, setExpandCare] = useState(false);

  // 요약 텍스트를 보기 좋게 파싱 (HTML 태그 제거, 한줄요약 추출, 1)~6) 섹션 파싱)
  const parseCareSummary = (text) => {
    if (!text || typeof text !== "string") return { sections: [], oneLiner: "" };

    // 1) HTML 태그 제거
    const stripTags = (s) => s.replace(/<[^>]+>/g, "");
    const cleaned = stripTags(text).replace(/\s+$/g, "");

    // 2) 한줄요약 추출
    const oneLinerMatch = cleaned.match(/한줄요약\s*:\s*(.+)$/m);
    const oneLiner = oneLinerMatch ? oneLinerMatch[1].trim() : "";
    const body = oneLinerMatch ? cleaned.replace(oneLinerMatch[0], "").trim() : cleaned;

    // 3) 줄 기준 분할
    const lines = body.split(/\n+/).map((l) => l.trim()).filter(Boolean);

    // 4) 1)~6) 섹션 파싱
    const sections = [];
    let current = null;
    lines.forEach((line) => {
      const m = line.match(/^(\d\))\s*([^:：]+)\s*[:：]?\s*(.*)$/); // 1) 제목: 내용
      if (m) {
        // 새 섹션 시작
        if (current) sections.push(current);
        current = { num: m[1], title: m[2].trim(), lines: [] };
        if (m[3]) current.lines.push(m[3].trim());
      } else if (current) {
        // 이어지는 문장(마침표 단위로 다시 쪼갬)
        line
          .split(/(?<=\.)\s+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => current.lines.push(s));
      }
    });
    if (current) sections.push(current);

    // 5) 잡음 제거
    const cleanedSections = sections.map((sec) => ({
      ...sec,
      lines: sec.lines.filter((t) => t.replace(/[.\s]/g, "").length > 0),
    }));

    return { sections: cleanedSections, oneLiner };
  };

  // 기본 세탁요약(세탁/건조/다림질/표백) 파싱
  const toBasicCare = (info) => {
    const def = { wash: "-", dry: "-", iron: "-", bleach: "-" };
    if (!info) return def;
    if (typeof info === "string") {
      const out = { ...def };
      info.split(/\n+/).forEach((line) => {
        const [k, ...rest] = String(line).split(":");
        const v = rest.join(":").trim();
        const key = (k || "").trim();
        if (/세탁/.test(key)) out.wash = v || out.wash;
        else if (/건조/.test(key)) out.dry = v || out.dry;
        else if (/다림질/.test(key)) out.iron = v || out.iron;
        else if (/표백/.test(key)) out.bleach = v || out.bleach;
      });
      return out;
    }
    if (typeof info === "object") {
      return {
        wash: info.wash ?? def.wash,
        dry: info.dry ?? def.dry,
        iron: info.iron ?? def.iron,
        bleach: info.bleach ?? def.bleach,
      };
    }
    return def;
  };

  const copyCareSummary = async () => {
    try {
      await Clipboard.setStringAsync(careSummary || "");
      Alert.alert("복사됨", "세탁 요약이 클립보드에 복사되었습니다.");
    } catch {
      Alert.alert("오류", "복사 중 문제가 발생했습니다.");
    }
  };

  // 후보 형태를 백엔드 규격으로 정규화
  const buildCandidates = () => {
    try {
      return (materialBreakdown || []).map((m) => ({
        label: m?.name ?? m?.label ?? (m?.material ?? "-"),
        prob:
          typeof m?.prob === "number"
            ? m.prob
            : typeof m?.confidence === "number"
            ? m.confidence
            : undefined,
      }));
    } catch {
      return [];
    }
  };

  // ✅ 최초 진입 시 washing 파라미터가 JSON 문자열이면 파싱
  useEffect(() => {
    if (!initWashing) return;
    try {
      const parsed = JSON.parse(String(initWashing));
      setWashingInfo(parsed);
    } catch {
      setWashingInfo(String(initWashing));
    }
  }, [initWashing]);

  useEffect(() => {
    setMaterialBreakdown(parseBreakdown(initMaterialBreakdown));
  }, [initMaterialBreakdown]);

  // ✅ 카테고리 불러오기
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const saved = await AsyncStorage.getItem("categories");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCategories([...new Set(["상의", "하의", "아우터", ...parsed])]);
        }
      } catch {}
    };
    loadCategories();
  }, []);

  // ✅ “이 옷의 기록” 불러오기
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        const userId = await AsyncStorage.getItem("user_id");
        if (!token || !userId || !BASE_URL) return;

        const eventRes = await fetch(`${BASE_URL}/events?user_id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!eventRes.ok) return;

        const eventData = await eventRes.json();
        const filtered = eventData
          .filter((e) => String(e.garment_id) === String(id))
          .map((e) => ({ date: e.date?.split("T")[0], type: e.type }));
        setHistory(filtered);
      } catch (err) {
        console.log("이 옷의 기록 불러오기 실패:", err);
      }
    };
    fetchHistory();
  }, [id]);

  // ✅ 날짜/정렬
  const sortedHistory = [...history].sort((a, b) => {
    const da = new Date(a.date);
    const db = new Date(b.date);
    return sortOrder === "asc" ? da - db : db - da;
  });
  const formatDate = (s) => (s ? String(s).replace(/-/g, ".") : "");

  // ✅ 사진 변경
  const changePhoto = async () => {
    const launch = async (mode) => {
      const result =
        mode === "camera"
          ? await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const ensure = async (permFn, mode) => {
      const p = await permFn();
      if (!p.granted) {
        Alert.alert("권한 필요", "사진/카메라 접근 권한을 허용해주세요.");
        return;
      }
      await launch(mode);
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["카메라로 촬영", "앨범에서 선택", "취소"], cancelButtonIndex: 2 },
        (i) => {
          if (i === 0) ensure(ImagePicker.requestCameraPermissionsAsync, "camera");
          if (i === 1) ensure(ImagePicker.requestMediaLibraryPermissionsAsync, "library");
        }
      );
    } else {
      Alert.alert("사진 변경", "사용할 방법을 선택하세요", [
        { text: "카메라", onPress: () => ensure(ImagePicker.requestCameraPermissionsAsync, "camera") },
        { text: "앨범", onPress: () => ensure(ImagePicker.requestMediaLibraryPermissionsAsync, "library") },
        { text: "취소", style: "cancel" },
      ]);
    }
  };

  // ✅ AI 재분석
  const analyzeAgain = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return Alert.alert("로그인 필요", "다시 로그인해주세요.");
      if (!BASE_URL) return Alert.alert("설정 오류", "EXPO_PUBLIC_BASE_URL이 비어 있어요.");

      const res = await fetch(`${BASE_URL}/clothes/analyze/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert("분석 실패", data.detail || "서버 오류");

      setMaterial(data.material ?? "");
      setWashingInfo(data.washing ?? "");
      setMaterialBreakdown(
        Array.isArray(data.top5) && data.top5.length
          ? data.top5
          : parseBreakdown(data.material_breakdown)
      );
      // 분석 결과가 바뀌었으니 이전 Gemini 요약은 초기화
      setCareSummary(null);
      Alert.alert("분석 완료", "AI 세탁 가이드를 업데이트했어요.");
    } catch (e) {
      console.error(e);
      Alert.alert("네트워크 오류", String(e?.message || e));
    }
  };

  // ✅ Gemini 세탁 설명 생성
  const fetchCareSummary = async () => {
    try {
      setCareError(null);
      setCareLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        setCareLoading(false);
        return Alert.alert("로그인 필요", "다시 로그인해주세요.");
      }
      if (!BASE_URL) {
        setCareLoading(false);
        return Alert.alert("설정 오류", "EXPO_PUBLIC_BASE_URL이 비어 있어요.");
      }

      const body = {
        material: material || null,
        candidates: buildCandidates(),
        washing: typeof washingInfo === "string" ? washingInfo : (washingInfo || {}),
        locale: "ko",
      };

      const res = await fetch(`${BASE_URL}/care/summary`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setCareError(data?.detail || "요약 생성 실패");
        return;
      }
      setCareSummary(data?.summary || "");
    } catch (e) {
      setCareError(String(e?.message || e));
    } finally {
      setCareLoading(false);
    }
  };
  // 소재/세탁 정보가 변하면 이전 Gemini 요약 초기화
  useEffect(() => {
    setCareSummary(null);
  }, [material, washingInfo, JSON.stringify(materialBreakdown)]);

  // ✅ 수정 저장
  const handleUpdate = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) return Alert.alert("로그인 필요", "다시 로그인해주세요.");

      const formData = new FormData();
      formData.append("name", editedName);
      formData.append("category", editedCategory);
      formData.append(
        "washing_info",
        typeof washingInfo === "string" ? washingInfo : JSON.stringify(washingInfo || {})
      );

      if (imageUri && !imageUri.startsWith(BASE_URL)) {
        const filename = imageUri.split("/").pop() || `photo_${Date.now()}.jpg`;
        const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
        formData.append("image", {
          uri: imageUri,
          name: filename,
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });
      }

      const res = await fetch(`${BASE_URL}/clothes/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { detail: text };
      }

      if (!res.ok) return Alert.alert("오류", data.detail || "수정 실패");

      Alert.alert("수정 완료", `"${editedName}" 정보가 업데이트되었습니다.`);
      setEditMode(false);
      router.replace("/(tabs)/closet");
    } catch (err) {
      console.error("수정 오류:", err);
      Alert.alert("서버 오류", "수정 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 삭제
  const handleDelete = async () => {
    Alert.alert("삭제 확인", `"${name}"을(를) 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("access_token");
            if (!token) return Alert.alert("로그인 필요", "다시 로그인해주세요.");

            const res = await fetch(`${BASE_URL}/clothes/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
              Alert.alert("삭제 완료", `"${name}"이(가) 삭제되었습니다.`);
              router.replace("/(tabs)/closet");
            } else {
              const errData = await res.json();
              Alert.alert("삭제 실패", errData.detail || "삭제 중 오류 발생");
            }
          } catch (err) {
            console.error("삭제 오류:", err);
            Alert.alert("오류", "서버에 연결할 수 없습니다.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 이미지 */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          {editMode && (
            <TouchableOpacity style={styles.editPhotoBtn} onPress={changePhoto}>
              <Ionicons name="create-outline" size={22} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        {/* 이름 / 카테고리 / 소재 */}
        {editMode ? (
          <>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="옷 이름을 입력하세요"
            />

            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catBtn,
                    editedCategory === cat && styles.catBtnActive,
                  ]}
                  onPress={() => setEditedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catText,
                      editedCategory === cat && styles.catTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.name}>{editedName}</Text>
            <Text style={styles.category}>{editedCategory}</Text>

            {/* ✅ 소재 표기 */}
            <View style={styles.materialHeaderRow}>
              <Text style={styles.material}>
                {material ? `주요 소재: ${material}` : "주요 소재 정보 없음"}
              </Text>
              <TouchableOpacity style={styles.reanalyzeBtn} onPress={analyzeAgain}>
                <Ionicons name="sparkles-outline" size={18} color="#2e7d32" />
                <Text style={styles.reanalyzeText}>AI 재분석</Text>
              </TouchableOpacity>
            </View>
            {materialBreakdown.length > 0 && (
              <View style={styles.materialBreakdownBox}>
                {materialBreakdown.map((m, idx) => {
                  const prob = typeof m.prob === "number" ? m.prob : typeof m.confidence === "number" ? m.confidence : 0;
                  return (
                    <Text key={`${m.name ?? idx}-${idx}`} style={styles.materialBreakdownItem}>
                      • {m.name ?? "-"} ({Math.round(prob * 100)}%)
                    </Text>
                  );
                })}
              </View>
            )}

            {/* 세탁법 (기본 카드) */}
            {(() => {
              const b = toBasicCare(washingInfo);
              return (
                <View style={styles.careBasicCard}>
                  <View style={styles.careBasicRow}>
                    <View style={styles.careBasicLabelWrap}>
                      <Ionicons name="water-outline" size={16} color="#2e7d32" />
                      <Text style={styles.careBasicLabel}>세탁</Text>
                    </View>
                    <Text style={styles.careBasicValue}>{b.wash}</Text>
                  </View>
                  <View style={styles.careBasicRow}>
                    <View style={styles.careBasicLabelWrap}>
                      <Ionicons name="cloud-outline" size={16} color="#2e7d32" />
                      <Text style={styles.careBasicLabel}>건조</Text>
                    </View>
                    <Text style={styles.careBasicValue}>{b.dry}</Text>
                  </View>
                  <View style={styles.careBasicRow}>
                    <View style={styles.careBasicLabelWrap}>
                      <Ionicons name="thermometer-outline" size={16} color="#2e7d32" />
                      <Text style={styles.careBasicLabel}>다림질</Text>
                    </View>
                    <Text style={styles.careBasicValue}>{b.iron}</Text>
                  </View>
                  <View style={styles.careBasicRow}>
                    <View style={styles.careBasicLabelWrap}>
                      <Ionicons name="beaker-outline" size={16} color="#2e7d32" />
                      <Text style={styles.careBasicLabel}>표백</Text>
                    </View>
                    <Text style={styles.careBasicValue}>{b.bleach}</Text>
                  </View>
                </View>
              );
            })()}

            {/* Gemini 생성 설명 (개선 UI) */}
            <View style={styles.careContainer}>
              <View style={styles.careHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="sparkles-outline" size={16} color="#2e7d32" />
                  <Text style={styles.careTitle}>세탁 요약 (Gemini)</Text>
                  <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  {!!careSummary && (
                    <TouchableOpacity onPress={copyCareSummary} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="copy-outline" size={18} color="#2e7d32" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.careBtn} onPress={fetchCareSummary} disabled={careLoading}>
                    <Text style={styles.careBtnText}>{careLoading ? "생성 중..." : (careSummary ? "다시 생성" : "생성하기")}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {careError ? (
                <Text style={styles.careError}>{careError}</Text>
              ) : careLoading ? (
                <View style={{ paddingVertical: 10, alignItems: "center" }}>
                  <ActivityIndicator />
                </View>
              ) : careSummary ? (
                (() => {
                  const { sections, oneLiner } = parseCareSummary(careSummary);
                  const visible = expandCare ? sections : sections.slice(0, 3);
                  return (
                    <View>
                      {!!oneLiner && (
                        <View style={styles.oneLineBox}>
                          <Ionicons name="alert-circle-outline" size={16} color="#1b5e20" />
                          <Text style={styles.oneLineText}>{oneLiner}</Text>
                        </View>
                      )}
                      <View style={styles.careBox}>
                        {visible.length === 0 ? (
                          <Text style={styles.careText}>{careSummary}</Text>
                        ) : (
                          visible.map((sec, idx) => (
                            <View key={`care-sec-${idx}`} style={styles.sectionBox}>
                              <View style={styles.sectionHeader}>
                                <Text style={styles.stepNum}>{sec.num}</Text>
                                <Text style={styles.sectionTitle}>{sec.title}</Text>
                              </View>
                              {sec.lines.map((t, j) => (
                                <View key={`care-line-${idx}-${j}`} style={styles.bulletRow}>
                                  <Ionicons name="ellipse" size={6} color="#2e7d32" style={{ marginTop: 8 }} />
                                  <Text style={styles.bulletText}>{t}</Text>
                                </View>
                              ))}
                            </View>
                          ))
                        )}
                      </View>
                      {sections.length > 3 && (
                        <TouchableOpacity onPress={() => setExpandCare((v) => !v)} style={styles.moreBtn}>
                          <Text style={styles.moreBtnText}>{expandCare ? "접기 ▲" : `더보기 (${sections.length - 3}개) ▼`}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })()
              ) : (
                <Text style={styles.careHint}>소재/세탁 정보를 바탕으로 간단한 요약을 생성합니다.</Text>
              )}
            </View>

            {/* 기록 */}
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>이 옷의 기록</Text>
                <TouchableOpacity onPress={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}>
                  <Ionicons
                    name={sortOrder === "desc" ? "arrow-down-outline" : "arrow-up-outline"}
                    size={20}
                    color="#2e7d32"
                  />
                </TouchableOpacity>
              </View>

              {history.length === 0 ? (
                <Text style={styles.historyEmpty}>아직 기록이 없습니다.</Text>
              ) : (
                (showAll ? sortedHistory : sortedHistory.slice(0, 3)).map((event, idx) => (
                  <View key={`${event.date}-${event.type}-${idx}`} style={styles.historyItem}>
                    <Ionicons
                      name={event.type === "wear" ? "shirt-outline" : "water-outline"}
                      size={18}
                      color={event.type === "wear" ? "#2E8B57" : "#1565C0"}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.historyText}>
                      {formatDate(event.date)} — {event.type === "wear" ? "착용" : "세탁"}
                    </Text>
                  </View>
                ))
              )}

              {sortedHistory.length > 3 && (
                <TouchableOpacity onPress={() => setShowAll(!showAll)} style={styles.moreBtn}>
                  <Text style={styles.moreBtnText}>
                    {showAll ? "접기 ▲" : `더보기 (${sortedHistory.length - 3}개) ▼`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* 하단 버튼들 */}
        <View style={styles.btnRow}>
          {editMode ? (
            <>
              <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                <View style={styles.textButton}>
                  <Ionicons name="checkmark" size={20} color="#000" />
                  <Text style={styles.textBtnLabel}>{loading ? "저장 중..." : "저장"}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDelete}>
                <View style={styles.textButton}>
                  <Ionicons name="trash-outline" size={20} color="#000" />
                  <Text style={styles.textBtnLabel}>삭제</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => setEditMode(true)}>
              <View style={styles.textButton}>
                <Ionicons name="create-outline" size={20} color="#000" />
                <Text style={styles.textBtnLabel}>수정</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { alignItems: "center", paddingTop: 100, paddingBottom: 60 },
  imageContainer: { position: "relative" },
  image: { width: 260, height: 260, borderRadius: 16, marginBottom: 25 },
  editPhotoBtn: {
    position: "absolute",
    bottom: 23,
    right: -7,
    backgroundColor: "#FFFFFF00",
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  name: { fontSize: 26, fontWeight: "700", color: "#000", marginBottom: 6 },
  category: { fontSize: 18, color: "#666", marginBottom: 6 },
  materialHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
    marginBottom: 6,
    gap: 8,
  },
  material: { flex: 1, fontSize: 15, color: "#2e7d32" },
  materialBreakdownBox: { width: "90%", alignSelf: "center", marginBottom: 16 },
  materialBreakdownItem: { fontSize: 14, color: "#444", lineHeight: 20, textAlign: "left" },
  input: {
    width: "90%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "90%",
    gap: 10,
    marginBottom: 30,
  },
  catBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  catBtnActive: { backgroundColor: "#2e7d32", borderColor: "#2e7d32" },
  catText: { color: "#777", fontSize: 15 },
  catTextActive: { color: "#fff", fontWeight: "600" },
  washDisplay: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F5FAF7",
    borderRadius: 12,
    padding: 10,
    width: "90%",
    marginBottom: 12,
  },
  washText: { flex: 1, color: "#333", fontSize: 15, lineHeight: 22 },
  reanalyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  reanalyzeText: { color: "#2e7d32", fontWeight: "700" },
  historyContainer: {
    width: "90%",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 30,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyTitle: { fontSize: 17, fontWeight: "700", color: "#000" },
  historyItem: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  historyText: { fontSize: 15, color: "#333" },
  historyEmpty: { fontSize: 14, color: "#888", fontStyle: "italic" },
  moreBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  moreBtnText: { color: "#2e7d32", fontSize: 14, fontWeight: "600" },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "70%",
    marginTop: 10,
  },
  textButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  textBtnLabel: { fontSize: 16, color: "#000", fontWeight: "600" },
  careContainer: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#F5FAF7",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  careHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  careTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  careBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  careBtnText: { color: "#2e7d32", fontWeight: "700" },
  careBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e4efe7",
  },
  careText: { color: "#333", fontSize: 15, lineHeight: 22 },
  careHint: { color: "#666", fontSize: 13 },
  careError: { color: "#c62828", fontSize: 14, fontWeight: "600" },
  aiBadge: {
    borderWidth: 1,
    borderColor: "#cbe6d3",
    backgroundColor: "#e8f5ee",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: { fontSize: 11, color: "#2e7d32", fontWeight: "700" },
  oneLineBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eaf7ef",
    borderColor: "#d7efe1",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  oneLineText: { color: "#1b5e20", fontSize: 14, fontWeight: "700", flexShrink: 1 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  bulletText: { color: "#333", fontSize: 15, lineHeight: 22, flex: 1 },
  stepNum: { color: "#1565C0", fontWeight: "700", marginTop: 2, marginRight: 6 },
  sectionBox: { borderTopWidth: 1, borderTopColor: "#e9efe9", paddingTop: 8, marginTop: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0f5132" },
  careBasicCard: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#F5FAF7",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e4efe7",
  },
  careBasicRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#e9efe9",
  },
  careBasicLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  careBasicLabel: { fontSize: 14, fontWeight: "700", color: "#0f5132" },
  careBasicValue: { flex: 1, textAlign: "right", color: "#333", fontSize: 15, lineHeight: 22, marginLeft: 12 },
});
