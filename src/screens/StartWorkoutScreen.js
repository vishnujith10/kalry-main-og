import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Gif from 'react-native-gif'; // Import react-native-gif

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [gifErrors, setGifErrors] = useState({}); // Track GIF loading errors
  const [showMenuForExercise, setShowMenuForExercise] = useState(null); // Track which exercise menu is open
  
  const timerStartedRef = useRef(false);
  const workoutTimeRef = useRef(0);
  const previousExercisesRef = useRef([]);
  const intentionallyClearingRef = useRef(false);

  // Get exercises from route params if available
  useEffect(() => {
    if (route.params?.exercises) {
      const routeExercises = route.params.exercises.map(ex => ({
        ...ex,
        id: generateUniqueId(),
        sets: [{ id: generateUniqueId(), weight: '', reps: '', completed: false }]
      }));
      setExercises(routeExercises);
    }
  }, [route.params]);

  // Generate unique ID
  const generateUniqueId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Helper function to clean and decode GIF URL
  const getCleanGifUrl = (url) => {
    if (!url) return null;
    try {
      // Decode URL and clean it
      let cleanUrl = decodeURIComponent(url);
      // Remove any extra spaces and re-encode properly
      cleanUrl = cleanUrl.replace(/\s+/g, '%20');
      return cleanUrl;
    } catch (error) {
      return url;
    }
  };

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

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
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

  const removeExercise = (exerciseId) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise from your workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setExercises(exercises.filter(ex => ex.id !== exerciseId));
            setShowMenuForExercise(null);
          }
        }
      ]
    );
  };

  const handleEditExercise = (exerciseId) => {
    setEditingExerciseId(exerciseId);
    setShowMenuForExercise(null);
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
    <TouchableWithoutFeedback onPress={() => setShowMenuForExercise(null)}>
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
            <Text style={styles.endButtonText}>Finish</Text>
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
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
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
              Tap "Add Exercise" below to start building your workout
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
                  style={styles.moreButton}
                  onPress={() => setShowMenuForExercise(showMenuForExercise === exercise.id ? null : exercise.id)}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Three-dots menu */}
              {showMenuForExercise === exercise.id && (
                <View style={styles.menuOverlay}>
                  <View style={styles.menuContainer}>
                    <TouchableOpacity 
                      style={styles.menuItem}
                      onPress={() => handleEditExercise(exercise.id)}
                    >
                      <Ionicons name="pencil" size={18} color={COLORS.primary} />
                      <Text style={styles.menuItemText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.menuItem}
                      onPress={() => removeExercise(exercise.id)}
                    >
                      <Ionicons name="trash" size={18} color={COLORS.error} />
                      <Text style={[styles.menuItemText, { color: COLORS.error }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Animated GIF Display using react-native-gif */}
              {exercise.gif_url && !gifErrors[exercise.id] && (
                <View style={styles.gifContainer}>
                  <Gif
                    source={{ uri: getCleanGifUrl(exercise.gif_url) }}
                    style={styles.exerciseGif}
                    resizeMode="contain"
                    onError={(error) => {
                      setGifErrors(prev => ({ ...prev, [exercise.id]: true }));
                    }}
                    onLoad={() => {
                      // GIF loaded successfully
                    }}
                  />
                </View>
              )}

              {/* Fallback for failed GIFs */}
              {exercise.gif_url && gifErrors[exercise.id] && (
                <View style={styles.gifPlaceholder}>
                  <MaterialCommunityIcons 
                    name="image-broken-variant" 
                    size={48} 
                    color={COLORS.textLight} 
                  />
                  <Text style={styles.gifPlaceholderText}>Exercise Animation</Text>
                  <Text style={styles.gifPlaceholderSubtext}>Failed to load</Text>
                </View>
              )}

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
      {keyboardHeight === 0 && (
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
      )}

      {saveError && (
        <Text style={styles.errorText}>{saveError}</Text>
      )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 20,
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
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  endButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  moreButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
  },
  menuOverlay: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuContainer: {
    paddingVertical: 8,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  
  // GIF Container and Styles
  gifContainer: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 8,
    overflow: 'hidden',
  },
  exerciseGif: {
    width: 280,
    height: 180,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  
  // GIF Placeholder Styles
  gifPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 20,
    height: 180,
  },
  gifPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  gifPlaceholderSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
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
    zIndex: 1000,
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
