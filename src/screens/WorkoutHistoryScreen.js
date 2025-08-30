import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const WorkoutHistoryScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Last 7 Days');
  const [selectedSort, setSelectedSort] = useState('Most Recent');

  const filters = ['All', 'Running', 'Cycling', 'Strength', 'More'];
  
  const workoutData = [
    {
      date: 'Today',
      workouts: [
        {
          id: 1,
          name: 'Morning Run',
          icon: 'running',
          iconType: 'MaterialIcons',
          distance: '5.2 km',
          duration: '30 min',
          calories: '450 kcal',
          time: '08:15 AM',
          color: '#4A90E2'
        }
      ]
    },
    {
      date: 'Yesterday',
      workouts: [
        {
          id: 2,
          name: 'Full Body Strength',
          icon: 'fitness-center',
          iconType: 'MaterialIcons',
          duration: '45 min',
          calories: '350 kcal',
          time: '06:30 PM',
          color: '#4A90E2'
        },
        {
          id: 3,
          name: 'Evening Cycle',
          icon: 'directions-bike',
          iconType: 'MaterialIcons',
          distance: '12.5 km',
          duration: '40 min',
          calories: '550 kcal',
          time: '08:00 PM',
          color: '#4A90E2'
        }
      ]
    },
    {
      date: 'October 23, 2023',
      workouts: [
        {
          id: 4,
          name: 'Lunch Swim',
          icon: 'pool',
          iconType: 'MaterialIcons',
          distance: '1500 m',
          duration: '35 min',
          calories: '300 kcal',
          time: '12:30 PM',
          color: '#4A90E2'
        }
      ]
    }
  ];

  const renderIcon = (iconName, iconType, color) => {
    if (iconType === 'MaterialIcons') {
      return <MaterialIcons name={iconName} size={24} color={color} />;
    }
    return <Ionicons name={iconName} size={24} color={color} />;
  };

  const renderWorkoutItem = (workout) => (
    <TouchableOpacity key={workout.id} style={styles.workoutItem}>
      <View style={[styles.iconContainer, { backgroundColor: workout.color + '20' }]}>
        {renderIcon(workout.icon, workout.iconType, workout.color)}
      </View>
      
      <View style={styles.workoutDetails}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        <Text style={styles.workoutSubtitle}>
          {workout.distance ? `${workout.distance} • ` : ''}{workout.duration}
        </Text>
      </View>
      
      <View style={styles.workoutStats}>
        <Text style={styles.caloriesText}>{workout.calories}</Text>
        <Text style={styles.timeText}>{workout.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout History</Text>
        <TouchableOpacity style={styles.themeButton}>
          <Ionicons name="moon-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContainer}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  selectedFilter === filter && styles.activeFilterTab
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.activeFilterText
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time and Sort Filters */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.controlText}>{selectedTimeFilter}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="swap-vert" size={16} color="#666" />
            <Text style={styles.controlText}>{selectedSort}</Text>
          </TouchableOpacity>
        </View>

        {/* Workout List */}
        <View style={styles.workoutList}>
          {workoutData.map((section) => (
            <View key={section.date} style={styles.dateSection}>
              <Text style={styles.dateHeader}>{section.date}</Text>
              {section.workouts.map(renderWorkoutItem)}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#999" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="fitness-center" size={24} color="#4A90E2" />
          <Text style={[styles.navText, styles.activeNavText]}>Workouts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="stats-chart-outline" size={24} color="#999" />
          <Text style={styles.navText}>Progress</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#999" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  themeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 10,
  },
  filterScrollContainer: {
    paddingHorizontal: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 15,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeFilterTab: {
    backgroundColor: '#E3F2FD',
  },
  filterText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    gap: 5,
  },
  controlText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  workoutList: {
    paddingHorizontal: 20,
  },
  dateSection: {
    marginBottom: 25,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 15,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  workoutSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  workoutStats: {
    alignItems: 'flex-end',
  },
  caloriesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  navText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});

export default WorkoutHistoryScreen;
