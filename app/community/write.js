import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function WritePost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [userId, setUserId] = useState(null);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);

  useEffect(() => {
    const loadUid = async () => {
      const uid = await AsyncStorage.getItem("user_id");
      setUserId(uid);
    };
    loadUid();
  }, []);

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.85,
    });

    if (!res.canceled) {
      const selected = res.assets.map((a) => a.uri);
      setImages(selected);
    }
  };

  const submitPost = async () => {
    if (!userId) return Alert.alert("사용자 정보를 불러오는 중입니다.");
    if (!description.trim()) return Alert.alert("설명을 입력해주세요!");
    if (images.length === 0) return Alert.alert("사진을 선택해주세요!");

    const form = new FormData();

    form.append("user_id", userId);

    // 🔥 줄바꿈(\n) 보존되도록 명시적 문자열 변환
    form.append("description", String(description).replace(/\r\n/g, "\n"));

    const res = await fetch(`${BASE_URL}/v1/community/posts`, {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    const postId = data.post_id;

    // 이미지 업로드
    for (const uri of images) {
      const filename = uri.split("/").pop();
      const file = {
        uri,
        name: filename,
        type: "image/jpeg"
      };

      const formImg = new FormData();
      formImg.append("file", file);
      formImg.append("is_before", "false");

      await fetch(`${BASE_URL}/v1/community/posts/${postId}/images`, {
        method: "POST",
        body: formImg,
      });
    }

    Alert.alert("게시글이 등록되었습니다!");
    router.push(`/community/${postId}`);
  };

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top - 50,
        backgroundColor: "#fff",
      }}
    >
      <ScrollView style={{ padding: 20 }}>
        {/* 이미지 영역 */}
        <View
          style={{
            width: "100%",
            height: 300,
            backgroundColor: "#f5f5f5",
            borderRadius: 15,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          {images.length === 0 ? (
            <TouchableOpacity
              onPress={pickImages}
              style={{
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 50, color: "#888" }}>＋</Text>
              <Text style={{ color: "#888" }}>사진 추가</Text>
            </TouchableOpacity>
          ) : (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(uri, idx) => uri + idx}
              renderItem={({ item }) => (
                <ExpoImage
                  source={{ uri: item }}
                  style={{
                    width: screenWidth - 40,
                    height: 300,
                  }}
                  contentFit="cover"
                  cachePolicy="immutable"
                />
              )}
            />
          )}
        </View>

        {/* 제목 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "700" }}>게시글 작성</Text>
          <Text
            style={{
              marginLeft: 8,
              fontSize: 12,
              color: "#2E8B57",
              flexShrink: 1,
            }}
          >
            사용자들의 중고 옷 판매를 지원하고 직접 리폼한 옷을 공유하는 공간입니다.
          </Text>
        </View>

        {/* 🔥 본문 input (줄바꿈 보존) */}
        <TextInput
          placeholder="설명 입력"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{
            padding: 12,
            height: 130,
            borderWidth: 1,
            borderRadius: 10,
            marginBottom: 20,
            textAlignVertical: "top",    // 🔥 줄바꿈 정상화
            lineHeight: 20               // 🔥 3줄 이상 확실하게 렌더됨
          }}
        />

        <TouchableOpacity
          onPress={submitPost}
          style={{
            backgroundColor: "#23422D",
            padding: 15,
            borderRadius: 10,
            marginBottom: 50,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "700",
              fontSize: 16,
            }}
          >
            게시글 등록
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
