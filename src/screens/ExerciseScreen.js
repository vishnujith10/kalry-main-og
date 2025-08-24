import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIMARY = '#7B61FF';
const PURPLE = '#A084E8';
const GREEN = '#22C55E';
const GRAY = '#6B7280';
const BG = '#F7F7FA';
const CARD = '#fff';

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
// Map JS getDay() (0=Sunday) to our days array (0=Monday)
const jsDayToIndex = [6, 0, 1, 2, 3, 4, 5];
const todayIndex = jsDayToIndex[new Date().getDay()];
const summary = [
  { icon: 'flame-outline', color: PURPLE, value: '780', label: 'Calories Burned', unit: 'kcal' },
  { icon: 'time-outline', color: GREEN, value: '115', label: 'Workout Minutes', unit: 'min' },
];
const recent = [
  { color: '#7B61FF', title: '30 min - Strength Training', time: 'Today, 8:30 AM' },
  { color: '#22C55E', title: '15 min - HIIT', time: 'Yesterday, 7:00 PM' },
  { color: '#F472B6', title: '45 min - Cardio', time: '2 days ago, 9:00 AM' },
];

// Map category to icon, color, stat label, and label pill
const CATEGORY_META = {
  Strength:    { icon: 'dumbbell', color: '#A084E8', statKey: 'workouts', statLabel: 'workouts', kcal: 320, label: null },
  HIIT:        { icon: 'fire', color: '#A259FF', statKey: 'workouts', statLabel: 'workouts', kcal: 400, label: null },
  Yoga:        { icon: 'yoga', color: '#A084E8', statKey: 'min', statLabel: 'min', kcal: null, label: 'Beginner' },
  Cardio:      { icon: 'run-fast', color: '#7B61FF', statKey: 'min', statLabel: 'min', kcal: 380, label: null },
  Core:        { icon: 'ab-testing', color: '#FF9100', statKey: 'workouts', statLabel: 'workouts', kcal: null, label: null },
  Stretching:  { icon: 'human-handsup', color: '#A084E8', statKey: 'min', statLabel: 'min', kcal: null, label: 'All Levels' },
  Pilates:     { icon: 'meditation', color: '#A084E8', statKey: 'min', statLabel: 'min', kcal: null, label: null },
  Plyometric:  { icon: 'arrow-expand-vertical', color: '#FF9100', statKey: 'workouts', statLabel: 'workouts', kcal: null, label: null },
  // Add more as needed
};
const CATEGORY_FALLBACK = { icon: 'help-circle', color: '#A084E8', statKey: 'workouts', statLabel: 'workouts', kcal: null, label: null };

function normalizeCategory(cat) {
  if (!cat) return '';
  return cat.trim().charAt(0).toUpperCase() + cat.trim().slice(1).toLowerCase();
}

