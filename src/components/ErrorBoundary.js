import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { styles } from '../styles/styles';
import { C } from '../theme/colors';

// Catches JS errors thrown during rendering anywhere below it in the tree
// and shows a recoverable screen instead of a blank white app. This does
// NOT catch errors inside async functions (e.g. a failed fetch inside an
// onPress handler) — those are already handled per-screen with try/catch
// and Alert.alert. This is specifically the last line of defense for
// unexpected render-time crashes.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: C.black, textAlign: 'center', marginBottom: 8 }}>
          Something went wrong
        </Text>
        <Text style={{ fontSize: 13, color: C.grey, textAlign: 'center', marginBottom: 20 }}>
          The app hit an unexpected error. Your data is safe — tap below to continue.
        </Text>
        <TouchableOpacity style={[styles.btnPrimary, { paddingHorizontal: 32 }]} onPress={this.handleReset}>
          <Text style={styles.btnPrimaryText}>Continue</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
}
