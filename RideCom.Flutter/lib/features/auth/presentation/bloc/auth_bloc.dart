import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:ridecom_flutter/features/auth/presentation/bloc/auth_event.dart';
import 'package:ridecom_flutter/features/auth/presentation/bloc/auth_state.dart';
import 'package:ridecom_flutter/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:ridecom_flutter/core/services/storage_service.dart';

export 'auth_event.dart';
export 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepositoryImpl authRepository;

  AuthBloc({required this.authRepository}) : super(const AuthState()) {
    on<AuthCheckStatus>(_onAuthCheckStatus);
    on<AuthLoginRequested>(_onAuthLoginRequested);
    on<AuthRegisterRequested>(_onAuthRegisterRequested);
    on<AuthLogoutRequested>(_onAuthLogoutRequested);
    on<AuthTokenRefreshRequested>(_onAuthTokenRefreshRequested);
  }

  Future<void> _onAuthCheckStatus(
    AuthCheckStatus event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));
    
    try {
      final token = await StorageService.getAccessToken();
      if (token != null) {
        // TODO: Verify token with backend
        emit(state.copyWith(
          status: AuthStatus.authenticated,
          user: token, // For now, using token as user identifier
        ));
      } else {
        emit(state.copyWith(status: AuthStatus.unauthenticated));
      }
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onAuthLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));
    
    try {
      final result = await authRepository.login(
        email: event.email,
        password: event.password,
      );
      
      await StorageService.storeAccessToken(result['access_token']);
      if (result['refresh_token'] != null) {
        await StorageService.storeRefreshToken(result['refresh_token']);
      }
      
      emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: event.email,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onAuthRegisterRequested(
    AuthRegisterRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));
    
    try {
      final result = await authRepository.register(
        email: event.email,
        password: event.password,
        firstName: event.firstName,
        lastName: event.lastName,
      );
      
      await StorageService.storeAccessToken(result['access_token']);
      if (result['refresh_token'] != null) {
        await StorageService.storeRefreshToken(result['refresh_token']);
      }
      
      emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: event.email,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onAuthLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading));
    
    try {
      await authRepository.logout();
      await StorageService.clearTokens();
      
      emit(state.copyWith(
        status: AuthStatus.unauthenticated,
        user: null,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      ));
    }
  }

  Future<void> _onAuthTokenRefreshRequested(
    AuthTokenRefreshRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      final refreshToken = await StorageService.getRefreshToken();
      if (refreshToken != null) {
        final result = await authRepository.refreshToken(refreshToken);
        await StorageService.storeAccessToken(result['access_token']);
        
        if (result['refresh_token'] != null) {
          await StorageService.storeRefreshToken(result['refresh_token']);
        }
      }
    } catch (e) {
      add(AuthLogoutRequested());
    }
  }
}