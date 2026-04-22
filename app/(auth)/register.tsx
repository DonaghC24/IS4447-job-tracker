// register screen - allows new users to create an account
// validates input before creating the user in the local sqlite database
// automatically logs the user in after successful registration

import { useAuth } from '@/context/AuthContext';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';
import { createUser, getUserByUsername } from '@/db/queries';
import { generateSalt, hashPassword, saveSession } from '@/lib/auth';
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

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { colors } = useAppTheme();
  // regenerate styles whenever the theme changes
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // local state for the three form fields and loading indicator
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleRegister() {
    const u = username.trim();
    // validate all fields before proceeding
    if (!u || !password || !confirm) { Alert.alert('Validation', 'All fields are required.'); return; }
    if (u.length < 3)                { Alert.alert('Validation', 'Username must be at least 3 characters.'); return; }
    if (password.length < 6)         { Alert.alert('Validation', 'Password must be at least 6 characters.'); return; }
    if (password !== confirm)        { Alert.alert('Validation', 'Passwords do not match.'); return; }

    setLoading(true);
    try {
      // generate a unique salt and hash the password before storing
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      // insert the new user into the local sqlite database
      const result = createUser({ username: u, passwordHash, salt, createdAt: new Date().toISOString() });
      if (!result.success) { Alert.alert('Register failed', result.error ?? 'Could not create account.'); return; }
      // fetch the newly created user to get their id
      const user = getUserByUsername(u);
      if (!user) throw new Error('User not found after creation.');
      // save session locally and update global auth state
      await saveSession(user.id);
      setUser(user);
      // redirect to the main app
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register to start tracking applications</Text>

        {/* username input - minimum 3 characters */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input} value={username} onChangeText={setUsername}
          autoCapitalize="none" autoCorrect={false}
          accessibilityLabel="Username" placeholder="At least 3 characters"
          placeholderTextColor={colors.textDisabled}
        />

        {/* password input - minimum 6 characters */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input} value={password} onChangeText={setPassword}
          secureTextEntry accessibilityLabel="Password" placeholder="At least 6 characters"
          placeholderTextColor={colors.textDisabled}
        />

        {/* confirm password - must match the password field */}
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input} value={confirm} onChangeText={setConfirm}
          secureTextEntry accessibilityLabel="Confirm password" placeholder="Re-enter password"
          placeholderTextColor={colors.textDisabled}
        />

        {/* submit button - disabled and shows spinner while loading */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRegister} disabled={loading}
          accessibilityRole="button" accessibilityLabel="Create account"
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        {/* link back to login screen for existing users */}
        <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back to login">
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// styles defined as a function so they respond to theme colour changes
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