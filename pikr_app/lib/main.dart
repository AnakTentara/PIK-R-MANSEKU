import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

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

class _RuangCeritaWebShellState extends State<RuangCeritaWebShell> {
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
    _requestPermissions();

    final customUserAgent =
        'Mozilla/5.0 (Linux; Android 14; Mobile; PIKR-App/1.0; Platform/$platformName) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF4F1EE))
      ..setUserAgent(customUserAgent)
      ..addJavaScriptChannel(
        'PikrNativeBridge',
        onMessageReceived: (JavaScriptMessage message) {
          debugPrint('[PikrNativeBridge] Dari Web: ${message.message}');
        },
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
          // Injeksi variabel lingkungan agar web Ruang Cerita tahu bahwa dibuka di dalam aplikasi Flutter
          controller.runJavaScript('''
            window.isPIKRApp = true;
            window.appPlatform = '$platformName';
            document.documentElement.setAttribute('data-in-app', 'true');
            document.documentElement.setAttribute('data-app-platform', '$platformName');
            document.documentElement.classList.add('pikr-native-app');
            try {
              localStorage.setItem('pikr_is_app', 'true');
              localStorage.setItem('pikr_app_platform', '$platformName');
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

    // Izinkan akses kamera, mic, & notifikasi otomatis di dalam WebView Android
    if (controller.platform is AndroidWebViewController) {
      (controller.platform as AndroidWebViewController).setOnPlatformPermissionRequest(
        (PlatformWebViewPermissionRequest request) {
          request.grant();
        },
      );
    }

    controller.loadRequest(
      Uri.parse(webUrl),
      headers: {
        'X-PIKR-App': '1',
        'X-PIKR-Platform': platformName,
      },
    );
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
