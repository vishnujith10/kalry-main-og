import { Ionicons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import supabase from "../lib/supabase";
import { createFoodLog } from "../utils/api";

const VoiceCalorieScreen = ({ navigation, route }) => {
  const { mealType = "Quick Log", selectedDate } = route.params || {};
  const recordingRef = useRef(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nutritionData, setNutritionData] = useState(null);
  const [transcribedText, setTranscribedText] = useState("");
  const [showListening, setShowListening] = useState(false);
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.unloadAsync();
        recordingRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (permissionResponse.status !== "granted") await requestPermission();
      if (recordingRef.current) {
        await recordingRef.current.unloadAsync();
        recordingRef.current = null;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setShowListening(true);
      setNutritionData(null);
      setTranscribedText("");
    } catch (err) {
      Alert.alert("Recording Error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (uri) handleVoiceToCalorie(uri);
    } catch (error) {
      // ignore
    }
  };

  const handleVoiceToCalorie = async (uri) => {
    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const audioData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const prompt = `Analyze the food items in this audio. Your response MUST be a single valid JSON object and nothing else. Do not include markdown formatting like \`\`\`json. The JSON object must have this structure: { "transcription": "The full text of what you heard", "items": [ { "name": "food item", "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number> } ], "total": { "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number> } }`;
      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: "audio/mp4", data: audioData } },
      ]);
      const response = await result.response;
      let text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        const data = JSON.parse(jsonString);
        if (!data.total || !Array.isArray(data.items) || !data.transcription) {
          throw new Error("Invalid JSON structure from API.");
        }
        setTranscribedText(data.transcription);
        setShowListening(false);
        setNutritionData({ ...data.total, items: data.items });
        navigation.replace('PostCalorieScreen', {
          analysis: {
            dish_name: 'Voice Meal',
            total_nutrition: {
              calories: data.total.calories,
              protein: data.total.protein,
              fat: data.total.fat,
              carbs: data.total.carbs,
              fiber: 0,
            },
            ingredients: data.items,
          }
        });
        return;
      } else {
        throw new Error("Invalid JSON format from API. No JSON object found.");
      }
    } catch (error) {
      Alert.alert("AI Error", "Could not analyze the audio. " + error.message);
      setShowListening(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLog = async () => {
    if (!nutritionData) return;
    try {
      const logData = {
        meal_type: mealType,
        food_name: nutritionData.items.map((i) => i.name).join(", "),
        calories: nutritionData.calories,
        protein: nutritionData.protein,
        carbs: nutritionData.carbs,
        fat: nutritionData.fat,
        date: selectedDate || new Date().toISOString().slice(0, 10),
        user_id: null,
      };
      const {
        data: { session },
      } = await supabase.auth.getSession();
      logData.user_id = session?.user?.id;
      if (!logData.user_id) {
        Alert.alert("You must be logged in to log food.");
        return;
      }
      await createFoodLog(logData);
      Alert.alert("Success", "Food logged successfully!", [
        { text: "OK", onPress: () => navigation.navigate("Home") },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to log food. " + error.message);
    }
  };

  // UI rendering logic
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#7B61FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Logging</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.content}>
        {/* Mic and instructions */}
        {!isRecording && !nutritionData && !isLoading && (
          <>
            <TouchableOpacity
              onPress={startRecording}
              style={styles.gradientMicWrap}
            >
              <LinearGradient
                colors={["#7B61FF", "#43E0FF"]}
                style={styles.gradientMic}
              >
                <Ionicons name="mic" size={44} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.instructions}>
              Speak naturally – Kalry listens & structures it
            </Text>
            <Text style={styles.sampleText}>
              Try: "I had a chicken sandwich and a juice"
            </Text>
          </>
        )}
        {/* Listening state */}
        {isRecording && !nutritionData && !isLoading && (
          <>
            <TouchableOpacity
              onPress={stopRecording}
              style={styles.gradientMicWrap}
            >
              <LinearGradient
                colors={["#7B61FF", "#43E0FF"]}
                style={styles.gradientMic}
              >
                <Ionicons name="stop" size={44} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.listeningText}>Listening...</Text>
            <Text style={styles.instructions}>
              Speak naturally – Kalry listens & structures it
            </Text>
            <Text style={styles.sampleText}>
              Try: "I had a chicken sandwich and a juice"
            </Text>
          </>
        )}
        {/* Loading spinner */}
        {isLoading && (
          <ActivityIndicator
            size={50}
            color="#7B61FF"
            style={{ marginVertical: 16 }}
          />
        )}
        {/* Results */}
        {nutritionData && !isLoading && (
          <View style={styles.resultContainer}>
            <Text style={styles.transcribedText}>{transcribedText}</Text>
            <View style={styles.foodListContainer}>
              {nutritionData.items.map((item, idx) => (
                <View key={idx} style={styles.foodItemRow}>
                  <Ionicons
                    name="fast-food-outline"
                    size={22}
                    color="#7B61FF"
                    style={{ marginRight: 8 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodItemName}>{item.name}</Text>
                    <Text style={styles.foodItemKcal}>
                      {item.calories} kcal
                    </Text>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="pencil-outline" size={20} color="#888" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.suggestedMealRow}>
              <Text style={styles.suggestedMealLabel}>Suggested Meal</Text>
              <TouchableOpacity>
                <Text style={styles.suggestedMealValue}>{mealType}</Text>
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color="#888"
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Time</Text>
              <TouchableOpacity>
                <Text style={styles.timeValue}>
                  {selectedDate
                    ? new Date(selectedDate).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </Text>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color="#888"
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.editFoodsBtn}>
              <Text style={styles.editFoodsBtnText}>Edit Foods</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setNutritionData(null);
                setTranscribedText("");
              }}
            >
              <Ionicons
                name="refresh"
                size={18}
                color="#7B61FF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.retryBtnText}>Retry Voice Input</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Fixed footer for action buttons */}
      {nutritionData && !isLoading && (
        <View style={styles.footerActionRow}>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmLog}>
            <Text style={styles.confirmBtnText}>Confirm & Log</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 32, paddingBottom: 18, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#F3F0FF' },
  backButton: { marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: 'bold', color: '#7B61FF', textAlign: 'center' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 32, width: '100%' },
  gradientMicWrap: {
    marginVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientMic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  instructions: {
    color: "#888",
    marginTop: 8,
    fontSize: 15,
    textAlign: "center",
  },
  sampleText: {
    color: "#bbb",
    marginTop: 2,
    fontSize: 13,
    textAlign: "center",
  },
  listeningText: {
    color: "#7B61FF",
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 18,
    textAlign: "center",
  },
  resultContainer: { width: "100%", marginTop: 10, alignItems: "center" },
  transcribedText: {
    color: "#222",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  foodListContainer: { width: "100%", marginBottom: 16 },
  foodItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  foodItemName: { fontSize: 15, fontWeight: "600", color: "#222" },
  foodItemKcal: { fontSize: 13, color: "#888" },
  suggestedMealRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  suggestedMealLabel: { color: "#888", fontSize: 14 },
  suggestedMealValue: { color: "#222", fontWeight: "600", fontSize: 15 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  timeLabel: { color: "#888", fontSize: 14 },
  timeValue: { color: "#222", fontWeight: "600", fontSize: 15 },
  editFoodsBtn: {
    backgroundColor: "#F3F0FF",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
  },
  editFoodsBtnText: { color: "#7B61FF", fontWeight: "bold", fontSize: 15 },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  retryBtnText: { color: "#7B61FF", fontWeight: "bold", fontSize: 15 },
  footerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 18,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    position: 'absolute',
    bottom: 20,
    left: 0,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: "linear-gradient(90deg, #7B61FF 0%, #43E0FF 100%)",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginRight: 8,
  },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  cancelBtnText: { color: "#7B61FF", fontWeight: "bold", fontSize: 16 },
});

export default VoiceCalorieScreen;