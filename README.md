# Motorcycle Rider Communication App

A real-time voice communication app for motorcycle riders using React Native and WebRTC.

## Features

- Real-time group voice communication (4-8 riders)
- Cross-platform mobile app (iOS & Android)
- JWT-based authentication with refresh tokens
- User profile management
- Automatic reconnection with exponential backoff
- Background operation support
- Battery optimization
- Voice activity detection and noise suppression
- Secure room-based communication

## Architecture

- **Frontend**: React Native with TypeScript (Expo)
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL + Redis
- **Authentication**: JWT with refresh tokens
- **Real-time Communication**: WebRTC + Socket.io
- **TURN Server**: Coturn (for NAT traversal)

## Monorepo Structure

This is a monorepo containing both the client and server applications:

```
motorcycle-rider-comm/
├── Client/                    # React Native app (Expo)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── screens/           # App screens
│   │   ├── services/          # API and WebRTC services
│   │   ├── store/             # Redux store and slices
│   │   ├── utils/             # Utility functions
│   │   └── hooks/             # Custom React hooks
│   └── package.json
├── Server/                    # NestJS backend
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── database/          # Database entities and services
│   │   ├── redis/             # Redis configuration and services
│   │   └── modules/           # Feature modules
│   └── package.json
├── docker-compose.yml         # Development services
├── package.json               # Root package.json with workspace scripts
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- React Native development environment
- **Android Development:**
  - Android Studio with Android SDK
  - Java Development Kit (JDK 11+)
  - Android emulator or physical device
- **iOS Development (macOS only):**
  - Xcode 12+
  - iOS Simulator or physical device

### Development Setup

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd motorcycle-rider-comm
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Start development services:**
   ```bash
   npm run docker:up
   ```

4. **Start both client and server in development mode:**
   ```bash
   npm run dev
   ```

   Or start them individually:
   ```bash
   # Terminal 1 - Start backend
   npm run dev:server
   
   # Terminal 2 - Start frontend
   npm run dev:client
   ```

### Manual Setup

If you prefer to set up manually:

1. **Start databases:**
   ```bash
   docker-compose up -d postgres redis coturn
   ```

2. **Install dependencies:**
   ```bash
   # Backend
   cd server && npm install
   
   # Frontend
   cd ../MotorcycleRiderComm && npm install
   ```

3. **Configure environment:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Available Scripts

### Root Level (Monorepo Management)
- `npm run install:all` - Install dependencies for both client and server
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server for production
- `npm run test` - Run tests for both client and server
- `npm run lint` - Lint both client and server code
- `npm run docker:up` - Start development services (PostgreSQL, Redis, TURN server)
- `npm run docker:down` - Stop development services
- `npm run docker:reset` - Reset development services (removes volumes)

## Development Services

The development environment includes:

- **PostgreSQL**: `localhost:5432`
  - Database: `motorcycle_comm`
  - User: `postgres`
  - Password: `password`

- **Redis**: `localhost:6379`

- **TURN Server**: `localhost:3478`
  - Username: `testuser`
  - Password: `testpass`

- **NestJS API**: `localhost:3000`

### Backend (Server/)
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run db:setup` - Start databases
- `npm run db:reset` - Reset databases

### Frontend (Client/)
- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web (development)
- `npm run test` - Run tests

## Configuration

### Backend Configuration (Server/.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=motorcycle_comm

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=3000

# STUN/TURN Server Configuration
STUN_SERVER_URL=stun:stun.l.google.com:19302
TURN_SERVER_URL=turn:localhost:3478
TURN_USERNAME=testuser
TURN_PASSWORD=testpass
```

### Frontend Configuration
The client app automatically connects to the backend API. Configuration can be found in `Client/src/services/AuthService.ts`.

## Testing

Run tests for both backend and frontend:

```bash
# Run all tests (from root)
npm run test

# Backend tests only
npm run test:server

# Frontend tests only
npm run test:client

# Or run individually
cd Server && npm test
cd Client && npm test
```

## Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy using Docker or your preferred method

### Mobile App Deployment
1. Build for production: `npm run build:android` or `npm run build:ios`
2. Follow React Native deployment guides for app stores

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

[Your License Here]

## Troubleshooting

### Android Setup Issues

**"Failed to resolve the Android SDK path"**
1. Install Android Studio from https://developer.android.com/studio
2. Run the Android environment setup script: `setup-android-env.bat`
3. Restart your terminal/command prompt
4. Verify with: `adb version`

**"adb is not recognized as an internal or external command"**
1. Ensure Android SDK is installed
2. Run `setup-android-env.bat` or `setup-android-env.ps1`
3. Add to system PATH: `%ANDROID_HOME%\platform-tools`
4. Restart terminal

**"No Android connected device found"**
1. **For Emulator:**
   - Open Android Studio
   - Go to Tools > AVD Manager
   - Create and start a virtual device
2. **For Physical Device:**
   - Enable Developer Options
   - Enable USB Debugging
   - Connect via USB
   - Run: `adb devices`

**"CommandError: No Android connected device found, and no emulators could be started automatically"**
1. Start an Android emulator manually in Android Studio
2. Or connect a physical Android device with USB debugging enabled
3. Verify device is detected: `adb devices`
4. Try running: `npx expo run:android`

**Expo Package Version Conflicts**
```bash
cd Client
npx expo install --fix
```

### General Issues

**Port conflicts:**
- Backend (3000): Change in `Server/.env`
- Database (5432): Change in `docker-compose.yml`
- Redis (6379): Change in `docker-compose.yml`

**Database connection issues:**
```bash
docker-compose down -v
docker-compose up -d postgres redis
```

## Support

For issues and questions, please create an issue in the repository.