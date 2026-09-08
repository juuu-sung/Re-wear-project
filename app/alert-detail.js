import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AlertDetail() {
  const [alerts, setAlerts] = useState(null);

   
  const [basketVisible, setBasketVisible] = useState(false);
  const [basketItems, setBasketItems] = useState([]);

   const loadAlerts = async () => {
    const userId = Number(await AsyncStorage.getItem("user_id"));
    const token = await AsyncStorage.getItem("access_token");

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_BASE_URL}/alerts/today?user_id=${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();

    setAlerts({
      count: Array.isArray(data?.items) ? data.items.length : 0,
      items: Array.isArray(data?.items) ? data.items : [],
    });
  };

  useEffect(() => {
    loadAlerts();
  }, []);

   const loadBasketFromServer = async () => {
    const token = await AsyncStorage.getItem("access_token");

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_BASE_URL}/laundry-basket`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    setBasketItems(Array.isArray(data) ? data : []);
  };

   
   
   
  const addToBasket = async (item) => {
    const clothesId = item.garment_id;
    if (!clothesId) return;

    const token = await AsyncStorage.getItem("access_token");

    await fetch(
      `${process.env.EXPO_PUBLIC_BASE_URL}/laundry-basket/${clothesId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setAlerts((prev) =>
      prev
        ? { ...prev, items: prev.items.filter((i) => i !== item) }
        : prev
    );
  };

   
   
   
  const addAllToBasket = async () => {
    const token = await AsyncStorage.getItem("access_token");

    for (const item of alerts.items) {
      if (!item.garment_id) continue;

      await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/laundry-basket/${item.garment_id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }

     
    setAlerts((prev) => (prev ? { ...prev, items: [] } : prev));
  };

   
   
   
  const confirmAddToBasket = (item) => {
    Alert.alert(
      "빨래통에 담기",
      "이 옷을 빨래통에 넣으시겠습니까?",
      [
        { text: "아니오", style: "cancel" },
        { text: "예", onPress: () => addToBasket(item) },
      ]
    );
  };

  const confirmAddAllToBasket = () => {
    Alert.alert(
      "모두 담기",
      "모든 옷을 빨래통에 담으시겠습니까?",
      [
        { text: "아니오", style: "cancel" },
        { text: "예", onPress: () => addAllToBasket() },
      ]
    );
  };

   
   
   
  useFocusEffect(
    useCallback(() => {
      loadBasketFromServer();
    }, [])
  );

  if (!alerts) {
    return (
      <SafeAreaView style={{ flex: 1, paddingTop: 20 }}>
        <Text style={{ padding: 20 }}>불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, paddingTop: 20 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={styles.title}>세탁이 필요한 옷 목록</Text>

        {/*  전체 담기 버튼 */}
        {alerts.items.length > 1 && (
          <TouchableOpacity
            style={styles.addAllBtn}
            onPress={confirmAddAllToBasket}
          >
            <Ionicons name="basket" size={18} color="#fff" />
            <Text style={styles.addAllText}>모두 빨래통에 담기</Text>
          </TouchableOpacity>
        )}

        {alerts.items.length === 0 && (
          <Text style={{ color: "#666" }}>
            오늘은 세탁이 필요한 옷이 없어요.
          </Text>
        )}

        {alerts.items.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "600" }}>{item.name}</Text>
              <Text style={{ color: "#444", marginTop: 4 }}>
                최근 {item.wear_count}회 착용되었어요.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => confirmAddToBasket(item)}
              style={styles.basketBtn}
            >
              <Ionicons name="basket-outline" size={22} color="#1C7C54" />
            </TouchableOpacity>
          </View>
        ))}

        {/* ⬇️⬇️⬇️ 주의사항 (절대 수정 안 함) ⬇️⬇️⬇️ */}
        <View style={{ height: 1, backgroundColor: "#ddd", marginVertical: 24 }} />
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>
          세탁 시 공통 주의사항
        </Text>
        <Text style={{ color: "#444", marginBottom: 8, lineHeight: 20 }}>
          ⚠️ AI 인식이 완벽하지 않을 수 있으니, 육안으로 확인했을 때 아래 소재는 각 특성에 맞는 세탁 방법을 참고해주세요.
        </Text>
        <Text style={{ color: "#555", marginBottom: 6 }}>
          • 패딩류: 저온 세탁과 자연 건조를 권장하며 고온 탈수를 피해야 충전재 뭉침을 줄일 수 있어요.
        </Text>
        <Text style={{ color: "#555", marginBottom: 6 }}>
          • 실크(Silk): 마찰과 수분에 약해 손세탁 또는 드라이클리닝이 적합하고 비틀어 짜면 손상돼요.
        </Text>
        <Text style={{ color: "#555", marginBottom: 6 }}>
          • 니트류(Knit): 마찰과 늘어짐에 약해 울 코스 또는 손세탁 후 눕혀서 건조해야 형태가 유지돼요.
        </Text>
        <Text style={{ color: "#555", marginBottom: 6 }}>
          • 데님(Denim): 물빠짐이 강하므로 단독 세탁이 필요하고 뒤집어서 세탁하면 마찰 자국을 줄일 수 있어요.
        </Text>
        <Text style={{ color: "#555", marginBottom: 6 }}>
          • 레더(Leather): 물세탁 금지이며 가죽 전용 클리너 또는 드라이클리닝을 사용하는 것이 가장 안전해요.
        </Text>
        <Text style={{ color: "#444", marginTop: 14 }}>
          위의 소재들은 세탁을 자주할수록 섬유 손상, 변색, 수축이 발생하기 쉬워요.  
          가벼운 오염은 부분 세탁을 활용하고, 전체 세탁은 필요할 때만 진행하는 것이 옷의 수명을 더 오래 유지하는 데 도움이 됩니다.
        </Text>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={async () => {
          await loadBasketFromServer();
          setBasketVisible(true);
        }}
      >
        <Ionicons name="basket" size={26} color="#fff" />
      </TouchableOpacity>

      {/* 빨래통 모달 */}
      <Modal transparent visible={basketVisible} animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>  빨래통</Text>
              <TouchableOpacity onPress={() => setBasketVisible(false)}>
                <Ionicons name="close" size={22} />
              </TouchableOpacity>
            </View>

            {basketItems.length === 0 ? (
              <Text style={{ textAlign: "center", color: "#666" }}>
                빨래통이 비어 있어요.
              </Text>
            ) : (
              <ScrollView>
                {basketItems.map((b, idx) => (
                  <View key={idx} style={styles.basketItem}>
                    <Text>{b.clothes?.name}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  addAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C7C54",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  addAllText: { color: "#fff", marginLeft: 6, fontWeight: "600" },
  card: {
    flexDirection: "row",
    backgroundColor: "#f3f7f5",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  basketBtn: { marginLeft: 12 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1C7C54",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "65%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  basketItem: {
    backgroundColor: "#f3f7f5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
});