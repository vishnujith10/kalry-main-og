import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Platform, findNodeHandle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const PRIMARY = '#7B61FF';
const BG = '#F7F7FA';
const CARD = '#fff';
const GRAY = '#6B7280';
const LEVEL_COLORS = {
  Beginner: '#22C55E',
  Intermediate: '#A084E8',
  Advanced: '#F472B6',
};

function AnimatedChip({ label, selected, onPress, chipRef }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(selected ? 1.12 : 1);
  }, [selected]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: selected ? '#EDE9FE' : '#F3F4F6',
    shadowColor: selected ? PRIMARY : 'transparent',
    shadowOpacity: selected ? 0.12 : 0,
    shadowRadius: selected ? 8 : 0,
    elevation: selected ? 3 : 0,
  }));
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{ marginRight: 8 }}
    >
      <Animated.View style={[styles.chip, animatedStyle]} ref={chipRef}>
        <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function AnimatedWorkoutCard({ item, getWorkoutIcon, navigation }) {
  const scale = useSharedValue(1);
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const addScale = useSharedValue(1);
  const animatedAddStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addScale.value }],
  }));
  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={{ flex: 1 }}
      onPress={() => navigation.navigate('ExerciseDetail', { workout: item })}
    >
      <Animated.View style={[styles.workoutCard, animatedCardStyle]}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={getWorkoutIcon(item)} size={28} color={PRIMARY} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.workoutTitle}>{item.workout || item.name}</Text>
          <Text style={styles.workoutSub}>{[item.body_part, item.equipment].filter(Boolean).join(' • ')}</Text>
        </View>
        {item.level && (
          <View style={[styles.levelPill, { backgroundColor: LEVEL_COLORS[item.level] || '#EDE9FE' }] }>
            <Text style={[styles.levelText, { color: LEVEL_COLORS[item.level] ? '#fff' : '#7B61FF' }]}>{item.level}</Text>
          </View>
        )}
        <TouchableOpacity
          onPressIn={() => { addScale.value = withSpring(1.18); }}
          onPressOut={() => { addScale.value = withSpring(1); }}
          style={{ marginLeft: 10 }}
        >
          <Animated.View style={[styles.addBtn, animatedAddStyle]}>
            <Ionicons name="add" size={22} color={PRIMARY} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CategoryWorkoutsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { type: category, workouts = [] } = route.params || {};

  // Extract unique muscle groups for filter chips
  const muscleGroups = useMemo(() => {
    const groups = new Set();
    workouts.forEach(w => {
      if (w.body_part) {
        w.body_part.split(',').forEach(bp => groups.add(bp.trim()));
      }
    });
    return ['All', ...Array.from(groups).filter(Boolean)];
  }, [workouts]);

  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  // For auto-centering chips
  const chipRefs = useRef([]);
  // Ensure refs array matches muscleGroups length, always reset before render
  if (chipRefs.current.length !== muscleGroups.length) {
    chipRefs.current = muscleGroups.map(() => React.createRef());
  }
  const scrollViewRef = useRef();

  // When selectedGroup changes, scroll the chip into view
  useEffect(() => {
    const idx = muscleGroups.indexOf(selectedGroup);
    const chipRef = chipRefs.current[idx]?.current;
    if (
      idx !== -1 &&
      chipRef &&
      scrollViewRef.current &&
      typeof chipRef.measureLayout === 'function'
    ) {
      chipRef.measureLayout(
        findNodeHandle(scrollViewRef.current),
        (x, y, width, height) => {
          // Center the chip in the ScrollView
          scrollViewRef.current.scrollTo({
            x: x - 150 + width / 2, // 150 is half the screen width (approx)
            animated: true,
          });
        }
      );
    }
  }, [selectedGroup, muscleGroups]);

  // Filtered workouts
  const filteredWorkouts = useMemo(() => {
    return workouts.filter(w => {
      const matchesGroup = selectedGroup === 'All' || (w.body_part && w.body_part.split(',').map(bp => bp.trim()).includes(selectedGroup));
      const matchesSearch = w.workout && w.workout.toLowerCase().includes(search.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [workouts, search, selectedGroup]);

  // Icon selection based on type or body_part (fallback)
  function getWorkoutIcon(w) {
    if (w.type && w.type.toLowerCase().includes('push')) return 'arm-flex';
    if (w.type && w.type.toLowerCase().includes('pull')) return 'weight-lifter';
    if (w.body_part && w.body_part.toLowerCase().includes('chest')) return 'dumbbell';
    if (w.body_part && w.body_part.toLowerCase().includes('shoulder')) return 'human-male';
    if (w.body_part && w.body_part.toLowerCase().includes('tricep')) return 'arm-flex';
    if (w.body_part && w.body_part.toLowerCase().includes('back')) return 'arrow-left'; // valid MaterialCommunityIcons icon
    if (w.body_part && w.body_part.toLowerCase().includes('legs')) return 'run-fast';
    return 'dumbbell';
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 8, marginLeft: 18 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={28} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Lexend-SemiBold', fontSize: 22, color: '#181A20' }}>{category} Workouts</Text>
        <MaterialCommunityIcons name={getWorkoutIcon({ type: category })} size={28} color={PRIMARY} style={{ marginLeft: 10 }} />
      </View>
      {/* Subtitle */}
      <Text style={{ fontFamily: 'Manrope-Regular', fontSize: 15, color: '#888', marginLeft: 18, marginBottom: 8 }}>
        Target your {category && category.toLowerCase()} muscles
      </Text>
      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <Ionicons name="search" size={20} color={GRAY} style={{ marginLeft: 12, marginRight: 6 }} />
        <TextInput
          style={styles.searchBar}
          placeholder={`Search ${category ? category.toLowerCase() : ''} workouts`}
          placeholderTextColor="#B0B0B0"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {/* Filter Chips */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginVertical: 14, marginLeft: 10, minHeight: 48 }}
        contentContainerStyle={{ alignItems: 'center', paddingRight: 10 }}
      >
        {muscleGroups.map((group, idx) => (
          <AnimatedChip
            key={group}
            label={group}
            selected={selectedGroup === group}
            onPress={() => setSelectedGroup(group)}
            chipRef={el => (chipRefs.current[idx] = el)}
          />
        ))}
      </ScrollView>
      {/* Workouts List */}
      <FlatList
        data={filteredWorkouts}
        keyExtractor={(item, idx) => item.id ? String(item.id) : String(idx)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1, justifyContent: 'flex-start' }}
        ListHeaderComponent={<View style={{ height: 4 }} />}
        ListFooterComponent={<View style={{ height: 24 }} />}
        renderItem={({ item }) => (
          <AnimatedWorkoutCard item={item} getWorkoutIcon={getWorkoutIcon} navigation={navigation} />
        )}
        ListEmptyComponent={<Text style={{ color: GRAY, margin: 20 }}>No workouts found for this filter.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBarWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 16, marginHorizontal: 16, marginBottom: 4, height: 44 },
  searchBar: { flex: 1, fontFamily: 'Manrope-Regular', fontSize: 16, color: '#181A20', backgroundColor: 'transparent', paddingHorizontal: 8 },
  chip: { minHeight: 36, minWidth: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 7, marginVertical: 2, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 1 } }) },
  chipText: { fontFamily: 'Manrope-Regular', fontSize: 15, color: '#888' },
  chipTextActive: { color: '#7B61FF', fontFamily: 'Manrope-Bold' },
  workoutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 16, marginBottom: 16, padding: 16, shadowColor: '#181A20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 5, minHeight: 80 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F0FF', alignItems: 'center', justifyContent: 'center' },
  workoutTitle: { fontFamily: 'Lexend-SemiBold', fontSize: 17, color: '#181A20' },
  workoutSub: { fontFamily: 'Manrope-Regular', fontSize: 14, color: '#888', marginTop: 2 },
  levelPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  levelText: { fontFamily: 'Manrope-Bold', fontSize: 13 },
  addBtn: { backgroundColor: '#F3F0FF', borderRadius: 16, padding: 6 },
}); 