import { Ionicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../lib/supabase';
import { createFoodLog } from '../utils/api';

const PhotoCalorieScreen = ({ route, navigation }) => {
  const { photoUri, mealType } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  useEffect(() => {
    if (photoUri) {
      handleImageToCalorie(photoUri);
    }
  }, [photoUri]);

  const handleImageToCalorie = async (uri) => {
    setIsLoading(true);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const imageBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        
        const prompt = `
          Analyze the food in this image. Your response MUST be a valid JSON object.
          Do not include any text outside of the JSON object.
          The JSON object should have the following structure:
          {
            "dish_name": "A concise and appealing name for the dish",
            "description": "A one-sentence savory description of the dish.",
            "total_nutrition": {
              "calories": <number>,
              "protein": <number>,
              "fat": <number>,
              "carbs": <number>
            },
            "ingredients": [
              { "name": "ingredient name", "calories": <number> },
              { "name": "ingredient name", "calories": <number> }
            ]
          }
          Provide a reasonable estimate for a standard serving size.
        `;

        const result = await model.generateContent([prompt, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }]);
        const response = await result.response;
        let text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            setAnalysis(data);
        } else {
            throw new Error('Invalid JSON format from API.');
        }

    } catch (error) {
        console.error("Error analyzing image:", error);
        Alert.alert("AI Error", "Could not analyze the image. Please try again.");
        navigation.goBack();
    } finally {
        setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!analysis) return;
    try {
        const { total_nutrition, dish_name } = analysis;
        const { data: { session } } = await supabase.auth.getSession();
        const user_id = session?.user?.id;
        if (!user_id) {
          Alert.alert('You must be logged in to log food.');
          return;
        }
        const logData = {
            meal_type: mealType,
            food_name: dish_name,
            calories: total_nutrition.calories,
            protein: total_nutrition.protein,
            carbs: total_nutrition.carbs,
            fat: total_nutrition.fat,
            user_id,
        };
        await createFoodLog(logData);
        Alert.alert('Success', 'Food logged successfully!');
        navigation.navigate('Home'); 
    } catch (error) {
        console.error('Error logging food:', error);
        Alert.alert('Error', 'Failed to log food. ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={50} color="#7B61FF" />
          <Text style={styles.loadingText}>Analyzing your food...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Could not analyze the image.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const { dish_name, description, total_nutrition, ingredients } = analysis;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image source={{ uri: photoUri }} style={styles.image} />
        
        <View style={styles.contentContainer}>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.dishName}>{dish_name}</Text>

          <View style={styles.nutritionGrid}>
            <NutritionCard icon="flame-outline" label="Calories" value={`${total_nutrition.calories.toFixed(0)} kcal`} />
            <NutritionCard icon="fish-outline" label="Protein" value={`${total_nutrition.protein.toFixed(1)} g`} />
            <NutritionCard icon="leaf-outline" label="Fats" value={`${total_nutrition.fat.toFixed(1)} g`} />
            <NutritionCard icon="pizza-outline" label="Carbs" value={`${total_nutrition.carbs.toFixed(1)} g`} />
          </View>
          
          <Text style={styles.ingredientsTitle}>Ingredients found</Text>
          <View style={styles.ingredientsList}>
            {ingredients.map((item, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Ionicons name="checkmark-circle" size={18} color="#28a745" style={{marginRight: 6}}/>
                <Text style={styles.ingredientName}>{item.name}</Text>
                <Text style={styles.ingredientCalories}>{item.calories.toFixed(0)} kcal</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleConfirm} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const NutritionCard = ({ icon, label, value }) => (
  <View style={styles.nutritionCard}>
    <View style={styles.nutritionCardHeader}>
      <Ionicons name={icon} size={20} color="#888" />
       <TouchableOpacity>
         <Ionicons name="pencil-outline" size={16} color="#aaa" />
      </TouchableOpacity>
    </View>
    <Text style={styles.nutritionLabel}>{label}</Text>
    <Text style={styles.nutritionValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  image: { width: '100%', height: 300 },
  contentContainer: { padding: 20 },
  description: { fontSize: 16, color: '#666', marginBottom: 8, textAlign: 'center' },
  dishName: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  nutritionCard: { 
    width: '48%', 
    backgroundColor: '#f8f9fa', 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 10
  },
  nutritionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nutritionLabel: { fontSize: 14, color: '#666' },
  nutritionValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  ingredientsTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  ingredientsList: {},
  ingredientItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 8 },
  ingredientName: { flex: 1, fontSize: 16 },
  ingredientCalories: { fontSize: 16, color: '#666' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  doneButton: { backgroundColor: '#7B61FF', padding: 15, borderRadius: 12, alignItems: 'center' },
  doneButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default PhotoCalorieScreen;