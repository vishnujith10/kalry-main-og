import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, BackHandler, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../lib/supabase';

const VoicePostCalorieScreen = ({ route, navigation }) => {
  const { analysis, mealName, cleanFoodName } = route.params || {};
  
  // Add safety checks for route params
  if (!route.params) {
    console.log('No route params found, using defaults');
  }
  
  console.log('VoicePostCalorieScreen - Route params:', route.params);
  console.log('VoicePostCalorieScreen - Analysis:', analysis);
  console.log('VoicePostCalorieScreen - Meal name:', mealName);
  console.log('VoicePostCalorieScreen - Clean food name:', cleanFoodName);
  
  const [macros, setMacros] = useState({
    protein: analysis?.total?.protein || 0,
    carbs: analysis?.total?.carbs || 0,
    fat: analysis?.total?.fat || 0,
    fiber: analysis?.total?.fiber || 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [mealNameState, setMealNameState] = useState(cleanFoodName || analysis?.dish_name || mealName || '');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  // Calculate dynamic health score based on food data and user profile
  const calculateHealthScore = () => {
    const { calories, protein, carbs, fat, fiber } = analysis?.total || {};
    
    if (!calories || calories === 0) return { score: 0, text: 'No Data', info: 'No nutritional data available' };
    
    let score = 5; // Base score
    
    // Protein balance (ideal: 20-30% of calories)
    const proteinCalories = protein * 4;
    const proteinPercentage = (proteinCalories / calories) * 100;
    if (proteinPercentage >= 20 && proteinPercentage <= 30) score += 2;
    else if (proteinPercentage >= 15 && proteinPercentage <= 35) score += 1;
    
    // Carb balance (ideal: 45-65% of calories)
    const carbCalories = carbs * 4;
    const carbPercentage = (carbCalories / calories) * 100;
    if (carbPercentage >= 45 && carbPercentage <= 65) score += 1.5;
    else if (carbPercentage >= 35 && carbPercentage <= 75) score += 0.5;
    
    // Fat balance (ideal: 20-35% of calories)
    const fatCalories = fat * 9;
    const fatPercentage = (fatCalories / calories) * 100;
    if (fatPercentage >= 20 && fatPercentage <= 35) score += 1;
    else if (fatPercentage > 35) score -= 0.5;
    
    // Fiber content (good: >10g per meal)
    if (fiber >= 10) score += 0.5;
    else if (fiber >= 5) score += 0.25;
    
    // Calorie appropriateness (assuming 2000 cal daily, ~600-700 per meal)
    if (calories >= 400 && calories <= 800) score += 0.5;
    else if (calories < 200 || calories > 1000) score -= 0.5;
    
    // Cap score between 0 and 10
    score = Math.max(0, Math.min(10, score));
    
    // Determine health text
    let healthText = 'Poor';
    if (score >= 8) healthText = 'Excellent';
    else if (score >= 6) healthText = 'Good';
    else if (score >= 4) healthText = 'Balanced';
    else if (score >= 2) healthText = 'Fair';
    
    // Generate info text
    let infoText = '';
    if (proteinPercentage < 20) infoText += 'Low protein content. ';
    else if (proteinPercentage > 30) infoText += 'High protein content. ';
    else infoText += 'Good protein balance. ';
    
    if (fatPercentage > 35) infoText += 'High in fats. ';
    else infoText += 'Good fat balance. ';
    
    if (fiber >= 10) infoText += `Rich in fiber (${fiber}g).`;
    else infoText += `Low fiber content (${fiber}g).`;
    
    return { score: Math.round(score * 10) / 10, text: healthText, info: infoText };
  };

  const healthData = calculateHealthScore();
  const healthScore = healthData.score;
  const healthText = healthData.text;
  const infoText = healthData.info;



  // Helper function to get appropriate icon for ingredients
  const getIngredientIcon = (ingredientName) => {
    const name = ingredientName.toLowerCase();
    if (name.includes('rice') || name.includes('pasta') || name.includes('bread')) return '🍚';
    if (name.includes('chicken') || name.includes('meat') || name.includes('fish')) return '🍗';
    if (name.includes('vegetable') || name.includes('greens') || name.includes('salad')) return '🥬';
    if (name.includes('fruit') || name.includes('apple') || name.includes('banana')) return '🍎';
    if (name.includes('egg')) return '🥚';
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt')) return '🥛';
    if (name.includes('nut') || name.includes('seed')) return '🥜';
    if (name.includes('oil') || name.includes('butter') || name.includes('fat')) return '🫒';
    return '🍽️'; // default icon
  };

  // Helper function to extract main ingredients from meal name
  const extractMainIngredients = (mealName) => {
    console.log('extractMainIngredients called with:', mealName);
    const name = mealName.toLowerCase();
    console.log('Lowercase meal name:', name);
    const ingredients = [];
    
    // Indian dishes
    if (name.includes('dosa')) {
      console.log('Found dosa in meal name');
      ingredients.push({ name: 'Dosa', amount: '1 piece', icon: '🥞' });
      if (name.includes('masala')) {
        console.log('Found masala in meal name');
        ingredients.push({ name: 'Potato Masala', amount: '100g', icon: '🥔' });
      }
      if (name.includes('sambar')) {
        ingredients.push({ name: 'Sambar', amount: '50ml', icon: '🥘' });
      }
      if (name.includes('chutney')) {
        ingredients.push({ name: 'Chutney', amount: '30ml', icon: '🥗' });
      }
    }
    else if (name.includes('idli')) {
      ingredients.push({ name: 'Idli', amount: '2-3 pieces', icon: '🥞' });
      if (name.includes('sambar')) {
        ingredients.push({ name: 'Sambar', amount: '100ml', icon: '🥘' });
      }
      if (name.includes('chutney')) {
        ingredients.push({ name: 'Chutney', amount: '50ml', icon: '🥗' });
      }
    }
    else if (name.includes('biryani')) {
      ingredients.push({ name: 'Basmati Rice', amount: '200g', icon: '🍚' });
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Chicken', amount: '150g', icon: '🍗' });
      } else if (name.includes('mutton')) {
        ingredients.push({ name: 'Mutton', amount: '150g', icon: '🥩' });
      } else if (name.includes('vegetable') || name.includes('veg')) {
        ingredients.push({ name: 'Mixed Vegetables', amount: '100g', icon: '🥬' });
      }
      ingredients.push({ name: 'Biryani Spices', amount: '10g', icon: '🌶️' });
    }
    else if (name.includes('curry')) {
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Chicken Curry', amount: '200g', icon: '🍗' });
      } else if (name.includes('dal') || name.includes('lentil')) {
        ingredients.push({ name: 'Dal Curry', amount: '200g', icon: '🟡' });
      } else if (name.includes('vegetable') || name.includes('veg')) {
        ingredients.push({ name: 'Vegetable Curry', amount: '200g', icon: '🥬' });
      } else {
        ingredients.push({ name: 'Curry', amount: '200g', icon: '🥘' });
      }
      ingredients.push({ name: 'Rice', amount: '150g', icon: '🍚' });
    }
    else if (name.includes('paratha')) {
      ingredients.push({ name: 'Paratha', amount: '2 pieces', icon: '🫓' });
      if (name.includes('aloo')) {
        ingredients.push({ name: 'Potato Filling', amount: '100g', icon: '🥔' });
      }
      if (name.includes('paneer')) {
        ingredients.push({ name: 'Paneer Filling', amount: '80g', icon: '🧀' });
      }
    }
    else if (name.includes('roti') || name.includes('chapati')) {
      ingredients.push({ name: 'Roti/Chapati', amount: '2-3 pieces', icon: '🫓' });
      if (name.includes('dal')) {
        ingredients.push({ name: 'Dal', amount: '150ml', icon: '🟡' });
      }
      if (name.includes('sabzi') || name.includes('vegetable')) {
        ingredients.push({ name: 'Vegetable Sabzi', amount: '100g', icon: '🥬' });
      }
    }
    
    // Western dishes
    else if (name.includes('burger')) {
      ingredients.push({ name: 'Burger Bun', amount: '1 piece', icon: '🍞' });
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Chicken Patty', amount: '120g', icon: '🍗' });
      } else if (name.includes('beef')) {
        ingredients.push({ name: 'Beef Patty', amount: '120g', icon: '🥩' });
      } else if (name.includes('veg')) {
        ingredients.push({ name: 'Veggie Patty', amount: '100g', icon: '🥬' });
      } else {
        ingredients.push({ name: 'Patty', amount: '120g', icon: '🥩' });
      }
      ingredients.push({ name: 'Vegetables & Sauce', amount: '50g', icon: '🥗' });
    }
    else if (name.includes('pizza')) {
      ingredients.push({ name: 'Pizza Base', amount: '2-3 slices', icon: '🍕' });
      if (name.includes('cheese')) {
        ingredients.push({ name: 'Cheese', amount: '60g', icon: '🧀' });
      }
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Chicken Toppings', amount: '80g', icon: '🍗' });
      }
      if (name.includes('vegetable') || name.includes('veg')) {
        ingredients.push({ name: 'Vegetable Toppings', amount: '60g', icon: '🥬' });
      }
    }
    else if (name.includes('pasta')) {
      ingredients.push({ name: 'Pasta', amount: '150g', icon: '🍝' });
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Chicken', amount: '100g', icon: '🍗' });
      }
      if (name.includes('sauce') || name.includes('tomato')) {
        ingredients.push({ name: 'Pasta Sauce', amount: '80ml', icon: '🥫' });
      }
      if (name.includes('cheese')) {
        ingredients.push({ name: 'Cheese', amount: '40g', icon: '🧀' });
      }
    }
    else if (name.includes('sandwich')) {
      ingredients.push({ name: 'Bread', amount: '2 slices', icon: '🍞' });
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Chicken', amount: '100g', icon: '🍗' });
      } else if (name.includes('veg')) {
        ingredients.push({ name: 'Vegetables', amount: '80g', icon: '🥬' });
      }
      if (name.includes('cheese')) {
        ingredients.push({ name: 'Cheese', amount: '30g', icon: '🧀' });
      }
    }
    
    // Asian dishes
    else if (name.includes('noodles') || name.includes('chow mein')) {
      ingredients.push({ name: 'Noodles', amount: '150g', icon: '🍜' });
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Chicken', amount: '100g', icon: '🍗' });
      }
      if (name.includes('vegetable') || name.includes('veg')) {
        ingredients.push({ name: 'Mixed Vegetables', amount: '80g', icon: '🥬' });
      }
    }
    else if (name.includes('fried rice')) {
      ingredients.push({ name: 'Rice', amount: '200g', icon: '🍚' });
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Chicken', amount: '80g', icon: '🍗' });
      }
      if (name.includes('egg')) {
        ingredients.push({ name: 'Egg', amount: '1 piece', icon: '🥚' });
      }
      ingredients.push({ name: 'Mixed Vegetables', amount: '60g', icon: '🥬' });
    }
    else if (name.includes('sushi')) {
      ingredients.push({ name: 'Sushi Rice', amount: '100g', icon: '🍚' });
      if (name.includes('salmon')) {
        ingredients.push({ name: 'Salmon', amount: '50g', icon: '🐟' });
      } else if (name.includes('tuna')) {
        ingredients.push({ name: 'Tuna', amount: '50g', icon: '🐟' });
      }
      ingredients.push({ name: 'Nori & Vegetables', amount: '20g', icon: '🥗' });
    }
    
    // Generic patterns - only if no specific dish found
    else if (name.includes('rice') && !ingredients.length) {
      ingredients.push({ name: 'Rice', amount: '200g', icon: '🍚' });
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Chicken', amount: '120g', icon: '🍗' });
      }
    }
    else if (name.includes('chicken') && !ingredients.length) {
      ingredients.push({ name: 'Chicken', amount: '150g', icon: '🍗' });
      if (name.includes('rice')) {
        ingredients.push({ name: 'Rice', amount: '150g', icon: '🍚' });
      }
    }
    else if (name.includes('salad') && !ingredients.length) {
      ingredients.push({ name: 'Mixed Salad Greens', amount: '150g', icon: '🥬' });
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Grilled Chicken', amount: '100g', icon: '🍗' });
      }
      ingredients.push({ name: 'Salad Dressing', amount: '30ml', icon: '🥗' });
    }
    else if (name.includes('soup') && !ingredients.length) {
      ingredients.push({ name: 'Soup', amount: '300ml', icon: '🥣' });
      if (name.includes('chicken')) {
        ingredients.push({ name: 'Chicken Pieces', amount: '80g', icon: '🍗' });
      }
      if (name.includes('vegetable')) {
        ingredients.push({ name: 'Mixed Vegetables', amount: '60g', icon: '🥬' });
      }
    }
    
    return ingredients;
  };

  // Real ingredients data from analysis
  const ingredients = (() => {
    try {
      console.log('Analysis data:', analysis);
      console.log('Analysis items:', analysis?.items);
      
      // First, try to get ingredients from analysis
      if (analysis?.items && Array.isArray(analysis.items) && analysis.items.length > 0) {
        return analysis.items.map(item => ({
          name: item?.name || 'Unknown Ingredient',
          amount: item?.quantity || '1 serving',
          calories: Math.round(item?.calories || 0),
          icon: getIngredientIcon(item?.name || ''),
        }));
      }
      
             // If no analysis items, extract main ingredients from meal name
       const mealNameToUse = mealNameState || cleanFoodName || analysis?.dish_name || 'Meal';
       const totalCalories = analysis?.total?.calories || 0;
      
      console.log('Meal name for ingredients:', mealNameToUse);
      console.log('Total calories:', totalCalories);
      
      // Extract main ingredients from meal name
      const mainIngredients = extractMainIngredients(mealNameToUse);
      console.log('Extracted main ingredients:', mainIngredients);
      
      if (mainIngredients.length > 0) {
        console.log('Using extracted main ingredients');
        // Distribute calories among main ingredients proportionally
        const caloriesPerIngredient = Math.round(totalCalories / mainIngredients.length);
        
        return mainIngredients.map((ingredient, index) => ({
          name: ingredient.name,
          amount: ingredient.amount,
          calories: index === mainIngredients.length - 1 ? 
            totalCalories - (caloriesPerIngredient * (mainIngredients.length - 1)) : 
            caloriesPerIngredient,
          icon: ingredient.icon
        }));
      }
      
      // Final fallback - only if no main ingredients could be extracted
      console.log('Using final fallback ingredient');
      return [{
        name: mealNameToUse || 'Complete Meal',
        amount: '1 serving',
        calories: totalCalories,
        icon: '🍽️'
      }];
      
    } catch (error) {
      console.log('Error processing ingredients:', error);
      return [{ 
        name: 'Complete Meal', 
        amount: '1 serving', 
                 calories: analysis?.total?.calories || 0,  
        icon: '🍽️' 
      }];
    }
  })();

  const moodOptions = [
    { emoji: '😊', label: 'High Protein' },
    { emoji: '😌', label: 'Balanced Meal' },
    { emoji: '🤤', label: 'Home Cooking' },
    { emoji: '😍', label: 'Delicious' },
    { emoji: '🤗', label: 'Satisfied' },
  ];

  // Block back navigation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
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
      Alert.alert('Success', 'Meal saved successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('SavedMeals'),
        },
      ]);
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
      const { calories } = analysis?.total || {};
      const { protein, carbs, fat, fiber } = macros;
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



  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Title and Time */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Meal Reflected</Text>
          <Text style={styles.mealName}>{mealNameState || analysis?.dish_name || 'Meal'}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>Today, {getCurrentTime()}</Text>
            <View style={styles.mealTypeTag}>
              <Text style={styles.mealTypeText}>Lunch</Text>
            </View>
          </View>
        </View>

                 {/* Meal Image and Calories */}
         <View style={styles.mealImageSection}>
           <View style={styles.mealImageContainer}>
             {/* Left side - Meal Image */}
             <View style={styles.mealImage}>
               <Image
                 source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop' }}
                 style={styles.mealImageStyle}
                 resizeMode="cover"
               />
             </View>
             
             {/* Right side - Calorie Ring */}
             <View style={styles.calorieRing}>
               <View style={styles.calorieRingInner}>
                 <Text style={styles.calorieNumber}>{analysis?.total?.calories || 785}</Text>
                 <Text style={styles.calorieLabel}>kcal</Text>
               </View>
             </View>
           </View>
         </View>

         {/* Macros Grid */}
         <View style={styles.macrosGrid}>
           <View style={[styles.macroCard, { backgroundColor: '#FFF2E6' }]}>
             <Text style={styles.macroLabel}>Carbs</Text>
             <Ionicons name="restaurant-outline" size={20} color="#333" style={styles.macroIcon} />
             <Text style={styles.macroValue}>{macros.carbs}g</Text>
           </View>
           <View style={[styles.macroCard, { backgroundColor: '#E6F3FF' }]}>
             <Text style={styles.macroLabel}>Protein</Text>
             <Ionicons name="fitness-outline" size={20} color="#333" style={styles.macroIcon} />
             <Text style={styles.macroValue}>{macros.protein}g</Text>
           </View>
           <View style={[styles.macroCard, { backgroundColor: '#F0FFE6' }]}>
             <Text style={styles.macroLabel}>Fat</Text>
             <Ionicons name="leaf-outline" size={20} color="#333" style={styles.macroIcon} />
             <Text style={styles.macroValue}>{macros.fat}g</Text>
           </View>
           <View style={[styles.macroCard, { backgroundColor: '#F3E6FF' }]}>
             <Text style={styles.macroLabel}>Fiber</Text>
             <Ionicons name="nutrition-outline" size={20} color="#333" style={styles.macroIcon} />
             <Text style={styles.macroValue}>{macros.fiber}g</Text>
           </View>
         </View>

        {/* Health Score */}
        <View style={styles.healthScoreSection}>
          <View style={styles.healthScoreCircle}>
            <Text style={styles.healthScoreNumber}>{healthScore}</Text>
          </View>
          <View style={styles.healthScoreInfo}>
            <Text style={styles.healthScoreTitle}>{healthText}</Text>
            <Text style={styles.healthScoreDescription}>{infoText}</Text>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.ingredientsSection}>
          <View style={styles.ingredientsHeader}>
            <Text style={styles.ingredientsTitle}>Ingredients</Text>
            <Text style={styles.ingredientsCount}>{ingredients.length} items</Text>
          </View>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <Text style={styles.ingredientEmoji}>{ingredient.icon}</Text>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
              </View>
              <Text style={styles.ingredientCalories}>{ingredient.calories} kcal</Text>
            </View>
          ))}
        </View>

        {/* Mood Selection */}
        <View style={styles.moodSection}>
          <Text style={styles.moodTitle}>How do you feel?</Text>
          <View style={styles.moodOptions}>
            {moodOptions.map((mood, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.moodOption,
                  selectedMood === index && styles.selectedMoodOption
                ]}
                onPress={() => setSelectedMood(index)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.moodLabels}>
            {moodOptions.map((mood, index) => (
              <Text key={index} style={styles.moodLabel}>{mood.label}</Text>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editButtonText}>Edit Meal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleDone} disabled={saving}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Logging...' : 'Log Food'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveToMealsButton} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveToMealsButtonText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 5,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 16,
    color: '#666',
  },
  mealTypeTag: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mealTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mealImageSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  mealImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealImage: {
    width: '60%',
    height: 200,
    backgroundColor: '#F0F4F8',
    borderRadius: 20,
    overflow: 'hidden',
  },
  mealImageStyle: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  calorieRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#F0F4F8',
  },
  calorieRingInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  calorieLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  macroCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroIcon: {
    marginRight: 8,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  healthScoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  healthScoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  healthScoreNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  healthScoreInfo: {
    flex: 1,
  },
  healthScoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  healthScoreDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  ingredientsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ingredientsCount: {
    fontSize: 12,
    color: '#666',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  ingredientEmoji: {
    fontSize: 16,
    marginRight: 10,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 1,
  },
  ingredientAmount: {
    fontSize: 12,
    color: '#666',
  },
  ingredientCalories: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  moodSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  moodTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moodOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMoodOption: {
    backgroundColor: '#6366F1',
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    width: 60,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#6366F1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveToMealsButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  saveToMealsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default VoicePostCalorieScreen;