import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useContext, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingContext } from '../context/OnboardingContext';

const PRIMARY = '#222';
const SECONDARY = '#666666';
const BACKGROUND = '#ffffff';
const GRAY_LIGHT = '#f5f5f5';
const GRAY_MEDIUM = '#e0e0e0';
const ACCENT = '#FAD89B';
const INPUT_BG = '#f6f0ea';
const PLACEHOLDER = '#a08c7d';

const genders = ['Male', 'Female', ];

const MiniProfileScreen = () => {
  const navigation = useNavigation();
  const { setOnboardingData } = useContext(OnboardingContext);
  const [selectedGender, setSelectedGender] = useState('Male');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [isMetric, setIsMetric] = useState(true); // true for metric (cm/kg), false for imperial (ft/lbs)
  // Track which field is being edited
  const [editingHeight, setEditingHeight] = useState(''); // 'cm' or 'ft'
  const [editingWeight, setEditingWeight] = useState(''); // 'kg' or 'lbs'

  const handleUnitToggle = () => {
    if (isMetric) {
      // Convert from metric to imperial
      setIsMetric(false);
      // Convert current weight from kg to lbs
      if (weightKg) {
        const weightInLbs = (Number(weightKg) * 2.20462).toFixed(1);
        setWeightLbs(weightInLbs);
      }
      // Convert current height from cm to ft
      if (heightCm) {
        const heightInFt = (Number(heightCm) / 30.48).toFixed(1);
        setHeightFt(heightInFt);
      }
    } else {
      // Convert from imperial to metric
      setIsMetric(true);
      // Convert current weight from lbs to kg
      if (weightLbs) {
        const weightInKg = (Number(weightLbs) / 2.20462).toFixed(1);
        setWeightKg(weightInKg);
      }
      // Convert current height from ft to cm
      if (heightFt) {
        const heightInCm = (Number(heightFt) * 30.48).toFixed(0);
        setHeightCm(heightInCm);
      }
    }
  };

  // Height conversion
  const handleHeightCmChange = (val) => {
    setEditingHeight('cm');
    setHeightCm(val);
    if (val && !isNaN(Number(val))) {
      setHeightFt((Number(val) / 30.48).toFixed(2));
    } else {
      setHeightFt('');
    }
    setEditingHeight('');
  };
  const handleHeightFtChange = (val) => {
    setEditingHeight('ft');
    setHeightFt(val);
    if (val && !isNaN(Number(val))) {
      setHeightCm((Number(val) * 30.48).toFixed(0));
    } else {
      setHeightCm('');
    }
    setEditingHeight('');
  };

  // Weight conversion
  const handleWeightKgChange = (val) => {
    setEditingWeight('kg');
    setWeightKg(val);
    if (val && !isNaN(Number(val))) {
      setWeightLbs((Number(val) * 2.20462).toFixed(1));
    } else {
      setWeightLbs('');
    }
    setEditingWeight('');
  };
  const handleWeightLbsChange = (val) => {
    setEditingWeight('lbs');
    setWeightLbs(val);
    if (val && !isNaN(Number(val))) {
      setWeightKg((Number(val) / 2.20462).toFixed(1));
    } else {
      setWeightKg('');
    }
    setEditingWeight('');
  };

  // Validation rules
  const minHeightCm = 100;
  const minHeightFt = 3.3;
  const minWeightKg = 30;
  const minWeightLbs = 66;

  const allFieldsFilled =
    name.trim().length > 0 &&
    age.trim().length > 0 &&
    selectedGender.trim().length > 0 &&
    heightCm.trim().length > 0 &&
    heightFt.trim().length > 0 &&
    weightKg.trim().length > 0 &&
    weightLbs.trim().length > 0 &&
    !isNaN(Number(age)) &&
    !isNaN(Number(heightCm)) &&
    !isNaN(Number(heightFt)) &&
    !isNaN(Number(weightKg)) &&
    !isNaN(Number(weightLbs));

  const validHeight =
    Number(heightCm) >= minHeightCm && Number(heightFt) >= minHeightFt;
  const validWeight =
    Number(weightKg) >= minWeightKg && Number(weightLbs) >= minWeightLbs;

  const canShowBMI = allFieldsFilled && validHeight && validWeight;
  const canContinue = canShowBMI;

  // Calculate BMI (kg/m^2)
  let bmi = '';
  let bmiStatus = '';
  let bmiColor = '';
  
  if (canShowBMI) {
    const h = Number(heightCm) / 100;
    const w = Number(weightKg);
    if (h > 0) {
      bmi = (w / (h * h)).toFixed(1);
      const bmiNum = Number(bmi);
      
      // Determine BMI status and color
      if (bmiNum < 18.5) {
        bmiStatus = 'Underweight';
        bmiColor = '#FF6B6B';
      } else if (bmiNum >= 18.5 && bmiNum < 25) {
        bmiStatus = 'Healthy';
        bmiColor = '#51CF66';
      } else if (bmiNum >= 25 && bmiNum < 30) {
        bmiStatus = 'Overweight';
        bmiColor = '#FFA726';
      } else {
        bmiStatus = 'Obese';
        bmiColor = '#FF6B6B';
      }
    }
  }

  const handleContinue = async () => {
    // Save all data to context
    setOnboardingData({
      name,
      age,
      gender: selectedGender,
      heightCm,
      heightFt,
      weightKg,
      weightLbs,
      isMetric,
      bmi,
    });
    // Save to AsyncStorage for access in other screens before signup
    try {
      await AsyncStorage.setItem('kalry_onboarding_weight', isMetric ? weightKg : weightLbs);
      await AsyncStorage.setItem('kalry_onboarding_height', isMetric ? heightCm : heightFt);
      await AsyncStorage.setItem('kalry_onboarding_unit', isMetric ? 'kg' : 'lbs');
    } catch (e) { console.warn('Failed to save onboarding weight/height to storage', e); }
    navigation.navigate('ReferralSource');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.heading}>Personal Setup</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formWrap}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={PLACEHOLDER}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            placeholderTextColor={PLACEHOLDER}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {genders.map(gender => (
              <TouchableOpacity
                key={gender}
                style={[styles.genderButton, selectedGender === gender && styles.genderButtonSelected]}
                onPress={() => setSelectedGender(gender)}
              >
                <Text style={[styles.genderText, selectedGender === gender && styles.genderTextSelected]}>{gender}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Height & Weight</Text>
          <View style={styles.heightWeightRow}>
            <TextInput
              style={styles.heightWeightInput}
              placeholder={isMetric ? "Height (cm)" : "Height (ft)"}
              placeholderTextColor={PLACEHOLDER}
              value={isMetric ? heightCm : heightFt}
              onChangeText={isMetric ? handleHeightCmChange : handleHeightFtChange}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.heightWeightInput}
              placeholder={isMetric ? "Weight (kg)" : "Weight (lbs)"}
              placeholderTextColor={PLACEHOLDER}
              value={isMetric ? weightKg : weightLbs}
              onChangeText={isMetric ? handleWeightKgChange : handleWeightLbsChange}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, isMetric && styles.toggleBtnActive]}
              onPress={() => setIsMetric(true)}
            >
              <Text style={[styles.toggleBtnText, isMetric && styles.toggleBtnTextActive]}>Metric</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isMetric && styles.toggleBtnActive]}
              onPress={() => setIsMetric(false)}
            >
              <Text style={[styles.toggleBtnText, !isMetric && styles.toggleBtnTextActive]}>Imperial</Text>
            </TouchableOpacity>
          </View>
          {canShowBMI && (
            <View style={styles.bmiContainer}>
              <Text style={styles.bmiText}>BMI: {bmi}</Text>
              <Text style={[styles.bmiStatus, { color: bmiColor }]}>({bmiStatus})</Text>
            </View>
          )}
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, !canContinue && styles.buttonDisabled]}
            disabled={!canContinue}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  heading: {
    fontSize: 20,
    fontFamily: 'Lexend-Bold',
    color: PRIMARY,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 24,
  },
  formWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Manrope-Regular',
    color: PRIMARY,
    marginBottom: 6,
    marginTop: 18,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Manrope-Regular',
    color: PRIMARY,
    marginBottom: 10,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    fontSize: 15,
    fontFamily: 'Manrope-Regular',
    color: PRIMARY,
  },
  dropdownIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heightWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heightWeightInput: {
    flex: 1,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Manrope-Regular',
    color: PRIMARY,
    marginBottom: 10,
    borderWidth: 0,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    marginTop: 2,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: GRAY_MEDIUM,
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: GRAY_LIGHT,
    alignItems: 'center',
  },
  genderButtonSelected: {
    borderColor: PRIMARY,
    backgroundColor: GRAY_LIGHT,
  },
  genderText: {
    color: SECONDARY,
    fontWeight: '500',
    fontSize: 15,
  },
  genderTextSelected: {
    color: PRIMARY,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 0,
    marginBottom: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: ACCENT,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    shadowColor: ACCENT,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: {
    color: PRIMARY,
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: GRAY_MEDIUM,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
    backgroundColor: '#f8f6f3',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  toggleBtnActive: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  toggleBtnText: {
    fontFamily: 'Manrope-Regular',
    color: '#a08c7d',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleBtnTextActive: {
    color: PRIMARY,
    fontFamily: 'Lexend-Bold',
    fontWeight: '600',
  },
  bmiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8f6f3',
    borderRadius: 12,
    marginHorizontal: 20,
  },
  bmiText: {
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
    color: PRIMARY,
    marginRight: 8,
  },
  bmiStatus: {
    fontSize: 16,
    fontFamily: 'Lexend-Bold',
    fontWeight: '600',
  },
});

export default MiniProfileScreen; 