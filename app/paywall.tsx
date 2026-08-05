import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { Film, Image as ImageIcon, Package, X, Check } from 'lucide-react-native';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';

const SUPABASE_URL = 'https://jiqxzqxpannhxazlodbr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcXh6cXhwYW5uaHhhemxvZGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTQwNTYsImV4cCI6MjEwMTQ3MDA1Nn0.SzWrwCRAttWEP30hehpzfiPpHXSHUvWXY_03X4Q8ZvM';

type Tier = 'full_movie' | 'poster' | 'bundle';

interface TierConfig {
  id: Tier;
  title: string;
  price: string;
  features: string[];
  buttonLabel: string;
  buttonStyle: 'primary' | 'accent';
  badge?: string;
  icon: React.ReactNode;
}

const TIERS: TierConfig[] = [
  {
    id: 'full_movie',
    title: 'Full Movie',
    price: '$9.99',
    features: ['2–4 minute uncut version', 'No watermark', 'HD quality'],
    buttonLabel: 'Unlock Full Movie',
    buttonStyle: 'primary',
    icon: <Film size={22} color={COLORS.primary} />,
  },
  {
    id: 'poster',
    title: 'Premium Poster',
    price: '$4.99',
    features: ['Cinematic movie poster', '4K resolution', 'Download & print'],
    buttonLabel: 'Get My Poster',
    buttonStyle: 'accent',
    icon: <ImageIcon size={22} color={COLORS.accent} />,
  },
  {
    id: 'bundle',
    title: 'The Bundle',
    price: '$14.99',
    features: ['Full Movie + Premium Poster', 'Save $4.99', 'Everything included'],
    buttonLabel: 'Get Everything',
    buttonStyle: 'primary',
    badge: 'BEST VALUE',
    icon: <Package size={22} color={COLORS.primary} />,
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { project_id } = useLocalSearchParams<{ project_id: string }>();

  const [loadingTier, setLoadingTier] = useState<Tier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (tier: Tier) => {
    console.log('[Paywall] Purchase pressed', { tier, project_id });
    setLoadingTier(tier);
    setError(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({ project_id, tier }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.log('[Paywall] create-checkout error', response.status, errText);
        throw new Error(`Checkout error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[Paywall] Checkout result', result);

      if (result.demo_mode) {
        console.log('[Paywall] Demo mode — simulating purchase success');
        // Demo mode: start render and navigate
        await fetch(`${SUPABASE_URL}/functions/v1/start-render`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': ANON_KEY,
          },
          body: JSON.stringify({
            project_id,
            type: tier === 'poster' ? 'poster' : 'full_movie',
          }),
        });

        router.replace({ pathname: '/render-progress', params: { project_id } });
      } else if (result.url) {
        console.log('[Paywall] Opening Stripe checkout URL');
        await WebBrowser.openBrowserAsync(result.url);
      }
    } catch (e) {
      console.log('[Paywall] Purchase error', e);
      setError('Purchase failed. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  };

  const handlePhysicalPrint = async () => {
    console.log('[Paywall] Physical print link pressed');
    await WebBrowser.openBrowserAsync('https://reellife.app/print');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Film size={22} color={COLORS.accent} />
          <Text style={styles.headerTitle}>Unlock Your Story</Text>
        </View>
        <AnimatedPressable
          onPress={() => {
            console.log('[Paywall] Close pressed');
            router.back();
          }}
          style={styles.closeBtn}
          accessibilityLabel="Close"
        >
          <X size={20} color={COLORS.textSecondary} />
        </AnimatedPressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Your trailer is just the beginning. Unlock the full cinematic experience.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Tier cards */}
        {TIERS.map(tier => {
          const isLoading = loadingTier === tier.id;
          const isAccent = tier.buttonStyle === 'accent';
          const btnBg = isAccent ? COLORS.accent : COLORS.primary;
          const btnTextColor = isAccent ? '#000' : '#fff';

          return (
            <View
              key={tier.id}
              style={[
                styles.tierCard,
                tier.badge ? styles.tierCardFeatured : null,
              ]}
            >
              {tier.badge && (
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>{tier.badge}</Text>
                </View>
              )}

              <View style={styles.tierTop}>
                <View style={styles.tierIconWrap}>{tier.icon}</View>
                <View style={styles.tierTitleGroup}>
                  <Text style={styles.tierTitle}>{tier.title}</Text>
                  <Text style={styles.tierPrice}>{tier.price}</Text>
                </View>
              </View>

              <View style={styles.tierFeatures}>
                {tier.features.map(feature => (
                  <View key={feature} style={styles.featureRow}>
                    <Check size={14} color={COLORS.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <AnimatedPressable
                onPress={() => handlePurchase(tier.id)}
                disabled={loadingTier !== null}
                style={[styles.tierBtn, { backgroundColor: btnBg }]}
              >
                {isLoading ? (
                  <ActivityIndicator color={btnTextColor} size="small" />
                ) : (
                  <Text style={[styles.tierBtnText, { color: btnTextColor }]}>
                    {tier.buttonLabel}
                  </Text>
                )}
              </AnimatedPressable>
            </View>
          );
        })}

        {/* Physical print */}
        <AnimatedPressable onPress={handlePhysicalPrint} style={styles.printLink}>
          <Text style={styles.printLinkText}>Order a physical print →</Text>
          <Text style={styles.printLinkPrice}>$24.99</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  tierCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
  },
  tierCardFeatured: {
    borderColor: COLORS.accent + '60',
  },
  tierBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  tierTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  tierIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTitleGroup: {
    flex: 1,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  tierPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  tierFeatures: {
    gap: 8,
    marginBottom: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tierBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tierBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  printLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 4,
  },
  printLinkText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  printLinkPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
