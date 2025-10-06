import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import supabase from '../lib/supabase';
const FILTERS = [
  'All Meals',
  'High Protein',
  'Low Carb',
  'Under 400 kcal',
];

const placeholderImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';

const SavedMealsScreen = ({ navigation, route }) => {
  const [meals, setMeals] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Meals');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setMeals([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('saved_meal')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      console.log('[SavedMealsScreen] Fetched data:', data, 'Error:', error);
      if (error || !data) {
        setMeals([]);
        setLoading(false);
        return;
      }
      // Map saved_meal to meal card format with signed URLs
      const mapped = await Promise.all(data.map(async (log) => {
        let imageUrl = placeholderImg;
        
        // If we have a photo_url (storage path), generate a signed URL
        if (log.photo_url && !log.photo_url.startsWith('http')) {
          try {
            const { data: signedUrlData } = await supabase.storage
              .from('food-photos')
              .createSignedUrl(log.photo_url, 60 * 60); // 1 hour expiry
            
            if (signedUrlData?.signedUrl) {
              imageUrl = signedUrlData.signedUrl;
            }
          } catch (error) {
            console.error('Error generating signed URL:', error);
            // Fallback to placeholder if signed URL generation fails
          }
        } else if (log.photo_url && log.photo_url.startsWith('http')) {
          // If it's already a full URL, use it directly
          imageUrl = log.photo_url;
        }
        
        return {
          id: log.id, // Include the database ID for deletion
          dish_name: log.dish_name,
          total_nutrition: { calories: Number(log.calories) },
          macros: {
            protein: Number(log.protein || 0),
            carbs: Number(log.carbs || 0),
            fat: Number(log.fat || 0),
          },
          image: imageUrl,
        };
      }));
      setMeals(mapped);
      setLoading(false);
    };
    fetchMeals();
  }, []);

  // Filtering logic for both search and filter chips
  const filteredMeals = meals.filter(meal => {
    // Search by meal name
    const matchesSearch = meal.dish_name.toLowerCase().includes(search.toLowerCase());
    // Filter by selected filter
    let matchesFilter = true;
    if (selectedFilter === 'High Protein') {
      matchesFilter = meal.macros.protein > 20;
    } else if (selectedFilter === 'Low Carb') {
      matchesFilter = meal.macros.carbs < 20;
    } else if (selectedFilter === 'Under 400 kcal') {
      matchesFilter = meal.total_nutrition.calories < 400;
    }
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (idx) => {
    try {
      const mealToDelete = meals[idx];
      if (!mealToDelete || !mealToDelete.id) {
        Alert.alert('Error', 'Cannot delete this meal.');
        return;
      }

      // Delete from database
      const { error } = await supabase
        .from('saved_meal')
        .delete()
        .eq('id', mealToDelete.id);

      if (error) {
        console.error('Error deleting meal:', error);
        Alert.alert('Error', 'Failed to delete meal from database.');
        return;
      }

      // Remove from local state
      setMeals(meals.filter((_, i) => i !== idx));
      Alert.alert('Success', 'Meal deleted successfully!');
    } catch (error) {
      console.error('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal.');
    }
  };

  const handleAddToPlan = async (meal) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user_id = session?.user?.id;
      if (!user_id) {
        Alert.alert('You must be logged in to log food.');
        return;
      }
      
      console.log('🔍 Logging saved meal:', {
        dish_name: meal.dish_name,
        image: meal.image,
        photo_url: meal.image
      });
      
      const today = new Date().toISOString().slice(0, 10);
      const logData = {
        user_id,
        food_name: meal.dish_name,
        serving_size: 1,
        calories: meal.total_nutrition.calories,
        protein: meal.macros.protein,
        carbs: meal.macros.carbs,
        fat: meal.macros.fat,
        fiber: meal.macros.fiber || 0,
        date_time: today,
        meal_type: 'Saved Meal',
        notes: '',
        photo_url: meal.image, // Include the photo URL from saved meal
        created_at: new Date().toISOString(),
      };
      
      console.log('🔍 Log data being inserted:', logData);
      
      const { error } = await supabase.from('user_food_logs').insert([logData]);
      if (error) throw error;
      Alert.alert('Success', 'Meal added to today\'s plan!', [
        { text: 'OK', onPress: () => {
            // Navigate to Home and trigger refresh
            if (navigation && navigation.navigate) {
              navigation.navigate('Home', { refresh: true });
            }
          }
        }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to add meal to plan.');
    }
  };

  const renderMeal = ({ item, index }) => (
    <View style={styles.mealCard}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: item.image || placeholderImg }} style={styles.mealImg} />
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(index)}>
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.mealName}>{item.dish_name}</Text>
      <View style={styles.kcalRow}>
        <MaterialCommunityIcons name="fire" size={18} color="#FF9100" />
        <Text style={styles.kcalText}>{item.total_nutrition.calories} kcal</Text>
      </View>
      <View style={styles.macrosRow}>
        <View style={styles.macroItem}><MaterialCommunityIcons name="fish" size={16} color="#3B82F6" /><Text style={styles.macroText}>{item.macros.protein}g</Text></View>
        <View style={styles.macroItem}><MaterialCommunityIcons name="rice" size={16} color="#F59E42" /><Text style={styles.macroText}>{item.macros.carbs}g</Text></View>
        <View style={styles.macroItem}><MaterialCommunityIcons name="egg" size={16} color="#FBBF24" /><Text style={styles.macroText}>{item.macros.fat}g</Text></View>
      </View>
      <TouchableOpacity style={styles.addToPlanBtn} onPress={() => handleAddToPlan(item)}>
        <Text style={styles.addToPlanText}>Add to Plan</Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: 0 }} edges={['top','bottom']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ marginRight: 12 }}>
        <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Meals</Text>
        <View style={styles.headerAddBtn} />
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterBtn}><Ionicons name="filter" size={18} color="#666" /><Text style={styles.filterText}>Filters</Text></TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginLeft: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, selectedFilter === f && styles.chipActive]}
              onPress={() => setSelectedFilter(f)}
            >
              <Text style={[styles.chipText, selectedFilter === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search"
          placeholderTextColor="#B0B0B0"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filteredMeals}
        renderItem={renderMeal}
        keyExtractor={(_, idx) => idx.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 8, paddingHorizontal: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#181A20', flex: 1, textAlign: 'center' },
  headerAddBtn: { padding: 4 },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, marginTop: 8 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  filterText: { fontSize: 16, color: '#666', marginLeft: 4 },
  chip: { backgroundColor: '#F3F4F6', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  chipActive: { backgroundColor: '#3B82F6' },
  chipText: { color: '#222', fontSize: 15 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  smartSortBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  smartSortText: { color: '#4F46E5', fontWeight: 'bold', marginLeft: 4 },
  grid: { paddingHorizontal: 14, paddingBottom: 32, paddingTop: 8 },
  mealCard: { backgroundColor: '#fff', borderRadius: 20, margin: 8, flex: 1, minWidth: 160, maxWidth: '48%', padding: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  imageWrap: { position: 'relative', alignItems: 'center', marginBottom: 8 },
  mealImg: { width: '100%', height: 110, borderRadius: 16, resizeMode: 'cover' },
  deleteBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: '#222', borderRadius: 16, padding: 4, zIndex: 2 },
  mealName: { fontSize: 18, fontWeight: 'bold', color: '#181A20', marginBottom: 4, marginTop: 2 },
  kcalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  kcalText: { fontSize: 15, color: '#FF9100', fontWeight: 'bold', marginLeft: 4 },
  macrosRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  macroItem: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  macroText: { fontSize: 14, color: '#222', marginLeft: 4 },
  addToPlanBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 10, justifyContent: 'center', marginTop: 4 },
  addToPlanText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  searchBarWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    backgroundColor: '#F6F6F8',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#222',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
});

export default SavedMealsScreen; 