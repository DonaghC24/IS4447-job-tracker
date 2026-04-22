import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';
import { deleteUser } from '@/db/queries';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { mode, colors, toggleTheme } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [deleting, setDeleting] = useState(false);

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  function handleDeletePress() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account. Your application data will remain. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]
    );
  }

  async function confirmDelete() {
    if (!user) return;
    setDeleting(true);
    try { deleteUser(user.id); await logout(); router.replace('/(auth)/login'); }
    finally { setDeleting(false); }
  }

  if (!user) return null;

  const joined = new Date(user.createdAt).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.joined}>Member since {joined}</Text>

        <View style={styles.divider} />

        {/* Theme toggle */}
        <View style={styles.row}>
          <FontAwesome
            name={mode === 'dark' ? 'moon-o' : 'sun-o'}
            size={18}
            color={colors.textSecondary}
            style={styles.rowIcon}
          />
          <Text style={styles.rowLabel}>{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: '#2563eb' }}
            thumbColor="#fff"
            accessibilityLabel="Toggle dark mode"
          />
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.btnDisabled]}
          onPress={handleDeletePress}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
        >
          {deleting
            ? <ActivityIndicator color="#dc2626" />
            : <Text style={styles.deleteText}>Delete Account</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    safe:       { flex: 1, backgroundColor: c.background },
    container:  { flex: 1, alignItems: 'center', paddingTop: 48, paddingHorizontal: 28 },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    avatarText: { fontSize: 34, fontWeight: '800', color: '#fff' },
    username:   { fontSize: 22, fontWeight: '700', color: c.text },
    joined:     { fontSize: 13, color: c.textMuted, marginTop: 4, marginBottom: 32 },
    divider:    { width: '100%', height: 1, backgroundColor: c.border, marginBottom: 20 },
    row: {
      width: '100%', flexDirection: 'row', alignItems: 'center',
      paddingVertical: 4, marginBottom: 20,
    },
    rowIcon:  { marginRight: 12 },
    rowLabel: { flex: 1, fontSize: 15, color: c.text, fontWeight: '500' },
    logoutBtn: {
      width: '100%', paddingVertical: 14, borderRadius: 10,
      backgroundColor: c.surface, borderWidth: 1.5, borderColor: '#2563eb',
      alignItems: 'center', marginBottom: 12,
    },
    logoutText: { color: '#2563eb', fontWeight: '700', fontSize: 15 },
    deleteBtn: {
      width: '100%', paddingVertical: 14, borderRadius: 10,
      backgroundColor: c.surface, borderWidth: 1.5, borderColor: '#dc2626',
      alignItems: 'center',
    },
    btnDisabled: { opacity: 0.5 },
    deleteText:  { color: '#dc2626', fontWeight: '700', fontSize: 15 },
  });
}
