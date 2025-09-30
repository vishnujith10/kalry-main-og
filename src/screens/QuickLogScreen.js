import { Ionicons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import supabase from "../lib/supabase";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function getCachedAnalysis(mealText) {
  const key = "quicklog_cache_" + mealText.trim().toLowerCase();
  const cached = await AsyncStorage.getItem(key);
  return cached ? JSON.parse(cached) : null;
}
async function setCachedAnalysis(mealText, data) {
  const key = "quicklog_cache_" + mealText.trim().toLowerCase();
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export default function QuickLogScreen({ navigation }) {
  const [mealText, setMealText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    if (!mealText.trim()) {
      Alert.alert("No meal entered", "Please type your meal.");
      return;
    }
    setIsLoading(true);
    try {
      // Check cache first
      const cached = await getCachedAnalysis(mealText);
      if (cached) {
        console.log("QuickLogScreen - Using cached analysis:", cached);
        setAnalysis(cached);
        navigation.navigate("PostCalorieScreen", {
          analysis: cached,
          mealName: "",
        });
        return;
      }

      console.log("QuickLogScreen - Analyzing meal text:", mealText);

      // Use fewer models for faster performance - start with the most reliable one
      const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
      let lastError = null;

      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });

          // Use the exact same prompt structure as VoiceCalorieScreen
          const prompt = `Analyze the following meal text: "${mealText}". Your response MUST be a single valid JSON object and nothing else. Do not include markdown formatting like \`\`\`json.

IMPORTANT RULES:
1. If the text does NOT contain any food items or is unclear, respond with: {"error": "No food items detected. Please enter a valid meal."}
2. CRITICAL: ALWAYS preserve the EXACT quantities mentioned in the text (e.g., "200g black beans" → "200g black beans", NOT "1 black beans")
3. Extract ONLY the essential food name and quantity. REMOVE unnecessary words like:
   - "plate of", "bowl of", "cup of", "piece of", "slice of"
   - "some", "a bit of", "portion of"
   - "with", "and", "plus", "along with"
   - "during", "for", "at", "in"
   - Any descriptive words that aren't part of the food name

4. Examples of correct extraction:
   - "200g of black beans" → extract "200g black beans"
   - "2 slices of bread" → extract "2 bread"
   - "1 bowl of rice with chicken" → extract "1 rice" and "1 chicken"
   - "some apples and a sandwich" → extract "1 apple" and "1 sandwich"
   - "3 pieces of pizza" → extract "3 pizza"

5. CRITICAL: ALWAYS preserve EXACT quantities and units mentioned:
   - "200 grams of black beans" → "200g black beans" (NOT "1 black beans")
   - "150g chicken" → "150g chicken" (NOT "1 chicken")
   - "1 cup rice" → "1 cup rice" (NOT "1 rice")
   - "2 slices bread" → "2 bread" (NOT "1 bread")
   - "500ml juice" → "500ml juice" (NOT "1 juice")

6. If no specific quantity is mentioned, assume quantity of 1 (e.g., "1 sandwich", "1 rice")
7. Convert words to numbers: "one" → "1", "two" → "2", "three" → "3", etc.
8. Convert units: "grams" → "g", "milliliters" → "ml", "cups" → "cup", "slices" → "slice"
9. Use CONSISTENT calorie values for similar foods:
   - "omelette", "mini omelette", "egg omelette" → use same calorie value (~90-120 calories per omelette)
   - "bread", "slice of bread", "bread slice" → use same calorie value (~80-100 calories per slice)
   - "apple", "red apple", "green apple" → use same calorie value (~80-100 calories per apple)
   - "rice", "white rice", "cooked rice" → use same calorie value (~200-250 calories per cup)
   - "biryani", "chicken biryani", "vegetable biryani" → use same calorie value (~300-400 calories per serving)
   - "black beans", "beans", "kidney beans" → use same calorie value (~120-150 calories per 100g)
9. CRITICAL: Calculate nutrition values based on the ACTUAL quantities mentioned, not standard serving sizes
10. IMPORTANT: Provide realistic fiber values based on the food type:
    - Fruits and vegetables: 2-8g fiber per serving
    - Whole grains and breads: 2-4g fiber per serving  
    - Legumes and beans: 5-15g fiber per serving
    - Nuts and seeds: 2-6g fiber per serving
    - Processed foods: 0-2g fiber per serving

The JSON object must have this structure: 
{ "transcription": "The meal text you analyzed", "items": [ { "name": "quantity + food item", "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "fiber": <number> } ], "total": { "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "fiber": <number> } }`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          let text = response.text();
          console.log("QuickLogScreen - AI raw response:", text);

          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonString = jsonMatch[0];
            const data = JSON.parse(jsonString);

            // Check for error response
            if (data.error) {
              throw new Error(data.error);
            }

            if (
              !data.total ||
              !Array.isArray(data.items) ||
              !data.transcription
            ) {
              throw new Error("Invalid JSON structure from API.");
            }

            // Check if any food items were detected
            if (data.items.length === 0) {
              throw new Error(
                "No food items detected. Please enter a valid meal."
              );
            }

            console.log("QuickLogScreen - Parsed analysis data:", data);
            console.log("QuickLogScreen - Items:", data.items);
            console.log("QuickLogScreen - Total nutrition:", data.total);

            // Convert to the same format as VoiceCalorieScreen for PostCalorieScreen
            const analysisData = {
              dish_name: data.items.map((item) => item.name).join(", "),
              description: `A meal containing ${data.items
                .map((item) => item.name)
                .join(", ")}`,
              total_nutrition: {
                calories: data.total.calories,
                protein: data.total.protein,
                fat: data.total.fat,
                carbs: data.total.carbs,
                fiber: data.total.fiber || 0,
              },
              ingredients: data.items.map((item) => ({
                name: item.name,
                calories: item.calories,
              })),
            };

            console.log(
              "QuickLogScreen - Converted analysis data:",
              analysisData
            );

            setAnalysis(analysisData);
            await setCachedAnalysis(mealText, analysisData);
            navigation.navigate("PostCalorieScreen", {
              analysis: analysisData,
              mealName: "",
            });
            return; // Success, exit the loop
          } else {
            throw new Error(
              "Invalid JSON format from API. No JSON object found."
            );
          }
        } catch (error) {
          lastError = error;
          console.log(
            `QuickLogScreen - Model ${modelName} failed:`,
            error.message
          );
          // Continue to next model
        }
      }

      // If all models failed, show error
      throw lastError || new Error("All AI models are currently unavailable.");
    } catch (error) {
      console.error("QuickLogScreen - Analysis error:", error);
      let errorMessage = "Could not analyze the meal.";
      if (
        error.message.includes("503") ||
        error.message.includes("overloaded")
      ) {
        errorMessage =
          "AI service is temporarily overloaded. Please try again in a few moments.";
      } else if (error.message.includes("API key")) {
        errorMessage =
          "AI service configuration error. Please check your settings.";
      } else {
        errorMessage += " " + error.message;
      }
      Alert.alert("AI Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (!analysis) {
      Alert.alert("No analysis", "Please analyze the meal first.");
      return;
    }
    try {
      // Save to Supabase (example table: meals)
      const { data, error } = await supabase.from("meals").insert([
        {
          dish_name: analysis.dish_name,
          description: analysis.description,
          calories: analysis.total_nutrition.calories,
          protein: analysis.total_nutrition.protein,
          fat: analysis.total_nutrition.fat,
          carbs: analysis.total_nutrition.carbs,
          ingredients: analysis.ingredients,
        },
      ]);
      if (error) throw error;
      Alert.alert("Success", "Meal saved!");
    } catch (e) {
      Alert.alert("Error", "Failed to save meal.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 8 }}
          >
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Log</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          <Text style={{ color: "#888", fontSize: 15, marginBottom: 16 }}>
            Type your meal like a message, and Kalry will analyze it
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2 eggs, 1 banana, 1 cup cooked rice, 1 spoon ghee"
            placeholderTextColor="#B0B0B0"
            value={mealText}
            onChangeText={setMealText}
            multiline
          />
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.analyzeBtn}
            onPress={handleAnalyze}
            disabled={isLoading}
          >
            <Text style={styles.analyzeBtnText}>Analyze Meal</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.logBtn} onPress={handleLogMeal} disabled={!analysis}>
            <Ionicons name="bookmark-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logBtnText}>Log Meal</Text>
          </TouchableOpacity> */}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 8,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#181A20",
    flex: 1,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F6F6F8",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 16,
    color: "#222",
    minHeight: 90,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  analyzeBtn: {
    backgroundColor: "#6C63FF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    minWidth: 350,
  },
  analyzeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  logBtn: {
    flex: 1,
    backgroundColor: "#3B82F6",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginLeft: 8,
  },
  logBtnText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});
