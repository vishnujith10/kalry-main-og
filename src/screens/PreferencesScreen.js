import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const PreferencesScreen = () => {
  const navigation = useNavigation();
  
  // State for units
  const [weightUnit, setWeightUnit] = useState('kg');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [caloriesUnit, setCaloriesUnit] = useState('kcal');
  
  // State for meal reminders
  const [breakfastReminder, setBreakfastReminder] = useState(true);
  const [lunchReminder, setLunchReminder] = useState(true);
  const [dinnerReminder, setDinnerReminder] = useState(true);
  
  // State for workout reminders
  const [workoutReminder, setWorkoutReminder] = useState(true);
  
  // State for theme
  const [appTheme, setAppTheme] = useState('Light');
  const [accentColor, setAccentColor] = useState('blue');
  
  // State for sleep reminders
  const [sleepReminder, setSleepReminder] = useState(false);
  
  const accentColors = [
    { key: 'blue', color: '#007AFF', name: 'Blue' },
    { key: 'pink', color: '#FF2D92', name: 'Pink' },
    { key: 'purple', color: '#7B61FF', name: 'Purple' },
    { key: 'green', color: '#34C759', name: 'Green' },
  ];
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8E9F0" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Preferences</Text>
          <Text style={styles.headerSubtitle}>Set your app experience to suit your routine.</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* Units Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Units</Text>
          
          {/* Weight Units */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Weight Units</Text>
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
                onPress={() => setWeightUnit('kg')}
              >
                <Text style={[styles.unitButtonText, weightUnit === 'kg' && styles.unitButtonTextActive]}>kg</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitButton, weightUnit === 'lb' && styles.unitButtonActive]}
                onPress={() => setWeightUnit('lb')}
              >
                <Text style={[styles.unitButtonText, weightUnit === 'lb' && styles.unitButtonTextActive]}>lb</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Distance Units */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Distance Units</Text>
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[styles.unitButton, distanceUnit === 'km' && styles.unitButtonActive]}
                onPress={() => setDistanceUnit('km')}
              >
                <Text style={[styles.unitButtonText, distanceUnit === 'km' && styles.unitButtonTextActive]}>km</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitButton, distanceUnit === 'miles' && styles.unitButtonActive]}
                onPress={() => setDistanceUnit('miles')}
              >
                <Text style={[styles.unitButtonText, distanceUnit === 'miles' && styles.unitButtonTextActive]}>miles</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Calories Display */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Calories Display</Text>
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[styles.unitButton, caloriesUnit === 'kcal' && styles.unitButtonActive]}
                onPress={() => setCaloriesUnit('kcal')}
              >
                <Text style={[styles.unitButtonText, caloriesUnit === 'kcal' && styles.unitButtonTextActive]}>kcal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitButton, caloriesUnit === 'kJ' && styles.unitButtonActive]}
                onPress={() => setCaloriesUnit('kJ')}
              >
                <Text style={[styles.unitButtonText, caloriesUnit === 'kJ' && styles.unitButtonTextActive]}>kJ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Meal Reminders Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Meal Reminders</Text>
          
          <View style={styles.reminderRow}>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderLabel}>Breakfast</Text>
              <Text style={styles.reminderTime}>08:00 AM</Text>
            </View>
            <Switch
              value={breakfastReminder}
              onValueChange={setBreakfastReminder}
              trackColor={{ false: '#E5E5EA', true: '#7B61FF' }}
              thumbColor={breakfastReminder ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          <View style={styles.reminderRow}>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderLabel}>Lunch</Text>
              <Text style={styles.reminderTime}>12:00 PM</Text>
            </View>
            <Switch
              value={lunchReminder}
              onValueChange={setLunchReminder}
              trackColor={{ false: '#E5E5EA', true: '#7B61FF' }}
              thumbColor={lunchReminder ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          <View style={styles.reminderRow}>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderLabel}>Dinner</Text>
              <Text style={styles.reminderTime}>07:00 PM</Text>
            </View>
            <Switch
              value={dinnerReminder}
              onValueChange={setDinnerReminder}
              trackColor={{ false: '#E5E5EA', true: '#7B61FF' }}
              thumbColor={dinnerReminder ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Workout Reminders Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Workout Reminders</Text>
          
          <View style={styles.reminderRow}>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderText}>Next Workout Reminder: 7:00 AM</Text>
            </View>
            <Switch
              value={workoutReminder}
              onValueChange={setWorkoutReminder}
              trackColor={{ false: '#E5E5EA', true: '#7B61FF' }}
              thumbColor={workoutReminder ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Theme & Appearance Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Theme & Appearance</Text>
          
          {/* App Theme */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>App Theme</Text>
            <View style={styles.themeSelector}>
              <TouchableOpacity
                style={[styles.themeButton, appTheme === 'Light' && styles.themeButtonActive]}
                onPress={() => setAppTheme('Light')}
              >
                <Text style={[styles.themeButtonText, appTheme === 'Light' && styles.themeButtonTextActive]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeButton, appTheme === 'Dark' && styles.themeButtonActive]}
                onPress={() => setAppTheme('Dark')}
              >
                <Text style={[styles.themeButtonText, appTheme === 'Dark' && styles.themeButtonTextActive]}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeButton, appTheme === 'Auto' && styles.themeButtonActive]}
                onPress={() => setAppTheme('Auto')}
              >
                <Text style={[styles.themeButtonText, appTheme === 'Auto' && styles.themeButtonTextActive]}>Auto</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Accent Color */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Accent Color</Text>
            <View style={styles.colorSelector}>
              {accentColors.map((color) => (
                <TouchableOpacity
                  key={color.key}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color.color },
                    accentColor === color.key && styles.colorButtonActive
                  ]}
                  onPress={() => setAccentColor(color.key)}
                >
                  {accentColor === color.key && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Theme Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Theme Preview</Text>
            <View style={styles.previewContainer}>
              <View style={[styles.previewBlock, { backgroundColor: accentColors.find(c => c.key === accentColor)?.color || '#007AFF' }]} />
              <View style={[styles.previewBlock, { backgroundColor: '#E5E5EA' }]} />
            </View>
          </View>
        </View>

        {/* Sleep Reminders Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Reminders</Text>
          
          <View style={styles.reminderRow}>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderLabel}>Bedtime: 10:00 PM</Text>
              <Text style={styles.reminderLabel}>Wake-up: 6:00 AM</Text>
            </View>
            <Switch
              value={sleepReminder}
              onValueChange={setSleepReminder}
              trackColor={{ false: '#E5E5EA', true: '#7B61FF' }}
              thumbColor={sleepReminder ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8E9F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#E8E9F0',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  settingRow: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#7B61FF',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  reminderTime: {
    fontSize: 14,
    color: '#7B61FF',
    fontWeight: '500',
  },
  reminderText: {
    fontSize: 14,
    color: '#666',
  },
  themeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  themeButtonActive: {
    backgroundColor: '#7B61FF',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  themeButtonTextActive: {
    color: '#FFFFFF',
  },
  colorSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#7B61FF',
  },
  previewSection: {
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  previewContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  previewBlock: {
    flex: 1,
    height: 40,
    borderRadius: 8,
  },
});

export default PreferencesScreen;
