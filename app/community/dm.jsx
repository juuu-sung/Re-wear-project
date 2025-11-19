import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Image } from "react-native";

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function MessageList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [myId, setMyId] = useState(null);
  const [rooms, setRooms] = useState([]); // ⬅️ 빈 배열로

  const [loading, setLoading] = useState(true);

  // ============================================
  // 1) 로컬 user_id 불러오기
  // ============================================
  useEffect(() => {
    const loadUid = async () => {
      const uid = await AsyncStorage.getItem("user_id");
      setMyId(uid);
    };
    loadUid();
  }, []);

  // ============================================
  // 2) 내 DM 목록 불러오기
  // ============================================
  useEffect(() => {
    if (!myId) return;

    const loadRooms = async () => {
      try {
        const res = await fetch(`${BASE_URL}/v1/chat/my-rooms?user_id=${myId}`);
        const data = await res.json();
        console.log("🔥 my-rooms 응답:", data);
        setRooms(data);
      } catch (err) {
        console.log("채팅방 목록 불러오기 오류:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [myId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  // ============================================
  // 3) 메시지 리스트 UI
  // ============================================
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: insets.top - 60,
        paddingHorizontal: 12,
      }}
    >
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.room_id.toString()}
        renderItem={({ item }) => {
          const hasProfile =
            item.opponent_profile &&
            item.opponent_profile.trim() !== "";

          return (
            <TouchableOpacity
              onPress={() => {
                // 🔥 ChatRoom으로 상세 정보 전달
                const url =
                  `/chat/${item.room_id}?myId=${myId}` +
                  `&opponentId=${item.opponent_id}` +
                  `&opponentName=${encodeURIComponent(item.opponent_name ?? "")}` +
                  `&opponentProfile=${encodeURIComponent(item.opponent_profile ?? "")}`;

                router.replace(url);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderColor: "#eee",
              }}
            >
              {/* -------------------------------------------------
                 프로필 사진 (기본 아이콘 포함)
              -------------------------------------------------- */}
              {hasProfile ? (
                <Image
                  source={{ uri: item.opponent_profile }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginRight: 10,
                    backgroundColor: "#eee",
                  }}
                />
              ) : (
                <Ionicons
                  name="person-circle-outline"
                  size={50}
                  color="#bbb"
                  style={{ marginRight: 10 }}
                />
              )}

              {/* -------------------------------------------------
                 이름 + 마지막 메시지
              -------------------------------------------------- */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 16 }}>
                  {item.opponent_name ?? `유저 ${item.opponent_id}`}
                </Text>

                <Text
                  numberOfLines={1}
                  style={{ marginTop: 3, color: "#555" }}
                >
                  {item.last_message || "채팅을 시작하세요"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
