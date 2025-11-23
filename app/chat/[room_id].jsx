// ==========================
//      CHATROOM FULL CODE
// ==========================

import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";

import { Image as ExpoImage } from "expo-image";
import ImageViewing from "react-native-image-viewing";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

// =====================================================
// 이미지 카드 스택
// =====================================================
const CardStack = ({ images, onPress }) => {
  if (!Array.isArray(images)) return null;

  const maxCount = Math.min(images.length, 5);
  const offsets = Array.from({ length: maxCount }, (_, i) => ({
    translateY: i * 10,
    rotate: `${(i - 2) * 4}deg`,
    scale: 1 - i * 0.05,
    zIndex: 100 - i,
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={{ width: 220, height: 240, position: "relative" }}>
        {images.slice(0, maxCount).map((uri, i) => (
          <ExpoImage
            key={uri + i}
            source={{ uri }}
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 14,
              transform: [
                { translateY: offsets[i].translateY },
                { rotate: offsets[i].rotate },
                { scale: offsets[i].scale },
              ],
              zIndex: offsets[i].zIndex,
            }}
            contentFit="cover"
          />
        ))}
      </View>
    </TouchableOpacity>
  );
};

// =====================================================
// 전체 화면 이미지 슬라이더
// =====================================================
const FullscreenImageSlider = ({ visible, onClose, images }) => {
  const formatted = images?.map((uri) => ({ uri })) ?? [];
  return (
    <ImageViewing
      visible={visible}
      images={formatted}
      imageIndex={0}
      onRequestClose={onClose}
    />
  );
};

// =====================================================
// CHATROOM MAIN
// =====================================================
export default function ChatRoom() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const rawRoomId = params.room_id;
  const isTemp = rawRoomId === "temp";

  const { myId, opponentId, opponentName, opponentProfile } = params;

  const [currentRoomId, setCurrentRoomId] = useState(
    isTemp ? null : rawRoomId
  );

  const messagesRef = useRef([]);
  const flatListRef = useRef(null);
  const wsRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [previewMulti, setPreviewMulti] = useState({
    visible: false,
    images: [],
  });
  const [previewVideoVisible, setPreviewVideoVisible] = useState(null);

  // =====================================================
  // 상대 프로필 이동
  // =====================================================
  const handleProfilePress = () => {
    if (!opponentId) return;

    router.push({
      pathname: `/community/users/${opponentId}`,
      params: {
        user_name: opponentName,
        profile_image: opponentProfile,
      },
    });
  };

  // =====================================================
  // 방이 없으면 생성
  // =====================================================
  const ensureRoomExists = async () => {
    if (currentRoomId) return currentRoomId;

    const res = await fetch(
      `${BASE_URL}/v1/chat/room?user1=${myId}&user2=${opponentId}`
    );
    const data = await res.json();

    setCurrentRoomId(data.room_id);
    return data.room_id;
  };

  // =====================================================
  // 메시지 로드
  // =====================================================
  const loadMessages = async (rid) => {
    if (!rid || rid === "temp") return;

    const res = await fetch(`${BASE_URL}/v1/chat/rooms/${rid}/messages`);
    const data = await res.json();

    const safeData = Array.isArray(data) ? data : [];

    messagesRef.current = safeData;
    setMessages([...safeData]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 30);
  };

  // =====================================================
  // WebSocket 연결
  // =====================================================
  const connectSocket = (rid) => {
    if (!rid || rid === "temp") return;

    const wsUrl = BASE_URL.startsWith("https")
      ? BASE_URL.replace("https", "wss")
      : BASE_URL.replace("http", "ws");

    const socket = new WebSocket(`${wsUrl}/v1/chat/ws/${rid}`);
    wsRef.current = socket;

    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        // 중복 제거
        const key = `${msg.sender_id}-${msg.created_at}-${msg.message}-${msg.media_url}`;
        if (messagesRef.current.some(m =>
          `${m.sender_id}-${m.created_at}-${m.message}-${m.media_url}` === key
        )) {
          return; // 이미 있으면 추가 X
        }

  messagesRef.current = [...messagesRef.current, msg];
  setMessages([...messagesRef.current]);

  setTimeout(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, 30);
};

  };

  useEffect(() => {
    if (!currentRoomId) return;
    loadMessages(currentRoomId);
    connectSocket(currentRoomId);

    return () => wsRef.current?.close();
  }, [currentRoomId]);

  // =====================================================
  // 이미지 압축
  // =====================================================
  const compressImage = async (uri) => {
    return await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
  };

  // =====================================================
  // (❗ 수정된 sendMessage는 2/2에 있음)
