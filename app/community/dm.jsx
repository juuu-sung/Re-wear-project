import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Animated, Image } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

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
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1) 로컬 user_id 불러오기
  useEffect(() => {
    const loadUid = async () => {
      const uid = await AsyncStorage.getItem("user_id");
      setMyId(uid);
    };
    loadUid();
  }, []);

  // 2) DM 불러오기
  useEffect(() => {
    if (!myId) return;

    const loadRooms = async () => {
      try {
        const res = await fetch(`${BASE_URL}/v1/chat/my-rooms?user_id=${myId}`);
        const data = await res.json();
        setRooms(data);
      } catch (err) {
        console.log("채팅방 목록 불러오기 오류:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [myId]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  // 🔥 DM 삭제 함수
  const deleteRoom = async (room_id) => {
    try {
      await fetch(`${BASE_URL}/v1/chat/rooms/${room_id}?user_id=${myId}`, {
        method: "DELETE",
      });
      setRooms((prev) => prev.filter((r) => r.room_id !== room_id));
    } catch (e) {
      console.log("❌ 방 삭제 오류:", e);
    }
  };

  // 🔥 스와이프 삭제 버튼 UI
  const RightActions = (progress, dragX, room_id) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.6],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        onPress={() => deleteRoom(room_id)}
        style={{
          backgroundColor: "#ff4d4d",
          width: 80,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.Text
          style={{
            color: "#fff",
            fontWeight: "700",
            transform: [{ scale }],
          }}
        >
          삭제
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  // ============================================
  // UI 렌더링
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
      {/* 🔥 채팅방이 없을 때 메시지 */}
      {rooms.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, color: "#999" }}>
            현재 진행중인 채팅방이 없어요
          </Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.room_id.toString()}
          renderItem={({ item }) => {
            const hasProfile =
              item.opponent_profile &&
              item.opponent_profile.trim() !== "";

            return (
              <Swipeable
                overshootRight={false}
                renderRightActions={(progress, dragX) =>
                  RightActions(progress, dragX, item.room_id)
                }
              >
                <TouchableOpacity
                  onPress={() => {
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
                    backgroundColor: "#fff",
                  }}
                >
                  {/* 프로필 */}
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

                  {/* 이름 + 최근 메시지 */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16 }}>
                      {item.opponent_name ?? `유저 ${item.opponent_id}`}
                    </Text>

                    <Text
                        numberOfLines={1}
                        style={{ marginTop: 3, color: "#555" }}
                      >
                        {item.last_media_type === "image"
                          ? "사진을 보냈습니다."
                          : item.last_media_type === "multi-image"
                          ? "여러 장의 사진을 보냈습니다."
                          : item.last_media_type === "video"
                          ? "동영상을 보냈습니다."
                          : item.last_message || "채팅을 시작하세요"}
                    </Text>

                  </View>
                </TouchableOpacity>
              </Swipeable>
            );
          }}
        />
      )}
    </View>
  );
}
