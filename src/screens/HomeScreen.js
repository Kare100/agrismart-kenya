import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { styles } from '../styles/styles';
import { C } from '../theme/colors';
import { T } from '../i18n/translations';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { DiagThumb } from '../components/DiagThumb';
import { ErrorBanner } from '../components/ErrorBanner';
import { statusLabel, statusStyle } from '../utils/status';
import { supabase } from '../lib/supabase';

export const HomeScreen = ({ lang, setNav, user, profile }) => {
  const t = T[lang];
  const [diagnoses, setDiagnoses] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const initials = profile?.avatar_initials || 'VK';
  const firstName = profile?.full_name?.split(' ')[0] || 'Farmer';
  const county = profile?.location || 'Nairobi';

  const today = new Date().toLocaleDateString(lang === 'SW' ? 'sw-KE' : 'en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const load = useCallback(async () => {
    setError('');
    try {
      const { data: diags } = await supabase
        .from('diagnoses')
        .select(
          'id, status, diagnosed_at, crop_id, disease_id, image_url, ai_disease_name, crops(name_en, name_sw, emoji), diseases(common_name)'
        )
        .eq('user_id', user.id)
        .order('diagnosed_at', { ascending: false })
        .limit(10);

      if (diags) setDiagnoses(diags);

      let { data: wx } = await supabase
        .from('weather_advisories')
        .select('advisory_en, advisory_sw, county, temp_celsius, condition')
        .eq('county', county)
        .gte('valid_at', new Date().toISOString())
        .order('valid_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!wx) {
        const fallback = await supabase
          .from('weather_advisories')
          .select('advisory_en, advisory_sw, county, temp_celsius, condition')
          .eq('county', county)
          .order('valid_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        wx = fallback.data;
      }

      if (wx) setWeather(wx);
    } catch (e) {
      console.warn('Home load error:', e.message);
      setError(lang === 'SW' ? 'Imeshindwa kupakia data. Vuta chini kujaribu tena.' : "Couldn't load your data. Pull down to try again.");
    }
  }, [user.id, county, lang]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getCropName = (d) => {
    if (!d.crops) return 'Unknown crop';
    return lang === 'SW' ? d.crops.name_sw || d.crops.name_en : d.crops.name_en;
  };
  const getDiseaseName = (d) => {
    if (d.ai_disease_name) return d.ai_disease_name;
    if (!d.diseases) return lang === 'SW' ? 'Bado haijaainishwa' : 'Not identified';
    return d.diseases.common_name || (lang === 'SW' ? 'Bado haijaainishwa' : 'Not identified');
  };

  const weatherText = weather
    ? lang === 'SW'
      ? weather.advisory_sw
      : weather.advisory_en
    : lang === 'SW'
      ? 'Hakuna ushauri wa leo'
      : 'No advisory for today';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenPad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.green]} tintColor={C.green} />}
    >
      <View style={styles.homeHeader}>
        <View>
          <Text style={styles.greeting}>
            {lang === 'SW' ? `Habari, ${firstName} 👋` : `Hello, ${firstName} 👋`}
          </Text>
          <Text style={styles.dateText}>{today}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <Card style={styles.weatherCard}>
        <Text style={styles.weatherIcon}>🌤</Text>
        <View style={styles.weatherMid}>
          <Text style={styles.weatherTemp}>24°C · {county}</Text>
          <Text style={styles.weatherNote} numberOfLines={2}>
            {weatherText}
          </Text>
        </View>
        <Text style={styles.weatherThu}>🌧 Thu</Text>
      </Card>

      <View style={styles.actionGrid}>
        {[
          { label: t.diagnose, emoji: '🔬', tab: 'diagnose', color: C.sage },
          { label: t.prices, emoji: '📈', tab: 'prices', color: C.amberLight },
          { label: t.weather, emoji: '⛅', tab: 'home', color: '#E8F5E9' },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.actionCard, { backgroundColor: item.color }]}
            onPress={() => setNav(item.tab)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Text style={styles.actionEmoji}>{item.emoji}</Text>
            <Text style={styles.actionLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t.recentDiagnoses}</Text>
      {loading ? (
        <Spinner lang={lang} />
      ) : diagnoses.length === 0 ? (
        <Card>
          <Text style={[styles.bodyText, { textAlign: 'center' }]}>
            {lang === 'SW' ? 'Bado hujafanya uchunguzi wowote.' : 'No diagnoses yet. Tap Diagnose to get started.'}
          </Text>
        </Card>
      ) : (
        diagnoses.map((d, i) => {
          const ss = statusStyle(d.status);
          return (
            <Card key={i} style={styles.diagRow}>
              <View style={styles.diagThumb}>
                <DiagThumb uri={d.image_url} emoji={d.crops?.emoji || '🌿'} />
              </View>
              <View style={styles.diagInfo}>
                <Text style={styles.diagCrop}>{getCropName(d)}</Text>
                <Text style={styles.diagDisease}>{getDiseaseName(d)}</Text>
              </View>
              <View style={[styles.statusBadge, ss.badge]}>
                <Text style={[styles.statusText, ss.text]}>{statusLabel(d.status, t)}</Text>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
};
