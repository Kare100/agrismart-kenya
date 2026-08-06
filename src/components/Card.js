import React from 'react';
import { View } from 'react-native';
import { styles } from '../styles/styles';

export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);
