import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAppTheme, type AppColors } from '@/context/ThemeContext';

type Props = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  message: string;
  subMessage?: string;
};

export default function EmptyState({ icon, message, subMessage }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={subMessage ? `${message}. ${subMessage}` : message}
    >
      <FontAwesome name={icon} size={52} color={colors.borderLight} style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
      {subMessage ? <Text style={styles.sub}>{subMessage}</Text> : null}
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingTop: 60,
      paddingBottom: 40,
    },
    icon:    { marginBottom: 18 },
    message: { fontSize: 16, fontWeight: '600', color: c.textMuted, textAlign: 'center', marginBottom: 6 },
    sub:     { fontSize: 13, color: c.textDisabled, textAlign: 'center', lineHeight: 19 },
  });
}
