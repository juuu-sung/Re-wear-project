import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

export default function CommunityFeed() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myUid, setMyUid] = useState(null);

  useEffect(() => {
    const loadMyUid = async () => {
      const id = await AsyncStorage.getItem("user_id");
      setMyUid(id);
    };
    loadMyUid();
  }, []);

  const loadPosts = async () => {
    if (!myUid) return;
    try {
      const res = await fetch(`${BASE_URL}/v1/community/posts?user_id=${myUid}`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.log("게시물 로딩 오류:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
  if (myUid) {
    loadPosts();
  }
}, [myUid]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  // 🔥 PostItem
  const PostItem = ({ item }) => {
    const [post, setPost] = useState(item); // 🔥 로컬 상태
    const [currentIndex, setCurrentIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);

    const lines = post.description.split("\n");
    const MAX = 3;
    const visibleLines = expanded ? lines : lines.slice(0, MAX);

    const handleScroll = (event) => {
      const x = event.nativeEvent.contentOffset.x;
      const index = Math.round(x / screenWidth);
      setCurrentIndex(index);
    };

    const goToProfile = () => {
      if (!myUid) return;

      if (String(post.user_id) === String(myUid)) {
        router.push("/community/profile");
      } else {
        router.push({
          pathname: `/community/users/${post.user_id}`,
          params: {
            user_name: post.user_name,
            profile_image: post.profile_image,
          },
        });
      }
    };

    // 🔥 좋아요 토글 — 로컬 UI + 상위 posts 모두 적용
    const toggleLike = async () => {
  if (!myUid) return;

  // 1) 로컬 UI 즉시 반영
  setPost((prev) => ({
    ...prev,
    liked: !prev.liked,
    like_count: prev.liked ? prev.like_count - 1 : prev.like_count + 1,
  }));

  try {
    const res = await fetch(
      `${BASE_URL}/v1/community/posts/${post.id}/like?user_id=${myUid}`,
      { method: "POST" }
    );
    const data = await res.json();

    // 2) 서버 값으로 동기화
    setPost((prev) => ({
      ...prev,
      liked: data.liked,
      like_count: data.like_count,
    }));

  } catch (err) {
    console.log("좋아요 오류:", err);
  }
};


    return (
      <View style={{ backgroundColor: "#fff", marginBottom: 30 }}>
        {/* 프로필 */}
        <TouchableOpacity
          onPress={goToProfile}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
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
            <Ionicons
              name="person-circle-outline"
              size={36}
              color="#bbb"
              style={{ marginRight: 10 }}
            />
          )}

          <Text style={{ fontWeight: "700", fontSize: 15 }}>
            {post.user_name}
          </Text>
        </TouchableOpacity>

        {/* 이미지 */}
        {post.images.length > 0 && (
          <View>
            <FlatList
              data={post.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              keyExtractor={(uri, idx) => uri + idx}
              renderItem={({ item: uri }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/community/${post.id}`)}
                  activeOpacity={1}
                >
                  <ExpoImage
                    source={{ uri }}
                    style={{
                      width: screenWidth,
                      height: 400,
                    }}
                    contentFit="cover"
                    cachePolicy="immutable"
                  />
                </TouchableOpacity>
              )}
            />

            {post.images.length > 1 && (
              <View
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                {post.images.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginHorizontal: 3,
                      backgroundColor:
                        currentIndex === i
                          ? "white"
                          : "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* 좋아요/댓글 */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 12,
            paddingTop: 12,
          }}
        >
          {/* ❤️ 좋아요 */}
          <TouchableOpacity onPress={toggleLike}>
            <Ionicons
              name={post.liked ? "heart" : "heart-outline"}
              size={28}
              color={post.liked ? "red" : "#333"}
              style={{ marginRight: 14 }}
            />
          </TouchableOpacity>

          {/* ... 댓글 */}
          <TouchableOpacity
            onPress={() => router.push(`/community/${post.id}`)}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={26}
              color="#333"
            />
          </TouchableOpacity>
        </View>

        {/* 좋아요 수 */}
        <Text
          style={{
            paddingHorizontal: 12,
            marginTop: 6,
            fontWeight: "600",
          }}
        >
          좋아요 {post.like_count}개
        </Text>

        {/* 본문 */}
        <View style={{ paddingHorizontal: 12, marginTop: 6 }}>
          <Text style={{ fontWeight: "700" }}>{post.user_name}</Text>

          <View style={{ marginTop: 4 }}>
            {visibleLines.map((line, index) => (
              <Text key={index} style={{ lineHeight: 20 }}>
                {line}
              </Text>
            ))}

            {!expanded && lines.length > MAX && (
              <TouchableOpacity
                onPress={() => setExpanded(true)}
                style={{ marginTop: 4 }}
              >
                <Text style={{ color: "#666" }}>더보기</Text>
              </TouchableOpacity>
            )}

            {expanded && lines.length > MAX && (
              <TouchableOpacity
                onPress={() => setExpanded(false)}
                style={{ marginTop: 6 }}
              >
                <Text style={{ color: "#666" }}>접기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 댓글 보기 */}
        <TouchableOpacity
          onPress={() => router.push(`/community/${post.id}`)}
          style={{ paddingHorizontal: 12, marginTop: 6, marginBottom: 10 }}
        >
          <Text style={{ color: "#888" }}>
            댓글 {post.comment_count}개 모두 보기
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: insets.top - 50,
      }}
    >
      <FlatList
        data={posts}
        extraData={posts} // 🔥 중요: 상태 변경 시 목록 자동 갱신
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PostItem item={item} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* DM */}
      <TouchableOpacity
        onPress={() => router.push("/community/dm")}
        style={{
          position: "absolute",
          bottom: 30,
          left: 20,
          backgroundColor: "#fff",
          width: 55,
          height: 55,
          borderRadius: 27.5,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#333" />
      </TouchableOpacity>

      {/* 프로필 */}
      <TouchableOpacity
        onPress={() => router.push("/community/profile")}
        style={{
          position: "absolute",
          bottom: 30,
          left: "50%",
          transform: [{ translateX: -27.5 }],
          backgroundColor: "#fff",
          width: 55,
          height: 55,
          borderRadius: 27.5,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Ionicons name="person-circle-outline" size={34} color="#333" />
      </TouchableOpacity>

      {/* 글쓰기 */}
      <TouchableOpacity
        onPress={() => router.push("/community/write")}
        style={{
          position: "absolute",
          bottom: 30,
          right: 20,
          backgroundColor: "#fff",
          width: 55,
          height: 55,
          borderRadius: 27.5,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Ionicons name="add-circle-outline" size={30} color="#333" />
      </TouchableOpacity>
    </View>
  );
}
