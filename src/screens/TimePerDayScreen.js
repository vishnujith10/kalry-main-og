import { MaterialIcons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OnboardingContext } from '../context/OnboardingContext';

const PRIMARY = '#000000';
const SECONDARY = '#666666';
const BACKGROUND = '#ffffff';
const GRAY_LIGHT = '#f5f5f5';
const GRAY_MEDIUM = '#e0e0e0';
const ACCENT = '#FAD89B';
const INPUT_BG = '#F8F8F8';

const options = [
  '10–20 mins',
  '20–40 mins',
  '40–60 mins',
  '60+ mins',
  'It varies',
];

const TimePerDayScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const [selected, setSelected] = useState(null);

  const handleNext = (spendingTime) => {
    setOnboardingData({
      ...onboardingData,
      spending_time: spendingTime,
    });
    navigation.navigate('WorkoutPreferences');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color={PRIMARY} />
        </TouchableOpacity>
        <View style={styles.spacer} />
        <Text style={styles.header}>How much time can you give per day?</Text>
        <Text style={styles.subheader}>Choose a time range that fits your schedule</Text>
        <View style={styles.optionsWrapper}>
          {options.map((option, idx) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionBtn, selected === idx && styles.optionBtnSelected]}
              onPress={() => setSelected(idx)}
              activeOpacity={0.85}
            >
              <Text style={[styles.optionText, selected === idx && styles.optionTextSelected]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, selected === null && styles.buttonDisabled]}
            disabled={selected === null}
            onPress={() => handleNext(options[selected])}
          >
            <Text style={styles.buttonText}>Next</Text>
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
  spacer: {
    height: 32,
  },
  header: {
    fontSize: 25,
    fontFamily: 'Lexend-Bold',
    color: PRIMARY,
    marginTop: 60,
    marginBottom: 4,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
    color: SECONDARY,
    marginBottom: 32,
    textAlign: 'center',
  },
  optionsWrapper: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  optionBtn: {
    borderWidth: 0,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: INPUT_BG,
  },
  optionBtnSelected: {
    backgroundColor: ACCENT,
  },
  optionText: {
    color: PRIMARY,
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
  },
  optionTextSelected: {
    color: PRIMARY,
    fontFamily: 'Lexend-Bold',
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
    fontFamily: 'Lexend-Bold',
  },
  buttonDisabled: {
    backgroundColor: GRAY_MEDIUM,
  },
});

export default TimePerDayScreen; 