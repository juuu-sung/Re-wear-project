// app/(tabs)/recycle/index.js
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { csvCandidates } from "./csvList";

export default function RecycleScreen() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState(null);
  const router = useRouter();

  // ✅ CSV 자동 로드
  const loadAllCSVs = async () => {
    try {
      const appDataDir = `${FileSystem.documentDirectory}data/`;
      const dirInfo = await FileSystem.getInfoAsync(appDataDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(appDataDir, { intermediates: true });
        console.log("📂 data 폴더 생성됨:", appDataDir);
      }

      // 🔄 CSV 복사
      for (const csv of csvCandidates) {
        const asset = await Asset.fromModule(csv).downloadAsync();
        const fileName = asset.name.endsWith(".csv")
          ? asset.name
          : `${asset.name}.csv`;
        const dest = `${appDataDir}${fileName}`;
        await FileSystem.copyAsync({ from: asset.localUri, to: dest });
      }

      // 📄 파일 탐색
      const files = await FileSystem.readDirectoryAsync(appDataDir);
      const csvFiles = files.filter((f) => f.endsWith("_bin.csv"));
      console.log("✅ 탐색된 CSV:", csvFiles);

      // 📍 마커 생성
      const allMarkers = [];

      for (const file of csvFiles) {
        const path = `${appDataDir}${file}`;
        const content = await FileSystem.readAsStringAsync(path, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const rows = content
          .split("\n")
          .map((r) => r.trim())
          .filter(
            (r) =>
              r &&
              !r.startsWith("행정동") &&
              !r.startsWith("읍면동") &&
              !r.startsWith("동")
          );

        for (const row of rows) {
          const cols = row.split(",").map((v) => v.trim());

          // 📌 case 1: (행정동, 위치, 기준일자, lat, lng)
          if (cols.length === 5) {
            const [dong, address, date, lat, lng] = cols;
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            if (!isNaN(latitude) && !isNaN(longitude)) {
              allMarkers.push({
                title: `${dong} ${address}`,
                latitude,
                longitude,
              });
            }
          }

          // 📌 case 2: (행정동, 도로명주소, 지번주소, 날짜, lat, lng)
          else if (cols.length >= 6) {
            const [dong, roadAddr, jibunAddr, date, lat, lng] = cols;
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            if (!isNaN(latitude) && !isNaN(longitude)) {
              const addrText = roadAddr || jibunAddr || "";
              allMarkers.push({
                title: `${dong} ${addrText}`,
                latitude,
                longitude,
              });
            }
          }
        }
      }

      setMarkers(allMarkers);
      console.log("📍 총 마커 수:", allMarkers.length);
    } catch (err) {
      console.error("❌ CSV 로드 실패:", err);
      Alert.alert("CSV 로드 실패", String(err));
    } finally {
      setLoading(false);
    }
  };

  // ✅ 내 위치 불러오기
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("위치 권한을 허용해주세요!");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (e) {
      console.error("위치 불러오기 실패:", e);
    }
  };

  useEffect(() => {
    (async () => {
      await getUserLocation();
      await loadAllCSVs();
    })();
  }, []);

  if (loading || !region) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ marginTop: 10 }}>헌옷수거함 위치를 불러오는 중...</Text>
      </View>
    );
  }

  const moveToMyLocation = async () => {
    await getUserLocation();
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }} region={region} showsUserLocation={true}>
        {markers.map((m, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.title}
          />
        ))}
      </MapView>

      {/* 🧭 내 위치 버튼 */}
      <TouchableOpacity style={styles.locationButton} onPress={moveToMyLocation}>
        <Ionicons name="navigate" size={26} color="#fff" />
      </TouchableOpacity>

      {/* 🔘 하단 버튼 3개 */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.subButton}
          onPress={() => router.push("/upcycling")}
        >
          <MaterialCommunityIcons name="recycle" size={18} color="#fff" />
          <Text style={styles.subText}>업사이클링</Text>
        </TouchableOpacity>

        <View style={styles.mainButton}>
          <Ionicons name="trash-bin" size={22} color="#fff" />
          <Text style={styles.mainText}>헌옷수거함</Text>
        </View>

        <TouchableOpacity
          style={styles.subButton}
          onPress={() => router.push("/reform")}
        >
          <Ionicons name="cut" size={18} color="#fff" />
          <Text style={styles.subText}>리폼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  locationButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    backgroundColor: "#2e7d32",
    borderRadius: 35,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 6,
  },
  bottomButtons: {
    position: "absolute",
    bottom: 25,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  mainButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 45,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    transform: [{ scale: 1.05 }],
  },
  mainText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  subButton: {
    backgroundColor: "#8BC34A",
    borderRadius: 35,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  subText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
