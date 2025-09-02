import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingProvider } from './src/context/OnboardingContext';
import HomeScreen from './src/homescreens/HomeScreen';
import MainDashboardScreen from './src/homescreens/MainDashboardScreen';
import ActivityLevelScreen from './src/screens/ActivityLevelScreen';
import AddWeightScreen from './src/screens/AddWeightScreen';
import AllExercisesScreen from './src/screens/AllExercisesScreen';
import AuthLoadingScreen from './src/screens/AuthLoadingScreen';
import CardioPlayerScreen from './src/screens/CardioPlayerScreen';
import CategoryWorkoutsScreen from './src/screens/CategoryWorkoutsScreen';
import CreateWorkoutScreen from './src/screens/CreateWorkoutScreen';
import CustomCameraScreen from './src/screens/CustomCameraScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import ExerciseScreen from './src/screens/ExerciseScreen';
import FocusScreen from './src/screens/FocusScreen';
import GoalMoodScreen from './src/screens/GoalMoodScreen';
import GoalScreen from './src/screens/GoalScreen';
import GoalSummaryScreen from './src/screens/GoalSummaryScreen';
import HydrationTrackerScreen from './src/screens/HydrationTrackerScreen';
import LoginScreen from './src/screens/LoginScreen';
import ManualLogScreen from './src/screens/ManualLogScreen';
import MealPreferencesScreen from './src/screens/MealPreferencesScreen';
import MinimalSignupTestScreen from './src/screens/MinimalSignupTestScreen';
import PhotoCalorieScreen from './src/screens/PhotoCalorieScreen';
import PostCalorieScreen from './src/screens/PostCalorieScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import QuickLogScreen from './src/screens/QuickLogScreen';
import ReferralSourceScreen from './src/screens/ReferralSourceScreen';
import SavedMealsScreen from './src/screens/SavedMealsScreen';
import SignupScreen from './src/screens/SignupScreen';
import SleepTrackerScreen from './src/screens/SleepTrackerScreen';
import StartWorkoutScreen from './src/screens/StartWorkoutScreen';
import StepTrackerScreen from './src/screens/StepTrackerScreen';
import TargetSummaryScreen from './src/screens/TargetSummaryScreen';
import TimePerDayScreen from './src/screens/TimePerDayScreen';
import VoiceCalorieScreen from './src/screens/VoiceCalorieScreen';
import VoicePostCalorieScreen from './src/screens/VoicePostCalorieScreen';
import WeightGoalScreen from './src/screens/WeightGoalScreen';
import WeightTrackerScreen from './src/screens/WeightTrackerScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WorkoutHistoryScreen from './src/screens/WorkoutHistoryScreen';
import WorkoutPreferencesScreen from './src/screens/WorkoutPreferencesScreen';
import WorkoutSpaceScreen from './src/screens/WorkoutSpaceScreen';
import WorkoutStartScreen from './src/screens/WorkoutStartScreen';
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#7B61FF',
        tabBarInactiveTintColor: '#B0B0B0',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#E5E7EB' },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Workouts') return <Ionicons name="barbell-outline" size={size} color={color} />;
          if (route.name === 'Create') return <Ionicons name="add-circle-outline" size={size} color={color} />;
          if (route.name === 'Exercise') return <Ionicons name="fitness-outline" size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Workouts" component={WorkoutHistoryScreen} />
      <Tab.Screen name="Create" component={CreateWorkoutScreen} />
      <Tab.Screen name="Exercise" component={ExerciseScreen} />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Lexend-Regular': require('./assets/Lexend,Manrope,Ubuntu/Lexend/static/Lexend-Regular.ttf'),
    'Lexend-Medium': require('./assets/Lexend,Manrope,Ubuntu/Lexend/static/Lexend-Medium.ttf'),
    'Lexend-SemiBold': require('./assets/Lexend,Manrope,Ubuntu/Lexend/static/Lexend-SemiBold.ttf'),
    'Manrope-Regular': require('./assets/Lexend,Manrope,Ubuntu/Manrope/static/Manrope-Regular.ttf'),
    'Manrope-Bold': require('./assets/Lexend,Manrope,Ubuntu/Manrope/static/Manrope-Bold.ttf'),
    'Ubuntu-Regular': require('./assets/Lexend,Manrope,Ubuntu/Ubuntu/Ubuntu-Regular.ttf'),
    'Ubuntu-Bold': require('./assets/Lexend,Manrope,Ubuntu/Ubuntu/Ubuntu-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <OnboardingProvider>
          <NavigationContainer>
          <Stack.Navigator initialRouteName="AuthLoading" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ReferralSource" component={ReferralSourceScreen} />
            <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
            <Stack.Screen name="Focus" component={FocusScreen} />
            <Stack.Screen name="GoalMood" component={GoalMoodScreen} />
            <Stack.Screen name="MealPreferences" component={MealPreferencesScreen} />
            <Stack.Screen name="WeightGoal" component={WeightGoalScreen} />
            <Stack.Screen name="TargetSummary" component={TargetSummaryScreen} />
            <Stack.Screen name="TimePerDay" component={TimePerDayScreen} />
            <Stack.Screen name="WorkoutPreferences" component={WorkoutPreferencesScreen} />
            <Stack.Screen name="WorkoutSpace" component={WorkoutSpaceScreen} />
            <Stack.Screen name="GoalSummary" component={GoalSummaryScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="MainDashboard" component={MainDashboardScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="PhotoCalorieScreen" component={PhotoCalorieScreen} />
            <Stack.Screen name="ManualLogScreen" component={ManualLogScreen} />
            <Stack.Screen name="VoiceCalorieScreen" component={VoiceCalorieScreen} />
            <Stack.Screen name="VoicePostCalorieScreen" component={VoicePostCalorieScreen} />
            <Stack.Screen name="MinimalSignupTest" component={MinimalSignupTestScreen} />
            <Stack.Screen name="Tabs" component={MainTabs} />
            <Stack.Screen name="Exercise" component={ExerciseScreen} />
            <Stack.Screen name="CategoryWorkouts" component={CategoryWorkoutsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Goal" component={GoalScreen} />
            <Stack.Screen name="SleepTrackerScreen" component={SleepTrackerScreen} options={{ headerShown: true, title: 'Sleep Tracker' }} />
            <Stack.Screen name="WeightTrackerScreen" component={WeightTrackerScreen} options={{ headerShown: true, title: 'Weight Tracker' }} />
            <Stack.Screen name="AddWeightScreen" component={AddWeightScreen} options={{ headerShown: true, title: 'Add New Weight' }} />
            <Stack.Screen name="HydrationTrackerScreen" component={HydrationTrackerScreen} options={{ headerShown: true, title: 'Water Weight' }} />
            <Stack.Screen name="StepTrackerScreen" component={StepTrackerScreen} options={{ headerShown: true, title: 'Step Tracker' }} />
            <Stack.Screen name="SavedMealsScreen" component={SavedMealsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="Create" component={CreateWorkoutScreen} />
            <Stack.Screen name="Workouts" component={WorkoutHistoryScreen} />
            <Stack.Screen name="PostCalorieScreen" component={PostCalorieScreen} />
            <Stack.Screen name="QuickLogScreen" component={QuickLogScreen} />
            <Stack.Screen name="StartWorkout" component={StartWorkoutScreen} />
            <Stack.Screen name="AllExercisesScreen" component={AllExercisesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CustomCameraScreen" component={CustomCameraScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CardioPlayerScreen" component={CardioPlayerScreen} />
            <Stack.Screen name="WorkoutStart" component={WorkoutStartScreen} />
            <Stack.Screen name="ProgressScreen" component={ProgressScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </OnboardingProvider>
    </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}