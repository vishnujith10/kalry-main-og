// HydrationTrackerScreen.js

import React, { useEffect, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import supabase from '../lib/supabase';

const HydrationTrackerScreen = () => {
  const [currentIntake, setCurrentIntake] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2.5);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('2.5');
  // New state for intake values and modal
  const [intake1, setIntake1] = useState(250);
  const [intake2, setIntake2] = useState(500);
  const [intakeModalVisible, setIntakeModalVisible] = useState(false);
  const [intakeInput1, setIntakeInput1] = useState('250');
  const [intakeInput2, setIntakeInput2] = useState('500');
  const [userId, setUserId] = useState(null);
  const [recordId, setRecordId] = useState(null); // Track current day's record ID
  // Weekly data state
  const [weeklyIntakeData, setWeeklyIntakeData] = useState({});
  // New state for tracking intake values per day
  const [weeklyIntakeValues, setWeeklyIntakeValues] = useState({});
  // Animated value for bar height
  const [barAnimation] = useState(new Animated.Value(0));

  const progress = (currentIntake / dailyGoal) * 100;
  const isGoalAchieved = currentIntake >= dailyGoal;

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const getCurrentDay = () => {
    const today = new Date();
    return today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  };

  // Convert to our array index (Monday = 0, Tuesday = 1, etc.)
  const getTodayIndex = () => {
    const day = getCurrentDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday (0) to index 6, others to index-1
  };

  // Get start of current week (Monday)
  const getWeekStartDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  // Get all dates for current week
  const getCurrentWeekDates = () => {
    const weekStart = new Date(getWeekStartDate());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const todayIndex = getTodayIndex();

  // Initialize user and load today's data
  useEffect(() => {
    initializeUser();
  }, []);

  // Auto-save goal achievement status at midnight or when app closes
  useEffect(() => {
    const checkAndUpdateGoalStatus = async () => {
      if (recordId && userId) {
        const goalStatus = currentIntake >= dailyGoal ? 'achieved' : 'not achieved';
        await updateGoalStatus(goalStatus);
      }
    };

    // Set up interval to check every minute if it's past midnight
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        checkAndUpdateGoalStatus();
        // Load new week data if it's Monday
        if (now.getDay() === 1) {
          loadWeeklyData(userId);
        }
        // Update intake values for new day
        updateIntakeValuesForNewDay();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [recordId, userId, currentIntake, dailyGoal]);

  // Monitor changes in currentIntake and dailyGoal to automatically update goal status
  useEffect(() => {
    if (recordId && userId) {
      checkAndUpdateGoalStatus();
    }
  }, [currentIntake, dailyGoal, recordId, userId]);

  // Function to update intake values for new day
  const updateIntakeValuesForNewDay = () => {
    const updatedWeeklyIntakeValues = { ...weeklyIntakeValues };
    updatedWeeklyIntakeValues[todayIndex] = {
      intake1: intake1,
      intake2: intake2
    };
    setWeeklyIntakeValues(updatedWeeklyIntakeValues);
  };

  const initializeUser = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('HydrationTracker - User:', user);
      console.log('HydrationTracker - User Error:', userError);
      
      if (userError || !user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      setUserId(user.id);
      console.log('HydrationTracker - User ID set:', user.id);
      await loadTodayData(user.id);
      await loadWeeklyData(user.id);
      // Initialize intake values for today if not already set
      if (!weeklyIntakeValues[todayIndex]) {
        updateIntakeValuesForNewDay();
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      Alert.alert('Error', 'Failed to initialize user data');
    }
  };

  const loadWeeklyData = async (userId) => {
    try {
      const weekDates = getCurrentWeekDates();
      
      const { data, error } = await supabase
        .from('daily_water_intake')
        .select('date, current_intake_ml, intake1_ml, intake2_ml')
        .eq('user_id', userId)
        .in('date', weekDates);

      if (error) throw error;

      // Convert data to our weekly format
      const weeklyData = {};
      const weeklyIntakeValuesData = {};
      data?.forEach(record => {
        const dayIndex = weekDates.indexOf(record.date);
        if (dayIndex !== -1) {
          weeklyData[dayIndex] = record.current_intake_ml / 1000; // Convert ml to L
          weeklyIntakeValuesData[dayIndex] = {
            intake1: record.intake1_ml || 250,
            intake2: record.intake2_ml || 500
          };
        }
      });

      setWeeklyIntakeData(weeklyData);
      setWeeklyIntakeValues(weeklyIntakeValuesData);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  };

  const loadTodayData = async (userId) => {
    try {
      const today = getCurrentDate();
      console.log('HydrationTracker - Loading today data for user:', userId);
      console.log('HydrationTracker - Today date:', today);
      
      // Check if record exists for today
      const { data, error } = await supabase
        .from('daily_water_intake')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      console.log('HydrationTracker - Today data:', data);
      console.log('HydrationTracker - Today error:', error);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw error;
      }

      if (data) {
        // Record exists, load the data
        setCurrentIntake(data.current_intake_ml / 1000); // Convert ml to L
        setDailyGoal(data.daily_goal_ml / 1000); // Convert ml to L
        setRecordId(data.id);
        // Load intake values if they exist
        if (data.intake1_ml) setIntake1(data.intake1_ml);
        if (data.intake2_ml) setIntake2(data.intake2_ml);
        
        // Check and update goal status if needed
        if (data.goal_status) {
          const currentStatus = data.goal_status;
          const shouldBeStatus = (data.current_intake_ml / 1000) >= (data.daily_goal_ml / 1000) ? 'achieved' : 'not achieved';
          if (currentStatus !== shouldBeStatus) {
            await updateGoalStatus(shouldBeStatus);
          }
        }
        
        console.log('HydrationTracker - Today data loaded successfully');
      } else {
        // No record for today, create new one
        console.log('HydrationTracker - No record for today, creating new one');
        await createTodayRecord(userId);
      }
    } catch (error) {
      console.error('Error loading today data:', error);
      Alert.alert('Error', 'Failed to load today\'s data');
    }
  };

  const createTodayRecord = async (userId) => {
    try {
      const today = getCurrentDate();
      
      const { data, error } = await supabase
        .from('daily_water_intake')
        .insert({
          user_id: userId,
          date: today,
          current_intake_ml: 0,
          daily_goal_ml: dailyGoal * 1000, // Convert L to ml
          intake1_ml: intake1,
          intake2_ml: intake2,
          goal_status: 'not achieved'
        })
        .select()
        .single();

      if (error) throw error;

      setRecordId(data.id);
      setCurrentIntake(0);
    } catch (error) {
      console.error('Error creating today record:', error);
      Alert.alert('Error', 'Failed to create today\'s record');
    }
  };

  const updateWaterIntake = async (newIntakeL) => {
    if (!recordId || !userId) return;

    try {
      const newIntakeMl = Math.round(newIntakeL * 1000); // Convert L to ml
      
      const { error } = await supabase
        .from('daily_water_intake')
        .update({
          current_intake_ml: newIntakeMl,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

      // Update weekly data for today
      const updatedWeeklyData = { ...weeklyIntakeData };
      updatedWeeklyData[todayIndex] = newIntakeL;
      setWeeklyIntakeData(updatedWeeklyData);

    } catch (error) {
      console.error('Error updating water intake:', error);
      Alert.alert('Error', 'Failed to update water intake');
    }
  };

  const updateGoalStatus = async (status) => {
    if (!recordId) return;

    try {
      const { error } = await supabase
        .from('daily_water_intake')
        .update({
          goal_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };

  // Function to automatically check and update goal status
  const checkAndUpdateGoalStatus = async () => {
    if (!recordId) return;
    
    const newStatus = currentIntake >= dailyGoal ? 'achieved' : 'not achieved';
    await updateGoalStatus(newStatus);
  };

  const updateDailyGoal = async (newGoalL) => {
    if (!recordId) return;

    try {
      const newGoalMl = Math.round(newGoalL * 1000); // Convert L to ml
      
      const { error } = await supabase
        .from('daily_water_intake')
        .update({
          daily_goal_ml: newGoalMl,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

    } catch (error) {
      console.error('Error updating daily goal:', error);
      Alert.alert('Error', 'Failed to update daily goal');
    }
  };

  // Get best day of the week
  const getBestDay = () => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let bestDayIndex = -1;
    let bestIntake = 0;

    // Find the day with highest intake
    Object.keys(weeklyIntakeData).forEach(dayIndex => {
      const intake = weeklyIntakeData[dayIndex];
      if (intake > bestIntake) {
        bestIntake = intake;
        bestDayIndex = parseInt(dayIndex);
      }
    });

    // If no data exists or all are 0, check if today has any intake
    if (bestIntake === 0 && currentIntake > 0) {
      return {
        day: dayNames[todayIndex],
        intake: currentIntake,
        isToday: true
      };
    }

    // If still no best day found, return null
    if (bestDayIndex === -1 || bestIntake === 0) {
      return null;
    }

    return {
      day: dayNames[bestDayIndex],
      intake: bestIntake,
      isToday: bestDayIndex === todayIndex
    };
  };

  const bestDay = getBestDay();

  // Updated weekly data with dynamic today's progress and database data
  const weeklyData = [
    { 
      day: 'Mon', 
      label: 'Mon', 
      intake: todayIndex === 0 ? currentIntake : (weeklyIntakeData[0] || 0), 
      isToday: todayIndex === 0, 
      goalAchieved: todayIndex === 0 ? isGoalAchieved : (weeklyIntakeData[0] || 0) >= dailyGoal,
      intake1: todayIndex === 0 ? intake1 : (weeklyIntakeValues[0]?.intake1 || 250),
      intake2: todayIndex === 0 ? intake2 : (weeklyIntakeValues[0]?.intake2 || 500)
    },
    { 
      day: 'Tue', 
      label: 'Tue', 
      intake: todayIndex === 1 ? currentIntake : (weeklyIntakeData[1] || 0), 
      isToday: todayIndex === 1, 
      goalAchieved: todayIndex === 1 ? isGoalAchieved : (weeklyIntakeData[1] || 0) >= dailyGoal,
      intake1: todayIndex === 1 ? intake1 : (weeklyIntakeValues[1]?.intake1 || 250),
      intake2: todayIndex === 1 ? intake2 : (weeklyIntakeValues[1]?.intake2 || 500)
    },
    { 
      day: 'Wed', 
      label: 'Wed', 
      intake: todayIndex === 2 ? currentIntake : (weeklyIntakeData[2] || 0), 
      isToday: todayIndex === 2, 
      goalAchieved: todayIndex === 2 ? isGoalAchieved : (weeklyIntakeData[2] || 0) >= dailyGoal,
      intake1: todayIndex === 2 ? intake1 : (weeklyIntakeValues[2]?.intake1 || 250),
      intake2: todayIndex === 2 ? intake2 : (weeklyIntakeValues[2]?.intake2 || 500)
    },
    { 
      day: 'Thu', 
      label: 'Thu', 
      intake: todayIndex === 3 ? currentIntake : (weeklyIntakeData[3] || 0), 
      isToday: todayIndex === 3, 
      goalAchieved: todayIndex === 3 ? isGoalAchieved : (weeklyIntakeData[3] || 0) >= dailyGoal,
      intake1: todayIndex === 3 ? intake1 : (weeklyIntakeValues[3]?.intake1 || 250),
      intake2: todayIndex === 3 ? intake2 : (weeklyIntakeValues[3]?.intake2 || 500)
    },
    { 
      day: 'Fri', 
      label: 'Fri', 
      intake: todayIndex === 4 ? currentIntake : (weeklyIntakeData[4] || 0), 
      isToday: todayIndex === 4, 
      goalAchieved: todayIndex === 4 ? isGoalAchieved : (weeklyIntakeData[4] || 0) >= dailyGoal,
      intake1: todayIndex === 4 ? intake1 : (weeklyIntakeValues[4]?.intake1 || 250),
      intake2: todayIndex === 4 ? intake2 : (weeklyIntakeValues[4]?.intake2 || 500)
    },
    { 
      day: 'Sat', 
      label: 'Sat', 
      intake: todayIndex === 5 ? currentIntake : (weeklyIntakeData[5] || 0), 
      isToday: todayIndex === 5, 
      goalAchieved: todayIndex === 5 ? isGoalAchieved : (weeklyIntakeData[5] || 0) >= dailyGoal,
      intake1: todayIndex === 5 ? intake1 : (weeklyIntakeValues[5]?.intake1 || 250),
      intake2: todayIndex === 5 ? intake2 : (weeklyIntakeValues[5]?.intake2 || 500)
    },
    { 
      day: 'Sun', 
      label: 'Sun', 
      intake: todayIndex === 6 ? currentIntake : (weeklyIntakeData[6] || 0), 
      isToday: todayIndex === 6, 
      goalAchieved: todayIndex === 6 ? isGoalAchieved : (weeklyIntakeData[6] || 0) >= dailyGoal,
      intake1: todayIndex === 6 ? intake1 : (weeklyIntakeValues[6]?.intake1 || 250),
      intake2: todayIndex === 6 ? intake2 : (weeklyIntakeValues[6]?.intake2 || 500)
    }
  ];

  const addWater = async (amount) => {
    const newIntake = Math.min(currentIntake + amount, dailyGoal);
    setCurrentIntake(newIntake);
    await updateWaterIntake(newIntake);
    
    // Check if goal is achieved and update goal status
    if (newIntake >= dailyGoal) {
      await updateGoalStatus('achieved');
    }
  };

  const getBarHeight = (intake, isToday) => {
    const maxHeight = 120;
    const minHeight = 20; // Minimum height for circle appearance
    
    if (intake === 0) {
      return minHeight; // Show as circle when no intake
    }
    
    const percentage = Math.min((intake / dailyGoal) * 100, 100);
    const calculatedHeight = Math.max((percentage / 100) * maxHeight, minHeight);
    
    return calculatedHeight;
  };

  const getBarColor = (data) => {
    if (data.intake === 0) {
      return '#e5e7eb'; // Gray for no intake (circle state)
    }
    return data.goalAchieved ? '#10b981' : '#9333ea'; // Green if goal achieved, purple otherwise
  };

  const handleGoalChange = async () => {
    const newGoal = parseFloat(goalInput);
    if (!isNaN(newGoal) && newGoal > 0) {
      const oldGoal = dailyGoal;
      setDailyGoal(newGoal);
      const adjustedIntake = Math.min(currentIntake, newGoal);
      setCurrentIntake(adjustedIntake);
      await updateDailyGoal(newGoal);
      
      // Update the water intake in database with adjusted value
      await updateWaterIntake(adjustedIntake);
      
      // Check and update goal status based on new goal and current intake
      if (adjustedIntake >= newGoal) {
        await updateGoalStatus('achieved');
      } else {
        await updateGoalStatus('not achieved');
      }
      
      setModalVisible(false);
    }
  };

  const handleIntakeChange = async () => {
    const val1 = parseInt(intakeInput1);
    const val2 = parseInt(intakeInput2);
    if (!isNaN(val1) && val1 > 0 && !isNaN(val2) && val2 > 0) {
      setIntake1(val1);
      setIntake2(val2);
      
      // Update the database with new intake values
      if (recordId) {
        try {
          const { error } = await supabase
            .from('daily_water_intake')
            .update({
              intake1_ml: val1,
              intake2_ml: val2,
              updated_at: new Date().toISOString()
            })
            .eq('id', recordId);

          if (error) throw error;
        } catch (error) {
          console.error('Error updating intake values:', error);
          Alert.alert('Error', 'Failed to update intake values');
        }
      }
      
      // Update weekly intake values for today
      const updatedWeeklyIntakeValues = { ...weeklyIntakeValues };
      updatedWeeklyIntakeValues[todayIndex] = {
        intake1: val1,
        intake2: val2
      };
      setWeeklyIntakeValues(updatedWeeklyIntakeValues);
      
      setIntakeModalVisible(false);
    }
  };

  // Animated Bar Component
  const AnimatedBar = ({ data, index }) => {
    const [animatedHeight] = useState(new Animated.Value(20)); // Start with circle height
    const [animatedColor] = useState(new Animated.Value(0)); // 0 for gray, 1 for purple, 2 for green

    useEffect(() => {
      const targetHeight = getBarHeight(data.intake, data.isToday);
      const targetColor = data.intake === 0 ? 0 : (data.goalAchieved ? 2 : 1);

      // Animate height
      Animated.timing(animatedHeight, {
        toValue: targetHeight,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Animate color
      Animated.timing(animatedColor, {
        toValue: targetColor,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }, [data.intake, data.goalAchieved]);

    const backgroundColor = animatedColor.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ['#e5e7eb', '#9333ea', '#10b981']
    });

    return (
      <View style={styles.barColumn}>
        <Animated.View
          style={[
            styles.bar,
            {
              height: animatedHeight,
              backgroundColor: backgroundColor,
              borderRadius: data.intake === 0 ? 15 : 15, // Always rounded for circle effect at 0
            }
          ]}
        />
        <Text style={[
          styles.dayLabel, 
          { 
            fontWeight: data.isToday ? 'bold' : 'normal',
            color: data.isToday ? '#9333ea' : '#6b7280'
          }
        ]}>
          {data.day}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {console.log('HydrationTracker rendering - currentIntake:', currentIntake, 'dailyGoal:', dailyGoal, 'intake1:', intake1, 'intake2:', intake2)}
      <View style={styles.innerContainer}>
        
        <Text style={styles.subtitle}>Today's Progress</Text>
        <View style={styles.waterContainer}>
          <View style={[styles.waterFill, { height: `${progress}%` }]} />
          <View style={styles.waterTextContainer} pointerEvents="box-none">
            <Text style={styles.waterAmount}>{currentIntake.toFixed(1)}L</Text>
            <Text style={styles.waterGoal}>of {dailyGoal}L</Text>
            <Text style={styles.hydrated}>{Math.round(progress)}% Hydrated</Text>
            {isGoalAchieved && (
              <Text style={styles.goalAchieved}>🎉 Goal Achieved!</Text>
            )}
            <View style={styles.buttonRowInsideFill} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addWater(intake1 / 1000)}
                pointerEvents="auto"
              >
                <Text style={styles.addButtonText}>{`+${intake1}ml`}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addWater(intake2 / 1000)}
                pointerEvents="auto"
              >
                <Text style={styles.addButtonText}>{`+${intake2}ml`}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Combined Settings Card */}
        <View style={[styles.card, {paddingVertical: 0}]}>
          {/* Daily Goal Row */}
          <TouchableOpacity style={styles.cardRow} onPress={() => { setGoalInput(dailyGoal.toString()); setModalVisible(true); }}>
            <View style={styles.iconCircle}>
              <Icon name="droplet" size={18} color="#9333ea" />
            </View>
            <Text style={styles.cardText}>Daily Goal: {dailyGoal}L</Text>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
          {/* Change Daily Intakes Row */}
          <TouchableOpacity style={styles.cardRow} onPress={() => { setIntakeInput1(intake1.toString()); setIntakeInput2(intake2.toString()); setIntakeModalVisible(true); }}>
            <View style={styles.iconCircle}>
              <Icon name="edit-2" size={18} color="#ccc" />
            </View>
            <Text style={styles.cardText}>Change daily intakes</Text>
            <Icon name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
          {/* Reminders Row */}
          {/* <View style={styles.cardRow}>
            <View style={styles.iconCircle}>
              <Icon name="bell" size={18} color="#9333ea" />
            </View>
            <Text style={styles.cardText}>Reminders: Every 2 hours</Text>
            <TouchableOpacity
              onPress={() => setRemindersEnabled(!remindersEnabled)}
              style={[styles.toggle, { backgroundColor: remindersEnabled ? '#9333ea' : '#ccc' }]}
            >
              <View
                style={[styles.toggleKnob, { transform: [{ translateX: remindersEnabled ? 22 : 2 }] }]}
              />
            </TouchableOpacity>
          </View> */}
        </View>
        {/* Weekly Progress */}
        <View style={styles.weeklyCard}>
          <Text style={styles.weekTitle}>This Week</Text>
          <View style={styles.barChart}>
            {weeklyData.map((data, index) => (
              <AnimatedBar key={index} data={data} index={index} />
            ))}
          </View>
        </View>
        {/* Best Day Card */}
        <View style={styles.card}>
          <View style={styles.cardRow1}>
            <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}> 
              <Icon name="droplet" size={20} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.bestDayTitle}>Best Day</Text>
              <Text style={styles.bestDayText}>
                {bestDay 
                  ? `${bestDay.isToday ? 'Today' : bestDay.day}: ${bestDay.intake.toFixed(1)}L`
                  : 'Keep going!'
                }
              </Text>
              <Text style={styles.quote}>"Consistent hydration improves skin & mood"</Text>
            </View>
          </View>
        </View>
        {/* Modal for changing daily goal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Daily Goal</Text>
              <TextInput
                style={styles.modalInput}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="decimal-pad"
                placeholder="Enter new goal (L)"
              />
              <TouchableOpacity style={styles.modalButton} onPress={handleGoalChange}>
                <Text style={styles.modalButtonText}>Change your goal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Modal for changing daily intakes */}
        <Modal
          visible={intakeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIntakeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Daily Intakes</Text>
              <TextInput
                style={styles.modalInput}
                value={intakeInput1}
                onChangeText={setIntakeInput1}
                keyboardType="numeric"
                placeholder="First intake (ml)"
              />
              <TextInput
                style={styles.modalInput}
                value={intakeInput2}
                onChangeText={setIntakeInput2}
                keyboardType="numeric"
                placeholder="Second intake (ml)"
              />
              <TouchableOpacity style={styles.modalButton} onPress={handleIntakeChange}>
                <Text style={styles.modalButtonText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIntakeModalVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
  },
  innerContainer: {
    padding: 16,
  },
  title: {
    marginTop: 30,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 16,
  },
  progressBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    elevation: 2,
  },
  waterContainer: {
    marginTop: 20,
    width: 280,
    height: 420,
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#9333ea',
    opacity: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 1,
  },
  waterTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 16,
    zIndex: 2,
  },
  waterAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  waterGoal: {
    fontSize: 14,
    color: 'black',
  },
  hydrated: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    marginVertical: 4,
  },
  goalAchieved: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 4,
  },
  buttonRowInsideFill: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 999,
  },
  addButtonText: {
    color: '#7c3aed',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
    shadowColor: '#000',
    elevation: 2,
    flex: 1,
    justifyContent: 'space-evenly',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cardText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    position: 'absolute',
    top: 2,
  },
  weeklyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    elevation: 2,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  barColumn: {
    alignItems: 'center',
  },
  bar: {
    width: 30,
    borderRadius: 15,
  },
  dayLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 6,
  },
  cardRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 12,
  },
  bestDayTitle: {
    fontWeight: '600',
    fontSize: 20,
    color: '#111827',
  },
  bestDayText: {
    fontSize: 16,
    color: '#6b7280',
  },
  quote: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#9333ea',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalCancel: {
    color: '#9333ea',
    marginTop: 8,
    fontSize: 15,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#f1f1f1',
    marginLeft: 56,
    marginRight: 0,
  },
});

export default HydrationTrackerScreen;