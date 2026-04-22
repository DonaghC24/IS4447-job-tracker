import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Alert, StyleSheet, SafeAreaView,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from 'expo-router';

import CategoryList from '@/components/CategoryList';
import CategoryForm from '@/components/CategoryForm';
import { Category, NewCategory } from '@/db/schema';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/db/queries';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';

type FormMode = 'add' | 'edit' | null;

export default function CategoriesScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [cats, setCats]         = useState<Category[]>([]);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editing, setEditing]   = useState<Category | null>(null);
  const [error, setError]       = useState<string | null>(null);

  function load() {
    try { setError(null); setCats(getCategories()); }
    catch (e: any) { setError(e?.message ?? 'Failed to load categories.'); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  function handleAdd(data: Omit<NewCategory, 'id'>)  { createCategory(data); load(); setFormMode(null); }
  function handleEdit(data: Omit<NewCategory, 'id'>) {
    if (!editing) return;
    updateCategory(editing.id, data); load(); setFormMode(null); setEditing(null);
  }
  function handleDeletePress(cat: Category) {
    Alert.alert('Delete Category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        try { deleteCategory(cat.id); load(); }
        catch (e: any) { Alert.alert('Cannot Delete', e.message); }
      }},
    ]);
  }
  function openEdit(cat: Category) { setEditing(cat); setFormMode('edit'); }
  function closeForm() { setFormMode(null); setEditing(null); }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.count}>{cats.length} total</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setFormMode('add')} accessibilityRole="button" accessibilityLabel="Add new category">
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive" accessibilityRole="alert">
          <FontAwesome name="exclamation-triangle" size={13} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <CategoryList categories={cats} onEdit={openEdit} onDelete={handleDeletePress} />

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
