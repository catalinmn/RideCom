import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:ridecom_flutter/features/auth/presentation/screens/login_screen.dart';
import 'package:ridecom_flutter/features/auth/presentation/screens/register_screen.dart';
import 'package:ridecom_flutter/features/auth/presentation/screens/profile_screen.dart';
import 'package:ridecom_flutter/features/home/presentation/screens/home_screen.dart';

class AppRouter {
  static const String login = '/login';
  static const String register = '/register';
  static const String profile = '/profile';
  static const String home = '/';

  static final GoRouter router = GoRouter(
    initialLocation: home,
    routes: <RouteBase>[
      GoRoute(
        path: home,
        builder: (BuildContext context, GoRouterState state) {
          return const HomeScreen();
        },
      ),
      GoRoute(
        path: login,
        builder: (BuildContext context, GoRouterState state) {
          return const LoginScreen();
        },
      ),
      GoRoute(
        path: register,
        builder: (BuildContext context, GoRouterState state) {
          return const RegisterScreen();
        },
      ),
      GoRoute(
        path: profile,
        builder: (BuildContext context, GoRouterState state) {
          return const ProfileScreen();
        },
      ),
    ],
  );
}