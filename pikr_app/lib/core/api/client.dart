// lib/core/api/client.dart
// Dio HTTP client dengan JWT interceptor + auto-refresh

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/secure_storage.dart';

const _baseUrl = 'https://pikr-manseku.my.id/api';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: _baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 60),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  ));

  dio.interceptors.add(AuthInterceptor(dio, ref));
  return dio;
});

class AuthInterceptor extends Interceptor {
  AuthInterceptor(Dio _, Ref __);

  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await SecureStorage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // RC token berumur 7 hari dan backend tidak memiliki refresh endpoint.
    // Jangan mencoba /auth/refresh; bersihkan sesi agar user bisa login lagi.
    if (err.response?.statusCode == 401) {
      await SecureStorage.clear();
    }
    handler.next(err);
  }
}
