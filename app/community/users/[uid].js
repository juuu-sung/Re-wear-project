import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image"; // 🔥 변경
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function UserPosts() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { uid, user_name, profile_image } = useLocalSearchParams();
  const [posts, setPosts] = useState(null);

  const load = async () => {
    const res = await fetch(`${BASE_URL}/v1/community/users/${uid}/posts`);
    const data = await res.json();
    setPosts(data);
  };

  useEffect(() => {
    if (uid) load();
  }, [uid]);

  if (!posts)
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  const finalName = user_name ?? "사용자";
  const profileImg = profile_image ?? "https://via.placeholder.com/150";

  const handleSendMessage = async () => {
    const myId = await AsyncStorage.getItem("user_id");
    if (!myId) return;

    const res = await fetch(
      `${BASE_URL}/v1/chat/room?user1=${myId}&user2=${uid}`
    );
    const data = await res.json();

    router.push(`/chat/${data.room_id}?myId=${myId}`);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: insets.top - 250,
      }}
    >
      <View style={{ height: 20 }} />

      {/* 프로필 */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 10,
          paddingBottom: 25,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <ExpoImage
          source={{ uri: profileImg }}
          style={{
            width: 90,
            height: 90,
            borderRadius: 50,
            marginRight: 22,
            backgroundColor: "#eee",
          }}
          contentFit="cover"
          cachePolicy="immutable"
        />

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
            {finalName}
          </Text>

          <TouchableOpacity
            onPress={handleSendMessage}
            style={{
              backgroundColor: "#2E7D32",
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

      {/* 제목 */}
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

      {/* 게시물 목록 */}
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
            onPress={() => router.push(`/community/${item.id}`)}
          >
            {Array.isArray(item.images) && item.images.length > 0 ? (
              <ExpoImage
                source={{ uri: item.images[0] }}
                style={{
                  width: "100%",
                  height: 170,
                  borderRadius: 10,
                  backgroundColor: "#eee",
                }}
                contentFit="cover"
                cachePolicy="immutable"
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
