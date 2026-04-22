import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Category, NewTarget, Target } from '@/db/schema';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';

type Props = {
  initial?: Target;
  categories: Category[];
  onSubmit: (data: Omit<NewTarget, 'id'>) => void;
  onCancel: () => void;
};

export default function TargetForm({ initial, categories, onSubmit, onCancel }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [period, setPeriod]       = useState<'weekly' | 'monthly'>(initial?.period ?? 'weekly');
  const [countText, setCountText] = useState(initial?.count != null ? String(initial.count) : '');
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);

  function handleSubmit() {
    const parsed = parseInt(countText, 10);
    if (!countText.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validation', 'Target count must be a whole number greater than 0.');
      return;
    }
    onSubmit({ period, count: parsed, categoryId });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{initial ? 'Edit Target' : 'New Target'}</Text>

      <Text style={styles.label}>Period *</Text>
      <View style={styles.chipRow}>
        {(['weekly', 'monthly'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, period === p && styles.chipSelected]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.chipText, period === p && styles.chipTextSelected]}>
              {p === 'weekly' ? 'Weekly' : 'Monthly'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Target Count *</Text>
      <TextInput
        style={styles.input}
        value={countText}
        onChangeText={setCountText}
        placeholder="e.g. 5"
        placeholderTextColor={colors.textDisabled}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, categoryId === null && styles.chipSelected]}
          onPress={() => setCategoryId(null)}
        >
          <Text style={[styles.chipText, categoryId === null && styles.chipTextSelected]}>
            All Categories
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => {
          const selected = categoryId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, { borderColor: cat.color }, selected && { backgroundColor: cat.color }]}
              onPress={() => setCategoryId(cat.id)}
            >
              <View style={styles.catInner}>
                {!selected && <View style={[styles.catDot, { backgroundColor: cat.color }]} />}
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{cat.name}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>{initial ? 'Save Changes' : 'Create Target'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { padding: 16, backgroundColor: c.surfaceAlt },
    heading:   { fontSize: 20, fontWeight: '700', marginBottom: 16, color: c.text },
    label:     { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 4, marginTop: 12 },
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
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: c.borderLight,
      backgroundColor: c.chipBg,
    },
    chipSelected:     { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    chipText:         { fontSize: 13, color: c.textSecondary },
    chipTextSelected: { color: '#fff', fontWeight: '600' },
    catInner:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
    catDot:           { width: 8, height: 8, borderRadius: 4 },
    buttonRow:        { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
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
