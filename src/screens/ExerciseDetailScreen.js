import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const COLORS = {
  primary: '#7B61FF',
  purple: '#A084E8',
  green: '#22C55E',
  gray: '#6B7280',
  background: '#F9FAFB',
  white: '#FFFFFF',
  card: '#FFFFFF',
  darkText: '#181A20',
  subText: '#6B7280',
  warning: '#F59E0B',
  border: '#E5E7EB',
  shadow: '#E5E7EB',
};

const FONT = {
  heading: 'Lexend-SemiBold',
  regular: 'Manrope-Regular',
  bold: 'Manrope-Bold',
};

const mock = {
  name: 'Push-Up',
  type: 'Strength',
  equipment: 'Bodyweight',
  level: 'Beginner',
  kcal: '~25 kcal/set',
  reps: '10-15 reps',
  image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
  target: [
    { icon: 'arm-flex', label: 'Chest', sub: 'Primary' },
    { icon: 'arm-flex', label: 'Triceps', sub: 'Secondary' },
  ],
  benefits: [
    { icon: 'arm-flex', text: 'Builds upper body strength' },
    { icon: 'run-fast', text: 'Improves core stability' },
    { icon: 'heart-pulse', text: 'Enhances posture' },
  ],
  steps: [
    'Start in high plank position',
    'Lower your body with control',
    'Push back up to starting position',
    'Maintain proper form throughout',
  ],
  stepWarnings: [1],
  stepWarningText: 'Keep elbows close to body',
  equipmentList: [
    'Clear floor space (1.5m)',
    'Exercise mat (optional)',
  ],
  progress: {
    lastPerformed: '4 days ago',
    lastSession: '3 sets × 12 reps',
    thisWeek: '+2 reps',
  },
};

