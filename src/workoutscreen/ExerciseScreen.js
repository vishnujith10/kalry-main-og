import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

// Add FooterBar component
const FooterBar = ({ navigation, activeTab }) => {
  const tabs = [
    {
      key: 'Workouts',
      label: 'Workouts',
      icon: <Ionicons name="barbell-outline" size={24} color={activeTab === 'Exercise' ? '#7B61FF' : '#232B3A'} />,
      route: 'Exercise',
    },
    
    {
      key: 'Create',
      label: 'Create',
      icon: <Ionicons name="add-circle-outline" size={24} color={activeTab === 'Create' ? '#232B3A' : '#232B3A'} />,
      route: 'Create',
    },
    {
      key: 'Saved',
      label: 'Saved',
      icon: <Ionicons name="bookmark-outline" size={24} color={activeTab === 'WorkoutSaveScreen' ? '#7B61FF' : '#232B3A'} />,
      route: 'WorkoutSaveScreen',
    },
    {
      key: 'History',
      label: 'History',
      icon: <Ionicons name="bookmark-outline" size={24} color={activeTab === 'Workouts' ? '#7B61FF' : '#232B3A'} />,
      route: 'Workouts',
    },
  ];

  return (
    <View style={footerStyles.container}>
      <View style={footerStyles.ovalFooter}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              footerStyles.tab,
              tab.key === activeTab && footerStyles.activeTab
            ]}
            onPress={() => navigation.navigate(tab.route)}
            activeOpacity={0.7}
          >
            {React.cloneElement(tab.icon, {
              color: tab.key === activeTab ? '#7B61FF' : '#232B3A',
            })}
            <Text
              style={[
                footerStyles.label,
                tab.key === activeTab && footerStyles.activeLabel
              ]}
            >
              {tab.label}
            </Text>
            {tab.key === activeTab && <View style={footerStyles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function ExerciseScreen() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  // Get current week dates (Monday to Sunday)
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    
    // Calculate days to subtract to get to Monday (1)
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    monday.setDate(today.getDate() - daysToMonday);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push({
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    return weekDates;
  };

  const currentWeekDates = getCurrentWeekDates();
  const today = new Date();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    fetch('http://192.168.1.10:3000/api/exercise')
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
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110, paddingTop: 20 }}>
        {/* Calendar Widget */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarMonth}>{monthNames[today.getMonth()]} {today.getFullYear()}</Text>
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
              {currentWeekDates.map((day, i) => (
                <View key={i} style={[styles.dateCell, day.isToday && styles.activeDateCell]}>
                  <Text style={[styles.dateText, day.isToday && styles.activeDateText]}>
                    {day.date}
                  </Text>
                  {day.isToday && <View style={styles.activeDateDots} />}
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
              <Text style={styles.summaryValue}>
                <Text style={{ fontFamily: 'Lexend-SemiBold' }}>{s.value}</Text> 
                <Text style={styles.summaryUnit}>{s.unit}</Text>
              </Text>
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
            <View style={styles.recentDotWrap}>
              <View style={[styles.recentDot, { backgroundColor: r.color }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentTitle}>{r.title}</Text>
              <Text style={styles.recentTime}>{r.time}</Text>
            </View>
            <TouchableOpacity style={{ marginRight: 8 }}>
              <Ionicons name="pencil-outline" size={18} color={GRAY} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="trash-outline" size={18} color={GRAY} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      
      <FooterBar navigation={navigation} activeTab="Workout" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    minHeight: 65,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    justifyContent: 'center',
    textAlign: 'center',
  },
  header: { 
    fontFamily: 'Lexend-SemiBold', 
    fontSize: 22, 
    color: '#181A20', 
    marginTop: 24, 
    marginBottom: 8, 
    marginLeft: 18 
  },
  daysRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginHorizontal: 8, 
    marginBottom: 38, 
    marginTop: 20 
  },
  dayCol: { 
    alignItems: 'center', 
    flex: 1, 
    marginHorizontal: 2 
  },
  dayColActive: { 
    backgroundColor: '#EDE9FE', 
    borderRadius: 20, 
    padding: 6 
  },
  dayColInactive: { 
    backgroundColor: '#F3F4F6', 
    borderRadius: 20, 
    padding: 6 
  },
  dayText: { 
    fontFamily: 'Lexend-SemiBold', 
    fontSize: 16, 
    marginBottom: 2 
  },
  dayTextActive: { 
    color: '#7B61FF' 
  },
  dayTextInactive: { 
    color: '#B0B0B0' 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginTop: 2 
  },
  dotActive: { 
    backgroundColor: '#7B61FF' 
  },
  dotInactive: { 
    backgroundColor: '#E5E7EB' 
  },

  // Calendar Card Styles
  calendarCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: '#181A20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonth: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 20,
    color: '#181A20',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F2',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 13,
    color: '#181A20',
  },
  calendarGrid: {
    marginBottom: 16,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#9CA3AF',
    width: 40,
    textAlign: 'center',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateCell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeDateCell: {
    backgroundColor: '#7B61FF',
    borderRadius: 20,
  },
  dateText: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 14,
    color: '#181A20',
  },
  activeDateText: {
    color: '#fff',
  },
  activeDateDots: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    gap: 2,
  },
  weekProgressSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  weekProgressText: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 14,
    color: '#181A20',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    width: '57%', // 4/7 = 57%
    backgroundColor: '#7B61FF',
    borderRadius: 3,
  },

  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginHorizontal: 18, 
    marginBottom: 18 
  },
  summaryCard: { 
    flex: 1, 
    backgroundColor: CARD, 
    borderRadius: 18, 
    padding: 18, 
    marginHorizontal: 4, 
    alignItems: 'center', 
    shadowColor: '#181A20', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.10, 
    shadowRadius: 12, 
    elevation: 5 
  },
  summaryValue: { 
    fontFamily: 'Lexend-SemiBold', 
    fontSize: 22, 
    color: '#181A20' 
  },
  summaryUnit: { 
    fontFamily: 'Lexend-Regular', 
    fontSize: 14, 
    color: '#888' 
  },
  summaryLabel: { 
    fontFamily: 'Manrope-Regular', 
    fontSize: 14, 
    color: '#888', 
    marginTop: 2 
  },
  startCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: CARD, 
    borderRadius: 18, 
    padding: 18, 
    marginHorizontal: 18, 
    marginBottom: 18, 
    shadowColor: '#181A20', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.10, 
    shadowRadius: 12, 
    elevation: 5 
  },
  startTitle: { 
    fontFamily: 'Lexend-SemiBold', 
    fontSize: 16, 
    color: '#181A20' 
  },
  startSub: { 
    fontFamily: 'Manrope-Regular', 
    fontSize: 13, 
    color: '#888' 
  },
  
  // Explore Exercises Card Styles
  exploreCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: '#181A20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  exploreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreTitle: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 20,
    color: '#181A20',
    marginBottom: 2,
  },
  exploreSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#A084E8',
  },
  browseButton: {
    backgroundColor: '#7B61FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  browseButtonText: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 16,
    color: '#fff',
  },

  // Cardio Sessions Card Styles
  cardioCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 18,
    marginBottom: 18,
    shadowColor: '#181A20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  cardioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardioIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardioTitle: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 18,
    color: '#181A20',
    marginBottom: 2,
  },
  cardioSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#A084E8',
  },
  startCardioButton: {
    backgroundColor: '#7B61FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  startCardioButtonText: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  createNewButton: {
    backgroundColor: '#F3F0FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createNewButtonText: {
    fontFamily: 'Lexend-SemiBold',
    fontSize: 16,
    color: '#7B61FF',
  },

  recentHeader: { 
    fontFamily: 'Lexend-SemiBold', 
    fontSize: 18, 
    color: '#181A20', 
    marginLeft: 18, 
    marginBottom: 10 
  },
  recentCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: CARD, 
    borderRadius: 16, 
    marginHorizontal: 18, 
    marginBottom: 12, 
    padding: 16, 
    shadowColor: '#181A20', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.10, 
    shadowRadius: 12, 
    elevation: 5 
  },
  recentDotWrap: { 
    width: 18, 
    alignItems: 'center', 
    marginRight: 8 
  },
  recentDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5 
  },
  recentTitle: { 
    fontFamily: 'Lexend-SemiBold', 
    fontSize: 15, 
    color: '#181A20' 
  },
  recentTime: { 
    fontFamily: 'Manrope-Regular', 
    fontSize: 13, 
    color: '#888' 
  },
});

const footerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    zIndex: 100,
  },
  ovalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 35,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 16,
    // Add backdrop filter effect for iOS
    ...(Platform.OS === 'ios' && {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    position: 'relative',
  },
  activeTab: {
    // Additional styling for active tab if needed
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    color: '#232B3A',
    letterSpacing: 0.1,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#7B61FF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -12,
    width: 30,
    height: 3,
    backgroundColor: '#7B61FF',
    borderRadius: 2,
  },
});