// =====================================================


  // =====================================================
  // 미디어 선택
  // =====================================================
  const handleMediaPick = (asset) => {
    if (pendingMedia.length >= 5) return;

    if (asset.type.startsWith("image")) {
      setPendingMedia((prev) => [
        ...prev,
        {
          uri: asset.uri,
          type: "image/jpeg",
          fileName: asset.fileName,
          kind: "image",
        },
      ]);
      return;
    }

    if (asset.type.startsWith("video")) {
      VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 }).then(
        (thumbnail) => {
          setPendingMedia((prev) => [
            ...prev,
            {
              uri: asset.uri,
              type: "video/mp4",
              fileName: asset.fileName,
              kind: "video",
              thumbnail: thumbnail.uri,
            },
          ]);
        }
      );
    }
  };

  const openAlbum = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled) {
      for (let asset of result.assets) {
        if (pendingMedia.length >= 5) break;
        handleMediaPick(asset);
      }
    }

    setShowMenu(false);
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      videoMaxDuration: 10,
    });

    if (!result.canceled) handleMediaPick(result.assets[0]);
    setShowMenu(false);
  };

  // =====================================================
  // 메시지 렌더링
  // =====================================================
  const renderItem = useCallback(
    ({ item }) => {
      const isMine = String(item.sender_id) === String(myId);

      if (item.media_type === "multi-image") {
        return (
          <View
            style={{
              alignSelf: isMine ? "flex-end" : "flex-start",
              marginBottom: 16,
              maxWidth: "80%",
            }}
          >
            <CardStack
              images={item.media_urls}
              onPress={() =>
                setPreviewMulti({ visible: true, images: item.media_urls })
              }
            />

            {item.message && (
              <View
                style={{
                  backgroundColor: isMine ? "#DCF8C6" : "#eee",
                  padding: 10,
                  borderRadius: 10,
                  marginTop: 6,
                }}
              >
                <Text>{item.message}</Text>
              </View>
            )}
          </View>
        );
      }

      const isImage = item.media_type === "image";
      const isVideo = item.media_type === "video";

      return (
        <View
          style={{
            alignSelf: isMine ? "flex-end" : "flex-start",
            marginBottom: 16,
            maxWidth: "80%",
          }}
        >
          {isImage && (
            <ExpoImage
              source={{ uri: item.media_url }}
              style={{ width: 220, height: 220, borderRadius: 10 }}
            />
          )}

          {isVideo && (
            <TouchableOpacity
              onPress={() => setPreviewVideoVisible(item.media_url)}
            >
              <ExpoImage
                source={{ uri: item.thumbnail_url }}
                style={{ width: 220, height: 220, borderRadius: 10 }}
              />
              <Ionicons
                name="play-circle"
                size={60}
                color="white"
                style={{ position: "absolute", top: 80, left: 80 }}
              />
            </TouchableOpacity>
          )}

          {item.message && (
            <View
              style={{
                backgroundColor: isMine ? "#DCF8C6" : "#eee",
                padding: 10,
                borderRadius: 10,
                marginTop: isImage || isVideo ? 6 : 0,
              }}
            >
              <Text>{item.message}</Text>
            </View>
          )}
        </View>
      );
    },
    [myId]
  );
  // ==========================
  //      CHATROOM FULL CODE
  //         (3/3 SECTION)
  // ==========================

  // WebSocket OPEN 기다리는 함수
  const waitForSocketReady = (callback) => {
    if (wsRef.current && wsRef.current.readyState === 1) {
      callback();
    } else {
      setTimeout(() => waitForSocketReady(callback), 50);
    }
  };

  // =====================================================
  // 메시지 전송 (INVALID_STATE_ERR 방지 완전 패치 버전)
  // =====================================================
  const sendMessage = async () => {
    if (!text.trim() && pendingMedia.length === 0) return;

    setUploading(true);
    let uploadedUrls = [];

    try {
      // temp이면 여기서 방 생성
      const rid = await ensureRoomExists();

      // 방 생성 직후 WebSocket 없으면 즉시 새로 연결
      if (!wsRef.current || wsRef.current.readyState !== 1) {
        connectSocket(rid);
      }

      // 🔥 미디어 업로드
      if (pendingMedia.length > 0) {
        for (let item of pendingMedia) {
          const form = new FormData();
          let uploadUri = item.uri;

          if (item.kind === "image") {
            const compressed = await ImageManipulator.manipulateAsync(
              item.uri,
              [{ resize: { width: 1080 } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
            uploadUri = compressed.uri;
          }

          form.append("file", {
            uri: uploadUri,
            type: item.type,
            name: item.fileName || "media",
          });

          const r = await fetch(`${BASE_URL}/v1/chat/upload`, {
            method: "POST",
            body: form,
            headers: { "Content-Type": "multipart/form-data" },
          });

          const uploaded = await r.json();
          uploadedUrls.push(`${BASE_URL}${uploaded.url}`);
        }
      }

      // 페이로드 구성
      const payload = {
        sender_id: Number(myId),
        message: text.trim() || null,
      };

      if (pendingMedia.length === 1 && pendingMedia[0].kind === "image") {
        payload.media_type = "image";
        payload.media_url = uploadedUrls[0];
      }

      if (pendingMedia.length > 1) {
        payload.media_type = "multi-image";
        payload.media_urls = uploadedUrls;
      }

      // 🔥 WebSocket OPEN 상태까지 기다렸다가 안전 전송
      waitForSocketReady(() => {
        wsRef.current?.send(JSON.stringify(payload));
      });

      setText("");
      setPendingMedia([]);

      
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // 렌더링 (입력창 + 메뉴 + 미디어 뷰어)
  // =====================================================
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
    >
      {/* 상단 상대 프로필 */}
      <TouchableOpacity onPress={handleProfilePress}>
        <View
          style={{
            alignItems: "center",
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderColor: "#eee",
          }}
        >
          {opponentProfile ? (
            <ExpoImage
              source={{ uri: opponentProfile }}
              style={{ width: 58, height: 58, borderRadius: 29 }}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={60} color="#bbb" />
          )}

          <Text style={{ fontSize: 16, fontWeight: "700", marginTop: 6 }}>
            {opponentName}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 메시지 리스트 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingBottom: pendingMedia.length > 0 ? 150 : 100,
          paddingTop: 10,
        }}
      />



      {/* 미디어 미리보기 */}
      {pendingMedia.length > 0 && (
        <View
          style={{
            padding: 12,
            backgroundColor: "#fafafa",
            borderTopWidth: 1,
            borderColor: "#ddd",
          }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {pendingMedia.map((m, i) => (
              <View key={i} style={{ marginRight: 8, marginBottom: 8 }}>
                <ExpoImage
                  source={m.kind === "image" ? m.uri : m.thumbnail}
                  style={{ width: 70, height: 70, borderRadius: 8 }}
                />
                <TouchableOpacity
                  onPress={() =>
                    setPendingMedia((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    backgroundColor: "#000",
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 입력창 */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderColor: "#eee",
          paddingBottom: insets.bottom + 5,
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => setShowMenu((v) => !v)}>
          <Ionicons
            name={showMenu ? "close" : "add-circle-outline"}
            size={30}
            color="#444"
          />
        </TouchableOpacity>

        <TextInput
          placeholder="메시지 입력…"
          value={text}
          onChangeText={setText}
          multiline
          style={{
            flex: 1,
            marginLeft: 10,
            paddingVertical: 10,
            paddingHorizontal: 15,
            backgroundColor: "#f7f7f7",
            borderRadius: 18,
            maxHeight: 120,
          }}
        />

        <TouchableOpacity
          onPress={sendMessage}
          style={{ marginLeft: 10 }}
          disabled={uploading}
        >
          <Text
            style={{
              fontWeight: "700",
              color: uploading ? "#aaa" : "#23422D",
              fontSize: 16,
            }}
          >
            전송
          </Text>
        </TouchableOpacity>
      </View>

      {/* 하단 메뉴 */}
      {showMenu && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: insets.bottom + 10,
            paddingTop: 20,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderColor: "#eee",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              onPress={openAlbum}
              style={{ alignItems: "center", marginHorizontal: 40 }}
            >
              <Ionicons name="image-outline" size={32} color="#333" />
              <Text>앨범</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openCamera}
              style={{ alignItems: "center", marginHorizontal: 40 }}
            >
              <Ionicons name="camera-outline" size={32} color="#333" />
              <Text>카메라</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 전체화면 비디오 */}
      {previewVideoVisible && (
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => setPreviewVideoVisible(null)}
            style={{ position: "absolute", top: 40, right: 20 }}
          >
            <Ionicons name="close" size={40} color="#fff" />
          </TouchableOpacity>

          <Video
            source={{ uri: previewVideoVisible }}
            useNativeControls
            resizeMode="contain"
            style={{ width: "90%", height: "60%" }}
          />
        </View>
      )}

      {/* 전체 이미지 슬라이더 */}
      <FullscreenImageSlider
        visible={previewMulti.visible}
        images={previewMulti.images}
        onClose={() => setPreviewMulti({ visible: false, images: [] })}
      />

      {/* 업로드 중 표시 */}
      {uploading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              padding: 22,
              backgroundColor: "#fff",
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#444" />
            <Text style={{ marginTop: 10 }}>업로드 중…</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
