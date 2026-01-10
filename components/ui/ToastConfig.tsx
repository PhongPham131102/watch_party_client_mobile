import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BaseToast, ErrorToast, ToastConfig } from "react-native-toast-message";
import { Colors } from "@/constants/theme";
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react-native";

/*
  Custom Toast Configuration
  Mimics the aesthetics of "Sonner" from the web (Dark background, thin border, colored icons).
*/

const toastStyles = StyleSheet.create({
  container: {
    height: 60,
    width: "90%",
    backgroundColor: "#1E1F25", // Card background from theme
    borderLeftWidth: 0, // Remove default colored strip
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingHorizontal: 12,
    flex: 1,
    justifyContent: "center",
  },
  text1: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  text2: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.6)",
  },
});

export const toastConfig: ToastConfig = {
  /*
    Overwrite 'success' type,
    by default logic calls for Toast.show({ type: 'success' })
  */
  success: (props) => (
    <View style={toastStyles.container}>
      <CheckCircle size={24} color="#16a34a" />
      <View style={toastStyles.contentContainer}>
        <Text style={toastStyles.text1}>{props.text1}</Text>
        {props.text2 && <Text style={toastStyles.text2}>{props.text2}</Text>}
      </View>
    </View>
  ),

  /*
    Overwrite 'error' type,
    by default logic calls for Toast.show({ type: 'error' })
  */
  error: (props) => (
    <View style={toastStyles.container}>
      <XCircle size={24} color="#E50914" />
      <View style={toastStyles.contentContainer}>
        <Text style={toastStyles.text1}>{props.text1}</Text>
        {props.text2 && <Text style={toastStyles.text2}>{props.text2}</Text>}
      </View>
    </View>
  ),

  /*
    Overwrite 'info' type
  */
  info: (props) => (
    <View style={toastStyles.container}>
      <Info size={24} color="#3b82f6" />
      <View style={toastStyles.contentContainer}>
        <Text style={toastStyles.text1}>{props.text1}</Text>
        {props.text2 && <Text style={toastStyles.text2}>{props.text2}</Text>}
      </View>
    </View>
  ),

  /*
    Custom 'loading' type if we simply want to show a toast message
  */
  loading: (props) => (
    <View style={toastStyles.container}>
      <Info size={24} color="#eab308" />
      <View style={toastStyles.contentContainer}>
        <Text style={toastStyles.text1}>{props.text1 || "Đang xử lý..."}</Text>
        {props.text2 && <Text style={toastStyles.text2}>{props.text2}</Text>}
      </View>
    </View>
  ),
};
