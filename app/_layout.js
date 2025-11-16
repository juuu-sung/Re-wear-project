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

        {/* 🔥 여기가 포인트: community 그룹은 루트 헤더 안 보이게 */}
        <Stack.Screen name="community" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
