// main applications screen - the home tab of the app
// handles full crud for job applications and client-side filtering
// a modal slides up for the add/edit form, same pattern as categories screen

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';

import ApplicationForm from '@/components/ApplicationForm';
import ApplicationList from '@/components/ApplicationList';
import FilterBar, { FilterState } from '@/components/FilterBar';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';
import { createApplication, deleteApplication, getApplications, getCategories, updateApplication } from '@/db/queries';
import { ApplicationWithCategory, Category, NewApplication } from '@/db/schema';

// default empty filter state - used to reset filters
const EMPTY_FILTERS: FilterState = { searchText: '', fromDate: '', toDate: '', selectedCategoryIds: [] };

// tracks whether the modal is open for adding, editing or closed
type FormMode = 'add' | 'edit' | null;

export default function ApplicationsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // state for applications, categories, form mode, active filters and errors
  const [applications, setApplications] = useState<ApplicationWithCategory[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [formMode, setFormMode]         = useState<FormMode>(null);
  const [editing, setEditing]           = useState<ApplicationWithCategory | null>(null);
  const [filters, setFilters]           = useState<FilterState>(EMPTY_FILTERS);
  const [error, setError]               = useState<string | null>(null);

  // load all applications and categories from sqlite
  function load() {
    try {
      setError(null);
      setApplications(getApplications());
      setCategories(getCategories());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load data. Please restart the app.');
    }
  }

  // reload data whenever the screen comes into focus
  useFocusEffect(useCallback(() => { load(); }, []));

  // filter applications in memory based on search text, date range and category
  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const { searchText, fromDate, toDate, selectedCategoryIds } = filters;
      if (searchText) {
        const q = searchText.toLowerCase();
        // search across company name, role and notes fields
        const hit = app.company.toLowerCase().includes(q) || app.role.toLowerCase().includes(q) || (app.notes ?? '').toLowerCase().includes(q);
        if (!hit) return false;
      }
      // filter by date range if set
      if (fromDate && app.dateApplied < fromDate) return false;
      if (toDate   && app.dateApplied > toDate)   return false;
      // filter by selected categories if any are chosen
      if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(app.categoryId)) return false;
      return true;
    });
  }, [applications, filters]);

  // check if any filters are currently active
  const isFiltered = !!filters.searchText || !!filters.fromDate || !!filters.toDate || filters.selectedCategoryIds.length > 0;

  // insert a new application then refresh the list
  function handleAdd(data: Omit<NewApplication, 'id'>) { createApplication(data); load(); setFormMode(null); }

  // update an existing application then refresh the list
  function handleEdit(data: Omit<NewApplication, 'id'>) {
    if (!editing) return;
    updateApplication(editing.id, data); load(); setFormMode(null); setEditing(null);
  }

  // confirm before deleting an application
  function handleDeletePress(app: ApplicationWithCategory) {
    Alert.alert('Delete Application', `Remove "${app.role}" at ${app.company}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteApplication(app.id); load(); } },
    ]);
  }

  // open the modal in edit mode with the selected application pre-filled
  function openEdit(app: ApplicationWithCategory) { setEditing(app); setFormMode('edit'); }

  // close the modal and clear editing state
  function closeForm() { setFormMode(null); setEditing(null); }

  // show filtered count in the header when filters are active
  const countLabel = isFiltered ? `${filtered.length} of ${applications.length}` : `${applications.length} total`;

  return (
    <SafeAreaView style={styles.container}>
      {/* header with title, count and add button */}
      <View style={styles.header}>
        <Text style={styles.title}>Job Applications</Text>
        <Text style={styles.count}>{countLabel}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setFormMode('add')} accessibilityRole="button" accessibilityLabel="Add new application">
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* error banner if data fails to load */}
      {error && (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive" accessibilityRole="alert">
          <FontAwesome name="exclamation-triangle" size={13} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* filter bar for searching and filtering applications */}
      <FilterBar filters={filters} categories={categories} onChange={setFilters} onClear={() => setFilters(EMPTY_FILTERS)} />

      {/* scrollable list of filtered applications */}
      <ApplicationList applications={filtered} isFiltered={isFiltered} onEdit={openEdit} onDelete={handleDeletePress} />

      {/* modal for add or edit form */}
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

// styles defined as a function to support light and dark theme colours
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