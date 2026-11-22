// lib/shared/widgets/avatar.dart
// Avatar widget reusable — cached image dengan fallback inisial

import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../theme/colors.dart';

class AvatarWidget extends StatelessWidget {
  final String? url;
  final String? username;
  final double size;
  final double? borderRadius;

  const AvatarWidget({
    super.key,
    this.url,
    this.username,
    this.size = 40,
    this.borderRadius,
  });

  String get _initials {
    if (username == null || username!.isEmpty) return '?';
    return username![0].toUpperCase();
  }

  Color get _bgColor {
    // Warna konsisten per username berdasarkan hash
    final colors = [
      const Color(0xFFF97316), // orange
      const Color(0xFF10B981), // green
      const Color(0xFF6366F1), // indigo
      const Color(0xFFF59E0B), // amber
      const Color(0xFFEC4899), // pink
      const Color(0xFF14B8A6), // teal
    ];
    if (username == null) return colors[0];
    final hash = username!.codeUnits.fold(0, (a, b) => a + b);
    return colors[hash % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final r = borderRadius ?? (size * 0.3);

    if (url != null && url!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(r),
        child: CachedNetworkImage(
          imageUrl: url!,
          width: size,
          height: size,
          fit: BoxFit.cover,
          placeholder: (_, __) => _Fallback(
            size: size,
            radius: r,
            initial: _initials,
            color: _bgColor,
          ),
          errorWidget: (_, __, ___) => _Fallback(
            size: size,
            radius: r,
            initial: _initials,
            color: _bgColor,
          ),
        ),
      );
    }

    return _Fallback(
      size: size,
      radius: r,
      initial: _initials,
      color: _bgColor,
    );
  }
}

class _Fallback extends StatelessWidget {
  final double size;
  final double radius;
  final String initial;
  final Color color;

  const _Fallback({
    required this.size,
    required this.radius,
    required this.initial,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color.withAlpha(32),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: color.withAlpha(64)),
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            fontFamily: 'Outfit',
            fontSize: size * 0.4,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ),
    );
  }
}
