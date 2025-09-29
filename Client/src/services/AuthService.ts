import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types/auth.types';
import { AppConfig } from '../config/app.config';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

export class AuthService {
  private static baseUrl = AppConfig.SIGNALING_SERVER_URL;

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store tokens securely
      await this.storeTokens(data.token, data.refreshToken);
      await this.storeUserData(data.user);

      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store tokens securely
      await this.storeTokens(data.token, data.refreshToken);
      await this.storeUserData(data.user);

      return data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Store new tokens
      await this.storeTokens(data.token, data.refreshToken);

      return data;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  static async logout(): Promise<void> {
    try {
      // Clear stored tokens and user data
      await this.clearStoredAuth();
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  static async getStoredAuth(): Promise<AuthResponse | null> {
    try {
      const [tokenData, userData] = await Promise.all([
        this.getStoredTokens(),
        this.getStoredUserData(),
      ]);

      if (tokenData && userData) {
        return {
          user: userData,
          token: tokenData.token,
          refreshToken: tokenData.refreshToken,
        };
      }

      return null;
    } catch (error: any) {
      console.error('Error loading stored auth:', error);
      return null;
    }
  }

  static async getStoredToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(AUTH_TOKEN_KEY);
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  private static async storeTokens(token: string, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        Keychain.setInternetCredentials(AUTH_TOKEN_KEY, 'token', token),
        Keychain.setInternetCredentials(REFRESH_TOKEN_KEY, 'refreshToken', refreshToken),
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  private static async getStoredTokens(): Promise<{ token: string; refreshToken: string } | null> {
    try {
      const [tokenCredentials, refreshCredentials] = await Promise.all([
        Keychain.getInternetCredentials(AUTH_TOKEN_KEY),
        Keychain.getInternetCredentials(REFRESH_TOKEN_KEY),
      ]);

      if (tokenCredentials && refreshCredentials) {
        return {
          token: tokenCredentials.password,
          refreshToken: refreshCredentials.password,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting stored tokens:', error);
      return null;
    }
  }

  private static async storeUserData(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  }

  private static async getStoredUserData(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user data:', error);
      return null;
    }
  }

  private static async clearStoredAuth(): Promise<void> {
    try {
      // Clear keychain credentials
      try {
        await Keychain.resetInternetCredentials({ server: AUTH_TOKEN_KEY });
      } catch (error) {
        // Ignore if credentials don't exist
      }
      
      try {
        await Keychain.resetInternetCredentials({ server: REFRESH_TOKEN_KEY });
      } catch (error) {
        // Ignore if credentials don't exist
      }
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing stored auth:', error);
      throw error;
    }
  }
}