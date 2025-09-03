import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import supabase from '../lib/supabase';

const COLORS = {
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryLight: '#DBEAFE',
  text: '#000',
  secondary: '#4B5563',
  muted: '#9CA3AF',
  placeholder: '#D1D5DB',
  background: '#FFF',
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

  useEffect(() => {
    fetchTodayData();
    fetchUserProfile();
  }, []);

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

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile...');
      
      // Fetch user profile data for Vishnujith
      const { data: profile, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('name', 'Vishnujith')
        .single();

      console.log('User profile response:', { profile, error });

      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Info</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.quickStatsSection}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
                     <View style={styles.fieldContainer}>
             <View style={styles.fieldContent}>
               <View style={styles.fieldInfo}>
                 <Text style={styles.fieldLabel}>Age</Text>
                 <Text style={styles.fieldValue}>
                   {userProfile ? userProfile.age : 'Loading...'}
                 </Text>
               </View>
               <TouchableOpacity style={styles.editButton}>
                 <Ionicons name="pencil" size={16} color="#333" />
               </TouchableOpacity>
             </View>
           </View>

           <View style={styles.fieldContainer}>
             <View style={styles.fieldContent}>
               <View style={styles.fieldInfo}>
                 <Text style={styles.fieldLabel}>Weight</Text>
                 <Text style={styles.fieldValue}>
                   {userProfile ? `${userProfile.weight} kg` : 'Loading...'}
                 </Text>
               </View>
               <TouchableOpacity style={styles.editButton}>
                 <Ionicons name="pencil" size={16} color="#333" />
               </TouchableOpacity>
             </View>
           </View>

           <View style={styles.fieldContainer}>
             <View style={styles.fieldContent}>
               <View style={styles.fieldInfo}>
                 <Text style={styles.fieldLabel}>Gender</Text>
                 <Text style={styles.fieldValue}>
                   {userProfile ? userProfile.gender : 'Loading...'}
                 </Text>
               </View>
               <TouchableOpacity style={styles.editButton}>
                 <Ionicons name="pencil" size={16} color="#333" />
               </TouchableOpacity>
             </View>
           </View>
        </View>

        {/* Fitness Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Goals</Text>
          
                     <View style={styles.fieldContainer}>
             <View style={styles.fieldContent}>
               <View style={styles.fieldInfo}>
                 <Text style={styles.fieldLabel}>Weekly Workout Frequency</Text>
                 <Text style={styles.fieldValue}>
                   {userProfile ? `${userProfile.total_days_per_week} workouts/week` : 'Loading...'}
                 </Text>
               </View>
               <TouchableOpacity style={styles.editButton}>
                 <Ionicons name="pencil" size={16} color="#333" />
               </TouchableOpacity>
             </View>
           </View>

           <View style={styles.fieldContainer}>
             <View style={styles.fieldContent}>
               <View style={styles.fieldInfo}>
                 <Text style={styles.fieldLabel}>Target Calories</Text>
                 <Text style={styles.fieldValue}>
                   {userProfile ? `${userProfile.calorie_goal} calories/day` : 'Loading...'}
                 </Text>
               </View>
               <TouchableOpacity style={styles.editButton}>
                 <Ionicons name="pencil" size={16} color="#333" />
               </TouchableOpacity>
             </View>
           </View>

           <View style={styles.fieldContainer}>
             <View style={styles.fieldContent}>
               <View style={styles.fieldInfo}>
                 <Text style={styles.fieldLabel}>Preferred Workout Types</Text>
                 <Text style={styles.fieldValue}>
                   {userProfile ? userProfile.prefered_workout : 'Loading...'}
                 </Text>
               </View>
               <TouchableOpacity style={styles.editButton}>
                 <Ionicons name="pencil" size={16} color="#333" />
               </TouchableOpacity>
             </View>
           </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickStatsSection: {
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  fieldContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  editButton: {
    padding: 8,
  },
});

export default PersonalInfoScreen;
