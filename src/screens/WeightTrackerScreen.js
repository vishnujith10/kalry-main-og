import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { OnboardingContext } from '../context/OnboardingContext';
import supabase from '../lib/supabase';
import { Alert as RNAlert } from 'react-native';

const PRIMARY = '#7B61FF';
const CARD_BG = '#F8F6FC';
const ACCENT_GREEN = '#1abc9c';
const ACCENT_RED = '#e74c3c';
const GRAY = '#888';
const WHITE = '#fff';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const WeightTrackerScreen = ({ navigation }) => {
  const { onboardingData, setOnboardingData } = useContext(OnboardingContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProgressMsg, setShowProgressMsg] = useState(false);

  // Get userId from Supabase Auth
  const [userId, setUserId] = useState(null);
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getUserId();
  }, []);

  // Fetch logs
  useEffect(() => {
    if (!userId) return;
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (!error && data) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, [userId, refreshing]);

  // Fetch user profile (for current weight)
  const fetchUserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data: profile } = await supabase
        .from('user_profile')
        .select('weight, target_weight')
        .eq('id', session.user.id)
        .single();
      if (profile) {
        setOnboardingData((prev) => ({
          ...prev,
          weight: profile.weight || prev.weight,
          target_weight: profile.target_weight || prev.target_weight,
        }));
      }
    }
  };

  // Refresh after adding new weight
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserProfile();
      setRefreshing((r) => !r); // triggers logs refetch
      setShowProgressMsg(true);
      setTimeout(() => setShowProgressMsg(false), 2000);
    });
    return unsubscribe;
  }, [navigation]);

  // --- Progress Bar and Weight Logic ---
  const targetWeight = Number(onboardingData?.target_weight) || 75;
  const weightUnit = onboardingData?.selectedWeightUnit || 'kg';
  // Original weight: from user profile (onboardingData.weight)
  const originalWeight = Number(onboardingData?.weight) || 0;
  // Current weight: most recent log's weight, or original if no logs
  const currentWeight = logs.length > 0 ? Number(logs[0].weight) : originalWeight;
  // Progress bar calculation
  let progress = 0;
  if (originalWeight !== targetWeight) {
    progress = (originalWeight - currentWeight) / (originalWeight - targetWeight);
    progress = Math.max(0, Math.min(1, progress));
  }
  // To go
  const toGo = Math.abs(currentWeight - targetWeight).toFixed(1);
  // Weekly change: find log closest to 7 days ago, or use originalWeight if no log
  let weeklyChange = 0;
  if (logs.length > 0) {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    let closest = logs[0];
    let minDiff = Math.abs(new Date(logs[0].date) - weekAgo);
    for (let log of logs) {
      const diff = Math.abs(new Date(log.date) - weekAgo);
      if (diff < minDiff) {
        minDiff = diff;
        closest = log;
      }
    }
    weeklyChange = (currentWeight - Number(closest.weight)).toFixed(1);
  } else {
    weeklyChange = 0;
  }
  const lastUpdated = logs[0] ? formatDate(logs[0].date) : '--';

  // Delete log handler
  const handleDeleteLog = async (logId) => {
    RNAlert.alert(
      'Delete Entry',
      'Are you sure you want to delete this weight entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('weight_logs').delete().eq('id', logId);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setRefreshing((r) => !r);
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <>
      <Text style={styles.header}>Track Your Weight</Text>
      <Text style={styles.subheader}>See how far you've come, at your pace.</Text>
      {/* Current Weight Card */}
      <View style={styles.currentCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="barbell-outline" size={20} color={PRIMARY} style={{ marginRight: 8 }} />
          <Text style={styles.currentLabel}>Current Weight</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.emoji}>{logs[0]?.emoji || '😊'}</Text>
        </View>
        <Text style={styles.currentWeight}>{currentWeight ? `${Number(currentWeight).toFixed(1)} ${weightUnit}` : '--'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <MaterialCommunityIcons name={weeklyChange < 0 ? 'arrow-down' : 'arrow-up'} size={18} color={weeklyChange < 0 ? ACCENT_GREEN : ACCENT_RED} />
          <Text style={[styles.weeklyChange, { color: weeklyChange < 0 ? ACCENT_GREEN : ACCENT_RED }]}>{weeklyChange > 0 ? '+' : ''}{weeklyChange} {weightUnit} this week</Text>
        </View>
        <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
      </View>
      {/* Progress Bar Card */}
      <View style={styles.goalCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Text style={styles.barWeightLabel}>{Number(originalWeight).toFixed(1)} {weightUnit}</Text>
          <Text style={styles.goalLabel}>Goal</Text>
          <Text style={styles.barWeightLabel}>{targetWeight} {weightUnit}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.toGoText}>{toGo} {weightUnit} to go</Text>
        {showProgressMsg && <Text style={styles.goalProgressText}>You're making great progress!</Text>}
      </View>
      <Text style={styles.historyHeader}>History</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={item => item.id?.toString() || item.date}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                <Text style={styles.historyEmoji}>{item.emoji || '😊'}</Text>
              </View>
              <Text style={styles.historyWeight}>{Number(item.weight).toFixed(1)} {weightUnit}</Text>
              <TouchableOpacity onPress={() => handleDeleteLog(item.id)} style={{ marginLeft: 10 }}>
                <Ionicons name="trash" size={20} color={ACCENT_RED} />
              </TouchableOpacity>
            </View>
            {item.note ? <Text style={styles.historyNote}>{item.note}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyHistory}>No weight entries yet.</Text>}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.scrollContent}
      />
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddWeightScreen')}>
        <Ionicons name="add" size={24} color={WHITE} />
        <Text style={styles.addBtnText}>Add New Weight</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { fontSize: 28, fontWeight: 'bold', color: PRIMARY, marginTop: 10, marginBottom: 2, fontFamily: 'Lexend-Bold' },
  subheader: { fontSize: 16, color: GRAY, marginBottom: 18, fontFamily: 'Manrope-Regular' },
  currentCard: { backgroundColor: CARD_BG, borderRadius: 18, padding: 20, marginBottom: 18, shadowColor: PRIMARY, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  currentLabel: { fontSize: 15, color: PRIMARY, fontFamily: 'Manrope-Bold' },
  emoji: { fontSize: 28, marginLeft: 8 },
  currentWeight: { fontSize: 38, fontWeight: 'bold', color: PRIMARY, fontFamily: 'Lexend-Bold', marginBottom: 2 },
  weeklyChange: { fontSize: 16, marginLeft: 6, fontFamily: 'Manrope-Regular' },
  lastUpdated: { fontSize: 13, color: GRAY, marginTop: 6, fontFamily: 'Manrope-Regular' },
  goalCard: { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: CARD_BG },
  goalLabel: { fontSize: 16, color: PRIMARY, fontFamily: 'Manrope-Bold' },
  barWeightLabel: { fontSize: 14, color: GRAY, fontFamily: 'Manrope-Bold', width: 60, textAlign: 'center' },
  progressBarBg: { flex: 1, height: 8, backgroundColor: CARD_BG, borderRadius: 8, marginHorizontal: 8, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: PRIMARY, borderRadius: 8 },
  toGoText: { fontSize: 15, color: PRIMARY, fontFamily: 'Lexend-Bold', textAlign: 'center', marginTop: 6 },
  goalProgressText: { fontSize: 15, color: ACCENT_GREEN, fontFamily: 'Manrope-Bold', textAlign: 'center', marginTop: 4 },
  historyHeader: { fontSize: 20, fontWeight: 'bold', color: PRIMARY, marginBottom: 8, fontFamily: 'Lexend-Bold' },
  historyItem: { backgroundColor: WHITE, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: CARD_BG },
  historyDate: { fontSize: 16, color: PRIMARY, fontFamily: 'Manrope-Bold', marginRight: 8 },
  historyWeight: { fontSize: 18, color: PRIMARY, fontFamily: 'Lexend-Bold', marginLeft: 8 },
  historyEmoji: { fontSize: 20, marginLeft: 4 },
  historyNote: { fontSize: 14, color: GRAY, marginTop: 2, fontFamily: 'Manrope-Regular' },
  emptyHistory: { color: GRAY, fontSize: 16, textAlign: 'center', marginTop: 20 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY, borderRadius: 32, paddingVertical: 18, margin: 20, position: 'absolute', left: 0, right: 0, bottom: 0 },
  addBtnText: { color: WHITE, fontFamily: 'Lexend-Bold', fontSize: 20, marginLeft: 8 },
});

export default WeightTrackerScreen; 