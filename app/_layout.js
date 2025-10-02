// app/_layout.js

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} /> 
      <Stack.Screen name="signup" options={{ title: '회원가입', headerBackTitleVisible: false }} />
      
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: '프로필', headerBackTitleVisible: false, }} />
      <Stack.Screen name="upcycling" options={{ title: '업사이클링', headerBackTitleVisible: false }} />
      <Stack.Screen name="reform" options={{ title: '리폼', headerBackTitleVisible: false }} />
    </Stack>
  );
}