// app/(tabs)/calendar/_layout.js
import { Stack } from "expo-router";

export default function CalendarLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // ✅ calendar 탭 헤더 완전 제거
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
