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
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PrinterConnection() {
  const badgeRef = useRef();
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [purpose, setPurpose] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [isPrinting, setIsPrinting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [showTip, setShowTip] = useState(true);
  const [readyToPrint, setReadyToPrint] = useState(false);
  const [visitorData, setVisitorData] = useState(null);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const printBadge = async () => {
      if (!readyToPrint || !visitorData) return;

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
        setVisitorData(null); // clear after printing
        setName("");
        setCompany("");
        setPurpose("");
      }
    };

    printBadge();
  }, [readyToPrint, visitorData]);

  useEffect(() => {
    const loadPrinter = async () => {
      try {
        const savedPrinter = await AsyncStorage.getItem("selectedPrinter");
        if (savedPrinter) {
          const parsedPrinter = JSON.parse(savedPrinter);
          setSelectedPrinter(parsedPrinter);
          setShowTip(false);
          console.log("Loaded saved printer:", parsedPrinter.name);
        }
      } catch (e) {
        console.log("Failed to load saved printer", e);
      }
    };

    loadPrinter();
  }, []);

  const handleSelectPrinter = async () => {
    Alert.alert("Connect Printer", "Choose how to connect to your printer:", [
      {
        text: "Use IP Address",
        onPress: () => {
          Alert.prompt(
            "Enter Printer IP",
            "Example: 192.168.1.100",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Connect",
                onPress: async (ip) => {
                  if (!ip) return;
                  const manualPrinter = {
                    name: `Manual IP: ${ip}`,
                    url: `ipp://${ip}`,
                  };
                  setSelectedPrinter(manualPrinter);
                  await AsyncStorage.setItem(
                    "selectedPrinter",
                    JSON.stringify(manualPrinter)
                  );
                  setShowTip(false);
                  Toast.show({
                    type: "success",
                    text1: "Printer Set",
                    text2: `Using IP: ${ip}`,
                    position: "top",
                  });
                },
              },
            ],
            "plain-text"
          );
        },
      },
      {
        text: "Search for Printers",
        onPress: async () => {
          try {
            const printer = await Print.selectPrinterAsync();
            if (printer) {
              setSelectedPrinter(printer);
              await AsyncStorage.setItem(
                "selectedPrinter",
                JSON.stringify(printer)
              );
              setShowTip(false);
              Toast.show({
                type: "success",
                text1: "Printer Selected",
                text2: printer.name,
                position: "top",
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
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
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
    setVisitorData(null);

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

      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      console.log("Response Status:", response.status);
      console.log("Content-Type:", contentType);
      console.log("Raw Response Text:", responseText);

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status}`);
      }

      if (contentType && contentType.includes("application/json")) {
        const result = JSON.parse(responseText);
        const visitor = result?.visitor;
        if (!visitor?.count) throw new Error("Missing visitor count in response");

        setVisitorData(visitor); 
        setReadyToPrint(true);
      } else {
        throw new Error("Unexpected response format from server");
      }
    } catch (error) {
      console.log("Error during fetch:", error);
      Alert.alert("Error", error.message || "Something went wrong.");
      setIsPrinting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton} onPress={handleSelectPrinter}>
        <Text style={styles.iconButtonText} numberOfLines={1}>
          {selectedPrinter ? selectedPrinter.name : " "}
        </Text>
        <Feather name="printer" size={20} color="#fff" style={{ marginLeft: 6 }} />
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
                {visitorData?.name || "Visitor Name"}
              </Text>
              <Text
                style={styles.company}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {visitorData?.company || " "}
              </Text>
              <Text style={styles.label}>
                Visitor{visitorData?.count ? ` ${visitorData.count}` : ""}
              </Text>
              <Text style={styles.dateTimeText}>
                {visitorData?.created_at || currentTime}
              </Text>
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
    flexDirection: "row",
  },
  iconButtonText: {
    color: "white",
    fontSize: 12,
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
    fontSize: 24,
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
