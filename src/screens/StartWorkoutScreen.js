import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions,
  Modal,
  Alert,
  StatusBar,
  FlatList,
  Image,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import supabase from '../lib/supabase';
import { fetchExercises, saveWorkout } from '../lib/workoutApi';
import { Picker } from '@react-native-picker/picker';
import { v4 as uuidv4 } from 'uuid';
import { LineChart } from 'react-native-chart-kit';
import { Vibration } from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  shadow: '#000000',
};

const SHADOWS = {
  card: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
};

const initialExercises = [
  {
    id: 1,
    name: 'Dumbbell Bench Press',
    type: 'Strength',
    kcal: 56,
    details: 'Chest • Strength • 56 kcal',
    sets: [
      { id: 1, reps: 12, weight: 20, rpe: 7, completed: true },
      { id: 2, reps: 10, weight: 25, rpe: 8, completed: true },
      { id: 3, reps: 8, weight: 30, rpe: 9, completed: false },
    ],
  },
  {
    id: 2,
    name: 'Jump Rope',
    type: 'Cardio',
    kcal: 75,
    details: 'Cardio • 75 kcal',
    duration: '15:00',
    intensity: 'Moderate',
    sets: [
      { id: 1, duration: '5:00', completed: true },
      { id: 2, duration: '5:00', completed: true },
      { id: 3, duration: '5:00', completed: false },
    ],
  },
];

const exerciseLibrary = [
  { name: 'Push-ups', type: 'Strength', muscle: 'Chest', kcal: 45 },
  { name: 'Squats', type: 'Strength', muscle: 'Legs', kcal: 52 },
  { name: 'Running', type: 'Cardio', muscle: 'Full Body', kcal: 120 },
  { name: 'Plank', type: 'Core', muscle: 'Core', kcal: 25 },
];

