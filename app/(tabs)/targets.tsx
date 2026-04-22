// targets screen - lets users set and manage weekly/monthly application goals
// targets can be global (all categories) or specific to a single category
// progress is calculated from stored application data and passed to each target card

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

import TargetForm from '@/components/TargetForm';
import TargetList from '@/components/TargetList';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';
import { createTarget, deleteTarget, getCategories, getTargetsWithProgress, updateTarget } from '@/db/queries';
import { Category, NewTarget, Target, TargetWithProgress } from '@/db/schema';

// tracks whether the modal is open for adding, editing or closed
type FormMode = 'add' | 'edit' | null;

export default function TargetsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // state for targets with progress data, categories, form mode and errors
  const [targetList, setTargetList] = useState<TargetWithProgress[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formMode, setFormMode]     = useState<FormMode>(null);
  const [editing, setEditing]       = useState<TargetWithProgress | null>(null);
  const [error, setError]           = useState<string | null>(null);

  // load targets with their progress and all categories from sqlite
  function load() {
    try { setError(null); setTargetList(getTargetsWithProgress()); setCategories(getCategories()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load targets.'); }
  }

  // reload whenever the screen comes into focus
  useFocusEffect(useCallback(() => { load(); }, []));

  // create a new target and refresh - show error if a duplicate exists
  function handleAdd(data: Omit<NewTarget, 'id'>) {
    const result = createTarget(data);
    if (!result.success) { Alert.alert('Cannot Create Target', result.error ?? 'Unknown error.'); return; }
    load(); setFormMode(null);
  }

  // update an existing target - catch unique constraint errors from sqlite
  function handleEdit(data: Omit<NewTarget, 'id'>) {
    if (!editing) return;
    try { updateTarget(editing.id, data); load(); setFormMode(null); setEditing(null); }
    catch (e: any) {
      // prevent duplicate targets for the same period and category combination
      if (e?.message?.includes('UNIQUE constraint failed')) Alert.alert('Cannot Update', 'A target with this period and category already exists.');
      else throw e;
    }
  }

  // confirm before deleting a target
  function handleDeletePress(target: TargetWithProgress) {
    Alert.alert('Delete Target', `Delete this ${target.period} target for ${target.categoryName ?? 'All Categories'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteTarget(target.id); load(); } },
    ]);
  }

  // open the modal in edit mode with the selected target pre-filled
  function openEdit(target: TargetWithProgress) { setEditing(target); setFormMode('edit'); }

  // close the modal and clear the editing state
  function closeForm() { setFormMode(null); setEditing(null); }

  // dynamic label showing the number of active targets
  const label = `${targetList.length} target${targetList.length !== 1 ? 's' : ''}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* header with title, target count and add button */}
      <View style={styles.header}>
        <Text style={styles.title}>Targets</Text>
        <Text style={styles.count}>{label}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setFormMode('add')} accessibilityRole="button" accessibilityLabel="Add new target">
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* error banner if loading fails */}
      {error && (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive" accessibilityRole="alert">
          <FontAwesome name="exclamation-triangle" size={13} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* scrollable list of targets with progress indicators */}
      <TargetList targets={targetList} onEdit={openEdit} onDelete={handleDeletePress} />

      {/* modal for add or edit form */}
      <Modal visible={formMode !== null} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>
          <TargetForm
            initial={formMode === 'edit' ? (editing as Target) : undefined}
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