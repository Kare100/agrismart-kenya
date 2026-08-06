import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { styles } from '../styles/styles';
import { C } from '../theme/colors';
import { T } from '../i18n/translations';

export const Spinner = ({ lang }) => (
  <View style={styles.spinnerWrap}>
    <ActivityIndicator size="large" color={C.green} />
    <Text style={styles.spinnerText}>{T[lang].loading}</Text>
  </View>
);
