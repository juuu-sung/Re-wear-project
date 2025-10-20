// app/(tabs)/calendar/_layout.js

import { Stack } from "expo-router";

export default function CalendarLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // ✅ closet처럼 기본 헤더를 숨깁니다.
        }}
      />
    </Stack>
  );
}