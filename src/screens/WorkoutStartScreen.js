import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const { exercises, sessionType, intensity, restBetweenRounds } = route.params;
  
  // State management
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  
  // Timer ref
  const timerRef = useRef(null);
  
  // Animation for timer
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize first exercise and start timer automatically
  useEffect(() => {
    if (exercises.length > 0) {
      const firstExercise = exercises[0];
      setTimeRemaining(parseInt(firstExercise.duration) || 45);
      setIsPlaying(true); // Start timer automatically
    }
  }, []);

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
        setIsResting(false);
        const nextExercise = exercises[nextExerciseIndex];
        setTimeRemaining(parseInt(nextExercise.duration) || 45);
        setIsPlaying(true);
      } else {
        // All exercises in current round completed, check if we need to start next round
        const maxRounds = Math.max(...exercises.map(ex => ex.rounds || 1));
        
        if (currentRound < maxRounds) {
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

  const handleWorkoutComplete = () => {
    navigation.navigate('Create');
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

  // Calculate workout stats
  const totalDurationMinutes = Math.floor(exercises.reduce((total, ex) => {
    const exerciseTime = (parseInt(ex.duration) || 45) * (ex.rounds || 1);
    const restTime = (parseInt(ex.rest) || 15) * Math.max(0, (ex.rounds || 1) - 1);
    return total + exerciseTime + restTime;
  }, 0) / 60);

  const totalDurationSeconds = Math.floor(exercises.reduce((total, ex) => {
    const exerciseTime = (parseInt(ex.duration) || 45) * (ex.rounds || 1);
    const restTime = (parseInt(ex.rest) || 15) * Math.max(0, (ex.rounds || 1) - 1);
    return total + exerciseTime + restTime;
  }, 0) % 60);

  const estimatedCalories = Math.round(exercises.reduce((total, ex) => {
    const exerciseTime = (parseInt(ex.duration) || 45) * (ex.rounds || 1);
    const intensityMultiplier = intensity / 50;
    return total + (exerciseTime / 60) * 8 * intensityMultiplier;
  }, 0));

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
             {sessionType || 'HIIT'} • {maxRounds} Rounds
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
               <Text style={styles.statValue}>{totalDurationMinutes}m {totalDurationSeconds}s</Text>
             </View>
             <View style={styles.statItem}>
               <View style={styles.statIconContainer}>
                 <Text style={styles.fireIcon}>🔥</Text>
               </View>
               <Text style={styles.statLabel}>Calories Burned</Text>
               <Text style={styles.statValue}>~{estimatedCalories} kcal</Text>
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
                 <Text style={styles.heartIcon}>❤️</Text>
               </View>
               <Text style={styles.statLabel}>Heart Rate</Text>
               <Text style={styles.statValue}>128 / 165 <Text style={styles.bpmText}>bpm</Text></Text>
             </View>
           </View>
        </View>

        {/* Workout Score */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>Workout Score</Text>
            <Text style={styles.scoreValue}>75/100</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
        </View>

        {/* Energy Spent Chart */}
        <View style={styles.energySection}>
          <Text style={styles.sectionTitle}>Energy Spent</Text>
          <View style={styles.energyChartContainer}>
            <View style={styles.energyChart}>
              <View style={styles.energySegment}>
                <View style={[styles.energyBar, { height: 20, backgroundColor: '#fbbf24' }]} />
                <Text style={styles.energyPercentage}>P 15%</Text>
              </View>
              <View style={styles.energySegment}>
                <View style={[styles.energyBar, { height: 35, backgroundColor: '#7c3aed' }]} />
                <Text style={styles.energyPercentage}>F 25%</Text>
              </View>
              <View style={styles.energySegment}>
                <View style={[styles.energyBar, { height: 80, backgroundColor: '#1f2937' }]} />
                <Text style={styles.energyPercentage}>C 60%</Text>
              </View>
            </View>
            <View style={styles.energyCircle}>
              <View style={styles.circleChart}>
                <View style={styles.circleSegmentYellow} />
                <View style={styles.circleSegmentPurple} />
                <View style={styles.circleSegmentDark} />
              </View>
            </View>
          </View>
        </View>

        {/* Timeline Recap */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Timeline Recap</Text>
          <View style={styles.timelineChart}>
            <View style={[styles.timelineBar, styles.timelineBarGray]} />
            <View style={[styles.timelineBar, styles.timelineBarPurple]} />
            <View style={[styles.timelineBar, styles.timelineBarGray]} />
            <View style={[styles.timelineBar, styles.timelineBarPurple]} />
            <View style={[styles.timelineBar, styles.timelineBarGray]} />
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
          <TouchableOpacity style={styles.saveButton} onPress={handleWorkoutComplete}>
            <Text style={styles.saveButtonText}>Save & Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.planNextButton} onPress={() => navigation.navigate('Create')}>
            <Text style={styles.planNextButtonText}>Plan Next →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const handleAddTime = () => {
    setTimeRemaining(time => time + 20);
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 15,
  },
  energyChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  energyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    height: 120,
    paddingHorizontal: 20,
  },
  energySegment: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  energyBar: {
    width: 25,
    borderRadius: 4,
    marginBottom: 8,
  },
  energyPercentage: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
    transform: [{ rotate: '-45deg' }],
  },
  energyCircle: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  circleChart: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e5e7eb',
    position: 'relative',
    overflow: 'hidden',
  },
  circleSegmentYellow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 35,
    height: 35,
    backgroundColor: '#fbbf24',
    borderTopRightRadius: 35,
  },
  circleSegmentPurple: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 35,
    height: 70,
    backgroundColor: '#7c3aed',
    borderTopLeftRadius: 35,
    borderBottomLeftRadius: 35,
  },
  circleSegmentDark: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 35,
    height: 35,
    backgroundColor: '#1f2937',
    borderBottomRightRadius: 35,
  },
  timelineSection: {
    marginBottom: 25,
  },
  timelineChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    paddingHorizontal: 10,
  },
  timelineBar: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  timelineBarGray: {
    height: 20,
    backgroundColor: '#d1d5db',
  },
  timelineBarPurple: {
    height: 50,
    backgroundColor: COLORS.primary,
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
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
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