 
import { Stack } from "expo-router";

export default function ClosetLayout() {
  return (
    <Stack>
      {/*  옷장 메인 화면 */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,  
          title: "",  
        }}
      />

      {/*  옷 추가 */}
      <Stack.Screen
        name="add"
        options={{
          headerTitle: "",  
          headerBackTitleVisible: false,  
          headerBackTitle: "",  
          headerTintColor: "#000",  
          headerShadowVisible: false,  
        }}
      />

      {/*  옷 상세 */}
      <Stack.Screen
        name="detail"
        options={{
          headerTitle: "",
          headerBackTitleVisible: false,
          headerBackTitle: "",
          headerTintColor: "#000",
          headerShadowVisible: false,
        }}
      />

      {/*  상의 / 하의 / 아우터 */}
      {["top", "bottom", "outer"].map((name) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            headerTitle: "",
            headerBackTitleVisible: false,
            headerBackTitle: "",
            headerTintColor: "#000",
            headerShadowVisible: false,
          }}
        />
      ))}
    </Stack>
  );
}
