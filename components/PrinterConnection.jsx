import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Print from "expo-print";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as Animatable from "react-native-animatable";

export default function PrinterConnection() {
  const badgeRef = useRef();
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [purpose, setPurpose] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [visitorCount, setVisitorCount] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [showTip, setShowTip] = useState(true);
  const [readyToPrint, setReadyToPrint] = useState(false);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const printBadge = async () => {
      if (!readyToPrint || visitorCount == null) return;

      try {
        const uri = await captureRef(badgeRef, {
          format: "png",
          quality: 1,
        });

        await Print.printAsync({
          uri,
          printerUrl: selectedPrinter?.url,
          orientation: Print.Orientation.Landscape,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });
      } catch (err) {
        console.error("Print error:", err);
        Alert.alert("Print Error", err.message || "Failed to print badge.");
      } finally {
        setIsPrinting(false);
        setReadyToPrint(false);
        setName("");
        setCompany("");
        setPurpose("");

      }
    };

    printBadge();
  }, [visitorCount, readyToPrint]);

  const handleSelectPrinter = async () => {
    try {
      const printer = await Print.selectPrinterAsync();
      if (printer) {
        setSelectedPrinter(printer);
        setShowTip(false);
        Toast.show({
          type: "success",
          text1: "Printer Selected",
          text2: printer.name,
          position: "top",
          visibilityTime: 2000,
        });
      }
    } catch (error) {
      console.log("Printer selection error:", error);
      Toast.show({
        type: "error",
        text1: "Error selecting printer",
        text2: error.message || "Please try again",
      });
    }
  };

  const printLabel = async () => {
    if (isPrinting) return;

    if (!name.trim()) {
      setNameError("Visitor name is required.");
      Alert.alert("Validation Error", "Visitor name is required.");
      return;
    }

    setIsPrinting(true);
    setNameError("");
    setVisitorCount(null);

    try {
      const response = await fetch(
        "https://mis.foundationu.com/api/visitor/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, company, purpose }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to submit data");
      }

      const count = result?.visitor?.count;
      if (!count) throw new Error("Missing visitor count in response");

      Alert.alert(
        "Print Preview",
        `Name: ${name}\nCompany: ${company}\nPurpose: ${purpose}\n\nProceed to print?`,
        [
          {
            text: "Cancel",
            onPress: () => {
              setIsPrinting(false);
            },
            style: "cancel",
          },
          {
            text: "Print",
            onPress: () => {
              setVisitorCount(count);
              setReadyToPrint(true);
         
              setName("");
              setCompany("");
              setPurpose("");
            },
          },
        ]
      );
      
    } catch (error) {
      console.log("Error:", error);
      Alert.alert("Error", error.message || "Something went wrong.");
      setIsPrinting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={handleSelectPrinter}>
        <Feather name="printer" size={24} color="#fff" />
      </TouchableOpacity>

      {showTip && (
        <Animatable.View
          animation="fadeIn"
          iterationCount="infinite"
          direction="alternate"
          duration={1500}
          style={styles.tipWrapper}
        >
          <View style={styles.bubble}>
            <Text style={styles.tipText}>Click here to connect printer</Text>
            <View style={styles.bubbleTail} />
          </View>
        </Animatable.View>
      )}
      <View style={styles.badgeWrapper}>
        <View style={styles.badge} ref={badgeRef} collapsable={false}>
          <View style={styles.badgeContent}>
            <Image
              source={require("../assets/images/fu_logo.png")}
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
                {name || "Visitor Name"}
              </Text>
              <Text
                style={styles.company}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {company || " "}
              </Text>
              <Text style={styles.label}>
                Visitor{visitorCount ? ` ${visitorCount}` : ""}
              </Text>
              <Text style={styles.dateTimeText}>{currentTime}</Text>
            </View>
          </View>
        </View>
      </View>

      <TextInput
        style={[styles.input, nameError ? styles.inputError : null]}
        placeholder="Enter name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (text.trim()) setNameError("");
        }}
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

      <TouchableOpacity
        style={[
          styles.printButton,
          (isPrinting || !name.trim()) && { backgroundColor: "#aaa" },
        ]}
        onPress={printLabel}
        disabled={isPrinting || !name.trim()}
      >
        <Text style={styles.buttonText}>
          {isPrinting ? "Printing..." : "Print Badge"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  iconButton: {
    position: "absolute",
    top: 50,
    right: 30,
    zIndex: 10,
    backgroundColor: "#9a1b2f",
    padding: 10,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  printerTip: {
    position: "absolute",
    top: 80,
    right: 24,
    fontSize: 14,
    color: "#444",
    opacity: 0.7,
  },
  logo: {
    width: 235,
    height: 235,
    marginRight: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 30,
  },
  inputError: {
    borderColor: "red",
  },
  badgeWrapper: {
    alignItems: "center",
    marginTop: 100,
    marginBottom: 20,
  },
  badge: {
    width: 700,
    height: 200,
    borderRadius: 10,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  badgeContent: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  textWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 12,
  },
  name: {
    fontSize: 60,
    fontWeight: "bold",
  },
  company: {
    fontSize: 50,
  },
  label: {
    fontSize: 40,
    marginTop: 8,
    color: "#555",
  },
  dateTimeText: {
    fontSize: 24,
    color: "#555",
  },
  printButton: {
    backgroundColor: "#9a1b2f",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  tipWrapper: {
    position: "absolute",
    top: 90,
    right: 80,
    zIndex: 9,
    alignItems: "flex-end",
  },
  bubbleTail: {
    position: "absolute",
    right: -6,
    top: "50%",
    marginTop: -6,
    width: 12,
    height: 12,
    backgroundColor: "#f1f1f1",
    transform: [{ rotate: "45deg" }],
  },
  bubble: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    maxWidth: 200,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  tipText: {
    fontSize: 14,
    color: "#333",
  },
});
