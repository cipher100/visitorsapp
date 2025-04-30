import { View, StyleSheet } from 'react-native';
import PrinterConnection from './components/PrinterConnection';
import Toast from 'react-native-toast-message';

export default function App() {
  return (
    <View style={styles.container}>
      <PrinterConnection />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});