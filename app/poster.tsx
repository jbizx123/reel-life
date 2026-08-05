import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { Share } from 'react-native';
import { Download, Share2, ChevronLeft } from 'lucide-react-native';
import { db } from '@/utils/supabaseDb';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import type { RenderJob, Project } from '@/types';
import type { ImageSourcePropType } from 'react-native';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function PosterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { project_id } = useLocalSearchParams<{ project_id: string }>();

  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!project_id) return;
    const load = async () => {
      console.log('[Poster] Loading poster data for project', project_id);
      try {
        const [jobResult, projectResult] = await Promise.all([
          db
            .from('render_jobs')
            .select('*')
            .eq('project_id', project_id)
            .eq('type', 'poster')
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
          setRenderJob(jobResult.data[0] as RenderJob);
        }
        if (projectResult.data) {
          setProject(projectResult.data as Project);
        }
      } catch (e) {
        console.log('[Poster] Exception loading poster', e);
        setError('Could not load your poster.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [project_id]);

  const handleDownload = async () => {
    console.log('[Poster] Download poster pressed');
    if (!renderJob?.output_url) {
      Alert.alert('Not available', 'Poster is not ready yet.');
      return;
    }
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to save to your photo library.');
        setSaving(false);
        return;
      }
      await MediaLibrary.saveToLibraryAsync(renderJob.output_url);
      console.log('[Poster] Poster saved to camera roll');
      Alert.alert('Saved!', 'Your poster has been saved to your photo library.');
    } catch (e) {
      console.log('[Poster] Error saving poster', e);
      Alert.alert('Error', 'Could not save poster. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    console.log('[Poster] Share poster pressed');
    if (!renderJob?.output_url) return;
    try {
      await Share.share({
        message: 'Check out my movie poster!',
        url: renderJob.output_url,
      });
    } catch (e) {
      console.log('[Poster] Share error', e);
    }
  };

  const posterUrl = renderJob?.output_url ?? '';
  const movieTitle = project?.answer_movie_title || project?.title || 'My Film';
  const genreDisplay = project?.genre
    ? project.genre.charAt(0).toUpperCase() + project.genre.slice(1)
    : 'Drama';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Back button */}
      <AnimatedPressable
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => {
          console.log('[Poster] Back pressed');
          router.back();
        }}
        accessibilityLabel="Go back"
      >
        <ChevronLeft size={24} color={COLORS.text} />
      </AnimatedPressable>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading your poster...</Text>
        </View>
      ) : (
        <>
          {/* Poster preview */}
          <View style={styles.posterContainer}>
            {posterUrl ? (
              <Image
                source={resolveImageSource(posterUrl)}
                style={styles.posterImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.posterPlaceholder}>
                <LinearGradient
                  colors={['#1A0A0A', COLORS.surface]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.posterPlaceholderTitle}>{movieTitle}</Text>
                <Text style={styles.posterPlaceholderGenre}>{genreDisplay}</Text>
                <Text style={styles.posterPlaceholderSub}>Poster not available yet</Text>
              </View>
            )}

            {/* Watermark if not purchased */}
            {!posterUrl && (
              <View style={styles.watermark}>
                <Text style={styles.watermarkText}>PREVIEW</Text>
              </View>
            )}
          </View>

          {/* Info & actions */}
          <View style={[styles.infoSection, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.movieTitle} numberOfLines={2}>{movieTitle}</Text>
            <Text style={styles.genreText}>{genreDisplay}</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actionRow}>
              <AnimatedPressable
                onPress={handleDownload}
                disabled={saving || !posterUrl}
                style={[styles.actionBtn, styles.actionBtnPrimary]}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Download size={18} color="#fff" />
                    <Text style={styles.actionBtnPrimaryText}>Download Poster</Text>
                  </>
                )}
              </AnimatedPressable>

              <AnimatedPressable
                onPress={handleShare}
                disabled={!posterUrl}
                style={styles.actionBtnSecondary}
              >
                <Share2 size={18} color={COLORS.text} />
                <Text style={styles.actionBtnSecondaryText}>Share</Text>
              </AnimatedPressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  posterContainer: {
    width: '100%',
    aspectRatio: 2 / 3,
    position: 'relative',
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  posterPlaceholderTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  posterPlaceholderGenre: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  posterPlaceholderSub: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  watermark: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  watermarkText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  infoSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  movieTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  genreText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionBtnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnSecondaryText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
