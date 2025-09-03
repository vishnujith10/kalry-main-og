
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, FlatList, Modal, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import supabase from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// Enhanced Color Palette
const COLORS = {
  primary: '#7c3aed',
  secondary: '#a855f7',
  accent: '#c084fc',
  success: '#2ed573',
  warning: '#ffa502',
  error: '#ff4757',
  background: '#f8fafc',
  backgroundDark: '#1e293b',
  card: '#ffffff',
  cardDark: '#334155',
  cardBorder: '#e2e8f0',
  white: '#ffffff',
  gray: '#64748b',
  grayLight: '#94a3b8',
  dark: '#0f172a',
  text: '#1e293b',
  textSecondary: '#64748b',
  textLight: '#94a3b8',
  glassBg: 'rgba(255,255,255,0.25)',
  glassStroke: 'rgba(255,255,255,0.3)',
};



// Session Type Options
  const SESSION_TYPES = [
  ' Cardio', 
  'HIIT',
  'Custom'
];

// Session Templates
const SESSION_TEMPLATES = {
  hiit: {
    name: 'HIIT Blast',
    exercises: ['3', '5', '2', '4'], // Burpees, Mountain Climbers, Jump Rope, High Knees
    intensity: 85,
    rounds: 4,
    restBetweenRounds: 60
  },
  endurance: {
    name: 'Endurance Builder',
    exercises: ['1', '6', '4'], // Running in Place, Jumping Jacks, High Knees
    intensity: 60,
    rounds: 3,
    restBetweenRounds: 45
  },
  warmup: {
    name: 'Dynamic Warm-up',
    exercises: ['6', '4'], // Jumping Jacks, High Knees
    intensity: 40,
    rounds: 2,
    restBetweenRounds: 30
  }
};

