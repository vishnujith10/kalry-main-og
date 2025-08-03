import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#7B61FF',
  background: '#F9FAFB',
  card: '#fff',
  gray: '#B0B0B0',
  dark: '#181A20',
  border: '#E5E7EB',
  blue: '#7B61FF',
  blueLight: '#EDE9FE',
  purple: '#A084E8',
  red: '#F472B6',
};

const FILTERS = ['All', 'This Week', 'This Month', 'By Type'];

const mockAnalytics = {
  workouts: 5,
  calories: 1250,
  minutes: 225,
  bars: [2, 4, 1, 5, 3, 4, 2],
};

const mockWorkouts = [
  {
    id: 1,
    date: 'Today',
    name: 'Upper Body Strength',
    kcal: 320,
    min: 35,
    exercises: 6,
  },
  {
    id: 2,
    date: 'Yesterday',
    name: 'Yoga Flow',
    kcal: 110,
    min: 20,
    exercises: 4,
  },
  {
    id: 3,
    date: 'July 8',
    name: 'HIIT Cardio',
    kcal: 450,
    min: 45,
    exercises: 8,
  },
];

export default function WorkoutHistoryScreen() {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(0);
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.headerTitle}>Workout History</Text>
        <Text style={styles.headerSubtitle}>Track your fitness journey</Text>
        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={20} color={COLORS.gray} style={{ marginLeft: 12, marginRight: 6 }} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search workouts..."
            placeholderTextColor={COLORS.gray}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f, idx) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, selectedFilter === idx && styles.filterChipActive]}
              onPress={() => setSelectedFilter(idx)}
            >
              <Text style={[styles.filterChipText, selectedFilter === idx && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Analytics Card */}
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsCol}><Text style={styles.analyticsLabel}>Workouts</Text><Text style={styles.analyticsValue}>{mockAnalytics.workouts}</Text></View>
            <View style={styles.analyticsCol}><Text style={styles.analyticsLabel}>Calories</Text><Text style={styles.analyticsValue}>{mockAnalytics.calories.toLocaleString()}</Text></View>
            <View style={styles.analyticsCol}><Text style={styles.analyticsLabel}>Minutes</Text><Text style={styles.analyticsValue}>{Math.floor(mockAnalytics.minutes / 60)}h {mockAnalytics.minutes % 60}m</Text></View>
          </View>
          {/* Bar Chart */}
          <View style={styles.barChartRow}>
            {mockAnalytics.bars.map((v, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: 16 * v }]} />
                <View style={styles.barBg} />
              </View>
            ))}
          </View>
        </View>
        {/* Saved Workouts List */}
        <FlatList
          data={mockWorkouts}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.workoutCard}>
              <Text style={styles.workoutDate}>{item.date}</Text>
              <Text style={styles.workoutName}>{item.name}</Text>
              <View style={styles.workoutStatsRow}>
                <MaterialCommunityIcons name="fire" size={16} color={COLORS.red} style={{ marginRight: 4 }} />
                <Text style={styles.workoutStat}>{item.kcal} kcal</Text>
                <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.gray} style={{ marginLeft: 12, marginRight: 4 }} />
                <Text style={styles.workoutStat}>{item.min} min</Text>
                <MaterialCommunityIcons name="arm-flex" size={16} color={COLORS.purple} style={{ marginLeft: 12, marginRight: 4 }} />
                <Text style={styles.workoutStat}>{item.exercises} exercises</Text>
              </View>
              <View style={styles.workoutBtnRow}>
                <TouchableOpacity style={styles.repeatBtn}><Text style={styles.repeatBtnText}>Repeat Workout</Text></TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => navigation.navigate('Exercise', { workout: item })}
                >
                  <Text style={styles.detailsBtnText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailsBtn, { backgroundColor: COLORS.blue }]}
                  onPress={() => navigation.navigate('EditWorkoutScreen', { workout: item })}
                >
                  <Text style={styles.detailsBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      </ScrollView>
      {/* Custom Footer Bar */}
      <View style={footerStyles.footerBar}>
        <TouchableOpacity style={footerStyles.footerBtn} onPress={() => navigation.navigate('Exercise')}>
          <Ionicons name="fitness-outline" size={26} color={COLORS.primary} />
          <Text style={footerStyles.footerLabel}>Exercise</Text>
        </TouchableOpacity>
        <TouchableOpacity style={footerStyles.footerBtn} onPress={() => navigation.navigate('Create')}>
          <Ionicons name="add-circle-outline" size={26} color={COLORS.primary} />
          <Text style={footerStyles.footerLabel}>Create</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark, marginTop: 24, marginLeft: 18 },
  headerSubtitle: { color: COLORS.gray, fontSize: 15, marginLeft: 18, marginBottom: 8 },
  searchBarWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 4, height: 44 },
  searchBar: { flex: 1, fontSize: 16, color: COLORS.dark, backgroundColor: 'transparent', paddingHorizontal: 8 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 12, marginVertical: 14 },
  filterChip: { backgroundColor: COLORS.card, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 18, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.blueLight },
  filterChipText: { color: COLORS.gray, fontWeight: 'bold', fontSize: 15 },
  filterChipTextActive: { color: COLORS.primary },
  analyticsCard: { backgroundColor: COLORS.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  analyticsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  analyticsCol: { alignItems: 'center', flex: 1 },
  analyticsLabel: { color: COLORS.gray, fontSize: 13, marginBottom: 2 },
  analyticsValue: { color: COLORS.primary, fontWeight: 'bold', fontSize: 18 },
  barChartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2, marginHorizontal: 8 },
  barCol: { alignItems: 'center', width: 18, height: 40, justifyContent: 'flex-end' },
  bar: { width: 12, borderRadius: 6, backgroundColor: COLORS.primary, marginBottom: 2 },
  barBg: { width: 12, height: 16, borderRadius: 6, backgroundColor: COLORS.blueLight, position: 'absolute', bottom: 0 },
  workoutCard: { backgroundColor: COLORS.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  workoutDate: { color: COLORS.gray, fontSize: 13, marginBottom: 2 },
  workoutName: { fontWeight: 'bold', fontSize: 17, color: COLORS.dark, marginBottom: 8 },
  workoutStatsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  workoutStat: { color: COLORS.dark, fontSize: 14, fontWeight: '600' },
  workoutBtnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  repeatBtn: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: COLORS.card },
  repeatBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
  detailsBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  detailsBtnText: { color: COLORS.card, fontWeight: 'bold', fontSize: 15 },
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
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: 'bold',
  },
}); 