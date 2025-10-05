class AppConfig {
  static const String appName = 'RideCom';
  static const String version = '1.0.0';
  
  // API Configuration
  static const String baseUrl = 'http://localhost:3000'; // Update this to match your NestJS service
  static const String apiVersion = 'v1';
  
  // WebRTC Configuration
  static const String turnServerUrl = 'turn:localhost:3478';
  static const String turnServerUsername = 'testuser';
  static const String turnServerCredential = 'testpass';
  
  // Socket.IO Configuration
  static const String socketUrl = 'http://localhost:3000';
  
  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
  
  // Timeouts
  static const Duration httpTimeout = Duration(seconds: 30);
  static const Duration socketTimeout = Duration(seconds: 10);
}