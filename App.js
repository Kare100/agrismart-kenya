/**
 * AgriSmart Kenya — App.js
 * SWE 3090 XA
 *
 * This file only owns navigation state and the tab bar. Each screen,
 * the Supabase client, the Gemini helper, translations, theme, and
 * styles all live under ./src — see that folder for the rest of the app.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';

import { styles } from './src/styles/styles';
import { C } from './src/theme/colors';
import { T } from './src/i18n/translations';
import { LangToggle } from './src/components/LangToggle';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/components/OfflineBanner';
import { useOnlineStatus } from './src/hooks/useOnlineStatus';
import { supabase } from './src/lib/supabase';

import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { DiagnoseScreen } from './src/screens/DiagnoseScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { PricesScreen } from './src/screens/PricesScreen';
import { USSDScreen } from './src/screens/USSDScreen';

function AppInner() {
  const [lang, setLang] = useState('EN');
  const [nav, setNav] = useState('login');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lastDiagId, setLastDiagId] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
        setNav('home');
      }
      setSessionChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setNav('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid) => {
    const { data } = await supabase
      .from('users')
      .select('full_name, avatar_initials, preferred_lang, location')
      .eq('id', uid)
      .maybeSingle();
    if (data) {
      setProfile(data);
      if (data.preferred_lang) setLang(data.preferred_lang);
    }
  };

  const handleLogin = (u) => {
    setUser(u);
    loadProfile(u.id);
    setNav('home');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setNav('login');
  };

  const t = T[lang];

  if (!sessionChecked) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48 }}>🌿</Text>
        <ActivityIndicator size="large" color={C.green} style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    switch (nav) {
      case 'login':
        return <LoginScreen lang={lang} setLang={setLang} onLogin={handleLogin} />;
      case 'home':
        return <HomeScreen lang={lang} setNav={setNav} user={user} profile={profile} />;
      case 'diagnose':
        return (
          <DiagnoseScreen
            lang={lang}
            setNav={setNav}
            user={user}
            setLastDiagId={setLastDiagId}
            setLastAnalysis={setLastAnalysis}
          />
        );
      case 'results':
        return <ResultsScreen lang={lang} diagId={lastDiagId} analysis={lastAnalysis} setNav={setNav} />;
      case 'prices':
        return <PricesScreen lang={lang} />;
      case 'ussd':
        return <USSDScreen lang={lang} />;
      default:
        return <HomeScreen lang={lang} setNav={setNav} user={user} profile={profile} />;
    }
  };

  const showTab = nav !== 'login';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.cream} />
      {!isOnline && <OfflineBanner lang={lang} />}
      <View style={{ flex: 1 }}>{renderScreen()}</View>

      {showTab && (
        <View style={styles.tabBar}>
          {[
            { key: 'home', label: t.home, emoji: '🏠' },
            { key: 'diagnose', label: t.diagnose, emoji: '🔬' },
            { key: 'prices', label: t.prices, emoji: '📈' },
            { key: 'ussd', label: t.ussd, emoji: '📲' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setNav(tab.key)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
            >
              <Text style={styles.tabEmoji}>{tab.emoji}</Text>
              <Text style={[styles.tabLabel, nav === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.tabItem}>
            <LangToggle lang={lang} setLang={setLang} />
          </View>
          <TouchableOpacity style={styles.tabItem} onPress={handleSignOut}>
            <Text style={styles.tabEmoji}>🔓</Text>
            <Text style={styles.tabLabel}>{t.signOut}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
