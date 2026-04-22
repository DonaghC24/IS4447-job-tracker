import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Category, NewCategory } from '@/db/schema';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';

const COLOR_PALETTE = [
  '#2563eb', '#16a34a', '#d97706', '#dc2626',
  '#7c3aed', '#0891b2', '#db2777', '#65a30d',
  '#ea580c', '#0f766e',
];

type Props = {
  initial?: Category;
  onSubmit: (data: Omit<NewCategory, 'id'>) => void;
  onCancel: () => void;
};

export default function CategoryForm({ initial, onSubmit, onCancel }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [name, setName]   = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? COLOR_PALETTE[0]);

  function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Category name is required.');
      return;
    }
    onSubmit({ name: name.trim(), color });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{initial ? 'Edit Category' : 'New Category'}</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Graduate Roles"
        placeholderTextColor={colors.textDisabled}
        autoFocus
      />

      <Text style={styles.label}>Colour *</Text>
      <View style={styles.swatchRow}>
        {COLOR_PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchSelected]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <View style={styles.preview}>
        <View style={[styles.previewDot, { backgroundColor: color }]} />
        <Text style={styles.previewText}>{name || 'Preview'}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>{initial ? 'Save Changes' : 'Create Category'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container:    { padding: 16, backgroundColor: c.surfaceAlt },
    heading:      { fontSize: 20, fontWeight: '700', marginBottom: 16, color: c.text },
    label:        { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 4, marginTop: 12 },
    input: {
      borderWidth: 1,
      borderColor: c.borderLight,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 15,
      backgroundColor: c.inputBg,
      color: c.text,
    },
    swatchRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    swatch:       { width: 36, height: 36, borderRadius: 18 },
    swatchSelected: { borderWidth: 3, borderColor: c.text },
    preview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 20,
      padding: 12,
      backgroundColor: c.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    previewDot:  { width: 14, height: 14, borderRadius: 7 },
    previewText: { fontSize: 15, color: c.text, fontWeight: '600' },
    buttonRow:   { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
    cancelBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borderLight,
    },
    cancelText: { color: c.textSecondary, fontSize: 14 },
    submitBtn:  { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2563eb' },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  });
}
