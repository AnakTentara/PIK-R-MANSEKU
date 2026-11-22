// lib/features/profile/profile_page.dart
// Halaman profil user

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/auth/auth_provider.dart';
import '../../shared/theme/colors.dart';
import '../../shared/widgets/avatar.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.valueOrNull;
    final username = user is AuthAuthenticated ? user.user.username : '—';
    final displayName =
        user is AuthAuthenticated ? (user.user.displayName ?? username) : '—';

    return Scaffold(
      appBar: AppBar(
        title: Text(username),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.settings_outlined, size: 22),
          ),
        ],
      ),
      body: ListView(
        children: [
          // ── Header Profil ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(21, 21, 21, 13),
            child: Row(
              children: [
                AvatarWidget(
                  username: username,
                  size: 72,
                  borderRadius: 22,
                ),
                const SizedBox(width: 21),
                Expanded(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: const [
                      _StatItem(label: 'Postingan', value: '0'),
                      _StatItem(label: 'Pengikut', value: '0'),
                      _StatItem(label: 'Mengikuti', value: '0'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Bio ────────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 21),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
                  style: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: kText,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Belum ada bio',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: kText2,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 13),

          // ── Edit + Bagikan ────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 21),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      foregroundColor: kText,
                      side: const BorderSide(color: kLine),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      textStyle: const TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    child: const Text('Edit profil'),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    foregroundColor: kText,
                    side: const BorderSide(color: kLine),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
                  ),
                  child: const Icon(Icons.person_add_outlined, size: 18),
                ),
              ],
            ),
          ),

          const SizedBox(height: 13),
          const Divider(height: 0.5, thickness: 0.5, color: kLine),

          // ── Logout ────────────────────────────────────────────────────
          ListTile(
            leading:
                const Icon(Icons.logout, color: Color(0xFFDC2626), size: 20),
            title: const Text(
              'Keluar',
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 14,
                color: Color(0xFFDC2626),
              ),
            ),
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Keluar?'),
                  content: const Text('Kamu akan keluar dari akun ini.'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Batal'),
                    ),
                    FilledButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: FilledButton.styleFrom(
                          backgroundColor: const Color(0xFFDC2626)),
                      child: const Text('Keluar'),
                    ),
                  ],
                ),
              );
              if (confirm == true) {
                await ref.read(authProvider.notifier).logout();
              }
            },
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  const _StatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontFamily: 'Outfit',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: kText,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 11,
            color: kText2,
          ),
        ),
      ],
    );
  }
}
