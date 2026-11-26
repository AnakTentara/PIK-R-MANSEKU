import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String kPortalBaseUrl = 'https://pikr-manseku.my.id';
const String kCeritaBaseUrl = 'https://ruang-cerita.pikr-manseku.my.id';

const String _broadcastChannelId = 'pikr_ruang_cerita_broadcast';
const String _activityChannelId = 'pikr_ruang_cerita_activity';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  await PikrNotificationService.handleBackgroundFcmMessage(message);
}

class PikrNotificationService {
  PikrNotificationService._();
  static final PikrNotificationService instance = PikrNotificationService._();

  static const MethodChannel _nativeChannel = MethodChannel('org.pikrmanseku.app/notifications');

  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;
  bool _fcmReady = false;

  String? _deviceId;
  String? _fcmToken;
  String? _authToken;
  void Function(String resolvedUrl)? _onNavigateUrl;

  http.Client? _sseClient;
  bool _sseRunning = false;
  Timer? _pollTimer;
  Timer? _reconnectTimer;

  static Future<void> handleBackgroundFcmMessage(RemoteMessage message) async {
    final data = message.data;
    final title = message.notification?.title ?? data['title']?.toString() ?? 'Ruang Cerita';
    final body = message.notification?.body ?? data['body']?.toString() ?? '';
    final id = data['id']?.toString() ?? message.messageId ?? 'fcm_${DateTime.now().millisecondsSinceEpoch}';
    final url = data['url']?.toString() ?? '/';
    final category = data['category']?.toString() ?? 'UMUM';

    final plugin = FlutterLocalNotificationsPlugin();
    const androidInit = AndroidInitializationSettings('@drawable/ic_stat_pikr');
    await plugin.initialize(const InitializationSettings(android: androidInit));
    await _ensureChannels(plugin);

    // Apabila FCM sudah membawa blok `notification` dan app ditutup, Android menampilkannya otomatis;
    // kita hanya perlu mencatat ID agar sync/SSE tidak mengulangi notifikasi yang sama.
    final prefs = await SharedPreferences.getInstance();
    await _markIdSeen(prefs, id);

    if (message.notification == null && title.isNotEmpty) {
      await _showSystemNotification(
        plugin,
        id: id,
        title: title,
        body: body,
        targetUrl: url,
        category: category,
      );
    }
  }

  Future<String?> init({required void Function(String resolvedUrl) onNavigateUrl}) async {
    _onNavigateUrl = onNavigateUrl;
    String? launchTargetUrl;

    if (!_initialized) {
      _initialized = true;
      const androidInit = AndroidInitializationSettings('@drawable/ic_stat_pikr');
      await _localNotifications.initialize(
        const InitializationSettings(android: androidInit),
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          final payload = response.payload;
          if (payload != null && payload.isNotEmpty) {
            _dispatchNavigation(payload);
          }
        },
      );

      await _ensureChannels(_localNotifications);

      final launchDetails = await _localNotifications.getNotificationAppLaunchDetails();
      if (launchDetails?.didNotificationLaunchApp == true) {
        final p = launchDetails?.notificationResponse?.payload;
        if (p != null && p.isNotEmpty) {
          launchTargetUrl = resolveTargetUrl(p);
        }
      }

      // Tangkap klik notifikasi dari Kotlin NotificationPollWorker
      _nativeChannel.setMethodCallHandler((call) async {
        if (call.method == 'onOpenTargetUrl') {
          final raw = call.arguments?.toString();
          if (raw != null && raw.isNotEmpty) {
            _dispatchNavigation(raw);
          }
        }
      });

      try {
        final workerLaunch = await _nativeChannel.invokeMethod<String>('getInitialTargetUrl');
        if (workerLaunch != null && workerLaunch.isNotEmpty) {
          launchTargetUrl = resolveTargetUrl(workerLaunch);
        }
      } catch (_) {}
    }

    await _ensureDeviceId();
    await _initFirebaseSafely();
    await registerDevice();
    await syncPending();

