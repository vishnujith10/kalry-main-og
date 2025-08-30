import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import supabase from '../lib/supabase';
import { saveWorkout } from '../lib/workoutApi';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  shadow: '#000000',
};

export default function StartWorkoutScreen({ navigation, route }) {
  const [exercises, setExercises] = useState([]);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  
  const timerStartedRef = useRef(false);
  const workoutTimeRef = useRef(0);
  const previousExercisesRef = useRef([]);
  const intentionallyClearingRef = useRef(false);

  // Generate unique ID
  const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Timer functionality
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setWorkoutTime(time => {
          const newTime = time + 1;
          workoutTimeRef.current = newTime;
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Start workout timer only once
  useEffect(() => {
    if (!timerStartedRef.current) {
      setIsRunning(true);
      timerStartedRef.current = true;
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = () => {
    const today = new Date();
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return today.toLocaleDateString('en-US', options);
  };

  const formatStartTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTotalStats = () => {
    const totalKcal = exercises.reduce((sum, ex) => sum + (ex.kcal || 0), 0);
    const totalWeight = exercises.reduce((sum, ex) => {
      if (ex.type === 'Strength') {
        return sum + ex.sets.reduce((setSum, set) => setSum + ((set.weight || 0) * (set.reps || 0)), 0);
      }
      return sum;
    }, 0);
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    return { totalKcal, totalWeight, totalSets };
  };

  const addSet = (exerciseId) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    const newSet = {
      id: generateUniqueId(),
      weight: '',
      reps: '',
      completed: false,
    };
    
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, sets: [...ex.sets, newSet] }
        : ex
    ));
  };

  const updateSet = (exerciseId, setId, field, value) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? { 
            ...ex, 
            sets: ex.sets.map(set => 
              set.id === setId ? { ...set, [field]: value } : set
            )
          }
        : ex
    ));
  };

  const toggleSetCompletion = (exerciseId, setId) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? { 
            ...ex, 
            sets: ex.sets.map(set => 
              set.id === setId ? { ...set, completed: !set.completed } : set
            )
          }
        : ex
    ));
  };

  const deleteSet = (exerciseId, setId) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? { 
            ...ex, 
            sets: ex.sets.length > 1 
              ? ex.sets.filter(set => set.id !== setId)
              : ex.sets // Keep at least one set
          }
        : ex
    ));
  };

  const deleteExercise = (exerciseId) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            setExercises(exercises.filter(ex => ex.id !== exerciseId));
          }
        },
      ]
    );
  };

  async function handleFinishWorkout() {
    setSavingWorkout(true);
    setSaveError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('User not logged in');
      
      const preparedExercises = exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          reps: set.reps ? parseInt(set.reps) || 0 : null,
          weight: set.weight ? parseFloat(set.weight) || 0 : null,
        }))
      }));
      
      const workout = await saveWorkout({
        userId,
        date: new Date().toISOString().slice(0,10),
        duration: workoutTime,
        totalKcal: getTotalStats().totalKcal,
        notes: '',
        exercises: preparedExercises,
        isRoutine: false,
      });
      
      Alert.alert(
        'Workout Completed!',
        `Great job! Your workout has been saved.\nDuration: ${formatTime(workoutTime)}\nCalories: ${getTotalStats().totalKcal} kcal`,
        [
          { 
            text: 'View Recent Workouts', 
            onPress: () => navigation.navigate('Workouts')
          },
        ]
      );
      
      intentionallyClearingRef.current = true;
      setExercises([]);
    } catch (e) {
      console.error('Error saving workout:', e);
      setSaveError(e.message || 'Failed to save workout.');
    } finally {
      setSavingWorkout(false);
    }
  }

  const handleDiscardWorkout = () => {
    Alert.alert(
      'Discard Workout',
      'Are you sure you want to discard this workout? All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive', 
          onPress: () => {
            intentionallyClearingRef.current = true;
            setExercises([]);
            setWorkoutTime(0);
            setIsRunning(false);
            timerStartedRef.current = false;
            workoutTimeRef.current = 0;
            navigation.navigate('Exercise');
          }
        },
      ]
    );
  };

  const { totalKcal, totalWeight, totalSets } = getTotalStats();



  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleDiscardWorkout}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Workout Session</Text>
          
          <TouchableOpacity 
            style={styles.endButton}
            onPress={handleFinishWorkout}
          >
            <Text style={styles.endButtonText}>End Workout</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.dateText}>{formatDate()}</Text>
        
        <View style={styles.timerRow}>
          <View style={styles.timerIndicator}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>Started {formatStartTime()} ({formatTime(workoutTime)})</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame-outline" size={20} color={COLORS.warning} />
          <Text style={styles.statLabel}>{totalKcal} kcal</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={20} color={COLORS.success} />
          <Text style={styles.statLabel}>{formatTime(workoutTime)}</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="weight-kilogram" size={20} color={COLORS.accent} />
          <Text style={styles.statLabel}>{totalWeight} kg</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalSets}</Text>
        </View>
      </View>

      {/* Exercises List */}
      <ScrollView 
        style={styles.exercisesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.exercisesContent}
      >
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons 
              name="dumbbell" 
              size={64} 
              color={COLORS.textLight} 
            />
            <Text style={styles.emptyStateTitle}>No Exercises Added</Text>
            <Text style={styles.emptyStateSubtitle}>
              Tap &quot;Add Exercise&quot; below to start building your workout
            </Text>
          </View>
        ) : (
          exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIconContainer}>
                <MaterialCommunityIcons 
                  name="dumbbell" 
                  size={24} 
                  color={COLORS.primary} 
                />
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.workout || exercise.name || 'Unnamed Exercise'}</Text>
                <Text style={styles.exerciseMuscle}>{exercise.muscle || exercise.body_part || 'Exercise'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => setEditingExerciseId(editingExerciseId === exercise.id ? null : exercise.id)}
              >
                <Text style={styles.editButtonText}>
                  {editingExerciseId === exercise.id ? 'Done' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sets */}
            {exercise.sets.map((set, index) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setLabel}>Set {index + 1}</Text>
                <View style={styles.setInputs}>
                  <TextInput
                    style={styles.setInput}
                    value={set.weight}
                    onChangeText={(text) => updateSet(exercise.id, set.id, 'weight', text)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                  <Text style={styles.setUnit}>kg</Text>
                  <Text style={styles.setSeparator}>•</Text>
                  <TextInput
                    style={styles.setInput}
                    value={set.reps}
                    onChangeText={(text) => updateSet(exercise.id, set.id, 'reps', text)}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                  <Text style={styles.setUnit}>reps</Text>
                </View>
                <TouchableOpacity
                  style={[styles.checkBox, set.completed && styles.checkBoxCompleted]}
                  onPress={() => toggleSetCompletion(exercise.id, set.id)}
                >
                  {set.completed && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
                
                {editingExerciseId === exercise.id && (
                  <TouchableOpacity
                    style={styles.deleteSetButton}
                    onPress={() => deleteSet(exercise.id, set.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Add Set Button */}
            <TouchableOpacity 
              style={styles.addSetButton}
              onPress={() => addSet(exercise.id)}
            >
              <Ionicons name="add" size={16} color={COLORS.primary} />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </View>
          ))
        )}
      </ScrollView>

      {/* Add Exercise Button */}
      <TouchableOpacity 
        style={styles.addExerciseButton}
        onPress={() => {
          navigation.navigate('AllExercisesScreen', {
            onExercisesSelected: (selectedExercises) => {
              setExercises(prev => [
                ...prev,
                ...selectedExercises.map(ex => ({
                  ...ex,
                  id: generateUniqueId(),
                  sets: [{ id: generateUniqueId(), weight: '', reps: '', completed: false }]
                }))
              ]);
            },
            onSelect: (selectedExercise) => {
              setExercises(prev => [
                ...prev,
                {
                  ...selectedExercise,
                  id: generateUniqueId(),
                  sets: [{ id: generateUniqueId(), weight: '', reps: '', completed: false }]
                }
              ]);
            }
          });
        }}
      >
        <Ionicons name="add" size={20} color={COLORS.white} />
        <Text style={styles.addExerciseText}>Add Exercise</Text>
      </TouchableOpacity>

      {saveError && (
        <Text style={styles.errorText}>{saveError}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  endButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  endButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  exercisesList: {
    flex: 1,
  },
  exercisesContent: {
    padding: 20,
    paddingBottom: 100,
  },
  exerciseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  exerciseMuscle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  setLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    width: 50,
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  setInput: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'center',
  },
  setUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
    marginRight: 12,
  },
  setSeparator: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginRight: 12,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkBoxCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  deleteSetButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  addSetText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  addExerciseButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  addExerciseText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});