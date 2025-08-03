import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingContext } from '../context/OnboardingContext';
import { useNavigation } from '@react-navigation/native';

const PRIMARY = '#18181B';
const SECONDARY = '#6B7280';
const CARD_BG = '#F8F8FC';
const GRADIENT = ['#a18cd1', '#fbc2eb'];
const GRADIENT_BTN = ['#7F7FD5', '#86A8E7', '#91EAE4'];
const ACCENT = '#7F7FD5';
const WHITE = '#fff';
const GRAY = '#E5E7EB';
const PURPLE = '#7F7FD5';
const BLUE = '#86A8E7';

const workoutOptions = [
  { label: 'Strength', icon: (color) => <MaterialCommunityIcons name="dumbbell" size={28} color={color} /> },
  { label: 'Yoga / Flexibility', icon: (color) => <MaterialCommunityIcons name="yoga" size={28} color={color} /> },
  { label: 'HIIT & Functional', icon: (color) => <MaterialCommunityIcons name="fire" size={28} color={color} /> },
  { label: 'Running / Cardio', icon: (color) => <MaterialCommunityIcons name="run-fast" size={28} color={color} /> },
  { label: 'No Equipment / Home', icon: (color) => <MaterialIcons name="home" size={28} color={color} /> },
  { label: 'Sports & Games', icon: (color) => <MaterialCommunityIcons name="soccer" size={28} color={color} /> },
  { label: 'I\'m New to Working Out', icon: (color) => <Feather name="user-plus" size={28} color={color} /> },
  { label: 'Not Sure Yet', icon: (color) => <MaterialIcons name="help-outline" size={28} color={color} /> },
];

const dayOptions = [1, 2, 3, 4, 5, 6, 7];
const timeOptions = [
  { label: 'Morning', sub: '6 AM – 9 AM', icon: (color) => <Feather name="sunrise" size={24} color={color} /> },
  { label: 'Afternoon', sub: '12 PM – 3 PM', icon: (color) => <Feather name="sun" size={24} color={color} /> },
  { label: 'Evening', sub: '5 PM – 8 PM', icon: (color) => <Feather name="moon" size={24} color={color} /> },
  { label: 'Night', sub: 'After 8 PM', icon: (color) => <Feather name="moon" size={24} color={color} /> },
  { label: 'No Preference', sub: 'I go with the flow', icon: (color) => <Feather name="sunrise" size={24} color={color} /> },
];

const WorkoutPreferencesScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [days, setDays] = useState(4);
  const [selectedTime, setSelectedTime] = useState([]);
  const nav = useNavigation();

  const toggleWorkout = (idx) => {
    setSelectedWorkouts((prev) =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const toggleTime = (idx) => {
    setSelectedTime((prev) =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const canContinue = selectedWorkouts.length > 0 && days > 0 && selectedTime.length > 0;

  const handleContinue = () => {
    setOnboardingData({
      ...onboardingData,
      prefered_workout: selectedWorkouts.map(idx => workoutOptions[idx].label),
      total_days_per_week: days,
      prefered_time: selectedTime.map(idx => timeOptions[idx].label),
    });
    navigation.navigate('GoalSummary');
  };

  // Summary string
  const summary = [
    selectedWorkouts.map(idx => workoutOptions[idx].label).join(', ') || '—',
    `${days} Day${days > 1 ? 's' : ''}`,
    selectedTime.map(idx => timeOptions[idx].label).join(', ') || '—',
  ].join(' | ');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Let's shape your workout rhythm</Text>
        <Text style={styles.subheader}>Choose what feels right. You can always change it later.</Text>

        <Text style={styles.sectionTitle}>Pick the ways you like to move</Text>
        <Text style={styles.sectionSub}>(You can select multiple — or skip)</Text>
        <View style={styles.workoutGrid}>
          {workoutOptions.map((option, idx) => {
            const selected = selectedWorkouts.includes(idx);
            return (
              <TouchableOpacity
                key={option.label}
                style={[styles.workoutCard, selected && styles.workoutCardSelected]}
                onPress={() => toggleWorkout(idx)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={selected ? GRADIENT : [WHITE, WHITE]}
                  style={styles.workoutIconWrap}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {option.icon(selected ? PURPLE : SECONDARY)}
                </LinearGradient>
                <Text style={[styles.workoutCardLabel, selected && { color: PURPLE }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>How many days per week would you like to be active?</Text>
        <View style={styles.daysRow}>
          {dayOptions.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayCircle, days === d && styles.dayCircleSelected]}
              onPress={() => setDays(d)}
            >
              <Text style={[styles.dayCircleText, days === d && styles.dayCircleTextSelected]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.daysSub}>You selected {days} day{days > 1 ? 's' : ''} — sounds balanced!</Text>

        <Text style={styles.sectionTitle}>When do you usually like to move?</Text>
        <View style={styles.timeGrid}>
          {timeOptions.map((option, idx) => {
            const selected = selectedTime.includes(idx);
            return (
              <TouchableOpacity
                key={option.label}
                style={[styles.timeCard, selected && styles.timeCardSelected]}
                onPress={() => toggleTime(idx)}
                activeOpacity={0.85}
              >
                <View style={styles.timeIconWrap}>{option.icon(selected ? PURPLE : SECONDARY)}</View>
                <View>
                  <Text style={[styles.timeCardLabel, selected && { color: PURPLE }]}>{option.label}</Text>
                  <Text style={styles.timeCardSub}>{option.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <LinearGradient colors={['#e0e7ff', '#fbc2eb']} style={styles.summaryCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity style={styles.summaryBackBtn} onPress={() => nav.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color={PURPLE} />
          </TouchableOpacity>
          <View style={styles.summaryRowCentered}>
            <MaterialIcons name="check-circle" size={22} color={PURPLE} style={{ marginRight: 8 }} />
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        </LinearGradient>

        <TouchableOpacity style={styles.ctaBtn} onPress={handleContinue} disabled={!canContinue} activeOpacity={0.9}>
          <LinearGradient colors={GRADIENT_BTN} style={styles.ctaBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.ctaBtnText}>Set My Workout Rhythm</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.ctaSub}>You can change any of this anytime</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  scrollContent: { flexGrow: 1, paddingBottom: 16, paddingHorizontal: 0 },
  header: { fontSize: 26, fontWeight: 'bold', color: PRIMARY, marginTop: 50, marginBottom: 0, textAlign: 'left', paddingHorizontal: 24, fontFamily: 'Lexend-Bold' },
  subheader: { fontSize: 16, color: SECONDARY, marginBottom: 5, textAlign: 'left', paddingHorizontal: 24, fontFamily: 'Manrope-Regular' },
  sectionTitle: { fontSize: 18, fontWeight: 'regular', color: PRIMARY, marginTop:0, marginBottom: 5, textAlign: 'left', paddingHorizontal: 24, fontFamily: 'Lexend-Bold' },
  sectionSub: { fontSize: 14, color: SECONDARY, marginBottom: 8, textAlign: 'left', paddingHorizontal: 24, fontFamily: 'Manrope-Regular' },
  workoutGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: -140, paddingHorizontal: 8 },
  workoutCard: { width: '44%', aspectRatio: 1.1, backgroundColor: CARD_BG, borderRadius: 18, alignItems: 'center', justifyContent: 'center', margin: '2%', marginBottom: 8, elevation: 1, borderWidth: 0 },
  workoutCardSelected: { borderWidth: 2, borderColor: PURPLE, backgroundColor: WHITE, elevation: 3 },
  workoutIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  workoutCardLabel: { fontSize: 15, color: PRIMARY, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Manrope-Regular' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 0, paddingHorizontal: 16 },
  dayCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: GRAY, alignItems: 'center', justifyContent: 'center', marginHorizontal: 1 },
  dayCircleSelected: { backgroundColor: PURPLE },
  dayCircleText: { fontSize: 16, color: PRIMARY, fontWeight: 'bold', fontFamily: 'Lexend-Bold' },
  dayCircleTextSelected: { color: WHITE },
  daysSub: { fontSize: 13, color: SECONDARY, marginBottom: 4,marginTop: 10, textAlign: 'left', paddingHorizontal: 24, fontFamily: 'Manrope-Regular' },
  timeGrid: { marginTop: 4, marginBottom: 4, paddingHorizontal: 8 },
  timeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 6, elevation: 1, borderWidth: 0, minWidth: '96%', alignSelf: 'center' },
  timeCardSelected: { borderWidth: 2, borderColor: PURPLE, backgroundColor: WHITE, elevation: 3 },
  timeIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: '#F3F3FA' },
  timeCardLabel: { fontSize: 15, color: PRIMARY, fontWeight: 'bold', fontFamily: 'Manrope-Regular' },
  timeCardSub: { fontSize: 12, color: SECONDARY, fontFamily: 'Manrope-Regular' },
  summaryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 32, marginHorizontal: 8, marginTop: 10, marginBottom: 10, paddingVertical: 14, paddingHorizontal: 16, elevation: 4, shadowColor: '#7F7FD5', shadowOpacity: 0.12, shadowRadius: 8, backgroundColor: 'transparent', width: '96%', alignSelf: 'center' },
  summaryBackBtn: { marginRight: 10, padding: 6, borderRadius: 20, backgroundColor: '#f3f3fa', alignItems: 'center', justifyContent: 'center' },
  summaryRowCentered: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 },
  summaryText: { color: PRIMARY, fontSize: 16, fontWeight: 'bold', fontFamily: 'Lexend-Bold', textAlign: 'center', flexShrink: 1 },
  ctaBtn: { marginHorizontal: 24, marginTop: 4, borderRadius: 24, overflow: 'hidden' },
  ctaBtnGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 24 },
  ctaBtnText: { color: WHITE, fontWeight: 'bold', fontSize: 17, fontFamily: 'Lexend-Bold' },
  ctaSub: { color: SECONDARY, fontSize: 12, textAlign: 'center', marginTop: 4, fontFamily: 'Manrope-Regular' },
});

export default WorkoutPreferencesScreen;