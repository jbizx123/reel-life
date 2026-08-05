import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '@/constants/Colors';

type Status = 'draft' | 'uploading' | 'processing' | 'ready' | 'failed';

interface StatusBadgeProps {
  status: Status;
}

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  draft: { label: 'Draft', bg: 'rgba(90,90,90,0.2)', text: '#9E9E9E', dot: '#9E9E9E' },
  uploading: { label: 'Uploading', bg: 'rgba(41,128,185,0.2)', text: '#3498DB', dot: '#3498DB' },
  processing: { label: 'Processing', bg: 'rgba(243,156,18,0.2)', text: '#F39C12', dot: '#F39C12' },
  ready: { label: 'Ready', bg: 'rgba(39,174,96,0.2)', text: '#27AE60', dot: '#27AE60' },
  failed: { label: 'Failed', bg: 'rgba(231,76,60,0.2)', text: '#E74C3C', dot: '#E74C3C' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'processing' || status === 'uploading') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => { loop.stop(); };
    }
    return undefined;
  }, [status, pulseAnim]);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Animated.View
        style={[styles.dot, { backgroundColor: config.dot, opacity: pulseAnim }]}
      />
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
