import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DAILY_ID_KEY   = 'notif_daily_id';
const ENABLED_KEY    = 'notif_enabled';
const HOUR_KEY       = 'notif_hour';
const MINUTE_KEY     = 'notif_minute';

export type NotifSettings = {
  enabled: boolean;
  hour:    number;
  minute:  number;
};

export const DEFAULT_SETTINGS: NotifSettings = { enabled: false, hour: 20, minute: 0 };

// ── Permissions ───────────────────────────────────────────────────────────────

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('job-reminders', {
      name: 'Job Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Persist settings ──────────────────────────────────────────────────────────

export async function saveSettings(s: NotifSettings): Promise<void> {
  await AsyncStorage.multiSet([
    [ENABLED_KEY, String(s.enabled)],
    [HOUR_KEY,    String(s.hour)],
    [MINUTE_KEY,  String(s.minute)],
  ]);
}

export async function loadSettings(): Promise<NotifSettings> {
  const pairs = await AsyncStorage.multiGet([ENABLED_KEY, HOUR_KEY, MINUTE_KEY]);
  const map   = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
  return {
    enabled: map[ENABLED_KEY] === 'true',
    hour:    map[HOUR_KEY]    != null ? parseInt(map[HOUR_KEY]!, 10)    : DEFAULT_SETTINGS.hour,
    minute:  map[MINUTE_KEY]  != null ? parseInt(map[MINUTE_KEY]!, 10)  : DEFAULT_SETTINGS.minute,
  };
}

// ── Schedule / cancel ─────────────────────────────────────────────────────────

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await cancelDailyReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Job Tracker',
      body:  "Have you logged today's applications? Check your weekly targets.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(DAILY_ID_KEY, id);
}

export async function cancelDailyReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(DAILY_ID_KEY);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(DAILY_ID_KEY);
  }
}

export async function applySettings(s: NotifSettings): Promise<void> {
  await saveSettings(s);
  if (s.enabled) {
    await scheduleDailyReminder(s.hour, s.minute);
  } else {
    await cancelDailyReminder();
  }
}
