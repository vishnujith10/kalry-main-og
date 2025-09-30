import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import supabase from '../lib/supabase';
import { getFoodLogs } from '../utils/api';

const screenWidth = Dimensions.get('window').width - 32;

const RANGES = [
  { key: 'this_week', label: 'This Week', days: 7, offsetWeeks: 0 },
  { key: 'last_week', label: 'Last Week', days: 7, offsetWeeks: 1 },
  { key: 'one_month', label: '1 Month', days: 30 },
  { key: 'ninety_days', label: '90 Days', days: 90 },
];

// Fixed date utility functions with timezone handling
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function getRangeDates(range) {
  const now = new Date();
  console.log('🔍 getRangeDates called with range:', range.key, 'Current time:', now.toISOString());
  
  if (range.key === 'this_week') {
    // This week: Monday to Sunday of current week
    const today = new Date(now);
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days since Monday (handle Sunday as day 0)
    const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    
    // Get Monday of this week
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMonday);
    
    // Get Sunday of this week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const result = { start: startOfDay(monday), end: endOfDay(sunday) };
    console.log('🔍 This week range:', {
      today: today.toDateString(),
      monday: monday.toDateString(),
      sunday: sunday.toDateString(),
      start: result.start.toISOString(),
      end: result.end.toISOString(),
      daysSinceMonday,
      currentDayOfWeek
    });
    return result;
    
  } else if (range.key === 'last_week') {
    // Last week: Monday to Sunday of previous week
    const today = new Date(now);
    const currentDayOfWeek = today.getDay();
    const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    
    // Get Monday of this week first
    const thisWeekMonday = new Date(today);
    thisWeekMonday.setDate(today.getDate() - daysSinceMonday);
    
    // Go back 7 days to get last week's Monday
    const lastWeekMonday = new Date(thisWeekMonday);
    lastWeekMonday.setDate(thisWeekMonday.getDate() - 7);
    
    // Get last week's Sunday
    const lastWeekSunday = new Date(lastWeekMonday);
    lastWeekSunday.setDate(lastWeekMonday.getDate() + 6);
    
    const result = { start: startOfDay(lastWeekMonday), end: endOfDay(lastWeekSunday) };
    console.log('🔍 Last week range:', {
      lastWeekMonday: lastWeekMonday.toDateString(),
      lastWeekSunday: lastWeekSunday.toDateString(),
      start: result.start.toISOString(),
      end: result.end.toISOString()
    });
    return result;
    
  } else if (range.key === 'one_month') {
    // 1 Month: Last 30 days including today
    const end = endOfDay(now);
    const start = new Date(now);
    start.setDate(now.getDate() - 29); // 30 days total including today
    
    const result = { start: startOfDay(start), end };
    console.log('🔍 1 Month range:', {
      start: result.start.toISOString(),
      end: result.end.toISOString(),
      totalDays: Math.ceil((result.end - result.start) / (1000 * 60 * 60 * 24))
    });
    return result;
    
  } else if (range.key === 'ninety_days') {
    // 90 Days: Last 90 days including today
    const end = endOfDay(now);
    const start = new Date(now);
    start.setDate(now.getDate() - 89); // 90 days total including today
    
    const result = { start: startOfDay(start), end };
    console.log('🔍 90 Days range:', {
      start: result.start.toISOString(),
      end: result.end.toISOString(),
      totalDays: Math.ceil((result.end - result.start) / (1000 * 60 * 60 * 24))
    });
    return result;
  }
  
  // Fallback
  const end = endOfDay(now);
  const start = new Date(now);
  start.setDate(now.getDate() - (range.days - 1));
  return { start: startOfDay(start), end };
}

