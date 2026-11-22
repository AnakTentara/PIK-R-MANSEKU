// lib/core/auth/auth_provider.dart
// Riverpod provider untuk state autentikasi

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/client.dart';
import '../api/endpoints.dart';
import 'secure_storage.dart';

// Model user yang sedang login
class AuthUser {
  final String id;
  final String username;
  final String? displayName;
  final String? avatar;
  final String? role;

  const AuthUser({
    required this.id,
    required this.username,
    this.displayName,
    this.avatar,
    this.role,
  });

  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
        id: j['id'] as String,
        username: (j['username'] ?? j['slug'] ?? '') as String,
        displayName: (j['displayName'] ?? j['name']) as String?,
        avatar: (j['avatar'] ?? j['photo']) as String?,
        role: j['role'] as String?,
      );

  factory AuthUser.fromRcMe(Map<String, dynamic> j) =>
      AuthUser.fromJson((j['user'] as Map<String, dynamic>?) ?? j);
}

// State autentikasi
sealed class AuthState {
  const AuthState();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthAuthenticated extends AuthState {
  final AuthUser user;
  const AuthAuthenticated(this.user);
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

// Notifier
class AuthNotifier extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    return _checkSession();
  }

  Future<AuthState> _checkSession() async {
    final token = await SecureStorage.getToken();
    if (token == null) return const AuthUnauthenticated();

    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get(Ep.me);
      final payload = res.data as Map<String, dynamic>;
      final user = AuthUser.fromRcMe(payload);
      return AuthAuthenticated(user);
    } catch (_) {
      await SecureStorage.clear();
      return const AuthUnauthenticated();
    }
  }

  Future<void> login(String username, String password) async {
    state = const AsyncLoading();
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.post(Ep.login, data: {
        'nisn': username,
        'password': password,
      });

      final token = res.data['token'] as String;
      await SecureStorage.setToken(token);

      // Login backend mengembalikan candidate; detail profil RC diambil dari /rc/me.
      final me = await dio.get(Ep.me);
      final user = AuthUser.fromRcMe(me.data as Map<String, dynamic>);
      await SecureStorage.setUserId(user.id);
      await SecureStorage.setUsername(user.username);

      state = AsyncData(AuthAuthenticated(user));
    } catch (e) {
      state = AsyncData(const AuthUnauthenticated());
      rethrow;
    }
  }

  Future<void> logout() async {
    try {} finally {
      await SecureStorage.clear();
      state = const AsyncData(AuthUnauthenticated());
    }
  }
}

final authProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
