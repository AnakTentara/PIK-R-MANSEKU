// lib/core/live/sse_client.dart
// Server-Sent Events client untuk notifikasi realtime

import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../auth/secure_storage.dart';

const _sseBase = 'https://pikr-manseku.my.id/api/rc/stream';

class SseEvent {
  final String type;
  final Map<String, dynamic> data;
  const SseEvent({required this.type, required this.data});
}

class SseClient {
  StreamController<SseEvent>? _controller;
  http.Client? _httpClient;
  bool _connected = false;

  Stream<SseEvent> get stream {
    _controller ??= StreamController<SseEvent>.broadcast();
    return _controller!.stream;
  }

  Future<void> connect() async {
    if (_connected) return;
    _connected = true;
    _controller ??= StreamController<SseEvent>.broadcast();

    final token = await SecureStorage.getToken();
    if (token == null) {
      _connected = false;
      return;
    }

    _httpClient = http.Client();
    final req = http.Request(
        'GET', Uri.parse('$_sseBase?token=${Uri.encodeQueryComponent(token)}'));
    req.headers['Accept'] = 'text/event-stream';
    req.headers['Cache-Control'] = 'no-cache';

    try {
      final res = await _httpClient!.send(req);
      String eventType = 'message';
      final buf = StringBuffer();

      res.stream
          .transform(const Utf8Decoder())
          .transform(const LineSplitter())
          .listen(
        (line) {
          if (line.startsWith('event:')) {
            eventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            buf.write(line.substring(5).trim());
          } else if (line.isEmpty && buf.isNotEmpty) {
            try {
              final json = jsonDecode(buf.toString());
              _controller?.add(SseEvent(
                type: eventType,
                data: json is Map<String, dynamic> ? json : {'raw': json},
              ));
            } catch (_) {}
            buf.clear();
            eventType = 'message';
          }
        },
        onDone: () {
          _connected = false;
          // Auto-reconnect setelah 3 detik
          Future.delayed(const Duration(seconds: 3), connect);
        },
        onError: (_) {
          _connected = false;
          Future.delayed(const Duration(seconds: 5), connect);
        },
      );
    } catch (_) {
      _connected = false;
      Future.delayed(const Duration(seconds: 5), connect);
    }
  }

  void disconnect() {
    _connected = false;
    _httpClient?.close();
    _httpClient = null;
  }

  void dispose() {
    disconnect();
    _controller?.close();
    _controller = null;
  }
}

// Singleton provider
final sseClientProvider = Provider<SseClient>((ref) {
  final client = SseClient();
  ref.onDispose(client.dispose);
  return client;
});

// Stream provider untuk notifikasi
final notificationStreamProvider = StreamProvider<SseEvent>((ref) {
  final client = ref.watch(sseClientProvider);
  client.connect();
  return client.stream.where((e) => e.type == 'notification');
});
