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
    setMessages([...messagesRef.current]);
  };

  const handleIncoming = (event) => {
    const msg = JSON.parse(event.data);
    messagesRef.current.push(msg);

    if (!updateTimerRef.current) {
      updateTimerRef.current = setTimeout(() => {
        setMessages([...messagesRef.current]);
        updateTimerRef.current = null;
      }, 100);
    }
  };

  const connectSocket = () => {
    const wsUrl = BASE_URL.startsWith("https")
      ? BASE_URL.replace("https", "wss")
      : BASE_URL.replace("http", "ws");

    const socket = new WebSocket(`${wsUrl}/v1/chat/ws/${room_id}`);
    wsRef.current = socket;

    socket.onopen = () => console.log("WS CONNECTED");
    socket.onmessage = handleIncoming;
    socket.onerror = (e) => console.log("WS ERROR:", e.message);
    socket.onclose = () => console.log("WS CLOSED");
  };

  useEffect(() => {
    console.log("CHATROOM MOUNTED");

    loadMessages();
    connectSocket();

    return () => {
      console.log("CHATROOM UNMOUNTED");

      try {
        if (wsRef.current) {
          wsRef.current.onmessage = null;
          wsRef.current.onerror = null;
          wsRef.current.onopen = null;
          wsRef.current.onclose = null;

          wsRef.current.close(1000, "CHAT_CLOSED");
          wsRef.current = null;
        }

        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
          updateTimerRef.current = null;
        }
      } catch (e) {
        console.log("cleanup err:", e);
      }
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
        contentContainerStyle={{ padding: 15 }}
      />

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
