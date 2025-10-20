// app/(tabs)/tree/_layout.js

import { Stack } from "expo-router";

export default function TreeLayout() {
  return (
    // 👇 Stack 자체에 screenOptions를 추가합니다.
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}