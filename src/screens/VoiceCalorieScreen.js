import { Ionicons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevels, setAudioLevels] = useState(Array.from({ length: 20 }, () => 0));
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Animation values for waveform
  const waveformAnimations = useRef(Array.from({ length: 20 }, () => new Animated.Value(0))).current;
  const dotAnimations = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
  const audioLevelInterval = useRef(null);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.unloadAsync();
        recordingRef.current = null;
      }
    };
  }, []);

  // Animation functions
  const startDotAnimation = () => {
    const animations = dotAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 800,
            delay: index * 150,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );
    });
    Animated.parallel(animations).start();
  };

  const startWaveformAnimation = () => {
    // Start real-time audio level simulation
    audioLevelInterval.current = setInterval(() => {
      // Create more dynamic and realistic audio levels
      const newLevels = audioLevels.map((_, index) => {
        // Create a wave-like pattern that moves across the bars
        const time = Date.now() * 0.005; // Time factor for wave movement
        const position = index / 19; // Position factor (0 to 1)
        
        // Base wave pattern
        const wave = Math.sin(time + position * Math.PI * 2) * 0.3;
        
        // Add some randomness for natural variation
        const random = (Math.random() - 0.5) * 0.4;
        
        // Combine wave and randomness, ensure it stays within bounds
        const level = Math.max(0.1, Math.min(1, 0.3 + wave + random));
        
        return level;
      });
      
      setAudioLevels(newLevels);
      
      // Animate each bar to its new level with different speeds
      newLevels.forEach((level, index) => {
        Animated.timing(waveformAnimations[index], {
          toValue: level,
          duration: 50 + Math.random() * 100, // Varying animation speeds
          useNativeDriver: false,
        }).start();
      });
    }, 80); // Update every 80ms for smoother animation
  };

  const stopAnimations = () => {
    // Clear the audio level interval
    if (audioLevelInterval.current) {
      clearInterval(audioLevelInterval.current);
      audioLevelInterval.current = null;
    }
    
    dotAnimations.forEach(anim => anim.stopAnimation());
    waveformAnimations.forEach(anim => anim.stopAnimation());
    dotAnimations.forEach(anim => anim.setValue(0));
    waveformAnimations.forEach(anim => anim.setValue(0));
    setAudioLevels(Array.from({ length: 20 }, () => 0));
  };

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
      
      // Start dot animation initially
      startDotAnimation();
      
      // Switch to waveform animation after 500ms
      setTimeout(() => {
        if (isRecording) {
          setIsSpeaking(true);
          stopAnimations();
          startWaveformAnimation();
        }
      }, 500);
    } catch (err) {
      Alert.alert("Recording Error", "Could not start recording.");
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsSpeaking(false);
    stopAnimations();
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
      // Try different models if one fails
      const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
      let lastError = null;
      
      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const audioData = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const prompt = `Analyze the food items in this audio. Your response MUST be a single valid JSON object and nothing else. Do not include markdown formatting like \`\`\`json.

IMPORTANT RULES:
1. If the audio does NOT contain any food items or is unclear, respond with: {"error": "No food items detected. Please speak clearly about what you ate."}
2. Extract quantities and food names from natural speech. For example:
   - "I had 2 breads and one omelette during breakfast" → extract "2 breads" and "1 omelette"
   - "I ate three apples and a sandwich" → extract "3 apples" and "1 sandwich"
   - "I had some rice with chicken" → extract "1 rice" and "1 chicken"
3. ALWAYS include quantities in the food names (e.g., "2 breads", "1 omelette", "3 apples")
4. If no specific quantity is mentioned, assume quantity of 1 (e.g., "1 sandwich", "1 rice")
5. Convert words to numbers: "one" → "1", "two" → "2", "three" → "3", etc.
6. Use CONSISTENT calorie values for similar foods:
   - "omelette", "mini omelette", "egg omelette" → use same calorie value (~90-120 calories per omelette)
   - "bread", "slice of bread", "bread slice" → use same calorie value (~80-100 calories per slice)
   - "apple", "red apple", "green apple" → use same calorie value (~80-100 calories per apple)
   - "rice", "white rice", "cooked rice" → use same calorie value (~200-250 calories per cup)
7. Provide realistic, consistent nutrition values based on standard serving sizes.

The JSON object must have this structure: 
{ "transcription": "The full text of what you heard", "items": [ { "name": "quantity + food item", "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number> } ], "total": { "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number> } }`;
          
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
            // Check for error response
            if (data.error) {
              throw new Error(data.error);
            }
            
            if (!data.total || !Array.isArray(data.items) || !data.transcription) {
              throw new Error("Invalid JSON structure from API.");
            }
            
            // Check if any food items were detected
            if (data.items.length === 0) {
              throw new Error("No food items detected. Please speak clearly about what you ate.");
            }
            setTranscribedText(data.transcription);
            setShowListening(false);
            setNutritionData({ ...data.total, items: data.items });
            
            // Create clean food name from extracted items (just quantities and food names)
            const cleanFoodName = data.items.map(item => item.name).join(", ");
            
            navigation.replace('VoicePostCalorieScreen', {
              analysis: {
                total: {
                  calories: data.total.calories,
                  protein: data.total.protein,
                  fat: data.total.fat,
                  carbs: data.total.carbs,
                  fiber: data.total.fiber || 0,
                },
                items: data.items,
              },
              cleanFoodName: cleanFoodName
            });
            return;
          } else {
            throw new Error("Invalid JSON format from API. No JSON object found.");
          }
        } catch (error) {
          lastError = error;
          console.log(`Model ${modelName} failed:`, error.message);
          // Continue to next model
        }
      }
      
      // If all models failed, show error
      throw lastError || new Error("All AI models are currently unavailable.");
    } catch (error) {
      let errorMessage = "Could not analyze the audio.";
      if (error.message.includes("503") || error.message.includes("overloaded")) {
        errorMessage = "AI service is temporarily overloaded. Please try again in a few moments.";
      } else if (error.message.includes("API key")) {
        errorMessage = "AI service configuration error. Please check your settings.";
      } else {
        errorMessage += " " + error.message;
      }
      Alert.alert("AI Error", errorMessage);
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
        {/* Top spacer for centering content */}
        <View style={styles.topSpacer} />
        
        {/* Results - stays in center when showing */}
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
        
        {/* Loading spinner - stays in center */}
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator
              size={50}
              color="#7B61FF"
              style={{ marginVertical: 16 }}
            />
          </View>
        )}
        
        {/* Audio Animation */}
        {isRecording && !isLoading && (
          <View style={styles.animationContainer}>
            {!isSpeaking ? (
              // Dot animation when not speaking
              <View style={styles.dotContainer}>
                {dotAnimations.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        opacity: anim,
                        transform: [{ 
                          scale: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1.5],
                          })
                        }],
                      },
                    ]}
                  />
                ))}
              </View>
            ) : (
              // Waveform animation when speaking
              <View style={styles.waveformContainer}>
                {waveformAnimations.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.waveformBar,
                      {
                        height: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [4, 60], // Increased max height for more dramatic effect
                        }),
                        backgroundColor: `hsl(${240 + index * 8}, 70%, 60%)`,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}
        
        {/* Instructions section at top */}
        <View style={styles.instructionsSection}>
          {!isRecording && !nutritionData && !isLoading && (
            <>
              <Text style={styles.instructions}>
                Speak naturally – Kalry listens & structures it
              </Text>
              <Text style={styles.sampleText}>
                Try: &quot;I had a chicken sandwich and a juice&quot;
              </Text>
            </>
          )}
          {isRecording && !nutritionData && !isLoading && (
            <>
              <Text style={styles.listeningText}>Listening...</Text>
              <Text style={styles.instructions}>
                Speak naturally – Kalry listens & structures it
              </Text>
              <Text style={styles.sampleText}>
                Try: &quot;I had a chicken sandwich and a juice&quot;
              </Text>
            </>
          )}
        </View>
        
        {/* Bottom section with mic button */}
        <View style={styles.bottomSection}>
          {/* Mic button */}
          {!isRecording && !nutritionData && !isLoading && (
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
          )}
          {/* Stop button */}
          {isRecording && !nutritionData && !isLoading && (
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
          )}
        </View>
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
  backButton: { marginRight: 12,marginTop: 20 },
  headerTitle: { flex: 1, fontSize: 22,marginTop: 20 , fontWeight: 'bold', color: '#7B61FF', textAlign: 'center' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 24, justifyContent: 'space-between', width: '100%' },
  topSpacer: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  instructionsSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  bottomSection: { 
    width: '100%', 
    alignItems: 'center', 
    paddingBottom: 40,
    paddingTop: 20
  },
  animationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7B61FF',
    marginHorizontal: 6,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 3,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#7B61FF',
  },
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