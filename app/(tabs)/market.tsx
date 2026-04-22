// market screen - external api integration showing irish unemployment data
// data is fetched on demand from eurostat rather than on screen load
// handles loading, error and empty states explicitly

import { useAppTheme, type AppColors } from '@/context/ThemeContext';
import { getIrishUnemploymentTrend, type UnemploymentPoint } from '@/lib/csoApi';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MarketScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // state for the fetched data points, loading flag, error message and whether data has been loaded
  const [data, setData]       = useState<UnemploymentPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [loaded, setLoaded]   = useState(false);

  // fetch unemployment data from the eurostat api
  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const rows = await getIrishUnemploymentTrend();
      setData(rows);
      setLoaded(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  // calculate the latest rate, previous rate and the change between them
  const latest   = data[data.length - 1];
  const previous = data[data.length - 2];
  const delta    = latest && previous ? +(latest.rate - previous.rate).toFixed(1) : null;
  // used to scale bar widths relative to the highest rate in the dataset
  const maxRate  = data.length > 0 ? Math.max(...data.map(d => d.rate)) : 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Irish Job Market</Text>
        {loaded && <Text style={styles.subtitle}>Unemployment Rate — Ireland (Eurostat)</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* initial prompt shown before data is loaded */}
        {!loaded && !loading && !error && (
          <View style={styles.prompt}>
            <FontAwesome name="line-chart" size={48} color={colors.borderLight} />
            <Text style={styles.promptTitle}>Irish Unemployment Trend</Text>
            <Text style={styles.promptSub}>
              Monthly unemployment rate for Ireland from Eurostat.
              Useful context when tracking your job search.
            </Text>
            <TouchableOpacity
              style={styles.loadBtn}
              onPress={fetchData}
              accessibilityRole="button"
              accessibilityLabel="Load Irish market data"
            >
              <Text style={styles.loadBtnText}>Load Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* loading spinner while the api request is in progress */}
        {loading && (
          <View style={styles.centre}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Fetching from Eurostat...</Text>
          </View>
        )}

        {/* error state with retry button if the api call fails */}
        {error && (
          <View style={styles.centre}>
            <FontAwesome name="exclamation-triangle" size={32} color="#dc2626" />
            <Text style={styles.errorTitle}>Could not load data</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* data view - shown once the api call succeeds */}
        {loaded && data.length > 0 && !loading && (
          <>
            {/* summary card showing the latest rate and change from previous month */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryMain}>
                <Text style={styles.summaryRate}>{latest.rate}%</Text>
                <Text style={styles.summaryLabel}>Current Rate</Text>
                <Text style={styles.summaryPeriod}>{latest.period}</Text>
              </View>
              {delta !== null && (
                <View style={styles.summaryDelta}>
                  {/* arrow icon colour depends on whether rate went up or down */}
                  <FontAwesome
                    name={delta < 0 ? 'arrow-down' : delta > 0 ? 'arrow-up' : 'minus'}
                    size={16}
                    color={delta < 0 ? '#16a34a' : delta > 0 ? '#dc2626' : colors.textMuted}
                  />
                  <Text style={[
                    styles.deltaText,
                    { color: delta < 0 ? '#16a34a' : delta > 0 ? '#dc2626' : colors.textMuted }
                  ]}>
                    {delta > 0 ? '+' : ''}{delta}% vs prev month
                  </Text>
                </View>
              )}
            </View>

            {/* horizontal bar chart showing the 13 month trend */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>13-Month Trend</Text>
              {data.map((point, i) => {
                // calculate bar width as a percentage of the maximum rate
                const barPct = (point.rate / maxRate) * 100;
                const isLatest = i === data.length - 1;
                return (
                  <View key={i} style={styles.row}>
                    {/* highlight the most recent period in bold */}
                    <Text style={[styles.rowPeriod, isLatest && styles.rowPeriodLatest]}>
                      {point.period}
                    </Text>
                    <View style={styles.barArea}>
                      <View style={styles.barTrack}>
                        <View style={[
                          styles.barFill,
                          { width: `${barPct}%` as any },
                          // latest bar is blue, older bars are grey
                          isLatest && styles.barFillLatest,
                        ]} />
                      </View>
                      <Text style={[styles.rowRate, isLatest && styles.rowRateLatest]}>
                        {point.rate}%
                      </Text>
                    </View>
                  </View>
                );
              })}
              {/* data source attribution */}
              <Text style={styles.source}>
                Source: Eurostat une_rt_m — Seasonally adjusted, all ages
              </Text>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// styles defined as a function to support light and dark theme colours
function makeStyles(c: AppColors) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: c.background },
    header: {
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: c.surface,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    title:    { fontSize: 18, fontWeight: '700', color: c.text },
    subtitle: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    scroll:   { padding: 16, gap: 14, flexGrow: 1 },

    prompt: { alignItems: 'center', paddingTop: 60, gap: 12 },
    promptTitle: { fontSize: 17, fontWeight: '700', color: c.text, textAlign: 'center', marginTop: 16 },
    promptSub: { fontSize: 13, color: c.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
    loadBtn: { marginTop: 8, backgroundColor: '#2563eb', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
    loadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    centre: { alignItems: 'center', paddingTop: 80, gap: 10 },
    loadingText: { fontSize: 14, color: c.textMuted, marginTop: 8 },
    errorTitle:  { fontSize: 16, fontWeight: '700', color: c.text },
    errorMsg:    { fontSize: 13, color: c.textMuted, textAlign: 'center', paddingHorizontal: 24 },
    retryBtn:    { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#2563eb' },
    retryText:   { color: '#2563eb', fontWeight: '600', fontSize: 14 },

    summaryCard: {
      backgroundColor: c.surface, borderRadius: 10, padding: 20,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1,
      borderTopWidth: 3, borderTopColor: '#2563eb',
    },
    summaryMain:   { gap: 2 },
    summaryRate:   { fontSize: 36, fontWeight: '800', color: c.text },
    summaryLabel:  { fontSize: 13, color: c.textMuted, fontWeight: '600' },
    summaryPeriod: { fontSize: 12, color: c.textDisabled },
    summaryDelta:  { alignItems: 'center', gap: 4 },
    deltaText:     { fontSize: 12, fontWeight: '600' },

    card: {
      backgroundColor: c.surface, borderRadius: 10, padding: 16,
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1,
    },
    cardTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 14 },

    row:       { marginBottom: 10 },
    rowPeriod: { fontSize: 11, color: c.textMuted, marginBottom: 3 },
    rowPeriodLatest: { color: c.text, fontWeight: '700' },
    barArea:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    barTrack:  { flex: 1, height: 10, borderRadius: 5, backgroundColor: c.border, overflow: 'hidden' },
    barFill:   { height: '100%', borderRadius: 5, backgroundColor: c.borderLight },
    barFillLatest: { backgroundColor: '#2563eb' },
    rowRate:   { fontSize: 12, color: c.textSecondary, minWidth: 38, textAlign: 'right' },
    rowRateLatest: { color: c.text, fontWeight: '700' },

    source: { fontSize: 10, color: c.textDisabled, marginTop: 14, fontStyle: 'italic' },
  });
}