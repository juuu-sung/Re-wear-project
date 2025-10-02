// app/(tabs)/recycle/_layout.js

import { Stack } from 'expo-router';

export default function RecycleLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}