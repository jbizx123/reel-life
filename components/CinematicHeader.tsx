import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';

interface CinematicHeaderProps {
  title?: string;
  showBack?: boolean;
  stepCurrent?: number;
  stepTotal?: number;
  rightElement?: React.ReactNode;
}

export function CinematicHeader({
  title,
  showBack = true,
  stepCurrent,
  stepTotal,
  rightElement,
}: CinematicHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const stepText = stepCurrent && stepTotal ? `Step ${stepCurrent} of ${stepTotal}` : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={() => {
              console.log('[Nav] Back button pressed');
              router.back();
            }}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <View style={styles.center}>
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <Text style={styles.wordmark}>REEL LIFE</Text>
          )}
          {stepText ? <Text style={styles.step}>{stepText}</Text> : null}
        </View>

        <View style={styles.backBtn}>{rightElement ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 3,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  step: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
