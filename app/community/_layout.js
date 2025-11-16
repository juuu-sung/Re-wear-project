import { Stack, usePathname, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

export default function CommunityLayout() {
  const router = useRouter();
  const pathname = usePathname();   // 🔥 현재 어떤 화면인지 알 수 있음

  return (
    <Stack
      screenOptions={{
        headerTitle: "",
        headerBackTitleVisible: false,
        headerShown: true,  // 전체 화면에서 헤더 기본 켜기
      }}
    >
      {/* 🔥 커뮤니티 메인(index) → recycle 로 이동하는 커스텀 헤더 */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
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

      {/* 🔥 나머지는 community 내부 뒤로가기 (community로) */}
      <Stack.Screen
        name="[id]"
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

      <Stack.Screen
        name="users/[uid]"
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

      <Stack.Screen
        name="profile"
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

      <Stack.Screen
        name="write"
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
    </Stack>
  );
}
