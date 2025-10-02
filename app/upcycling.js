import { StyleSheet, Text, View } from 'react-native';

export default function UpcyclingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>업사이클링 페이지입니다.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 20, fontWeight: 'bold' },
});