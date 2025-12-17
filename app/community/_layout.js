import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

export default function CommunityLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerTitle: "",
        headerBackTitleVisible: false,
        headerShown: true,
      }}
    >
      {/*   커뮤니티 메인(index) → 중앙 타이틀: Rewear Lounge */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: "Rewear Lounge",
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace("/recycle")}
              style={{ paddingHorizontal: 15 }}
            >
              <Text style={{ fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* 나머지 화면들은 기존처럼 뒤로가기만 */}
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          headerTitle: "Rewear Lounge",
          headerTitleAlign: "center",
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

      <Stack.Screen
        name="users/[uid]"
        options={{
          headerShown: true,
          headerTitle: "Rewear Lounge",
          headerTitleAlign: "center",
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

      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          headerTitle: "Rewear Lounge",
          headerTitleAlign: "center",
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

      <Stack.Screen
        name="write"
        options={{
          headerShown: true,
          headerTitle: "Rewear Lounge",
          headerTitleAlign: "center",
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

      <Stack.Screen
        name="dm"
        options={{
          headerShown: true,
          headerTitle: "Rewear Lounge",
          headerTitleAlign: "center",
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
    </Stack>
  );
}
