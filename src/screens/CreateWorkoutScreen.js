import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator, Modal, Image, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import supabase from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { fetchExercises } from '../lib/workoutApi';
import Slider from '@react-native-community/slider';
import { saveCardioSession, updateCardioSession } from '../lib/cardioSessionApi';

const COLORS = {
  primary: '#22C55E', // green
  background: '#F9FAFB',
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  white: '#fff',
  gray: '#B0B0B0',
  dark: '#181A20',
  border: '#E5E7EB',
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  text: '#181A20',
  textSecondary: '#6B7280',
  icon: '#22C55E',
};

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SOUND_OPTIONS = [
  { key: 'ding', label: 'Ding' },
  { key: 'gong', label: 'Gong' },
  { key: 'voice', label: 'Voice' },
];

export default function CreateWorkoutScreen({ route }) {
  const navigation = useNavigation();
  // If editing, get session from route params
  const editingSession = route?.params?.session || null;
  // Session type and intensity
  const SESSION_TYPES = [
    'Jogging', 'Dance Cardio', 'Warm-Up Flow', 'HIIT', 'Cycling', 'Custom'
  ];
  const INTENSITIES = ['Low', 'Medium', 'High'];
  const [sessionType, setSessionType] = useState(editingSession ? editingSession.session_type || '' : '');
  const [customSessionType, setCustomSessionType] = useState(editingSession && editingSession.session_type && !SESSION_TYPES.includes(editingSession.session_type) ? editingSession.session_type : '');
  const [intensity, setIntensity] = useState(editingSession ? editingSession.intensity || '' : '');
  const [workoutName, setWorkoutName] = useState(editingSession ? editingSession.name : '');
  const [exercises, setExercises] = useState(editingSession ? (editingSession.exercises || []) : []); // {id, name, type, img, duration, rest}
  const [selectedDays, setSelectedDays] = useState([0, 2, 4]);
  const [reminderTime, setReminderTime] = useState('07:00');
  const [autoRepeat, setAutoRepeat] = useState(editingSession ? !!editingSession.auto_repeat : true);
  const [notes, setNotes] = useState(editingSession ? editingSession.notes : '');
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseResults, setExerciseResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  // Session-wide settings
  const [totalRounds, setTotalRounds] = useState(editingSession ? editingSession.total_rounds || 3 : 3);
  const [restBetweenRounds, setRestBetweenRounds] = useState(editingSession ? editingSession.rest_between_rounds || 60 : 60);
  const [soundAlerts, setSoundAlerts] = useState(editingSession ? !!editingSession.sound_alerts : true);
  const [soundOption, setSoundOption] = useState(editingSession ? editingSession.sound_option || 'ding' : 'ding');
  const [summary, setSummary] = useState({ totalTime: 0, totalCalories: 0 });
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [modalDuration, setModalDuration] = useState('');
  const [modalRest, setModalRest] = useState('');
  const [modalType, setModalType] = useState('time'); // 'time' or 'reps'
  const [modalReps, setModalReps] = useState('');
  const [modalMusicCue, setModalMusicCue] = useState('');
  const [editIndex, setEditIndex] = useState(null); // Track which block is being edited
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showIntensityModal, setShowIntensityModal] = useState(false);

  useEffect(() => {
    if (!addModalVisible) return;
    setSearchLoading(true);
    fetchExercises({ search: exerciseSearch })
      .then(data => setExerciseResults(data || []))
      .catch(e => { console.log('Error fetching exercises:', e); setExerciseResults([]); })
      .finally(() => setSearchLoading(false));
  }, [exerciseSearch, addModalVisible]);

  // Auto-calculate session summary
  useEffect(() => {
    // Calculate total time (in seconds)
    const perRoundTime = exercises.reduce(
      (sum, ex) => sum + (parseInt(ex.duration) || 0) + (parseInt(ex.rest) || 0),
      0
    );
    const totalTime = perRoundTime * totalRounds + (totalRounds - 1) * restBetweenRounds;

    // Calculate total calories (if you have per-exercise kcal, otherwise set to 0)
    const totalCalories = exercises.reduce(
      (sum, ex) => sum + (parseInt(ex.kcal) || 0),
      0
    ) * totalRounds;

    setSummary({ totalTime, totalCalories });
  }, [exercises, totalRounds, restBetweenRounds]);

  // Modal state reset helper
  const closeAddModal = () => {
    setAddModalVisible(false);
    setSelectedExercise(null);
    setModalDuration('');
    setModalRest('');
    setModalType('time'); // Reset block type
    setModalReps('');
    setModalMusicCue('');
    setEditIndex(null);
    setExerciseSearch('');
  };

  // Add Exercise: open modal
  const openAddModal = () => {
    closeAddModal();
    setAddModalVisible(true);
  };

  // When user selects an exercise, show duration/rest fields
  const handleSelectExercise = (ex) => {
    setSelectedExercise(ex);
    setModalDuration('');
    setModalRest('');
    setModalType('time'); // Default to time for new exercise
    setModalReps('');
    setModalMusicCue('');
  };

  // Open modal for editing a block
  const openEditModal = (block, idx) => {
    setSelectedExercise({
      id: block.id,
      name: block.name,
      type: block.type,
      img: block.img,
    });
    setModalType(block.blockType || 'time');
    setModalDuration(block.duration || '');
    setModalReps(block.reps || '');
    setModalRest(block.rest || '');
    setModalMusicCue(block.musicCue || '');
    setEditIndex(idx);
    setAddModalVisible(true);
  };

  // Confirm add/edit exercise with custom duration/rest
  const handleConfirmAddExercise = () => {
    if (!selectedExercise || (!modalDuration && !modalReps) || !modalRest) {
      Alert.alert('Please enter duration or reps, and rest.');
      return;
    }
    if (modalType === 'time') {
      const durationNum = parseInt(modalDuration);
      if (isNaN(durationNum) || durationNum <= 0) {
        Alert.alert('Invalid Duration', 'Duration must be a positive number.');
        return;
      }
    } else {
      const repsNum = parseInt(modalReps);
      if (isNaN(repsNum) || repsNum <= 0) {
        Alert.alert('Invalid Reps', 'Reps must be a positive number.');
        return;
      }
    }
    const restNum = parseInt(modalRest);
    if (isNaN(restNum) || restNum < 0) {
      Alert.alert('Invalid Rest', 'Rest must be zero or a positive number.');
      return;
    }
    const newBlock = {
      id: selectedExercise.id,
      name: selectedExercise.name || selectedExercise.workout,
      type: selectedExercise.type,
      img: selectedExercise.img || selectedExercise.image || selectedExercise.img_url,
      blockType: modalType,
      duration: modalType === 'time' ? modalDuration : '',
      reps: modalType === 'reps' ? modalReps : '',
      rest: modalRest,
      musicCue: modalMusicCue,
    };
    if (editIndex !== null) {
      // Edit existing block
      setExercises(prev => prev.map((ex, i) => i === editIndex ? newBlock : ex));
    } else {
      // Add new block
      setExercises(prev => [...prev, newBlock]);
    }
    closeAddModal();
  };

  // Remove exercise
  const handleRemove = idx => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setExercises(prev => prev.filter((_, i) => i !== idx)) },
      ]
    );
  };
  // Inline edit handler
  const handleEditField = (idx, field, value) => {
    setExercises(prev => prev.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex));
  };

  // Save Cardio Session handler (uses new table)
  const handleSaveWorkout = async () => {
    if (!workoutName || exercises.length === 0) {
      Alert.alert('Please enter a workout name and add at least one exercise.');
      return;
    }
    if (!sessionType || (sessionType === 'Custom' && !customSessionType.trim())) {
      Alert.alert('Please select or enter a session type.');
      return;
    }
    if (!intensity) {
      Alert.alert('Please select an intensity.');
      return;
    }
    // Validate all exercises
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      if (ex.blockType === 'time') {
        const durationNum = parseInt(ex.duration);
        const restNum = parseInt(ex.rest);
        if (isNaN(durationNum) || durationNum <= 0) {
          Alert.alert('Invalid Duration', `Exercise ${ex.name}: Duration must be a positive number.`);
          return;
        }
        if (isNaN(restNum) || restNum < 0) {
          Alert.alert('Invalid Rest', `Exercise ${ex.name}: Rest must be zero or a positive number.`);
          return;
        }
      } else { // reps
        const repsNum = parseInt(ex.reps);
        const restNum = parseInt(ex.rest);
        if (isNaN(repsNum) || repsNum <= 0) {
          Alert.alert('Invalid Reps', `Exercise ${ex.name}: Reps must be a positive number.`);
          return;
        }
        if (isNaN(restNum) || restNum < 0) {
          Alert.alert('Invalid Rest', `Exercise ${ex.name}: Rest must be zero or a positive number.`);
          return;
        }
      }
    }
    setLoading(true);
    try {
      // Get userId from Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('User not logged in');
      // Prepare exercises for saveCardioSession
      const exercisesToSave = exercises.map((ex, idx) => ({
        exercise_id: (typeof ex.id === 'string' && ex.id.length === 36) ? ex.id : null,
        exercise_name: ex.name,
        duration: ex.blockType === 'time' ? ex.duration : ex.reps,
        reps: ex.blockType === 'reps' ? ex.reps : null,
        rest: ex.rest,
        image_url: ex.img || null,
        order_index: idx + 1,
      }));
      if (editingSession && editingSession.id) {
        // Update existing session
        await updateCardioSession({
          sessionId: editingSession.id,
          name: workoutName,
          session_type: sessionType === 'Custom' ? customSessionType : sessionType,
          intensity,
          totalRounds,
          restBetweenRounds,
          soundAlerts,
          soundOption,
          autoRepeat,
          notes,
          estimatedTime: summary.totalTime,
          estimatedCalories: summary.totalCalories,
          exercises: exercisesToSave,
        });
        Alert.alert('Success', 'Session updated!');
      } else {
        await saveCardioSession({
          userId,
          name: workoutName,
          session_type: sessionType === 'Custom' ? customSessionType : sessionType,
          intensity,
          totalRounds,
          restBetweenRounds,
          soundAlerts,
          soundOption,
          autoRepeat,
          notes,
          estimatedTime: summary.totalTime,
          estimatedCalories: summary.totalCalories,
          exercises: exercisesToSave,
        });
        Alert.alert('Success', 'Session saved!');
      }
      navigation.navigate('SavedCardioSessionsScreen');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save session.');
    } finally {
      setLoading(false);
    }
  };

  // Play handler
  const handlePlay = () => {
    if (exercises.length === 0) {
      Alert.alert('Add at least one exercise to play.');
      return;
    }
    navigation.navigate('CardioPlayerScreen', {
      session: {
        name: workoutName,
        exercises,
        summary,
        totalRounds,
        restBetweenRounds,
        soundAlerts,
        soundOption,
      },
    });
  };

  // Add Exercise Modal (FlatList, not DraggableFlatList)
  const renderAddModal = () => (
    <Modal visible={addModalVisible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '95%', maxHeight: '80%' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Select Exercise</Text>
          {!selectedExercise ? (
            <>
              <TextInput
                placeholder="Search exercises..."
                value={exerciseSearch}
                onChangeText={setExerciseSearch}
                style={styles.modalInput}
              />
              {searchLoading ? <ActivityIndicator /> :
                <FlatList
                  data={exerciseResults}
                  keyExtractor={item => String(item.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleSelectExercise(item)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                      {item.img || item.image || item.img_url ? (
                        <Image source={{ uri: item.img || item.image || item.img_url }} style={{ width: 36, height: 36, borderRadius: 8, marginRight: 10 }} />
                      ) : (
                        <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#eee', marginRight: 10, justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="image-outline" size={18} color="#aaa" />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: 'black', fontSize: 17, fontWeight: 'bold' }}>{item.name || item.workout}</Text>
                        <Text style={{ color: '#888', fontSize: 14 }}>{item.type}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  style={{ maxHeight: 300 }}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
              }
            </>
          ) : (
            <>
              {/* Block type selector */}
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: modalType === 'time' ? COLORS.primary : COLORS.background,
                    borderColor: COLORS.primary,
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingVertical: 6,
                    paddingHorizontal: 16,
                    marginRight: 8,
                  }}
                  onPress={() => setModalType('time')}
                >
                  <Text style={{ color: modalType === 'time' ? COLORS.white : COLORS.primary, fontWeight: 'bold' }}>Time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: modalType === 'reps' ? COLORS.primary : COLORS.background,
                    borderColor: COLORS.primary,
                    borderWidth: 1,
                    borderRadius: 16,
                    paddingVertical: 6,
                    paddingHorizontal: 16,
                  }}
                  onPress={() => setModalType('reps')}
                >
                  <Text style={{ color: modalType === 'reps' ? COLORS.white : COLORS.primary, fontWeight: 'bold' }}>Reps</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{selectedExercise.name || selectedExercise.workout}</Text>
              {modalType === 'time' ? (
                <>
                  <Text>Duration (sec)</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={modalDuration}
                    onChangeText={setModalDuration}
                    style={styles.modalInput}
                    placeholder="e.g. 45"
                  />
                </>
              ) : (
                <>
                  <Text>Reps</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={modalReps}
                    onChangeText={setModalReps}
                    style={styles.modalInput}
                    placeholder="e.g. 20"
                  />
                </>
              )}
              <Text>Music Cue (optional)</Text>
              <TextInput
                value={modalMusicCue}
                onChangeText={setModalMusicCue}
                style={styles.modalInput}
                placeholder="Paste music link or file name (optional)"
              />
              <Text>Rest (sec)</Text>
              <TextInput
                keyboardType="numeric"
                value={modalRest}
                onChangeText={setModalRest}
                style={styles.modalInput}
                placeholder="e.g. 15"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                <TouchableOpacity onPress={closeAddModal} style={{ marginRight: 16 }}><Text>Back</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmAddExercise}><Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Add</Text></TouchableOpacity>
              </View>
            </>
          )}
          <TouchableOpacity onPress={closeAddModal} style={{ marginTop: 16, alignSelf: 'flex-end' }}>
            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Create Workout</Text>
        <TouchableOpacity><Feather name="help-circle" size={22} color={COLORS.gray} /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Session Name */}
        <View style={styles.sessionNameCard}>
          <TextInput
            style={styles.sessionNameInput}
            placeholder="e.g., Morning Burn, Core HIIT Circuit"
            placeholderTextColor={COLORS.gray}
            value={workoutName}
            onChangeText={setWorkoutName}
          />
        </View>
        {/* Session Type & Intensity (modal selector style) */}
        <View style={{ backgroundColor: COLORS.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 0, padding: 12, borderWidth: 1, borderColor: COLORS.cardBorder }}>
          <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>Type</Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.background,
              borderColor: COLORS.primary,
              borderWidth: 1,
              borderRadius: 16,
              paddingVertical: 10,
              paddingHorizontal: 18,
              marginBottom: 8,
            }}
            onPress={() => setShowTypeModal(true)}
          >
            <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>
              {sessionType ? (sessionType === 'Custom' ? (customSessionType || 'Custom') : sessionType) : 'Select session type'}
            </Text>
          </TouchableOpacity>
          <Modal visible={showTypeModal} transparent animationType="fade">
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowTypeModal(false)}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' }}>
                {SESSION_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                    onPress={() => {
                      setSessionType(type);
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={{ fontSize: 17, color: COLORS.primary, fontWeight: 'bold' }}>{type}</Text>
                  </TouchableOpacity>
                ))}
                {sessionType === 'Custom' && (
                  <TextInput
                    style={{ borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 8, padding: 8, fontSize: 16, color: COLORS.text, backgroundColor: COLORS.background, marginTop: 12 }}
                    placeholder="Enter custom session type"
                    value={customSessionType}
                    onChangeText={setCustomSessionType}
                  />
                )}
              </View>
            </TouchableOpacity>
          </Modal>
          <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6, marginTop: 8 }}>Intensity</Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.background,
              borderColor: COLORS.primary,
              borderWidth: 1,
              borderRadius: 16,
              paddingVertical: 10,
              paddingHorizontal: 18,
              marginBottom: 8,
            }}
            onPress={() => setShowIntensityModal(true)}
          >
            <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 16 }}>
              {intensity || 'Select intensity'}
            </Text>
          </TouchableOpacity>
          <Modal visible={showIntensityModal} transparent animationType="fade">
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowIntensityModal(false)}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' }}>
                {INTENSITIES.map(level => (
                  <TouchableOpacity
                    key={level}
                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                    onPress={() => {
                      setIntensity(level);
                      setShowIntensityModal(false);
                    }}
                  >
                    <Text style={{ fontSize: 17, color: COLORS.primary, fontWeight: 'bold' }}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
        {/* Exercises List */}
        <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
        <View style={styles.exListCard}>
          <DraggableFlatList
            data={exercises}
            keyExtractor={(_, idx) => String(idx)}
            onDragEnd={({ data }) => setExercises(data)}
            renderItem={({ item, index, drag, isActive }) => (
              <TouchableOpacity
                style={[styles.exerciseCard, isActive && { backgroundColor: COLORS.blueLight }]}
                onLongPress={drag}
                delayLongPress={150}
                activeOpacity={0.9}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="menu" size={20} color={COLORS.gray} style={{ marginRight: 10 }} />
                  {item.img ? (
                    <Image source={{ uri: item.img }} style={styles.exerciseImg} />
                  ) : (
                    <View style={[styles.exerciseImg, { backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="image-outline" size={20} color={COLORS.gray} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Ionicons name="time-outline" size={16} color={COLORS.icon} style={{ marginRight: 4 }} />
                      {item.blockType === 'time' ? (
                        <Text style={styles.exerciseDetail}>{item.duration}s</Text>
                      ) : (
                        <Text style={styles.exerciseDetail}>{item.reps} reps</Text>
                      )}
                      <TouchableOpacity style={{ marginLeft: 4 }} onPress={() => Alert.alert('Duration', 'How long to perform this exercise (in seconds).')}>
                        <Feather name="info" size={14} color={COLORS.gray} />
                      </TouchableOpacity>
                      {item.musicCue ? (
                        <>
                          <Ionicons name="musical-notes-outline" size={16} color={COLORS.icon} style={{ marginLeft: 12, marginRight: 4 }} />
                          <Text style={styles.exerciseDetail} numberOfLines={1} ellipsizeMode="tail">{item.musicCue}</Text>
                        </>
                      ) : null}
                      <Ionicons name="pause-circle-outline" size={16} color={COLORS.icon} style={{ marginLeft: 12, marginRight: 4 }} />
                      <Text style={styles.exerciseDetail}>Rest: {item.rest}s</Text>
                      <TouchableOpacity style={{ marginLeft: 4 }} onPress={() => Alert.alert('Rest', 'How long to rest after this exercise (in seconds).')}>
                        <Feather name="info" size={14} color={COLORS.gray} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(index)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openEditModal(item, index)} style={{ marginLeft: 8 }}>
                    <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inlineFieldsRow}>
                  {item.blockType === 'time' ? (
                    <TextInput
                      style={styles.inlineInput}
                      keyboardType="numeric"
                      value={item.duration === undefined || item.duration === null ? '' : String(item.duration)}
                      onChangeText={v => handleEditField(index, 'duration', v.replace(/[^0-9]/g, ''))}
                      placeholder="Duration (sec)"
                    />
                  ) : (
                    <TextInput
                      style={styles.inlineInput}
                      keyboardType="numeric"
                      value={item.reps === undefined || item.reps === null ? '' : String(item.reps)}
                      onChangeText={v => handleEditField(index, 'reps', v.replace(/[^0-9]/g, ''))}
                      placeholder="Reps"
                    />
                  )}
                  <TextInput
                    style={styles.inlineInput}
                    keyboardType="numeric"
                    value={item.rest === undefined || item.rest === null ? '' : String(item.rest)}
                    onChangeText={v => handleEditField(index, 'rest', v.replace(/[^0-9]/g, ''))}
                    placeholder="Rest (sec)"
                  />
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
          <TouchableOpacity style={styles.addExerciseBtn} onPress={openAddModal}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
        {/* Session Settings */}
        <Text style={styles.sectionTitle}>Session Settings</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Total Rounds</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity onPress={() => setTotalRounds(r => Math.max(1, r - 1))} style={styles.stepperBtn}><Text style={styles.stepperBtnText}>-</Text></TouchableOpacity>
              <Text style={styles.stepperValue}>{totalRounds}</Text>
              <TouchableOpacity onPress={() => setTotalRounds(r => r + 1)} style={styles.stepperBtn}><Text style={styles.stepperBtnText}>+</Text></TouchableOpacity>
            </View>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Rest Between Rounds</Text>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Slider
                minimumValue={0}
                maximumValue={180}
                step={5}
                value={restBetweenRounds}
                onValueChange={setRestBetweenRounds}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.cardBorder}
                thumbTintColor={COLORS.primary}
              />
              <Text style={{ color: COLORS.textSecondary, marginTop: 2 }}>{restBetweenRounds}s</Text>
            </View>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Sound Alerts</Text>
            <Switch
              value={soundAlerts}
              onValueChange={setSoundAlerts}
              trackColor={{ true: COLORS.primary, false: COLORS.cardBorder }}
              thumbColor={soundAlerts ? COLORS.primary : COLORS.gray}
              style={{ marginLeft: 'auto' }}
            />
          </View>
          {soundAlerts && (
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              {SOUND_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.soundOptionBtn, soundOption === opt.key && styles.soundOptionBtnActive]}
                  onPress={() => setSoundOption(opt.key)}
                >
                  <Text style={[styles.soundOptionText, soundOption === opt.key && { color: COLORS.primary }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* Auto-repeat weekly toggle */}
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Auto-repeat weekly</Text>
            <Switch
              value={autoRepeat}
              onValueChange={setAutoRepeat}
              trackColor={{ true: COLORS.primary, false: COLORS.cardBorder }}
              thumbColor={autoRepeat ? COLORS.primary : COLORS.gray}
              style={{ marginLeft: 'auto' }}
            />
          </View>
        </View>
        {/* Session Summary */}
        <Text style={styles.sectionTitle}>Session Summary</Text>
        <View style={styles.summaryCardRow}>
          <View style={styles.summaryCard2}>
            <Ionicons name="timer-outline" size={22} color={COLORS.primary} />
            <Text style={styles.summaryValue2}>{Math.floor(summary.totalTime / 60)}:{(summary.totalTime % 60).toString().padStart(2, '0')}</Text>
            <Text style={styles.summaryLabel2}>Total Time</Text>
          </View>
          <View style={styles.summaryCard2}>
            <MaterialCommunityIcons name="fire" size={22} color={COLORS.primary} />
            <Text style={styles.summaryValue2}>{summary.totalCalories}</Text>
            <Text style={styles.summaryLabel2}>Calories</Text>
          </View>
          <View style={styles.summaryCard2}>
            <Ionicons name="list-outline" size={22} color={COLORS.primary} />
            <Text style={styles.summaryValue2}>{exercises.length}</Text>
            <Text style={styles.summaryLabel2}>Exercises</Text>
          </View>
        </View>
        {/* Bottom Buttons */}
        <View style={styles.bottomBtnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn2} onPress={handleSaveWorkout} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="play" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText2}>Save & Start</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderAddModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: COLORS.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8, backgroundColor: COLORS.background },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center', flex: 1 },
  headerIcon: { width: 32, alignItems: 'center' },
  sessionNameCard: { backgroundColor: COLORS.card, borderRadius: 16, margin: 16, padding: 16, borderWidth: 1, borderColor: COLORS.cardBorder },
  sessionNameInput: { fontSize: 18, fontWeight: '600', color: COLORS.text, backgroundColor: 'transparent' },
  sectionTitle: { fontWeight: '700', fontSize: 18, color: COLORS.text, marginHorizontal: 18, marginTop: 18, marginBottom: 8 },
  exListCard: { backgroundColor: COLORS.card, borderRadius: 16, marginHorizontal: 16, marginTop: 8, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.cardBorder },
  exerciseCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.cardBorder, marginBottom: 0, marginTop: 0, marginHorizontal: 0, marginVertical: 0 },
  exerciseName: { fontWeight: '700', fontSize: 16, color: COLORS.text },
  exerciseDetail: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.primary },
  addExerciseText: { color: COLORS.primary, fontWeight: '700', fontSize: 16, marginLeft: 6 },
  inlineFieldsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 4 },
  inlineInput: { borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 6, padding: 6, marginRight: 8, width: 100, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.background },
  exerciseSelectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, backgroundColor: COLORS.card },
  exerciseImg: { width: 48, height: 48, borderRadius: 8, backgroundColor: COLORS.card },
  settingsCard: { backgroundColor: COLORS.card, borderRadius: 16, marginHorizontal: 16, marginTop: 8, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.cardBorder },
  settingsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  settingsLabel: { fontWeight: '600', fontSize: 16, color: COLORS.text, flex: 1 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 8, borderWidth: 1, borderColor: COLORS.cardBorder, paddingHorizontal: 8, paddingVertical: 2 },
  stepperBtn: { paddingHorizontal: 10, paddingVertical: 2 },
  stepperBtnText: { fontSize: 22, color: COLORS.primary, fontWeight: '700' },
  stepperValue: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginHorizontal: 8 },
  soundOptionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.cardBorder, marginRight: 8 },
  soundOptionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.blueLight },
  soundOptionText: { fontWeight: '600', color: COLORS.text },
  summaryCardRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  summaryCard2: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, alignItems: 'center', padding: 12, marginHorizontal: 4, borderWidth: 1, borderColor: COLORS.cardBorder },
  summaryValue2: { color: COLORS.primary, fontWeight: '700', fontSize: 20, marginTop: 2 },
  summaryLabel2: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  bottomBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 24, marginBottom: 24 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: COLORS.cardBorder },
  cancelBtnText: { color: COLORS.text, fontWeight: '700', fontSize: 17 },
  saveBtn2: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginLeft: 8 },
  saveBtnText2: { color: COLORS.white, fontWeight: '700', fontSize: 17 },
  modalInput: { borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 8, padding: 8, marginBottom: 10, fontSize: 16, color: COLORS.text, backgroundColor: COLORS.background },
}); 