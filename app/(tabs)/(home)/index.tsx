import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Film, Plus, User, ChevronRight, Image as ImageIcon } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/supabaseDb';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { StatusBadge } from '@/components/StatusBadge';
import type { Project } from '@/types';

// Skeleton loader
function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonBadge} />
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
    </Animated.View>
  );
}

// Indeterminate shimmer progress bar for processing cards
function IndeterminateBar() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const width = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBar}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
}

// Animated list item
function AnimatedListItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 70, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 70, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string | undefined, email: string | undefined) {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return 'U';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Map of project_id -> render type for processing projects
  const [renderTypes, setRenderTypes] = useState<Record<string, string>>({});

  const loadProjects = useCallback(async () => {
    if (!user) return;
    console.log('[Home] Loading projects for user', user.id);
    try {
      const { data, error: dbError } = await db
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.log('[Home] Error loading projects', dbError.message);
        setError('Could not load your films. Pull to refresh.');
      } else {
        console.log('[Home] Loaded', data?.length ?? 0, 'projects');
        const loaded = (data as Project[]) ?? [];
        setProjects(loaded);
        setError(null);

        // For processing projects, fetch their latest render job type
        const processingIds = loaded
          .filter(p => p.status === 'processing')
          .map(p => p.id);

        if (processingIds.length > 0) {
          const { data: jobs } = await db
            .from('render_jobs')
            .select('project_id, type')
            .in('project_id', processingIds)
            .order('created_at', { ascending: false });

          if (jobs) {
            const typeMap: Record<string, string> = {};
            for (const job of jobs) {
              // Only keep the most recent job per project (already ordered desc)
              if (!typeMap[job.project_id]) {
                typeMap[job.project_id] = job.type;
              }
            }
            setRenderTypes(typeMap);
          }
        }
      }
    } catch (e) {
      console.log('[Home] Exception loading projects', e);
      setError('Could not load your films. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const onRefresh = () => {
    console.log('[Home] Pull to refresh triggered');
    setRefreshing(true);
    loadProjects();
  };

  const handleStartTrailer = () => {
    console.log('[Home] Start My Trailer pressed');
    router.push('/upload');
  };

  const handleProjectPress = (project: Project) => {
    console.log('[Home] Project card pressed', { id: project.id, status: project.status });
    if (project.status === 'ready') {
      router.push({ pathname: '/trailer', params: { project_id: project.id } });
    } else if (project.status === 'processing') {
      const renderType = renderTypes[project.id] ?? 'free_trailer';
      router.push({
        pathname: '/render-progress',
        params: { project_id: project.id, type: renderType },
      });
    } else {
      router.push({ pathname: '/upload', params: { project_id: project.id } });
    }
  };

  const handleProfilePress = () => {
    console.log('[Home] Profile avatar pressed');
    router.push('/profile');
  };

  const handleNewProject = () => {
    console.log('[Home] FAB new project pressed');
    router.push('/upload');
  };

  const handleViewPoster = (project: Project) => {
    console.log('[Home] View Poster pressed', { id: project.id });
    router.push({ pathname: '/poster', params: { project_id: project.id } });
  };

  const userName = user?.user_metadata?.full_name as string | undefined;
  const userEmail = user?.email;
  const initials = getInitials(userName, userEmail);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.wordmark}>REEL LIFE</Text>
        <AnimatedPressable onPress={handleProfilePress} style={styles.avatar} accessibilityLabel="Profile">
          <Text style={styles.avatarText}>{initials}</Text>
        </AnimatedPressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <View style={styles.errorState}>
            <Film size={40} color={COLORS.danger} />
            <Text style={styles.errorTitle}>Couldn't load your films</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <AnimatedPressable onPress={loadProjects} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </AnimatedPressable>
          </View>
        ) : projects.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyState}>
            <LinearGradient
              colors={[COLORS.primaryMuted, 'transparent']}
              style={styles.emptyIconBg}
            >
              <Film size={44} color={COLORS.primary} strokeWidth={1.5} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Direct Your First Trailer</Text>
            <Text style={styles.emptySubtitle}>
              Turn your photos into a cinematic life story — narrated, scored, and edited like a real film.
            </Text>
            <AnimatedPressable onPress={handleStartTrailer} style={styles.ctaBtn}>
              <Text style={styles.ctaBtnText}>Start My Trailer</Text>
            </AnimatedPressable>
          </View>
        ) : (
          <>
            {/* Section heading */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Films</Text>
              <Text style={styles.sectionCount}>{projects.length}</Text>
            </View>

            {/* Project cards */}
            {projects.map((project, index) => {
              const dateDisplay = formatDate(project.created_at);
              const genreDisplay = project.genre
                ? project.genre.charAt(0).toUpperCase() + project.genre.slice(1)
                : 'Drama';
              const titleDisplay = project.answer_movie_title || project.title || 'Untitled Film';
              const isReady = project.status === 'ready';
              const isProcessing = project.status === 'processing';

              return (
                <AnimatedListItem key={project.id} index={index}>
                  <AnimatedPressable
                    onPress={() => handleProjectPress(project)}
                    style={styles.projectCard}
                  >
                    <View style={styles.cardTop}>
                      <StatusBadge status={project.status} />
                      <View style={styles.genreTag}>
                        <Text style={styles.genreTagText}>{genreDisplay}</Text>
                      </View>
                    </View>

                    <Text style={styles.projectTitle} numberOfLines={2}>
                      {titleDisplay}
                    </Text>

                    <View style={styles.cardMeta}>
                      <View style={styles.metaItem}>
                        <ImageIcon size={13} color={COLORS.textTertiary} />
                        <Text style={styles.metaText}>{dateDisplay}</Text>
                      </View>
                    </View>

                    <View style={styles.cardAction}>
                      {isReady ? (
                        <View style={styles.readyActions}>
                          <View style={styles.watchBtn}>
                            <Text style={styles.watchBtnText}>Watch Trailer</Text>
                            <ChevronRight size={14} color={COLORS.primary} />
                          </View>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleViewPoster(project);
                            }}
                            style={styles.posterBtn}
                          >
                            <Text style={styles.posterBtnText}>View Poster</Text>
                          </TouchableOpacity>
                        </View>
                      ) : isProcessing ? (
                        <View style={styles.processingRow}>
                          <IndeterminateBar />
                          <Text style={styles.processingText}>Rendering...</Text>
                        </View>
                      ) : (
                        <View style={styles.continueBtn}>
                          <Text style={styles.continueBtnText}>Continue</Text>
                          <ChevronRight size={14} color={COLORS.textSecondary} />
                        </View>
                      )}
                    </View>
                  </AnimatedPressable>
                </AnimatedListItem>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      {!loading && (
        <AnimatedPressable
          onPress={handleNewProject}
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          accessibilityLabel="Start new project"
        >
          <Plus size={26} color="#fff" />
        </AnimatedPressable>
      )}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  // Skeleton
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skeletonBadge: {
    width: 80,
    height: 22,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceSecondary,
    marginBottom: 12,
  },
  skeletonTitle: {
    width: '70%',
    height: 20,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceSecondary,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: '45%',
    height: 14,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceSecondary,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 32,
  },
  ctaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Error state
  errorState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textTertiary,
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  // Project card
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  projectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
    marginBottom: 8,
    lineHeight: 24,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  cardAction: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: 12,
  },
  readyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  watchBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  posterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.accentMuted,
  },
  posterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  processingRow: {
    gap: 6,
  },
  progressBar: {
    height: 3,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
    borderRadius: 2,
  },
  processingText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '500',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
