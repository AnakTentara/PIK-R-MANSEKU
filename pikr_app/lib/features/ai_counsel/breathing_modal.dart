// lib/features/ai_counsel/breathing_modal.dart
// Modal Napas Tenang — animasi ring konsentris, fase warna, countdown fade

import 'dart:async';
import 'package:flutter/material.dart';

// ─── Fase ────────────────────────────────────────────────────────────────────
enum _Phase { inhale, hold, exhale }

extension _PhaseX on _Phase {
  String get label => switch (this) {
        _Phase.inhale => 'Tarik Napas',
        _Phase.hold => 'Tahan',
        _Phase.exhale => 'Hembuskan',
      };

  int get duration => switch (this) {
        _Phase.inhale => 4,
        _Phase.hold => 7,
        _Phase.exhale => 8,
      };

  Color get color => switch (this) {
        _Phase.inhale => const Color(0xFFF97316),
        _Phase.hold => const Color(0xFF10B981),
        _Phase.exhale => const Color(0xFF6366F1),
      };

  double get scale => switch (this) {
        _Phase.inhale => 1.0,
        _Phase.hold => 1.0,
        _Phase.exhale => 0.3,
      };
}

// ─── Modal ───────────────────────────────────────────────────────────────────
class BreathingModal extends StatefulWidget {
  const BreathingModal({super.key});

  @override
  State<BreathingModal> createState() => _BreathingModalState();
}

