# RideCom Flutter

A Flutter implementation of the RideCom motorcycle communication app, migrated from React Native.

## Overview

RideCom Flutter is a cross-platform mobile application built with Flutter that enables real-time communication between motorcycle riders. This is a migration from the original React Native implementation to provide better performance and a more consistent user experience across platforms.

## Features

### Current Features
- ✅ User Authentication (Login/Register)
- ✅ User Profile Management
- ✅ Modern Flutter UI with Material Design 3
- ✅ State Management with BLoC
- ✅ Secure Token Storage
- ✅ Clean Architecture Pattern

### Planned Features
- 🚧 Real-time Voice Communication (WebRTC)
- 🚧 Group Management
- 🚧 Location Sharing
- 🚧 Push Notifications
- 🚧 Background Audio Processing
- 🚧 Offline Capabilities

## Architecture

The project follows Clean Architecture principles with the following structure:

```
lib/
├── core/
│   ├── config/         # App configuration
│   ├── router/         # Navigation routing
│   ├── services/       # Core services (HTTP, Storage)
│   └── theme/          # App theming
├── features/
│   ├── auth/           # Authentication feature
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   └── repositories/
│   │   └── presentation/
│   │       ├── bloc/
│   │       ├── screens/
│   │       └── widgets/
│   └── home/           # Home feature
└── shared/
    └── widgets/        # Reusable UI components
```

## Dependencies

### Main Dependencies
- `flutter_bloc` - State management
- `go_router` - Navigation
- `dio` - HTTP client
- `shared_preferences` - Local storage
- `flutter_secure_storage` - Secure token storage
- `socket_io_client` - Real-time communication
- `flutter_webrtc` - WebRTC for voice communication

### Dev Dependencies
- `flutter_lints` - Linting rules
- `build_runner` - Code generation

## Getting Started

### Prerequisites
- Flutter SDK (>=3.0.0)
- Dart SDK (>=3.0.0)
- Android Studio / VS Code
- Android SDK / Xcode (for mobile development)

### Installation

1. **Install Flutter**: Follow the [official Flutter installation guide](https://flutter.dev/docs/get-started/install)

2. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd RideCom/RideCom.Flutter
   ```

3. **Install dependencies**:
   ```bash
   flutter pub get
   ```

4. **Run the app**:
   ```bash
   # For development
   flutter run
   
   # For specific platform
   flutter run -d android
   flutter run -d ios
   flutter run -d web
   ```

## Configuration

### Backend Connection
Update the API base URL in `lib/core/config/app_config.dart`:

```dart
static const String baseUrl = 'http://your-backend-url:3000';
```

### TURN Server Configuration
Configure the TURN server settings for WebRTC in `lib/core/config/app_config.dart`:

```dart
static const String turnServerUrl = 'turn:your-turn-server:3478';
static const String turnServerUsername = 'your-username';
static const String turnServerCredential = 'your-password';
```

## Development

### Adding New Features
1. Create feature directory under `lib/features/`
2. Follow the Clean Architecture pattern
3. Use BLoC for state management
4. Add necessary tests

### Code Style
- Follow [Effective Dart](https://dart.dev/guides/language/effective-dart) guidelines
- Use `flutter analyze` to check for issues
- Format code with `dart format`

## Migration from React Native

### Completed Migrations
- [x] Project structure and dependencies
- [x] Authentication flow
- [x] Basic UI components
- [x] Navigation system
- [x] State management (Redux → BLoC)

### Pending Migrations
- [ ] WebRTC integration
- [ ] Socket.IO real-time communication
- [ ] Background audio processing
- [ ] Permission handling
- [ ] Push notifications

## Testing

```bash
# Run unit tests
flutter test

# Run integration tests
flutter test integration_test/

# Generate coverage report
flutter test --coverage
```

## Building for Production

### Android
```bash
flutter build apk --release
# or
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

### Web
```bash
flutter build web --release
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## Migration Notes

This Flutter implementation aims to maintain feature parity with the original React Native version while providing:
- Better performance
- More consistent UI across platforms
- Easier maintenance and development
- Better tooling and debugging support

The migration follows a incremental approach, allowing both versions to coexist during the transition period.