import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function ChatRoom() {
  const {
    room_id,
    myId,
    opponentId,
    opponentName,
    opponentProfile,
  } = useLocalSearchParams();

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const messagesRef = useRef([]);
  const updateTimerRef = useRef(null);
  const wsRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const loadMessages = async () => {
    const res = await fetch(`${BASE_URL}/v1/chat/rooms/${room_id}/messages`);
    const data = await res.json();
    messagesRef.current = data;
    setMessages([...data]);
  };

  const handleIncoming = (event) => {
    const msg = JSON.parse(event.data);
    messagesRef.current.push(msg);

    if (!updateTimerRef.current) {
      updateTimerRef.current = setTimeout(() => {
        setMessages([...messagesRef.current]);
        updateTimerRef.current = null;
      }, 80);
    }
  };

  const connectSocket = () => {
    const wsUrl = BASE_URL.startsWith("https")
      ? BASE_URL.replace("https", "wss")
      : BASE_URL.replace("http", "ws");

    const socket = new WebSocket(`${wsUrl}/v1/chat/ws/${room_id}`);
    wsRef.current = socket;

    socket.onmessage = handleIncoming;
  };

  useEffect(() => {
    loadMessages();
    connectSocket();

    return () => {
      try {
        wsRef.current?.close(1000, "CHAT_CLOSED");
      } catch {}
    };
  }, []);

  const sendMessage = () => {
    if (!text.trim()) return;

    wsRef.current?.send(
      JSON.stringify({
        sender_id: Number(myId),
        message: text,
      })
    );

    setText("");
  };

  const renderItem = useCallback(
    ({ item }) => (
      <View
        style={{
          alignSelf:
            String(item.sender_id) === String(myId) ? "flex-end" : "flex-start",
          backgroundColor:
            String(item.sender_id) === String(myId) ? "#DCF8C6" : "#eee",
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 12,
          marginBottom: 8,
          maxWidth: "75%",
        }}
      >
        <Text style={{ fontSize: 15 }}>{item.message}</Text>
      </View>
    ),
    [myId]
  );

  const goToProfile = () => {
    if (!opponentId) return;

    router.push({
      pathname: `/community/users/${opponentId}`,
      params: {
        user_name: opponentName,
        profile_image: opponentProfile,
      },
    });
  };

  const hasProfile =
    opponentProfile && opponentProfile.trim() !== "" ? true : false;

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: insets.top - 50,
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 상대방 프로필 영역 */}
      <TouchableOpacity
        onPress={goToProfile}
        style={{
          alignItems: "center",
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderColor: "#eee",
          marginBottom: 8,
        }}
      >
        {hasProfile ? (
          <Image
            source={{ uri: opponentProfile }}
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              marginBottom: 6,
            }}
          />
        ) : (
          <Ionicons
            name="person-circle-outline"
            size={60}
            color="#bbb"
            style={{ marginBottom: 6 }}
          />
        )}

        <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>
          {opponentName || "상대방"}
        </Text>
      </TouchableOpacity>

      {/* 메시지 리스트 */}
      <FlatList
        data={messages}
        keyExtractor={(item, index) => (item.id ?? index).toString()}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 15,
          paddingTop: 5,
          paddingBottom: 10,
        }}
      />

      {/* 입력창 */}
      <View
        style={{
          flexDirection: "row",
          padding: 10,
          borderTopWidth: 1,
          borderColor: "#ddd",
          backgroundColor: "#fff",
        }}
      >
        <TextInput
          placeholder="메시지 입력…"
          value={text}
          onChangeText={setText}
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: "#f7f7f7",
            borderRadius: 20,
            paddingHorizontal: 15,
          }}
        />

        <TouchableOpacity onPress={sendMessage} style={{ marginLeft: 10 }}>
          <Text style={{ fontWeight: "700", color: "#23422D" }}>보내기</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
