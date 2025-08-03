import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import supabase from '../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function getCachedAnalysis(mealText) {
  const key = 'quicklog_cache_' + mealText.trim().toLowerCase();
  const cached = await AsyncStorage.getItem(key);
  return cached ? JSON.parse(cached) : null;
}
async function setCachedAnalysis(mealText, data) {
  const key = 'quicklog_cache_' + mealText.trim().toLowerCase();
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export default function QuickLogScreen({ navigation }) {
  const [mealText, setMealText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    if (!mealText.trim()) {
      Alert.alert('No meal entered', 'Please type your meal.');
      return;
    }
    setIsLoading(true);
    try {
      // Check cache first
      const cached = await getCachedAnalysis(mealText);
      if (cached) {
        setAnalysis(cached);
        navigation.navigate('PostCalorieScreen', { analysis: cached, mealName: '' });
        return;
      }
      // AI analysis
      const prompt = `Analyze the following meal: ${mealText}. Your response MUST be a valid JSON object and nothing else. Do not include markdown formatting. The JSON object should have the following structure: { "dish_name": "A concise and appealing name for the dish", "description": "A one-sentence savory description of the dish.", "total_nutrition": { "calories": <number>, "protein": <number>, "fat": <number>, "carbs": <number> }, "ingredients": [ { "name": "ingredient name", "calories": <number> } ] } Provide a reasonable estimate for a standard serving size.`;
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setAnalysis(data);
        await setCachedAnalysis(mealText, data);
        navigation.navigate('PostCalorieScreen', { analysis: data, mealName: '' });
      } else {
        throw new Error('Invalid JSON format from AI.');
      }
    } catch (error) {
      Alert.alert('AI Error', 'Could not analyze the meal. ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (!analysis) {
      Alert.alert('No analysis', 'Please analyze the meal first.');
      return;
    }
    try {
      // Save to Supabase (example table: meals)
      const { data, error } = await supabase.from('meals').insert([
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
      Alert.alert('Success', 'Meal saved!');
    } catch (e) {
      Alert.alert('Error', 'Failed to save meal.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Log</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          <Text style={{ color: '#888', fontSize: 15, marginBottom: 16 }}>Type your meal like a message, and Kalry will analyze it</Text>
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
          <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze} disabled={isLoading}>
            <Text style={styles.analyzeBtnText}>Analyze Meal</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logBtn} onPress={handleLogMeal} disabled={!analysis}>
            <Ionicons name="bookmark-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logBtnText}>Log Meal</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, paddingBottom: 8, paddingHorizontal: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#181A20', flex: 1, textAlign: 'center' },
  input: { backgroundColor: '#F6F6F8', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 18, fontSize: 16, color: '#222', minHeight: 90, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  analyzeBtn: { flex: 1, backgroundColor: '#6C63FF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginRight: 8 },
  analyzeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  logBtn: { flex: 1, backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginLeft: 8 },
  logBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
}); 