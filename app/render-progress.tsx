import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '@/utils/supabaseDb';
import { COLORS } from '@/constants/Colors';
import type { RenderJob, Photo } from '@/types';

const SUPABASE_STORAGE_URL = 'https://jiqxzqxpannhxazlodbr.supabase.co/storage/v1/object/public/photos';

const STATUS_MESSAGES = [
  'Writing your script...',
  'Recording narration...',
  'Composing your score...',
  'Editing your trailer...',
  'Adding final touches...',
];

function CircularProgress({ progress }: { progress: number }) {
  const size = 180;
  const strokeWidth = 8;

  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const progressText = Math.round(progress).toString();

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: COLORS.surfaceSecondary,
        }}
      />
      {/* Progress arc using border trick */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: COLORS.primary,
          borderTopColor: progress > 25 ? COLORS.primary : 'transparent',
          borderRightColor: progress > 50 ? COLORS.primary : 'transparent',
          borderBottomColor: progress > 75 ? COLORS.primary : 'transparent',
          borderLeftColor: progress > 0 ? COLORS.primary : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      <Text style={styles.progressPercent}>{progressText}</Text>
      <Text style={styles.progressPercentSymbol}>%</Text>
    </View>
  );
}

export default function RenderProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { project_id, type: typeParam } = useLocalSearchParams<{ project_id: string; type?: string }>();

  // Default to free_trailer if no type param provided
  const renderType = typeParam ?? 'free_trailer';

  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const messageOpacity = useRef(new Animated.Value(1)).current;
  const filmStripAnim = useRef(new Animated.Value(0)).current;

  // Cycle status messages
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(messageOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(messageOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setMessageIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messageOpacity]);

  // Film strip scroll animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(filmStripAnim, {
        toValue: -200,
        duration: 8000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [filmStripAnim]);

  // Load photos for film strip
  useEffect(() => {
    if (!project_id) return;
    const loadPhotos = async () => {
      try {
        const { data } = await db
          .from('photos')
          .select('*')
          .eq('project_id', project_id)
          .order('position', { ascending: true })
          .limit(10);
        if (data) setPhotos(data as Photo[]);
      } catch (e) {
        console.log('[RenderProgress] Error loading photos', e);
      }
    };
    loadPhotos();
  }, [project_id]);

  // Poll render job
  useEffect(() => {
    if (!project_id) return;

    const poll = async () => {
      try {
        console.log('[RenderProgress] Polling render job for project', project_id, 'type', renderType);
        const { data, error: dbError } = await db
          .from('render_jobs')
          .select('*')
          .eq('project_id', project_id)
          .eq('type', renderType)
          .order('created_at', { ascending: false })
          .limit(1);

        if (dbError) {
          console.log('[RenderProgress] Poll error', dbError.message);
          return;
        }

        if (data && data.length > 0) {
          const job = data[0] as RenderJob;
          console.log('[RenderProgress] Job status:', job.status, 'progress:', job.progress);
          setRenderJob(job);

          if (job.status === 'completed' && job.progress >= 100) {
            if (renderType === 'poster') {
              console.log('[RenderProgress] Poster render complete, navigating to poster');
              router.replace({ pathname: '/poster', params: { project_id } });
            } else {
              console.log('[RenderProgress] Render complete, navigating to trailer');
              router.replace({ pathname: '/trailer', params: { project_id } });
            }
          } else if (job.status === 'failed') {
            setError('Rendering failed. ' + (job.error_message ?? 'Please try again.'));
          }
        }
      } catch (e) {
        console.log('[RenderProgress] Poll exception', e);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [project_id, renderType, router]);

  const progress = renderJob?.progress ?? 0;
  const currentMessage = STATUS_MESSAGES[messageIndex];

  const headingText = renderType === 'poster' ? 'Creating Your Poster' : 'Creating Your Trailer';
  const subheadingText = renderType === 'poster'
    ? 'Designing your cinematic movie poster'
    : 'Sit back while we craft your story';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1A0505', COLORS.background, COLORS.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        {/* Header */}
        <Text style={styles.heading}>{headingText}</Text>
        <Text style={styles.subheading}>{subheadingText}</Text>

        {/* Circular progress */}
        <View style={styles.progressContainer}>
          <CircularProgress progress={progress} />
        </View>

        {/* Status message */}
        <Animated.Text style={[styles.statusMessage, { opacity: messageOpacity }]}>
          {currentMessage}
        </Animated.Text>

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Film strip */}
        {photos.length > 0 && (
          <View style={styles.filmStripContainer}>
            <View style={styles.filmStripPerf} />
            <Animated.View
              style={[
                styles.filmStrip,
                { transform: [{ translateX: filmStripAnim }] },
              ]}
            >
              {[...photos, ...photos, ...photos].map((photo, index) => {
                const photoUrl = photo.storage_key
                  ? `${SUPABASE_STORAGE_URL}/${photo.storage_key}`
                  : null;
                return (
                  <View key={`${photo.id}-${index}`} style={styles.filmFrame}>
                    {photoUrl ? (
                      <Image
                        source={{ uri: photoUrl }}
                        style={styles.filmFrameImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.filmFrameInner} />
                    )}
                  </View>
                );
              })}
            </Animated.View>
            <View style={styles.filmStripPerf} />
          </View>
        )}

        {/* Tip */}
        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>DID YOU KNOW</Text>
          <Text style={styles.tipText}>
            Your trailer will be narrated with a cinematic voiceover and scored with original music.
          </Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressPercent: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -2,
  },
  progressPercentSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: -8,
  },
  statusMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 0.2,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  filmStripContainer: {
    width: '100%',
    overflow: 'hidden',
    marginBottom: 32,
  },
  filmStripPerf: {
    height: 8,
    backgroundColor: COLORS.surfaceSecondary,
  },
  filmStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 4,
  },
  filmFrame: {
    width: 60,
    height: 44,
    marginHorizontal: 2,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filmFrameImage: {
    width: '100%',
    height: '100%',
  },
  filmFrameInner: {
    width: 52,
    height: 36,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 1,
  },
  tipCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accentMuted,
    width: '100%',
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
