import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ClothCard({ imageUri, name, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.placeholder}>📸</Text>
        )}
      </View>
      {name ? <Text style={styles.name}>{name}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "47%",
    marginBottom: 16,
  },
  imageBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "#f4f4f4",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    fontSize: 32,
    color: "#bbb",
  },
  name: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 15,
    color: "#23422D",
    fontWeight: "500",
  },
});
