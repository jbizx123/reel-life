import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Path, G, Circle, Rect } from 'react-native-svg';
import { supabase } from '@/app/integrations/supabase/client';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';

// Apple Logo SVG
function AppleLogo({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
    </Svg>
  );
}

// Google Logo SVG
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107" />
      <Path d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00" />
      <Path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50" />
      <Path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2" />
    </Svg>
  );
}

// Film reel decorative SVG
function FilmReelIcon({ size = 80 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <Circle cx="40" cy="40" r="38" stroke={COLORS.primary} strokeWidth="2" />
      <Circle cx="40" cy="40" r="12" fill={COLORS.primary} />
      <Circle cx="40" cy="40" r="5" fill={COLORS.background} />
      <Circle cx="40" cy="18" r="6" fill={COLORS.surfaceSecondary} stroke={COLORS.primary} strokeWidth="1.5" />
      <Circle cx="40" cy="62" r="6" fill={COLORS.surfaceSecondary} stroke={COLORS.primary} strokeWidth="1.5" />
      <Circle cx="18" cy="40" r="6" fill={COLORS.surfaceSecondary} stroke={COLORS.primary} strokeWidth="1.5" />
      <Circle cx="62" cy="40" r="6" fill={COLORS.surfaceSecondary} stroke={COLORS.primary} strokeWidth="1.5" />
      <Circle cx="24.7" cy="24.7" r="6" fill={COLORS.surfaceSecondary} stroke={COLORS.primary} strokeWidth="1.5" />
      <Circle cx="55.3" cy="55.3" r="6" fill={COLORS.surfaceSecondary} stroke={COLORS.primary} strokeWidth="1.5" />
      <Circle cx="55.3" cy="24.7" r="6" fill={COLORS.surfaceSecondary} stroke={COLORS.primary} strokeWidth="1.5" />
      <Circle cx="24.7" cy="55.3" r="6" fill={COLORS.surfaceSecondary} stroke={COLORS.primary} strokeWidth="1.5" />
    </Svg>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    console.log('[Auth] Sign in button pressed', { email });
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        console.log('[Auth] Sign in error', authError.message);
        setError(authError.message);
      } else {
        console.log('[Auth] Sign in successful');
        router.replace('/(tabs)/(home)');
      }
    } catch (e) {
      console.log('[Auth] Sign in exception', e);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    console.log('[Auth] Sign up button pressed', { email, fullName });
    setError(null);
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (authError) {
        console.log('[Auth] Sign up error', authError.message);
        setError(authError.message);
      } else {
        console.log('[Auth] Sign up successful');
        router.replace('/(tabs)/(home)');
      }
    } catch (e) {
      console.log('[Auth] Sign up exception', e);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    console.log('[Auth] Apple sign in pressed');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
      if (authError) {
        console.log('[Auth] Apple sign in error', authError.message);
        setError(authError.message);
      }
    } catch (e) {
      console.log('[Auth] Apple sign in exception', e);
      setError('Apple sign in failed. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[Auth] Google sign in pressed');
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (authError) {
        console.log('[Auth] Google sign in error', authError.message);
        setError(authError.message);
      }
    } catch (e) {
      console.log('[Auth] Google sign in exception', e);
      setError('Google sign in failed. Please try again.');
    }
  };

  const toggleMode = () => {
    console.log('[Auth] Toggle mode pressed, switching to', mode === 'signin' ? 'signup' : 'signin');
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1A0A0A', COLORS.background, COLORS.background]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <FilmReelIcon size={80} />
            <Text style={styles.appName}>REEL LIFE</Text>
            <Text style={styles.tagline}>Your life. Your story. Your trailer.</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signin' && styles.modeBtnActive]}
                onPress={() => { if (mode !== 'signin') toggleMode(); }}
              >
                <Text style={[styles.modeBtnText, mode === 'signin' && styles.modeBtnTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
                onPress={() => { if (mode !== 'signup') toggleMode(); }}
              >
                <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Full Name (signup only) */}
            {mode === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={[styles.input, nameFocused && styles.inputFocused]}
                  placeholder="Your full name"
                  placeholderTextColor={COLORS.textTertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                ref={emailRef}
                style={[styles.input, emailFocused && styles.inputFocused]}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={[styles.input, passwordFocused && styles.inputFocused]}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                placeholderTextColor={COLORS.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onSubmitEditing={mode === 'signin' ? handleSignIn : handleSignUp}
              />
            </View>

            {/* Error */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Primary CTA */}
            <AnimatedPressable
              onPress={mode === 'signin' ? handleSignIn : handleSignUp}
              disabled={loading}
              style={styles.primaryBtn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </AnimatedPressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth buttons */}
            <AnimatedPressable onPress={handleAppleSignIn} style={styles.oauthBtn}>
              <AppleLogo size={20} color={COLORS.text} />
              <Text style={styles.oauthBtnText}>Continue with Apple</Text>
            </AnimatedPressable>

            <AnimatedPressable onPress={handleGoogleSignIn} style={[styles.oauthBtn, { marginTop: 10 }]}>
              <GoogleLogo size={20} />
              <Text style={styles.oauthBtnText}>Continue with Google</Text>
            </AnimatedPressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 6,
    marginTop: 20,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeBtnTextActive: {
    color: '#fff',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: COLORS.accent,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    letterSpacing: 0.3,
  },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  oauthBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});
