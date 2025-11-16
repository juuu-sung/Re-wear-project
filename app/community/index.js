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
  View
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
    try {
      const res = await fetch(`${BASE_URL}/v1/community/posts`);
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const PostItem = ({ item }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);

    // 🔥 엔터 줄바꿈 인식
    const lines = item.description.split("\n");
    const MAX = 3;
    const visibleLines = expanded ? lines : lines.slice(0, MAX);

    const handleScroll = (event) => {
      const x = event.nativeEvent.contentOffset.x;
      const index = Math.round(x / screenWidth);
      setCurrentIndex(index);
    };

    const goToProfile = () => {
      if (!myUid) return;

      if (String(item.user_id) === String(myUid)) {
        router.push("/community/profile");
      } else {
        router.push({
          pathname: `/community/users/${item.user_id}`,
          params: {
            user_name: item.user_name,
            profile_image: item.profile_image,
          }
        });
      }
    };

    return (
      <View style={{ backgroundColor: "#fff", marginBottom: 30 }}>

        {/* 유저 프로필 */}
        <TouchableOpacity
          onPress={goToProfile}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#ddd",
              marginRight: 10,
            }}
          />
          <Text style={{ fontWeight: "700", fontSize: 15 }}>
            {item.user_name}
          </Text>
        </TouchableOpacity>

        {/* 이미지 슬라이드 */}
        {item.images.length > 0 && (
          <View>
            <FlatList
              data={item.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              keyExtractor={(uri, idx) => uri + idx}
              renderItem={({ item: uri }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/community/${item.id}`)}
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

            {item.images.length > 1 && (
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
                {item.images.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginHorizontal: 3,
                      backgroundColor:
                        currentIndex === i ? "white" : "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* 좋아요 + 댓글 아이콘 (심플버전) */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 12,
            paddingTop: 12,
          }}
        >
          <Text style={{ fontSize: 22, marginRight: 12 }}>♡</Text>
          <Text style={{ fontSize: 22 }}>💬</Text>
        </View>

        <Text style={{ paddingHorizontal: 12, marginTop: 6, fontWeight: "600" }}>
          좋아요 {item.like_count}개
        </Text>

        {/* 본문 */}
        <View style={{ paddingHorizontal: 12, marginTop: 6 }}>
          <Text style={{ fontWeight: "700" }}>{item.user_name}</Text>

          <View style={{ marginTop: 4 }}>
            {visibleLines.map((line, index) => (
              <Text key={index} style={{ lineHeight: 20 }}>
                {line}
              </Text>
            ))}

            {/* 더보기 버튼 (겹침 제거) */}
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

        {/* 댓글 모두보기 */}
        <TouchableOpacity
          onPress={() => router.push(`/community/${item.id}`)}
          style={{ paddingHorizontal: 12, marginTop: 6, marginBottom: 10 }}
        >
          <Text style={{ color: "#888" }}>
            댓글 {item.comment_count}개 모두 보기
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
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PostItem item={item} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      {/* DM 버튼 */}
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

      {/* 내 프로필 */}
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
