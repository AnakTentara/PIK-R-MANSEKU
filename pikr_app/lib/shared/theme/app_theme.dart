// lib/shared/theme/app_theme.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'colors.dart';

class AppTheme {
  AppTheme._();

  // ─── Light ──────────────────────────────────────────────────────────────────
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme(
          brightness: Brightness.light,
          primary: kAccent,
          onPrimary: Colors.white,
          secondary: kAccent2,
          onSecondary: Colors.white,
          error: Color(0xFFDC2626),
          onError: Colors.white,
          surface: kSurface,
          onSurface: kText,
          surfaceContainerHighest: kSurface2,
          outline: kLine,
        ),
        scaffoldBackgroundColor: kBg,
        cardColor: kSurface,
        dividerColor: kLine,
        fontFamily: 'Outfit',

        // AppBar
        appBarTheme: const AppBarTheme(
          backgroundColor: kSurface,
          foregroundColor: kText,
          elevation: 0,
          scrolledUnderElevation: 1,
          shadowColor: kLine,
          titleTextStyle: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: kText,
            letterSpacing: -0.3,
          ),
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.dark,
          ),
        ),

        // Bottom Nav
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: kSurface,
          indicatorColor: kAccentSoft,
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const IconThemeData(color: kAccent, size: 24);
            }
            return const IconThemeData(color: kMuted, size: 22);
          }),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const TextStyle(
                fontFamily: 'Outfit',
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: kAccent,
              );
            }
            return const TextStyle(
              fontFamily: 'Outfit',
              fontSize: 11,
              color: kMuted,
            );
          }),
          height: 64,
          elevation: 0,
          shadowColor: kLine,
        ),

        // Buttons
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: kAccent,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(13),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 21, vertical: 13),
            textStyle: const TextStyle(
              fontFamily: 'Outfit',
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: kAccent,
            textStyle: const TextStyle(
              fontFamily: 'Outfit',
              fontWeight: FontWeight.w500,
            ),
          ),
        ),

        // Input
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: kSurface2,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(13),
            borderSide: const BorderSide(color: kLine),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(13),
            borderSide: const BorderSide(color: kLine),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(13),
            borderSide: const BorderSide(color: kAccent, width: 1.5),
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
          hintStyle: const TextStyle(color: kMuted),
        ),

        // Cards
        cardTheme: CardThemeData(
          color: kSurface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: kLine),
          ),
          margin: EdgeInsets.zero,
        ),

        // Chip
        chipTheme: ChipThemeData(
          backgroundColor: kSurface2,
          selectedColor: kAccentSoft,
          labelStyle: const TextStyle(
            fontFamily: 'Outfit',
            fontSize: 13,
            color: kText2,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          side: const BorderSide(color: kLine),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        ),

        // Text
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 34,
            fontWeight: FontWeight.w700,
            color: kText,
            letterSpacing: -0.5,
          ),
          headlineMedium: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: kText,
            letterSpacing: -0.3,
          ),
          titleLarge: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: kText,
            letterSpacing: -0.2,
          ),
          titleMedium: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: kText,
          ),
          bodyLarge: TextStyle(
            fontFamily: 'Inter',
            fontSize: 15,
            color: kText,
            height: 1.5,
          ),
          bodyMedium: TextStyle(
            fontFamily: 'Inter',
            fontSize: 13,
            color: kText2,
            height: 1.5,
          ),
          bodySmall: TextStyle(
            fontFamily: 'Inter',
            fontSize: 11,
            color: kMuted,
          ),
          labelLarge: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: kText,
          ),
        ),
      );

  // ─── Dark ───────────────────────────────────────────────────────────────────
  static ThemeData get dark => light.copyWith(
        brightness: Brightness.dark,
        colorScheme: const ColorScheme(
          brightness: Brightness.dark,
          primary: kAccent,
          onPrimary: Colors.white,
          secondary: kAccent2,
          onSecondary: Colors.white,
          error: Color(0xFFF87171),
          onError: Colors.black,
          surface: kSurfaceDark,
          onSurface: kTextDark,
          surfaceContainerHighest: kSurface2Dark,
          outline: kLineDark,
        ),
        scaffoldBackgroundColor: kBgDark,
        cardColor: kSurfaceDark,
        dividerColor: kLineDark,
        appBarTheme: const AppBarTheme(
          backgroundColor: kSurfaceDark,
          foregroundColor: kTextDark,
          elevation: 0,
          scrolledUnderElevation: 1,
          titleTextStyle: TextStyle(
            fontFamily: 'Outfit',
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: kTextDark,
            letterSpacing: -0.3,
          ),
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.light,
          ),
        ),
      );
}
