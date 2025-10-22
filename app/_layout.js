// app/_layout.tsx
import { Stack } from "expo-router";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: true, // ✅ 헤더 표시
          headerTintColor: "black", // ✅ 화살표 색상
          headerTitle: "", // ✅ 제목 제거
          headerTransparent: true, // ✅ 배경 투명 (필요시)
          headerBackTitleVisible: false, // ✅ 'Back' 글자 제거
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" />
        <Stack.Screen name="upcycling" />
        <Stack.Screen name="reform" />
        <Stack.Screen name="favorites" options={{ headerBackTitleVisible: false }} />
      </Stack>
    </ThemeProvider>
  );
}
