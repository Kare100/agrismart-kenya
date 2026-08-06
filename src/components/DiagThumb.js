import React, { useState } from 'react';
import { Image, Text } from 'react-native';
import { styles } from '../styles/styles';

export const DiagThumb = ({ uri, emoji }) => {
  const [failed, setFailed] = useState(false);
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={styles.diagThumbImage}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return <Text style={{ fontSize: 24 }}>{emoji}</Text>;
};
