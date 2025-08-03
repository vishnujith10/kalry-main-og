import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { loadCardioSessions } from '../lib/cardioSessionApi';
import { useNavigation } from '@react-navigation/native';
import supabase from '../lib/supabase';

export default function SavedCardioSessionsScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const sessions = await loadCardioSessions(session.user.id);
        setSessions(sessions);
      }
      setLoading(false);
    }
    fetchSessions();
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB', padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Saved Workouts</Text>
      <FlatList
        data={sessions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB'
            }}
            onPress={() => navigation.navigate('CardioPlayerScreen', { session: item })}
          >
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{item.name}</Text>
            <Text style={{ color: '#6B7280', marginTop: 4 }}>
              {item.total_rounds} rounds • {Math.round((item.estimated_time || 0) / 60)} min
            </Text>
            <Text style={{ color: '#22C55E', marginTop: 4 }}>Play</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
} 