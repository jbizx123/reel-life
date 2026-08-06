import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Share2, ChevronLeft, Lock } from 'lucide-react-native';
import { db } from '@/utils/supabaseDb';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import type { RenderJob, Project } from '@/types';

export default function TrailerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { project_id } = useLocalSearchParams<{ project_id: string }>();

  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoUrl = renderJob?.output_url ?? '';
  const player = useVideoPlayer(null, p => {
    p.loop = false;
  });

  // Reload player source once videoUrl is available after data fetch
  useEffect(() => {
    if (!videoUrl) return;
    console.log('[Trailer] Setting player source', videoUrl);
    player.replace({ uri: videoUrl });
    player.play();
  }, [videoUrl, player]);

  // Sync isPlaying state from player events
  useEffect(() => {
    const sub = player.addListener('playingChange', ({ isPlaying: playing }) => {
      console.log('[Trailer] playingChange event, isPlaying:', playing);
      setIsPlaying(playing);
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    if (!project_id) return;
    const load = async () => {
      console.log('[Trailer] Loading trailer data for project', project_id);
      try {
        const [jobResult, projectResult] = await Promise.all([
          db
            .from('render_jobs')
            .select('*')
            .eq('project_id', project_id)
            .eq('type', 'free_trailer')
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1),
          db
            .from('projects')
            .select('*')
            .eq('id', project_id)
            .single(),
        ]);

        if (jobResult.data && jobResult.data.length > 0) {
          console.log('[Trailer] Render job loaded', jobResult.data[0].id);
          setRenderJob(jobResult.data[0] as RenderJob);
        }
        if (projectResult.data) {
          setProject(projectResult.data as Project);
        }
        if (jobResult.error) {
          console.log('[Trailer] Error loading render job', jobResult.error.message);
          setError('Could not load your trailer. Please try again.');
        }
      } catch (e) {
        console.log('[Trailer] Exception loading trailer', e);
        setError('Could not load your trailer. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [project_id]);

  const handlePlayPause = () => {
    console.log('[Trailer] Play/pause pressed, isPlaying:', isPlaying);
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleShare = async () => {
    console.log('[Trailer] Share button pressed');
    try {
      await Share.share({
        message: `Watch my life trailer: ${videoUrl}`,
        url: videoUrl,
      });
    } catch (e) {
      console.log('[Trailer] Share error', e);
    }
  };

  const handleUnlock = () => {
    console.log('[Trailer] Unlock Full Movie pressed');
    router.push({ pathname: '/paywall', params: { project_id } });
  };

  const handleShareScreen = () => {
    console.log('[Trailer] Share screen button pressed');
    router.push({ pathname: '/share', params: { project_id, video_url: videoUrl } });
  };

  const movieTitle = project?.answer_movie_title || project?.title || 'My Life Trailer';
  const genreDisplay = project?.genre
    ? project.genre.charAt(0).toUpperCase() + project.genre.slice(1)
    : 'Drama';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => {
          console.log('[Trailer] Back pressed');
          router.back();
        }}
        accessibilityLabel="Go back"
      >
        <ChevronLeft size={24} color={COLORS.text} />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading your trailer...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Couldn't load trailer</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <AnimatedPressable onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <>
          {/* Video player */}
          <View style={styles.videoContainer}>
            {videoUrl ? (
              <VideoView
                player={player}
                style={styles.video}
                contentFit="contain"
                nativeControls={false}
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoPlaceholderText}>Trailer not available yet</Text>
              </View>
            )}

            {/* Watermark */}
            <View style={styles.watermark}>
              <Text style={styles.watermarkText}>FREE TRAILER</Text>
            </View>

            {/* Play/pause overlay */}
            <TouchableOpacity style={styles.playOverlay} onPress={handlePlayPause} activeOpacity={0.8}>
              {!isPlaying && (
                <View style={styles.playBtn}>
                  <Play size={32} color="#fff" fill="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity onPress={handlePlayPause} style={styles.controlBtn}>
              {isPlaying ? (
                <Pause size={22} color={COLORS.text} />
              ) : (
                <Play size={22} color={COLORS.text} />
              )}
            </TouchableOpacity>
          </View>

          {/* Info section */}
          <View style={[styles.infoSection, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.titleRow}>
              <View style={styles.genreTag}>
                <Text style={styles.genreTagText}>{genreDisplay}</Text>
              </View>
            </View>
            <Text style={styles.movieTitle} numberOfLines={2}>{movieTitle}</Text>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <AnimatedPressable onPress={handleShare} style={styles.actionBtn}>
                <Share2 size={18} color={COLORS.text} />
                <Text style={styles.actionBtnText}>Share</Text>
              </AnimatedPressable>
              <AnimatedPressable onPress={handleShareScreen} style={styles.actionBtn}>
                <Share2 size={18} color={COLORS.text} />
                <Text style={styles.actionBtnText}>Platforms</Text>
              </AnimatedPressable>
            </View>

            {/* Unlock section */}
            <AnimatedPressable onPress={handleUnlock} style={styles.unlockCard}>
              <LinearGradient
                colors={[COLORS.accentMuted, 'rgba(212,175,55,0.05)']}
                style={styles.unlockGradient}
              >
                <View style={styles.unlockLeft}>
                  <Lock size={20} color={COLORS.accent} />
                  <View>
                    <Text style={styles.unlockTitle}>Unlock Full Movie</Text>
                    <Text style={styles.unlockSubtitle}>Your story deserves the full cut</Text>
                  </View>
                </View>
                <View style={styles.unlockPriceTag}>
                  <Text style={styles.unlockPrice}>From $9.99</Text>
                </View>
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  retryBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  videoPlaceholderText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  watermark: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  watermarkText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    gap: 12,
  },
  controlBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  genreTag: {
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  genreTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  movieTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 16,
    lineHeight: 30,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  unlockCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  unlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  unlockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  unlockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  unlockSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  unlockPriceTag: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  unlockPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
});
