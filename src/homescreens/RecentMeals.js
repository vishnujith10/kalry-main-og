import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const macroPills = [
  {
    label: 'Protein',
    icon: 'leaf',
    color: '#22C55E',
    bg: '#E6F7EC',
    key: 'protein',
  },
  {
    label: 'Carbs',
    icon: 'flame',
    color: '#FF9100',
    bg: '#FFF2E2',
    key: 'carbs',
  },
  {
    label: 'Fat',
    icon: 'water',
    color: '#A084E8',
    bg: '#EEE8FF',
    key: 'fat',
  },
];

const RecentMeals = ({ recentMeals = [], handleDeleteMeal }) => {
  const [menuOpen, setMenuOpen] = useState(null);
  const [expandedMeal, setExpandedMeal] = useState(null);

  const handleMealPress = (index) => {
    console.log('Meal pressed:', index, 'Current expanded:', expandedMeal);
    // Close any open menu first
    setMenuOpen(null);
    // Toggle expansion
    setExpandedMeal(expandedMeal === index ? null : index);
  };

  const handleMenuPress = (index, e) => {
    e.stopPropagation();
    console.log('Menu pressed:', index);
    setMenuOpen(menuOpen === index ? null : index);
  };

  const handleDeletePress = (index, e) => {
    e.stopPropagation();
    console.log('Delete pressed:', index);
    handleDeleteMeal(index);
    setMenuOpen(null);
  };

  return (
    <View style={{ marginHorizontal: 20, marginBottom: 100 }}>
      <Text style={{ fontFamily: 'Lexend-SemiBold', fontSize: 20, color: '#181A20', marginBottom: 18 }}>
        Recent Meals
      </Text>
      {recentMeals.length === 0 ? (
        <Text style={{ fontFamily: 'Manrope-Regular', fontSize: 15, color: '#888', marginLeft: 10, marginTop: 10 }}>
          No meals logged yet today.
        </Text>
      ) : (
        recentMeals.map((meal, i) => {
          const isExpanded = expandedMeal === i;
          console.log(`Meal ${i} is expanded:`, isExpanded);
          
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleMealPress(i)}
              style={{
                backgroundColor: '#fff',
                borderRadius: 24,
                padding: 18,
                marginBottom: 18,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 4,
                borderWidth: 1,
                borderColor: '#F3F0FF',
                transform: [{ scale: isExpanded ? 1.02 : 1 }],
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Meal Image */}
                {meal.photo_url ? (
                  <Image
                    source={{ uri: meal.photo_url }}
                    style={{ width: 64, height: 64, borderRadius: 32, marginRight: 18, backgroundColor: '#F3F0FF' }}
                  />
                ) : (
                  <View style={{ width: 64, height: 64, borderRadius: 32, marginRight: 18, backgroundColor: '#F3F0FF', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="fast-food-outline" size={32} color="#B0B0B0" />
                  </View>
                )}

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={{ fontFamily: 'Lexend-SemiBold', fontSize: 17, color: '#181A20', flex: 1 }} numberOfLines={2}>
                      {meal.food_name || meal.meal_type || 'Meal'}
                    </Text>
                    <TouchableOpacity 
                      onPress={(e) => handleMenuPress(i, e)}
                      style={{ padding: 4, zIndex: 10 }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="ellipsis-vertical" size={20} color="#B0B0B0" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Menu Dropdown */}
                  {menuOpen === i && (
                    <View style={{ 
                      position: 'absolute', 
                      top: 28, 
                      right: 0, 
                      backgroundColor: '#fff', 
                      borderRadius: 12, 
                      shadowColor: '#000', 
                      shadowOpacity: 0.08, 
                      shadowRadius: 8, 
                      elevation: 6, 
                      zIndex: 20,
                      minWidth: 100
                    }}>
                      <TouchableOpacity 
                        onPress={(e) => handleDeletePress(i, e)}
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#D34B4B" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#D34B4B', fontFamily: 'Manrope-Bold', fontSize: 15 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <Text style={{ fontFamily: 'Manrope-Regular', fontSize: 15, color: '#888', marginBottom: 10 }}>
                    {meal.calories ? `🔥 ${meal.calories} kcal` : '-- kcal'}
                    {meal.serving_size ? ` • ${meal.serving_size}` : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2, paddingRight: 8 }}>
                    {macroPills.map((macro) => (
                      <View
                        key={macro.key}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: macro.bg,
                          borderRadius: 16,
                          paddingVertical: 3,
                          paddingHorizontal: 8,
                          marginRight: 8,
                          marginBottom: 6,
                          minWidth: 0,
                          maxWidth: '48%',
                        }}
                      >
                        <Ionicons name={macro.icon} size={14} color={macro.color} style={{ marginRight: 3 }} />
                        <Text style={{ fontFamily: 'Manrope-Bold', fontSize: 12, color: macro.color, marginRight: 2 }}>
                          {macro.label}
                        </Text>
                        <Text style={{ fontFamily: 'Manrope-Bold', fontSize: 12, color: macro.color }}>
                          {meal[macro.key] || 0}g
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              
              {/* Expanded Nutrition Details */}
              {isExpanded && (
                <View style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: '#F3F0FF',
                }}>
                  <Text style={{
                    fontFamily: 'Lexend-SemiBold',
                    fontSize: 16,
                    color: '#181A20',
                    marginBottom: 12,
                  }}>
                    Nutrition Details
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                  }}>
                    <View style={{
                      alignItems: 'center',
                      backgroundColor: '#E6F7EC',
                      borderRadius: 12,
                      padding: 12,
                      minWidth: '22%',
                      marginBottom: 8,
                    }}>
                      <Text style={{
                        fontFamily: 'Manrope-Bold',
                        fontSize: 14,
                        color: '#22C55E',
                      }}>
                        Protein
                      </Text>
                      <Text style={{
                        fontFamily: 'Lexend-SemiBold',
                        fontSize: 16,
                        color: '#22C55E',
                      }}>
                        {meal.protein || 0}g
                      </Text>
                    </View>
                    
                    <View style={{
                      alignItems: 'center',
                      backgroundColor: '#FFF2E2',
                      borderRadius: 12,
                      padding: 12,
                      minWidth: '22%',
                      marginBottom: 8,
                    }}>
                      <Text style={{
                        fontFamily: 'Manrope-Bold',
                        fontSize: 14,
                        color: '#FF9100',
                      }}>
                        Carbs
                      </Text>
                      <Text style={{
                        fontFamily: 'Lexend-SemiBold',
                        fontSize: 16,
                        color: '#FF9100',
                      }}>
                        {meal.carbs || 0}g
                      </Text>
                    </View>
                    
                    <View style={{
                      alignItems: 'center',
                      backgroundColor: '#EEE8FF',
                      borderRadius: 12,
                      padding: 12,
                      minWidth: '22%',
                      marginBottom: 8,
                    }}>
                      <Text style={{
                        fontFamily: 'Manrope-Bold',
                        fontSize: 14,
                        color: '#A084E8',
                      }}>
                        Fat
                      </Text>
                      <Text style={{
                        fontFamily: 'Lexend-SemiBold',
                        fontSize: 16,
                        color: '#A084E8',
                      }}>
                        {meal.fat || 0}g
                      </Text>
                    </View>
                    
                    <View style={{
                      alignItems: 'center',
                      backgroundColor: '#E8F5E8',
                      borderRadius: 12,
                      padding: 12,
                      minWidth: '22%',
                      marginBottom: 8,
                    }}>
                      <Text style={{
                        fontFamily: 'Manrope-Bold',
                        fontSize: 14,
                        color: '#28a745',
                      }}>
                        Fiber
                      </Text>
                      <Text style={{
                        fontFamily: 'Lexend-SemiBold',
                        fontSize: 16,
                        color: '#28a745',
                      }}>
                        {meal.fiber || 0}g
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

export default RecentMeals;