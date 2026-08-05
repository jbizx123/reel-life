import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/supabaseDb';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CinematicHeader } from '@/components/CinematicHeader';

const SUPABASE_URL = 'https://jiqxzqxpannhxazlodbr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppcXh6cXhwYW5uaHhhemxvZGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4OTQwNTYsImV4cCI6MjEwMTQ3MDA1Nn0.SzWrwCRAttWEP30hehpzfiPpHXSHUvWXY_03X4Q8ZvM';

type Genre = 'drama' | 'comedy' | 'action' | 'romance' | 'documentary' | 'thriller';

const GENRES: { id: Genre; label: string }[] = [
  { id: 'drama', label: 'Drama' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'action', label: 'Action' },
  { id: 'romance', label: 'Romance' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'thriller', label: 'Thriller' },
];

interface QuestionCardProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

function QuestionCard({ number, title, children }: QuestionCardProps) {
  return (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{number}</Text>
        </View>
        <Text style={styles.questionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function InterviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { project_id } = useLocalSearchParams<{ project_id: string }>();

  const [name, setName] = useState('');
  const [genre, setGenre] = useState<Genre>('drama');
  const [before, setBefore] = useState('');
  const [turningPoint, setTurningPoint] = useState('');
  const [now, setNow] = useState('');
  const [movieTitle, setMovieTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameFocused, setNameFocused] = useState(false);
  const [beforeFocused, setBeforeFocused] = useState(false);
  const [turningFocused, setTurningFocused] = useState(false);
  const [nowFocused, setNowFocused] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);

  const isValid = name.trim() && before.trim() && turningPoint.trim() && now.trim() && movieTitle.trim();

  const handleDirectTrailer = async () => {
    console.log('[Interview] Direct My Trailer pressed', { project_id, genre, name });
    if (!isValid) {
      setError('Please fill in all fields before continuing.');
      return;
    }
    if (!project_id) {
      setError('Project not found. Please go back and try again.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Save answers to project
      console.log('[Interview] Saving answers to Supabase');
      const { error: updateError } = await db
        .from('projects')
        .update({
          genre,
          answer_name: name.trim(),
          answer_before: before.trim(),
          answer_turning_point: turningPoint.trim(),
          answer_now: now.trim(),
          answer_movie_title: movieTitle.trim(),
          title: movieTitle.trim(),
          status: 'processing',
        })
        .eq('id', project_id);

      if (updateError) {
        console.log('[Interview] Error saving answers', updateError.message);
        throw new Error(updateError.message);
      }

      // Call generate-script edge function
      console.log('[Interview] Calling generate-script edge function');
      const scriptResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({ project_id }),
      });

      if (!scriptResponse.ok) {
        const errText = await scriptResponse.text();
        console.log('[Interview] generate-script error', scriptResponse.status, errText);
        // Non-fatal — continue to render
      } else {
        console.log('[Interview] Script generated successfully');
      }

      // Call start-render edge function
      console.log('[Interview] Calling start-render edge function');
      const renderResponse = await fetch(`${SUPABASE_URL}/functions/v1/start-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({ project_id, type: 'free_trailer' }),
      });

      if (!renderResponse.ok) {
        const errText = await renderResponse.text();
        console.log('[Interview] start-render error', renderResponse.status, errText);
        // Non-fatal — navigate to progress screen anyway
      } else {
        console.log('[Interview] Render started successfully');
      }

      router.push({ pathname: '/render-progress', params: { project_id } });
    } catch (e) {
      console.log('[Interview] Error directing trailer', e);
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CinematicHeader title="Your Story" stepCurrent={2} stepTotal={3} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Q1: Name */}
        <QuestionCard number="01" title="What's your name?">
          <TextInput
            style={[styles.input, nameFocused && styles.inputFocused]}
            placeholder="Your full name"
            placeholderTextColor={COLORS.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
        </QuestionCard>

        {/* Q2: Genre */}
        <QuestionCard number="02" title="Choose your genre">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
            <View style={styles.genreRow}>
              {GENRES.map(g => {
                const isSelected = genre === g.id;
                return (
                  <AnimatedPressable
                    key={g.id}
                    onPress={() => {
                      console.log('[Interview] Genre selected', g.id);
                      setGenre(g.id);
                    }}
                    style={[styles.genrePill, isSelected && styles.genrePillSelected]}
                  >
                    <Text style={[styles.genrePillText, isSelected && styles.genrePillTextSelected]}>
                      {g.label}
                    </Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </ScrollView>
        </QuestionCard>

        {/* Q3: Before */}
        <QuestionCard number="03" title="Before — Where did your story begin?">
          <TextInput
            style={[styles.textarea, beforeFocused && styles.inputFocused]}
            placeholder="Describe your early life, where you grew up, what shaped you..."
            placeholderTextColor={COLORS.textTertiary}
            value={before}
            onChangeText={setBefore}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => setBeforeFocused(true)}
            onBlur={() => setBeforeFocused(false)}
          />
        </QuestionCard>

        {/* Q4: Turning point */}
        <QuestionCard number="04" title="The Turning Point — What changed everything?">
          <TextInput
            style={[styles.textarea, turningFocused && styles.inputFocused]}
            placeholder="The moment, decision, or event that redirected your path..."
            placeholderTextColor={COLORS.textTertiary}
            value={turningPoint}
            onChangeText={setTurningPoint}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => setTurningFocused(true)}
            onBlur={() => setTurningFocused(false)}
          />
        </QuestionCard>

        {/* Q5: Now */}
        <QuestionCard number="05" title="Now — Where has the journey brought you?">
          <TextInput
            style={[styles.textarea, nowFocused && styles.inputFocused]}
            placeholder="Who are you today? What have you built or become?"
            placeholderTextColor={COLORS.textTertiary}
            value={now}
            onChangeText={setNow}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => setNowFocused(true)}
            onBlur={() => setNowFocused(false)}
          />
        </QuestionCard>

        {/* Q6: Movie title */}
        <QuestionCard number="06" title="Movie Title">
          <TextInput
            style={[styles.input, titleFocused && styles.inputFocused]}
            placeholder="e.g. 'The Long Road Home'"
            placeholderTextColor={COLORS.textTertiary}
            value={movieTitle}
            onChangeText={setMovieTitle}
            autoCapitalize="words"
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
          />
        </QuestionCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <AnimatedPressable
          onPress={handleDirectTrailer}
          disabled={!isValid || loading}
          style={[styles.ctaBtn, (!isValid || loading) && styles.ctaBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.ctaBtnText}>Direct My Trailer</Text>
              <ChevronRight size={18} color="#fff" />
            </>
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  questionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 20,
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  textarea: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 110,
    lineHeight: 22,
  },
  inputFocused: {
    borderColor: COLORS.accent,
  },
  genreScroll: {
    marginHorizontal: -4,
  },
  genreRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  genrePill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genrePillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genrePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  genrePillTextSelected: {
    color: '#fff',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  ctaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaBtnDisabled: {
    opacity: 0.4,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
