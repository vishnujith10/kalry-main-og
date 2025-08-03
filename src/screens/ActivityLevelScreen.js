import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingContext } from '../context/OnboardingContext';

const PRIMARY = '#000000';
const SECONDARY = '#666666';
const BACKGROUND = '#ffffff';
const GRAY_LIGHT = '#f5f5f5';
const GRAY_MEDIUM = '#e0e0e0';

const activityLevels = [
  {
    label: 'Sedentary',
    desc: 'Little to no exercise, desk job',
    icon: <MaterialIcons name="weekend" size={24} color={PRIMARY} />,
    progress: [1, 0, 0, 0, 0],
  },
  {
    label: 'Lightly Active',
    desc: 'Light exercise 1-3 days/week',
    icon: <FontAwesome5 name="walking" size={24} color={PRIMARY} />,
    progress: [1, 1, 0, 0, 0],
  },
  {
    label: 'Moderately Active',
    desc: 'Moderate exercise 3-5 days/week',
    icon: <Feather name="activity" size={24} color={PRIMARY} />,
    progress: [1, 1, 1, 0, 0],
  },
  {
    label: 'Very Active',
    desc: 'Hard exercise 6-7 days/week',
    icon: <FontAwesome5 name="running" size={24} color={PRIMARY} />,
    progress: [1, 1, 1, 1, 0],
  },
  {
    label: 'Extra Active',
    desc: 'Professional athlete level',
    icon: <MaterialIcons name="sports-handball" size={24} color={PRIMARY} />,
    progress: [1, 1, 1, 1, 1],
  },
];

// Utility to save onboarding data
const saveOnboardingData = async (key, value) => {
  try {
    const existing = await AsyncStorage.getItem('onboardingData');
    const data = existing ? JSON.parse(existing) : {};
    data[key] = value;
    await AsyncStorage.setItem('onboardingData', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save onboarding data', e);
  }
};

const ActivityLevelScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const [selected, setSelected] = useState(null);

  const handleContinue = (selectedLevel) => {
    setOnboardingData({
      ...onboardingData,
      daily_activity_level: selectedLevel,
    });
    navigation.navigate('Focus');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} color={PRIMARY} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Daily Activity Level</Text>
        <Text style={styles.subheader}>Select your typical daily activity</Text>
        <View style={styles.cardsWrapper}>
          {activityLevels.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.card, selected === idx && styles.cardSelected]}
              onPress={() => setSelected(idx)}
              activeOpacity={0.85}
            >
              <View style={styles.cardIconContainer}>
                {item.icon}
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.label}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
                <View style={styles.progressBar}>
                  {item.progress.map((v, i) => (
                    <View
                      key={i}
                      style={[styles.progressDot, v ? styles.progressDotActive : styles.progressDotInactive]}
                    />
                  ))}
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={GRAY_MEDIUM} style={styles.chevron} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !Number.isInteger(selected) && styles.buttonDisabled]}
          disabled={!Number.isInteger(selected)}
          onPress={() => handleContinue(activityLevels[selected].label)}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    padding: 4,
  },
  scrollContent: {
    paddingTop: 90,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 4,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: SECONDARY,
    marginBottom: 20,
    textAlign: 'center',
  },
  cardsWrapper: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY_MEDIUM,
    padding: 16,
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardSelected: {
    backgroundColor: GRAY_LIGHT,
    borderColor: PRIMARY,
  },
  cardIconContainer: {
    width: 60,
    height: 70,
    borderRadius: 8,
    backgroundColor: GRAY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 14,
    color: SECONDARY,
    marginBottom: 4,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressDot: {
    width: 30,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  progressDotActive: {
    backgroundColor: PRIMARY,
  },
  progressDotInactive: {
    backgroundColor: GRAY_LIGHT,
  },
  chevron: {
    marginLeft: 8,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: GRAY_MEDIUM,
  },
  buttonText: {
    color: BACKGROUND,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ActivityLevelScreen;