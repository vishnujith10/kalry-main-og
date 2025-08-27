import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
};

export default function WorkoutStartScreen({ route, navigation }) {
  const { exercises, sessionType, intensity, totalRounds, restBetweenRounds } = route.params;
  
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
      if (currentRound < totalRounds) {
        setCurrentRound(currentRound + 1);
        setIsResting(false);
        const currentExercise = exercises[currentExerciseIndex];
        setTimeRemaining(parseInt(currentExercise.duration) || 45);
        setIsPlaying(true);
      } else if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentRound(1);
        setIsResting(false);
        const nextExercise = exercises[currentExerciseIndex + 1];
        setTimeRemaining(parseInt(nextExercise.duration) || 45);
        setIsPlaying(true);
      } else {
        // Workout complete
        completeWorkout();
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

  if (workoutCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedIcon}>🎉</Text>
          <Text style={styles.completedTitle}>Workout Completed!</Text>
          <Text style={styles.completedSubtitle}>Great job! You've finished your workout.</Text>
          <TouchableOpacity style={styles.okButton} onPress={handleWorkoutComplete}>
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Exercise Info */}
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseIcon}>
          {isResting ? '😴' : '💪'}
        </Text>
        <Text style={styles.exerciseName}>
          {isResting ? 'Rest Time' : getCurrentExercise().name}
        </Text>
        <Text style={styles.exerciseSubtitle}>
          {isResting ? 'Take a break' : `Round ${currentRound} of ${totalRounds}`}
        </Text>
      </View>

      {/* Timer */}
      <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
      </Animated.View>

      {/* Controls */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'space-between',
    padding: 20,
  },
  exerciseInfo: {
    alignItems: 'center',
    marginTop: 60,
  },
  exerciseIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  exerciseSubtitle: {
    fontSize: 18,
    color: COLORS.grayLight,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  timer: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.white,
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
    borderWidth: 1,
    borderColor: COLORS.white,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  controlButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completedIcon: {
    fontSize: 80,
    marginBottom: 30,
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 15,
  },
  completedSubtitle: {
    fontSize: 18,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginBottom: 40,
  },
  okButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  okButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
