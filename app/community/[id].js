import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");

  const loadPost = async () => {
    const res = await fetch(`${BASE_URL}/v1/community/posts/${id}`);
    const data = await res.json();
    setPost(data);
  };

  useEffect(() => {
    loadPost();
  }, []);

  const writeComment = async () => {
    if (!comment.trim()) return;

    await fetch(
      `${BASE_URL}/v1/community/posts/${id}/comments?user_id=1&comment=${comment}`,
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
      // 🔥 댓글 입력창이 키보드에 가려지지 않도록
    >
      {/* 🔥 헤더 아래 여백 */}
      <View style={{ paddingTop: insets.top + 30 }} />

      <ScrollView style={{ flex: 1 }}>
        {/* 사진 */}
        <FlatList
          data={post.images}
          keyExtractor={(item, idx) => idx.toString()}
          horizontal
          pagingEnabled
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.url }}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                backgroundColor: "#ddd",
              }}
            />
          )}
          showsHorizontalScrollIndicator={false}
        />

        {/* 좋아요/댓글 아이콘 */}
        <View style={{ paddingHorizontal: 15, paddingTop: 15 }}>
          <Text style={{ fontSize: 22 }}>♡  💬</Text>
        </View>

        {/* 좋아요 개수 */}
        <View style={{ paddingHorizontal: 15, marginTop: 10 }}>
          <Text style={{ fontWeight: "700" }}>좋아요 {post.likes}개</Text>
        </View>

        {/* 설명 */}
        <View style={{ paddingHorizontal: 15, marginTop: 10 }}>
          <Text>
            <Text style={{ fontWeight: "700" }}>{post.user_name} </Text>
            {post.description}
          </Text>
        </View>

        {/* 댓글 */}
        <View style={{ paddingHorizontal: 15, marginTop: 20, paddingBottom: 80 }}>
          {post.comments.map((c, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <Text>
                <Text style={{ fontWeight: "700" }}>{c.user_name} </Text>
                {c.comment}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 🔥 댓글 입력창 (항상 화면 안에 고정) */}
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
          placeholder="댓글 달기..."
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
          <Text style={{ color: "#23422D", fontWeight: "700" }}>
            게시
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
