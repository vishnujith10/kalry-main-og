import { MaterialIcons } from '@expo/vector-icons';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { OnboardingContext } from '../context/OnboardingContext';
import supabase from '../lib/supabase';
import calculateCalorieProfile from '../utils/calorieCalculator';

const PRIMARY = '#000000';
const ORANGE = '#ff8800';
const BACKGROUND = '#ffffff';
const GRAY_MEDIUM = '#e0e0e0';
const GRAY_LIGHT = '#f5f5f5';

const SignupScreen = ({ navigation }) => {
  const { onboardingData } = useContext(OnboardingContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Test Supabase connectivity
  useEffect(() => {
    supabase
      .from('user_profile')
      .select('*')
      .limit(1)
      .then(({ data, error }) => {
        console.log('Test select:', { data, error });
      });
  }, []);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting signup with:', { email });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'kalry://login',
        },
      });

      console.log('Signup response:', { data, error });

      if (error) {
        if (error.message === 'User already registered') {
          Alert.alert(
            'Account Exists',
            'This email is already registered. Please try logging in instead.',
            [
              {
                text: 'Go to Login',
                onPress: () => navigation.navigate('Login'),
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
        } else {
          Alert.alert('Signup Error', error.message);
        }
        return;
      }

      if (!data) {
        Alert.alert(
          'Signup Complete',
          'Your account was created! Please log in to continue.',
          [{ text: 'OK', onPress: () => navigation.replace('Login') }]
        );
        return;
      }

      // Check if email confirmation is required
      if (data.user?.identities?.length === 0) {
        Alert.alert(
          'Check Your Email',
          'Please check your email for a confirmation link to complete your registration.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
        return;
      }

      // If we get here, the user is confirmed
      if (data.user) {
        // For production: Sign in immediately after signup to establish session
        console.log('User created, signing in to establish session...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (signInError) {
          console.error('Sign in failed after signup:', signInError);
          Alert.alert('Error', 'Account created but failed to establish session. Please try logging in manually.');
          return;
        }
        
        console.log('Successfully signed in, session established for profile creation');

        // Prepare the user profile data
        const userProfile = {
          id: data.user.id, // uuid from Supabase Auth
          name: onboardingData.name,
          age: onboardingData.age,
          gender: onboardingData.gender,
          height: onboardingData.height,
          weight: onboardingData.weight,
          social_refference: onboardingData.social_refference,
          daily_activity_level: onboardingData.daily_activity_level,
          goal_focus: onboardingData.goal_focus,
          target_weight: onboardingData.target_weight,
          weekly_target: onboardingData.weekly_target,
          spending_time: onboardingData.spending_time,
          prefered_workout: onboardingData.prefered_workout,
          total_days_per_week: onboardingData.total_days_per_week,
          prefered_time: onboardingData.prefered_time,
          // Add unit preferences from onboarding
          weight_unit: onboardingData.isMetric ? 'kg' : 'lbs',
          height_unit: onboardingData.isMetric ? 'cm' : 'ft',
        };

        console.log('Attempting to insert profile for user:', data.user.id);
        
        // Use a more permissive approach for profile creation
        // This works because we're using the user ID from the authenticated signup response
        const { error: profileError } = await supabase
          .from('user_profile')
          .insert([userProfile]);

        if (profileError) {
          console.error('Profile insert error:', profileError);
          Alert.alert('Warning', 'Account created but failed to save profile. Please contact support.');
        } else {
          // Calculate and update calorie profile
          const calorieData = calculateCalorieProfile({
            age: Number(onboardingData.age),
            gender: (onboardingData.gender || '').toLowerCase(),
            weight_kg: Number(onboardingData.weight),
            height_cm: Number(onboardingData.height),
            activity_level: (onboardingData.daily_activity_level || '').toLowerCase(),
            goal_type: (onboardingData.goal_focus || '').toLowerCase().includes('lose') ? 'lose' : (onboardingData.goal_focus || '').toLowerCase().includes('gain') ? 'gain' : 'maintain',
          });
          await supabase.from('user_profile').update({
            bmr: calorieData.bmr,
            tdee: calorieData.tdee,
            calorie_goal: calorieData.calorie_goal,
            protein_g: calorieData.macro_targets.protein_g,
            fat_g: calorieData.macro_targets.fat_g,
            carbs_g: calorieData.macro_targets.carbs_g,
          }).eq('id', data.user.id);
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainDashboard' }],
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={28} color={PRIMARY} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Sign up to start your fitness journey
          </Text>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color={GRAY_MEDIUM} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color={GRAY_MEDIUM} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color={GRAY_MEDIUM} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'SIGN UP'}
              </Text>
            </TouchableOpacity>
            {/* <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GRAY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: GRAY_MEDIUM,
    marginBottom: 32,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY_LIGHT,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
  },
  button: {
    backgroundColor: PRIMARY,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: BACKGROUND,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: GRAY_MEDIUM,
  },
  loginLink: {
    color: ORANGE,
    fontWeight: 'bold',
  },
});

export default SignupScreen; 