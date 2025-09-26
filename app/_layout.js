// app/_layout.js

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* (tabs) 그룹을 하나의 화면으로 설정하고, 헤더를 숨깁니다. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* 상세 페이지들의 헤더 옵션을 설정합니다. */}
      <Stack.Screen name="profile" options={{ title: '프로필' }} />
      <Stack.Screen name="result" options={{ title: '분석 결과' }} />
    </Stack>
  );
}