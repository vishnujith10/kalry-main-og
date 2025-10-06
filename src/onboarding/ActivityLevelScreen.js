import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingContext } from '../context/OnboardingContext';

// Modern Fitness Light Mode Palette
const LIGHT_BG = '#F8F9FE';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#1A1D2E';
const TEXT_SECONDARY = '#6B7280';
const ELECTRIC_BLUE = '#2563EB';
const BRIGHT_CYAN = '#06B6D4';

const activityLevels = [
  {
    label: 'Sedentary',
    desc: 'Little to no exercise, desk job',
    icon: 'weekend',
    gradient: ['#FEE2E2', '#FECACA'],
    progress: [1, 0, 0, 0, 0],
  },
  {
    label: 'Lightly Active',
    desc: 'Light exercise 1-3 days/week',
    icon: 'walking',
    gradient: ['#FEF3C7', '#FDE68A'],
    progress: [1, 1, 0, 0, 0],
  },
  {
    label: 'Moderately Active',
    desc: 'Moderate exercise 3-5 days/week',
    icon: 'activity',
    gradient: ['#D1FAE5', '#A7F3D0'],
    progress: [1, 1, 1, 0, 0],
  },
  {
    label: 'Very Active',
    desc: 'Hard exercise 6-7 days/week',
    icon: 'running',
    gradient: ['#BFDBFE', '#93C5FD'],
    progress: [1, 1, 1, 1, 0],
  },
  {
    label: 'Extra Active',
    desc: 'Professional athlete level',
    icon: 'sports-handball',
    gradient: ['#E9D5FF', '#D8B4FE'],
    progress: [1, 1, 1, 1, 1],
  },
];


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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <MaterialIcons name="arrow-back" size={24} color={TEXT_PRIMARY} />
          </View>
        </TouchableOpacity>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text style={styles.subtitle}>DAILY ACTIVITY</Text>
            <Text style={styles.title}>How active are you{'\n'}on a typical day?</Text>
            <Text style={styles.description}>
              This helps us calculate your daily calorie needs
            </Text>
          </View>

          <View style={styles.optionsGrid}>
            {activityLevels.map((option, idx) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.optionCard,
                  selected === idx && styles.optionCardSelected
                ]}
                onPress={() => setSelected(idx)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <LinearGradient
                    colors={option.gradient}
                    style={styles.iconWrapper}
                  >
                    {option.icon === 'weekend' && <MaterialIcons name="weekend" size={24} color={TEXT_PRIMARY} />}
                    {option.icon === 'walking' && <FontAwesome5 name="walking" size={24} color={TEXT_PRIMARY} />}
                    {option.icon === 'activity' && <Feather name="activity" size={24} color={TEXT_PRIMARY} />}
                    {option.icon === 'running' && <FontAwesome5 name="running" size={24} color={TEXT_PRIMARY} />}
                    {option.icon === 'sports-handball' && <MaterialIcons name="sports-handball" size={24} color={TEXT_PRIMARY} />}
                  </LinearGradient>
                  <View style={styles.optionTextContent}>
                    <Text style={styles.optionText}>{option.label}</Text>
                    <Text style={styles.optionDesc}>{option.desc}</Text>
                    <View style={styles.progressBar}>
                      {option.progress.map((v, i) => (
                        <View
                          key={i}
                          style={[styles.progressDot, v ? styles.progressDotActive : styles.progressDotInactive]}
                        />
                      ))}
                    </View>
                  </View>
                  {selected === idx ? (
                    <View style={styles.checkCircle}>
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.emptyCircle} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.ctaButton, !Number.isInteger(selected) && styles.ctaButtonDisabled]}
          disabled={!Number.isInteger(selected)}
          onPress={() => handleContinue(activityLevels[selected].label)}
          activeOpacity={0.85}
        >
          {Number.isInteger(selected) ? (
            <LinearGradient
              colors={[ELECTRIC_BLUE, BRIGHT_CYAN]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <View style={styles.buttonDisabled}>
              <Text style={styles.buttonTextDisabled}>Select an activity level</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BG,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  backButton: {
    zIndex: 10,
  },
  backButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heading: {
    fontSize: 20,
    fontFamily: 'Lexend-Bold',
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 28,
  },
  subtitle: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    fontFamily: 'Manrope-Regular',
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    fontFamily: 'Lexend-Bold',
    letterSpacing: -0.5,
    marginBottom: 8,
    lineHeight: 38,
  },
  description: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    fontFamily: 'Manrope-Regular',
    lineHeight: 24,
  },
  optionsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: ELECTRIC_BLUE,
    shadowColor: ELECTRIC_BLUE,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    fontFamily: 'Manrope-Regular',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontFamily: 'Manrope-Regular',
    marginBottom: 8,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: ELECTRIC_BLUE,
  },
  progressDotInactive: {
    backgroundColor: '#E5E7EB',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ELECTRIC_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: LIGHT_BG,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  ctaButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Lexend-Bold',
    letterSpacing: 0.3,
  },
  ctaButtonDisabled: {
    opacity: 1,
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  buttonTextDisabled: {
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    fontFamily: 'Manrope-Regular',
  },
});

export default ActivityLevelScreen;