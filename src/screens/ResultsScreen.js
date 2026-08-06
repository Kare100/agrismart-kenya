import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { styles } from '../styles/styles';
import { T } from '../i18n/translations';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { supabase } from '../lib/supabase';
import { openExpertDirectory } from '../data/expertContacts';

export const ResultsScreen = ({ lang, diagId, analysis, setNav }) => {
  const t = T[lang];
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const markTreated = async () => {
    if (!diagId) {
      setNav('home');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('diagnoses').update({ status: 'treated' }).eq('id', diagId);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    Alert.alert('', t.diagnoseSaved);
    setNav('home');
  };

  const cropName = analysis?.cropName || 'Tomato';
  const cropEmoji = analysis?.cropEmoji || '🍅';
  const diseaseName = analysis?.diseaseName || 'Early Blight';
  const latinName = analysis?.latinName || 'Alternaria solani';
  const confidence = analysis?.confidence ?? 94;
  const diseaseMeta =
    analysis?.explanation ||
    'A fungal disease causing brown concentric ring spots on lower leaves. Can reduce yields by 20-50% if untreated.';
  const steps = analysis?.steps?.length
    ? analysis.steps
    : [
      'Remove and destroy affected leaves immediately.',
      'Apply a suitable fungicide as recommended locally.',
      'Repeat every 7 to 10 days until symptoms clear.',
      'Water at the base of the plant only — avoid wetting leaves.',
    ];
  const isHealthy = diseaseName.toLowerCase() === 'healthy';
  const isNotAPlant = diseaseName.toLowerCase().includes('not a plant');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPad}>
      <View style={styles.resultsHero}>
        {analysis?.imageUri ? (
          <Image source={{ uri: analysis.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 72 }}>{cropEmoji}</Text>
        )}
        <View style={styles.heroLabel}>
          <Text style={styles.heroLabelText}>
            {cropName} · {lang === 'SW' ? 'Picha yako' : 'Your photo'}
          </Text>
        </View>
      </View>

      <Card>
        <View style={styles.diseaseHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.diseaseName}>{diseaseName}</Text>
            {latinName ? <Text style={styles.diseaseLatin}>{latinName}</Text> : null}
          </View>
          {!isNotAPlant && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{confidence}% match</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t.whatThisMeans}</Text>
        <Text style={styles.bodyText}>{diseaseMeta}</Text>

        {!isHealthy && !isNotAPlant && (
          <>
            <Text style={styles.sectionTitle}>{t.treatment}</Text>
            {steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
          </>
        )}

        <ErrorBanner message={error} onDismiss={() => setError('')} />

        {isNotAPlant ? (
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setNav('diagnose')}>
            <Text style={styles.btnPrimaryText}>
              {lang === 'SW' ? '📷 Piga Picha Tena' : '📷 Retake Photo'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.resultActions}>
            {isNotAPlant ? (
              <>
                <TouchableOpacity style={[styles.btnPrimary, { flex: 1, marginRight: 8 }]} onPress={() => setNav('diagnose')}>
                  <Text style={styles.btnPrimaryText}>{lang === 'SW' ? 'Piga Picha Nyingine' : 'Take Another Photo'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnOutline, { flex: 1 }]} onPress={() => setNav('home')}>
                  <Text style={styles.btnOutlineText}>{lang === 'SW' ? 'Rudi Nyuma' : 'Go Back'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.btnPrimary, { flex: 1, marginRight: 8 }]} onPress={markTreated} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color={C.white} />
                    : <Text style={styles.btnPrimaryText}>{t.saveHistory}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnOutline, { flex: 1 }]} onPress={() => openExpertDirectory(lang)}>
                  <Text style={styles.btnOutlineText}>{t.talkExpert}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </Card>
    </ScrollView>
  );
};
