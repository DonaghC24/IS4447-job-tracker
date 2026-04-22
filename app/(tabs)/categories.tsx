// categories screen - lets users create, edit and delete categories
// categories are used to organise job applications by type or sector
// a modal slides up for the add/edit form to keep the ui clean

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

import CategoryForm from '@/components/CategoryForm';
import CategoryList from '@/components/CategoryList';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';
import { createCategory, deleteCategory, getCategories, updateCategory } from '@/db/queries';
import { Category, NewCategory } from '@/db/schema';

// tracks whether the modal is in add or edit mode, or closed
type FormMode = 'add' | 'edit' | null;

export default function CategoriesScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // state for the category list, form mode, currently editing category and any errors
  const [cats, setCats]         = useState<Category[]>([]);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editing, setEditing]   = useState<Category | null>(null);
  const [error, setError]       = useState<string | null>(null);

  // load all categories from sqlite and catch any errors
  function load() {
    try { setError(null); setCats(getCategories()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load categories.'); }
  }

  // reload categories every time the screen comes into focus
  useFocusEffect(useCallback(() => { load(); }, []));

  // insert a new category then refresh the list and close the modal
  function handleAdd(data: Omit<NewCategory, 'id'>)  { createCategory(data); load(); setFormMode(null); }

  // update the existing category then refresh and close the modal
  function handleEdit(data: Omit<NewCategory, 'id'>) {
    if (!editing) return;
    updateCategory(editing.id, data); load(); setFormMode(null); setEditing(null);
  }

  // show a confirmation alert before deleting a category
  function handleDeletePress(cat: Category) {
    Alert.alert('Delete Category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        try { deleteCategory(cat.id); load(); }
        // catch errors e.g. if the category is still in use by applications
        catch (e: any) { Alert.alert('Cannot Delete', e.message); }
      }},
    ]);
  }

  // set the category to edit and open the modal in edit mode
  function openEdit(cat: Category) { setEditing(cat); setFormMode('edit'); }

  // close the modal and clear the editing state
  function closeForm() { setFormMode(null); setEditing(null); }

  return (
    <SafeAreaView style={styles.container}>
      {/* header with title, category count and add button */}
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.count}>{cats.length} total</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setFormMode('add')} accessibilityRole="button" accessibilityLabel="Add new category">
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* error banner shown if loading fails - announced to screen readers */}
      {error && (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive" accessibilityRole="alert">
          <FontAwesome name="exclamation-triangle" size={13} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* scrollable list of existing categories */}
      <CategoryList categories={cats} onEdit={openEdit} onDelete={handleDeletePress} />

      {/* modal slides up for the add or edit form */}
      <Modal visible={formMode !== null} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>
          <CategoryForm
            initial={formMode === 'edit' ? editing ?? undefined : undefined}
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