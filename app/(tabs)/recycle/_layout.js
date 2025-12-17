 
import { Stack } from "expo-router";

export default function RecycleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,  
      }}
    >
      <Stack.Screen name="index" />
      
    </Stack>
  );
}
