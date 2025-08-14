import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import supabase from '../lib/supabase';

const VoicePostCalorieScreen = ({ route, navigation }) => {
  const { analysis, mealName, cleanFoodName } = route.params || {};
  const [macros, setMacros] = useState({
    protein: analysis?.total?.protein || 0,
    carbs: analysis?.total?.carbs || 0,
    fat: analysis?.total?.fat || 0,
    fiber: analysis?.total?.fiber || 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [mealNameState, setMealNameState] = useState(cleanFoodName || mealName || '');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [logging, setLogging] = useState(false);

  // Update macros when analysis data changes
  useEffect(() => {
    if (analysis?.total) {
      setMacros({
        protein: analysis.total.protein || 0,
        carbs: analysis.total.carbs || 0,
        fat: analysis.total.fat || 0,
        fiber: analysis.total.fiber || 0,
      });
    }
  }, [analysis]);

  // Example health score and info
  const healthScore = 8.5;
  const healthText = 'Good';
  const infoText = 'High in potassium, low fat';

  // Block back navigation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; // Block hardware back
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [])
  );

  const handleMacroChange = (key, value) => {
    setMacros({ ...macros, [key]: value });
  };

  const validateMealName = () => {
    if (!mealNameState || mealNameState.trim().length < 2) {
      setNameError('Meal name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateMealName()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      const { calories } = analysis?.total || {};
      const { protein, carbs, fat, fiber } = macros;
      const { error } = await supabase.from('saved_meal').insert([
        {
          user_id: user.id,
          dish_name: mealNameState,
          description: `Voice logged: ${mealNameState}`,
          calories: calories || 0,
          protein: protein || 0,
          carbs: carbs || 0,
          fat: fat || 0,
          fiber: fiber || 0,
        },
      ]);
      if (error) throw error;
      Alert.alert('Saved!', 'Meal saved to your Saved Meals.', [
        { text: 'OK', onPress: () => navigation.navigate('SavedMealsScreen') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDone = async () => {
    if (!validateMealName()) return;
    setLogging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      const { calories } = analysis?.total || {};
      const { protein, carbs, fat, fiber } = macros;
      
      const logData = {
        user_id: user.id,
        food_name: mealNameState,
        serving_size: 1,
        calories: calories || 0,
        carbs: carbs || 0,
        protein: protein || 0,
        fat: fat || 0,
        fiber: fiber || 0,
        date_time: new Date().toISOString().split('T')[0],
        meal_type: 'Voice Log',
        notes: '',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('user_food_logs').insert([logData]);
      if (error) throw error;
      
      Alert.alert('Success!', 'Food logged successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLogging(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#7B61FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Food Log</Text>
        <TouchableOpacity style={styles.editButton} onPress={toggleEdit}>
          <Ionicons name={isEditing ? "checkmark" : "pencil"} size={24} color="#7B61FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Food Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Name</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              value={mealNameState}
              onChangeText={setMealNameState}
              placeholder="Enter food name"
              autoFocus
            />
          ) : (
            <Text style={styles.foodName}>{mealNameState}</Text>
          )}
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>

        {/* Nutrition Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Summary</Text>
          <View style={styles.nutritionCard}>
            <View style={styles.calorieSection}>
              <Text style={styles.calorieValue}>{analysis?.total?.calories || 0}</Text>
              <Text style={styles.calorieLabel}>kcal</Text>
            </View>
            <View style={styles.macrosGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{analysis?.total?.protein || 0}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{analysis?.total?.carbs || 0}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{analysis?.total?.fat || 0}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{analysis?.total?.fiber || 0}g</Text>
                <Text style={styles.macroLabel}>Fiber</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Score</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthScoreContainer}>
              <Text style={styles.healthScore}>{healthScore}</Text>
              <Text style={styles.healthText}>{healthText}</Text>
            </View>
            <Text style={styles.infoText}>{infoText}</Text>
          </View>
        </View>

        {/* Food Items Breakdown */}
        {analysis?.items && analysis.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Food Items</Text>
            {analysis.items.map((item, index) => (
              <View key={index} style={styles.foodItem}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCalories}>{item.calories} kcal</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save to Meals'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneButton} onPress={handleDone} disabled={logging}>
          <Text style={styles.doneButtonText}>{logging ? 'Logging...' : 'Log Food'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 18, 
    paddingTop: 32, 
    paddingBottom: 18, 
    borderBottomWidth: 1, 
    borderColor: '#eee', 
    backgroundColor: '#F3F0FF' 
  },
  backButton: { marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: 'bold', color: '#7B61FF', textAlign: 'center' },
  editButton: { marginLeft: 12 },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 24, paddingVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16,
    backgroundColor: '#f9f9f9'
  },
  inputError: { borderColor: '#ff6b6b' },
  errorText: { color: '#ff6b6b', fontSize: 12, marginTop: 4 },
  foodName: { fontSize: 20, fontWeight: '600', color: '#333' },
  nutritionCard: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 12, 
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  calorieSection: { alignItems: 'center', marginBottom: 16 },
  calorieValue: { fontSize: 32, fontWeight: 'bold', color: '#7B61FF' },
  calorieLabel: { fontSize: 16, color: '#666', marginTop: 4 },
  macrosGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  macroItem: { alignItems: 'center', flex: 1, minWidth: 60 },
  macroValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  macroLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  healthCard: { 
    backgroundColor: '#e8f5e8', 
    borderRadius: 12, 
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4edda'
  },
  healthScoreContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  healthScore: { fontSize: 24, fontWeight: 'bold', color: '#28a745', marginRight: 8 },
  healthText: { fontSize: 16, color: '#28a745', fontWeight: '600' },
  infoText: { fontSize: 14, color: '#666' },
  foodItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  itemName: { fontSize: 16, color: '#333', flex: 1 },
  itemCalories: { fontSize: 14, color: '#666', fontWeight: '600' },
  footer: { 
    paddingHorizontal: 24, 
    paddingVertical: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#eee',
    backgroundColor: '#fff'
  },
  saveButton: { 
    backgroundColor: '#28a745', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center',
    marginBottom: 12
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  doneButton: { 
    backgroundColor: '#7B61FF', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center'
  },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default VoicePostCalorieScreen; 