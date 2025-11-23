import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { Ionicons } from "@expo/vector-icons"; // ←🔥 추가됨
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const [myName, setMyName] = useState("");

  useEffect(() => {
    const loadMyName = async () => {
      const name =
        (await AsyncStorage.getItem("name")) ||
        (await AsyncStorage.getItem("username"));
      setMyName(name ?? "사용자");
    };
    loadMyName();
  }, []);

  const loadPost = async () => {
    const res = await fetch(`${BASE_URL}/v1/community/posts/${id}`);
    const data = await res.json();
    data.comments = data.comments ?? [];
    setPost(data);
  };

  useEffect(() => {
    loadPost();
  }, []);

  const writeComment = async () => {
    if (!comment.trim()) return;

    const myId = await AsyncStorage.getItem("user_id");

    await fetch(
      `${BASE_URL}/v1/community/posts/${id}/comments?user_id=${myId}&comment=${comment}`,
      { method: "POST" }
    );

    setComment("");
    loadPost();
  };

  if (!post) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 60}
    >
      <View style={{ paddingTop: insets.top - 30 }} />

      <ScrollView style={{ flex: 1 }}>
        {/* 이미지 */}
        <FlatList
          data={post.images}
          keyExtractor={(item, idx) => idx.toString()}
          horizontal
          pagingEnabled
          renderItem={({ item }) => (
            <ExpoImage
              source={{ uri: item.url }}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                backgroundColor: "#ddd",
              }}
              contentFit="cover"
              cachePolicy="immutable"
            />
          )}
          showsHorizontalScrollIndicator={false}
        />

        {/* 프로필 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 15,
            paddingTop: 15,
            marginBottom: 4,
          }}
        >
          {post.profile_image ? (
            <ExpoImage
              source={{ uri: post.profile_image }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                marginRight: 10,
                backgroundColor: "#eee",
              }}
              contentFit="cover"
              cachePolicy="immutable"
            />
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#ddd",
                marginRight: 10,
              }}
            />
          )}
          <Text style={{ fontWeight: "700", fontSize: 15 }}>
            {post.user_name}
          </Text>
        </View>

        {/* 🔥 좋아요 + 댓글 아이콘 (피드랑 동일 디자인) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 15,
            paddingTop: 15,
          }}
        >
          {/* 좋아요 */}
          <TouchableOpacity onPress={() => console.log("좋아요 기능 연결 예정")}>
            <Ionicons
              name={post.liked ? "heart" : "heart-outline"}
              size={28}
              color={post.liked ? "red" : "#333"}
              style={{ marginRight: 14 }}
            />
          </TouchableOpacity>

          {/* 댓글 */}
          <TouchableOpacity
            onPress={() => {
              // 댓글 아이콘 누르면 입력창에 포커스 줄 수도 있음
              console.log("댓글 아이콘 클릭");
            }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={26}
              color="#333"
            />
          </TouchableOpacity>
        </View>

        {/* 좋아요 수 */}
        <View style={{ paddingHorizontal: 15, marginTop: 10 }}>
          <Text style={{ fontWeight: "700" }}>
            좋아요 {post.like_count ?? post.likes ?? 0}개
          </Text>
        </View>

        {/* 설명 */}
        <View style={{ paddingHorizontal: 15, marginTop: 10 }}>
          <Text>
            <Text style={{ fontWeight: "700" }}>{post.user_name} </Text>
            {post.description}
          </Text>
        </View>

        {/* 구분선 */}
        <View
          style={{
            height: 1,
            backgroundColor: "#ddd",
            marginTop: 20,
            marginBottom: 10,
            marginHorizontal: 15,
          }}
        />

        {/* 댓글 리스트 */}
        <View style={{ paddingHorizontal: 15, paddingBottom: 80 }}>
          {(post.comments ?? []).map((c, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <Text>
                <Text style={{ fontWeight: "700" }}>{c.user_name} </Text>
                {c.comment}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 댓글 입력창 */}
      <View
        style={{
          flexDirection: "row",
          padding: 15,
          borderTopWidth: 1,
          borderColor: "#eee",
          backgroundColor: "#fff",
        }}
      >
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={`${myName}로 댓글 달기...`}
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: "#f0f0f0",
            borderRadius: 10,
          }}
        />

        <TouchableOpacity
          onPress={writeComment}
          style={{ marginLeft: 10, justifyContent: "center" }}
        >
          <Text style={{ color: "#23422D", fontWeight: "700" }}>게시</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
