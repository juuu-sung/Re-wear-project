import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CareLabelModal({ label, onClose }) {
  if (!label) return null;

  return (
    <Modal transparent animationType="fade" visible={!!label} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Image source={label.img} style={styles.icon} resizeMode="contain" />
          <Text style={styles.desc}>{label.desc}</Text>
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },
  icon: { width: 100, height: 100, marginBottom: 12 },
  desc: { textAlign: "center", color: "#333", fontSize: 15, marginBottom: 16 },
  btn: {
    backgroundColor: "#1C7C54",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
