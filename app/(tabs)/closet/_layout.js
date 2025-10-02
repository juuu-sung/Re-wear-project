// app/(tabs)/closet/_layout.js

import { Stack } from 'expo-router';

export default function ClosetLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "옷 상세정보" }} />
      <Stack.Screen name="edit" options={{ title: "정보 수정" }} />
      <Stack.Screen name="add" options={{ title: "새 옷 추가" }} />
    </Stack>
  );
}