class _BreathingModalState extends State<BreathingModal>
    with TickerProviderStateMixin {
  // State
  _Phase _phase = _Phase.inhale;
  int _count = 4;
  bool _running = false;
  bool _countVisible = true;
  int _cycles = 0;

  // Animasi ring
  late final AnimationController _outerCtrl;
  late final AnimationController _midCtrl;
  late final AnimationController _coreCtrl;
  late final AnimationController _glowCtrl;

  Timer? _phaseTimer;
  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();

    _outerCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4000),
      lowerBound: 0.5,
      upperBound: 1.0,
    )..value = 0.5;

    _midCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4200),
      lowerBound: 0.55,
      upperBound: 1.0,
    )..value = 0.55;

    _coreCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 4400),
      lowerBound: 0.6,
      upperBound: 1.0,
    )..value = 0.6;

    _glowCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _phaseTimer?.cancel();
    _countdownTimer?.cancel();
    _outerCtrl.dispose();
    _midCtrl.dispose();
    _coreCtrl.dispose();
    _glowCtrl.dispose();
    super.dispose();
  }

  void _start() {
    if (_running) return;
    setState(() => _running = true);
    _runPhase(_Phase.inhale);
  }

  void _stop() {
    _phaseTimer?.cancel();
    _countdownTimer?.cancel();
    setState(() {
      _running = false;
      _phase = _Phase.inhale;
      _count = 4;
      _cycles = 0;
    });
    _outerCtrl.animateTo(0.5,
        duration: const Duration(milliseconds: 800), curve: Curves.easeInOut);
    _midCtrl.animateTo(0.55,
        duration: const Duration(milliseconds: 900), curve: Curves.easeInOut);
    _coreCtrl.animateTo(0.6,
        duration: const Duration(milliseconds: 1000), curve: Curves.easeInOut);
  }

  void _runPhase(_Phase phase) {
    _phaseTimer?.cancel();
    _countdownTimer?.cancel();

    final dur = phase.duration;
    final ringDur = Duration(milliseconds: dur * 1000);

    setState(() {
      _phase = phase;
      _count = dur;
      _countVisible = true;
    });

    // Animasi ring
    final Curve curve = switch (phase) {
      _Phase.inhale => Curves.easeOut,
      _Phase.hold => Curves.elasticOut,
      _Phase.exhale => Curves.easeInOut,
    };

    final double target = switch (phase) {
      _Phase.inhale => 1.0,
      _Phase.hold => 1.0,
      _Phase.exhale => 0.5,
    };

    _outerCtrl.duration = Duration(milliseconds: dur * 1000 + 300);
    _midCtrl.duration = Duration(milliseconds: dur * 1000 + 150);
    _coreCtrl.duration = Duration(milliseconds: dur * 1000);

    if (phase == _Phase.exhale) {
      _outerCtrl.animateTo(0.5, duration: ringDur, curve: curve);
      _midCtrl.animateTo(0.55, duration: ringDur, curve: curve);
      _coreCtrl.animateTo(0.6, duration: ringDur, curve: curve);
    } else {
      _outerCtrl.animateTo(target, duration: ringDur, curve: curve);
      _midCtrl.animateTo(target * 0.9, duration: ringDur, curve: curve);
      _coreCtrl.animateTo(target * 0.8, duration: ringDur, curve: curve);
    }

    // Countdown dengan fade
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_count <= 1) {
        t.cancel();
        return;
      }
      // Fade out
      setState(() => _countVisible = false);
      Future.delayed(const Duration(milliseconds: 150), () {
        if (!mounted) return;
        setState(() {
          _count = _count - 1;
          _countVisible = true;
        });
      });
    });

    // Pindah fase
    _phaseTimer = Timer(Duration(seconds: dur), () {
      if (!mounted || !_running) return;
      final next = switch (phase) {
        _Phase.inhale => _Phase.hold,
        _Phase.hold => _Phase.exhale,
        _Phase.exhale => () {
            setState(() => _cycles++);
            return _Phase.inhale;
          }(),
      };
      _runPhase(next);
    });
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final color = _phase.color;

    return Container(
      height: mq.size.height * 0.75,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1614),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Handle
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(32),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(21, 16, 21, 0),
            child: Row(
              children: [
                const Text(
                  'Napas Tenang',
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    letterSpacing: -0.3,
                  ),
                ),
                const Spacer(),
                if (_cycles > 0)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(16),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '$_cycles siklus',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        color: Colors.white60,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Ring + Text center
          Expanded(
            child: Center(
              child: SizedBox(
                width: 240,
                height: 240,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Glow background
                    AnimatedBuilder(
                      animation: _glowCtrl,
                      builder: (_, __) => Container(
                        width: 240,
                        height: 240,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: color
                              .withAlpha((8 + _glowCtrl.value * 8).round()),
                        ),
                      ),
                    ),

                    // Ring Outer
                    AnimatedBuilder(
                      animation: _outerCtrl,
                      builder: (_, __) {
                        final s = _outerCtrl.value;
                        return Transform.scale(
                          scale: s,
                          child: Container(
                            width: 220,
                            height: 220,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: color.withAlpha(48),
                                width: 1.5,
                              ),
                            ),
                          ),
                        );
                      },
                    ),

                    // Ring Mid
                    AnimatedBuilder(
                      animation: _midCtrl,
                      builder: (_, __) {
                        final s = _midCtrl.value;
                        return Transform.scale(
                          scale: s,
                          child: Container(
                            width: 180,
                            height: 180,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: color.withAlpha(80),
                                width: 2,
                              ),
                            ),
                          ),
                        );
                      },
                    ),

                    // Ring Core
                    AnimatedBuilder(
                      animation: _coreCtrl,
                      builder: (_, __) {
                        final s = _coreCtrl.value;
                        return Transform.scale(
                          scale: s,
                          child: Container(
                            width: 130,
                            height: 130,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: color.withAlpha(16),
                              border: Border.all(
                                color: color.withAlpha(140),
                                width: 2.5,
                              ),
                            ),
                          ),
                        );
                      },
                    ),

                    // Center text — TIDAK ikut scale ring
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Countdown
                        AnimatedOpacity(
                          opacity: _countVisible ? 1.0 : 0.0,
                          duration: const Duration(milliseconds: 150),
                          child: AnimatedSlide(
                            offset: _countVisible
                                ? Offset.zero
                                : const Offset(0, 0.1),
                            duration: const Duration(milliseconds: 150),
                            curve: Curves.easeOut,
                            child: Text(
                              _running ? '$_count' : '',
                              style: TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: 48,
                                fontWeight: FontWeight.w300,
                                color: color,
                                height: 1,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Fase label
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 400),
                          transitionBuilder: (child, anim) => FadeTransition(
                            opacity: anim,
                            child: child,
                          ),
                          child: Text(
                            _running ? _phase.label : 'Siap memulai',
                            key: ValueKey(_phase),
                            style: const TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                              color: Colors.white70,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Phase dots
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: _Phase.values.map((p) {
              final active = p == _phase && _running;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: active ? 20 : 6,
                height: 6,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: active ? _phase.color : Colors.white.withAlpha(40),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 21),

          // Tombol Start/Stop
          Padding(
            padding: EdgeInsets.fromLTRB(21, 0, 21, mq.padding.bottom + 21),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _running ? _stop : _start,
                style: FilledButton.styleFrom(
                  backgroundColor:
                      _running ? Colors.white.withAlpha(26) : color,
                  foregroundColor: _running ? Colors.white : Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  textStyle: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                child: Text(_running ? 'Berhenti' : 'Mulai'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
