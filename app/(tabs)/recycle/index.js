// app/(tabs)/recycle/index.js

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

import CutIcon from '../../../assets/icons/cut-outline.svg';
import LeafIcon from '../../../assets/icons/leaf-outline.svg';

// 임시 의류수거함 위치 데이터 (진주시청 근처)
const MOCK_BINS = [
  { lat: 35.1939, lng: 128.0837, title: '진주시청 앞 수거함' },
  { lat: 35.1960, lng: 128.0865, title: '상대동 주민센터 근처' },
  { lat: 35.1911, lng: 128.0812, title: '진주 중앙시장 입구' },
];

// ⚠️ [중요] 카카오 개발자 사이트에서 발급받은 JavaScript 키를 입력하세요.
const KAKAO_MAPS_API_KEY = '36cdecbb254c77b8c190c98da7a1ba64';

export default function RecycleScreen() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 거부됨', '지도 기능을 사용하려면 위치 권한이 필요합니다.');
        setLoading(false);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch (error) {
        Alert.alert("위치 오류", "현재 위치를 가져오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // WebView에 삽입될 HTML 코드 생성 함수
  const getHtml = (userLoc, bins) => {
    const markers = bins.map(bin => 
      `new kakao.maps.Marker({ position: new kakao.maps.LatLng(${bin.lat}, ${bin.lng}), title: '${bin.title}' });`
    ).join('');
  
    const userMarker = `
      var userMarker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(${userLoc.lat}, ${userLoc.lng}),
        image: new kakao.maps.MarkerImage('https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png', new kakao.maps.Size(64, 69), {offset: new kakao.maps.Point(27, 69)})
      });
      userMarker.setMap(map);
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Kakao Maps</title>
        <style>html, body {width:100%;height:100%;margin:0;padding:0;}</style>
      </head>
      <body>
        <div id="map" style="width:100%;height:100%;"></div>
        <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAPS_API_KEY}"></script>
        <script>
          var container = document.getElementById('map');
          var options = {
            center: new kakao.maps.LatLng(${userLoc.lat}, ${userLoc.lng}),
            level: 5
          };
          var map = new kakao.maps.Map(container, options);
          
          ${userMarker} // 사용자 위치 마커 추가
          
          var binMarkers = [${markers}];
          binMarkers.forEach(function(marker) {
            marker.setMap(map);
          });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>순환</Text>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="green" />
        ) : userLocation ? (
          <WebView
            originWhitelist={['*']}
            source={{ html: getHtml(userLocation, MOCK_BINS) }}
            style={{ flex: 1 }}
          />
        ) : (
          <Text style={styles.errorText}>지도를 표시하려면 위치 권한이 필요합니다.</Text>
        )}
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/upcycling')}>
          <LeafIcon width={24} height={24} stroke="white" />
          <Text style={styles.buttonText}>업사이클링</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/reform')}>
          <CutIcon width={24} height={24} stroke="white" />
          <Text style={styles.buttonText}>리폼</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  mapContainer: { flex: 1, margin: 20, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'gray' },
  buttonSection: { flexDirection: 'row', padding: 20, gap: 15 },
  button: { flex: 1, backgroundColor: 'green', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});