import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pikr_app/features/auth/login_page.dart';
import 'package:pikr_app/shared/theme/app_theme.dart';

void main() {
  testWidgets('Ruang Cerita login boots', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.light,
        home: const LoginPage(),
      ),
    );
    expect(find.text('Masuk ke Ruang Cerita'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
  });
}
