// lib/features/counsel/counsel_page.dart
// Bilik Konseling Anonim — placeholder

import 'package:flutter/material.dart';
import '../../shared/theme/colors.dart';

class CounselPage extends StatelessWidget {
  const CounselPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bilik Konseling')),
      body: const Center(
        child: Text(
          'Segera hadir',
          style: TextStyle(fontFamily: 'Outfit', fontSize: 16, color: kMuted),
        ),
      ),
    );
  }
}
