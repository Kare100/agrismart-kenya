import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Linking } from 'react-native';
import { styles } from '../styles/styles';
import { T } from '../i18n/translations';
import { Card } from '../components/Card';

export const USSDScreen = ({ lang }) => {
  const t = T[lang];
  const steps =
    lang === 'SW'
      ? [
          { icon: '📲', label: 'Piga *384#', desc: 'Kwenye simu yoyote' },
          { icon: '🌿', label: 'Chagua huduma', desc: 'Magonjwa au Bei za Soko' },
          { icon: '✅', label: 'Pata jibu', desc: 'Papo hapo, bila intaneti' },
        ]
      : [
          { icon: '📲', label: 'Dial *384#', desc: 'On any mobile phone' },
          { icon: '🌿', label: 'Choose a service', desc: 'Disease help or Market Prices' },
          { icon: '✅', label: 'Get your answer', desc: 'Instantly, no internet needed' },
        ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenPad}>
      <View style={styles.ussdHero}>
        <Text style={{ fontSize: 64 }}>📱</Text>
        <Text style={styles.ussdTitle}>{t.noSmartphone}</Text>
        <Text style={styles.ussdBody}>{t.ussdBody}</Text>
      </View>
      {steps.map((s, i) => (
        <Card key={i} style={styles.ussdStep}>
          <Text style={styles.ussdStepIcon}>{s.icon}</Text>
          <View style={styles.ussdStepInfo}>
            <Text style={styles.ussdStepLabel}>{s.label}</Text>
            <Text style={styles.ussdStepDesc}>{s.desc}</Text>
          </View>
        </Card>
      ))}
      <TouchableOpacity style={[styles.btnPrimary, { marginTop: 24 }]} onPress={() => Linking.openURL('tel:*384%23')}>
        <Text style={styles.btnPrimaryText}>📞  *384#</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
