// lib/core/auth/secure_storage.dart
// Wrapper untuk flutter_secure_storage — simpan JWT

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  static const _keyToken = 'pikr_token';
  static const _keyRefresh = 'pikr_refresh';
  static const _keyUserId = 'pikr_user_id';
  static const _keyUsername = 'pikr_username';

  static Future<void> setToken(String token) =>
      _storage.write(key: _keyToken, value: token);

  static Future<String?> getToken() => _storage.read(key: _keyToken);

  static Future<void> setRefreshToken(String token) =>
      _storage.write(key: _keyRefresh, value: token);

  static Future<String?> getRefreshToken() => _storage.read(key: _keyRefresh);

  static Future<void> setUserId(String id) =>
      _storage.write(key: _keyUserId, value: id);

  static Future<String?> getUserId() => _storage.read(key: _keyUserId);

  static Future<void> setUsername(String username) =>
      _storage.write(key: _keyUsername, value: username);

  static Future<String?> getUsername() => _storage.read(key: _keyUsername);

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }

  static Future<void> clear() => _storage.deleteAll();
}
