import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Application, Category, NewApplication } from '@/db/schema';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];

type Props = {
  initial?: Application;
  categories: Category[];
  onSubmit: (data: Omit<NewApplication, 'id'>) => void;
  onCancel: () => void;
};

export default function ApplicationForm({ initial, categories, onSubmit, onCancel }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [company, setCompany]       = useState(initial?.company ?? '');
  const [role, setRole]             = useState(initial?.role ?? '');
  const [status, setStatus]         = useState(initial?.status ?? 'Applied');
  const [dateApplied, setDateApplied] = useState(
    initial?.dateApplied ?? new Date().toISOString().split('T')[0]
  );
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [notes, setNotes]           = useState(initial?.notes ?? '');

  function handleSubmit() {
    if (!company.trim() || !role.trim() || !dateApplied) {
      Alert.alert('Validation', 'Company, role, and date are required.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Validation', 'Please select a category.');
      return;
    }
    onSubmit({
      company: company.trim(),
      role: role.trim(),
      status,
      dateApplied,
      categoryId,
      notes: notes.trim() || null,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{initial ? 'Edit Application' : 'New Application'}</Text>

      <Text style={styles.label}>Company *</Text>
      <TextInput
        style={styles.input}
        value={company}
        onChangeText={setCompany}
        placeholder="e.g. Google"
        placeholderTextColor={colors.textDisabled}
        accessibilityLabel="Company name"
      />

      <Text style={styles.label}>Role *</Text>
      <TextInput
        style={styles.input}
        value={role}
        onChangeText={setRole}
        placeholder="e.g. Software Engineer"
        placeholderTextColor={colors.textDisabled}
        accessibilityLabel="Job role"
      />

      <Text style={styles.label}>Date Applied *</Text>
      <TextInput
        style={styles.input}
        value={dateApplied}
        onChangeText={setDateApplied}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textDisabled}
        accessibilityLabel="Date applied, format YYYY-MM-DD"
      />

      <Text style={styles.label}>Status *</Text>
      <View style={styles.chipRow}>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, status === s && styles.chipSelected]}
            onPress={() => setStatus(s)}
            accessibilityRole="radio"
            accessibilityState={{ checked: status === s }}
            accessibilityLabel={`Status: ${s}`}
          >
            <Text style={[styles.chipText, status === s && styles.chipTextSelected]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Category *</Text>
      {categories.length === 0 ? (
        <Text style={styles.noCats}>No categories yet — create one in the Categories tab first.</Text>
      ) : (
        <View style={styles.chipRow}>
          {categories.map((cat) => {
            const selected = categoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, { borderColor: cat.color }, selected && { backgroundColor: cat.color }]}
                onPress={() => setCategoryId(cat.id)}
              >
                <View style={styles.catChipInner}>
                  {!selected && <View style={[styles.catDot, { backgroundColor: cat.color }]} />}
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{cat.name}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any additional details..."
        placeholderTextColor={colors.textDisabled}
        multiline
        numberOfLines={3}
        accessibilityLabel="Notes, optional"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>{initial ? 'Save Changes' : 'Add Application'}</Text>
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
    textArea:        { minHeight: 72, textAlignVertical: 'top' },
    chipRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
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
    catChipInner:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
    catDot:           { width: 8, height: 8, borderRadius: 4 },
    noCats:           { fontSize: 13, color: '#dc2626', fontStyle: 'italic', marginTop: 6 },
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
