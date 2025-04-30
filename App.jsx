import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';

export default function App() {
  const badgeRef = useRef();
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [company, setCompany] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const handleSelectPrinter = async () => {
    try {
      const printer = await Print.selectPrinterAsync();
      console.log('Printer selected:', printer);
      setSelectedPrinter(printer);
    } catch (error) {
      console.log('Printer selection error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!name || !company || !purpose) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://mis.foundationu.com/api/visitor/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          company,
          purpose
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResponseData(data);
        console.log(data);
        if (data.status == 200) {
          printLabel();
        } else {
          Alert.alert('Api failed');
        }
        Alert.alert('Success', 'Visitor data submitted successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to submit data');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred while submitting data');
    } finally {
      setIsLoading(false);
    }
  };

  const samples = async () => {
    console.log('printing');
  };

  const printLabel = async () => {
    try {
      const uri = await captureRef(badgeRef, {
        format: 'png',
        quality: 1,
      });

      await Print.printAsync({
        uri,
        printerUrl: selectedPrinter?.url,
        orientation: Print.Orientation.Landscape,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });
    } catch (error) {
      console.log('Error capturing or printing:', error);
      Alert.alert('Print Error', 'Could not generate badge.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.badgeWrapper}>
        <View style={styles.badge} ref={badgeRef} collapsable={false}>

          <View style={styles.badgeContent}>
            <Image
              source={require('./assets/images/fu_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.textWrapper}>
              <Text
                style={styles.name}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {name || 'Visitor Name'}
              </Text>
              <Text
                style={styles.company}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {company || 'Company Name'}
              </Text>
              <Text style={styles.label}>Visitor</Text>
              <Text style={styles.dateTimeText}>
                {currentTime}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter company"
        placeholderTextColor="#888"
        value={company}
        onChangeText={setCompany}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter purpose"
        placeholderTextColor="#888"
        value={purpose}
        onChangeText={setPurpose}
      />

      <TouchableOpacity style={styles.selectButton} onPress={handleSelectPrinter}>
        <Text style={styles.buttonText}>
          {selectedPrinter?.name || 'Select Printer'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.printButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Print Badge</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 240,
    height: 240,
    marginRight: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 30,
  },
  badgeWrapper: {
    alignItems: 'center',
    marginVertical: 20,
  },
  badge: {
    width: 700,
    height: 200,
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  badgeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  name: {
    fontSize: 60,
    fontWeight: 'bold',
    maxWidth: '100%',
  },
  company: {
    fontSize: 50,
    maxWidth: '100%',
  },
  label: {
    fontSize: 40,
    marginTop: 8,
    color: '#555',
  },
  dateTimeWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 2,
  },
  dateTimeText: {
    fontSize: 24,
    color: '#555',
  },
  selectButton: {
    backgroundColor: 'grey',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  printButton: {
    backgroundColor: '#9a1b2f',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
