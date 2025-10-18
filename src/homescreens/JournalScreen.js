import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const JournalScreen = () => {
  const navigation = useNavigation();

  // Sample journal data - matching the image exactly
  const [journalData] = useState({
    today: [
      {
        id: 1,
        title: 'Morning Stretch',
        icon: 'sunny',
        iconColor: '#FFB800',
        bgColor: '#FFF9E6',
        textColor: '#1F2937',
        completed: true,
        type: 'activity'
      },
      {
        id: 2,
        title: 'Protein Breakfast',
        icon: 'search',
        iconColor: '#4B5563',
        bgColor: '#FFFFFF',
        textColor: '#1F2937',
        completed: true,
        type: 'activity'
      },
      {
        id: 3,
        title: 'Hydration Logged',
        subtitle: '500ml',
        icon: 'water',
        iconColor: '#3B82F6',
        bgColor: '#E0F2FE',
        textColor: '#1E40AF',
        points: '+5',
        type: 'hydration'
      },
      {
        id: 4,
        title: 'Sleep Reflection',
        icon: 'bed',
        iconColor: '#8B5CF6',
        bgColor: '#F3E8FF',
        textColor: '#7C3AED',
        type: 'reflection'
      },
      {
        id: 5,
        title: 'Workout Logged',
        icon: 'barbell',
        iconColor: '#F97316',
        bgColor: '#FFE8E0',
        textColor: '#C2410C',
        points: '+20',
        type: 'workout'
      },
      {
        id: 6,
        title: 'Feeling great',
        icon: 'happy',
        iconColor: '#EAB308',
        bgColor: '#FEF9C3',
        textColor: '#854D0E',
        type: 'mood'
      }
    ],
    yesterday: [
      {
        id: 7,
        title: 'Morning Stretch',
        icon: 'sunny',
        iconColor: '#FFB800',
        bgColor: '#FFF9E6',
        textColor: '#1F2937',
        type: 'activity'
      },
      {
        id: 8,
        title: 'Protein Breakfast',
        icon: 'search',
        iconColor: '#4B5563',
        bgColor: '#FFFFFF',
        textColor: '#1F2937',
        type: 'activity'
      }
    ]
  });

  const renderJournalEntry = (entry) => (
    <View key={entry.id} style={[styles.entryCard, { backgroundColor: entry.bgColor }]}>
      <View style={styles.entryContent}>
        <View style={[styles.iconContainer, { backgroundColor: entry.bgColor }]}>
          <Ionicons name={entry.icon} size={24} color={entry.iconColor} />
        </View>
        <View style={styles.entryText}>
          <Text style={[styles.entryTitle, { color: entry.textColor }]}>{entry.title}</Text>
          {entry.subtitle && (
            <Text style={[styles.entrySubtitle, { color: entry.textColor }]}>{entry.subtitle}</Text>
          )}
        </View>
        <View style={styles.entryRight}>
          {entry.completed && (
            <View style={styles.completedIcon}>
              <Ionicons name="checkmark" size={14} color="#10B981" />
            </View>
          )}
          {entry.points && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{entry.points}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const renderSection = (title, entries) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {entries.map(renderJournalEntry)}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('MainDashboard')}
        >
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Timeline Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.timelineContainer}>
          {/* Journal Entries */}
          <View style={styles.entriesContainer}>
            {renderSection('Today', journalData.today)}
            {renderSection('Yesterday', journalData.yesterday)}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('MainDashboard')}
        >
          <Ionicons name="home-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Insights</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <View style={styles.activeIconContainer}>
            <Ionicons name="book-outline" size={24} color="#7B61FF" />
          </View>
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Journal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#6B7280" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'Lexend-Bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  timelineContainer: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: '#FAFAFA',
  },
  entriesContainer: {
    marginLeft: 0,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    fontFamily: 'Lexend-Bold',
  },
  entryCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  entryText: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lexend-SemiBold',
  },
  entrySubtitle: {
    fontSize: 14,
    marginTop: 2,
    fontFamily: 'Manrope-Regular',
    opacity: 0.8,
  },
  entryRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  completedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsBadge: {
    backgroundColor: '#FCD34D',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Lexend-Bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    // Active state styling
  },
  activeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Manrope-Regular',
  },
  activeNavLabel: {
    color: '#7B61FF',
    fontFamily: 'Lexend-SemiBold',
  },
});

export default JournalScreen;