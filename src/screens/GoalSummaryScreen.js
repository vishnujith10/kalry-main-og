import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useContext } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OnboardingContext } from '../context/OnboardingContext';

const PRIMARY = '#000000';
const SECONDARY = '#666666';
const BACKGROUND = '#ffffff';
const GRAY_LIGHT = '#f5f5f5';
const GRAY_MEDIUM = '#e0e0e0';
const ACCENT = '#FAD89B';
const INPUT_BG = '#F8F8F8';

const GoalSummaryScreen = ({ navigation }) => {
  const { onboardingData } = useContext(OnboardingContext);

  const {
    goal_focus = 'Lose',
    target_weight = 0,
    weight = 0,
    selectedWeightUnit = 'kg',
    weekly_target = 0.5,
    total_days_per_week = 'N/A',
  } = onboardingData;

  const currentWeight = Number(weight);
  const targetWeight = Number(target_weight);
  const weeklyTarget = Number(weekly_target);

  let goalText = '';
  let weightDiff = Math.abs(targetWeight - currentWeight);
  let displayWeightDiff = weightDiff;
  
  if (selectedWeightUnit === 'lbs') {
    displayWeightDiff = (weightDiff * 2.20462).toFixed(1);
  } else {
    displayWeightDiff = weightDiff.toFixed(1);
  }

  if (goal_focus.toLowerCase().includes('gain')) {
    goalText = `Gain ${displayWeightDiff} ${selectedWeightUnit}`;
  } else if (goal_focus.toLowerCase().includes('lose')) {
    goalText = `Lose ${displayWeightDiff} ${selectedWeightUnit}`;
  } else {
    goalText = 'Maintain current weight';
  }
  
  const estimatedWeeks = (weeklyTarget > 0 && weightDiff > 0)
    ? Math.ceil(weightDiff / weeklyTarget)
    : 'N/A';
  
  const estimatedTime = estimatedWeeks !== 'N/A' ? `~${estimatedWeeks} weeks` : 'N/A';

  const handleFinishOnboarding = () => {
    navigation.replace('Signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color={PRIMARY} />
        </TouchableOpacity>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="target" size={48} color={ACCENT} />
        </View>
        <Text style={styles.goalText}>Goal: {goalText}</Text>
        <View style={styles.infoRow}>
          <MaterialIcons name="calendar-today" size={24} color={ACCENT} style={styles.infoIcon} />
          <Text style={styles.infoText}>Estimated Time: {estimatedTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="heart-pulse" size={24} color={ACCENT} style={styles.infoIcon} />
          <Text style={styles.infoText}>{total_days_per_week} workouts/week</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="food-apple-outline" size={24} color={ACCENT} style={styles.infoIcon} />
          <Text style={styles.infoText}>Guided meal tracking</Text>
        </View>
        <Text style={styles.motivationText}>
          Imagine the best version of yourself — every step counts. Stay consistent, and we'll get there together.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleFinishOnboarding}>
            <Text style={styles.buttonText}>Let's Make It Happen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 2,
    padding: 4,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 110,
    marginBottom: 24,
  },
  goalText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: PRIMARY,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Lexend-Bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 18,
    color: PRIMARY,
    fontFamily: 'Manrope-Regular',
  },
  motivationText: {
    color: ACCENT,
    fontWeight: 'bold',
    fontSize: 22,
    textAlign: 'center',
    marginVertical: 24,
    paddingHorizontal: 16,
    fontFamily: 'Manrope-Regular',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 'auto',
    marginBottom: 24,
  },
  button: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Lexend-Bold',
  },
});

export default GoalSummaryScreen; 