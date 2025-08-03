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
const ORANGE = '#ff8800';

const options = [
  {
    label: 'Lose Weight',
    icon: <Feather name="activity" size={28} color={PRIMARY} />,
  },
  {
    label: 'Gain Muscle',
    icon: <FontAwesome5 name="dumbbell" size={28} color={PRIMARY} />,
  },
  {
    label: 'Stay Fit',
    icon: <MaterialIcons name="favorite" size={28} color={PRIMARY} />,
  },
];

const FocusScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const [selected, setSelected] = useState(null);

  const handleContinue = (selectedFocus) => {
    setOnboardingData({
      ...onboardingData,
      goal_focus: selectedFocus,
    });
    navigation.navigate('WeightGoal');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={28} color={PRIMARY} />
        </TouchableOpacity>
        <View style={styles.spacer} />
        <Text style={styles.header}>Choose Your Focus</Text>
        <Text style={styles.subheader}>Select your primary fitness goal</Text>
        <View style={styles.cardsWrapper}>
          {options.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.card, selected === idx && styles.cardSelected]}
              onPress={() => setSelected(idx)}
              activeOpacity={0.85}
            >
              <View style={styles.cardIconContainer}>{item.icon}</View>
              <Text style={styles.cardTitle}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, selected === null && styles.buttonDisabled]}
            disabled={selected === null}
            onPress={() => handleContinue(options[selected].label)}
          >
            <Text style={styles.buttonText}>Continue</Text>
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
    zIndex: 1,
    backgroundColor: GRAY_LIGHT,
    borderRadius: 20,
    padding: 4,
  },
  spacer: {
    height: 32,
  },
  header: {
    fontSize: 25,
    fontWeight: 'bold',
    color: PRIMARY,
    marginTop: 60,
    marginBottom: 4,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 17,
    color: SECONDARY,
    marginBottom: 32,
    textAlign: 'center',
  },
  cardsWrapper: {
    width: '100%',
    paddingHorizontal: 24,
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
    height: 120,
  },
  cardSelected: {
    backgroundColor: GRAY_LIGHT,
    borderColor: ORANGE,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 'auto',
    marginBottom: 24,
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
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

export default FocusScreen; 