// app/_layout.tsx
import { Stack } from "expo-router";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTintColor: "black",
          headerTitle: "",
          headerTransparent: true,
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" />
        <Stack.Screen name="reform" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="scan" options={{ title: '케어라벨 스캔', presentation: 'modal' }} />
        <Stack.Screen name="scanResult" options={{ title: '스캔 결과', presentation: 'modal' }} />
        {/* 🔥 여기가 포인트: community 그룹은 루트 헤더 안 보이게 */}
        <Stack.Screen name="community" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
