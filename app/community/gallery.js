import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Dimensions, FlatList, Image, Text, TouchableOpacity, View } from "react-native";

//   app/components 기준 경로 정확하게 수정
import GalleryImageItem from "../components/GalleryImageItem"; // ✔️ 정답
import useGalleryLoad from "../hooks/useGalleryLoad";

export default function GalleryScreen() {
  const router = useRouter();
  const { selected: initial } = useLocalSearchParams();
  const { loading, assets } = useGalleryLoad();

  const [selected, setSelected] = useState(
    initial ? JSON.parse(initial) : []
  );

  const toggleSelect = (uri) => {
    setSelected((prev) =>
      prev.includes(uri)
        ? prev.filter((u) => u !== uri)
        : [...prev, uri]
    );
  };

  if (loading)
    return (
      <Text style={{ marginTop: 50, textAlign: "center" }}>
        갤러리 로딩중...
      </Text>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      
      {/* 선택된 첫번째 사진 미리보기 */}
      {selected.length > 0 ? (
        <Image
          source={{ uri: selected[0] }}
          style={{
            width: "100%",
            height: Dimensions.get("window").width,
          }}
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: Dimensions.get("window").width,
            backgroundColor: "#eee",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text>사진을 선택하세요</Text>
        </View>
      )}

      {/* 하단 갤러리 그리드 */}
      <FlatList
        data={assets}
        numColumns={3}
        renderItem={({ item }) => (
          <GalleryImageItem
            uri={item.uri}
            isSelected={selected.includes(item.uri)}
            selectIndex={selected.indexOf(item.uri)}
            onPress={() => toggleSelect(item.uri)}
          />
        )}
      />

      {/* 선택 완료 버튼 */}
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/community/write",
            params: { selected: JSON.stringify(selected) },
          })
        }
        style={{
          backgroundColor: selected.length > 0 ? "#23422D" : "#888",
          padding: 20,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
          선택 완료 ({selected.length})
        </Text>
      </TouchableOpacity>
    </View>
  );
}
