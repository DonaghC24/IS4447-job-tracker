import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Category } from '@/db/schema';
import EmptyState from '@/components/EmptyState';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';

type Props = {
  categories: Category[];
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
};

export default function CategoryList({ categories, onEdit, onDelete }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (categories.length === 0) {
    return (
      <EmptyState icon="tags" message="No categories yet" subMessage="Tap + to create your first category." />
    );
  }

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      accessibilityLabel="Categories list"
      renderItem={({ item }) => (
        <View style={styles.row} accessible={false}>
          <View
            style={[styles.dot, { backgroundColor: item.color }]}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={`Colour: ${item.color}`}
          />
          <Text style={styles.name} accessible={true} accessibilityRole="text">
            {item.name}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => onEdit(item)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.name} category`}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => onDelete(item)}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name} category`}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    list: { padding: 12, gap: 8 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 10,
      padding: 14,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    dot:        { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
    name:       { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
    actions:    { flexDirection: 'row', gap: 8 },
    editBtn:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#2563eb' },
    editText:   { color: '#2563eb', fontSize: 13, fontWeight: '600' },
    deleteBtn:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6, backgroundColor: c.deleteChipBg },
    deleteText: { color: c.deleteChipText, fontSize: 13, fontWeight: '600' },
  });
}
