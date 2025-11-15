// app/(tabs)/recycle/_layout.js
import { Stack } from "expo-router";

export default function RecycleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // ✅ 순환 탭 내부 모든 화면 상단 제목 제거
      }}
    >
      <Stack.Screen name="index" />
      
    </Stack>
  );
}
