import { Ionicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import supabase from '../lib/supabase';
import { createFoodLog } from '../utils/api';

const PhotoCalorieScreen = ({ route, navigation }) => {
  const { photoUri, mealType } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedFoodName, setEditedFoodName] = useState('');
  
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
          First, determine if this image contains actual food items that can be eaten. 
          Look for:
          - Real food items (fruits, vegetables, cooked dishes, etc.)
          - NOT: billboards, signs, menus, food packaging, food advertisements, or text-only images
          - NOT: objects that look like food but are not edible
          - NOT: food-related items that are not actual food (utensils, plates without food, etc.)
          
          If the image does NOT contain actual edible food, respond with this exact JSON:
          {
            "is_food": false,
            "error_message": "This image does not contain actual food items. Please take a photo of real food that you want to log."
          }
          
          If the image contains actual edible food, analyze it and respond with this JSON structure:
          {
            "is_food": true,
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
          
          Your response MUST be a valid JSON object only. Do not include any text outside of the JSON object.
        `;

        const result = await model.generateContent([prompt, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }]);
        const response = await result.response;
        let text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            
            // Check if the image is not food
            if (data.is_food === false) {
                setShowErrorModal(true);
                setIsLoading(false);
                return;
            }
            
            // If it's food, set the analysis
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

  const handleEditFoodName = () => {
    setEditedFoodName(analysis.dish_name);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (editedFoodName.trim()) {
      setShowEditModal(false);
      setIsLoading(true);
      
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const imageBase64 = await FileSystem.readAsStringAsync(photoUri, { encoding: FileSystem.EncodingType.Base64 });
        
        const prompt = `
          Analyze this image for the specific food item: "${editedFoodName.trim()}"
          
          The user has corrected the food name to: "${editedFoodName.trim()}"
          Please provide accurate nutrition information for this specific food item.
          
          Your response MUST be a valid JSON object only. Do not include any text outside of the JSON object.
          
          The JSON object should have this structure:
          {
            "is_food": true,
            "dish_name": "${editedFoodName.trim()}",
            "description": "A one-sentence savory description of ${editedFoodName.trim()}.",
            "total_nutrition": {
              "calories": <accurate number for ${editedFoodName.trim()}>,
              "protein": <accurate number for ${editedFoodName.trim()}>,
              "fat": <accurate number for ${editedFoodName.trim()}>,
              "carbs": <accurate number for ${editedFoodName.trim()}>
            },
            "ingredients": [
              { "name": "ingredient name", "calories": <number> },
              { "name": "ingredient name", "calories": <number> }
            ]
          }
          
          Provide accurate nutrition values for a standard serving size of ${editedFoodName.trim()}.
        `;

        const result = await model.generateContent([prompt, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }]);
        const response = await result.response;
        let text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            
            // Update the analysis with new data
            setAnalysis(data);
        } else {
            throw new Error('Invalid JSON format from API.');
        }

      } catch (error) {
        console.error("Error re-analyzing image:", error);
        Alert.alert("AI Error", "Could not re-analyze the image with the new food name. Please try again.");
        // Fallback: just update the name without re-analyzing
        setAnalysis({
          ...analysis,
          dish_name: editedFoodName.trim()
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveToSavedMeals = async () => {
    if (!analysis) return;
    try {
        const { total_nutrition, dish_name, description } = analysis;
        const { data: { session } } = await supabase.auth.getSession();
        const user_id = session?.user?.id;
        if (!user_id) {
          Alert.alert('You must be logged in to save meals.');
          return;
        }
        
        const { error } = await supabase.from('saved_meal').insert([
          {
            user_id: user_id,
            dish_name: dish_name,
            description: description || '',
            calories: total_nutrition.calories || 0,
            protein: total_nutrition.protein || 0,
            carbs: total_nutrition.carbs || 0,
            fat: total_nutrition.fat || 0,
            fiber: 0, // Default value since we don't have fiber data
          },
        ]);
        
        if (error) throw error;
        Alert.alert('Saved!', 'Meal saved to your Saved Meals.', [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('SavedMealsScreen')
          }
        ]);
    } catch (error) {
        console.error('Error saving meal:', error);
        Alert.alert('Error', 'Failed to save meal. ' + error.message);
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
          <View style={styles.dishNameContainer}>
            <Text style={styles.dishName}>{dish_name}</Text>
            <TouchableOpacity onPress={handleEditFoodName} style={styles.editButton}>
              <Ionicons name="pencil" size={20} color="#7B61FF" />
            </TouchableOpacity>
          </View>

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
        <View style={styles.footer}>
        <TouchableOpacity onPress={handleSaveToSavedMeals} style={styles.saveButton}>
        <Ionicons name="bookmark-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleConfirm} style={styles.doneButton}>
        <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

     
      
      {/* Error Modal for Non-Food Images */}
      {showErrorModal && (
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModal}>
            <TouchableOpacity 
              style={styles.errorCloseButton}
              onPress={() => {
                setShowErrorModal(false);
                navigation.navigate('MainDashboard');
              }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={48} color="#ff6b6b" style={styles.errorIcon} />
              <Text style={styles.errorTitle}>Not a Food Item</Text>
              <Text style={styles.errorMessage}>
                This image does not contain actual food items. Please take a photo of real food that you want to log.
              </Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Edit Food Name Modal */}
      {showEditModal && (
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModal}>
            <TouchableOpacity 
              style={styles.errorCloseButton}
              onPress={() => setShowEditModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.errorContent}>
              <Ionicons name="restaurant" size={48} color="#7B61FF" style={styles.errorIcon} />
              <Text style={styles.errorTitle}>Edit Food Name</Text>
              <Text style={styles.errorMessage}>
                Correct the food name if the AI got it wrong. This helps improve future recognition.
              </Text>
              <TextInput
                style={styles.editInput}
                value={editedFoodName}
                onChangeText={setEditedFoodName}
                placeholder="Enter correct food name"
                placeholderTextColor="#999"
                autoFocus={true}
                multiline={false}
              />
              <TouchableOpacity onPress={handleSaveEdit} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  dishNameContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 20 
  },
  dishName: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginRight: 8 },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
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
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' ,gap: 10},
 
  doneButton: { 
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#22C55E', 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  doneButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  // Error Modal Styles
  errorModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  errorModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  errorCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  errorContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 16,
    width: '100%',
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#7B61FF',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

});

export default PhotoCalorieScreen;