export default function ExerciseScreen() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetch('http://192.168.1.4:3000/api/exercise')
      .then(async res => {
        if (!res.ok) {
          // Try to get error details from the response body
          let errorBody = '';
          try {
            errorBody = await res.text();
          } catch (e) {
            errorBody = 'Could not read error body';
          }
          throw new Error(`Failed to fetch. Status: ${res.status}. Body: ${errorBody}`);
        }
        return res.json();
      })
      .then(data => {
        setExercises(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Could not load exercises');
        setLoading(false);
        // Log the full error object and message
        console.error('Error fetching exercises:', err, err.message);
      });
  }, []);

  // Group exercises by normalized type
  const typeMap = {};
  exercises.forEach(ex => {
    const normType = ex.type ? ex.type.trim().charAt(0).toUpperCase() + ex.type.trim().slice(1).toLowerCase() : '';
    if (!normType) return;
    if (!typeMap[normType]) typeMap[normType] = [];
    typeMap[normType].push(ex);
  });
  const types = Object.keys(typeMap);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header with back button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.navigate('MainDashboard')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#7B61FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80, paddingTop: 20 }}>
        <Text style={styles.header}>Weekly Activity</Text>
        {/* Days Row */}
        <View style={styles.daysRow}>
          {days.map((d, i) => {
            const isPastOrToday = i <= todayIndex;
            return (
              <View key={i} style={[
                styles.dayCol,
                isPastOrToday ? styles.dayColActive : styles.dayColInactive
              ]}>
                <Text style={[
                  styles.dayText,
                  isPastOrToday ? styles.dayTextActive : styles.dayTextInactive
                ]}>
                  {d}
                </Text>
                <View style={[
                  styles.dot,
                  isPastOrToday ? styles.dotActive : styles.dotInactive
                ]} />
              </View>
            );
          })}
        </View>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {summary.map((s, i) => (
            <View key={i} style={styles.summaryCard}>
              <Ionicons name={s.icon} size={22} color={s.color} style={{ marginBottom: 6 }} />
              <Text style={styles.summaryValue}><Text style={{ fontFamily: 'Lexend-SemiBold' }}>{s.value}</Text> <Text style={styles.summaryUnit}>{s.unit}</Text></Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
        {/* Start New Workout Card */}
        <TouchableOpacity onPress={() => navigation.navigate('StartWorkout')} style={styles.startCard}>
          <MaterialCommunityIcons name="lightning-bolt" size={28} color={PURPLE} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.startTitle}>Start New Workout</Text>
            <Text style={styles.startSub}>Build your perfect routine</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={GRAY} />
        </TouchableOpacity>
        {/* Category Grid */}
        <Text style={[styles.header, { fontSize: 20, marginTop: 10 }]}>Exercise Types</Text>
        <View style={styles.gridRow}>
          {Object.keys(CATEGORY_META).map((type) => {
            const meta = CATEGORY_META[type] || CATEGORY_FALLBACK;
            const exercisesOfType = typeMap[type] || [];
            const count = exercisesOfType.length;
            return (
              <TouchableOpacity
                key={type}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('CategoryWorkouts', { type, workouts: exercisesOfType })}
                activeOpacity={0.85}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name={meta.icon} size={32} color={meta.color || PURPLE} />
                </View>
                <Text style={styles.categoryTitle}>{type}</Text>
                <Text style={styles.categoryStat}>
                  {count} {meta.statLabel}
                </Text>
                {meta.kcal && (
                  <Text style={styles.categoryKcal}>
                    {meta.kcal} kcal
                  </Text>
                )}
                {meta.label && (
                  <View style={styles.categoryLabelPill}>
                    <Text style={styles.categoryLabelText}>{meta.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Recent Workouts */}
        <Text style={styles.recentHeader}>Recent Workouts</Text>
        {recent.map((r, i) => (
          <View key={i} style={styles.recentCard}>
            <View style={styles.recentDotWrap}><View style={[styles.recentDot, { backgroundColor: r.color }]} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentTitle}>{r.title}</Text>
              <Text style={styles.recentTime}>{r.time}</Text>
            </View>
            <TouchableOpacity style={{ marginRight: 8 }}><Ionicons name="pencil-outline" size={18} color={GRAY} /></TouchableOpacity>
            <TouchableOpacity><Ionicons name="trash-outline" size={18} color={GRAY} /></TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      {/* Custom Footer Bar */}
      <View style={footerStyles.footerBar}>
        <TouchableOpacity style={footerStyles.footerBtn} onPress={() => navigation.navigate('Workouts')}>
          <Ionicons name="barbell-outline" size={26} color="#7B61FF" />
          <Text style={footerStyles.footerLabel}>Workouts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={footerStyles.footerBtn} onPress={() => navigation.navigate('Create')}>
          <Ionicons name="add-circle-outline" size={26} color="#7B61FF" />
          <Text style={footerStyles.footerLabel}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={footerStyles.footerBtn} onPress={() => navigation.navigate('Workouts')}>
          <Ionicons name="bookmark-outline" size={26} color="#7B61FF" />
          <Text style={footerStyles.footerLabel}>Saved</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#F3F0FF',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7B61FF',
    textAlign: 'center',
  },
  header: { fontFamily: 'Lexend-SemiBold', fontSize: 22, color: '#181A20', marginTop: 24, marginBottom: 8, marginLeft: 18 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 8, marginBottom: 38 , marginTop:20 },
  dayCol: { alignItems: 'center', flex: 1, marginHorizontal: 2 },
  dayColActive: { backgroundColor: '#EDE9FE', borderRadius: 20, padding: 6 },
  dayColInactive: { backgroundColor: '#F3F4F6', borderRadius: 20, padding: 6 },
  dayText: { fontFamily: 'Lexend-SemiBold', fontSize: 16, marginBottom: 2 },
  dayTextActive: { color: '#7B61FF' },
  dayTextInactive: { color: '#B0B0B0' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  dotActive: { backgroundColor: '#7B61FF' },
  dotInactive: { backgroundColor: '#E5E7EB' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 18, marginBottom: 18 },
  summaryCard: { flex: 1, backgroundColor: CARD, borderRadius: 18, padding: 18, marginHorizontal: 4, alignItems: 'center', shadowColor: '#181A20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 5 },
  summaryValue: { fontFamily: 'Lexend-SemiBold', fontSize: 22, color: '#181A20' },
  summaryUnit: { fontFamily: 'Lexend-Regular', fontSize: 14, color: '#888' },
  summaryLabel: { fontFamily: 'Manrope-Regular', fontSize: 14, color: '#888', marginTop: 2 },
  startCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 18, padding: 18, marginHorizontal: 18, marginBottom: 18, shadowColor: '#181A20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 5 },
  startTitle: { fontFamily: 'Lexend-SemiBold', fontSize: 16, color: '#181A20' },
  startSub: { fontFamily: 'Manrope-Regular', fontSize: 13, color: '#888' },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginHorizontal: 18, marginBottom: 18 },
  categoryCard: { width: '47%', backgroundColor: CARD, borderRadius: 16, marginBottom: 16, alignItems: 'flex-start', padding: 20, shadowColor: '#181A20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 5 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F0FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  categoryTitle: { fontFamily: 'Lexend-SemiBold', fontSize: 17, color: '#181A20', marginBottom: 2 },
  categoryStat: { fontFamily: 'Manrope-Regular', fontSize: 15, color: '#888', marginBottom: 2 },
  categoryKcal: { fontFamily: 'Lexend-SemiBold', fontSize: 15, color: '#22C55E', marginBottom: 2 },
  categoryLabelPill: { backgroundColor: '#E6F7EC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2, marginTop: 6 },
  categoryLabelText: { fontFamily: 'Manrope-Bold', fontSize: 13, color: '#22C55E' },
  workoutCard: { width: '47%', backgroundColor: CARD, borderRadius: 16, marginBottom: 16, alignItems: 'center', padding: 16, shadowColor: '#181A20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 5 },
  workoutTitle: { fontFamily: 'Lexend-SemiBold', fontSize: 15, color: '#181A20', marginBottom: 2 },
  workoutStat: { fontFamily: 'Manrope-Regular', fontSize: 13, color: '#888', marginBottom: 2 },
  workoutKcal: { fontFamily: 'Lexend-SemiBold', fontSize: 13, color: '#22C55E', marginBottom: 2 },
  workoutLabel: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2, alignSelf: 'center', marginTop: 2 },
  workoutLabelText: { fontFamily: 'Lexend-Bold', fontSize: 12, color: '#22C55E' },
  recentHeader: { fontFamily: 'Lexend-SemiBold', fontSize: 18, color: '#181A20', marginLeft: 18, marginBottom: 10 },
  recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 16, marginHorizontal: 18, marginBottom: 12, padding: 16, shadowColor: '#181A20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 5 },
  recentDotWrap: { width: 18, alignItems: 'center', marginRight: 8 },
  recentDot: { width: 10, height: 10, borderRadius: 5 },
  recentTitle: { fontFamily: 'Lexend-SemiBold', fontSize: 15, color: '#181A20' },
  recentTime: { fontFamily: 'Manrope-Regular', fontSize: 13, color: '#888' },
});

const footerStyles = StyleSheet.create({
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    zIndex: 10,
  },
  footerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  footerLabel: {
    fontSize: 13,
    color: '#7B61FF',
    marginTop: 2,
    fontWeight: 'bold',
  },
}); 