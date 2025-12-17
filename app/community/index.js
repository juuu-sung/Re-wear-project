import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;

const RAW_BASE_URL = (process.env.EXPO_PUBLIC_BASE_URL ?? "").toString().trim();
const BASE_URL = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, "") : "";

// ====================================================================
//   메모된 PostItem (재렌더링 ZERO)
// ====================================================================
const PostItem = React.memo(function PostItem({ item, myUid, router, openSheet }) {
  const [post, setPost] = useState(item);
  const [expanded, setExpanded] = useState(false);

  const lines = post.description.split("\n");
  const MAX = 3;
  const visibleLines = expanded ? lines : lines.slice(0, MAX);

  const goToProfile = () => {
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

  const toggleLike = async () => {
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

      setPost((prev) => ({
        ...prev,
        liked: data.liked,
        like_count: data.like_count,
      }));
    } catch (e) {
      console.log("좋아요 오류:", e);
    }
  };

  return (
    <View style={{ backgroundColor: "#fff", marginBottom: 30 }}>
      {/* 상단 프로필 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={goToProfile}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          {post.profile_image ? (
            <ExpoImage
              source={{ uri: post.profile_image }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                marginRight: 10,
              }}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={36} color="#bbb" />
          )}

          <Text style={{ fontWeight: "700", fontSize: 15 }}>
            {post.user_name}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => openSheet(post)}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 이미지 리스트 */}
      {post.images.length > 0 && (
        <FlatList
          data={post.images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, idx) => uri + idx}
          renderItem={({ item: uri }) => (
            <ExpoImage
              source={{ uri }}
              style={{ width: screenWidth, height: 400 }}
              contentFit="cover"
            />
          )}
        />
      )}

      {/* 좋아요 / 댓글 */}
      <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingTop: 12 }}>
        <TouchableOpacity onPress={toggleLike}>
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            size={28}
            color={post.liked ? "red" : "#333"}
            style={{ marginRight: 14 }}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push(`/community/${post.id}`)}>
          <Ionicons name="chatbubble-outline" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      <Text style={{ paddingHorizontal: 12, marginTop: 6, fontWeight: "600" }}>
        좋아요 {post.like_count}개
      </Text>

      {/* 본문 */}
      <View style={{ paddingHorizontal: 12, marginTop: 6 }}>
        <Text style={{ fontWeight: "700" }}>{post.user_name}</Text>

        {visibleLines.map((line, idx) => (
          <Text key={idx}>{line}</Text>
        ))}

        {!expanded && lines.length > MAX && (
          <TouchableOpacity onPress={() => setExpanded(true)}>
            <Text style={{ color: "#666", marginTop: 4 }}>더보기</Text>
          </TouchableOpacity>
        )}

        {expanded && lines.length > MAX && (
          <TouchableOpacity onPress={() => setExpanded(false)}>
            <Text style={{ color: "#666", marginTop: 6 }}>접기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 댓글 보기 */}
      <TouchableOpacity
        onPress={() => router.push(`/community/${post.id}`)}
        style={{ paddingHorizontal: 12, marginBottom: 10 }}
      >
        <Text style={{ color: "#888" }}>
          댓글 {post.comment_count}개 모두 보기
        </Text>
      </TouchableOpacity>
    </View>
  );
});

// ====================================================================
//   메인 컴포넌트
// ====================================================================
export default function CommunityFeed() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myUid, setMyUid] = useState(null);

  // 모달 상태
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // 바텀시트 애니메이션
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const openSheet = useCallback((post) => {
    setSelectedPost(post);
    setMenuVisible(true);

    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, []);

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      setMenuVisible(false);
      setSelectedPost(null);
    });
  };

  // 사용자 ID 로드
  useEffect(() => {
    const loadUid = async () => {
      const id = await AsyncStorage.getItem("user_id");
      setMyUid(id);
    };
    loadUid();
  }, []);

  const loadPosts = async () => {
    if (!myUid) return;
    try {
      const res = await fetch(`${BASE_URL}/v1/community/posts?user_id=${myUid}`);
      const data = await res.json();
      
      setPosts(data);
    } catch (e) {
      console.log("Error loading posts:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (myUid) loadPosts();
  }, [myUid]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  // PostItem 메모 + 콜백
  const renderPostItem = useCallback(
    ({ item }) => (
      <PostItem item={item} myUid={myUid} router={router} openSheet={openSheet} />
    ),
    [myUid]
  );

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
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPostItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* =====================================================
           깜빡임 없는 바텀시트 모달
      ===================================================== */}
      {menuVisible && (
        <>
          {/* 배경 */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeSheet}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          />

          {/* 바텀시트 */}
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingBottom: 30,
              paddingTop: 20,
              backgroundColor: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              transform: [{ translateY: sheetTranslateY }],
            }}
          >
            {String(selectedPost?.user_id) === String(myUid) ? (
              <>
                {/* 수정 */}
                <TouchableOpacity
                  onPress={() => {
                    closeSheet();
                    router.push({
                      pathname: "/community/write",
                      params: {
                        mode: "edit",
                        post_id: selectedPost.id,
                        description: selectedPost.description,
                        images: JSON.stringify(selectedPost.images),
                      },
                    });
                  }}
                  style={{ paddingVertical: 16, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 17 }}>게시물 수정하기</Text>
                </TouchableOpacity>

                {/* 삭제 */}
                <TouchableOpacity
                  onPress={async () => {
                    closeSheet();
                    await fetch(
                      `${BASE_URL}/v1/community/posts/${selectedPost.id}?user_id=${myUid}`,
                      { method: "DELETE" }
                    );
                    setPosts((prev) =>
                      prev.filter((p) => p.id !== selectedPost.id)
                    );
                  }}
                  style={{ paddingVertical: 16, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 17, color: "red" }}>
                    게시물 삭제하기
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={closeSheet}
                style={{ paddingVertical: 16, alignItems: "center" }}
              >
                <Text style={{ fontSize: 17, color: "red" }}>게시물 신고하기</Text>
              </TouchableOpacity>
            )}

            {/* 취소 */}
            <TouchableOpacity
              onPress={closeSheet}
              style={{ marginTop: 8, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 16, color: "#555" }}>취소</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

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
