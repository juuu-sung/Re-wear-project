 

import { Stack } from "expo-router";

export default function TreeLayout() {
  return (
     
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}