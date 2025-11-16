import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function MessageList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [myId, setMyId] = useState(null);
  const [rooms, setRooms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUid = async () => {
      const uid = await AsyncStorage.getItem("user_id");
      setMyId(uid);
    };
    loadUid();
  }, []);

  useEffect(() => {
    if (!myId) return;

    const loadRooms = async () => {
      const res = await fetch(`${BASE_URL}/v1/chat/my-rooms?user_id=${myId}`);
      const data = await res.json();
      setRooms(data);
      setLoading(false);
    };

    loadRooms();
  }, [myId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: insets.top - 60,
        paddingHorizontal: 12,
      }}
    >
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.room_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.replace(`/chat/${item.room_id}?myId=${myId}`)
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Ionicons
              name="person-circle-outline"
              size={50}
              color="#333"
              style={{ marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 16 }}>
                유저 {item.opponent_id}
              </Text>
              <Text numberOfLines={1} style={{ marginTop: 3, color: "#555" }}>
                {item.last_message || "채팅을 시작하세요"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
