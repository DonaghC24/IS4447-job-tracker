// layout for the auth screens (login and register)
// uses a stack navigator so users can move between screens
// header is hidden since we have our own custom header design

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    // stack navigator wraps the auth screens
    <Stack screenOptions={{ headerShown: false }}>
      {/* define the two auth screens available in this stack */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}