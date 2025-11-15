import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function UserPosts() {
  const router = useRouter();
  const { uid } = useLocalSearchParams();

  const [posts, setPosts] = useState(null);
  const [user, setUser] = useState(null);
  const [localName, setLocalName] = useState("");

  // 로그인된 사용자 이름
  useEffect(() => {
    const loadLocalName = async () => {
      const rawName =
        (await AsyncStorage.getItem("name")) ||
        (await AsyncStorage.getItem("username"));
      setLocalName(rawName ? rawName : "사용자");
    };
    loadLocalName();
  }, []);

  // 유저 정보 + 게시글 불러오기
  const load = async () => {
    const res1 = await fetch(`${BASE_URL}/v1/users/${uid}`);
    const userJson = await res1.json();
    setUser(userJson);

    const res2 = await fetch(`${BASE_URL}/v1/community/users/${uid}/posts`);
    const postsJson = await res2.json();
    setPosts(postsJson);
  };

  useEffect(() => {
    load();
  }, []);

  if (!posts || !user)
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  // 최종 이름 결정
  const finalName =
    user.real_name ??
    user.name ??
    posts[0]?.author?.real_name ??
    posts[0]?.author?.name ??
    localName;

  // 메시지 보내기 핸들러
  const handleSendMessage = async () => {
    const myId = await AsyncStorage.getItem("user_id");

    if (!myId) {
      console.log("user_id 없음 - 로그인 필요");
      return;
    }

    // 나 자신한테는 DM 안 열도록 막고 싶으면 이 조건 추가하면 됨
    // if (String(myId) === String(uid)) return;

    try {
      // 방 조회 또는 생성
      const res = await fetch(
        `${BASE_URL}/v1/chat/room?user1=${myId}&user2=${uid}`
      );
      const data = await res.json();
      const roomId = data.room_id;

      // DM 채팅방으로 이동
      router.push(`/community/chat/${roomId}?myId=${myId}`);
    } catch (e) {
      console.log("DM 방 생성 실패:", e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ height: 20 }} />

      {/* ------------------ 프로필 영역 ------------------ */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 10,
          paddingBottom: 25,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {/* 프로필 사진 */}
        <Image
          source={{
            uri: user.profile_image
              ? user.profile_image
              : "https://via.placeholder.com/150",
          }}
          style={{
            width: 90,
            height: 90,
            borderRadius: 50,
            marginRight: 22,
            backgroundColor: "#eee",
          }}
        />

        {/* 이름 + 메시지 보내기 버튼 */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
            {finalName}
          </Text>

          <TouchableOpacity
            onPress={handleSendMessage}
            style={{
              backgroundColor: "#2e7d32",
              paddingVertical: 8,
              borderRadius: 6,
              alignItems: "center",
              width: 140,
            }}
          >
            <Text style={{ color: "white", fontSize: 14 }}>메시지 보내기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ------------------ 게시물 제목 ------------------ */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          marginLeft: 22,
          marginBottom: 14,
        }}
      >
        올린 게시물
      </Text>

      {/* ------------------ 게시물 그리드 ------------------ */}
      <FlatList
        numColumns={2}
        data={posts}
        contentContainerStyle={{ paddingHorizontal: 22 }}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: 18,
        }}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ width: "48%" }}
            activeOpacity={0.8}
            onPress={() => router.push(`/community/${item.id}`)} // 🔥 상세페이지 이동
          >
            {Array.isArray(item.images) && item.images.length > 0 ? (
              <Image
                source={{ uri: item.images[0] }}
                style={{
                  width: "100%",
                  height: 170,
                  borderRadius: 10,
                  backgroundColor: "#eee",
                }}
              />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: 170,
                  borderRadius: 10,
                  backgroundColor: "#ddd",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#666" }}>이미지 없음</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
