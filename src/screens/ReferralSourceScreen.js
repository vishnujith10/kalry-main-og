import React, { useState, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome, FontAwesome5, AntDesign, Feather, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingContext } from '../context/OnboardingContext';

const PRIMARY = '#222';
const ACCENT = '#F57C1C';
const OPTION_BG = '#e7ded9';
const INFO_TEXT = '#888';

const options = [
  { label: 'Instagram' },
  { label: 'TikTok' },
  { label: 'YouTube' },
  { label: 'Google Search' },
  { label: 'App Store' },
  { label: 'Friend / Referral' },
  { label: 'Other' },
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

const ReferralSourceScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const [selected, setSelected] = useState(null);
  const [otherText, setOtherText] = useState('');
  const inputRef = useRef(null);

  const isOtherSelected = selected === 6;
  const isContinueEnabled = (selected !== null && (!isOtherSelected || (isOtherSelected && otherText.trim().length > 0)));

  const handleOptionSelect = (idx) => {
    setSelected(idx);
    if (idx !== 6) setOtherText('');
  };

  const handleContinue = (selectedSource) => {
    setOnboardingData({
      ...onboardingData,
      social_refference: selectedSource,
    });
    navigation.navigate('ActivityLevel');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} color={PRIMARY} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          <Text style={styles.header}>Quick thing before we start...</Text>
          <Text style={styles.subheader}>How did you hear about Kalry?</Text>
          <View style={styles.optionsColumn}>
            {options.map((option, idx) => (
              <TouchableOpacity
                key={option.label}
                style={[styles.optionBtn, selected === idx && styles.optionBtnSelected]}
                onPress={() => handleOptionSelect(idx)}
                activeOpacity={0.85}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            {isOtherSelected && (
              <TextInput
                ref={inputRef}
                style={styles.otherInput}
                placeholder="Type your answer..."
                value={otherText}
                onChangeText={setOtherText}
                autoFocus={true}
                placeholderTextColor="#a08c7d"
              />
            )}
          </View>
          <Text style={styles.infoText}>Helps us grow, never used for ads. <Text style={{color:'#3578e5'}}>💙</Text></Text>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, !isContinueEnabled && styles.buttonDisabled]}
          disabled={!isContinueEnabled}
          onPress={() => handleContinue(selected === 6 ? otherText.trim() : options[selected].label)}
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
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(240,240,240,0.9)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  header: {
    fontSize: 22,
    fontFamily: 'Lexend-Bold',
    color: PRIMARY,
    marginBottom: 10,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  subheader: {
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
    color: PRIMARY,
    marginBottom: 24,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  optionsColumn: {
    width: '100%',
    marginBottom: 18,
  },
  optionBtn: {
    width: '100%',
    backgroundColor: OPTION_BG,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  optionBtnSelected: {
    borderWidth: 2,
    borderColor: ACCENT,
    backgroundColor: '#f5e7d9',
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
    color: PRIMARY,
  },
  otherInput: {
    width: '100%',
    backgroundColor: '#f6f0ea',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
    color: PRIMARY,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e7ded9',
  },
  infoText: {
    fontSize: 13,
    color: INFO_TEXT,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    fontFamily: 'Manrope-Regular',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 24,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
    shadowColor: ACCENT,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#f3ede7',
  },
});

export default ReferralSourceScreen; 