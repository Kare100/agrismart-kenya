import { Alert, Linking } from 'react-native';

export const EXPERT_CONTACTS = [
  {
    name_en: 'Kenya Agro-Advisory Call Centre (toll-free)',
    name_sw: 'Kituo cha Ushauri wa Kilimo (bila malipo)',
    phone: '0800721741',
  },
  {
    name_en: 'Kenya Agro-Advisory Call Centre (direct)',
    name_sw: 'Kituo cha Ushauri wa Kilimo (moja kwa moja)',
    phone: '0111010100',
  },
  {
    name_en: 'KALRO Headquarters — Nairobi',
    name_sw: 'Makao Makuu ya KALRO — Nairobi',
    phone: '+254722206986',
  },
];

export const openExpertDirectory = (lang) => {
  const isSW = lang === 'SW';
  Alert.alert(
    isSW ? 'Zungumza na Mtaalamu' : 'Talk to an Expert',
    isSW
      ? 'Piga simu mojawapo ya vituo hivi vya kilimo Kenya kwa msaada:'
      : "Call one of Kenya's agricultural support lines for help:",
    [
      ...EXPERT_CONTACTS.map((c) => ({
        text: isSW ? c.name_sw : c.name_en,
        onPress: () => Linking.openURL(`tel:${c.phone}`),
      })),
      { text: isSW ? 'Ghairi' : 'Cancel', style: 'cancel' },
    ]
  );
};
