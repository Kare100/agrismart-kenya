import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { styles } from '../styles/styles';
import { C } from '../theme/colors';

export const LangToggle = ({ lang, setLang, dark }) => (
  <TouchableOpacity onPress={() => setLang(lang === 'EN' ? 'SW' : 'EN')} style={styles.langToggle}>
    <Text style={styles.langToggleText}>
      <Text
        style={[
          lang === 'EN' ? styles.langActive : styles.langInactive,
          dark && { color: lang === 'EN' ? C.amber : C.greyLight },
        ]}
      >
        EN
      </Text>
      <Text style={[styles.langSep, dark && { color: C.white }]}> | </Text>
      <Text
        style={[
          lang === 'SW' ? styles.langActive : styles.langInactive,
          dark && { color: lang === 'SW' ? C.amber : C.greyLight },
        ]}
      >
        SW
      </Text>
    </Text>
  </TouchableOpacity>
);
