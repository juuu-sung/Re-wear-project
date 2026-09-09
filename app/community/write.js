// ===========================================
// WritePost — 전체 최적화본 (+ 사진칸 로딩 + 사진 로딩 진행률 + 업로드 진행률)
// ===========================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";
import { Image as ExpoImage } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import uuid from "react-native-uuid";

const screenWidth = Dimensions.get("window").width;
const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function WritePost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const mode = params.mode;
  const postId = params.post_id;

  const [userId, setUserId] = useState(null);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(mode === "edit");

  // --- 업로드 진행률 ---
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- 사진칸 로딩 ---
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoadProgress, setImageLoadProgress] = useState(0);  // 사진 로딩 %

  // --------------------------------------------------
  // 유저 id 불러오기
  // --------------------------------------------------
  useEffect(() => {
    (async () => {
      const uid = await AsyncStorage.getItem("user_id");
      setUserId(uid);
    })();
  }, []);

  // --------------------------------------------------
  // 수정 모드 데이터 불러오기
  // --------------------------------------------------
  useEffect(() => {
    if (mode === "edit" && userId) loadPostDetail();
  }, [mode, userId]);

  const loadPostDetail = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/v1/community/posts/${postId}?user_id=${userId}`
      );
      const data = await res.json();

      setDescription(data.description);

      setImages(
        data.images.map((img) => ({
          local_id: uuid.v4(),
          id: img.id,
          url: img.url,
          isNew: false,
        }))
      );
    } catch (e) {
      console.log("post detail load error:", e);
    }
    setLoading(false);
  };

  // =====================================================
  //  사진 선택 (미리보기 즉시 + 사진칸 로딩 + 진행률)
  // =====================================================
  const pickImages = async () => {
    setImageLoading(true);
    setImageLoadProgress(0);

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (res.canceled) {
      setImageLoading(false);
      return;
    }

    const total = res.assets.length;
    let processedCount = 0;

    const processed = await Promise.all(
      res.assets.map(async (asset) => {
        // 즉시 미리보기용 이미지 생성
        const preview = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        processedCount += 1;
        setImageLoadProgress(Math.floor((processedCount / total) * 100));

        return {
          local_id: uuid.v4(),
          uri: preview.uri,
          originalUri: asset.uri,
          isNew: true,
        };
      })
    );

    setImages((prev) => [...prev, ...processed]);
    setImageLoading(false);
  };

  // =====================================================
  // 이미지 삭제
  // =====================================================
  const deleteImage = async (img) => {
    if (img.isNew) {
      setImages((prev) => prev.filter((i) => i.local_id !== img.local_id));
      return;
    }

    try {
      await fetch(
        `${BASE_URL}/v1/community/posts/${postId}/images/${img.id}?user_id=${userId}`,
        { method: "DELETE" }
      );
    } catch (e) {}

    setImages((prev) => prev.filter((i) => i.local_id !== img.local_id));
  };

  // =====================================================
  //  업로드용 이미지 병렬 처리 + 진행률
  // =====================================================
  const uploadNewImages = async (postId) => {
    const newImgs = images.filter((i) => i.isNew);
    if (newImgs.length === 0) return;

    let done = 0;

    const uploadPromises = newImgs.map(async (img) => {
      const compressed = await ImageManipulator.manipulateAsync(
        img.originalUri || img.uri,
        [{ resize: { width: 1400 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const form = new FormData();
      form.append("file", new File(compressed.uri));

      await fetch(`${BASE_URL}/v1/community/posts/${postId}/images`, {
        method: "POST",
        body: form,
      });

      done += 1;
      setUploadProgress(Math.floor((done / newImgs.length) * 100));
    });

    await Promise.all(uploadPromises);
  };

  // =====================================================
  // 게시물 제출
  // =====================================================
  const submitPost = async () => {
    if (!description.trim())
      return Alert.alert("설명을 입력해주세요!");

    setUploading(true);
    setUploadProgress(0);

    // 새 게시글 작성
    if (mode !== "edit") {
      const form = new FormData();
      form.append("user_id", userId);
      form.append("description", description);

      const res = await fetch(`${BASE_URL}/v1/community/posts`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      const newPostId = data.post_id;

      await uploadNewImages(newPostId);

      setUploading(false);
      return router.push(`/community/${newPostId}`);
    }

    // 수정 모드
    const keptIds = images.filter((i) => !i.isNew).map((i) => i.id);

    const form = new FormData();
    form.append("user_id", userId);
    form.append("description", description);
    form.append("kept_images", JSON.stringify(keptIds));

    await fetch(`${BASE_URL}/v1/community/posts/${postId}`, {
      method: "PUT",
      body: form,
    });

    await uploadNewImages(postId);

    setUploading(false);
    router.push(`/community/${postId}`);
  };

  // =====================================================
  // 로딩 중 초기 화면
  // =====================================================
  if (loading)
    return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>

      {/* ===================================== */}
      {/*   전체 업로드 진행률 오버레이         */}
      {/* ===================================== */}
      {uploading && (
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ marginTop: 15, color: "#fff", fontSize: 18 }}>
            업로드 중... {uploadProgress}%
          </Text>

          <View
            style={{
              width: "70%",
              height: 8,
              backgroundColor: "rgba(255,255,255,0.3)",
              marginTop: 10,
              borderRadius: 4,
            }}
          >
            <View
              style={{
                width: `${uploadProgress}%`,
                height: "100%",
                backgroundColor: "#4caf50",
                borderRadius: 4,
              }}
            />
          </View>
        </View>
      )}

      <View style={{ flex: 1, paddingTop: insets.top - 50, backgroundColor: "#fff" }}>
        <ScrollView style={{ padding: 20 }}>

          {/* ===================================================== */}
          {/*                  사진 미리보기 영역                     */}
          {/* ===================================================== */}
          <View
            style={{
              width: "100%",
              height: 300,
              backgroundColor: "#f5f5f5",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* 기존/새 이미지 리스트 */}
            {images.length > 0 && (
              <DraggableFlatList
                data={images}
                horizontal
                pagingEnabled
                keyExtractor={(item) => item.local_id}
                onDragEnd={({ data }) => setImages(data)}
                renderItem={({ item }) => (
                  <View>
                    <ExpoImage
                      cachePolicy="memory-disk"
                      source={{ uri: item.url || item.uri }}
                      style={{ width: screenWidth - 40, height: 300 }}
                      contentFit="cover"
                    />

                    <TouchableOpacity
                      onPress={() => deleteImage(item)}
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 36,
                        height: 36,
                        borderRadius: 20,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 22 }}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

            {/* 이미지 없음 */}
            {images.length === 0 && !imageLoading && (
              <TouchableOpacity
                onPress={pickImages}
                style={{ justifyContent: "center", alignItems: "center" }}
              >
                <Text style={{ fontSize: 50, color: "#aaa" }}>＋</Text>
                <Text style={{ color: "#777" }}>사진 선택</Text>
              </TouchableOpacity>
            )}

            {/*  사진칸 로딩 */}
            {imageLoading && (
              <View
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(255,255,255,0.7)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#23422D" />
                <Text style={{ marginTop: 10, color: "#23422D" }}>
                  사진 불러오는 중... {imageLoadProgress}%
                </Text>
              </View>
            )}
          </View>

          {/* 설명 입력 */}
          <TextInput
            placeholder="설명을 입력하세요"
            value={description}
            onChangeText={setDescription}
            multiline
            style={{
              height: 150,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
              padding: 12,
              textAlignVertical: "top",
            }}
          />

          {/* 제출 버튼 */}
          <TouchableOpacity
            onPress={submitPost}
            style={{
              backgroundColor: "#23422D",
              padding: 15,
              borderRadius: 10,
              marginTop: 20,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, textAlign: "center" }}>
              {mode === "edit" ? "수정 완료" : "게시글 등록"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}
