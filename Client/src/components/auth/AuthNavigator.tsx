import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { loadStoredAuth } from '../../store/slices/authSlice';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { RegisterScreen } from '../../screens/auth/RegisterScreen';
import { ProfileScreen } from '../../screens/auth/ProfileScreen';
import { LoadingSpinner } from '../common/LoadingSpinner';

type AuthScreen = 'login' | 'register' | 'profile';

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await dispatch(loadStoredAuth()).unwrap();
      } catch (error) {
        // User is not authenticated, stay on login screen
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentScreen('profile');
    }
  }, [isAuthenticated]);

  const handleNavigateToRegister = () => {
    setCurrentScreen('register');
  };

  const handleNavigateToLogin = () => {
    setCurrentScreen('login');
  };

  const handleAuthSuccess = () => {
    setCurrentScreen('profile');
    onAuthSuccess();
  };

  const handleLogout = () => {
    setCurrentScreen('login');
  };

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Initializing..." />
      </View>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onNavigateToRegister={handleNavigateToRegister}
            onLoginSuccess={handleAuthSuccess}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onNavigateToLogin={handleNavigateToLogin}
            onRegisterSuccess={handleAuthSuccess}
          />
        );
      case 'profile':
        return <ProfileScreen onLogout={handleLogout} />;
      default:
        return (
          <LoginScreen
            onNavigateToRegister={handleNavigateToRegister}
            onLoginSuccess={handleAuthSuccess}
          />
        );
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});