// tab layout - defines the main bottom navigation tabs for the app
// redirects unauthenticated users to the login screen
// tab bar colour updates automatically based on the current theme

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';

// reusable tab bar icon component using font awesome icons
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { mode } = useAppTheme();
  const { user, loading } = useAuth();

  // wait for auth state to load before rendering anything
  if (loading) return null;
  // redirect to login if no user is logged in
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        // active tab colour comes from the theme constants
        tabBarActiveTintColor: Colors[mode].tint,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      {/* main applications list tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Applications',
          tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
        }}
      />
      {/* categories management tab */}
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <TabBarIcon name="tags" color={color} />,
        }}
      />
      {/* targets and goals tab */}
      <Tabs.Screen
        name="targets"
        options={{
          title: 'Targets',
          tabBarIcon: ({ color }) => <TabBarIcon name="bullseye" color={color} />,
        }}
      />
      {/* insights and charts tab */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
      />
      {/* external api tab showing live job market data */}
      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
        }}
      />
      {/* user profile and settings tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}