import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";

export default function AlertDetail() {
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    const load = async () => {
      const userId = Number(await AsyncStorage.getItem("user_id"));
      const token = await AsyncStorage.getItem("access_token");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/alerts/today?user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setAlerts(data);
    };
    load();
  }, []);

  if (!alerts) {
    return (
      <SafeAreaView style={{ flex: 1, paddingTop: 20 }}>
        <View style={{ padding: 20 }}>
          <Text>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* 제목 */}
        <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>
          세탁이 필요한 옷 목록
        </Text>

        {/* 세탁 필요 없음 */}
        {alerts.items?.length === 0 && (
          <Text style={{ fontSize: 16, color: "#666" }}>
            오늘은 세탁이 필요한 옷이 없어요.
          </Text>
        )}

        {/* 세탁 필요한 옷 카드 */}
        {alerts.items?.map((item, idx) => (
          <View
            key={idx}
            style={{
              backgroundColor: "#f3f7f5",
              padding: 14,
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              {item.name}
            </Text>

            <Text style={{ marginTop: 4 }}>
              최근 {item.wear_count}회 착용되었어요. 세탁해주시면 좋아요.
            </Text>
            <Text
              style={{
                marginTop: 12,
                fontSize: 13,
                color: "#777",
                lineHeight: 18,
              }}
            >
             
            </Text>
          </View>
        ))}

        {/* 구분선 */}
        <View
          style={{
            height: 1,
            backgroundColor: "#ddd",
            marginVertical: 24,
          }}
        />

        {/* 공통 세탁 주의사항 */}
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
          세탁 시 공통 주의사항
        </Text>

        <Text style={{ color: "#444", marginBottom: 8, lineHeight: 20 }}>
          ⚠️ AI 인식이 완벽하지 않을 수 있으니, 육안으로 확인했을 때 아래 소재는 각 특성에 맞는 세탁 방법을 참고해주세요.
        </Text>

        <Text style={{ color: "#555", marginBottom: 6, lineHeight: 20 }}>
          • 패딩류: 저온 세탁과 자연 건조를 권장하며 고온 탈수를 피해야 충전재 뭉침을 줄일 수 있어요.
        </Text>

        <Text style={{ color: "#555", marginBottom: 6, lineHeight: 20 }}>
          • 실크(Silk): 마찰과 수분에 약해 손세탁 또는 드라이클리닝이 적합하고 비틀어 짜면 손상돼요.
        </Text>

        <Text style={{ color: "#555", marginBottom: 6, lineHeight: 20 }}>
          • 니트류(Knit): 마찰과 늘어짐에 약해 울 코스 또는 손세탁 후 눕혀서 건조해야 형태가 유지돼요.
        </Text>

        <Text style={{ color: "#555", marginBottom: 6, lineHeight: 20 }}>
          • 데님(Denim): 물빠짐이 강하므로 단독 세탁이 필요하고 뒤집어서 세탁하면 마찰 자국을 줄일 수 있어요.
        </Text>

        <Text style={{ color: "#555", marginBottom: 6, lineHeight: 20 }}>
          • 레더(Leather): 물세탁 금지이며 가죽 전용 클리너 또는 드라이클리닝을 사용하는 것이 가장 안전해요.
        </Text>

        <Text style={{ color: "#444", marginTop: 14, lineHeight: 20 }}>
          위의 소재들은 세탁을 자주할수록 섬유 손상, 변색, 수축이 발생하기 쉬워요.  
          가벼운 오염은 부분 세탁을 활용하고, 전체 세탁은 필요할 때만 진행하는 것이 옷의 수명을 더 오래 유지하는 데 도움이 됩니다.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}