export default function CardioSessionBuilder({ navigation }) {
  // State management
  const [sessionType, setSessionType] = useState('');
  const [customSessionType, setCustomSessionType] = useState('');
  const [showSessionTypeModal, setShowSessionTypeModal] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [intensity, setIntensity] = useState(50);
  const [sliderActive, setSliderActive] = useState(false);
  const [totalRounds, setTotalRounds] = useState(3);
  const [restBetweenRounds, setRestBetweenRounds] = useState(60);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoRepeat, setAutoRepeat] = useState(true);
  const [notes, setNotes] = useState('');
  
  // Database exercises state
  const [dbExercises, setDbExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  
  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [workoutPlayerVisible, setWorkoutPlayerVisible] = useState(false);
  
  // Search and selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseDuration, setExerciseDuration] = useState('');
  const [exerciseRest, setExerciseRest] = useState('');
  const [exerciseRounds, setExerciseRounds] = useState(1);
  
  // Workout player states
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isResting, setIsResting] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Timer ref
  const timerRef = useRef(null);

  // Fetch exercises from database
  const fetchExercisesFromDB = async () => {
    try {
      setLoadingExercises(true);
      console.log('Fetching exercises from database...');
      
      // Try different possible table names
      const possibleTableNames = ['exercise', 'exercises', 'workout', 'workouts'];
      let exercisesData = null;
      let tableName = null;
      
      for (const table of possibleTableNames) {
        console.log(`Trying table: ${table}`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error && data && data.length > 0) {
          console.log(`✅ Found data in table: ${table}`);
          exercisesData = data;
          tableName = table;
          break;
        } else {
          console.log(`❌ No data in table: ${table}`, { error, data });
        }
      }
      
      if (exercisesData && tableName) {
        // Now fetch all data from the working table
        const { data: allData, error: allError } = await supabase
          .from(tableName)
          .select('*');
        
        if (allError) {
          console.error('Error fetching all exercises:', allError);
          Alert.alert('Error', `Failed to fetch exercises: ${allError.message}`);
          return;
        }
        
        console.log(`✅ Successfully fetched exercises from table: ${tableName}`);
        console.log('Number of exercises:', allData.length);
        console.log('First exercise sample:', allData[0]);
        console.log('Exercise fields available:', Object.keys(allData[0]));
        setDbExercises(allData);
      } else {
        console.log('⚠️ No exercises found in any table');
        setDbExercises([]);
      }
    } catch (error) {
      console.error('❌ Exception while fetching exercises:', error);
      Alert.alert('Error', 'Failed to fetch exercises from database');
    } finally {
      setLoadingExercises(false);
    }
  };

  // Calculate session summary
  const calculateSummary = () => {
    if (exercises.length === 0) {
      return {
        totalTime: 0,
        totalCalories: 0,
        difficulty: 'Easy'
      };
    }

    // Calculate total calories and time for all exercises with their individual rounds
    let totalCalories = 0;
    let totalTime = 0;

    exercises.forEach(ex => {
      const exerciseData = dbExercises.find(e => e.id === ex.id);
      const intensityMultiplier = intensity / 50;
      const exerciseDuration = parseInt(ex.duration) || 45;
      const exerciseTime = exerciseDuration / 60; // Convert to minutes
      const exerciseRounds = ex.rounds || 1;
      
      // Use a default calorie burn rate based on exercise type
      const calorieRate = exerciseData?.type === 'cardio' ? 10 : 
                         exerciseData?.type === 'strength' ? 8 : 
                         exerciseData?.type === 'core' ? 6 : 7;
      
      // Calculate calories for this exercise (per round * number of rounds)
      const exerciseCalories = calorieRate * intensityMultiplier * exerciseTime * exerciseRounds;
      totalCalories += exerciseCalories;

      // Calculate time for this exercise
      const restDuration = parseInt(ex.rest) || 15;
      const exerciseTotalTime = (exerciseDuration + restDuration) * exerciseRounds;
      totalTime += exerciseTotalTime;
    });

    // Convert total time to minutes
    totalTime = totalTime / 60;

    // Determine difficulty based on total calories and time
    let difficulty = 'Easy';
    if (totalCalories > 400 || totalTime > 45) {
      difficulty = 'Hard';
    } else if (totalCalories > 200 || totalTime > 25) {
      difficulty = 'Moderate';
    }

    return {
      totalTime: Math.round(totalTime),
      totalCalories: Math.round(totalCalories),
      difficulty: difficulty
    };
  };

  const [summary, setSummary] = useState({
    totalTime: 0,
    totalCalories: 0,
    difficulty: 'Easy'
  });

  // Recalculate summary when exercises, intensity, or settings change
  useEffect(() => {
    const newSummary = calculateSummary();
    setSummary(newSummary);
  }, [exercises, intensity, restBetweenRounds]);

  // Filter exercises based on search (using database data)
  const filteredExercises = dbExercises.filter(ex =>
    ex.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.body_parts?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debug logging
  console.log('Total exercises in DB:', dbExercises.length);
  console.log('Filtered exercises:', filteredExercises.length);
  console.log('Search query:', searchQuery);

  // Animation effects
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch exercises when modal opens
  useEffect(() => {
    if (addModalVisible) {
      fetchExercisesFromDB();
    }
  }, [addModalVisible]);

  // Progress animation based on calories
  useEffect(() => {
    const progress = Math.min(summary.totalCalories / 500, 1);
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [summary.totalCalories]);

  // Template loading
  const loadTemplate = (templateKey) => {
    const template = SESSION_TEMPLATES[templateKey];
    if (!template) return;

    const templateExercises = template.exercises.map((exerciseId, index) => {
      const exerciseData = dbExercises.find(e => e.id === exerciseId);
      return {
        id: exerciseId,
        name: exerciseData?.name || 'Unknown Exercise',
        icon: '💪',
        blockType: 'time',
        duration: exerciseData?.duration || 45,
        rest: 15,
        order: index
      };
    });

    setSessionType(template.name);
    setExercises(templateExercises);
    setIntensity(template.intensity);
    setTotalRounds(template.rounds);
    setRestBetweenRounds(template.restBetweenRounds);
    setTemplateModalVisible(false);

    // Show success animation
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start();
  };

  // Add exercise to session
  const addExercise = () => {
    if (!selectedExercise || !exerciseDuration) {
      Alert.alert('Error', 'Please select an exercise and set duration');
      return;
    }

    const newExercise = {
      id: selectedExercise.id,
      name: selectedExercise.name,
      gif_url: selectedExercise.gif_url,
      icon: '💪',
      blockType: 'time',
      duration: exerciseDuration || 45,
      rest: exerciseRest || 15,
      rounds: exerciseRounds,
      order: exercises.length
    };

    setExercises([...exercises, newExercise]);
    setAddModalVisible(false);
    setSelectedExercise(null);
    setExerciseDuration('');
    setExerciseRest('');
    setExerciseRounds(1);
  };

  // Remove exercise
  const removeExercise = (index) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          setExercises(exercises.filter((_, i) => i !== index));
        }}
      ]
    );
  };

  // Start workout
  const startWorkout = () => {
    if (exercises.length === 0) {
      Alert.alert('Error', 'Add at least one exercise to start the workout');
      return;
    }
    
    // Navigate to WorkoutStartScreen with workout data
    navigation.navigate('WorkoutStart', {
      exercises: exercises,
      sessionType: sessionType,
      intensity: intensity,
      restBetweenRounds: restBetweenRounds
    });
  };

  // Workout timer logic
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (isPlaying && timeRemaining === 0) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, timeRemaining]);

  const handleTimerComplete = () => {
    const currentExercise = exercises[currentExerciseIndex];
    
    if (isResting) {
      // Rest complete, next exercise or round
      if (currentRound < totalRounds) {
        setCurrentRound(currentRound + 1);
        setIsResting(false);
        setTimeRemaining(currentExercise.duration || currentExercise.reps * 2 || 30);
      } else if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentRound(1);
        setIsResting(false);
        const nextExercise = exercises[currentExerciseIndex + 1];
        setTimeRemaining(nextExercise.duration || nextExercise.reps * 2 || 30);
      } else {
        // Workout complete
        completeWorkout();
      }
      } else {
      // Exercise complete, start rest or move to next
      if (currentRound < totalRounds) {
        setIsResting(true);
        setTimeRemaining(currentExercise.rest || 15);
      } else if (currentExerciseIndex < exercises.length - 1) {
        setIsResting(true);
        setTimeRemaining(restBetweenRounds);
      } else {
        completeWorkout();
      }
    }
  };

  const completeWorkout = () => {
    setIsPlaying(false);
    Alert.alert(
      'Workout Complete! 🎉',
      `Great job! You completed ${exercises.length} exercises across ${totalRounds} rounds.`,
      [{ text: 'Done', onPress: () => setWorkoutPlayerVisible(false) }]
    );
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clear all exercises
  const clearAll = () => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to remove all exercises?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setExercises([]) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      
      {/* Back Button - Only Fixed Element */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.navigate('Exercise')}
      >
        <Ionicons name="arrow-back" size={24} color="#1f2937" />
      </TouchableOpacity>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Text - Now Scrollable */}
        <Text style={styles.headerTitle}>Build Your Cardio Session</Text>
        <Text style={styles.headerSubtitle}>Add exercises, set intensity, track progress</Text>

        {/* Session Type Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Type</Text>
          <TouchableOpacity 
            style={styles.sessionTypeSelector}
            onPress={() => setShowSessionTypeModal(true)}
          >
            <Text style={[
              styles.sessionTypeText, 
              !sessionType && styles.sessionTypePlaceholder
            ]}>
              {sessionType ? (sessionType === 'Custom' ? customSessionType : sessionType) : 'Select session type'}
            </Text>
            <Text style={styles.sessionTypeArrow}>▼</Text>
          </TouchableOpacity>
                        </View>

        {/* Intensity Buttons */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Intensity</Text>
          <View style={styles.intensityLabels}>
            <TouchableOpacity 
              style={[
                styles.intensityButton,
                intensity <= 33 && styles.intensityButtonActive
              ]}
              onPress={() => setIntensity(25)}
            >
              <Text style={[
                styles.intensityButtonText,
                intensity <= 33 && styles.intensityButtonTextActive
              ]}>Low</Text>
                    </TouchableOpacity>
                <TouchableOpacity
              style={[
                styles.intensityButton,
                intensity > 33 && intensity <= 66 && styles.intensityButtonActive
              ]}
              onPress={() => setIntensity(50)}
            >
              <Text style={[
                styles.intensityButtonText,
                intensity > 33 && intensity <= 66 && styles.intensityButtonTextActive
              ]}>Medium</Text>
                </TouchableOpacity>
                <TouchableOpacity
              style={[
                styles.intensityButton,
                intensity > 66 && styles.intensityButtonActive
              ]}
              onPress={() => setIntensity(75)}
            >
              <Text style={[
                styles.intensityButtonText,
                intensity > 66 && styles.intensityButtonTextActive
              ]}>High</Text>
                </TouchableOpacity>
              </View>
        </View>

        {/* Exercises List */}
        <View style={styles.card}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.cardTitle}>Exercises ({exercises.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          
          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💪</Text>
              <Text style={styles.emptyStateText}>No exercises added yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap "Add" to get started</Text>
            </View>
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.exerciseCard}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseIcon}>{item.icon}</Text>
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.exerciseName}>{item.name}</Text>
                      <View style={styles.exerciseStats}>
                        <Text style={styles.exerciseStat}>
                          {item.blockType === 'time' ? `${item.duration}s` : `${item.reps} reps`}
                        </Text>
                        <Text style={styles.exerciseStat}>Rest: {item.rest}s</Text>
                        <Text style={styles.exerciseStat}>Rounds: {item.rounds || 1}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeExercise(index)}>
                    <Text style={styles.removeButton}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Session Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Settings</Text>
          


          {/* <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Rest Between Rounds</Text>
            <Text style={styles.settingValue}>{restBetweenRounds}s</Text>
          </View> */}

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound Alerts</Text>
            <Switch
              value={soundAlerts}
              onValueChange={setSoundAlerts}
              trackColor={{ true: COLORS.primary, false: COLORS.cardBorder }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Repeat Weekly</Text>
            <Switch
              value={autoRepeat}
              onValueChange={setAutoRepeat}
              trackColor={{ true: COLORS.primary, false: COLORS.cardBorder }}
              thumbColor={COLORS.white}
            />
              </View>
        </View>

        {/* Session Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardTitle}>Session Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>⏱️</Text>
              <Text style={styles.summaryValue}>{summary.totalTime}</Text>
              <Text style={styles.summaryLabel}>Minutes</Text>
      </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>🔥</Text>
              <Text style={styles.summaryValue}>{summary.totalCalories}</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
        </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryIcon}>📊</Text>
              <Text style={styles.summaryValue}>{summary.difficulty}</Text>
              <Text style={styles.summaryLabel}>Difficulty</Text>
              </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
            <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
              </View>
      </ScrollView>

      {/* Add Exercise Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalClose}>×</Text>
            </TouchableOpacity>
        </View>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {!selectedExercise ? (
              <>
                {loadingExercises ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading exercises...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredExercises}
                    keyExtractor={item => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }) => (
              <TouchableOpacity
                        style={styles.exerciseOption}
                        onPress={() => setSelectedExercise(item)}
                      >
                        <Text style={styles.exerciseOptionIcon}>💪</Text>
                        <View style={styles.exerciseOptionInfo}>
                          <Text style={styles.exerciseOptionName}>{item.name}</Text>
                          <View style={styles.exerciseOptionTags}>
                            {item.body_parts && (
                              <View style={styles.tag}>
                                <Text style={styles.tagText}>{item.body_parts}</Text>
                    </View>
                  )}
                            {item.type && (
                              <View style={styles.tag}>
                                <Text style={styles.tagText}>{item.type}</Text>
                              </View>
                            )}
                    </View>
                  </View>
                        <Text style={styles.difficultyBadge}>{item.type || 'Cardio'}</Text>
                  </TouchableOpacity>
                    )}
                    style={styles.exerciseList}
                    ListEmptyComponent={
                      <View style={styles.emptyListContainer}>
                        <Text style={styles.emptyListText}>No exercises found</Text>
                        <Text style={styles.emptyListSubtext}>Try adjusting your search</Text>
                </View>
                    }
                  />
                )}
              </>
            ) : (
              <View style={styles.exerciseConfiguration}>
                <Text style={styles.selectedExerciseName}>{selectedExercise.name} 💪</Text>
                
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Duration (seconds)</Text>
                    <TextInput
                    style={styles.configInput}
                    placeholder={selectedExercise.baseDuration?.toString() || "45"}
                    placeholderTextColor={COLORS.textSecondary}
                    value={exerciseDuration}
                    onChangeText={setExerciseDuration}
                      keyboardType="numeric"
                    />
                </View>

                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Rest (seconds)</Text>
                  <TextInput
                    style={styles.configInput}
                    placeholder="15"
                    placeholderTextColor={COLORS.textSecondary}
                    value={exerciseRest}
                    onChangeText={setExerciseRest}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Total Rounds</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity 
                      style={styles.stepperButton}
                      onPress={() => setExerciseRounds(Math.max(1, exerciseRounds - 1))}
                    >
                      <Text style={styles.stepperButtonText}>-</Text>
              </TouchableOpacity>
                    <Text style={styles.stepperValue}>{exerciseRounds}</Text>
                    <TouchableOpacity 
                      style={styles.stepperButton}
                      onPress={() => setExerciseRounds(exerciseRounds + 1)}
                    >
                      <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>
            </View>

                <View style={styles.modalActions}>
                <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setSelectedExercise(null)}
                >
                    <Text style={styles.modalCancelText}>Back</Text>
                </TouchableOpacity>
                  <TouchableOpacity style={styles.modalAddButton} onPress={addExercise}>
                    <Text style={styles.modalAddText}>Add Exercise</Text>
                  </TouchableOpacity>
                </View>
            </View>
          )}
          </View>
        </View>
      </Modal>

      {/* Workout Player Modal */}
      <Modal visible={workoutPlayerVisible} animationType="slide" transparent>
        <View style={styles.playerOverlay}>
          <Animated.View style={[styles.playerModal, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerTitle}>Workout in Progress</Text>
              <TouchableOpacity onPress={() => {
                setIsPlaying(false);
                setWorkoutPlayerVisible(false);
              }}>
                <Text style={styles.playerClose}>×</Text>
              </TouchableOpacity>
          </View>

            {exercises.length > 0 && (
              <View style={styles.playerContent}>
                <Text style={styles.currentExerciseIcon}>
                  {exercises[currentExerciseIndex]?.icon}
                </Text>
                <Text style={styles.currentExerciseName}>
                  {exercises[currentExerciseIndex]?.name}
                </Text>
                <Text style={styles.currentStatus}>
                  {isResting ? 'Rest Time' : `Round ${currentRound} of ${totalRounds}`}
                </Text>
                
                <Text style={styles.timerDisplay}>{formatTime(timeRemaining)}</Text>
                
                <View style={styles.playerControls}>
                  <TouchableOpacity style={styles.playerButton} onPress={togglePlayPause}>
                    <Text style={styles.playerButtonText}>{isPlaying ? '⏸️' : '▶️'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.playerButton} 
                    onPress={() => {
                      if (currentExerciseIndex < exercises.length - 1) {
                        setCurrentExerciseIndex(currentExerciseIndex + 1);
                        setCurrentRound(1);
                        setIsResting(false);
                        setTimeRemaining(exercises[currentExerciseIndex + 1].duration || 30);
                      }
                    }}
                  >
                    <Text style={styles.playerButtonText}>⏭️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Session Type Modal */}
      <Modal
        visible={showSessionTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSessionTypeModal(false)}
      >
        <TouchableOpacity 
          style={styles.sessionTypeModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSessionTypeModal(false)}
        >
          <View style={styles.sessionTypeModal}>
            <Text style={styles.sessionTypeModalTitle}>Select Session Type</Text>
            {SESSION_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.sessionTypeOption}
                onPress={() => {
                  setSessionType(type);
                  if (type !== 'Custom') {
                    setCustomSessionType('');
                  }
                  setShowSessionTypeModal(false);
                }}
              >
                <Text style={styles.sessionTypeOptionText}>{type}</Text>
          </TouchableOpacity>
            ))}
            {sessionType === 'Custom' && (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Enter custom session type"
                  placeholderTextColor={COLORS.textSecondary}
                  value={customSessionType}
                  onChangeText={setCustomSessionType}
                />
              </View>
            )}
          </View>
          </TouchableOpacity>
      </Modal>

      {/* Success Toast */}
      <Animated.View style={[styles.toast, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.toastText}>Template loaded successfully! 🎉</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  backButton: {
    position: 'absolute',
    top: 0,
    left: 20,
    zIndex: 1000,
    padding: 10,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  

  
  headerTitle: {
    top: 20,
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937', // Dark gray for better readability
    textAlign: 'center',
    marginBottom: 8,
  },
  
  headerSubtitle: {
    top: 15,
    fontSize: 16,
    color: '#6b7280', // Medium gray for subtitle
    textAlign: 'center',
    marginBottom: 20,
  },
  
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  progressArc: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: '#ffffff',
  },
  
  progressText: {
    alignItems: 'center',
  },
  
  progressCalories: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  
  progressTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  
  sessionTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  
  sessionTypeText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  
  sessionTypePlaceholder: {
    color: '#64748b',
  },
  
  sessionTypeArrow: {
    fontSize: 12,
    color: '#64748b',
  },
  
  templateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  
  templateButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginRight: 8,
    marginBottom: 8,
  },
  
  templateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  intensityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7c3aed',
  },
  
  slider: {
    width: '100%',
    height: 40,
  },
  
  sliderThumb: {
    width: 20,
    height: 20,
  },
  
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  
  intensityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  intensityButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  
  intensityButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  
  intensityButtonTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    position: 'relative',
  },
  
  sliderFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 3,
  },
  

  
  sliderLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  addButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  exerciseIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  
  exerciseDetails: {
    flex: 1,
  },
  
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  
  exerciseStats: {
    flexDirection: 'row',
    gap: 16,
  },
  
  exerciseStat: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  
  removeButton: {
    fontSize: 24,
    color: '#ef4444',
    fontWeight: '300',
    paddingHorizontal: 8,
  },
  
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
  },
  
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  
  stepperButton: {
    width: 32,
    height: 32,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  stepperButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    minWidth: 30,
    textAlign: 'center',
  },
  
  summaryCard: {
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  summaryItem: {
    alignItems: 'center',
  },
  
  summaryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  
  clearButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  
  clearButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
  
  startButton: {
    flex: 2,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  
  modal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 20,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  
  modalClose: {
    fontSize: 28,
    color: '#64748b',
    fontWeight: '300',
  },
  
  searchInput: {
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    color: '#1e293b',
  },
  
  exerciseList: {
    paddingHorizontal: 20,
  },
  
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  
  exerciseOptionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  
  exerciseOptionInfo: {
    flex: 1,
  },
  
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  
  exerciseOptionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  tag: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  tagText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
  },
  
  difficultyBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  
  exerciseConfiguration: {
    padding: 20,
  },
  
  selectedExerciseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
  },
  
  configRow: {
    marginBottom: 20,
  },
  
  configLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  
  configInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  
  modalCancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  
  modalCancelText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  
  modalAddButton: {
    flex: 2,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  
  modalAddText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Workout Player Styles
  playerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  playerModal: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    margin: 20,
    width: '90%',
    alignItems: 'center',
  },
  
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  
  playerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  
  playerClose: {
    fontSize: 28,
    color: '#64748b',
  },
  
  playerContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  

  
  currentExerciseName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  
  currentStatus: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  
  timerDisplay: {
    fontSize: 48,
    fontWeight: '800',
    color: '#7c3aed',
    marginBottom: 32,
  },
  
  playerControls: {
    flexDirection: 'row',
    gap: 20,
  },
  
  playerButton: {
    backgroundColor: '#7c3aed',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  playerButtonText: {
    fontSize: 24,
  },
  
  // Toast Styles
  toast: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  
  toastText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Session Type Modal Styles
  sessionTypeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 120, // Account for header height
  },
  
  sessionTypeModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxHeight: '70%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  
  sessionTypeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  sessionTypeOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  sessionTypeOptionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  customInputContainer: {
    marginTop: 16,
  },
  
  customInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  emptyListText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  emptyListSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
