import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OnboardingContext } from '../context/OnboardingContext';
import supabase from '../lib/supabase';

import Svg, { Circle } from 'react-native-svg';

const SLEEP_QUALITIES = ['Excellent', 'Good', 'Fair', 'Poor'];
const MOODS = ['Relaxed', 'Neutral', 'Tired', 'Stressed'];
const SLEEP_TIPS = [
  'Establish a consistent sleep schedule, create a relaxing bedtime routine, and ensure your sleep environment is dark, quiet, and cool.',
  'Avoid caffeine and alcohol before bed, and consider light exercise during the day to promote better sleep.'
];

function getWeekDates() {
  const today = new Date();
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    week.push(d);
  }
  return week;
}

const SleepTrackerScreen = () => {
  const { onboardingData } = useContext(OnboardingContext);
  const [sleepLogs, setSleepLogs] = useState([]);
  const [lastSleep, setLastSleep] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [quality, setQuality] = useState('Good');
  const [mood, setMood] = useState('Relaxed');
  const [weekData, setWeekData] = useState([]);
  const [tipsIdx, setTipsIdx] = useState(0);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [sleepPhoto, setSleepPhoto] = useState(null);
  const [appleHealthSynced, setAppleHealthSynced] = useState(false);
  const [bedtimeReminder, setBedtimeReminder] = useState('22:30');
  const [wakeReminder, setWakeReminder] = useState('06:45');
  const [showBedtimeReminderPicker, setShowBedtimeReminderPicker] = useState(false);
  const [showWakeReminderPicker, setShowWakeReminderPicker] = useState(false);
  const [sleepGoal, setSleepGoal] = useState(8); // default 8 hours
  const [editMode, setEditMode] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [showAlreadyLoggedModal, setShowAlreadyLoggedModal] = useState(false);

  const [realUserId, setRealUserId] = useState(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setRealUserId(user?.id));
  }, []);

  // Helper to get today's date string in local timezone
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (realUserId) {
      fetchSleepLogs();
    }
  }, [realUserId]);

  // FIXED: Fetch data directly from Supabase instead of backend API
  async function fetchSleepLogs() {
    if (!realUserId) return;
    try {
      // Fetch directly from Supabase instead of backend API
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', realUserId)
        .order('date', { ascending: false });

      if (error) {
        console.log('Error fetching sleep logs:', error);
        return;
      }

      console.log('Fetched sleep logs:', data);
      setSleepLogs(data || []);
      setLastSleep(data?.[0] || null);
      
      // Prepare week data
      const week = getWeekDates();
      const weekMap = {};
      (data || []).forEach(log => { 
        const logDate = getDateOnly(log.date);
        weekMap[logDate] = log; 
      });
      setWeekData(week.map(d => weekMap[d.toISOString().slice(0,10)] || null));
    } catch (err) {
      console.log('Error fetching sleep logs:', err);
    }
  }

  async function handleAddSleep() {
    if (!realUserId || !startTime || !endTime) {
      Alert.alert('Missing info', 'Please select both start and end time.');
      return;
    }
    
    // Calculate duration as string
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    
    // Fixed logic for date assignment
    let logDate = new Date();
    
    // Only adjust date if sleep clearly crosses midnight
    if (sh > eh || (sh === eh && sm > em)) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour < eh || (currentHour === eh && currentMinute < em)) {
        logDate.setDate(logDate.getDate() - 1);
      }
    }
    
    const dateStr = logDate.toISOString().slice(0,10);
    
    // Check for existing log for this date
    const existingLog = sleepLogs.find(l => getDateOnly(l.date) === dateStr && l.user_id === realUserId);
    if (!editMode && existingLog) {
      setShowAlreadyLoggedModal(true);
      return;
    }

    try {
      let error;
      if (editMode && editingLogId) {
        // Update existing log
        ({ error } = await supabase.from('sleep_logs').update({
          start_time: startTime,
          end_time: endTime,
          duration,
          quality,
          mood,
        }).eq('id', editingLogId));
      } else {
        // Insert new log
        ({ error } = await supabase.from('sleep_logs').insert([{
          user_id: realUserId,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          duration,
          quality,
          mood,
        }]));
      }
      
      if (error) throw error;
      
      Alert.alert('Success', editMode ? 'Sleep log updated!' : 'Sleep log added!');
      
      // Clear form and close modal
      setStartTime('');
      setEndTime('');
      setQuality('Good');
      setMood('Relaxed');
      setEditMode(false);
      setEditingLogId(null);
      setShowLogModal(false);
      
      // **IMPORTANT**: Refresh the data immediately after saving
      await fetchSleepLogs();
      
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 0.7 
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const photo = result.assets[0];
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      const fileExt = photo.uri.split('.').pop();
      const fileName = `sleep_${userId}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('sleep-photos').upload(fileName, {
        uri: photo.uri,
        type: 'image/jpeg',
        name: fileName,
      });
      if (!error && data?.path) {
        const publicUrl = supabase.storage.from('sleep-photos').getPublicUrl(data.path).publicUrl;
        setSleepPhoto(publicUrl);
      }
    }
  }

  function formatDurationString(duration) {
    if (!duration) return '--';
    const hMatch = duration.match(/(\d+)\s*hour/);
    const mMatch = duration.match(/(\d+)\s*minute/);
    const h = hMatch ? parseInt(hMatch[1]) : 0;
    const m = mMatch ? parseInt(mMatch[1]) : 0;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    if (m) return `${m}m`;
    return '--';
  }

  function formatTime12h(time) {
    if (!time) return '';
    let [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  // Helper to normalize date string (handles 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:MM:SSZ')
  function getDateOnly(str) {
    return str ? str.slice(0, 10) : '';
  }

  // Helper to convert interval (e.g., '08:30:00') to '8h 30m' (robust)
  function parseIntervalToDisplay(interval) {
    if (!interval || typeof interval !== 'string') return '--';
    const clean = interval.trim();
    if (!clean.includes(':')) return '--';
    const parts = clean.split(':');
    if (parts.length < 2) return '--';
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    if (h === 0 && m === 0) return '--';
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}m`;
    return '--';
  }

  // Helper to convert interval to total minutes (robust)
  function parseIntervalToMinutes(interval) {
    if (!interval || typeof interval !== 'string') return 0;
    const clean = interval.trim();
    if (!clean.includes(':')) return 0;
    const parts = clean.split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    return h * 60 + m;
  }

  // Calculate average sleep duration from sleepLogs
  function getAverageSleepDuration(logs) {
    if (!logs || logs.length === 0) return '--';
    let totalMinutes = 0;
    let count = 0;
    logs.forEach(log => {
      const mins = parseIntervalToMinutes(log.duration);
      if (mins > 0) {
        totalMinutes += mins;
        count++;
      }
    });
    if (count === 0) return '--';
    const avg = Math.round(totalMinutes / count);
    const avgH = Math.floor(avg / 60);
    const avgM = avg % 60;
    if (avgH > 0 && avgM > 0) return `${avgH}h ${avgM}m`;
    if (avgH > 0) return `${avgH}h`;
    if (avgM > 0) return `${avgM}m`;
    return '--';
  }

  // **FIXED**: Get today's log and calculate metrics properly
  const todayStr = getTodayString();
  const todayLog = sleepLogs.find(l => getDateOnly(l.date) === todayStr && l.user_id === realUserId);
  
  console.log('Today string:', todayStr);
  console.log('Today log:', todayLog);
  console.log('All sleep logs:', sleepLogs.map(l => ({ date: l.date, user_id: l.user_id, duration: l.duration })));

  let todayDuration = '--';
  let todayMinutes = 0;
  let todayPercent = 0;
  let hitGoal = false;

  if (todayLog && todayLog.duration) {
    todayDuration = parseIntervalToDisplay(todayLog.duration);
    todayMinutes = parseIntervalToMinutes(todayLog.duration);
    todayPercent = sleepGoal > 0 ? Math.min(100, Math.round((todayMinutes / (sleepGoal * 60)) * 100)) : 0;
    hitGoal = todayMinutes >= sleepGoal * 60;
  }

  const averageSleep = getAverageSleepDuration(sleepLogs);

  // **FIXED**: Get latest log's bedtime and wake time
  let displayBedtime = '--:--';
  let displayWakeTime = '--:--';
  
  if (todayLog) {
    displayBedtime = todayLog.start_time ? formatTime12h(todayLog.start_time) : '--:--';
    displayWakeTime = todayLog.end_time ? formatTime12h(todayLog.end_time) : '--:--';
  }

  // Helper to get week days in order Mon-Sun
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDateObjs = [];
  const today = new Date();
  const monday = new Date(today);
  // Get the most recent Monday (if today is Monday, use today)
  const dayOfWeek = today.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so subtract 6 to get Monday
  monday.setDate(today.getDate() - daysToSubtract);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDateObjs.push(d);
  }

  // Map weekData by date string for lookup
  const weekLogMap = {};
  sleepLogs.forEach(log => { 
    weekLogMap[getDateOnly(log.date)] = log; 
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F7FC' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Sleep Overview Card */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View>
            <Text style={{ fontWeight: 'bold', fontSize: 32, color: '#2979FF', marginBottom: 6 }}>
              {todayDuration}
            </Text>
            {hitGoal ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: '#22C55E', fontWeight: '600', fontSize: 16, marginRight: 6 }}>✔</Text>
                <Text style={{ color: '#22C55E', fontWeight: '600', fontSize: 16 }}>You hit your goal!</Text>
              </View>
            ) : null}
          </View>
          <View style={{ alignItems: 'center' }}>
            <Svg height={76} width={76}>
              <Circle
                stroke="#E5E7EB"
                fill="none"
                cx={38}
                cy={38}
                r={30}
                strokeWidth={8}
              />
              <Circle
                stroke={todayLog && todayLog.duration ? '#A78BFA' : 'transparent'}
                fill="none"
                cx={38}
                cy={38}
                r={30}
                strokeWidth={8}
                strokeDasharray={`${2 * Math.PI * 30} ${2 * Math.PI * 30}`}
                strokeDashoffset={todayLog && todayLog.duration ? (2 * Math.PI * 30) * (1 - todayPercent / 100) : 2 * Math.PI * 30}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={{ 
              position: 'absolute', 
              top: 25, 
              left: 0, 
              right: 0, 
              textAlign: 'center', 
              fontWeight: 'bold', 
              color: '#000', 
              fontSize: 18 
            }}>
              {todayPercent}%
            </Text>
          </View>
        </View>

        {/* Sleep Analytics Section */}
        <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#222', marginBottom: 8, marginLeft: 4 }}>
          Your Sleep Analytics
        </Text>
        
        {/* Sleep Goal & Average Cards */}
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginRight: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}>
            <Ionicons name="timer-outline" size={22} color="#4F46E5" style={{ marginBottom: 4 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>{sleepGoal}h target</Text>
            <Text style={{ color: '#888', fontSize: 13 }}>Sleep Goal</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginLeft: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}>
            <Ionicons name="trending-up-outline" size={22} color="#4F46E5" style={{ marginBottom: 4 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>{averageSleep}</Text>
            <Text style={{ color: '#888', fontSize: 13 }}>Average Sleep</Text>
          </View>
        </View>

        {/* Bedtime & Wakeup Cards - FIXED to show actual logged times */}
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginRight: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}
            onPress={() => setShowFromPicker(true)}
          >
            <Ionicons name="moon-outline" size={22} color="#4F46E5" style={{ marginBottom: 4 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>{displayBedtime}</Text>
            <Text style={{ color: '#888', fontSize: 13 }}>Bedtime</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginLeft: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 }}
            onPress={() => setShowToPicker(true)}
          >
            <Ionicons name="sunny-outline" size={22} color="#4F46E5" style={{ marginBottom: 4 }} />
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>{displayWakeTime}</Text>
            <Text style={{ color: '#888', fontSize: 13 }}>Wake up</Text>
          </TouchableOpacity>
        </View>

        {/* Time Pickers */}
        {showFromPicker && (
          <DateTimePicker
            value={startTime ? new Date(`1970-01-01T${startTime}:00`) : new Date()}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, date) => {
              setShowFromPicker(false);
              if (date) {
                const h = date.getHours().toString().padStart(2, '0');
                const m = date.getMinutes().toString().padStart(2, '0');
                setStartTime(`${h}:${m}`);
              }
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={endTime ? new Date(`1970-01-01T${endTime}:00`) : new Date()}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, date) => {
              setShowToPicker(false);
              if (date) {
                const h = date.getHours().toString().padStart(2, '0');
                const m = date.getMinutes().toString().padStart(2, '0');
                setEndTime(`${h}:${m}`);
              }
            }}
          />
        )}

        {/* Sleep Goal Card */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 32,
          padding: 28,
          marginBottom: 24,
          shadowColor: '#1F2937',
          shadowOpacity: 0.08,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#EEF2FF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Text style={{ fontSize: 18 }}>💤</Text>
            </View>
            <View>
              <Text style={{
                fontSize: 22,
                fontWeight: '800',
                color: '#0F172A',
                letterSpacing: -0.5,
              }}>
                Sleep Goal
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#64748B',
                marginTop: 2,
              }}>
                {todayPercent}% of {sleepGoal} hours
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{
            height: 12,
            backgroundColor: '#F1F5F9',
            borderRadius: 24,
            overflow: 'hidden',
            marginBottom: 8,
            shadowColor: '#6366F1',
            shadowOpacity: 0.3,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          }}>
            <LinearGradient
              colors={['#8B5CF6', '#3B82F6', '#06B6D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: `${todayPercent}%`,
                height: '100%',
                borderRadius: 24,
              }}
            />
          </View>

          {/* Time Markers */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 28,
            paddingHorizontal: 4,
          }}>
            {['6h', '8h', '10h'].map((time, index) => (
              <View key={time} style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: index === 1 ? '#EEF2FF' : 'transparent',
              }}>
                <Text style={{ 
                  fontSize: 12, 
                  color: index === 1 ? '#4F46E5' : '#94A3B8',
                  fontWeight: index === 1 ? '600' : '500',
                }}>
                  {time}
                </Text>
              </View>
            ))}
          </View>

          {/* Reminder Cards */}
          <View style={{ gap: 16 }}>
            {/* Bedtime Reminder */}
            <TouchableOpacity
              onPress={() => setShowBedtimeReminderPicker(true)}
              style={{
                backgroundColor: '#FAFAFB',
                borderRadius: 24,
                paddingVertical: 18,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED']}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>🌙</Text>
                </LinearGradient>
                <View>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: '#1E293B',
                    marginBottom: 2,
                  }}>
                    Bedtime Reminder
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#64748B',
                  }}>
                    Wind down notification
                  </Text>
                </View>
              </View>
              <View style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: '#F0F9FF',
                borderWidth: 1,
                borderColor: '#E0F2FE',
              }}>
                <Text style={{ 
                  fontSize: 15, 
                  fontWeight: '700', 
                  color: '#0369A1',
                }}>
                  {bedtimeReminder}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Wake-up Alarm */}
            <TouchableOpacity
              onPress={() => setShowWakeReminderPicker(true)}
              style={{
                backgroundColor: '#FAFAFB',
                borderRadius: 24,
                paddingVertical: 18,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <LinearGradient
                  colors={['#F59E0B', '#EAB308']}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>⏰</Text>
                </LinearGradient>
                <View>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: '#1E293B',
                    marginBottom: 2,
                  }}>
                    Wake-up Alarm
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: '#64748B',
                  }}>
                    Start your day right
                  </Text>
                </View>
              </View>
              <View style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: '#FEF3C7',
                borderWidth: 1,
                borderColor: '#FDE68A',
              }}>
                <Text style={{ 
                  fontSize: 15, 
                  fontWeight: '700', 
                  color: '#92400E',
                }}>
                  {wakeReminder}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sleep History - FIXED */}
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#222', marginBottom: 8 }}>
          Sleep History
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row' }}>
            {weekDateObjs.map((dateObj, idx) => {
              const dateStr = dateObj.toISOString().slice(0,10);
              const log = weekLogMap[dateStr];
              const dayName = weekDays[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
              const isToday = dateStr === todayStr;
              
              return (
                <View 
                  key={dateStr} 
                  style={{ 
                    width: 80, 
                    height: 100, 
                    backgroundColor: isToday ? '#EEF2FF' : '#fff', 
                    borderRadius: 16, 
                    padding: 12, 
                    alignItems: 'center', 
                    marginRight: 12, 
                    shadowColor: '#000', 
                    shadowOpacity: 0.06, 
                    shadowRadius: 6, 
                    elevation: 2,
                    borderWidth: isToday ? 2 : 0,
                    borderColor: isToday ? '#4F46E5' : 'transparent'
                  }}
                >
                  <Ionicons 
                    name="moon" 
                    size={28} 
                    color={isToday ? "#4F46E5" : "#9CA3AF"} 
                    style={{ marginBottom: 6 }} 
                  />
                  <Text style={{ 
                    fontWeight: 'bold', 
                    fontSize: 16, 
                    color: isToday ? '#4F46E5' : '#222', 
                    marginBottom: 2 
                  }}>
                    {log ? parseIntervalToDisplay(log.duration) : '--'}
                  </Text>
                  <Text style={{ 
                    color: isToday ? '#4F46E5' : '#888', 
                    fontSize: 13 
                  }}>
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Apple Health Sync Card */}
        <View style={{ 
          backgroundColor: '#fff', 
          borderRadius: 14, 
          padding: 16, 
          flexDirection: 'row', 
          alignItems: 'center', 
          marginBottom: 18, 
          shadowColor: '#000', 
          shadowOpacity: 0.03, 
          shadowRadius: 6, 
          elevation: 1 
        }}>
          <Ionicons name="logo-apple" size={24} color="#222" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 'bold', color: '#222', fontSize: 15 }}>
              Connected to Apple Health
            </Text>
            <Text style={{ color: '#888', fontSize: 13 }}>Last synced 2h ago</Text>
          </View>
          <TouchableOpacity 
            style={{ 
              backgroundColor: '#F3F4F6', 
              borderRadius: 8, 
              paddingHorizontal: 14, 
              paddingVertical: 7 
            }}
            onPress={() => {
              // Manually refresh data when sync is pressed
              fetchSleepLogs();
            }}
          >
            <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>Sync</Text>
          </TouchableOpacity>
        </View>

        {/* Log Sleep Button */}
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#4F46E5', 
            borderRadius: 16, 
            paddingVertical: 16, 
            alignItems: 'center', 
            marginBottom: 18 
          }} 
          onPress={() => {
            const existingLog = sleepLogs.find(l => getDateOnly(l.date) === todayStr && l.user_id === realUserId);
            if (existingLog) {
              setShowAlreadyLoggedModal(true);
            } else {
              setEditMode(false);
              setEditingLogId(null);
              setShowLogModal(true);
            }
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
            Log Your Sleep
          </Text>
        </TouchableOpacity>

        {/* Already Logged Modal */}
        <Modal visible={showAlreadyLoggedModal} animationType="fade" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 18, textAlign: 'center' }}>
                Sleep already logged
              </Text>
              <Text style={{ fontSize: 16, color: '#374151', marginBottom: 24, textAlign: 'center' }}>
                You have already logged your sleep for today.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                  onPress={() => setShowAlreadyLoggedModal(false)} 
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#E5E7EB', 
                    borderRadius: 12, 
                    padding: 14, 
                    alignItems: 'center', 
                    marginRight: 8 
                  }}
                >
                  <Text style={{ color: '#374151', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    const log = sleepLogs.find(l => getDateOnly(l.date) === todayStr && l.user_id === realUserId);
                    if (log) {
                      setStartTime(log.start_time);
                      setEndTime(log.end_time);
                      setQuality(log.quality || 'Good');
                      setMood(log.mood || 'Relaxed');
                      setEditMode(true);
                      setEditingLogId(log.id);
                      setShowLogModal(true);
                    }
                    setShowAlreadyLoggedModal(false);
                  }} 
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#4F46E5', 
                    borderRadius: 12, 
                    padding: 14, 
                    alignItems: 'center', 
                    marginLeft: 8 
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Log Sleep Modal */}
        <Modal visible={showLogModal} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '90%' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 18 }}>
                {editMode ? 'Edit Your Sleep' : 'Log Your Sleep'}
              </Text>
              
              {/* Start Time Picker */}
              <TouchableOpacity 
                onPress={() => setShowFromPicker(true)} 
                style={{ 
                  marginBottom: 12, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  backgroundColor: '#F3F4F6', 
                  borderRadius: 12, 
                  padding: 14 
                }}
              >
                <Text style={{ fontSize: 16, color: '#374151' }}>Bedtime</Text>
                <Text style={{ fontSize: 16, color: '#3B82F6', fontWeight: '600' }}>
                  {startTime || '--:--'}
                </Text>
              </TouchableOpacity>
              
              {/* End Time Picker */}
              <TouchableOpacity 
                onPress={() => setShowToPicker(true)} 
                style={{ 
                  marginBottom: 12, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  backgroundColor: '#F3F4F6', 
                  borderRadius: 12, 
                  padding: 14 
                }}
              >
                <Text style={{ fontSize: 16, color: '#374151' }}>Wake-up</Text>
                <Text style={{ fontSize: 16, color: '#3B82F6', fontWeight: '600' }}>
                  {endTime || '--:--'}
                </Text>
              </TouchableOpacity>
              
              {/* Quality Picker */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 16, color: '#374151', marginBottom: 6 }}>Sleep Quality</Text>
                <View style={{ flexDirection: 'row' }}>
                  {SLEEP_QUALITIES.map(q => (
                    <TouchableOpacity 
                      key={q} 
                      onPress={() => setQuality(q)} 
                      style={{ 
                        backgroundColor: quality === q ? '#6366F1' : '#F3F4F6', 
                        borderRadius: 8, 
                        paddingVertical: 8, 
                        paddingHorizontal: 14, 
                        marginRight: 8 
                      }}
                    >
                      <Text style={{ 
                        color: quality === q ? '#fff' : '#374151', 
                        fontWeight: '600' 
                      }}>
                        {q}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Mood Picker */}
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 16, color: '#374151', marginBottom: 6 }}>Mood</Text>
                <View style={{ flexDirection: 'row' }}>
                  {MOODS.map(m => (
                    <TouchableOpacity 
                      key={m} 
                      onPress={() => setMood(m)} 
                      style={{ 
                        backgroundColor: mood === m ? '#A78BFA' : '#F3F4F6', 
                        borderRadius: 8, 
                        paddingVertical: 8, 
                        paddingHorizontal: 14, 
                        marginRight: 8 
                      }}
                    >
                      <Text style={{ 
                        color: mood === m ? '#fff' : '#374151', 
                        fontWeight: '600' 
                      }}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Log Sleep Button */}
              <TouchableOpacity
                style={{ 
                  backgroundColor: (!startTime || !endTime) ? '#CBD5E1' : '#3B82F6', 
                  borderRadius: 14, 
                  paddingVertical: 16, 
                  alignItems: 'center', 
                  marginBottom: 8 
                }}
                onPress={handleAddSleep}
                disabled={!startTime || !endTime}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                  {editMode ? 'Update Sleep' : 'Log Sleep'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => { 
                  setShowLogModal(false); 
                  setEditMode(false); 
                  setEditingLogId(null); 
                }} 
                style={{ alignItems: 'center', marginTop: 2 }}
              >
                <Text style={{ color: '#888', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Reminder Time Pickers */}
        {showBedtimeReminderPicker && (
          <DateTimePicker
            value={bedtimeReminder ? new Date(`1970-01-01T${bedtimeReminder}:00`) : new Date()}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, date) => {
              setShowBedtimeReminderPicker(false);
              if (date) {
                const h = date.getHours().toString().padStart(2, '0');
                const m = date.getMinutes().toString().padStart(2, '0');
                setBedtimeReminder(`${h}:${m}`);
              }
            }}
          />
        )}
        {showWakeReminderPicker && (
          <DateTimePicker
            value={wakeReminder ? new Date(`1970-01-01T${wakeReminder}:00`) : new Date()}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, date) => {
              setShowWakeReminderPicker(false);
              if (date) {
                const h = date.getHours().toString().padStart(2, '0');
                const m = date.getMinutes().toString().padStart(2, '0');
                setWakeReminder(`${h}:${m}`);
              }
            }}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: { fontSize: 28, fontFamily: 'Lexend-Bold', color: '#222', textAlign: 'center', marginTop: 10, marginBottom: 10 },
  lastSleepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  labelBlack: { fontSize: 16, fontFamily: 'Lexend-Bold', color: '#222', marginBottom: 2 },
  labelSmallBlack: { fontSize: 14, fontFamily: 'Manrope-Bold', color: '#222', marginRight: 8 },
  lastSleepDuration: { fontSize: 22, fontFamily: 'Lexend-Bold', color: '#222' },
  lastSleepTime: { fontSize: 15, fontFamily: 'Manrope-Regular', color: '#222' },
  lastSleepMood: { fontSize: 15, fontFamily: 'Manrope-Regular', color: '#222' },
  sleepImg: { width: 80, height: 80, borderRadius: 16, marginLeft: 12, backgroundColor: '#eee' },
  sleepImg1: { width: 80, height: 80, borderRadius: 16, marginLeft: 12, backgroundColor: '#eee', marginTop: -220 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, marginVertical: 4, fontFamily: 'Manrope-Regular', fontSize: 15, color: '#222', backgroundColor: '#fff' },
  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginRight: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 2,
  },
  pillBtnActive: {
    backgroundColor: '#7B61FF',
    borderColor: '#7B61FF',
  },
  pillBtnInactive: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
  },
  pillBtnText: {
    fontFamily: 'Lexend-Bold',
    color: '#222',
    fontSize: 15,
  },
  pillBtnTextActive: {
    color: '#fff',
  },
  addBtn: { backgroundColor: '#7B61FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 18 },
  addBtnText: { color: '#fff', fontFamily: 'Lexend-Bold', fontSize: 17 },
  syncCard: { backgroundColor: '#F3F0FF', borderRadius: 16, padding: 16, marginBottom: 18 },
  syncTitleBlack: { fontFamily: 'Lexend-Bold', fontSize: 16, color: '#222', marginBottom: 4 },
  syncTextBlack: { fontFamily: 'Manrope-Regular', fontSize: 15, color: '#222' },
  weekHeadingBlack: { fontSize: 20, fontFamily: 'Lexend-Bold', color: '#222', marginTop: 18, marginBottom: 6 },
  barChartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginVertical: 10 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 18, backgroundColor: '#D1C4E9', borderRadius: 6, marginBottom: 4 },
  barLabelBlack: { fontSize: 13, fontFamily: 'Manrope-Bold', color: '#222' },
  tipsTextBlack: { fontFamily: 'Manrope-Regular', fontSize: 15, color: '#222', marginBottom: 24 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  timeBtn: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, minWidth: 70, alignItems: 'center', backgroundColor: '#fff' },
  timeBtnText: { fontSize: 16, fontFamily: 'Lexend-Bold', color: '#222' },
  timeDash: { fontSize: 18, fontFamily: 'Lexend-Bold', color: '#222', marginHorizontal: 8 },
});

export default SleepTrackerScreen;
