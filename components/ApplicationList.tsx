// renders the scrollable list of job application cards
// shows different empty states depending on whether filters are active or no data exists
// each card displays company, role, status badge, category, date, notes and action buttons

import EmptyState from '@/components/EmptyState';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';
import { ApplicationWithCategory } from '@/db/schema';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// colour mapping for each application status badge
const STATUS_COLORS: Record<string, string> = {
  Applied:   '#2563eb',
  Interview: '#d97706',
  Offer:     '#16a34a',
  Rejected:  '#dc2626',
};

type Props = {
  applications: ApplicationWithCategory[];
  isFiltered?: boolean;
  onEdit: (app: ApplicationWithCategory) => void;
  onDelete: (app: ApplicationWithCategory) => void;
};

export default function ApplicationList({ applications, isFiltered, onEdit, onDelete }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // show appropriate empty state based on whether filters are active
  if (applications.length === 0) {
    return isFiltered ? (
      <EmptyState icon="search" message="No results found" subMessage="Try adjusting your filters or search term." />
    ) : (
      <EmptyState icon="briefcase" message="No applications yet" subMessage="Tap + to add your first job application." />
    );
  }

  return (
    <FlatList
      data={applications}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      accessibilityLabel="Job applications list"
      renderItem={({ item }) => (
        <View style={styles.card} accessible={false}>
          {/* card header with company/role and status badge */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitles} accessible={true} accessibilityRole="text" accessibilityLabel={`${item.role} at ${item.company}`}>
              <Text style={styles.company}>{item.company}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? '#666' }]} accessible={true} accessibilityRole="text" accessibilityLabel={`Status: ${item.status}`}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </View>

          {/* category dot and date applied */}
          <View style={styles.cardMeta}>
            <View style={styles.categoryTag} accessible={true} accessibilityRole="text" accessibilityLabel={`Category: ${item.categoryName ?? 'Unknown'}`}>
              <View style={[styles.catDot, { backgroundColor: item.categoryColor ?? '#999' }]} />
              <Text style={styles.meta}>{item.categoryName ?? '—'}</Text>
            </View>
            <Text style={styles.meta} accessible={true} accessibilityLabel={`Applied on ${item.dateApplied}`}>
              {item.dateApplied}
            </Text>
          </View>

          {/* optional notes shown in italics if present */}
          {item.notes ? (
            <Text style={styles.notes} accessibilityLabel={`Notes: ${item.notes}`}>{item.notes}</Text>
          ) : null}

          {/* edit and delete action buttons */}
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)} accessibilityRole="button" accessibilityLabel={`Edit ${item.role} at ${item.company}`}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item)} accessibilityRole="button" accessibilityLabel={`Delete ${item.role} at ${item.company}`}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

// styles defined as a function to support light and dark theme colours
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
    },
    cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitles:  { flex: 1, marginRight: 8 },
    company:     { fontSize: 16, fontWeight: '700', color: c.text },
    role:        { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    badge:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    badgeText:   { color: '#fff', fontSize: 12, fontWeight: '600' },
    cardMeta:    { flexDirection: 'row', gap: 12, marginTop: 8, alignItems: 'center' },
    categoryTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    catDot:      { width: 8, height: 8, borderRadius: 4 },
    meta:        { fontSize: 12, color: c.textMuted },
    notes:       { fontSize: 12, color: c.textMuted, marginTop: 6, fontStyle: 'italic' },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
    editBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#2563eb',
    },
    editText:   { color: '#2563eb', fontSize: 13, fontWeight: '600' },
    deleteBtn:  { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, backgroundColor: c.deleteChipBg },
    deleteText: { color: c.deleteChipText, fontSize: 13, fontWeight: '600' },
  });
}