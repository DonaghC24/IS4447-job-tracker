import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from 'expo-router';
import { getInsightsData, getStreakData, InsightsData, StreakData } from '@/db/queries';
import EmptyState from '@/components/EmptyState';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';

type Period = 'daily' | 'weekly' | 'monthly';

const STATUS_COLORS: Record<string, string> = {
  Applied:   '#2563eb',
  Interview: '#d97706',
  Offer:     '#16a34a',
  Rejected:  '#dc2626',
};

function BarChart({ data, colors }: { data: { label: string; count: number }[]; colors: AppColors }) {
  const styles = useMemo(() => makeChartStyles(colors), [colors]);
  const max = Math.max(...data.map(d => d.count), 1);
  const CHART_H = 100;

  return (
    <View style={styles.root}>
      {data.map((item, i) => {
        const barH = Math.max((item.count / max) * CHART_H, item.count > 0 ? 4 : 0);
        return (
          <View key={i} style={styles.col}>
            {item.count > 0 && <Text style={styles.value}>{item.count}</Text>}
            <View style={[styles.barContainer, { height: CHART_H }]}>
              <View style={[styles.bar, { height: barH }]} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function BreakdownRow({ label, count, total, color, colors }: {
  label: string; count: number; total: number; color: string; colors: AppColors;
}) {
  const styles = useMemo(() => makeBdStyles(colors), [colors]);
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

export default function InsightsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [data, setData]       = useState<InsightsData | null>(null);
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [period, setPeriod]   = useState<Period>('weekly');
  const [error, setError]     = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      try {
        setError(null);
        setData(getInsightsData());
        setStreaks(getStreakData());
      } catch (e: any) { setError(e?.message ?? 'Failed to load insights.'); }
    }, [])
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorFull}>
          <FontAwesome name="exclamation-triangle" size={36} color="#fca5a5" />
          <Text style={styles.errorTitle}>Could not load insights</Text>
          <Text style={styles.errorSub}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data || !streaks) return null;

  const chartData =
    period === 'daily'  ? data.dailyLast7 :
    period === 'weekly' ? data.weeklyLast4 : data.monthlyLast6;

  const chartTitle =
    period === 'daily'  ? 'Applications — Last 7 Days' :
    period === 'weekly' ? 'Applications — Last 4 Weeks' : 'Applications — Last 6 Months';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.cardRow}>
          <View style={[styles.statCard, { borderTopColor: '#2563eb' }]}>
            <Text style={styles.statValue}>{data.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#7c3aed' }]}>
            <Text style={styles.statValue}>{data.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#0891b2' }]}>
            <Text style={styles.statValue}>{data.thisMonth}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Streaks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakCard}>
              <FontAwesome name="calendar-check-o" size={24} color="#d97706" style={styles.streakIcon} />
              <Text style={styles.streakCount}>{streaks.dailyStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
              <Text style={styles.streakSub}>
                {streaks.dailyStreak === 0 ? 'No apps yet' : streaks.dailyStreak === 1 ? '1 day going' : `${streaks.dailyStreak} days going`}
              </Text>
            </View>
            <View style={styles.streakCard}>
              <FontAwesome name="bullseye" size={24} color="#7c3aed" style={styles.streakIcon} />
              <Text style={styles.streakCount}>
                {streaks.hasWeeklyTargets ? streaks.weeklyStreak : '-'}
              </Text>
              <Text style={styles.streakLabel}>Week Streak</Text>
              <Text style={styles.streakSub}>
                {!streaks.hasWeeklyTargets
                  ? 'Set weekly targets'
                  : streaks.weeklyStreak === 0
                  ? 'Target not met'
                  : `${streaks.weeklyStreak} week${streaks.weeklyStreak !== 1 ? 's' : ''} going`}
              </Text>
            </View>
          </View>
        </View>

        {/* Bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{chartTitle}</Text>
          <View style={styles.periodRow}>
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodChip, period === p && styles.periodChipActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodChipText, period === p && styles.periodChipTextActive]}>
                  {p === 'daily' ? '7 Days' : p === 'weekly' ? '4 Weeks' : '6 Months'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {data.total === 0 ? (
            <EmptyState icon="bar-chart" message="No data yet" subMessage="Add some applications to see your chart." />
          ) : (
            <BarChart data={chartData} colors={colors} />
          )}
        </View>

        {data.byStatus.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Status</Text>
            {data.byStatus.sort((a, b) => b.count - a.count).map((item) => (
              <BreakdownRow
                key={item.status}
                label={item.status}
                count={item.count}
                total={data.total}
                color={STATUS_COLORS[item.status] ?? '#888'}
                colors={colors}
              />
            ))}
          </View>
        )}

        {data.byCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Category</Text>
            {data.byCategory.map((item) => (
              <BreakdownRow
                key={item.name}
                label={item.name}
                count={item.count}
                total={data.total}
                color={item.color}
                colors={colors}
              />
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll:    { padding: 14, gap: 14 },

    cardRow: { flexDirection: 'row', gap: 10 },
    statCard: {
      flex: 1, backgroundColor: c.surface, borderRadius: 10, padding: 14,
      alignItems: 'center', borderTopWidth: 3,
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1,
    },
    statValue: { fontSize: 26, fontWeight: '800', color: c.text },
    statLabel: { fontSize: 11, color: c.textMuted, marginTop: 2, fontWeight: '600' },

    section: {
      backgroundColor: c.surface, borderRadius: 10, padding: 16,
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1,
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 12 },

    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    periodChip: {
      paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16,
      borderWidth: 1, borderColor: c.borderLight, backgroundColor: c.chipBg,
    },
    periodChipActive:     { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    periodChipText:       { fontSize: 12, color: c.textSecondary },
    periodChipTextActive: { color: '#fff', fontWeight: '600' },

    streakRow:  { flexDirection: 'row', gap: 12 },
    streakCard: {
      flex: 1,
      backgroundColor: c.background,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    streakIcon:  { marginBottom: 6 },
    streakCount: { fontSize: 28, fontWeight: '800', color: c.text },
    streakLabel: { fontSize: 12, fontWeight: '700', color: c.textSecondary, marginTop: 2 },
    streakSub:   { fontSize: 11, color: c.textMuted, marginTop: 3, textAlign: 'center' },

    errorFull:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 },
    errorTitle: { fontSize: 16, fontWeight: '700', color: c.text, textAlign: 'center' },
    errorSub:   { fontSize: 13, color: c.textMuted, textAlign: 'center' },
  });
}

function makeChartStyles(c: AppColors) {
  return StyleSheet.create({
    root:         { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingTop: 20 },
    col:          { flex: 1, alignItems: 'center', gap: 4 },
    value:        { fontSize: 9, color: c.textSecondary, fontWeight: '600' },
    barContainer: { justifyContent: 'flex-end', width: '100%' },
    bar:          { width: '100%', backgroundColor: '#2563eb', borderRadius: 3, minWidth: 6 },
    label:        { fontSize: 9, color: c.textMuted, textAlign: 'center' },
  });
}

function makeBdStyles(c: AppColors) {
  return StyleSheet.create({
    row:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    label: { width: 76, fontSize: 12, color: c.textSecondary, fontWeight: '600' },
    track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: c.border, overflow: 'hidden' },
    fill:  { height: '100%', borderRadius: 5 },
    count: { width: 24, fontSize: 12, color: c.textSecondary, textAlign: 'right' },
  });
}
