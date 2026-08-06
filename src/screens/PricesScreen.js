import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { styles } from '../styles/styles';
import { C } from '../theme/colors';
import { T } from '../i18n/translations';
import { Card } from '../components/Card';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { formatKes } from '../utils/formatPrice';
import { supabase } from '../lib/supabase';

export const PricesScreen = ({ lang }) => {
  const t = T[lang];
  const [crops, setCrops] = useState([]);
  const [selected, setSelected] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    supabase
      .from('crops')
      .select('id, name_en, name_sw, emoji')
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          return;
        }
        const clean = (data || []).filter((c) => c.name_en && c.name_en.trim().length > 0);
        if (clean.length) {
          setCrops(clean);
          setSelected(clean[0]);
        }
      });
  }, []);

  const loadPrices = useCallback(async () => {
    if (!selected) return;
    setLoadError('');
    const { data, error } = await supabase
      .from('market_prices')
      .select('id, variety, market_name, county, price_kes_per_kg, trend_pct, recorded_at')
      .eq('crop_id', selected.id)
      .order('recorded_at', { ascending: false });
    if (error) setLoadError(error.message);
    setPrices(data || []);
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    loadPrices().finally(() => setLoading(false));
  }, [selected, loadPrices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };

  const cropName = (c) => (lang === 'SW' ? c.name_sw || c.name_en : c.name_en);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenPad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.green]} tintColor={C.green} />}
    >
      <View style={styles.pricesHeader}>
        <Text style={styles.screenTitle}>{t.marketTitle}</Text>
        <Text style={styles.updatedText}>{t.updatedNow}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
        {crops.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.pill, selected?.id === c.id && styles.pillActive]}
            onPress={() => setSelected(c)}
          >
            <Text style={[styles.pillText, selected?.id === c.id && styles.pillTextActive]}>
              {c.emoji} {cropName(c)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ErrorBanner message={loadError} onDismiss={() => setLoadError('')} />

      {loading ? (
        <Spinner lang={lang} />
      ) : prices.length === 0 ? (
        <Card>
          <Text style={[styles.bodyText, { textAlign: 'center' }]}>
            {lang === 'SW' ? 'Hakuna bei kwa zao hili bado.' : 'No prices for this crop yet.'}
          </Text>
        </Card>
      ) : (
        prices.map((item, i) => (
          <Card key={item.id || i} style={styles.priceCard}>
            <View style={styles.priceLeft}>
              <Text style={styles.priceCrop}>{selected ? cropName(selected) : ''}</Text>
              <Text style={styles.priceVariety}>{item.variety || ''}</Text>
              {item.market_name ? <Text style={styles.priceMarket}>📍 {item.market_name}</Text> : null}
              {item.county ? <Text style={styles.priceMarket}>{item.county}</Text> : null}
            </View>
            <View style={styles.priceRight}>
              <Text style={styles.priceKES}>KES {formatKes(item.price_kes_per_kg)}/kg</Text>
              {item.trend_pct != null && (
                <View style={[styles.trendBadge, item.trend_pct >= 0 ? styles.trendUp : styles.trendDown]}>
                  <Text style={[styles.trendText, item.trend_pct >= 0 ? styles.trendTextUp : styles.trendTextDown]}>
                    {item.trend_pct >= 0 ? '▲' : '▼'} {Math.abs(item.trend_pct)}%
                  </Text>
                </View>
              )}
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
};
