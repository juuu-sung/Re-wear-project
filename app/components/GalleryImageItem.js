import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

const size = Dimensions.get("window").width / 3;

export default function GalleryImageItem({ uri, isSelected, selectIndex, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{ width: size, height: size }}>
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
        />

        {isSelected && (
          <View
            style={{
              position: "absolute",
              right: 6,
              top: 6,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#23422D",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              {selectIndex + 1}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
