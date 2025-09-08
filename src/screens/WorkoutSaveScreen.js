import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const COLORS = {
  primary: '#7C3AED',
  primaryLight: '#A084E8',
  background: '#E8E9F0',
  surface: '#FFFFFF',
  text: '#181A20',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

export default function SavedCardioSessionsScreen() {
  const [cardioSessions, setCardioSessions] = useState([]);
  const [routineSessions, setRoutineSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cardio');
  const navigation = useNavigation();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    
    // Add dummy data for testing
    const dummyCardioSessions = [
      {
        id: '1',
        name: 'Morning Cardio Blast',
        total_rounds: 5,
        estimated_time: 1800, // 30 minutes
        estimated_calories: 250,
      },
      {
        id: '2',
        name: 'HIIT Workout',
        total_rounds: 8,
        estimated_time: 2400, // 40 minutes
        estimated_calories: 400,
      },
      {
        id: '3',
        name: 'Quick Cardio',
        total_rounds: 3,
        estimated_time: 900, // 15 minutes
        estimated_calories: 150,
      },
    ];
    
    const dummyRoutineSessions = [
      {
        id: '4',
        name: 'Upper Body Strength',
        total_rounds: 4,
        estimated_time: 2700, // 45 minutes
        estimated_calories: 300,
      },
      {
        id: '5',
        name: 'Full Body Workout',
        total_rounds: 6,
        estimated_time: 3600, // 60 minutes
        estimated_calories: 450,
      },
      {
        id: '6',
        name: 'Core & Abs',
        total_rounds: 5,
        estimated_time: 1800, // 30 minutes
        estimated_calories: 200,
      },
    ];
    
    // Set dummy data immediately
    setCardioSessions(dummyCardioSessions);
    setRoutineSessions(dummyRoutineSessions);
    
    // Simulate loading delay
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const renderSessionCard = (session, type) => (
    <TouchableOpacity
      key={session.id}
      style={styles.sessionCard}
      onPress={() => {
        if (type === 'cardio') {
          navigation.navigate('CardioPlayerScreen', { session });
        } else {
          // TODO: Navigate to routine player
          console.log('Routine session:', session);
        }
      }}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionIcon}>
          <Ionicons 
            name={type === 'cardio' ? 'heart' : 'barbell'} 
            size={24} 
            color={COLORS.primary} 
          />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>{session.name}</Text>
          <View style={styles.sessionDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="repeat" size={14} color={COLORS.textMuted} />
              <Text style={styles.detailText}>{session.total_rounds} rounds</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={14} color={COLORS.textMuted} />
              <Text style={styles.detailText}>{Math.round((session.estimated_time || 0) / 60)} min</Text>
            </View>
            {session.estimated_calories && (
              <View style={styles.detailItem}>
                <Ionicons name="flame" size={14} color={COLORS.textMuted} />
                <Text style={styles.detailText}>{session.estimated_calories} cal</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.sessionActions}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            if (type === 'cardio') {
              navigation.navigate('CardioPlayerScreen', { session });
            } else {
              // TODO: Navigate to routine player
              console.log('Play routine session:', session);
            }
          }}
        >
          <Ionicons name="play" size={16} color={COLORS.surface} />
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
        
          <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            // TODO: Add to current workout
            console.log('Add session to workout:', session);
          }}
        >
          <Ionicons name="add" size={16} color={COLORS.primary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
          </TouchableOpacity>
  );

  const renderEmptyState = (type) => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={type === 'cardio' ? 'heart-outline' : 'barbell-outline'} 
        size={48} 
        color={COLORS.textMuted} 
      />
      <Text style={styles.emptyTitle}>No {type} sessions saved</Text>
      <Text style={styles.emptySubtitle}>
        Create and save your {type} workouts to see them here
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          if (type === 'cardio') {
            navigation.navigate('CreateWorkoutScreen');
          } else {
            // TODO: Navigate to routine creation
            console.log('Create routine session');
          }
        }}
      >
        <Ionicons name="add" size={16} color={COLORS.surface} />
        <Text style={styles.createButtonText}>Create {type === 'cardio' ? 'Cardio' : 'Routine'} Session</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('Rendering SavedCardioSessionsScreen:', { 
    loading, 
    cardioSessions: cardioSessions.length, 
    routineSessions: routineSessions.length,
    activeTab 
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Workouts</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cardio' && styles.activeTab]}
          onPress={() => setActiveTab('cardio')}
        >
          <Ionicons 
            name="heart" 
            size={20} 
            color={activeTab === 'cardio' ? COLORS.surface : COLORS.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'cardio' && styles.activeTabText
          ]}>
            Cardio
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'routines' && styles.activeTab]}
          onPress={() => setActiveTab('routines')}
        >
          <Ionicons 
            name="barbell" 
            size={20} 
            color={activeTab === 'routines' ? COLORS.surface : COLORS.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'routines' && styles.activeTabText
          ]}>
            Routines
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {activeTab === 'cardio' ? (
            cardioSessions.length > 0 ? (
              cardioSessions.map(session => renderSessionCard(session, 'cardio'))
            ) : (
              renderEmptyState('cardio')
            )
          ) : (
            routineSessions.length > 0 ? (
              routineSessions.map(session => renderSessionCard(session, 'routines'))
            ) : (
              renderEmptyState('routines')
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  activeTabText: {
    color: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
    marginLeft: 6,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
});