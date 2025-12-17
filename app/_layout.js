 

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          <Stack.Screen
            name="scan"
            options={{
              title: "케어라벨 스캔",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="scanResult"
            options={{
              title: "스캔 결과",
              presentation: "modal",
            }}
          />

          <Stack.Screen
            name="community"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="chat"
            options={{ headerShown: false }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
