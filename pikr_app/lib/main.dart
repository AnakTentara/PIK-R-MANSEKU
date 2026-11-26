import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import 'core/notifications/notification_service.dart';

const String webUrl = 'https://ruang-cerita.pikr-manseku.my.id/';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));
  runApp(const ProviderScope(child: PikrApp()));
}

class PikrApp extends StatelessWidget {
  const PikrApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Ruang Cerita PIK-R',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorSchemeSeed: const Color(0xFFF97316),
          scaffoldBackgroundColor: const Color(0xFFF4F1EE),
        ),
        home: const RuangCeritaWebShell(),
      );
}

class RuangCeritaWebShell extends StatefulWidget {
  const RuangCeritaWebShell({super.key});

  @override
  State<RuangCeritaWebShell> createState() => _RuangCeritaWebShellState();
}

class _RuangCeritaWebShellState extends State<RuangCeritaWebShell> with WidgetsBindingObserver {
  late final WebViewController controller;
  bool loading = true;
  bool failed = false;

  String get platformName {
    if (Platform.isAndroid) return 'android';
    if (Platform.isIOS) return 'ios';
    return 'mobile';
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    final customUserAgent =
        'Mozilla/5.0 (Linux; Android 14; Mobile; PIKR-App/1.0; Platform/$platformName) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF4F1EE))
      ..setUserAgent(customUserAgent)
      ..addJavaScriptChannel(
        'PikrNativeBridge',
        onMessageReceived: _handleBridgeMessage,
      )
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (String url) {
          setState(() {
            loading = true;
            failed = false;
          });
        },
        onPageFinished: (String url) {
          setState(() => loading = false);
          // Injeksi variabel lingkungan agar web tahu dibuka di dalam aplikasi Ruang Cerita native
          controller.runJavaScript('''
            window.isPIKRApp = true;
            window.appPlatform = '$platformName';
            document.documentElement.setAttribute('data-in-app', 'true');
            document.documentElement.setAttribute('data-app-platform', '$platformName');
            document.documentElement.classList.add('pikr-native-app');
            try {
              localStorage.setItem('pikr_is_app', 'true');
              localStorage.setItem('pikr_app_platform', '$platformName');
              var rcSess = localStorage.getItem('rc_token') || localStorage.getItem('rc_session') || localStorage.getItem('token') || localStorage.getItem('candidate_token');
              if (rcSess && window.PikrNativeBridge) {
                try {
                  var parsed = JSON.parse(rcSess);
                  var tok = typeof parsed === 'string' ? parsed : (parsed && parsed.state ? parsed.state.token : parsed.token);
                  if (tok) window.PikrNativeBridge.postMessage(JSON.stringify({ type: 'AUTH_SYNC', token: tok }));
                } catch (_) {
                  window.PikrNativeBridge.postMessage(JSON.stringify({ type: 'AUTH_SYNC', token: rcSess }));
                }
              }
            } catch (e) {}
          ''');
        },
        onWebResourceError: (WebResourceError e) {
          if (e.isForMainFrame ?? false) {
            setState(() {
              loading = false;
              failed = true;
            });
          }
        },
      ));

    // Izinkan akses kamera, mic, & media otomatis di dalam WebView Android
    if (controller.platform is AndroidWebViewController) {
      (controller.platform as AndroidWebViewController).setOnPlatformPermissionRequest(
        (PlatformWebViewPermissionRequest request) {
          request.grant();
        },
      );
    }

    _bootstrapApp();
  }

  Future<void> _bootstrapApp() async {
    await _requestPermissions();

    final launchUrl = await PikrNotificationService.instance.init(
      onNavigateUrl: (String targetUrl) {
        _loadInWebView(targetUrl);
      },
    );

    _loadInWebView(launchUrl ?? webUrl);
  }

  void _loadInWebView(String url) {
    controller.loadRequest(
      Uri.parse(url),
      headers: {
        'X-PIKR-App': '1',
        'X-PIKR-Platform': platformName,
      },
    );
  }

  void _handleBridgeMessage(JavaScriptMessage message) {
    try {
      final decoded = jsonDecode(message.message);
      if (decoded is Map<String, dynamic>) {
        final type = decoded['type']?.toString();
        if (type == 'AUTH_SYNC') {
          final token = decoded['token']?.toString();
          PikrNotificationService.instance.updateAuthToken(token);
        } else if (type == 'LOCAL_NOTIFY') {
          PikrNotificationService.instance.showIncomingNotification(
            id: decoded['id']?.toString() ?? 'bridge_${DateTime.now().millisecondsSinceEpoch}',
            title: decoded['title']?.toString() ?? 'Ruang Cerita',
            body: decoded['body']?.toString() ?? '',
            targetUrl: decoded['url']?.toString() ?? '/',
            category: decoded['category']?.toString() ?? 'RUANG_CERITA',
          );
        }
      }
    } catch (e) {
      debugPrint('[PikrNativeBridge] Pesan teks: ${message.message}');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      PikrNotificationService.instance.onAppResumed();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    PikrNotificationService.instance.dispose();
    super.dispose();
  }

  Future<void> _requestPermissions() async {
    try {
      await [
        Permission.notification,
        Permission.camera,
        Permission.microphone,
        Permission.photos,
        Permission.storage,
      ].request();
    } catch (e) {
      debugPrint('[Permissions] Error requesting permissions: $e');
    }
  }

  Future<bool> handleBack() async {
    if (await controller.canGoBack()) {
      await controller.goBack();
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) => PopScope(
        canPop: false,
        onPopInvokedWithResult: (bool didPop, dynamic result) async {
          if (!didPop && await handleBack() && context.mounted) {
            Navigator.of(context).pop();
          }
        },
        child: Scaffold(
          body: SafeArea(
            top: false,
            child: Stack(
              children: [
                RefreshIndicator(
                  color: const Color(0xFFF97316),
                  onRefresh: () async {
                    await controller.reload();
                  },
                  child: WebViewWidget(controller: controller),
                ),
                if (loading)
                  const LinearProgressIndicator(
                    minHeight: 3,
                    color: Color(0xFFF97316),
                    backgroundColor: Color(0xFFFEE2E2),
                  ),
                if (failed)
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.cloud_off_rounded,
                            size: 52,
                            color: Color(0xFF8A7A6B),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Ruang Cerita Tidak Dapat Dimuat',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF2C2520),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Periksa koneksi internet ponselmu lalu coba lagi.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF7A6E65),
                            ),
                          ),
                          const SizedBox(height: 20),
                          FilledButton.icon(
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFFF97316),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            onPressed: () {
                              setState(() => failed = false);
                              controller.reload();
                            },
                            icon: const Icon(Icons.refresh),
                            label: const Text('Coba Lagi'),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
}
