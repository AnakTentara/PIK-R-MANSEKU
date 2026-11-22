// lib/shared/widgets/shell_scaffold.dart
// Bottom Nav shell dengan 5 tab

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/colors.dart';

class ShellScaffold extends StatelessWidget {
  final Widget child;
  const ShellScaffold({super.key, required this.child});

  static const _tabs = [
    _Tab(
        icon: Icons.home_outlined,
        activeIcon: Icons.home,
        label: 'Beranda',
        path: '/'),
    _Tab(
        icon: Icons.chat_bubble_outline,
        activeIcon: Icons.chat_bubble,
        label: 'Pesan',
        path: '/pesan'),
    _Tab(
        icon: Icons.spa_outlined,
        activeIcon: Icons.spa,
        label: 'AI',
        path: '/konseling/ai'),
    _Tab(
        icon: Icons.notifications_outlined,
        activeIcon: Icons.notifications,
        label: 'Aktivitas',
        path: '/aktivitas'),
    _Tab(
        icon: Icons.person_outline,
        activeIcon: Icons.person,
        label: 'Profil',
        path: '/profil'),
  ];

  int _currentIndex(BuildContext ctx) {
    final loc = GoRouterState.of(ctx).matchedLocation;
    for (int i = 0; i < _tabs.length; i++) {
      if (loc == _tabs[i].path || loc.startsWith(_tabs[i].path + '/')) {
        return i;
      }
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final idx = _currentIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(
            top: BorderSide(
              color: Theme.of(context).dividerColor,
              width: 0.5,
            ),
          ),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 56,
            child: Row(
              children: List.generate(_tabs.length, (i) {
                final tab = _tabs[i];
                final selected = i == idx;
                return Expanded(
                  child: InkWell(
                    onTap: () => context.go(tab.path),
                    borderRadius: BorderRadius.circular(12),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Khusus tab AI — pill indicator
                        if (i == 2)
                          Container(
                            width: 40,
                            height: 28,
                            decoration: BoxDecoration(
                              color:
                                  selected ? kAccentSoft : Colors.transparent,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(
                              selected ? tab.activeIcon : tab.icon,
                              size: 20,
                              color: selected ? kAccent : kMuted,
                            ),
                          )
                        else
                          Icon(
                            selected ? tab.activeIcon : tab.icon,
                            size: 22,
                            color: selected ? kAccent : kMuted,
                          ),
                        const SizedBox(height: 2),
                        Text(
                          tab.label,
                          style: TextStyle(
                            fontFamily: 'Outfit',
                            fontSize: 10,
                            fontWeight:
                                selected ? FontWeight.w600 : FontWeight.w400,
                            color: selected ? kAccent : kMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _Tab {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String path;
  const _Tab({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.path,
  });
}
