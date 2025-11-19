import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

export default function ChatLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerTitle: "",
        headerBackTitleVisible: false,
        headerShown: true, 
      }}
    >

      {/* 🔥 DM 리스트 */}
      <Stack.Screen
        name="dm"
        options={{
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace("/community")}
              style={{ paddingHorizontal: 15 }}
            >
              <Text style={{ fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* 🔥 개별 채팅방 — [room_id] */}
      <Stack.Screen
        name="[room_id]"
        options={{
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace("/community/dm")}
              style={{ paddingHorizontal: 15 }}
            >
              <Text style={{ fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

    </Stack>
  );
}
