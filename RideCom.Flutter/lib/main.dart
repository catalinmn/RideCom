import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:ridecom_flutter/core/theme/app_theme.dart';
import 'package:ridecom_flutter/core/router/app_router.dart';
import 'package:ridecom_flutter/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:ridecom_flutter/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:ridecom_flutter/features/auth/data/datasources/auth_remote_data_source.dart';
import 'package:ridecom_flutter/core/services/http_service.dart';
import 'package:ridecom_flutter/core/services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize services
  await StorageService.init();
  
  runApp(RideComApp());
}

class RideComApp extends StatelessWidget {
  RideComApp({super.key});

  final GoRouter _router = AppRouter.router;

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => AuthBloc(
            authRepository: AuthRepositoryImpl(
              remoteDataSource: AuthRemoteDataSource(
                httpService: HttpService(),
              ),
            ),
          )..add(AuthCheckStatus()),
        ),
      ],
      child: MaterialApp.router(
        title: 'RideCom',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}