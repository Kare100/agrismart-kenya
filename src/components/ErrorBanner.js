import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/styles';

// Standardizes how recoverable errors are shown across the app: inline,
// dismissible, non-blocking. Alert.alert is reserved for things that
// genuinely need an explicit acknowledgment (camera/gallery permission
// prompts, "check your email" confirmations) — actual failures (a failed
// fetch, a bad login, a failed save) use this instead so the user isn't
// interrupted by a modal for something they can just retry.
export const ErrorBanner = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.errorBannerDismiss}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
