import 'package:ridecom_flutter/core/services/http_service.dart';

class AuthRemoteDataSource {
  final HttpService httpService;

  AuthRemoteDataSource({required this.httpService});

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await httpService.post('/auth/login', data: {
      'email': email,
      'password': password,
    });

    if (response.statusCode == 200) {
      return response.data;
    } else {
      throw Exception('Login failed: ${response.statusMessage}');
    }
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    final response = await httpService.post('/auth/register', data: {
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
    });

    if (response.statusCode == 201) {
      return response.data;
    } else {
      throw Exception('Registration failed: ${response.statusMessage}');
    }
  }

  Future<void> logout() async {
    final response = await httpService.post('/auth/logout');
    
    if (response.statusCode != 200) {
      throw Exception('Logout failed: ${response.statusMessage}');
    }
  }

  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await httpService.post('/auth/refresh', data: {
      'refreshToken': refreshToken,
    });

    if (response.statusCode == 200) {
      return response.data;
    } else {
      throw Exception('Token refresh failed: ${response.statusMessage}');
    }
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await httpService.get('/auth/profile');

    if (response.statusCode == 200) {
      return response.data;
    } else {
      throw Exception('Failed to get profile: ${response.statusMessage}');
    }
  }

  Future<Map<String, dynamic>> updateProfile({
    required String firstName,
    required String lastName,
  }) async {
    final response = await httpService.put('/auth/profile', data: {
      'firstName': firstName,
      'lastName': lastName,
    });

    if (response.statusCode == 200) {
      return response.data;
    } else {
      throw Exception('Failed to update profile: ${response.statusMessage}');
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final response = await httpService.post('/auth/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });

    if (response.statusCode != 200) {
      throw Exception('Failed to change password: ${response.statusMessage}');
    }
  }
}