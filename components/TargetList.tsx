import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { TargetWithProgress } from '@/db/schema';
import EmptyState from '@/components/EmptyState';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';

const PERIOD_COLORS = { weekly: '#7c3aed', monthly: '#0891b2' };

type Props = {
  targets: TargetWithProgress[];
  onEdit: (t: TargetWithProgress) => void;
  onDelete: (t: TargetWithProgress) => void;
};

export default function TargetList({ targets, onEdit, onDelete }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (targets.length === 0) {
    return (
      <EmptyState icon="bullseye" message="No targets set" subMessage="Tap + to define a weekly or monthly target." />
    );
  }

  return (
    <FlatList
      data={targets}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      accessibilityLabel="Targets list"
      renderItem={({ item }) => {
        const fillPercent = item.count > 0 ? Math.min(100, (item.actual / item.count) * 100) : 0;
        const fillColor = item.exceeded ? '#dc2626' : '#2563eb';

        let statusText: string;
        let statusColor: string;
        if (item.actual === 0)       { statusText = 'Not started';       statusColor = colors.textDisabled; }
        else if (item.exceeded)      { statusText = 'Target exceeded!';  statusColor = '#dc2626'; }
        else                         { statusText = `${item.remaining} remaining`; statusColor = '#16a34a'; }

        const scope    = item.categoryName ?? 'All Categories';
        const a11yLabel = `${item.period} target for ${scope}: ${item.actual} of ${item.count}. ${statusText}.`;

        return (
          <View style={styles.card} accessible={false}>
            <View style={styles.row1}>
              <View
                style={[styles.periodBadge, { backgroundColor: PERIOD_COLORS[item.period] }]}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Period: ${item.period}`}
              >
                <Text style={styles.periodText}>{item.period === 'weekly' ? 'Weekly' : 'Monthly'}</Text>
              </View>
              <Text style={styles.categoryLabel} numberOfLines={1} accessibilityRole="text">{scope}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => onEdit(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.period} target for ${scope}`}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => onDelete(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.period} target for ${scope}`}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={styles.row2}
              accessible={true}
              accessibilityRole="progressbar"
              accessibilityLabel={a11yLabel}
              accessibilityValue={{ min: 0, max: item.count, now: item.actual }}
            >
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${fillPercent}%` as any, backgroundColor: fillColor }]} />
              </View>
              <Text style={styles.fraction}>{item.actual} / {item.count}</Text>
            </View>

            <Text style={[styles.statusText, { color: statusColor }]} accessibilityRole="text">
              {statusText}
            </Text>
          </View>
        );
      }}
    />
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    list: { padding: 12, gap: 10 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 14,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
      gap: 10,
    },
    row1:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
    periodBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    periodText:    { color: '#fff', fontSize: 11, fontWeight: '700' },
    categoryLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: c.text },
    actions:       { flexDirection: 'row', gap: 6 },
    editBtn:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#2563eb' },
    editText:      { color: '#2563eb', fontSize: 12, fontWeight: '600' },
    deleteBtn:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: c.deleteChipBg },
    deleteText:    { color: c.deleteChipText, fontSize: 12, fontWeight: '600' },
    row2:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
    barTrack:      { flex: 1, height: 8, borderRadius: 4, backgroundColor: c.border, overflow: 'hidden' },
    barFill:       { height: '100%', borderRadius: 4 },
    fraction:      { fontSize: 12, color: c.textSecondary, minWidth: 40, textAlign: 'right' },
    statusText:    { fontSize: 12, fontWeight: '600' },
  });
}
