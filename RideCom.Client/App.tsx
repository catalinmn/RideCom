import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { AuthNavigator } from './src/components/auth/AuthNavigator';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        {isAuthenticated ? (
          <View style={styles.mainContent}>
            <Text style={styles.welcomeText}>
              Welcome to RideCom! 🏍️
            </Text>
            <Text style={styles.subText}>
              Authentication system is working! 
              {'\n'}Communication features will be added in the next tasks.
            </Text>
          </View>
        ) : (
          <AuthNavigator onAuthSuccess={handleAuthSuccess} />
        )}
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 16,
  },
  subText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});