function StrengthExerciseCard({ exercise, onAddSet, onEditSet, onDeleteSet, onDeleteExercise }) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.exerciseTitle}>{exercise.name}</Text>
        <TouchableOpacity onPress={() => onDeleteExercise(exercise.id)}>
          <Ionicons name="trash-outline" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.exerciseDetails}>{exercise.details}</Text>
      <View style={styles.setTableHeaderRow}>
        {['Set', 'Reps', 'Weight', 'RPE', ''].map((col, idx) => (
          <Text key={col} style={[styles.setTableHeaderText, idx === 0 && { textAlign: 'left' }]}>{col}</Text>
        ))}
      </View>
      {exercise.sets.map((set, idx) => (
        <View key={set.id} style={styles.setTableRow}>
          <Text style={[styles.setTableCell, { textAlign: 'left' }]}>{idx + 1}</Text>
          <Text style={styles.setTableCell}>{set.reps}</Text>
          <Text style={styles.setTableCell}>{set.weight} kg</Text>
          <Text style={styles.setTableCell}>{set.rpe}</Text>
          <View style={styles.setTableIcons}>
            <TouchableOpacity onPress={() => onEditSet(exercise.id, idx)} style={{ marginRight: 8 }}>
              <Ionicons name="pencil-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteSet(exercise.id, idx)}>
              <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.addSetBtn} onPress={() => onAddSet(exercise.id)}>
        <Text style={styles.addSetBtnText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

function CardioExerciseCard({ exercise, onAddSet, onEditSet, onDeleteSet, onDeleteExercise }) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.exerciseTitle}>{exercise.name}</Text>
        <TouchableOpacity onPress={() => onDeleteExercise(exercise.id)}>
          <Ionicons name="trash-outline" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.exerciseDetails}>{exercise.details}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Ionicons name="time-outline" size={18} color={COLORS.accent} style={{ marginRight: 6 }} />
        <Text style={{ color: '#334155', fontWeight: '600', fontSize: 15, marginRight: 16 }}>
          Duration: {exercise.duration}
        </Text>
        <Text style={{ color: '#64748B', fontSize: 15 }}>
          Intensity: <Text style={{ color: '#6366F1', fontWeight: '600' }}>{exercise.intensity}</Text>
        </Text>
      </View>
      {exercise.sets.map((set, idx) => (
        <View key={set.id} style={styles.setTableRow}>
          <Text style={[styles.setTableCell, { textAlign: 'left' }]}>Set {idx + 1}</Text>
          <Text style={styles.setTableCell}>{set.duration} min</Text>
          <View style={styles.setTableIcons}>
            <TouchableOpacity onPress={() => onEditSet(exercise.id, idx)} style={{ marginRight: 8 }}>
              <Ionicons name="pencil-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteSet(exercise.id, idx)}>
              <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.addSetBtn} onPress={() => onAddSet(exercise.id)}>
        <Text style={styles.addSetBtnText}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const INTENSITY_OPTIONS = ['Low', 'Moderate', 'High'];

// Filter options for better exercise discovery
const BODY_PARTS = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body',
  'Upper Body', 'Lower Body', 'Glutes', 'Abs', 'Biceps', 'Triceps',
  'Quadriceps', 'Hamstrings', 'Calves', 'Forearms', 'Neck'
];

const EQUIPMENT_TYPES = [
  'Bodyweight', 'Dumbbells', 'Barbell', 'Kettlebell', 'Resistance Bands',
  'Cable Machine', 'Smith Machine', 'Bench', 'Pull-up Bar', 'Dip Bars',
  'Medicine Ball', 'Stability Ball', 'Foam Roller', 'Yoga Mat', 'Treadmill',
  'Stationary Bike', 'Elliptical', 'Rowing Machine', 'Stair Stepper',
  'None', 'Other'
];

const EXERCISE_TYPES = ['Strength', 'Cardio', 'Flexibility', 'Balance', 'Plyometric'];
const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Abs', 'Obliques', 'Lower Back', 'Glutes', 'Quadriceps', 'Hamstrings',
  'Calves', 'Full Body', 'Core'
];

export default function StartWorkoutScreen({ navigation, route }) {
  const [exercises, setExercises] = useState([]);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showEditSet, setShowEditSet] = useState(false);
  const [editingSet, setEditingSet] = useState(null);

  const [formData, setFormData] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));





  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [exerciseDetail, setExerciseDetail] = useState(null);

  const [savingWorkout, setSavingWorkout] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showSaveSummary, setShowSaveSummary] = useState(false);
  const [savedWorkout, setSavedWorkout] = useState(null);
  const [invalidSets, setInvalidSets] = useState([]); // array of {exerciseId, setId}
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const timerStartedRef = useRef(false);
  const idCounterRef = useRef(0);
  const workoutTimeRef = useRef(0);
  const exercisesProcessedRef = useRef(false);
  const previousExercisesRef = useRef([]);
  const currentExercisesRef = useRef([]);
  const intentionallyClearingRef = useRef(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTime, setRestTime] = useState(60); // default 60s
  const [restCountdown, setRestCountdown] = useState(60);
  const restIntervalRef = useRef(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [workoutError, setWorkoutError] = useState('');

  // Generate unique ID
  const generateUniqueId = () => uuidv4();

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
      console.log('Starting timer for the first time');
      setIsRunning(true);
      timerStartedRef.current = true;
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      console.log('Timer already started, not restarting');
      // Restore timer state if component re-renders
      if (workoutTimeRef.current > 0 && workoutTime === 0) {
        console.log('Restoring timer state:', workoutTimeRef.current);
        setWorkoutTime(workoutTimeRef.current);
      }
    }
  }, []);

  // Prevent state reset when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset the processed flag when screen comes into focus
      exercisesProcessedRef.current = false;
      console.log('Screen focused, reset exercises processed flag');
      
      // Handle hardware back button
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Show discard confirmation if there are exercises
        if (exercises.length > 0) {
          Alert.alert(
            'Discard Workout',
            'You have unsaved exercises. Are you sure you want to discard this workout?',
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
                  exercisesProcessedRef.current = false;
                  navigation.navigate('Exercise');
                }
              },
            ]
          );
          return true; // Prevent default back behavior
        } else {
          // Navigate directly to the exercise screen if no exercises
          navigation.navigate('Exercise');
          return true; // Prevent default back behavior
        }
      });
      
      return () => {
        // Cleanup back handler
        backHandler.remove();
      };
    }, [navigation])
  );

  // No longer needed since we're using modal instead of navigation
  // useEffect(() => {
  //   // Route params handling removed - using modal instead
  // }, [route?.params?.selectedExercises]);





  // Add set to an exercise
  function handleAddSet(exerciseId, type) {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            // Set default cardioType for cardio exercises if not already set
            ...(type === 'Cardio' && !ex.cardioType ? { cardioType: 'Duration' } : {}),
            sets: [
              ...ex.sets,
              type === 'Cardio'
                ? { id: generateUniqueId(), duration: '', speed: '', distance: '' }
                : { id: generateUniqueId(), reps: '', weight: '' }
            ]
          }
        : ex
    ));
  }
  // Edit set (placeholder, implement modal for editing)
  function handleEditSet(exId, setIdx) {
    // Implement modal for editing set values
  }
  // Delete set
  function handleDeleteSet(exerciseId, setId) {
    Alert.alert('Delete Set', 'Are you sure you want to delete this set?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setExercises(prev => prev.map(ex =>
          ex.id === exerciseId
            ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
            : ex
        ));
      }},
    ]);
  }
  // Delete exercise
  function handleDeleteExercise(exId) {
    console.log('handleDeleteExercise called with exId:', exId);
    console.log('Current exercises before delete:', exercises.length);
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          console.log('Delete confirmed, removing exercise:', exId);
          setExercises(prev => {
            // Store previous state in ref
            previousExercisesRef.current = [...prev];
            console.log('Deleting exercise, storing previous state:', prev.length);
            const filtered = prev.filter(ex => ex.id !== exId);
            console.log('Exercises after delete:', filtered.length);
            return filtered;
          });
        }},
      ]
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // 1. Add unit to new exercises (default 'kg')
  const addExercise = (exercise) => {
    const newExercise = {
      id: generateUniqueId(),
      name: exercise.name,
      type: exercise.type,
      kcal: exercise.kcal,
      details: `${exercise.muscle} • ${exercise.type} • ${exercise.kcal} kcal`,
      sets: [],
      unit: 'kg', // default unit
    };
    setExercises([...exercises, newExercise]);
    setShowExerciseModal(false);
  };

  const deleteExercise = (id) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setExercises(exercises.filter(ex => ex.id !== id));
        }},
      ]
    );
  };

  const addSet = (exerciseId, type) => {
    const newSet = {
      id: generateUniqueId(),
      ...(type === 'Strength' 
        ? { reps: 0, weight: 0, rpe: 5, completed: false }
        : { duration: '0:00', completed: false }
      ),
    };
    
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, sets: [...ex.sets, newSet] }
        : ex
    ));
  };

  const updateSet = (exerciseId, setId, updates) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? { 
            ...ex, 
            sets: ex.sets.map(set => 
              set.id === setId ? { ...set, ...updates } : set
            )
          }
        : ex
    ));
  };

  const deleteSet = (exerciseId, setId) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
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

  const openEditSet = (exerciseId, set) => {
    setEditingSet({ exerciseId, set });
    setFormData(set);
    setShowEditSet(true);
  };

  const saveEditSet = () => {
    if (editingSet) {
      updateSet(editingSet.exerciseId, editingSet.set.id, formData);
      setShowEditSet(false);
      setEditingSet(null);
      setFormData({});
    }
  };

  async function handleFinishWorkout() {
    setSavingWorkout(true);
    setSaveError(null);
    try {
      // Get userId from Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('User not logged in');
      
      // Prepare exercises data with all fields
      const preparedExercises = exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          // Ensure all numeric fields are properly formatted
          reps: set.reps ? parseInt(set.reps) || 0 : null,
          weight: set.weight ? parseFloat(set.weight) || 0 : null,
          duration: set.duration || null,
          speed: set.speed ? parseFloat(set.speed) || 0 : null,
          distance: set.distance ? parseFloat(set.distance) || 0 : null,
        }))
      }));
      
      console.log('Saving workout with exercises:', preparedExercises.length);
      console.log('Exercise details:', preparedExercises.map(ex => ({
        name: ex.name || ex.workout,
        type: ex.type,
        cardioType: ex.cardioType,
        sets: ex.sets.length
      })));
      
      const workout = await saveWorkout({
        userId,
        date: new Date().toISOString().slice(0,10),
        duration: workoutTime,
        totalKcal: getTotalStats().totalKcal,
        notes: '',
        exercises: preparedExercises,
        isRoutine: false, // This is a completed workout, not a routine
      });
      setSavedWorkout(workout);
      setShowSaveSummary(true);
      intentionallyClearingRef.current = true;
      setExercises([]);
      
      // Show success message and navigate to Exercise screen
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
    } catch (e) {
      console.error('Error saving workout:', e);
      setSaveError(e.message || 'Failed to save workout.');
    } finally {
      setSavingWorkout(false);
    }
  }

  const { totalKcal, totalWeight, totalSets } = getTotalStats();







  // Change number of sets for an exercise
  function handleSetCountChange(exerciseId, count) {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      let sets = [...ex.sets];
      const n = parseInt(count) || 0;
      if (n > sets.length) {
        // Add sets
        for (let i = sets.length; i < n; i++) {
          sets.push({
            id: generateUniqueId(),
            reps: ex.type === 'Cardio' ? undefined : '',
            weight: ex.type === 'Cardio' ? undefined : '',
            duration: ex.type === 'Cardio' ? '' : undefined,
          });
        }
      } else if (n < sets.length) {
        // Remove sets
        sets = sets.slice(0, n);
      }
      return { ...ex, sets };
    }));
  }

  // Update set field
  function handleSetFieldChange(exerciseId, setId, field, value) {
    console.log('handleSetFieldChange called:', { exerciseId, setId, field, value });
    setExercises(prev => {
      // Store previous state in ref
      previousExercisesRef.current = [...prev];
      
      const updated = prev.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              // If setting cardioType, update the exercise level field
              ...(field === 'cardioType' ? { cardioType: value } : {}),
              // If setting type, update the exercise type and add cardioType if needed
              ...(field === 'type' ? { 
                type: value,
                ...(value === 'Cardio' ? { cardioType: 'Duration' } : {})
              } : {}),
              // If setting a set field, update the specific set
              sets: setId ? ex.sets.map(set =>
                set.id === setId ? { ...set, [field]: value } : set
              ) : ex.sets
            }
          : ex
      );
      console.log('Updated exercise:', updated.find(ex => ex.id === exerciseId)?.name, 'cardioType:', updated.find(ex => ex.id === exerciseId)?.cardioType);
      return updated;
    });
  }

  // Delete set
  function handleDeleteSet(exerciseId, setId) {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
        : ex
    ));
  }

  // Move set up/down
  function handleMoveSet(exerciseId, setId, direction) {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const idx = ex.sets.findIndex(set => set.id === setId);
      if (idx < 0) return ex;
      const sets = [...ex.sets];
      if (direction === 'up' && idx > 0) {
        [sets[idx - 1], sets[idx]] = [sets[idx], sets[idx - 1]];
      } else if (direction === 'down' && idx < sets.length - 1) {
        [sets[idx + 1], sets[idx]] = [sets[idx], sets[idx + 1]];
      }
      return { ...ex, sets };
    }));
  }

  // Ensure all cardio exercises have a default cardioType
  useEffect(() => {
    setExercises(prev => {
      const updated = prev.map(ex => 
        ex.type === 'Cardio' && !ex.cardioType 
          ? { ...ex, cardioType: 'Duration' }
          : ex
      );
      console.log('Updated cardio exercises:', updated.filter(ex => ex.type === 'Cardio').map(ex => ({ name: ex.name, cardioType: ex.cardioType })));
      return updated;
    });
  }, []);

  // Restore exercises from ref if they get lost during re-renders
  useEffect(() => {
    if (exercises.length === 0 && previousExercisesRef.current.length > 0 && !intentionallyClearingRef.current) {
      console.log('🔄 Restoring exercises from ref:', previousExercisesRef.current.length);
      setExercises([...previousExercisesRef.current]);
    }
    // Reset the flag after checking
    if (intentionallyClearingRef.current) {
      intentionallyClearingRef.current = false;
    }
  }, [exercises.length]);

  // Additional safety check - if exercises are 0 but current ref has data, restore
  useEffect(() => {
    if (exercises.length === 0 && currentExercisesRef.current.length > 0 && !intentionallyClearingRef.current) {
      console.log('🔄 Restoring exercises from current ref:', currentExercisesRef.current.length);
      setExercises([...currentExercisesRef.current]);
    }
  }, [exercises.length]);

  // No longer needed since we're using modal instead of navigation
  // const resetExercisesProcessed = () => {
  //   exercisesProcessedRef.current = false;
  //   console.log('Manually reset exercises processed flag');
  // };

  // Function to save routine
  const handleSaveRoutine = async () => {
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please add exercises before saving routine');
      return;
    }
    
    setSavingWorkout(true);
    try {
      // Get userId from Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('User not logged in');
      
      // Prepare exercises data
      const preparedExercises = exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          reps: set.reps ? parseInt(set.reps) || 0 : null,
          weight: set.weight ? parseFloat(set.weight) || 0 : null,
          duration: set.duration || null,
          speed: set.speed ? parseFloat(set.speed) || 0 : null,
          distance: set.distance ? parseFloat(set.distance) || 0 : null,
        }))
      }));
      
      const routine = await saveWorkout({
        userId,
        date: new Date().toISOString().slice(0,10),
        duration: workoutTime,
        totalKcal: getTotalStats().totalKcal,
        notes: 'Saved Routine',
        exercises: preparedExercises,
        isRoutine: true, // Mark as routine
      });
      
      Alert.alert(
        'Routine Saved',
        'Your workout routine has been saved successfully!',
        [
          { text: 'Continue Workout', style: 'cancel' },
          { 
            text: 'View Routines', 
            onPress: () => navigation.navigate('SavedWorkouts') // Navigate to saved routines screen
          },
        ]
      );
    } catch (e) {
      console.error('Error saving routine:', e);
      Alert.alert('Error', e.message || 'Failed to save routine.');
    } finally {
      setSavingWorkout(false);
    }
  };

  // Function to discard workout
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
            exercisesProcessedRef.current = false;
            navigation.navigate('Exercise');
          }
        },
      ]
    );
  };

  // Validation: check all sets for required fields
  useEffect(() => {
    console.log('Exercises state changed:', exercises.length, 'exercises');
    
    // Always sync current exercises with ref
    currentExercisesRef.current = [...exercises];
    
    if (exercises.length === 0 && previousExercisesRef.current.length > 0 && !intentionallyClearingRef.current) {
      console.log('⚠️ WARNING: Exercises reset to 0, but we have previous exercises in ref!');
      console.log('Previous exercises count:', previousExercisesRef.current.length);
    }
    
    const invalid = [];
    exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (ex.type === 'Cardio') {
          // Validate based on cardioType
          const cardioType = ex.cardioType || 'Duration';
          if (cardioType === 'Duration') {
            if (!set.duration || !set.speed) {
              invalid.push({ exerciseId: ex.id, setId: set.id });
            }
          } else if (cardioType === 'Speed') {
            if (!set.speed || !set.distance) {
              invalid.push({ exerciseId: ex.id, setId: set.id });
            }
          } else if (cardioType === 'Distance') {
            if (!set.distance || !set.duration) {
              invalid.push({ exerciseId: ex.id, setId: set.id });
            }
          } else if (cardioType === 'Sets & Reps') {
            if (!set.reps || !set.weight) {
              invalid.push({ exerciseId: ex.id, setId: set.id });
            }
          }
        } else {
          if (!set.reps || !set.weight) {
            invalid.push({ exerciseId: ex.id, setId: set.id });
          }
        }
      });
    });
    setInvalidSets(invalid);
  }, [exercises]);

  // 2. Add modal state for unit selection
  const [unitModal, setUnitModal] = useState({ visible: false, exerciseId: null });

  // 3. Add handler to update unit
  const handleUnitChange = (exerciseId, unit) => {
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId ? { ...ex, unit } : ex
    ));
    setUnitModal({ visible: false, exerciseId: null });
  };

  // Rest timer logic
  function startRestTimer(seconds=60) {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestTime(seconds);
    setRestCountdown(seconds);
    setShowRestTimer(true);
    restIntervalRef.current = setInterval(() => {
      setRestCountdown(prev => {
        if (prev <= 1) {
          clearInterval(restIntervalRef.current);
          Vibration.vibrate(500);
          setShowRestTimer(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }
  useEffect(()=>()=>{if(restIntervalRef.current)clearInterval(restIntervalRef.current);},[]);

  // Fetch workout history for analytics
  useEffect(() => {
    async function fetchWorkouts() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;
        const { data, error } = await supabase
          .from('workouts')
          .select('date,totalKcal,duration')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(7);
        if (error) throw error;
        if (data) setWorkoutHistory(data.reverse());
        setWorkoutError('');
      } catch(e) {
        setWorkoutError(e.message||'Failed to load workout history');
        setWorkoutHistory([]);
      }
    }
    fetchWorkouts();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => {
            // Show discard confirmation if there are exercises
            if (exercises.length > 0) {
              Alert.alert(
                'Discard Workout',
                'You have unsaved exercises. Are you sure you want to discard this workout?',
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
                      exercisesProcessedRef.current = false;
                      navigation.navigate('Exercise');
                    }
                  },
                ]
              );
            } else {
              // Navigate directly to the exercise screen if no exercises
              navigation.navigate('Exercise');
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Workout Session</Text>
        
        <View style={styles.timerContainer}>
          <View style={styles.timerDot} />
          <Text style={styles.timerText}>{formatTime(workoutTime)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.discardButton}
          onPress={handleDiscardWorkout}
        >
          <Ionicons name="close-circle-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={() => {
            console.log('Current exercises:', exercises.length);
            console.log('Exercises processed:', exercisesProcessedRef.current);
            console.log('Timer state:', workoutTimeRef.current);
            console.log('Previous exercises ref:', previousExercisesRef.current.length);
            console.log('Current exercises ref:', currentExercisesRef.current.length);
          }}
        >
          <Text style={styles.debugButtonText}>Debug</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.debugButton, { marginLeft: 8, backgroundColor: COLORS.primary }]}
          onPress={() => {
            if (previousExercisesRef.current.length > 0) {
              console.log('🔄 Manually restoring exercises from ref');
              setExercises([...previousExercisesRef.current]);
              Alert.alert('Restored', `Restored ${previousExercisesRef.current.length} exercises`);
            } else {
              Alert.alert('No Exercises', 'No previous exercises to restore');
            }
          }}
        >
          <Text style={[styles.debugButtonText, { color: 'white' }]}>Restore</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Stats Card */}
      <Animated.View style={[styles.statsCard, SHADOWS.card, { opacity: fadeAnim }]}>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          <Text style={styles.statText}>Today</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame-outline" size={20} color={COLORS.warning} />
          <Text style={styles.statText}>{totalKcal} kcal</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={20} color={COLORS.success} />
          <Text style={styles.statText}>{formatTime(workoutTime)}</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="weight-kilogram" size={20} color={COLORS.accent} />
          <Text style={styles.statText}>{totalWeight} kg</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="fitness-outline" size={20} color={COLORS.error} />
          <Text style={styles.statText}>{totalSets}</Text>
        </View>
      </Animated.View>

      {/* Add Exercise Button */}
      <TouchableOpacity 
        style={[styles.addExerciseButton, SHADOWS.button]}
        onPress={() => {
          navigation.navigate('AllExercisesScreen', {
            onExercisesSelected: (selectedExercises) => {
              console.log('Exercises selected:', selectedExercises.length);
              setExercises(prev => {
                // Store previous exercises in ref
                previousExercisesRef.current = [...prev];
                console.log('Adding selected exercises, storing previous:', prev.length);
                
                const newExercises = [
                  ...prev,
                  ...selectedExercises.map(ex => {
                    // Check if it's a cardio exercise by name or type
                    const isCardio = ex.type === 'Cardio' || 
                                    ex.workout?.toLowerCase().includes('run') ||
                                    ex.workout?.toLowerCase().includes('walk') ||
                                    ex.workout?.toLowerCase().includes('swim') ||
                                    ex.workout?.toLowerCase().includes('cycle') ||
                                    ex.workout?.toLowerCase().includes('cardio') ||
                                    ex.name?.toLowerCase().includes('run') ||
                                    ex.name?.toLowerCase().includes('walk') ||
                                    ex.name?.toLowerCase().includes('swim') ||
                                    ex.name?.toLowerCase().includes('cycle') ||
                                    ex.name?.toLowerCase().includes('cardio');
                    
                    return {
                      ...ex,
                      type: isCardio ? 'Cardio' : (ex.type || 'Strength'),
                      // Set default cardioType for cardio exercises
                      ...(isCardio ? { cardioType: 'Duration' } : {}),
                      sets: isCardio 
                        ? [{ id: generateUniqueId(), duration: '', speed: '', distance: '' }] 
                        : [{ id: generateUniqueId(), reps: '', weight: '' }]
                    };
                  })
                ];
                console.log('Total exercises after adding selected:', newExercises.length);
                return newExercises;
              });
            }
          });
        }}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.gradientButton}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Exercises List */}
      <ScrollView 
        style={styles.exercisesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.exercisesContent}
      >
        {exercises.map((exercise, index) => (
          <Animated.View
            key={exercise.id}
            style={[
              styles.exerciseCard,
              SHADOWS.card,
              { opacity: fadeAnim, transform: [{ 
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }] },
              { marginBottom: 24 }, // Add spacing between cards
            ]}
          >
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.workout || exercise.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteExercise(exercise.id)}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
            
            {/* Sets count input - moved inside card */}
            <View style={styles.setsControlRow}>
              <View style={styles.setsInputContainer}>
                <Text style={styles.setsLabel}>Sets:</Text>
                <TextInput
                  style={styles.setsInput} 
                  value={exercise.sets.length.toString()}
                  onChangeText={text => handleSetCountChange(exercise.id, text.replace(/\D/g, ''))}
                  keyboardType="numeric"
                />
              </View>
              {/* Manual Cardio Toggle for non-cardio exercises */}
              {exercise.type !== 'Cardio' && (
                <TouchableOpacity 
                  style={styles.manualCardioToggle}
                  onPress={() => handleSetFieldChange(exercise.id, null, 'type', 'Cardio')}
                >
                  <Text style={styles.manualCardioToggleText}>Make Cardio</Text>
                </TouchableOpacity>
              )}
            </View>
            {/* Strength Card: reps/weight */}
            {exercise.type !== 'Cardio' ? (
              <View style={styles.setsContainer}>
                <View style={styles.setsHeader}>
                  <Text style={styles.setsHeaderText}>Set</Text>
                  <Text style={styles.setsHeaderText}>Reps</Text>
                  <Text style={styles.setsHeaderText}>Weight</Text>
                  <Text style={styles.setsHeaderText}></Text>
                </View>
                {exercise.sets.map((set, setIndex) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNumber}>{setIndex + 1}</Text>
                    <TextInput
                      style={styles.setCellInput}
                      placeholder="Reps"
                      value={set.reps?.toString() || ''}
                      onChangeText={text => handleSetFieldChange(exercise.id, set.id, 'reps', text.replace(/\D/g, ''))}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={styles.setCellInput}
                      placeholder="Weight"
                      value={set.weight?.toString() || ''}
                      onChangeText={text => handleSetFieldChange(exercise.id, set.id, 'weight', text.replace(/\D/g, ''))}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity onPress={() => setUnitModal({ visible: true, exerciseId: exercise.id })} style={styles.unitButton}>
                      <Text style={styles.unitButtonText}>{exercise.unit || 'kg'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteSet(exercise.id, set.id)}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    </TouchableOpacity>
                    {/* Rest Timer Button */}
                    <TouchableOpacity onPress={()=>startRestTimer(60)} style={{marginLeft:8,backgroundColor:'#E5E7EB',borderRadius:8,padding:6}}>
                      <Ionicons name="timer-outline" size={18} color="#7B61FF" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addSetBtn} onPress={() => handleAddSet(exercise.id, 'Strength')}>
                  <Text style={styles.addSetBtnText}>+ Add Set</Text>
                </TouchableOpacity>
              </View>
            ) : (
            /* Cardio Card: duration, speed, distance */
              <View style={styles.setsContainer}>
                {/* Cardio Type Toggle */}
                <View style={styles.cardioTypeToggle}>
                  <Text style={styles.cardioTypeLabel}></Text>
                  <View style={styles.toggleContainer}>
                    {['Duration', 'Speed', 'Distance', 'Sets & Reps'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.toggleButton,
                          (exercise.cardioType || 'Duration') === type && styles.toggleButtonActive
                        ]}
                        onPress={() => {
                          console.log('Toggling cardio type to:', type, 'for exercise:', exercise.name);
                          handleSetFieldChange(exercise.id, null, 'cardioType', type);
                        }}
                      >
                        <Text style={[
                          styles.toggleButtonText,
                          (exercise.cardioType || 'Duration') === type && styles.toggleButtonTextActive
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.setsHeader}>
                  <Text style={styles.setsHeaderText}>Set</Text>
                  {(exercise.cardioType || 'Duration') === 'Duration' && (
                    <>
                      <Text style={styles.setsHeaderText}>Duration</Text>
                      <Text style={styles.setsHeaderText}>Speed</Text>
                    </>
                  )}
                  {(exercise.cardioType || 'Duration') === 'Speed' && (
                    <>
                      <Text style={styles.setsHeaderText}>Speed</Text>
                      <Text style={styles.setsHeaderText}>Distance</Text>
                    </>
                  )}
                  {(exercise.cardioType || 'Duration') === 'Distance' && (
                    <>
                      <Text style={styles.setsHeaderText}>Distance</Text>
                      <Text style={styles.setsHeaderText}>Duration</Text>
                    </>
                  )}
                  {(exercise.cardioType || 'Duration') === 'Sets & Reps' && (
                    <>
                      <Text style={styles.setsHeaderText}>Reps</Text>
                      <Text style={styles.setsHeaderText}>Weight</Text>
                    </>
                  )}
                  <Text style={styles.setsHeaderText}></Text>
                </View>
                
                {exercise.sets.map((set, setIndex) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNumber}>{setIndex + 1}</Text>
                    
                    {exercise.cardioType === 'Duration' && (
                      <>
                        <TextInput
                          style={styles.setCellInput}
                          placeholder="00:00"
                          value={set.duration || ''}
                          onChangeText={text => handleSetFieldChange(exercise.id, set.id, 'duration', text)}
                        />
                        <TextInput
                          style={styles.setCellInput}
                          placeholder="km/h"
                          value={set.speed || ''}
                          onChangeText={text => handleSetFieldChange(exercise.id, set.id, 'speed', text)}
                          keyboardType="numeric"
                        />
                      </>
                    )}
                    
                    {exercise.cardioType === 'Speed' && (
                      <>
                        <TextInput
                          style={styles.setCellInput}
                          placeholder="km/h"
                          value={set.speed || ''}
                          onChangeText={text => handleSetFieldChange(exercise.id, set.id, 'speed', text)}
                          keyboardType="numeric"
                        />
                        <TextInput
                          style={styles.setCellInput}
                          placeholder="km"
                          value={set.distance || ''}
                          onChangeText={text => handleSetFieldChange(exercise.id, set.id, 'distance', text)}
                          keyboardType="numeric"
                        />
                      </>
                    )}
                    
                    {exercise.cardioType === 'Distance' && (
                      <>
                        <TextInput
                          style={styles.setCellInput}
                          placeholder="km"
                          value={set.distance || ''}
                          onChangeText={text => handleSetFieldChange(exercise.id, set.id, 'distance', text)}
                          keyboardType="numeric"
                        />
                        <TextInput
                          style={styles.setCellInput}
                          placeholder="00:00"
                          value={set.duration || ''}
                          onChangeText={text => handleSetFieldChange(exercise.id, set.id, 'duration', text)}
                        />
                      </>
                    )}
                    
                    {exercise.cardioType === 'Sets & Reps' && (
                      <>
                        <TextInput
                          style={styles.setCellInput}
                          placeholder="Reps"
                          value={set.reps?.toString() || ''}
                          onChangeText={text => handleSetFieldChange(exercise.id, set.id, 'reps', text.replace(/\D/g, ''))}
                          keyboardType="numeric"
                        />
                        <TextInput
                          style={styles.setCellInput}
                          placeholder="Weight"
                          value={set.weight?.toString() || ''}
                          onChangeText={text => handleSetFieldChange(exercise.id, set.id, 'weight', text.replace(/\D/g, ''))}
                          keyboardType="numeric"
                        />
                      </>
                    )}
                    
                    <TouchableOpacity onPress={() => handleDeleteSet(exercise.id, set.id)}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addSetBtn} onPress={() => handleAddSet(exercise.id, 'Cardio')}>
                  <Text style={styles.addSetBtnText}>+ Add Set</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        ))}
        {/* Add Exercise button after last card or if no exercises */}
      </ScrollView>

      {/* Calories per exercise summary */}
      <View style={{margin:16,backgroundColor:'#fff',borderRadius:12,padding:12}}>
        <Text style={{fontFamily:'Lexend-Bold',fontSize:16,marginBottom:8}}>Calories Burned per Exercise</Text>
        {exercises && exercises.length > 0 ? exercises.map(ex=>(
          <View key={ex.id} style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
            <Text style={{fontFamily:'Lexend-Regular',fontSize:15}}>{ex.name||ex.workout||'Unnamed'}</Text>
            <Text style={{fontFamily:'Lexend-Bold',fontSize:15}}>{Number(ex.kcal)||0} kcal</Text>
          </View>
        )) : <Text style={{color:'#888'}}>No exercises in session</Text>}
      </View>
      {/* Progress Over Time Chart */}
      {workoutError ? (
        <View style={{backgroundColor:'#fff',borderRadius:18,margin:18,padding:16,marginBottom:0,alignItems:'center'}}>
          <Text style={{color:'#EF4444',fontFamily:'Lexend-Bold',fontSize:16}}>{workoutError}</Text>
        </View>
      ) : workoutHistory.length > 0 ? (
        <View style={{backgroundColor:'#fff',borderRadius:18,margin:18,padding:16,marginBottom:0}}>
          <Text style={{fontFamily:'Lexend-Bold',fontSize:18,marginBottom:8}}>Workout Progress (Last 7)</Text>
          <LineChart
            data={{
              labels: workoutHistory.map(w=>w.date.slice(5)),
              datasets: [{data: workoutHistory.map(w=>w.totalKcal||0)}],
            }}
            width={Dimensions.get('window').width-52}
            height={180}
            yAxisSuffix=" kcal"
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity=1)=>`rgba(123,97,255,${opacity})`,
              labelColor:()=>"#888",
              propsForDots:{r:'4',stroke:'#7B61FF',strokeWidth:'2'},
            }}
            bezier
            style={{borderRadius:12}}
          />
        </View>
      ) : null}

      {/* Footer */}
      <View style={[styles.footer, SHADOWS.card]}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveRoutine}
        >
          <Text style={styles.saveButtonText}>Save Routine</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={handleFinishWorkout}
          disabled={savingWorkout || invalidSets.length > 0}
        >
          <LinearGradient
            colors={[COLORS.success, '#059669']}
            style={styles.gradientButton}
          >
            {savingWorkout ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.finishButtonText}>Finish Workout</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {saveError && <Text style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>{saveError}</Text>}
      {invalidSets.length > 0 && (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>
          Please complete all set fields before finishing workout.
        </Text>
      )}


        


      {/* Exercise Detail Modal */}
      <Modal visible={showExerciseDetail} animationType="slide" transparent={true} onRequestClose={() => setShowExerciseDetail(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 10 }}>{exerciseDetail?.workout || exerciseDetail?.name}</Text>
            <Text style={{ color: '#888', fontSize: 16, marginBottom: 8 }}>{exerciseDetail?.type} {exerciseDetail?.muscle ? `• ${exerciseDetail.muscle}` : ''}</Text>
            {exerciseDetail?.description && <Text style={{ fontSize: 15, marginBottom: 8 }}>{exerciseDetail.description}</Text>}
            {exerciseDetail?.kcal && <Text style={{ fontSize: 15, marginBottom: 8 }}>Est. {exerciseDetail.kcal} kcal</Text>}
            <TouchableOpacity onPress={() => setShowExerciseDetail(false)} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ color: '#7B61FF', fontWeight: 'bold', fontSize: 17 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Save summary modal */}
      <Modal visible={showSaveSummary} animationType="slide" transparent={true} onRequestClose={() => setShowSaveSummary(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 10 }}>Workout Saved!</Text>
            <Text style={{ fontSize: 16, marginBottom: 8 }}>Your workout has been saved successfully.</Text>
            {savedWorkout && <Text style={{ fontSize: 15, marginBottom: 8 }}>Date: {savedWorkout.date}</Text>}
            <TouchableOpacity onPress={() => setShowSaveSummary(false)} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ color: '#7B61FF', fontWeight: 'bold', fontSize: 17 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* 4. Add the modal/bottom sheet at the end of the render */}
      {unitModal.visible && (
        <View style={styles.unitModalOverlay}>
          <View style={styles.unitModalContent}>
            <Text style={styles.unitModalTitle}>Weight Units</Text>
            {['kg', 'lbs'].map(u => (
              <TouchableOpacity
                key={u}
                style={[
                  styles.unitOption,
                  (exercises.find(ex => ex.id === unitModal.exerciseId)?.unit || 'kg') === u && styles.unitOptionSelected
                ]}
                onPress={() => handleUnitChange(unitModal.exerciseId, u)}
              >
                <Text style={styles.unitOptionText}>{u === 'kg' ? 'Kilograms (kg)' : 'Pounds (lbs)'}</Text>
                {(exercises.find(ex => ex.id === unitModal.exerciseId)?.unit || 'kg') === u && (
                  <Ionicons name="checkmark" size={20} color="#7B61FF" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.unitModalCancel} onPress={() => setUnitModal({ visible: false, exerciseId: null })}>
              <Text style={styles.unitModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Rest Timer Modal */}
      {showRestTimer && (
        <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.3)',justifyContent:'center',alignItems:'center',zIndex:1000}}>
          <View style={{backgroundColor:'#fff',borderRadius:20,padding:32,alignItems:'center'}}>
            <Text style={{fontFamily:'Lexend-Bold',fontSize:22,marginBottom:12}}>Rest Timer</Text>
            <Text style={{fontFamily:'Lexend-Bold',fontSize:48,color:'#7B61FF'}}>{restCountdown}s</Text>
            <TouchableOpacity style={{marginTop:18,backgroundColor:'#7B61FF',borderRadius:10,padding:12,paddingHorizontal:24}} onPress={()=>{setShowRestTimer(false);if(restIntervalRef.current)clearInterval(restIntervalRef.current);}}>
              <Text style={{color:'#fff',fontWeight:'bold',fontSize:16}}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    margin: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  addExerciseButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addExerciseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  exercisesList: {
    flex: 1,
  },
  exercisesContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  exerciseCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 20, marginBottom: 16 },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },
  setsContainer: {
    marginBottom: 16,
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  setsHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  setNumber: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  setCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  setCellText: {
    fontSize: 14,
    color: COLORS.text,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkBoxCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  cardioInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardioText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  discardButton: {
    padding: 8,
    marginLeft: 8,
  },
  setsControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  setsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setsLabel: {
    fontWeight: '600',
    fontSize: 15,
    marginRight: 8,
    color: COLORS.text,
  },
  setsInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 60,
    textAlign: 'center',
    backgroundColor: COLORS.white,
  },
  saveButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  saveButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    flex: 1,
    borderRadius: 16,
    marginLeft: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  searchInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  exerciseLibrary: {
    maxHeight: height * 0.5,
  },
  exerciseLibraryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  libraryExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  libraryExerciseDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  editForm: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveEditButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveEditButtonText: {
    color: '#fff',
    fontSize: 16,},
    
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, position: 'absolute', left: 0, right: 0, bottom: 0 },
  saveRoutineBtn: { flex: 1, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginRight: 8 },
  saveRoutineBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 17 },
  finishBtn: { flex: 1, backgroundColor: 'linear-gradient(90deg, #7B61FF 0%, #22C55E 100%)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginLeft: 8, backgroundColor: COLORS.primary },
  finishBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  exerciseTitle: { fontWeight: 'bold', fontSize: 20, color: '#1E293B' },
  exerciseDetails: { color: '#64748B', fontSize: 15, marginBottom: 10 },
  setTableHeaderRow: { flexDirection: 'row', marginBottom: 6 },
  setTableHeaderText: { flex: 1, fontWeight: '700', color: '#334155', fontSize: 15, textAlign: 'center' },
  setTableRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  setTableCell: { flex: 1, textAlign: 'center', color: '#1E293B', fontSize: 15 },
  setTableIcons: { flexDirection: 'row', flex: 1, justifyContent: 'center' },
  addSetBtn: { borderWidth: 1.5, borderColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  addSetBtnText: { color: COLORS.accent, fontWeight: 'bold', fontSize: 17 },
  addExerciseBtn: { backgroundColor: COLORS.primary, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, paddingVertical: 16, alignItems: 'center' },
  addExerciseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  setCellInput: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8, marginHorizontal: 4, borderWidth: 1, borderColor: '#E5E7EB', textAlign: 'center' },
  invalidInput: { borderColor: '#EF4444', backgroundColor: '#FEE2E2' },
  cardioTypeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  cardioTypeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  toggleButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  manualCardioToggle: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manualCardioToggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Filter styles
  quickFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    marginRight: 8,
    marginBottom: 8,
  },
  quickFilterActive: {
    backgroundColor: '#7B61FF',
    borderColor: '#7B61FF',
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  quickFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  clearFiltersButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  // Modern filter styles
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginRight: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterScrollView: {
    marginBottom: 16,
  },
  filterSection: {
    marginRight: 24,
    minWidth: 120,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#7B61FF',
    borderColor: '#7B61FF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeFiltersContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  activeFiltersChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B61FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  clearAllButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Modern exercise list styles
  exerciseListItem: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseListItemSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#7B61FF',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  unitButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
},
unitButtonText: {
  fontSize: 13,
  color: '#374151',
  fontWeight: '600',
},
unitModalOverlay: {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
},
unitModalContent: {
  backgroundColor: '#fff',
  borderRadius: 20,
  padding: 24,
  width: '80%',
  maxWidth: 340,
  alignItems: 'center',
},
unitModalTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1F2937',
  marginBottom: 18,
},
unitOption: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  paddingVertical: 14,
  paddingHorizontal: 10,
  borderRadius: 12,
  marginBottom: 8,
  backgroundColor: '#F3F4F6',
},
unitOptionSelected: {
  backgroundColor: '#7B61FF22',
},
unitOptionText: {
  fontSize: 16,
  color: '#1F2937',
  fontWeight: '500',
},
unitModalCancel: {
  marginTop: 10,
  paddingVertical: 10,
  alignItems: 'center',
},
unitModalCancelText: {
  color: '#7B61FF',
  fontWeight: '600',
  fontSize: 16,
},
addExerciseInlineButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 8,
  marginBottom: 32,
  alignSelf: 'center',
  backgroundColor: '#F3F4F6',
  borderRadius: 8,
  paddingHorizontal: 18,
  paddingVertical: 10,
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
addExerciseInlineText: {
  color: COLORS.primary,
  fontWeight: '600',
  fontSize: 15,
  marginLeft: 6,
},
discardExerciseBtn: {
  marginLeft: 12,
  padding: 8,
  borderRadius: 8,
  backgroundColor: '#FEE2E2',
},
}); 