// lib/features/notifications/notif_page.dart
// Halaman notifikasi aktivitas

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/colors.dart';
import '../../shared/widgets/avatar.dart';

class NotifPage extends ConsumerWidget {
  const NotifPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Aktivitas')),
      body: ListView.separated(
        itemCount: 10,
        separatorBuilder: (_, __) => const Divider(
            indent: 60, height: 0.5, thickness: 0.5, color: kLine),
        itemBuilder: (_, i) => _NotifTile(index: i),
      ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  final int index;
  const _NotifTile({required this.index});

  static const _types = ['like', 'follow', 'comment', 'message'];

  @override
  Widget build(BuildContext context) {
    final type = _types[index % _types.length];
    final (icon, color, label) = switch (type) {
      'like' => (
          Icons.favorite,
          const Color(0xFFEC4899),
          'menyukai postinganmu'
        ),
      'follow' => (Icons.person_add, kAccent, 'mulai mengikutimu'),
      'comment' => (
          Icons.chat_bubble,
          const Color(0xFF6366F1),
          'mengomentari postinganmu'
        ),
      _ => (Icons.send, const Color(0xFF10B981), 'mengirim pesan'),
    };

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
      leading: Stack(
        clipBehavior: Clip.none,
        children: [
          AvatarWidget(username: 'user${index + 1}', size: 44),
          Positioned(
            bottom: -2,
            right: -2,
            child: Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: color.withAlpha(26),
                shape: BoxShape.circle,
                border: Border.all(color: kSurface, width: 1.5),
              ),
              child: Icon(icon, size: 11, color: color),
            ),
          ),
        ],
      ),
      title: RichText(
        text: TextSpan(
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 13,
            color: kText,
            height: 1.4,
          ),
          children: [
            TextSpan(
              text: 'user${index + 1} ',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            TextSpan(text: label),
          ],
        ),
      ),
      trailing: Text(
        '${index + 1}j',
        style: const TextStyle(
          fontFamily: 'Inter',
          fontSize: 11,
          color: kMuted,
        ),
      ),
      onTap: () {},
    );
  }
}