    _connectSse();
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 25), (_) {
      syncPending();
    });

    return launchTargetUrl;
  }

  Future<void> _ensureDeviceId() async {
    if (_deviceId != null) return;
    final prefs = await SharedPreferences.getInstance();
    var stored = prefs.getString('pikr_device_id');
    if (stored == null || stored.isEmpty) {
      stored = _generateUuidV4();
      await prefs.setString('pikr_device_id', stored);
    }
    _deviceId = stored;

    if (!prefs.containsKey('pikr_last_poll_since')) {
      // Mulai memantau siaran baru sejak aplikasi pertama kali dibuka
      await prefs.setString('pikr_last_poll_since', DateTime.now().toUtc().toIso8601String());
    }
  }

  Future<void> _initFirebaseSafely() async {
    try {
      await Firebase.initializeApp();
      _fcmReady = true;
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      final messaging = FirebaseMessaging.instance;
      _fcmToken = await messaging.getToken();

      messaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        registerDevice();
      });

      FirebaseMessaging.onMessage.listen((RemoteMessage msg) async {
        final data = msg.data;
        final id = data['id']?.toString() ?? msg.messageId ?? 'fcm_${DateTime.now().millisecondsSinceEpoch}';
        final title = msg.notification?.title ?? data['title']?.toString() ?? 'Ruang Cerita';
        final body = msg.notification?.body ?? data['body']?.toString() ?? '';
        final url = data['url']?.toString() ?? '/';
        final category = data['category']?.toString() ?? 'UMUM';
        final image = data['image']?.toString() ?? msg.notification?.android?.imageUrl;

        await showIncomingNotification(
          id: id,
          title: title,
          body: body,
          targetUrl: url,
          category: category,
          imageUrl: image,
        );
      });

      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage msg) {
        final url = msg.data['url']?.toString();
        if (url != null && url.isNotEmpty) {
          _dispatchNavigation(url);
        }
      });

      final initialMsg = await messaging.getInitialMessage();
      if (initialMsg != null) {
        final url = initialMsg.data['url']?.toString();
        if (url != null && url.isNotEmpty) {
          _dispatchNavigation(url);
        }
      }
      debugPrint('[PikrNotif] FCM siap (token=${_fcmToken != null ? "ada" : "kosong"}).');
    } catch (e) {
      _fcmReady = false;
      debugPrint('[PikrNotif] Mode Self-Hosted SSE + Sync aktif (google-services.json belum dipasang).');
    }
  }

  Future<void> updateAuthToken(String? token) async {
    final normalized = (token != null && token.trim().isNotEmpty) ? token.trim() : null;
    if (_authToken == normalized) return;
    _authToken = normalized;

    await registerDevice(clearMember: normalized == null);
    // Sambungkan ulang SSE supaya stream personal anggota (/api/rc) langsung aktif
    _restartSse();
  }

  Future<void> registerDevice({bool clearMember = false}) async {
    await _ensureDeviceId();
    if (_deviceId == null) return;

    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (_authToken != null) {
        headers['Authorization'] = 'Bearer $_authToken';
      }

      await http
          .post(
            Uri.parse('$kPortalBaseUrl/api/push/app/register'),
            headers: headers,
            body: jsonEncode({
              'deviceId': _deviceId,
              'platform': Platform.isIOS ? 'ios' : 'android',
              'appVersion': '1.0.0',
              'deviceName': Platform.isAndroid ? 'Android App (${Platform.operatingSystemVersion})' : 'iOS App',
              'fcmToken': _fcmToken,
              if (clearMember) 'clearMember': true,
            }),
          )
          .timeout(const Duration(seconds: 8));
    } catch (e) {
      debugPrint('[PikrNotif] registerDevice gagal: $e');
    }
  }

  void _restartSse() {
    _reconnectTimer?.cancel();
    _sseRunning = false;
    _sseClient?.close();
    _sseClient = null;
    _connectSse();
  }

  Future<void> _connectSse() async {
    if (_sseRunning) return;
    await _ensureDeviceId();
    if (_deviceId == null) return;

    _sseRunning = true;
    _sseClient = http.Client();

    try {
      final queryParams = <String, String>{
        'deviceId': _deviceId!,
        if (_authToken != null) 'token': _authToken!,
      };
      final uri = Uri.parse('$kPortalBaseUrl/api/push/app/stream').replace(queryParameters: queryParams);
      final req = http.Request('GET', uri);
      req.headers['Accept'] = 'text/event-stream';
      req.headers['Cache-Control'] = 'no-cache';

      final res = await _sseClient!.send(req);
      if (res.statusCode != 200) {
        throw HttpException('SSE status ${res.statusCode}');
      }

      String eventType = 'message';
      final dataBuf = StringBuffer();

      res.stream.transform(const Utf8Decoder()).transform(const LineSplitter()).listen(
        (line) {
          if (line.startsWith('event:')) {
            eventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            dataBuf.write(line.substring(5).trim());
          } else if (line.isEmpty && dataBuf.isNotEmpty) {
            final raw = dataBuf.toString();
            dataBuf.clear();
            _handleSseEvent(eventType, raw);
            eventType = 'message';
          }
        },
        onDone: () => _scheduleSseReconnect(),
        onError: (_) => _scheduleSseReconnect(),
        cancelOnError: true,
      );
    } catch (e) {
      debugPrint('[PikrNotif] SSE koneksi terputus: $e');
      _scheduleSseReconnect();
    }
  }

  void _scheduleSseReconnect() {
    _sseRunning = false;
    _sseClient?.close();
    _sseClient = null;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 4), _connectSse);
  }

  Future<void> _handleSseEvent(String eventType, String rawData) async {
    if (eventType != 'broadcast' && eventType != 'rc') return;
    try {
      final parsed = jsonDecode(rawData);
      if (parsed is! Map<String, dynamic>) return;

      final id = parsed['id']?.toString() ?? 'sse_${DateTime.now().millisecondsSinceEpoch}';
      final title = parsed['title']?.toString() ?? 'Ruang Cerita';
      final body = parsed['body']?.toString() ?? '';
      final url = parsed['url']?.toString() ?? '/';
      final category = parsed['category']?.toString() ?? (eventType == 'rc' ? 'RUANG_CERITA' : 'UMUM');
      final image = parsed['image']?.toString();

      await showIncomingNotification(
        id: id,
        title: title,
        body: body,
        targetUrl: url,
        category: category,
        imageUrl: image,
      );
    } catch (e) {
      debugPrint('[PikrNotif] Gagal parse event SSE: $e');
    }
  }

  Future<void> syncPending() async {
    await _ensureDeviceId();
    if (_deviceId == null) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final since = prefs.getString('pikr_last_poll_since');
      final uri = Uri.parse('$kPortalBaseUrl/api/push/app/pending').replace(queryParameters: {
        'deviceId': _deviceId!,
        if (since != null && since.isNotEmpty) 'since': since,
      });

      final res = await http.get(uri).timeout(const Duration(seconds: 8));
      if (res.statusCode != 200) return;

      final json = jsonDecode(res.body);
      if (json is! Map<String, dynamic>) return;

      final items = json['items'];
      final serverTime = json['serverTime']?.toString();

      if (items is List) {
        for (final item in items) {
          if (item is! Map) continue;
          final id = item['id']?.toString() ?? '';
          if (id.isEmpty) continue;
          await showIncomingNotification(
            id: id,
            title: item['title']?.toString() ?? 'Ruang Cerita',
            body: item['body']?.toString() ?? '',
            targetUrl: item['url']?.toString() ?? '/',
            category: item['category']?.toString() ?? 'UMUM',
            imageUrl: item['image']?.toString(),
          );
        }
      }

      if (serverTime != null && serverTime.isNotEmpty) {
        await prefs.setString('pikr_last_poll_since', serverTime);
      }
    } catch (_) {}
  }

  Future<void> onAppResumed() async {
    await syncPending();
    if (!_sseRunning) {
      _connectSse();
    }
  }

  Future<void> showIncomingNotification({
    required String id,
    required String title,
    required String body,
    required String targetUrl,
    String category = 'UMUM',
    String? imageUrl,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final alreadySeen = await _isIdSeen(prefs, id);
    if (alreadySeen) return;
    await _markIdSeen(prefs, id);

    await _showSystemNotification(
      _localNotifications,
      id: id,
      title: title,
      body: body,
      targetUrl: targetUrl,
      category: category,
      imageUrl: imageUrl,
    );
  }

  static Future<void> _ensureChannels(FlutterLocalNotificationsPlugin plugin) async {
    final android = plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (android == null) return;

    await android.createNotificationChannel(const AndroidNotificationChannel(
      _broadcastChannelId,
      'Pengumuman & Siaran Ruang Cerita',
      description: 'Notifikasi resmi dari pengurus PIK-R MANSEKU',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
    ));

    await android.createNotificationChannel(const AndroidNotificationChannel(
      _activityChannelId,
      'Aktivitas & Pesan Ruang Cerita',
      description: 'Pesan DM, komentar, pengikut baru, dan bilik konseling',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    ));
  }

  static Future<void> _showSystemNotification(
    FlutterLocalNotificationsPlugin plugin, {
    required String id,
    required String title,
    required String body,
    required String targetUrl,
    required String category,
    String? imageUrl,
  }) async {
    final channelId = category == 'RUANG_CERITA' ? _activityChannelId : _broadcastChannelId;
    final channelName = category == 'RUANG_CERITA'
        ? 'Aktivitas & Pesan Ruang Cerita'
        : 'Pengumuman & Siaran Ruang Cerita';

    StyleInformation style = BigTextStyleInformation(body);
    if (imageUrl != null && imageUrl.trim().isNotEmpty) {
      final absImage = imageUrl.startsWith('http')
          ? imageUrl
          : '$kPortalBaseUrl${imageUrl.startsWith('/') ? '' : '/'}$imageUrl';
      try {
        final imgRes = await http.get(Uri.parse(absImage)).timeout(const Duration(seconds: 4));
        if (imgRes.statusCode == 200 && imgRes.bodyBytes.isNotEmpty) {
          style = BigPictureStyleInformation(
            ByteArrayAndroidBitmap(imgRes.bodyBytes),
            largeIcon: const DrawableResourceAndroidBitmap('@mipmap/ic_launcher'),
            contentTitle: title,
            summaryText: body,
          );
        }
      } catch (_) {}
    }

    final details = AndroidNotificationDetails(
      channelId,
      channelName,
      importance: Importance.max,
      priority: Priority.high,
      icon: '@drawable/ic_stat_pikr',
      largeIcon: const DrawableResourceAndroidBitmap('@mipmap/ic_launcher'),
      color: const Color(0xFFF97316),
      styleInformation: style,
      playSound: true,
      enableVibration: true,
    );

    final notifId = id.hashCode & 0x7FFFFFFF;
    await plugin.show(
      notifId,
      title,
      body,
      NotificationDetails(android: details),
      payload: targetUrl,
    );
  }

  void _dispatchNavigation(String rawUrl) {
    final resolved = resolveTargetUrl(rawUrl);
    _onNavigateUrl?.call(resolved);
  }

  static String resolveTargetUrl(String rawUrl) {
    final trimmed = rawUrl.trim();
    if (trimmed.isEmpty || trimmed == '/') return kCeritaBaseUrl;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    final normalizedPath = trimmed.startsWith('/') ? trimmed : '/$trimmed';
    // Rute portal utama PIK-R MANSEKU (detail notifikasi push, jadwal pertemuan, berita, blog, unduhan)
    const portalPrefixes = ['/push', '/berita', '/blog', '/daftar', '/cek-kelulusan', '/downloads', '/kami', '/anggota', '/alumni'];
    if (portalPrefixes.any((p) => normalizedPath == p || normalizedPath.startsWith('$p/'))) {
      return '$kPortalBaseUrl$normalizedPath';
    }
    return '$kCeritaBaseUrl$normalizedPath';
  }

  static Future<bool> _isIdSeen(SharedPreferences prefs, String id) async {
    final raw = prefs.getString('pikr_seen_notif_json');
    if (raw == null || raw.isEmpty) return false;
    try {
      final list = jsonDecode(raw);
      if (list is List) return list.contains(id);
    } catch (_) {}
    return false;
  }

  static Future<void> _markIdSeen(SharedPreferences prefs, String id) async {
    List<dynamic> list = [];
    final raw = prefs.getString('pikr_seen_notif_json');
    if (raw != null && raw.isNotEmpty) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is List) list = List<dynamic>.from(decoded);
      } catch (_) {}
    }
    if (!list.contains(id)) {
      list.add(id);
      if (list.length > 150) {
        list = list.sublist(list.length - 150);
      }
      await prefs.setString('pikr_seen_notif_json', jsonEncode(list));
    }
  }

  static String _generateUuidV4() {
    final rng = Random.secure();
    final bytes = List<int>.generate(16, (_) => rng.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
  }

  bool get isFcmReady => _fcmReady;

  void dispose() {
    _pollTimer?.cancel();
    _reconnectTimer?.cancel();
    _sseRunning = false;
    _sseClient?.close();
  }
}
