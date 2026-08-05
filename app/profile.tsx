import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Film, LogOut, ChevronLeft, User } from 'lucide-react-native';
import { db } from '@/utils/supabaseDb';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import Constants from 'expo-constants';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [filmCount, setFilmCount] = useState<number | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadCount = async () => {
      try {
        const { count } = await db
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setFilmCount(count ?? 0);
      } catch (e) {
        console.log('[Profile] Error loading film count', e);
      }
    };
    loadCount();
  }, [user]);

  const handleSignOut = async () => {
    console.log('[Profile] Sign out pressed');
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/auth');
    } catch (e) {
      console.log('[Profile] Sign out error', e);
    } finally {
      setSigningOut(false);
    }
  };

  const userName = (user?.user_metadata?.full_name as string | undefined) ?? '';
  const userEmail = user?.email ?? '';
  const initials = userName
    ? userName.trim().split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
    : userEmail[0]?.toUpperCase() ?? 'U';

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable
          onPress={() => {
            console.log('[Profile] Back pressed');
            router.back();
          }}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={COLORS.text} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar & info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{initials}</Text>
          </View>
          {userName ? (
            <Text style={styles.displayName}>{userName}</Text>
          ) : null}
          <Text style={styles.emailText}>{userEmail}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Film size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>
              {filmCount === null ? '—' : filmCount.toString()}
            </Text>
            <Text style={styles.statLabel}>My Films</Text>
          </View>
        </View>

        {/* Settings section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>

          <View style={styles.settingsCard}>
            <View style={styles.settingsRow}>
              <User size={18} color={COLORS.textSecondary} />
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsRowLabel}>Email</Text>
                <Text style={styles.settingsRowValue} numberOfLines={1}>{userEmail}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APP</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingsRow}>
              <Film size={18} color={COLORS.textSecondary} />
              <View style={styles.settingsRowContent}>
                <Text style={styles.settingsRowLabel}>Version</Text>
                <Text style={styles.settingsRowValue}>{appVersion}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <AnimatedPressable
          onPress={handleSignOut}
          disabled={signingOut}
          style={styles.signOutBtn}
        >
          {signingOut ? (
            <ActivityIndicator color={COLORS.danger} size="small" />
          ) : (
            <>
              <LogOut size={18} color={COLORS.danger} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  emailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsRowContent: {
    flex: 1,
  },
  settingsRowLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  settingsRowValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(231,76,60,0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.2)',
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
