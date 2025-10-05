// components/ErrorMessage.js

import { StyleSheet, Text, View } from 'react-native';

const ErrorMessage = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>⚠️ {message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#ffdddd',
    margin: 20,
  },
  errorText: {
    color: '#d8000c',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ErrorMessage;