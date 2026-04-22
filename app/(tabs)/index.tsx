import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Alert, StyleSheet, SafeAreaView,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from 'expo-router';

import ApplicationList from '@/components/ApplicationList';
import ApplicationForm from '@/components/ApplicationForm';
import FilterBar, { FilterState } from '@/components/FilterBar';
import { ApplicationWithCategory, Category, NewApplication } from '@/db/schema';
import { getApplications, createApplication, updateApplication, deleteApplication, getCategories } from '@/db/queries';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';

const EMPTY_FILTERS: FilterState = { searchText: '', fromDate: '', toDate: '', selectedCategoryIds: [] };

type FormMode = 'add' | 'edit' | null;

export default function ApplicationsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [applications, setApplications] = useState<ApplicationWithCategory[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [formMode, setFormMode]         = useState<FormMode>(null);
  const [editing, setEditing]           = useState<ApplicationWithCategory | null>(null);
  const [filters, setFilters]           = useState<FilterState>(EMPTY_FILTERS);
  const [error, setError]               = useState<string | null>(null);

  function load() {
    try {
      setError(null);
      setApplications(getApplications());
      setCategories(getCategories());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data. Please restart the app.');
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const { searchText, fromDate, toDate, selectedCategoryIds } = filters;
      if (searchText) {
        const q = searchText.toLowerCase();
        const hit = app.company.toLowerCase().includes(q) || app.role.toLowerCase().includes(q) || (app.notes ?? '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (fromDate && app.dateApplied < fromDate) return false;
      if (toDate   && app.dateApplied > toDate)   return false;
      if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(app.categoryId)) return false;
      return true;
    });
  }, [applications, filters]);

  const isFiltered = !!filters.searchText || !!filters.fromDate || !!filters.toDate || filters.selectedCategoryIds.length > 0;

  function handleAdd(data: Omit<NewApplication, 'id'>) { createApplication(data); load(); setFormMode(null); }
  function handleEdit(data: Omit<NewApplication, 'id'>) {
    if (!editing) return;
    updateApplication(editing.id, data); load(); setFormMode(null); setEditing(null);
  }
  function handleDeletePress(app: ApplicationWithCategory) {
    Alert.alert('Delete Application', `Remove "${app.role}" at ${app.company}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteApplication(app.id); load(); } },
    ]);
  }
  function openEdit(app: ApplicationWithCategory) { setEditing(app); setFormMode('edit'); }
  function closeForm() { setFormMode(null); setEditing(null); }

  const countLabel = isFiltered ? `${filtered.length} of ${applications.length}` : `${applications.length} total`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Applications</Text>
        <Text style={styles.count}>{countLabel}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setFormMode('add')} accessibilityRole="button" accessibilityLabel="Add new application">
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive" accessibilityRole="alert">
          <FontAwesome name="exclamation-triangle" size={13} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FilterBar filters={filters} categories={categories} onChange={setFilters} onClear={() => setFilters(EMPTY_FILTERS)} />
      <ApplicationList applications={filtered} isFiltered={isFiltered} onEdit={openEdit} onDelete={handleDeletePress} />

      <Modal visible={formMode !== null} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>
          <ApplicationForm
            initial={formMode === 'edit' ? editing ?? undefined : undefined}
            categories={categories}
            onSubmit={formMode === 'edit' ? handleEdit : handleAdd}
            onCancel={closeForm}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: c.surface,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    title:      { fontSize: 18, fontWeight: '700', color: c.text, flex: 1 },
    count:      { fontSize: 13, color: c.textMuted, marginRight: 12 },
    addBtn:     { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    errorBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.errorBannerBg,
      borderBottomWidth: 1, borderBottomColor: c.errorBannerBorder,
      paddingHorizontal: 16, paddingVertical: 10,
    },
    errorText: { flex: 1, fontSize: 13, color: '#dc2626' },
  });
}
