import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function MyProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();   // ← 🔥 추가

  const [posts, setPosts] = useState(null);
  const [user, setUser] = useState(null);
  const [localName, setLocalName] = useState("");
  const [uid, setUid] = useState(null);

  // 로그인 사용자 이름
  useEffect(() => {
    const loadLocalName = async () => {
      const rawName =
        (await AsyncStorage.getItem("name")) ||
        (await AsyncStorage.getItem("username"));
      setLocalName(rawName ? rawName : "사용자");
    };
    loadLocalName();
  }, []);

  // 로그인 사용자 UID
  useEffect(() => {
    const loadUid = async () => {
      const rawId = await AsyncStorage.getItem("user_id");
      setUid(rawId);
    };
    loadUid();
  }, []);

  // 프로필 + 게시물 로드
  const load = async () => {
    if (!uid) return;

    const res1 = await fetch(`${BASE_URL}/v1/users/${uid}`);
    const userJson = await res1.json();
    setUser(userJson);

    const res2 = await fetch(`${BASE_URL}/v1/community/users/${uid}/posts`);
    const postsJson = await res2.json();
    setPosts(postsJson);
  };

  useEffect(() => {
    load();
  }, [uid]);

  if (!posts || !user)
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  const finalName = localName || user.real_name || user.name || "사용자";

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: insets.top - 240,   // ← 🔥 여기서 50px 위로 올림
      }}
    >
      <View style={{ height: 20 }} />

      {/* 프로필 영역 */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 10,
          paddingBottom: 25,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
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

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
            {finalName}
          </Text>
        </View>
      </View>

      {/* 게시물 제목 */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          marginLeft: 22,
          marginBottom: 14,
        }}
      >
        내가 올린 게시물
      </Text>

      {/* 게시물 그리드 */}
      <FlatList
        numColumns={2}
        data={posts}
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingBottom: 30,
          flexGrow: 1,
        }}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: 18,
        }}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingTop: 60,
            }}
          >
            <Text style={{ fontSize: 16, color: "#777" }}>게시물 없음.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ width: "48%" }}
            onPress={() => router.push(`/community/${item.id}`)}
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
