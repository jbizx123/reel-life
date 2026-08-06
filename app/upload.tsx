import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Upload, X, Image as ImageIcon, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/supabaseDb';
import { supabase } from '@/app/integrations/supabase/client';
import { COLORS } from '@/constants/Colors';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { CinematicHeader } from '@/components/CinematicHeader';

interface SelectedPhoto {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

interface UploadProgress {
  [index: number]: 'pending' | 'uploading' | 'done' | 'error';
}

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, session } = useAuth();
  const { project_id: existingProjectId } = useLocalSearchParams<{ project_id?: string }>();

  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);

  const photoCount = photos.length;
  const countColor = photoCount < 6 ? COLORS.danger : photoCount < 20 ? COLORS.warning : COLORS.success;
  const canContinue = photoCount >= 6 && !uploading;

  const handleSelectPhotos = async () => {
    console.log('[Upload] Select photos pressed');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as ImagePicker.MediaType,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 50,
      });

      if (!result.canceled && result.assets.length > 0) {
        console.log('[Upload] Selected', result.assets.length, 'photos');
        const newPhotos: SelectedPhoto[] = result.assets.map(a => ({
          uri: a.uri,
          fileName: a.fileName ?? undefined,
          mimeType: a.mimeType ?? 'image/jpeg',
        }));
        setPhotos(prev => {
          const combined = [...prev, ...newPhotos].slice(0, 50);
          return combined;
        });
      }
    } catch (e) {
      console.log('[Upload] Error selecting photos', e);
      setError('Could not open photo library. Please try again.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    console.log('[Upload] Remove photo at index', index);
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    console.log('[Upload] Continue pressed, uploading', photos.length, 'photos');
    if (!user || !session) {
      setError('You must be signed in to continue.');
      return;
    }
    setUploading(true);
    setError(null);

    try {
      // Create or use existing project
      let projectId = existingProjectId;
      if (!projectId) {
        console.log('[Upload] Creating new project in Supabase');
        const { data: project, error: projectError } = await db
          .from('projects')
          .insert({
            user_id: user.id,
            title: 'My Life Trailer',
            genre: 'drama',
            status: 'uploading',
          })
          .select()
          .single();

        if (projectError || !project) {
          console.log('[Upload] Error creating project', projectError?.message);
          throw new Error(projectError?.message ?? 'Failed to create project');
        }
        projectId = project.id;
        console.log('[Upload] Created project', projectId);
      }

      // Upload each photo
      const initialProgress: UploadProgress = {};
      photos.forEach((_, i) => { initialProgress[i] = 'pending'; });
      setUploadProgress(initialProgress);

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setUploadProgress(prev => ({ ...prev, [i]: 'uploading' }));

        try {
          console.log('[Upload] Getting signed URL for photo', i + 1, 'of', photos.length);
          // Get signed upload URL from edge function
          const { data: urlData, error: urlError } = await supabase.functions.invoke('get-upload-url', {
            body: {
              project_id: projectId,
              file_name: photo.fileName ?? `photo_${i}.jpg`,
              content_type: photo.mimeType ?? 'image/jpeg',
              position: i,
            },
          });

          if (urlError) {
            console.log('[Upload] get-upload-url error', urlError.message);
            throw new Error(`Upload URL error: ${urlError.message}`);
          }

          const { signed_url, storage_key } = urlData as { signed_url: string; storage_key: string };
          console.log('[Upload] Got signed URL for photo', i + 1);

          // Upload the file
          const fileResponse = await fetch(photo.uri);
          const blob = await fileResponse.blob();

          const uploadResponse = await fetch(signed_url, {
            method: 'PUT',
            headers: { 'Content-Type': photo.mimeType ?? 'image/jpeg' },
            body: blob,
          });

          if (!uploadResponse.ok) {
            console.log('[Upload] File upload failed', uploadResponse.status);
            throw new Error(`File upload failed: ${uploadResponse.status}`);
          }

          // Insert photo record
          await db.from('photos').insert({
            project_id: projectId,
            storage_key,
            position: i,
          });

          setUploadProgress(prev => ({ ...prev, [i]: 'done' }));
          console.log('[Upload] Photo', i + 1, 'uploaded successfully');
        } catch (photoErr) {
          console.log('[Upload] Error uploading photo', i, photoErr);
          setUploadProgress(prev => ({ ...prev, [i]: 'error' }));
          // Continue with other photos
        }
      }

      // Update project status
      await db.from('projects').update({ status: 'draft' }).eq('id', projectId);

      console.log('[Upload] All photos uploaded, navigating to interview');
      router.push({ pathname: '/interview', params: { project_id: projectId } });
    } catch (e) {
      console.log('[Upload] Upload flow error', e);
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const doneCount = Object.values(uploadProgress).filter(s => s === 'done').length;
  const uploadPercent = photos.length > 0 ? Math.round((doneCount / photos.length) * 100) : 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CinematicHeader title="Upload Your Photos" stepCurrent={1} stepTotal={3} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Drop zone */}
        <AnimatedPressable onPress={handleSelectPhotos} style={styles.dropZone} disabled={uploading}>
          <Upload size={36} color={COLORS.primary} strokeWidth={1.5} />
          <Text style={styles.dropZoneTitle}>Tap to select photos</Text>
          <Text style={styles.dropZoneSubtitle}>Up to 50 photos · JPG, PNG</Text>
        </AnimatedPressable>

        {/* Count badge */}
        {photoCount > 0 && (
          <View style={styles.countRow}>
            <View style={[styles.countBadge, { backgroundColor: countColor + '22' }]}>
              <ImageIcon size={14} color={countColor} />
              <Text style={[styles.countText, { color: countColor }]}>
                {photoCount} photo{photoCount !== 1 ? 's' : ''} selected
              </Text>
            </View>
            {photoCount < 20 && (
              <Text style={styles.nudgeText}>
                {photoCount < 6
                  ? `Add ${6 - photoCount} more to continue`
                  : `Add ${20 - photoCount} more for a richer trailer`}
              </Text>
            )}
          </View>
        )}

        {/* Photo grid */}
        {photoCount > 0 && (
          <View style={styles.grid}>
            {photos.map((photo, index) => {
              const progressState = uploadProgress[index];
              return (
                <View key={`${photo.uri}-${index}`} style={styles.gridItem}>
                  <Image source={{ uri: photo.uri }} style={styles.gridImage} resizeMode="cover" />
                  {progressState === 'uploading' && (
                    <View style={styles.gridOverlay}>
                      <ActivityIndicator color="#fff" size="small" />
                    </View>
                  )}
                  {progressState === 'done' && (
                    <View style={[styles.gridOverlay, styles.gridDone]}>
                      <Text style={styles.gridDoneText}>✓</Text>
                    </View>
                  )}
                  {progressState === 'error' && (
                    <View style={[styles.gridOverlay, styles.gridError]}>
                      <Text style={styles.gridDoneText}>!</Text>
                    </View>
                  )}
                  {!uploading && (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemovePhoto(index)}
                      accessibilityLabel="Remove photo"
                    >
                      <X size={12} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Upload progress */}
        {uploading && (
          <View style={styles.uploadProgressContainer}>
            <View style={styles.uploadProgressBar}>
              <View style={[styles.uploadProgressFill, { width: `${uploadPercent}%` }]} />
            </View>
            <Text style={styles.uploadProgressText}>Uploading {uploadPercent}%...</Text>
          </View>
        )}
      </ScrollView>

      {/* Continue button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <AnimatedPressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.continueBtnText}>Continue to Interview</Text>
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
    paddingTop: 24,
  },
  dropZone: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryMuted,
    marginBottom: 20,
    gap: 10,
  },
  dropZoneTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  dropZoneSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  countRow: {
    marginBottom: 16,
    gap: 6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nudgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  gridItem: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridDone: {
    backgroundColor: 'rgba(39,174,96,0.6)',
  },
  gridError: {
    backgroundColor: 'rgba(231,76,60,0.6)',
  },
  gridDoneText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  uploadProgressContainer: {
    marginBottom: 16,
    gap: 8,
  },
  uploadProgressBar: {
    height: 4,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  uploadProgressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
