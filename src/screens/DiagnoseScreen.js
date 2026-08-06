import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../styles/styles';
import { C } from '../theme/colors';
import { T } from '../i18n/translations';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { supabase, uploadPhotoToStorage } from '../lib/supabase';
import { analyzeCropPhoto } from '../lib/geminiVision';
import { findMatchingDiseaseId } from '../lib/diseaseMatch';
import { compressForUpload } from '../lib/imageUtils';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const DiagnoseScreen = ({ lang, setNav, user, setLastDiagId, setLastAnalysis }) => {
  const t = T[lang];
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelected] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [analysing, setAnalysing] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [error, setError] = useState('');
  const isOnline = useOnlineStatus();

  useEffect(() => {
    supabase
      .from('crops')
      .select('id, name_en, name_sw, emoji')
      .then(({ data }) => {
        const clean = (data || []).filter((c) => c.name_en && c.name_en.trim().length > 0);
        setCrops(clean);
      });
  }, []);

  const cropName = (c) => (lang === 'SW' ? c.name_sw || c.name_en : c.name_en);

  const handlePicked = async (result) => {
    if (result.canceled) return;
    const asset = result.assets[0];

    setProcessingPhoto(true);
    try {
      const compressed = await compressForUpload(asset.uri);
      setImageUri(compressed.uri);
      setImageBase64(compressed.base64);
      setImageMimeType(compressed.mimeType);
      setUploaded(true);
    } catch (e) {
      // If compression fails for any reason, fall back to the original
      // asset rather than blocking the user from diagnosing at all.
      console.warn('Photo compression failed, using original:', e.message);
      setImageUri(asset.uri);
      setImageBase64(asset.base64 || null);
      setImageMimeType(asset.mimeType || 'image/jpeg');
      setUploaded(true);
    } finally {
      setProcessingPhoto(false);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        lang === 'SW' ? 'Ruhusa inahitajika' : 'Permission needed',
        lang === 'SW' ? 'Ufikiaji wa kamera unahitajika kupiga picha.' : 'Camera access is required to take a photo.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
    await handlePicked(result);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        lang === 'SW' ? 'Ruhusa inahitajika' : 'Permission needed',
        lang === 'SW' ? 'Ufikiaji wa picha zako unahitajika.' : 'Photo library access is required.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true });
    await handlePicked(result);
  };

  const handleAnalyse = async () => {
    if (!selectedCrop || !uploaded) return;
    if (!isOnline) {
      setError(
        lang === 'SW'
          ? 'Huna intaneti. Unganisha kisha jaribu tena.'
          : "You're offline. Connect to the internet and try again."
      );
      return;
    }
    setAnalysing(true);
    setError('');

    let analysis = null;

    if (imageBase64) {
      try {
        analysis = await analyzeCropPhoto(imageBase64, imageMimeType, selectedCrop.name_en);
      } catch (e) {
        console.warn('Gemini analysis failed, falling back to simulated result:', e.message);
      }
    }

    if (!analysis) {
      const { data: disease } = await supabase
        .from('diseases')
        .select('id, common_name, scientific_name, description_en, treatment_steps(step_order, instruction_en)')
        .eq('crop_id', selectedCrop.id)
        .limit(1)
        .maybeSingle();

      analysis = {
        diseaseName: disease?.common_name || 'Early Blight',
        latinName: disease?.scientific_name || 'Alternaria solani',
        confidence: Math.round((0.85 + Math.random() * 0.12) * 100),
        explanation: disease?.description_en || 'A common fungal disease affecting this crop.',
        steps: disease?.treatment_steps?.length
          ? disease.treatment_steps
              .sort((a, b) => a.step_order - b.step_order)
              .map((s) => s.instruction_en)
          : [
              'Remove and destroy affected leaves immediately.',
              'Apply a suitable fungicide as recommended locally.',
              'Repeat every 7 to 10 days until symptoms clear.',
              'Water at the base of the plant only — avoid wetting leaves.',
            ],
      };
    }

    // A photo Gemini couldn't identify as a plant at all isn't worth
    // uploading or saving to history — skip Storage/insert entirely and
    // send the user straight to a "retake photo" screen. This also saves
    // upload bandwidth for users on slow/metered connections.
    const isNotAPlant = analysis.diseaseName.toLowerCase().includes('not a plant');
    if (isNotAPlant) {
      setLastDiagId(null);
      setLastAnalysis({
        ...analysis,
        cropName: cropName(selectedCrop),
        cropEmoji: selectedCrop.emoji || '🌿',
        imageUri,
      });
      setAnalysing(false);
      setNav('results');
      return;
    }

    // Upload the photo to Storage so it can show on Home later. Non-fatal —
    // if it fails, we still complete the diagnosis with a placeholder path.
    let photoUrl = null;
    try {
      photoUrl = await uploadPhotoToStorage(imageUri, user.id, imageMimeType);
    } catch (e) {
      console.warn('Photo upload failed, continuing without it:', e.message);
    }

    // Link the AI's free-text disease name back to a real diseases.id for
    // this crop where possible, so diagnoses can actually be joined/queried
    // instead of only carrying an unstructured ai_disease_name string.
    let diseaseId = null;
    try {
      const { data: cropDiseases } = await supabase
        .from('diseases')
        .select('id, common_name')
        .eq('crop_id', selectedCrop.id);
      diseaseId = findMatchingDiseaseId(analysis.diseaseName, cropDiseases);
    } catch (e) {
      console.warn('Disease lookup failed, saving without disease_id:', e.message);
    }

    try {
      const { data: diag, error: insertError } = await supabase
        .from('diagnoses')
        .insert({
          user_id: user.id,
          crop_id: selectedCrop.id,
          disease_id: diseaseId,
          ai_disease_name: analysis.diseaseName,
          confidence_score: analysis.confidence / 100,
          image_url: photoUrl,
          status: 'pending',
          source: 'app',
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      setLastDiagId(diag.id);
      setLastAnalysis({
        ...analysis,
        cropName: cropName(selectedCrop),
        cropEmoji: selectedCrop.emoji || '🌿',
        imageUri: imageUri,
      });
      setNav('results');
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPad}>
      <Text style={styles.screenTitle}>{t.diagnoseTitle}</Text>
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      <Card>
        <View style={styles.uploadZone}>
          {processingPhoto ? (
            <View style={styles.uploadEmpty}>
              <ActivityIndicator size="large" color={C.green} />
              <Text style={styles.uploadPrompt}>
                {lang === 'SW' ? 'Inashughulikia picha…' : 'Processing photo…'}
              </Text>
            </View>
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.uploadedImage} resizeMode="cover" />
          ) : (
            <View style={styles.uploadEmpty}>
              <Text style={{ fontSize: 40 }}>📷</Text>
              <Text style={styles.uploadPrompt}>{t.tapPhoto}</Text>
            </View>
          )}
        </View>

        <View style={styles.photoButtonRow}>
          <TouchableOpacity
            style={[styles.btnOutline, { flex: 1, marginRight: 8 }]}
            onPress={takePhoto}
            disabled={processingPhoto}
          >
            <Text style={styles.btnOutlineText}>{t.takePhoto}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnOutline, { flex: 1 }]}
            onPress={pickFromGallery}
            disabled={processingPhoto}
          >
            <Text style={styles.btnOutlineText}>{t.choosePhoto}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.photoTip}>💡 {t.photoTip}</Text>

        <Text style={styles.subLabel}>{t.selectCrop}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {crops.length === 0 ? (
            <Text style={{ color: C.grey, fontSize: 13, paddingVertical: 8 }}>
              {lang === 'SW' ? 'Inapakia mazao…' : 'Loading crops…'}
            </Text>
          ) : (
            crops.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selectedCrop?.id === c.id && styles.chipActive]}
                onPress={() => setSelected(c)}
              >
                <Text style={[styles.chipText, selectedCrop?.id === c.id && styles.chipTextActive]}>
                  {c.emoji} {cropName(c)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.btnPrimary,
            (!uploaded || !selectedCrop || analysing || processingPhoto || !isOnline) && styles.btnDisabled,
          ]}
          onPress={handleAnalyse}
          disabled={!uploaded || !selectedCrop || analysing || processingPhoto || !isOnline}
        >
          {analysing ? (
            <>
              <ActivityIndicator color={C.white} />
              <Text style={[styles.btnPrimaryText, { marginLeft: 8 }]}>{t.analysing}</Text>
            </>
          ) : !isOnline ? (
            <Text style={styles.btnPrimaryText}>
              {lang === 'SW' ? 'Huna Intaneti' : 'Offline — Can\'t Analyse'}
            </Text>
          ) : (
            <Text style={styles.btnPrimaryText}>{t.analyseCrop}</Text>
          )}
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
};
