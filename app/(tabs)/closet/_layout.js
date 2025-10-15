// app/(tabs)/closet/_layout.js
import { Stack } from "expo-router";

export default function ClosetLayout() {
  return (
    <Stack>
      {/* ✅ 옷장 메인 화면 */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // 헤더 자체 숨김
          title: "", // iOS에서 "index" 표시 방지
        }}
      />

      {/* ✅ 옷 추가 */}
      <Stack.Screen
        name="add"
        options={{
          headerTitle: "", // 제목 제거
          headerBackTitleVisible: false, // "index" 숨김
          headerBackTitle: "", // "< index" 중 "index" 제거
          headerTintColor: "#000", // 화살표 검정색
          headerShadowVisible: false, // 하단 라인 제거
        }}
      />

      {/* ✅ 옷 상세 */}
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

      {/* ✅ 상의 / 하의 / 아우터 */}
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
