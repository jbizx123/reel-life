import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { Copy, Download, ChevronLeft } from 'lucide-react-native';
import Svg, { Path, G, Rect, Circle } from 'react-native-svg';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';

// TikTok logo
function TikTokLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
      <Path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
    </Svg>
  );
}

// Instagram logo
function InstagramLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
      <Path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </Svg>
  );
}

// Snapchat logo
function SnapchatLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#000">
      <Path d="M12.166.006c.12-.006.24-.006.36 0 1.44.048 5.04.6 6.72 4.2.48 1.02.36 2.76.276 4.02l-.012.18c-.006.072-.006.138-.012.204.12.066.3.126.54.126.3 0 .6-.096.84-.276.12-.09.252-.132.384-.132.264 0 .516.18.576.444.072.33-.12.636-.576.876-.054.03-.12.054-.192.078-.42.138-1.02.336-1.176.756-.03.084-.024.174.018.27.42.9 1.8 2.4 3.9 2.76.18.03.312.186.3.366-.006.054-.024.108-.054.156-.33.54-1.2.93-2.64 1.188-.054.012-.108.054-.132.108-.03.066-.024.144.012.228.09.21.27.576.27.9 0 .42-.21.636-.48.636-.12 0-.252-.036-.39-.108-.42-.21-.84-.318-1.284-.318-.21 0-.426.024-.648.072-.54.12-1.02.45-1.56.822-.9.612-1.92 1.308-3.48 1.308-.06 0-.12 0-.18-.006-.06.006-.12.006-.18.006-1.56 0-2.58-.696-3.48-1.308-.54-.372-1.02-.702-1.56-.822-.222-.048-.438-.072-.648-.072-.444 0-.864.108-1.284.318-.138.072-.27.108-.39.108-.27 0-.48-.216-.48-.636 0-.324.18-.69.27-.9.036-.084.042-.162.012-.228-.024-.054-.078-.096-.132-.108-1.44-.258-2.31-.648-2.64-1.188-.03-.048-.048-.102-.054-.156-.012-.18.12-.336.3-.366 2.1-.36 3.48-1.86 3.9-2.76.042-.096.048-.186.018-.27-.156-.42-.756-.618-1.176-.756-.072-.024-.138-.048-.192-.078-.456-.24-.648-.546-.576-.876.06-.264.312-.444.576-.444.132 0 .264.042.384.132.24.18.54.276.84.276.24 0 .42-.06.54-.126-.006-.066-.006-.132-.012-.204l-.012-.18C5.454 4.806 5.334 3.066 5.814 2.046 7.494.606 11.094.054 12.166.006z" />
    </Svg>
  );
}

// Facebook logo
function FacebookLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
      <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </Svg>
  );
}

export default function ShareScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { project_id, video_url } = useLocalSearchParams<{ project_id: string; video_url?: string }>();

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const videoUrl = video_url ?? '';
  const shareMessage = `Watch my life trailer! ${videoUrl}`;

  const handlePlatformShare = async (platform: string) => {
    console.log('[Share] Platform share pressed', platform);
    try {
      await Share.share({
        message: shareMessage,
        url: videoUrl,
      });
    } catch (e) {
      console.log('[Share] Share error', platform, e);
    }
  };

  const handleCopyLink = async () => {
    console.log('[Share] Copy link pressed');
    // Clipboard not available without expo-clipboard, use Share as fallback
    try {
      await Share.share({ message: videoUrl });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.log('[Share] Copy link error', e);
    }
  };

  const handleSaveToCameraRoll = async () => {
    console.log('[Share] Save to camera roll pressed');
    if (!videoUrl) {
      Alert.alert('Not available', 'Video URL is not available.');
      return;
    }
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save to your photo library.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(videoUrl);
      console.log('[Share] Video saved to camera roll');
      Alert.alert('Saved!', 'Your trailer has been saved to your camera roll.');
    } catch (e) {
      console.log('[Share] Save error', e);
      Alert.alert('Error', 'Could not save video. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const platforms = [
    {
      id: 'tiktok',
      label: 'TikTok',
      bg: '#000000',
      logo: <TikTokLogo size={22} />,
    },
    {
      id: 'instagram',
      label: 'Instagram',
      bg: '#C13584',
      logo: <InstagramLogo size={22} />,
    },
    {
      id: 'snapchat',
      label: 'Snapchat',
      bg: '#FFFC00',
      logo: <SnapchatLogo size={22} />,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      bg: '#1877F2',
      logo: <FacebookLogo size={22} />,
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable
          onPress={() => {
            console.log('[Share] Back pressed');
            router.back();
          }}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={COLORS.text} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Share Your Trailer</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Thumbnail placeholder */}
        <View style={styles.thumbnailContainer}>
          <View style={styles.thumbnail}>
            <Text style={styles.thumbnailText}>Your Trailer</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>SHARE TO</Text>

        {/* Platform grid */}
        <View style={styles.platformGrid}>
          {platforms.map(platform => (
            <AnimatedPressable
              key={platform.id}
              onPress={() => handlePlatformShare(platform.id)}
              style={[styles.platformBtn, { backgroundColor: platform.bg }]}
            >
              {platform.logo}
              <Text
                style={[
                  styles.platformLabel,
                  platform.id === 'snapchat' && { color: '#000' },
                ]}
              >
                {platform.label}
              </Text>
            </AnimatedPressable>
          ))}
        </View>

        {/* Utility buttons */}
        <View style={styles.utilityRow}>
          <AnimatedPressable onPress={handleCopyLink} style={styles.utilityBtn}>
            <Copy size={18} color={COLORS.text} />
            <Text style={styles.utilityBtnText}>{copied ? 'Copied!' : 'Copy Link'}</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={handleSaveToCameraRoll}
            disabled={saving}
            style={styles.utilityBtn}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.text} size="small" />
            ) : (
              <Download size={18} color={COLORS.text} />
            )}
            <Text style={styles.utilityBtnText}>Save to Camera Roll</Text>
          </AnimatedPressable>
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  thumbnail: {
    width: 200,
    height: 112,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  platformBtn: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  platformLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  utilityRow: {
    gap: 10,
  },
  utilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  utilityBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});
