import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, BackHandler, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import supabase from '../lib/supabase';

const PostCalorieScreen = ({ route, navigation }) => {
  const { analysis, mealName } = route.params || {};
  const [macros, setMacros] = useState({
    protein: analysis?.total_nutrition?.protein || 0,
    carbs: analysis?.total_nutrition?.carbs || 0,
    fat: analysis?.total_nutrition?.fat || 0,
    fiber: analysis?.total_nutrition?.fiber || 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [mealNameState, setMealNameState] = useState(analysis?.dish_name || mealName || '');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

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
      const { calories } = analysis?.total_nutrition || {};
      const { protein, carbs, fat, fiber } = macros;
      const { description } = analysis || {};
      const { error } = await supabase.from('saved_meal').insert([
        {
          user_id: user.id,
          dish_name: mealNameState,
          description: description || '',
          calories: calories || 0,
          protein: protein || 0,
          carbs: carbs || 0,
          fat: fat || 0,
          fiber: fiber || 0,
        },
      ]);
      if (error) throw error;
      Alert.alert('Saved!', 'Meal saved to your Saved Meals.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDone = async () => {
    if (!validateMealName()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      const { calories } = analysis?.total_nutrition || {};
      const { protein, carbs, fat, fiber } = macros;
      // Clean up the food name by removing "You said: " prefix if present
      const cleanFoodName = mealNameState.replace(/^You said:\s*/i, '');
      
      const logData = {
        user_id: user.id,
        food_name: cleanFoodName,
        serving_size: 1,
        calories: calories || 0,
        carbs: carbs || 0,
        protein: protein || 0,
        fat: fat || 0,
        fiber: fiber || 0,
        date_time: new Date().toISOString().split('T')[0],
        meal_type: 'Quick Log',
        notes: '',
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('user_food_logs').insert([logData]);
      if (error) throw error;
      Alert.alert('Success', 'Food logged successfully!');
      navigation.navigate('Home');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Remove the app bar back button */}
        {/* <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity> */}
        <Text style={styles.title}>Food Details</Text>
        <View style={styles.iconWrap}>
          <Ionicons name="nutrition-outline" size={48} color="#F7B801" />
        </View>
        <TextInput
          style={[styles.foodName, nameError ? { borderColor: 'red', borderWidth: 1 } : {}]}
          value={mealNameState}
          onChangeText={text => {
            setMealNameState(text);
            if (text.trim().length >= 2) setNameError('');
          }}
          placeholder="Meal name"
          placeholderTextColor="#aaa"
          maxLength={40}
          textAlign="center"
          editable={isEditing}
        />
        {nameError ? <Text style={{ color: 'red', marginBottom: 8 }}>{nameError}</Text> : null}
        <Text style={styles.kcalText}>{analysis?.total_nutrition?.calories || 0} kcal</Text>
        {/* Macros */}
        <View style={styles.macrosGrid}>
          <View style={[styles.macroCard, { backgroundColor: '#F3F6FF' }]}> 
            <Text style={styles.macroLabel}>Protein</Text>
            {isEditing ? (
              <TextInput style={styles.macroValueInput} keyboardType="numeric" value={String(macros.protein)} onChangeText={v => handleMacroChange('protein', v)} />
            ) : (
              <Text style={styles.macroValue}>{macros.protein}g</Text>
            )}
          </View>
          <View style={[styles.macroCard, { backgroundColor: '#FFFDEB' }]}> 
            <Text style={styles.macroLabel}>Carbs</Text>
            {isEditing ? (
              <TextInput style={styles.macroValueInput} keyboardType="numeric" value={String(macros.carbs)} onChangeText={v => handleMacroChange('carbs', v)} />
            ) : (
              <Text style={styles.macroValue}>{macros.carbs}g</Text>
            )}
          </View>
          <View style={[styles.macroCard, { backgroundColor: '#F3FFF6' }]}> 
            <Text style={styles.macroLabel}>Fats</Text>
            {isEditing ? (
              <TextInput style={styles.macroValueInput} keyboardType="numeric" value={String(macros.fat)} onChangeText={v => handleMacroChange('fat', v)} />
            ) : (
              <Text style={styles.macroValue}>{macros.fat}g</Text>
            )}
          </View>
          <View style={[styles.macroCard, { backgroundColor: '#F8F3FF' }]}> 
            <Text style={styles.macroLabel}>Fiber</Text>
            {isEditing ? (
              <TextInput style={styles.macroValueInput} keyboardType="numeric" value={String(macros.fiber)} onChangeText={v => handleMacroChange('fiber', v)} />
            ) : (
              <Text style={styles.macroValue}>{macros.fiber}g</Text>
            )}
          </View>
        </View>
        {/* Health Score */}
        <View style={styles.healthScoreCard}>
          <Text style={styles.healthScoreValue}>{healthScore}</Text>
          <Text style={styles.healthScoreLabel}>Health Score</Text>
          <Text style={styles.healthScoreStatus}><Text style={{ color: '#22C55E', fontWeight: 'bold' }}>●</Text> {healthText}</Text>
        </View>
        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color="#666" style={{ marginRight: 6 }} />
          <Text style={styles.infoText}>{infoText}</Text>
        </View>
        {/* Edit, Save, Done Buttons */}
        <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(!isEditing)}>
          <Ionicons name="pencil-outline" size={18} color="#222" style={{ marginRight: 8 }} />
          <Text style={styles.editBtnText}>{isEditing ? 'Save Result' : 'Edit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Ionicons name="bookmark-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone} disabled={saving}>
          <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.doneBtnText}>{saving ? 'Logging...' : 'Log Food'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 24 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  iconWrap: { marginBottom: 12 },
  foodName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#ccc' },
  kcalText: { fontSize: 18, color: '#666', marginBottom: 4 },
  servingDesc: { fontSize: 14, color: '#888', marginBottom: 16 },
  servingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  servingLabel: { fontSize: 16, color: '#222', marginRight: 12 },
  servingControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8, paddingHorizontal: 8 },
  servingBtn: { padding: 8 },
  servingBtnText: { fontSize: 20, color: '#222' },
  servingCount: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 8 },
  servingDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8, padding: 12, marginBottom: 16 },
  servingDropdownText: { fontSize: 16, color: '#222', marginRight: 8 },
  macrosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16, width: '100%' },
  macroCard: { width: '48%', borderRadius: 12, padding: 16, marginBottom: 12 },
  macroLabel: { fontSize: 14, color: '#888', marginBottom: 4 },
  macroValue: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  macroValueInput: { fontSize: 20, fontWeight: 'bold', color: '#222', borderBottomWidth: 1, borderColor: '#7B61FF', padding: 0, margin: 0 },
  healthScoreCard: { backgroundColor: '#F3FFF6', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, width: '100%' },
  healthScoreValue: { fontSize: 24, fontWeight: 'bold', color: '#22C55E' },
  healthScoreLabel: { fontSize: 14, color: '#888', marginTop: 4 },
  healthScoreStatus: { fontSize: 16, marginTop: 4 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8, padding: 12, marginBottom: 16, width: '100%' },
  infoText: { fontSize: 15, color: '#444' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8, padding: 14, marginBottom: 12, width: '100%', justifyContent: 'center' },
  editBtnText: { fontSize: 16, color: '#222', fontWeight: 'bold' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7B61FF', borderRadius: 8, padding: 14, marginBottom: 12, width: '100%', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E', borderRadius: 8, padding: 16, width: '100%', justifyContent: 'center' },
  doneBtnText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
});

export default PostCalorieScreen; 