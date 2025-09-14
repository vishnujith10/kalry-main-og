import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PRIMARY = '#7B61FF';
const PURPLE = '#A084E8';
const GREEN = '#22C55E';
const GRAY = '#6B7280';
const BG = '#F7F7FA';
const CARD = '#fff';

const summary = [
  { icon: 'flame-outline', color: PURPLE, value: '780', label: 'Calories Burned', unit: 'kcal' },
  { icon: 'time-outline', color: GREEN, value: '115', label: 'Workout Minutes', unit: 'min' },
];
const recent = [
  { color: '#7B61FF', title: '30 min - Strength Training', time: 'Today, 8:30 AM' },
  { color: '#22C55E', title: '15 min - HIIT', time: 'Yesterday, 7:00 PM' },
  { color: '#F472B6', title: '45 min - Cardio', time: '2 days ago, 9:00 AM' },
];

export default function ExerciseScreen() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetch('http://192.168.1.7:3000/api/exercise')
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
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
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100, paddingTop: 20 }}>
        {/* Calendar Widget - Moved to top */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonth}>Aug 2025</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>7-day streak</Text>
            </View>
          </View>
          
          <View style={styles.calendarGrid}>
            <View style={styles.weekDaysRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <Text key={i} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>
            <View style={styles.datesRow}>
              {[25, 26, 27, 28, 29, 30, 31].map((date, i) => (
                <View key={i} style={[styles.dateCell, date === 27 && styles.activeDateCell]}>
                  <Text style={[styles.dateText, date === 27 && styles.activeDateText]}>
                    {date}
                  </Text>
                  {date === 27 && <View style={styles.activeDateDots} />}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.weekProgressSection}>
            <Text style={styles.weekProgressText}>This Week: 4/7 workouts done</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>
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

        {/* Explore Exercises Card */}
        <View style={styles.exploreCard}>
          <View style={styles.exploreHeader}>
            <View style={styles.bookIcon}>
              <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#7B61FF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.exploreTitle}>Explore Exercises</Text>
              <Text style={styles.exploreSubtitle}>Pick from 100+ exercises</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('CategoryWorkouts')}>
            <Text style={styles.browseButtonText}>Browse Exercises</Text>
          </TouchableOpacity>
        </View>

        {/* Cardio Sessions Card */}
        <View style={styles.cardioCard}>
          <View style={styles.cardioHeader}>
            <View style={styles.cardioIcon}>
              <Ionicons name="timer-outline" size={24} color="#7B61FF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardioTitle}>Cardio Sessions</Text>
              <Text style={styles.cardioSubtitle}>Intervals, HIIT & more</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.startCardioButton} onPress={() => navigation.navigate('WorkoutSaveScreen')}>
            <Text style={styles.startCardioButtonText}>Start Cardio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.createNewButton} onPress={() => navigation.navigate('Create')}>
            <Text style={styles.createNewButtonText}>Create New</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={footerStyles.footerBtn} onPress={() => navigation.navigate('Exercise')}>
          <Ionicons name="barbell-outline" size={26} color="#7B61FF" />
          <Text style={footerStyles.footerLabel}>Workouts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={footerStyles.footerBtn} onPress={() => navigation.navigate('Create')}>
          <Ionicons name="add-circle-outline" size={26} color="#7B61FF" />
          <Text style={footerStyles.footerLabel}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={footerStyles.footerBtn} onPress={() => navigation.navigate('WorkoutSaveScreen')}>
          <Ionicons name="bookmark-outline" size={26} color="#7B61FF" />
          <Text style={footerStyles.footerLabel}>Saved</Text>
        </TouchableOpacity>
        <TouchableOpacity style={footerStyles.footerBtn} onPress={() => navigation.navigate('Workouts')}>
          <Ionicons name="bookmark-outline" size={26} color="#7B61FF" />
          <Text style={footerStyles.footerLabel}>History</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: GRAY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summarySection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryIcon: {
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 30,
  },
  recentItem: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recentColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  recentTime: {
    fontSize: 14,
    color: GRAY,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  statsSection: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statsLabel: {
    fontSize: 16,
    color: '#374151',
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  lastStatsRow: {
    borderBottomWidth: 0,
  },
});

const footerStyles = StyleSheet.create({
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingBottom: 20, // Extra padding for safe area
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80, // Increased height to accommodate safe area
    zIndex: 10,
  },
  footerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 8, // Add horizontal padding for better spacing
  },
  footerLabel: {
    fontSize: 12, // Slightly smaller font to ensure it fits
    color: '#7B61FF',
    marginTop: 4,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});