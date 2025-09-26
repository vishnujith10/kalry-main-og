import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import supabase from '../lib/supabase';

const COLORS = {
  primary: '#7c3aed',
  secondary: '#a855f7',
  accent: '#c084fc',
  white: '#ffffff',
  gray: '#64748b',
  grayLight: '#94a3b8',
  dark: '#0f172a',
  background: '#f8fafc',
  success: '#2ed573',
  warning: '#ffa502',
  error: '#ff4757',
  lightGray: '#f1f5f9',
  textSecondary: '#6b7280',
};

export default function WorkoutStartScreen({ route, navigation }) {
  const { exercises, sessionType, intensity, restBetweenRounds, sessionData } = route.params;
  
  // State management
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  
  // Actual workout tracking
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [actualWorkoutTime, setActualWorkoutTime] = useState(0);
  const [totalExercisesCompleted, setTotalExercisesCompleted] = useState(0);
  const [totalRoundsCompleted, setTotalRoundsCompleted] = useState(0);
  
  // Timer refs
  const timerRef = useRef(null);
  const workoutTimerRef = useRef(null);
  
  // Animation for timer
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize first exercise and start timer automatically
  useEffect(() => {
    if (exercises.length > 0) {
      const firstExercise = exercises[0];
      setTimeRemaining(parseInt(firstExercise.duration) || 45);
      setIsPlaying(true); // Start timer automatically
      setWorkoutStartTime(Date.now()); // Start tracking actual workout time
    }
  }, []);

  // Track actual workout time
  useEffect(() => {
    if (workoutStartTime && !workoutCompleted) {
      workoutTimerRef.current = setInterval(() => {
        setActualWorkoutTime(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (workoutTimerRef.current) {
        clearInterval(workoutTimerRef.current);
      }
    };
  }, [workoutStartTime, workoutCompleted]);

  // Timer logic
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

  // Pulse animation for timer
  useEffect(() => {
    if (isPlaying && timeRemaining <= 10) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying, timeRemaining]);

  const handleTimerComplete = () => {
    if (isResting) {
      // Rest complete, move to next exercise or round
      let nextExerciseIndex = currentExerciseIndex + 1;
      
      // Find next exercise that should be included in current round
      while (nextExerciseIndex < exercises.length) {
        const nextExercise = exercises[nextExerciseIndex];
        const nextExerciseRounds = nextExercise.rounds || 1;
        
        // Include exercise if it has rounds remaining for current round
        if (nextExerciseRounds >= currentRound) {
          break;
        }
        nextExerciseIndex++;
      }
      
      if (nextExerciseIndex < exercises.length) {
        // Move to next exercise in current round
        setCurrentExerciseIndex(nextExerciseIndex);
        setTotalExercisesCompleted(prev => prev + 1);
        setIsResting(false);
        const nextExercise = exercises[nextExerciseIndex];
        setTimeRemaining(parseInt(nextExercise.duration) || 45);
        setIsPlaying(true);
      } else {
        // All exercises in current round completed, check if we need to start next round
        const maxRounds = Math.max(...exercises.map(ex => ex.rounds || 1));
        
        if (currentRound < maxRounds) {
          // Complete current round and start next round
          setTotalRoundsCompleted(prev => prev + 1); // Increment when completing a round
          
          // Start next round, find first exercise that has more rounds
          let firstExerciseIndex = 0;
          while (firstExerciseIndex < exercises.length) {
            const exercise = exercises[firstExerciseIndex];
            const exerciseRounds = exercise.rounds || 1;
            
            if (exerciseRounds > currentRound) {
              // This exercise has more rounds, start with it
              break;
            }
            firstExerciseIndex++;
          }
          
          if (firstExerciseIndex < exercises.length) {
            setCurrentExerciseIndex(firstExerciseIndex);
            setCurrentRound(currentRound + 1);
            setIsResting(false);
            const firstExercise = exercises[firstExerciseIndex];
            setTimeRemaining(parseInt(firstExercise.duration) || 45);
            setIsPlaying(true);
          } else {
            // No exercises have more rounds
            completeWorkout();
          }
        } else {
          // All rounds completed
          setTotalRoundsCompleted(prev => prev + 1); // Increment when completing final round
          completeWorkout();
        }
      }
    } else {
      // Exercise complete, start rest
      const currentExercise = exercises[currentExerciseIndex];
      setIsResting(true);
      setTimeRemaining(parseInt(currentExercise.rest) || 15);
      setIsPlaying(true);
    }
  };

  const completeWorkout = () => {
    setIsPlaying(false);
    setTotalExercisesCompleted(prev => prev + 1); // Track final exercise completion
    setWorkoutCompleted(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkip = () => {
    setIsPlaying(false);
    handleTimerComplete();
  };

  const handleStop = () => {
    Alert.alert(
      'Stop Workout',
      'Are you sure you want to stop the workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentExercise = () => {
    return exercises[currentExerciseIndex] || {};
  };

  const getNextExercise = () => {
    if (isResting) {
      // Find next exercise that should be included in current round
      let nextExerciseIndex = currentExerciseIndex + 1;
      
      while (nextExerciseIndex < exercises.length) {
        const nextExercise = exercises[nextExerciseIndex];
        const nextExerciseRounds = nextExercise.rounds || 1;
        
        // Include exercise if it has rounds remaining for current round
        if (nextExerciseRounds >= currentRound) {
          return nextExercise;
        }
        nextExerciseIndex++;
      }
      
      // If no more exercises in current round, check if we need to start next round
      const maxRounds = Math.max(...exercises.map(ex => ex.rounds || 1));
      
      if (currentRound < maxRounds) {
        // Find first exercise that has more rounds
        let firstExerciseIndex = 0;
        while (firstExerciseIndex < exercises.length) {
          const exercise = exercises[firstExerciseIndex];
          const exerciseRounds = exercise.rounds || 1;
          
          if (exerciseRounds > currentRound) {
            return exercise;
          }
          firstExerciseIndex++;
        }
      }
    }
    return null;
  };

  // Helper functions for formatting actual workout data

  const formatActualTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Calculate actual workout stats
  const actualDurationMinutes = Math.floor(actualWorkoutTime / 60);
  const actualDurationSeconds = actualWorkoutTime % 60;
  
  // Use session data from database if available, otherwise calculate
  const plannedWorkoutDuration = sessionData?.estimated_time || exercises.reduce((total, ex) => {
    const exerciseTime = (parseInt(ex.duration) || 45) * (ex.rounds || 1);
    const restTime = (parseInt(ex.rest) || 15) * Math.max(0, (ex.rounds || 1) - 1);
    return total + exerciseTime + restTime;
  }, 0);

  // Use session calories from database if available, otherwise calculate
  const actualCalories = sessionData?.estimated_calories || (() => {
    const safeIntensity = intensity && !isNaN(intensity) ? intensity : 50;
    return Math.round((plannedWorkoutDuration / 60) * 8 * (safeIntensity / 50));
  })();
  
  console.log('DEBUG - Session Data:', sessionData);
  console.log('DEBUG - Planned Duration:', plannedWorkoutDuration, 'Actual Calories:', actualCalories);
  console.log('DEBUG - Is NaN actualCalories?', isNaN(actualCalories));
  
  // Calculate workout score based on actual performance
  const calculateWorkoutScore = () => {
    const maxRounds = Math.max(...exercises.map(ex => ex.rounds || 1));
    const completionRate = (totalRoundsCompleted / maxRounds) * 100;
    const timeEfficiency = Math.min(100, (actualWorkoutTime / (actualWorkoutTime + 300)) * 100); // Bonus for efficiency
    const safeIntensity = intensity && !isNaN(intensity) ? intensity : 50;
    const intensityBonus = Math.min(20, safeIntensity - 30); // Bonus for higher intensity
    
    return Math.min(100, Math.round(completionRate * 0.6 + timeEfficiency * 0.3 + intensityBonus));
  };

  const workoutScore = calculateWorkoutScore();
  const maxRounds = Math.max(...exercises.map(ex => ex.rounds || 1));

  if (workoutCompleted) {
    return (
      <ScrollView style={styles.completedContainer} contentContainerStyle={styles.scrollContent}>
        {/* Check mark icon */}
        <View style={styles.checkMarkContainer}>
          <View style={styles.checkMarkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>

        {/* Header Section */}
        <View style={styles.completedHeader}>
          <Text style={styles.completedTitle}>Workout Completed!</Text>
          <Text style={styles.workoutType}>
            {sessionType || 'HIIT'} • {totalRoundsCompleted} of {maxRounds} Rounds
          </Text>
          <Text style={styles.completedDate}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })} • {new Date().toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </Text>
        </View>

        {/* Workout Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Text style={styles.clockIcon}>🕐</Text>
              </View>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{formatActualTime(plannedWorkoutDuration)}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Text style={styles.fireIcon}>🔥</Text>
              </View>
              <Text style={styles.statLabel}>Calories Burned</Text>
              <Text style={styles.statValue}>{actualCalories} kcal</Text>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Text style={styles.lightningIcon}>⚡</Text>
              </View>
              <Text style={styles.statLabel}>Avg. Intensity</Text>
              <Text style={styles.statValue}>{intensity >= 75 ? 'High' : intensity >= 50 ? 'Medium' : 'Low'}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Text style={styles.exerciseIcon}>💪</Text>
              </View>
              <Text style={styles.statLabel}>Exercises</Text>
              <Text style={styles.statValue}>{totalExercisesCompleted} completed</Text>
            </View>
          </View>
        </View>

        {/* Workout Score */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>Workout Score</Text>
            <Text style={styles.scoreValue}>{workoutScore}/100</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${workoutScore}%` }]} />
          </View>
        </View>

        {/* Workout Summary */}
        <View style={styles.energySection}>
          <Text style={styles.sectionTitle}>Workout Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Time</Text>
              <Text style={styles.summaryValue}>{formatActualTime(plannedWorkoutDuration)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Rounds Completed</Text>
              <Text style={styles.summaryValue}>{totalRoundsCompleted} / {maxRounds}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Exercises Done</Text>
              <Text style={styles.summaryValue}>{totalExercisesCompleted}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Calories Burned</Text>
              <Text style={styles.summaryValue}>{actualCalories} kcal</Text>
            </View>
          </View>
        </View>


        {/* How did you feel */}
        <View style={styles.feelingsSection}>
          <Text style={styles.sectionTitle}>How did you feel?</Text>
          <View style={styles.feelingsInput}>
            <Text style={styles.inputPlaceholder}>Optional notes about your workout...</Text>
          </View>
          <View style={styles.emojiOptions}>
            <TouchableOpacity style={styles.emojiButton}>
              <Text style={styles.emoji}>😊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emojiButton}>
              <Text style={styles.emoji}>😅</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emojiButton}>
              <Text style={styles.emoji}>😫</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Achievement Badges */}
        <View style={styles.achievementsSection}>
          <View style={styles.achievementBadge}>
            <Text style={styles.achievementIcon}>🔥</Text>
            <Text style={styles.achievementText}>Streak Day 3</Text>
          </View>
          <View style={styles.achievementBadge}>
            <Text style={styles.achievementIcon}>🏆</Text>
            <Text style={styles.achievementText}>1000 kcal burned total</Text>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareIcon}>📤</Text>
          <Text style={styles.shareButtonText}>Share Workout</Text>
        </TouchableOpacity>

        {/* Bottom Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.planNextButton} onPress={saveCardioDetails}>
            <Text style={styles.planNextButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const handleAddTime = () => {
    setTimeRemaining(time => time + 20);
  };

  const saveCardioDetails = async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      // Create a session record first
      const { data: sessionData, error: sessionError } = await supabase
        .from('saved_cardio_sessions')
        .insert({
          user_id: userId,
          name: sessionType || 'Cardio Workout',
          total_rounds: Math.max(...exercises.map(ex => ex.rounds || 1)),
          rest_between_rounds: restBetweenRounds || 15,
          sound_alerts: true,
          sound_option: 'ding',
          auto_repeat: false,
          notes: 'Completed Workout',
          estimated_time: actualWorkoutTime,
          estimated_calories: Math.round((actualWorkoutTime / 60) * 8 * (intensity / 50))
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session save error:', sessionError);
        Alert.alert('Error', 'Failed to save workout session');
        return;
      }

      // Save each exercise to cardio_details
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        const { error: exerciseError } = await supabase
          .from('cardio_details')
          .insert({
            session_id: sessionData.id,
            exercise_id: exercise.id || null,
            exercise_name: exercise.name || exercise.workout || `Exercise ${i + 1}`,
            duration: parseInt(exercise.duration) || 45,
            rest: parseInt(exercise.rest) || 15,
            rounds: parseInt(exercise.rounds) || 1,
            order_index: i + 1,
            image_url: exercise.gif_url || exercise.image_url || null
          });

        if (exerciseError) {
          console.error('Exercise save error:', exerciseError);
          Alert.alert('Error', 'Failed to save exercise details');
          return;
        }
      }

      Alert.alert(
        'Success',
        'Workout details saved successfully!',
        [{ text: 'OK', onPress: () => navigation.navigate('Create') }]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving');
    }
  };

  return (
    <View style={[styles.container, isResting && styles.restContainer]}>
      {/* Exercise Info */}
      <View style={styles.exerciseInfo}>
        <Text style={[styles.exerciseName, isResting && styles.restText]}>
          {isResting ? 'REST' : getCurrentExercise().name}
        </Text>
        <Text style={[styles.exerciseSubtitle, isResting && styles.restSubtitle]}>
          {isResting ? 'Take a break' : `Round ${currentRound} of ${getCurrentExercise().rounds || 1}`}
        </Text>
        {isResting && getNextExercise() && (
          <Text style={[styles.nextExerciseText, isResting && styles.restNextExerciseText]}>
            Next exercise: {getNextExercise().name}
          </Text>
        )}
      </View>
      
      {/* Exercise GIF */}
      {isResting && getNextExercise() ? (
        <View style={styles.restGifContainer}>
          {getNextExercise().gif_url ? (
            <Image
              key={`next-gif-${currentExerciseIndex}-${currentRound}`}
              source={{ uri: getNextExercise().gif_url }}
              style={styles.restExerciseGif}
              resizeMode="contain"
              fadeDuration={0}
              progressiveRenderingEnabled={false}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.noGifPlaceholder}>
              <Text style={styles.noGifText}>No GIF Available</Text>
            </View>
          )}
        </View>
      ) : !isResting && (
        <View style={styles.gifContainer}>
          {getCurrentExercise().gif_url ? (
            <Image
              key={`gif-${currentExerciseIndex}-${currentRound}`}
              source={{ uri: getCurrentExercise().gif_url }}
              style={styles.exerciseGif}
              resizeMode="contain"
              fadeDuration={0}
              progressiveRenderingEnabled={false}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.noGifPlaceholder}>
              <Text style={styles.noGifText}>No GIF Available</Text>
            </View>
          )}
        </View>
      )}

      {/* Timer */}
      <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={[styles.timer, isResting && styles.restTimer]}>{formatTime(timeRemaining)}</Text>
      </Animated.View>

      {/* Controls */}
      {isResting ? (
        <View style={styles.restControls}>
          <TouchableOpacity style={styles.addTimeButton} onPress={handleAddTime}>
            <Text style={styles.addTimeButtonText}>+20s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={24} 
              color={COLORS.white} 
            />
            <Text style={styles.controlButtonText}>
              {isPlaying ? 'Pause' : 'Play'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleSkip}>
            <Ionicons name="play-forward" size={24} color={COLORS.white} />
            <Text style={styles.controlButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleStop}>
            <Ionicons name="stop" size={24} color={COLORS.white} />
            <Text style={styles.controlButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'space-between',
    padding: 20,
  },
  exerciseInfo: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 10,
  },
  exerciseSubtitle: {
    fontSize: 18,
    color: COLORS.gray,
    textAlign: 'center',
  },
  nextExerciseText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Rest page styles
  restContainer: {
    backgroundColor: COLORS.primary,
  },
  restText: {
    color: COLORS.white,
  },
  restSubtitle: {
    color: COLORS.white,
  },
  restTimer: {
    color: COLORS.white,
  },
  restNextExerciseText: {
    color: COLORS.white,
  },
  restGifContainer: {
    width: '80%',
    height: 200,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  restExerciseGif: {
    width: '100%',
    height: '100%',
  },
  restControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    paddingHorizontal: 40,
  },
  addTimeButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 18,
    paddingHorizontal: 38,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  addTimeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 18,
    paddingHorizontal: 38,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  skipButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  gifContainer: {
    width: '100%',
    height: 300,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  exerciseGif: {
    width: '100%',
    height: '100%',
  },
  
  noGifPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
  },
  
  noGifText: {
    fontSize: 16,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  timer: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    minWidth: 80,
  },
  controlButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  
  // Completion screen styles
  completedContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  checkMarkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  checkMarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 32,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  completedHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  workoutType: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 5,
  },
  completedDate: {
    fontSize: 14,
    color: COLORS.grayLight,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  clockIcon: {
    fontSize: 20,
  },
  fireIcon: {
    fontSize: 20,
  },
  lightningIcon: {
    fontSize: 20,
  },
  heartIcon: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  bpmText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: COLORS.grayLight,
  },
  scoreSection: {
    marginBottom: 25,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  energySection: {
    marginBottom: 25,
  },
  summaryContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 15,
  },
  feelingsSection: {
    marginBottom: 25,
  },
  feelingsInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 80,
  },
  inputPlaceholder: {
    color: COLORS.grayLight,
    fontSize: 14,
  },
  emojiOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  emojiButton: {
    padding: 10,
  },
  emoji: {
    fontSize: 28,
  },
  achievementsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 25,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  achievementIcon: {
    fontSize: 16,
  },
  achievementText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
    gap: 8,
  },
  shareIcon: {
    fontSize: 16,
  },
  shareButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  planNextButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  planNextButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: '600',
  },
});