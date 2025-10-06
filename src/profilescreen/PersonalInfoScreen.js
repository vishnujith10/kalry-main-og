import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import supabase from '../lib/supabase';

const COLORS = {
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryLight: '#DBEAFE',
  text: '#333',
  secondary: '#666',
  muted: '#999',
  placeholder: '#D1D5DB',
  background: '#E8E9F0',
  surface: '#F9FAFB',
  card: '#FFF',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
};

const PersonalInfoScreen = () => {
  const navigation = useNavigation();
  const [todayCalories, setTodayCalories] = useState(0);
  const [activeDays, setActiveDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');

  useEffect(() => {
    fetchTodayData();
    fetchUserProfile();
  }, []);

  // Refresh profile when screen comes into focus (e.g., after unit conversion)
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  const fetchTodayData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Fetching today\'s data...');
      
      // Get today's date
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      console.log('Date range:', { startOfDay: startOfDay.toISOString(), endOfDay: endOfDay.toISOString() });
      console.log('Supabase client:', supabase);
      console.log('Supabase from method:', supabase?.from);

      // Fetch today's calories
      const { data: foodLogs, error: foodError } = await supabase
        .from('user_food_logs')
        .select('calories')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      console.log('Food logs response:', { foodLogs, foodError });

      if (foodError) {
        console.error('Error fetching food logs:', foodError);
      } else {
        const totalCalories = foodLogs?.reduce((sum, log) => sum + (log.calories || 0), 0) || 0;
        console.log('Total calories calculated:', totalCalories);
        setTodayCalories(totalCalories);
      }

      // Fetch active days count (days with food logs since user creation)
      // Since user was created on July 11, count from that date
      const userCreationDate = new Date('2024-07-11'); // July 11, 2024
      
      console.log('User creation date:', userCreationDate.toISOString());

      const { data: activeDaysData, error: activeDaysError } = await supabase
        .from('user_food_logs')
        .select('created_at')
        .gte('created_at', userCreationDate.toISOString());

      console.log('Active days response:', { activeDaysData, activeDaysError });

      if (activeDaysError) {
        console.error('Error fetching active days:', activeDaysError);
      } else {
        const uniqueDays = new Set();
        activeDaysData?.forEach(log => {
          const date = new Date(log.created_at).toDateString();
          uniqueDays.add(date);
        });
        console.log('Unique days found:', uniqueDays.size);
        setActiveDays(uniqueDays.size);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // No need for AsyncStorage - units are now saved in database during signup

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile...');
      
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('user_profile')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('User profile response:', { profile, error });

        if (error) {
          console.error('Error fetching user profile:', error);
        } else {
          setUserProfile(profile);
          
          // Set units from database with fallback defaults
          setWeightUnit(profile?.weight_unit || 'kg');
          setHeightUnit(profile?.height_unit || 'cm');
        }
      } else {
        console.log('No authenticated user found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValues(prev => ({ ...prev, [field]: currentValue || '' }));
  };

  const handleSave = async (field) => {
    try {
      const newValue = editValues[field];
      
      if (!newValue || newValue.toString().trim() === '') {
        Alert.alert('Error', 'Please enter a valid value');
        return;
      }

      // Update local state first
      setUserProfile(prev => ({
        ...prev,
        [field]: newValue
      }));

      // Update in Supabase
      const { error } = await supabase
        .from('user_profile')
        .update({ [field]: newValue })
        .eq('name', 'Vishnujith');

      if (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Error', 'Failed to update profile');
        // Revert local state if update failed
        setUserProfile(prev => ({
          ...prev,
          [field]: userProfile[field]
        }));
      } else {
        Alert.alert('Success', 'Profile updated successfully');
      }

      setEditingField(null);
      setEditValues(prev => {
        const newValues = { ...prev };
        delete newValues[field];
        return newValues;
      });
    } catch (error) {
      console.error('Error saving field:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  const handleCancel = (field) => {
    setEditingField(null);
    setEditValues(prev => {
      const newValues = { ...prev };
      delete newValues[field];
      return newValues;
    });
  };

  const renderEditableField = (field, label, currentValue, unit = '', iconName) => {
    const isEditing = editingField === field;
    const value = editValues[field] !== undefined ? editValues[field] : currentValue;

    return (
      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <Ionicons name={iconName} size={20} color="#666" />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{label}</Text>
            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={value?.toString() || ''}
                  onChangeText={(text) => setEditValues(prev => ({ ...prev, [field]: text }))}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  autoFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={() => handleSave(field)}
                  >
                    <Ionicons name="checkmark" size={16} color={COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => handleCancel(field)}
                  >
                    <Ionicons name="close" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.settingSubtitle}>
                {currentValue ? `${currentValue}${unit}` : 'Not set'}
              </Text>
            )}
          </View>
        </View>
        {!isEditing && (
          <TouchableOpacity onPress={() => handleEdit(field, currentValue)}>
            <Ionicons name="pencil" size={16} color="#666" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8E9F0" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Info</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.quickStatsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>120</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {isLoading ? <ActivityIndicator size="small" color={COLORS.primary} /> : todayCalories}
              </Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {isLoading ? <ActivityIndicator size="small" color={COLORS.primary} /> : activeDays}
              </Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.settingsSection}>
                     {renderEditableField('age', 'Age', userProfile?.age, '', 'person-outline')}

               {renderEditableField('weight', 'Weight', userProfile?.weight, ` ${weightUnit}`, 'fitness-outline')}

                         {renderEditableField('target_weight', 'Goal Weight', userProfile?.target_weight, ` ${weightUnit}`, 'trending-up-outline')}

                       {renderEditableField('height', 'Height', userProfile?.height, ` ${heightUnit}`, 'resize-outline')}

                                                                       {renderEditableField('date_of_birth', 'Date of Birth', userProfile?.date_of_birth, '', 'calendar-outline')}

            

                     {renderEditableField('gender', 'Gender', userProfile?.gender, '', 'male-female-outline')}
        </View>

        {/* Fitness Goals Section */}
        <View style={styles.settingsSection}>
                     {renderEditableField('total_days_per_week', 'Weekly Workout Frequency', userProfile?.total_days_per_week, ' workouts/week', 'calendar-outline')}

                     {renderEditableField('calorie_goal', 'Target Calories', userProfile?.calorie_goal, ' calories/day', 'flame-outline')}

                     {renderEditableField('prefered_workout', 'Preferred Workout Types', userProfile?.prefered_workout, '', 'barbell-outline')}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E9F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#E8E9F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickStatsSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginVertical: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editActions: {
    flexDirection: 'row',
    marginLeft: 12,
    gap: 8,
  },
  saveButton: {
    padding: 8,
    backgroundColor: COLORS.success + '20',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  cancelButton: {
    padding: 8,
    backgroundColor: COLORS.error + '20',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
});

export default PersonalInfoScreen;