function groupByDay(logs, start, end) {
  console.log('🔍 groupByDay called:', { 
    logsCount: logs.length, 
    start: start.toISOString(), 
    end: end.toISOString() 
  });
  
  // Create array of days in the range
  const days = [];
  const cursor = new Date(start);
  
  while (cursor <= end) {
    days.push({ 
      date: new Date(cursor), 
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  
  console.log('🔍 Created days array with', days.length, 'days');
  
  // Process each log and add to appropriate day
  logs.forEach((log, logIndex) => {
    const logDate = new Date(log.created_at);
    
    // Check if log is within our date range
    if (logDate >= start && logDate <= end) {
      // Find the matching day in our array
      const matchingDayIndex = days.findIndex(day => isSameDay(day.date, logDate));
      
      if (matchingDayIndex !== -1) {
        const calories = Number(log.calories || 0);
        const protein = Number(log.protein || 0);
        const carbs = Number(log.carbs || 0);
        const fat = Number(log.fat || 0);
        
        days[matchingDayIndex].calories += calories;
        days[matchingDayIndex].protein += protein;
        days[matchingDayIndex].carbs += carbs;
        days[matchingDayIndex].fat += fat;
        
        console.log(`🔍 Log ${logIndex} added to day ${matchingDayIndex}:`, {
          logDate: logDate.toISOString(),
          dayDate: days[matchingDayIndex].date.toISOString(),
          calories,
          newDayTotal: days[matchingDayIndex].calories
        });
      } else {
        console.log(`🔍 Log ${logIndex}: No matching day found for ${logDate.toISOString()}`);
      }
    } else {
      console.log(`🔍 Log ${logIndex}: Outside range - ${logDate.toISOString()}`);
    }
  });
  
  // Log final summary
  console.log('🔍 Final grouped days summary:');
  days.forEach((day, index) => {
    console.log(`  Day ${index}: ${day.date.toDateString()} - ${day.calories} cal`);
  });
  
  return days;
}

export default function ProgressScreen() {
  const navigation = useNavigation();
  const [activeRange, setActiveRange] = useState(RANGES[0]);
  const [activeMetric, setActiveMetric] = useState('calories');
  const [loading, setLoading] = useState(false);
  const [daily, setDaily] = useState([]);
  const [totals, setTotals] = useState({ 
    total: 0, 
    average: 0, 
    best: 0, 
    worst: 0, 
    bestDate: null, 
    worstDate: null, 
    streak: 0 
  });
  const [prevTotal, setPrevTotal] = useState(null);
  const [userGoal, setUserGoal] = useState(null);
  const [logsCount, setLogsCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;
        
        // Get date range for the selected period
        const { start, end } = getRangeDates(activeRange);
        console.log('🔍 Loading data for range:', activeRange.key);
        console.log('🔍 Date range:', { 
          start: start.toISOString(), 
          end: end.toISOString(),
          totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        });
        
        // Fetch user's calorie goal
        const { data: profile } = await supabase.from('user_profile')
          .select('calorie_goal')
          .eq('id', userId)
          .single();
        if (profile?.calorie_goal) setUserGoal(Number(profile.calorie_goal));
        
        // Fetch all food logs
        let logs = [];
        try {
          logs = await getFoodLogs(userId);
          console.log('🔍 Fetched logs via API:', logs.length);
        } catch (error) {
          console.log('⚠️ API failed, trying Supabase directly:', error.message);
          const { data: supabaseLogs, error: supabaseError } = await supabase
            .from('user_food_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          
          if (supabaseError) {
            console.error('❌ Supabase also failed:', supabaseError);
            logs = [];
          } else {
            logs = supabaseLogs || [];
            console.log('🔍 Fetched logs via Supabase:', logs.length);
          }
        }
        
        // Debug: Show sample logs and verify date filtering
        if (logs.length > 0) {
          console.log('🔍 Sample log:', logs[0]);
          
          // Filter logs for the selected range for verification
          const logsInRange = logs.filter(log => {
            const logDate = new Date(log.created_at);
            return logDate >= start && logDate <= end;
          });
          
          console.log('🔍 Logs in selected range:', logsInRange.length);
          
          // Calculate direct total for comparison
          const directTotal = logsInRange.reduce((sum, log) => sum + Number(log.calories || 0), 0);
          console.log('🔍 Direct total calories in range:', directTotal);
          
          // Show date distribution of logs
          const logDates = logsInRange.map(log => new Date(log.created_at).toDateString());
          const uniqueDates = [...new Set(logDates)];
          console.log('🔍 Unique dates with logs in range:', uniqueDates.length, uniqueDates);
        }
        
        // Group logs by day
        const perDay = groupByDay(logs, start, end);
        setDaily(perDay);
        
        // Calculate totals for the active metric
        const metricKey = activeMetric;
        const values = perDay.map(d => Number(d[metricKey] || 0));
        const total = values.reduce((sum, val) => sum + val, 0);
        const daysWithData = values.filter(v => v > 0).length;
        const average = daysWithData > 0 ? total / daysWithData : 0;
        
        // Find best and worst days
        let best = 0, worst = 0, bestDate = null, worstDate = null;
        if (values.length > 0) {
          const nonZeroValues = values.filter(v => v > 0);
          if (nonZeroValues.length > 0) {
            best = Math.max(...values);
            worst = Math.min(...nonZeroValues); // Only consider days with data for worst
            const bestIndex = values.indexOf(best);
            const worstIndex = values.indexOf(worst);
            bestDate = perDay[bestIndex]?.date || null;
            worstDate = perDay[worstIndex]?.date || null;
          }
        }
        
        // Calculate streak (consecutive days with logged data from the end)
        let streak = 0;
        for (let i = perDay.length - 1; i >= 0; i--) {
          if ((perDay[i][metricKey] || 0) > 0) {
            streak++;
          } else {
            break;
          }
        }
        
        console.log('🔍 Final calculated totals:', {
          total,
          average,
          best,
          worst,
          streak,
          daysWithData,
          metricKey,
          activeRange: activeRange.key
        });
        
        setTotals({ total, average, best, worst, bestDate, worstDate, streak });
        setLogsCount(logs.length);
        
        // Calculate previous period for comparison
        const prevRange = calculatePreviousRange(activeRange, start);
        const prevPerDay = groupByDay(logs, prevRange.start, prevRange.end);
        const prevTotal = prevPerDay.reduce((sum, d) => sum + Number(d[metricKey] || 0), 0);
        setPrevTotal(prevTotal);
        
        console.log('🔍 Previous period comparison:', {
          currentTotal: total,
          prevTotal,
          prevRange: {
            start: prevRange.start.toISOString(),
            end: prevRange.end.toISOString()
          }
        });
        
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [activeRange, activeMetric]);

  // Helper function to calculate previous period range
  function calculatePreviousRange(currentRange, currentStart) {
    if (currentRange.key === 'this_week') {
      return getRangeDates({ key: 'last_week', days: 7 });
    } else if (currentRange.key === 'last_week') {
      return getRangeDates({ key: 'this_week', days: 7 });
    } else {
      // For month and 90-day ranges, go back by the same number of days
      const days = currentRange.days || 30;
      const prevEnd = new Date(currentStart);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - (days - 1));
      return { start: startOfDay(prevStart), end: endOfDay(prevEnd) };
    }
  }

  const labels = useMemo(() => {
    if (activeRange.days <= 7) {
      // For weekly views, show day names
      return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    }
    
    // For longer ranges, show selected dates
    const count = daily.length;
    const step = Math.max(1, Math.floor(count / 6));
    return daily.map((d, i) => {
      if (i % step === 0) {
        return `${d.date.getMonth() + 1}/${d.date.getDate()}`;
      }
      return '';
    });
  }, [daily, activeRange]);

  const metricLabel = activeMetric === 'calories' ? 'cal' : 'g';
  
  // Data points for chart
  const dataPoints = useMemo(() => {
    if (activeRange.key === 'this_week' || activeRange.key === 'last_week') {
      // Weekly views: show daily values
      return daily.map(d => Math.round(d[activeMetric] || 0));
    } else {
      // Monthly and 90-day views: show cumulative totals
      let cumulative = 0;
      return daily.map(d => {
        cumulative += Number(d[activeMetric] || 0);
        return Math.round(cumulative);
      });
    }
  }, [daily, activeMetric, activeRange]);

  const deltaPct = useMemo(() => {
    if (prevTotal == null || !totals) return null;
    if (prevTotal === 0) return totals.total > 0 ? 100 : 0;
    return ((totals.total - prevTotal) / prevTotal) * 100;
  }, [prevTotal, totals]);

  // Determine what value to show in the main display
  const mainDisplayValue = useMemo(() => {
    if (activeRange.key === 'this_week') {
      // This Week: Show today's value for the selected metric
      const today = new Date();
      const todayData = daily.find(d => isSameDay(d.date, today));
      return Math.round(todayData?.[activeMetric] || 0);
    } else if (activeRange.key === 'last_week') {
      // Last Week: Show total
      return Math.round(totals.total || 0);
    } else {
      // Month/90 days: Show total
      return Math.round(totals.total || 0);
    }
  }, [activeRange, totals, daily, activeMetric]);

  const mainDisplayLabel = useMemo(() => {
    if (activeRange.key === 'this_week') {
      return `Today's ${activeMetric === 'calories' ? 'Calories' : activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} - ${activeRange.label}`;
    } else {
      return `Total ${activeMetric === 'calories' ? 'Calories' : activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} - ${activeRange.label}`;
    }
  }, [activeRange, activeMetric]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F15' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Add top spacing for status bar */}
        <View style={{ height: 20 }} />
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginLeft: 4 }}>Deep Insights</Text>
          </View>
          {/* <TouchableOpacity 
            onPress={() => {
              console.log('🔄 Manual refresh triggered');
              setLoading(true);
              setTimeout(() => {
                setActiveRange({...activeRange});
              }, 100);
            }}
            style={{ padding: 8 }}
          >
            <Ionicons name="refresh" size={24} color="#7B61FF" />
          </TouchableOpacity> */}
        </View>

        <Text style={{ color: '#DAD7FE', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Calories & Food Rituals</Text>

        <View style={styles.rangeRow}>
          {RANGES.map(r => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setActiveRange(r)}
              style={[styles.rangeBtn, activeRange.key === r.key && styles.rangeBtnActive]}
            >
              <Text style={[styles.rangeText, activeRange.key === r.key && styles.rangeTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#A7A6C5', marginTop: 12 }}>
          {mainDisplayLabel}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#7B61FF', fontSize: 16, fontWeight: '600' }}>Loading...</Text>
            </View>
          ) : (
            <>
              <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800' }}>
                {mainDisplayValue}
              </Text>
              <Text style={{ color: '#A7A6C5', marginLeft: 6, marginBottom: 4 }}>
                {metricLabel}
              </Text>
            </>
          )}
        </View>

        {/* Metric selector */}
        <View style={styles.metricRow}>
          {['calories','protein','carbs','fat'].map(m => (
            <TouchableOpacity 
              key={m} 
              onPress={() => setActiveMetric(m)} 
              style={[styles.metricBtn, activeMetric === m && styles.metricBtnActive]}
            >
              <Text style={[styles.metricText, activeMetric === m && styles.metricTextActive]}>
                {m === 'calories' ? 'Calories' : m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ backgroundColor: '#161624', borderRadius: 16, paddingVertical: 8, marginTop: 12 }}>
          <LineChart
            data={{ 
              labels, 
              datasets: [
                { 
                  data: dataPoints.length ? dataPoints : [0], 
                  color: (opacity = 1) => `rgba(123,97,255,${opacity})` 
                },
                ...(activeMetric === 'calories' && userGoal && 
                    (activeRange.key === 'this_week' || activeRange.key === 'last_week') ? 
                  [{ 
                    data: new Array(dataPoints.length || 7).fill(userGoal), 
                    color: (opacity = 1) => `rgba(40,167,69,${opacity})` 
                  }] : []
                )
              ] 
            }}
            width={screenWidth}
            height={220}
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#161624',
              backgroundGradientFrom: '#161624',
              backgroundGradientTo: '#161624',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(215, 214, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(215, 214, 255, ${opacity})`,
              propsForDots: { r: '3', strokeWidth: '1', stroke: '#7B61FF' },
            }}
            bezier
            withInnerLines={false}
            fromZero
            style={{ alignSelf: 'center' }}
          />
        </View>
        
        {/* Data Summary */}
        <View style={styles.dataSummaryCard}>
          <Text style={styles.dataSummaryTitle}>📊 Data Summary</Text>
          <Text style={styles.dataSummaryText}>Total logs: {logsCount}</Text>
          <Text style={styles.dataSummaryText}>Current metric: {activeMetric}</Text>
          <Text style={styles.dataSummaryText}>Period: {activeRange.label}</Text>
          <Text style={styles.dataSummaryText}>
            Chart shows: {activeRange.key === 'this_week' || activeRange.key === 'last_week' ? 'Daily values' : 'Cumulative totals'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>
              {activeRange.key === 'this_week' ? 'Today' : 'Total'}
            </Text>
            <Text style={styles.statValue}>
              {activeRange.key === 'this_week' ? 
                mainDisplayValue : 
                Math.round(totals.total || 0)
              } {metricLabel}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>
              {activeRange.key === 'this_week' ? 'Weekly Total' : 'Average Daily'}
            </Text>
            <Text style={styles.statValue}>
              {activeRange.key === 'this_week' ? 
                Math.round(totals.total || 0) : 
                Math.round(totals.average || 0)
              } {metricLabel}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Best Day</Text>
            <Text style={styles.statValue}>{Math.round(totals.best || 0)} {metricLabel}</Text>
            {totals.bestDate && (
              <Text style={{ color: '#A7A6C5', marginTop: 4 }}>
                {(totals.bestDate.getMonth() + 1) + '/' + totals.bestDate.getDate()}
              </Text>
            )}
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Worst Day</Text>
            <Text style={styles.statValue}>{Math.round(totals.worst || 0)} {metricLabel}</Text>
            {totals.worstDate && (
              <Text style={{ color: '#A7A6C5', marginTop: 4 }}>
                {(totals.worstDate.getMonth() + 1) + '/' + totals.worstDate.getDate()}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.longCard}>
          <Ionicons name="flame-outline" size={18} color="#7B61FF" />
          <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>
            Logging Streak: {totals.streak} day{totals.streak === 1 ? '' : 's'}
          </Text>
        </View>

        {deltaPct != null && (
          <View style={[styles.longCard, { marginTop: 12 }]}> 
            <Ionicons 
              name={deltaPct >= 0 ? 'trending-up' : 'trending-down'} 
              size={18} 
              color={deltaPct >= 0 ? '#22C55E' : '#EF4444'} 
            />
            <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>
              {activeRange.label} vs previous: {deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%
            </Text>
          </View>
        )}

        {daily.length === 0 && !loading ? (
          <View style={styles.noDataCard}>
            <Ionicons name="information-circle-outline" size={24} color="#7B61FF" />
            <Text style={styles.noDataText}>No food logs found for this period</Text>
            <Text style={styles.noDataSubtext}>Start logging your meals to see your progress here</Text>
          </View>
        ) : (
          <Text style={{ color: '#A7A6C5', marginTop: 16 }}>
            Your calorie intake is based on your logged meals for the selected period.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: '#161624',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  rangeBtnActive: {
    backgroundColor: '#2A2942',
  },
  rangeText: { color: '#BEBCE5', fontWeight: '600' },
  rangeTextActive: { color: '#fff', fontWeight: '800' },
  statCard: {
    flex: 1,
    backgroundColor: '#161624',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },
  statTitle: { color: '#BEBCE5', marginBottom: 6 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '800' },
  metricRow: {
    flexDirection: 'row',
    backgroundColor: '#161624',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metricBtn: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  metricBtnActive: { backgroundColor: '#2A2942' },
  metricText: { color: '#BEBCE5', fontWeight: '600', fontSize: 13 },
  metricTextActive: { color: '#fff', fontWeight: '800' },
  longCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161624',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  noDataCard: {
    backgroundColor: '#161624',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2942',
  },
  noDataText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  noDataSubtext: {
    color: '#A7A6C5',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  dataSummaryCard: {
    backgroundColor: '#161624',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2A2942',
  },
  dataSummaryTitle: {
    color: '#7B61FF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  dataSummaryText: {
    color: '#A7A6C5',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
  },
});