import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, ActivityIndicator,
  TextInput, Alert,
} from 'react-native';
import { styles } from '../styles/styles';
import { C } from '../theme/colors';
import { T } from '../i18n/translations';
import { LangToggle } from '../components/LangToggle';
import { supabase } from '../lib/supabase';
import { validateCredentials } from '../utils/validateCredentials';

export const LoginScreen = ({ lang, setLang, onLogin }) => {
  const t = T[lang];
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const validationError = validateCredentials({ email, password, mode: 'signin', lang });
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    onLogin(data.user);
  };

  const handleSignUp = async () => {
    const validationError = validateCredentials({ email, password, mode: 'signup', lang });
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signUp({ email, password });

    if (!err && data.user) {
      const initials = email ? email.substring(0, 2).toUpperCase() : 'U';

      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        full_name: '',
        phone: null,
        location: null,
        preferred_lang: 'EN',
        avatar_initials: initials,
      });

      if (profileError) {
        console.error('Profile creation failed:', profileError);
      }
    }

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.needsConfirmation) {
      Alert.alert(
        lang === 'SW' ? 'Angalia barua pepe yako' : 'Check your email',
        lang === 'SW'
          ? 'Tumekutumia kiungo cha kuthibitisha akaunti yako.'
          : "We've sent you a confirmation link to activate your account."
      );
      setMode('signin');
      return;
    }
    onLogin(data.user);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError(lang === 'SW' ? 'Weka barua pepe yako kwanza' : 'Enter your email first');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    Alert.alert(
      lang === 'SW' ? 'Barua pepe imetumwa' : 'Email sent',
      lang === 'SW'
        ? 'Angalia barua pepe yako kwa maagizo ya kuweka upya nywila.'
        : 'Check your email for password reset instructions.'
    );
  };

  return (
    <SafeAreaView style={styles.onboardRoot}>
      <StatusBar barStyle="light-content" backgroundColor={C.green} />
      <View style={styles.farmBg}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[styles.farmStrip, { opacity: 0.15 + i * 0.05 }]} />
        ))}
      </View>
      <View style={styles.onboardOverlay} />

      <ScrollView contentContainerStyle={styles.loginContent} keyboardShouldPersistTaps="handled">
        <LangToggle lang={lang} setLang={setLang} dark />

        <View style={styles.leafRow}>
          {['🌿', '🌱', '🍃'].map((e, i) => (
            <Text key={i} style={styles.leafEmoji}>
              {e}
            </Text>
          ))}
        </View>

        <Text style={styles.appName}>AgriSmart{'\n'}Kenya</Text>
        <Text style={styles.tagline}>{t.tagline}</Text>

        <View style={styles.loginCard}>
          <Text style={styles.loginLabel}>{t.email}</Text>
          <TextInput
            style={styles.loginInput}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={C.grey}
          />
          <Text style={styles.loginLabel}>{t.password}</Text>
          <TextInput
            style={styles.loginInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={C.grey}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={mode === 'signin' ? handleLogin : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {mode === 'signin' ? t.signIn : lang === 'SW' ? 'Fungua Akaunti' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'signin' && (
            <TouchableOpacity onPress={handleForgotPassword} style={{ marginBottom: 8 }}>
              <Text style={{ color: C.amber, fontSize: 13, textAlign: 'center' }}>
                {lang === 'SW' ? 'Umesahau nywila?' : 'Forgot password?'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
          >
            <Text style={{ color: C.white, fontSize: 13, textAlign: 'center', opacity: 0.85 }}>
              {mode === 'signin'
                ? lang === 'SW'
                  ? 'Huna akaunti? Fungua moja'
                  : "Don't have an account? Sign up"
                : lang === 'SW'
                ? 'Una akaunti tayari? Ingia'
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
