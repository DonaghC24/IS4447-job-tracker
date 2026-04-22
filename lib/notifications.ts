// notifications utility - manages scheduling and cancelling daily reminders
// settings (enabled, hour, minute) are persisted in async storage
// on android a notification channel is created as required by the platform

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// async storage keys for persisting notification settings
const DAILY_ID_KEY   = 'notif_daily_id';
const ENABLED_KEY    = 'notif_enabled';
const HOUR_KEY       = 'notif_hour';
const MINUTE_KEY     = 'notif_minute';

export type NotifSettings = {
  enabled: boolean;
  hour:    number;
  minute:  number;
};

// default to disabled with an 8pm reminder time
export const DEFAULT_SETTINGS: NotifSettings = { enabled: false, hour: 20, minute: 0 };

// request notification permissions - creates an android channel if needed
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

// save notification settings to async storage
export async function saveSettings(s: NotifSettings): Promise<void> {
  await AsyncStorage.multiSet([
    [ENABLED_KEY, String(s.enabled)],
    [HOUR_KEY,    String(s.hour)],
    [MINUTE_KEY,  String(s.minute)],
  ]);
}

// load notification settings from async storage, falling back to defaults
export async function loadSettings(): Promise<NotifSettings> {
  const pairs = await AsyncStorage.multiGet([ENABLED_KEY, HOUR_KEY, MINUTE_KEY]);
  const map   = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
  return {
    enabled: map[ENABLED_KEY] === 'true',
    hour:    map[HOUR_KEY]    != null ? parseInt(map[HOUR_KEY]!, 10)    : DEFAULT_SETTINGS.hour,
    minute:  map[MINUTE_KEY]  != null ? parseInt(map[MINUTE_KEY]!, 10)  : DEFAULT_SETTINGS.minute,
  };
}

// cancel any existing reminder then schedule a new daily notification at the given time
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

  // store the notification id so we can cancel it later
  await AsyncStorage.setItem(DAILY_ID_KEY, id);
}

// cancel the currently scheduled daily reminder if one exists
export async function cancelDailyReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(DAILY_ID_KEY);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(DAILY_ID_KEY);
  }
}

// save settings and either schedule or cancel the reminder based on the enabled flag
export async function applySettings(s: NotifSettings): Promise<void> {
  await saveSettings(s);
  if (s.enabled) {
    await scheduleDailyReminder(s.hour, s.minute);
  } else {
    await cancelDailyReminder();
  }
}