// login screen - handles user authentication
// uses theme context so colours update with light/dark mode
// styles are memoized so they only recalculate when the theme changes

import { useAuth } from '@/context/AuthContext';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';
import { getUserByUsername } from '@/db/queries';
import { hashPassword, saveSession } from '@/lib/auth';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { colors } = useAppTheme();
  // regenerate styles whenever the theme changes
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // local state for form fields and loading indicator
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    const u = username.trim();
    // basic validation before hitting the database
    if (!u || !password) { Alert.alert('Validation', 'Username and password are required.'); return; }
    setLoading(true);
    try {
      // look up the user by username in local sqlite database
      const user = getUserByUsername(u);
      if (!user) { Alert.alert('Login failed', 'No account found with that username.'); return; }
      // hash the entered password with the stored salt and compare
      const hash = await hashPassword(password, user.salt);
      if (hash !== user.passwordHash) { Alert.alert('Login failed', 'Incorrect password.'); return; }
      // save session locally and update global auth context
      await saveSession(user.id);
      setUser(user);
      // redirect to main app tabs
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Job Tracker</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* username input with accessibility label for screen readers */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Username"
          placeholder="Enter username"
          placeholderTextColor={colors.textDisabled}
        />

        {/* password input with secure text entry enabled */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password"
          placeholder="Enter password"
          placeholderTextColor={colors.textDisabled}
        />

        {/* sign in button - shows spinner while loading */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        {/* link to register screen for new users */}
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => router.push('/(auth)/register')}
          accessibilityRole="button"
          accessibilityLabel="Create account"
        >
          <Text style={styles.linkText}>No account? Register here</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// styles are defined in a function so they can react to theme colour changes
function makeStyles(c: AppColors) {
  return StyleSheet.create({
    safe:       { flex: 1, backgroundColor: c.background },
    container:  { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
    title:      { fontSize: 30, fontWeight: '800', color: c.text, textAlign: 'center', marginBottom: 4 },
    subtitle:   { fontSize: 15, color: c.textMuted, textAlign: 'center', marginBottom: 32 },
    label:      { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 4, marginTop: 12 },
    input: {
      borderWidth: 1, borderColor: c.borderLight, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 10, fontSize: 15,
      backgroundColor: c.inputBg, color: c.text,
    },
    btn:         { marginTop: 24, backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
    btnDisabled: { opacity: 0.6 },
    btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
    linkBtn:     { marginTop: 20, alignItems: 'center' },
    linkText:    { color: '#2563eb', fontSize: 14 },
  });
}