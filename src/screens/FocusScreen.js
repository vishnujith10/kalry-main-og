import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingContext } from '../context/OnboardingContext';

const PRIMARY = '#000000';
const SECONDARY = '#666666';
const BACKGROUND = '#ffffff';
const GRAY_LIGHT = '#f5f5f5';
const GRAY_MEDIUM = '#e0e0e0';
const ACCENT = '#FAD89B';
const INPUT_BG = '#F8F8F8';

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
    fontSize: 17,
    fontFamily: 'Manrope-Regular',
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
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  cardIconContainer: {
    width: 60,
    height: 70,
    borderRadius: 8,
    backgroundColor: INPUT_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
    color: PRIMARY,
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
  buttonDisabled: {
    backgroundColor: GRAY_MEDIUM,
  },
  buttonText: {
    color: PRIMARY,
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
  },
});

export default FocusScreen; 