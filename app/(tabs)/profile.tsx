// profile screen - user account management and app settings
// handles theme toggling, notification scheduling, csv export, logout and account deletion
// notification time is persisted locally and rescheduled whenever the setting changes

import { useAuth } from '@/context/AuthContext';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';
import { deleteUser } from '@/db/queries';
import { exportApplicationsCsv } from '@/lib/exportCsv';
import {
  applySettings,
  DEFAULT_SETTINGS,
  loadSettings,
  requestPermissions,
  type NotifSettings,
} from '@/lib/notifications';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text, TouchableOpacity,
  View,
} from 'react-native';

// preset reminder times the user can choose from
const TIME_PRESETS = [
  { label: '8 AM',  hour: 8,  minute: 0 },
  { label: '12 PM', hour: 12, minute: 0 },
  { label: '5 PM',  hour: 17, minute: 0 },
  { label: '7 PM',  hour: 19, minute: 0 },
  { label: '9 PM',  hour: 21, minute: 0 },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout }            = useAuth();
  const { mode, colors, toggleTheme } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // loading states for async actions
  const [deleting,  setDeleting]  = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  // notification settings loaded from async storage
  const [notifSettings, setNotifSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);

  // load saved notification settings when the screen mounts
  useEffect(() => {
    loadSettings().then(setNotifSettings);
  }, []);

  // request permissions when enabling notifications, then apply the settings
  async function handleToggleNotif(val: boolean) {
    if (val) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
        return;
      }
    }
    const updated = { ...notifSettings, enabled: val };
    setNotifSettings(updated);
    await applySettings(updated);
  }

  // update the reminder time and reschedule if notifications are enabled
  async function handleSelectTime(hour: number, minute: number) {
    const updated = { ...notifSettings, hour, minute };
    setNotifSettings(updated);
    if (updated.enabled) {
      setSavingNotif(true);
      try { await applySettings(updated); }
      finally { setSavingNotif(false); }
    } else {
      await applySettings(updated);
    }
  }

  // export all applications to a csv file using the share sheet
  async function handleExport() {
    setExporting(true);
    try { await exportApplicationsCsv(); }
    catch (e: any) { Alert.alert('Export Failed', e?.message ?? 'Could not export data.'); }
    finally { setExporting(false); }
  }

  // clear the session and redirect to login
  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  // show a confirmation alert before deleting the account
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

  // delete the user record from sqlite then log out
  async function confirmDelete() {
    if (!user) return;
    setDeleting(true);
    try { deleteUser(user.id); await logout(); router.replace('/(auth)/login'); }
    finally { setDeleting(false); }
  }

  // guard against rendering before user is loaded
  if (!user) return null;

  // format the account creation date for display
  const joined = new Date(user.createdAt).toLocaleDateString('en-IE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // find which preset matches the current notification time
  const selectedPreset = TIME_PRESETS.find(
    p => p.hour === notifSettings.hour && p.minute === notifSettings.minute
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* user avatar using the first letter of their username */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.joined}>Member since {joined}</Text>

        <View style={styles.divider} />

        {/* light/dark mode toggle */}
        <View style={styles.row}>
          <FontAwesome name={mode === 'dark' ? 'moon-o' : 'sun-o'} size={18} color={colors.textSecondary} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: '#2563eb' }}
            thumbColor="#fff"
            accessibilityLabel="Toggle dark mode"
          />
        </View>

        {/* notification settings card */}
        <View style={styles.notifCard}>
          <View style={styles.row}>
            <FontAwesome name="bell" size={16} color={colors.textSecondary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>Daily Reminder</Text>
            {/* show spinner while saving notification settings */}
            {savingNotif && <ActivityIndicator size="small" color="#2563eb" style={{ marginRight: 8 }} />}
            <Switch
              value={notifSettings.enabled}
              onValueChange={handleToggleNotif}
              trackColor={{ false: colors.border, true: '#2563eb' }}
              thumbColor="#fff"
              accessibilityLabel="Toggle daily reminder"
            />
          </View>

          {/* time picker chips - only shown when notifications are enabled */}
          {notifSettings.enabled && (
            <>
              <Text style={styles.timeLabel}>Reminder Time</Text>
              <View style={styles.chipRow}>
                {TIME_PRESETS.map((p) => {
                  const active = notifSettings.hour === p.hour && notifSettings.minute === p.minute;
                  return (
                    <TouchableOpacity
                      key={p.label}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => handleSelectTime(p.hour, p.minute)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`Set reminder to ${p.label}`}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* confirmation text showing the currently selected time */}
              <Text style={styles.notifHint}>
                {selectedPreset
                  ? `Reminder set for ${selectedPreset.label} daily`
                  : `Reminder set for ${notifSettings.hour}:${String(notifSettings.minute).padStart(2,'0')} daily`}
              </Text>
            </>
          )}
        </View>

        {/* csv export button */}
        <TouchableOpacity
          style={[styles.exportBtn, exporting && styles.btnDisabled]}
          onPress={handleExport}
          disabled={exporting}
          accessibilityRole="button"
          accessibilityLabel="Export applications as CSV"
        >
          {exporting ? <ActivityIndicator color="#2563eb" /> : (
            <>
              <FontAwesome name="download" size={14} color="#2563eb" />
              <Text style={styles.exportText}>Export to CSV</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* sign out button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Sign out">
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* delete account button - destructive action with confirmation */}
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.btnDisabled]}
          onPress={handleDeletePress}
          disabled={deleting}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
        >
          {deleting ? <ActivityIndicator color="#dc2626" /> : <Text style={styles.deleteText}>Delete Account</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// styles defined as a function to support light and dark theme colours
function makeStyles(c: AppColors) {
  return StyleSheet.create({
    safe:      { flex: 1, backgroundColor: c.background },
    container: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 28, paddingBottom: 40 },

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
      paddingVertical: 4, marginBottom: 4,
    },
    rowIcon:  { marginRight: 12 },
    rowLabel: { flex: 1, fontSize: 15, color: c.text, fontWeight: '500' },

    notifCard: {
      width: '100%', backgroundColor: c.surface, borderRadius: 10,
      padding: 14, marginBottom: 20,
      borderWidth: 1, borderColor: c.border,
    },
    timeLabel:  { fontSize: 12, fontWeight: '600', color: c.textSecondary, marginTop: 12, marginBottom: 8 },
    chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
      borderWidth: 1.5, borderColor: c.borderLight, backgroundColor: c.chipBg,
    },
    chipActive:     { backgroundColor: '#2563eb', borderColor: '#2563eb' },
    chipText:       { fontSize: 13, color: c.textSecondary },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    notifHint:  { fontSize: 11, color: c.textMuted, marginTop: 10, fontStyle: 'italic' },

    exportBtn: {
      width: '100%', paddingVertical: 14, borderRadius: 10,
      backgroundColor: c.surface, borderWidth: 1.5, borderColor: '#2563eb',
      alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
      gap: 8, marginBottom: 20,
    },
    exportText: { color: '#2563eb', fontWeight: '700', fontSize: 15 },

    logoutBtn: {
      width: '100%', paddingVertical: 14, borderRadius: 10,
      backgroundColor: c.surface, borderWidth: 1.5, borderColor: '#2563eb',
      alignItems: 'center', marginBottom: 12,
    },
    logoutText:  { color: '#2563eb', fontWeight: '700', fontSize: 15 },
    deleteBtn: {
      width: '100%', paddingVertical: 14, borderRadius: 10,
      backgroundColor: c.surface, borderWidth: 1.5, borderColor: '#dc2626',
      alignItems: 'center',
    },
    btnDisabled: { opacity: 0.5 },
    deleteText:  { color: '#dc2626', fontWeight: '700', fontSize: 15 },
  });
}