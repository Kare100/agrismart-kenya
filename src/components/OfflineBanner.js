import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/styles';

export const OfflineBanner = ({ lang }) => (
  <View style={styles.offlineBanner}>
    <Text style={styles.offlineBannerText}>
      {lang === 'SW'
        ? '📡 Huna intaneti — baadhi ya vipengele havitapatikana'
        : '📡 No internet connection — some features are unavailable'}
    </Text>
  </View>
);
