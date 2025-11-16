import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
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
  const { room_id, myId } = useLocalSearchParams();

  const messagesRef = useRef([]);
  const updateTimerRef = useRef(null);
  const wsRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const insets = useSafeAreaInsets();

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

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: insets.top + 50,
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(item, index) => (item.id ?? index).toString()}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: 15,
        }}
        ListHeaderComponent={
          messages.length === 0 ? (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "#999",
                  fontSize: 12,
                  lineHeight: 18,
                  textAlign: "center",
                }}
              >
                상대방과 처음 주고받는 대화입니다{"\n"}
                친절하고 예의를 지켜 대화해주세요.
              </Text>
            </View>
          ) : null
        }
      />

      {/* 메시지 입력창 */}
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