export default function ExerciseDetailScreen() {
  const route = useRoute();
  const workout = route.params?.workout || mock;

  // Micro-interaction helpers
  function usePressScale(initial = 1, pressed = 1.06) {
    const scale = useSharedValue(initial);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const onPressIn = () => { scale.value = withSpring(pressed); };
    const onPressOut = () => { scale.value = withSpring(initial); };
    return { animatedStyle, onPressIn, onPressOut };
  }

  // Play button
  const playBtnAnim = usePressScale();
  // Footer buttons
  const startBtnAnim = usePressScale();
  const addBtnAnim = usePressScale();
  const cameraBtnAnim = usePressScale();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerIcon}><Ionicons name="arrow-back" size={24} color={COLORS.darkText} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Detail</Text>
        <TouchableOpacity style={styles.headerIcon}><Ionicons name="share-outline" size={22} color={COLORS.darkText} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Media */}
        <View style={styles.mediaWrap}>
          <Image source={{ uri: workout.image }} style={styles.mediaImg} />
          <TouchableOpacity
            style={styles.playBtn}
            onPressIn={playBtnAnim.onPressIn}
            onPressOut={playBtnAnim.onPressOut}
          >
            <Animated.View style={playBtnAnim.animatedStyle}>
              <Ionicons name="play" size={32} color={COLORS.primary} />
            </Animated.View>
          </TouchableOpacity>
        </View>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={styles.exerciseName}>{workout.name}</Text>
            <View style={styles.levelPill}><Text style={styles.levelText}>{workout.level}</Text></View>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="arm-flex" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.infoMeta}>{workout.type} • {workout.equipment}</Text>
            <MaterialCommunityIcons name="fire" size={18} color={COLORS.warning} style={{ marginLeft: 16, marginRight: 4 }} />
            <Text style={styles.infoMeta}>{workout.kcal}</Text>
            <MaterialCommunityIcons name="counter" size={18} color={COLORS.primary} style={{ marginLeft: 16, marginRight: 4 }} />
            <Text style={styles.infoMeta}>{workout.reps}</Text>
          </View>
        </View>
        {/* Target Muscles */}
        <Text style={styles.sectionTitle}>Target Muscles</Text>
        <View style={styles.pillRow}>
          {(workout.target || []).map((t, i) => {
            const pillAnim = usePressScale();
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPressIn={pillAnim.onPressIn}
                onPressOut={pillAnim.onPressOut}
              >
                <Animated.View style={[styles.targetPill, pillAnim.animatedStyle]}>
                  <MaterialCommunityIcons name={t.icon} size={24} color={COLORS.primary} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.targetLabel}>{t.label}</Text>
                    <Text style={styles.targetSub}>{t.sub}</Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Benefits */}
        <Text style={styles.sectionTitle}>Benefits</Text>
        <View style={styles.card}>
          {(workout.benefits || []).map((b, i) => {
            const benefitAnim = usePressScale();
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPressIn={benefitAnim.onPressIn}
                onPressOut={benefitAnim.onPressOut}
              >
                <Animated.View style={[styles.benefitRow, benefitAnim.animatedStyle]}>
                  <MaterialCommunityIcons name={b.icon} size={20} color={COLORS.purple} />
                  <Text style={styles.benefitText}>{b.text}</Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Steps */}
        <Text style={styles.sectionTitle}>How to Perform</Text>
        <View style={styles.card}>
          {(workout.steps || []).map((step, i) => {
            const stepAnim = usePressScale();
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={1}
                onPressIn={stepAnim.onPressIn}
                onPressOut={stepAnim.onPressOut}
                disabled
              >
                <Animated.View style={[styles.stepRow, stepAnim.animatedStyle]}>
                  <View style={[styles.stepCircle, { backgroundColor: i === 1 ? '#DDD6FE' : '#F3F4F6' }]}><Text style={styles.stepNumber}>{i + 1}</Text></View>
                  <Text style={styles.stepText}>{step}</Text>
                  {(workout.stepWarnings || []).includes(i) && (
                    <View style={styles.warningBox}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.warning} />
                      <Text style={styles.warningText}> {workout.stepWarningText}</Text>
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Equipment */}
        <Text style={styles.sectionTitle}>What You’ll Need</Text>
        <View style={styles.pillRow}>
          {(workout.equipmentList || []).map((item, i) => {
            const equipAnim = usePressScale();
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPressIn={equipAnim.onPressIn}
                onPressOut={equipAnim.onPressOut}
              >
                <Animated.View style={[styles.equipPill, equipAnim.animatedStyle]}>
                  <Ionicons name="information-circle-outline" size={18} color={COLORS.gray} style={{ marginRight: 6 }} />
                  <Text style={styles.equipText}>{item}</Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Progress */}
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}><Text style={styles.progressLabel}>Last performed</Text><Text style={styles.progressValue}>{workout.progress?.lastPerformed || ''}</Text></View>
          <View style={styles.progressRow}><Text style={styles.progressLabel}>Last session</Text><Text style={styles.progressValue}>{workout.progress?.lastSession || ''}</Text></View>
          <View style={styles.progressRow}><Text style={styles.progressLabel}>This week</Text><Text style={[styles.progressValue, { color: COLORS.green }]}>{workout.progress?.thisWeek || ''}</Text></View>
        </View>
        {/* Footer Buttons */}
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPressIn={startBtnAnim.onPressIn}
            onPressOut={startBtnAnim.onPressOut}
          >
            <Animated.View style={startBtnAnim.animatedStyle}>
              <Text style={styles.primaryBtnText}>Start Exercise</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPressIn={cameraBtnAnim.onPressIn}
            onPressOut={cameraBtnAnim.onPressOut}
          >
            <Animated.View style={cameraBtnAnim.animatedStyle}>
              <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
            </Animated.View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.outlineBtn}
          activeOpacity={0.85}
          onPressIn={addBtnAnim.onPressIn}
          onPressOut={addBtnAnim.onPressOut}
        >
          <Animated.View style={addBtnAnim.animatedStyle}>
            <Text style={styles.outlineBtnText}>Add to Plan</Text>
          </Animated.View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontFamily: FONT.heading, fontSize: 20, color: COLORS.darkText, textAlign: 'center', flex: 1 },
  headerIcon: { width: 32, alignItems: 'center' },
  mediaWrap: { width: '100%', aspectRatio: 1.7, borderRadius: 20, marginTop: 8, overflow: 'hidden', marginBottom: 10, backgroundColor: COLORS.card, alignSelf: 'center' },
  mediaImg: { width: '100%', height: '100%' },
  playBtn: { position: 'absolute', top: '45%', left: '45%', backgroundColor: COLORS.white, padding: 12, borderRadius: 30, elevation: 4 },
  infoCard: { backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 16, padding: 18, marginBottom: 16, shadowColor: COLORS.shadow, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  exerciseName: { fontFamily: FONT.heading, fontSize: 22, color: COLORS.darkText, flex: 1 },
  levelPill: { backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  levelText: { fontFamily: FONT.bold, fontSize: 13, color: COLORS.primary },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  infoMeta: { fontFamily: FONT.regular, fontSize: 15, color: COLORS.subText },
  sectionTitle: { fontFamily: FONT.heading, fontSize: 16, color: COLORS.darkText, marginHorizontal: 18, marginTop: 18, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 10, marginBottom: 8 },
  targetPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginRight: 10, marginBottom: 8, shadowColor: COLORS.shadow, shadowOpacity: 0.08, shadowRadius: 6, elevation: 1 },
  targetLabel: { fontFamily: FONT.heading, fontSize: 15, color: COLORS.primary },
  targetSub: { fontFamily: FONT.regular, fontSize: 13, color: COLORS.subText },
  card: { backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: COLORS.shadow, shadowOpacity: 0.08, shadowRadius: 8, elevation: 1 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  benefitText: { fontFamily: FONT.regular, fontSize: 15, marginLeft: 10, color: COLORS.darkText },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepNumber: { fontFamily: FONT.bold, fontSize: 15, color: COLORS.primary },
  stepText: { fontFamily: FONT.regular, fontSize: 15, color: COLORS.darkText, flex: 1 },
  warningBox: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  warningText: { fontFamily: FONT.regular, fontSize: 13, color: COLORS.warning },
  equipPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginRight: 10, marginBottom: 8, shadowColor: COLORS.shadow, shadowOpacity: 0.08, shadowRadius: 6, elevation: 1 },
  equipText: { fontFamily: FONT.regular, fontSize: 15, color: COLORS.subText },
  progressCard: { backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: COLORS.shadow, shadowOpacity: 0.08, shadowRadius: 8, elevation: 1 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  progressLabel: { fontFamily: FONT.regular, fontSize: 15, color: COLORS.subText },
  progressValue: { fontFamily: FONT.bold, color: COLORS.darkText },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginHorizontal: 16 },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, flex: 1, alignItems: 'center' },
  primaryBtnText: { fontFamily: FONT.bold, fontSize: 16, color: COLORS.white },
  secondaryBtn: { marginLeft: 12, padding: 12, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, backgroundColor: COLORS.white },
  outlineBtn: { marginHorizontal: 16, marginTop: 16, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  outlineBtnText: { fontFamily: FONT.bold, fontSize: 16, color: COLORS.primary },
});
