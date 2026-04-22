import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Category } from '@/db/schema';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';

export type FilterState = {
  searchText: string;
  fromDate: string;
  toDate: string;
  selectedCategoryIds: number[];
};

type Props = {
  filters: FilterState;
  categories: Category[];
  onChange: (filters: FilterState) => void;
  onClear: () => void;
};

export default function FilterBar({ filters, categories, onChange, onClear }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  const hasActive =
    !!filters.searchText ||
    !!filters.fromDate ||
    !!filters.toDate ||
    filters.selectedCategoryIds.length > 0;

  function set(patch: Partial<FilterState>) {
    onChange({ ...filters, ...patch });
  }

  function toggleCategory(id: number) {
    const ids = filters.selectedCategoryIds;
    set({
      selectedCategoryIds: ids.includes(id) ? ids.filter((c) => c !== id) : [...ids, id],
    });
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <FontAwesome name="search" size={13} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={filters.searchText}
            onChangeText={(t) => set({ searchText: t })}
            placeholder="Search company, role, notes…"
            placeholderTextColor={colors.textDisabled}
            returnKeyType="search"
          />
          {!!filters.searchText && (
            <TouchableOpacity onPress={() => set({ searchText: '' })}>
              <FontAwesome name="times-circle" size={14} color={colors.textDisabled} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, hasActive && styles.filterBtnActive]}
          onPress={() => setOpen((v) => !v)}
        >
          <FontAwesome name="sliders" size={14} color={hasActive ? '#fff' : colors.textSecondary} />
          {hasActive && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {[filters.fromDate, filters.toDate, ...filters.selectedCategoryIds].filter(Boolean).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {open && (
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Date Range</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateHint}>From</Text>
              <TextInput
                style={styles.dateInput}
                value={filters.fromDate}
                onChangeText={(t) => set({ fromDate: t })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textDisabled}
              />
            </View>
            <Text style={styles.dateSep}>→</Text>
            <View style={styles.dateField}>
              <Text style={styles.dateHint}>To</Text>
              <TextInput
                style={styles.dateInput}
                value={filters.toDate}
                onChangeText={(t) => set({ toDate: t })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textDisabled}
              />
            </View>
          </View>

          <Text style={styles.panelLabel}>Category</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, filters.selectedCategoryIds.length === 0 && styles.chipActive]}
              onPress={() => set({ selectedCategoryIds: [] })}
            >
              <Text style={[styles.chipText, filters.selectedCategoryIds.length === 0 && styles.chipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const active = filters.selectedCategoryIds.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, { borderColor: cat.color }, active && { backgroundColor: cat.color }]}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {hasActive && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => { onClear(); setOpen(false); }}>
              <Text style={styles.clearText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    wrapper: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border },

    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.background,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
      gap: 6,
    },
    searchIcon:  { marginRight: 2 },
    searchInput: { flex: 1, fontSize: 14, color: c.text, padding: 0 },

    filterBtn: {
      width: 38,
      height: 38,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.borderLight,
      backgroundColor: c.chipBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: '#dc2626',
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 1,
      minWidth: 16,
      alignItems: 'center',
    },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

    panel:      { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
    panelLabel: { fontSize: 12, fontWeight: '700', color: c.textSecondary, marginTop: 4 },

    dateRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateField: { flex: 1 },
    dateHint:  { fontSize: 10, color: c.textDisabled, marginBottom: 2 },
    dateInput: {
      borderWidth: 1,
      borderColor: c.borderLight,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      fontSize: 13,
      color: c.text,
      backgroundColor: c.inputBg,
    },
    dateSep: { fontSize: 14, color: c.textDisabled, marginTop: 14 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.borderLight,
      backgroundColor: c.chipBg,
    },
    chipActive:     { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    chipText:       { fontSize: 12, color: c.textSecondary },
    chipTextActive: { color: '#fff', fontWeight: '600' },

    clearBtn: {
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#dc2626',
    },
    clearText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },
  });
}
