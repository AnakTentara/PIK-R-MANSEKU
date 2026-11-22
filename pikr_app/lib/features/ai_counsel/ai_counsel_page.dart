// lib/features/ai_counsel/ai_counsel_page.dart
// Sahabat AI Konseling — mood tabs, chat bubble, breathing modal

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../../core/api/client.dart';
import '../../core/api/endpoints.dart';
import '../../shared/theme/colors.dart';
import '../../shared/widgets/avatar.dart';
import 'breathing_modal.dart';

// ─── Provider ────────────────────────────────────────────────────────────────

class AiMessage {
  final String id;
  final String role; // 'user' | 'ai'
  final String text;
  final DateTime createdAt;
  final bool loading;

  const AiMessage({
    required this.id,
    required this.role,
    required this.text,
    required this.createdAt,
    this.loading = false,
  });

  factory AiMessage.fromJson(Map<String, dynamic> j) => AiMessage(
        id: j['id'] as String,
        role: (j['role'] as String?) == 'USER' ? 'user' : 'ai',
        text: j['content'] as String? ?? '',
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ??
            DateTime.now(),
      );
}

// ─── Page ────────────────────────────────────────────────────────────────────
class AiCounselPage extends ConsumerStatefulWidget {
  const AiCounselPage({super.key});

  @override
  ConsumerState<AiCounselPage> createState() => _AiCounselPageState();
}

class _AiCounselPageState extends ConsumerState<AiCounselPage> {
  final _inputCtrl = TextEditingController();
  final _scroll = ScrollController();
  final _inputFocus = FocusNode();

  String? _sessionId;
  String _tone = 'listen';
  List<AiMessage> _messages = [];
  bool _loading = false;
  bool _sending = false;

  static const _tones = [
    ('listen', 'Mendengar', Icons.hearing_outlined),
    ('motivate', 'Semangat', Icons.bolt_outlined),
    ('guide', 'Panduan', Icons.explore_outlined),
  ];

  static const _chips = [
    'Lagi nggak baik-baik aja',
    'Mau cerita sesuatu',
    'Butuh saran',
    'Overthinking',
    'Stres sekolah',
  ];

  @override
  void initState() {
    super.initState();
    _initSession();
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scroll.dispose();
    _inputFocus.dispose();
    super.dispose();
  }

  Future<void> _initSession() async {
    setState(() => _loading = true);
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get(Ep.aiSessions);
      final sessions = (res.data['sessions'] as List<dynamic>? ?? []);

      if (sessions.isNotEmpty) {
        final sess = sessions.first as Map<String, dynamic>;
        _sessionId = sess['id'] as String;
        _tone = sess['tone'] as String? ?? 'listen';
        await _loadMessages();
      } else {
        // Buat sesi baru
        final created = await dio.post(Ep.aiSessions, data: {'tone': _tone});
        _sessionId =
            ((created.data['session'] as Map<String, dynamic>)['id']) as String;
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMessages() async {
    if (_sessionId == null) return;
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get(Ep.aiSession(_sessionId!));
      final msgs = (res.data['messages'] as List<dynamic>? ?? [])
          .map((m) => AiMessage.fromJson(m as Map<String, dynamic>))
          .toList();
      if (mounted) {
        setState(() => _messages = msgs);
        _scrollToBottom();
      }
    } catch (_) {}
  }

  Future<void> _send([String? override]) async {
    final text = (override ?? _inputCtrl.text).trim();
    if (text.isEmpty || _sending) return;

    _inputCtrl.clear();
    setState(() => _sending = true);

    // Pastikan ada session
    if (_sessionId == null) {
      try {
        final dio = ref.read(dioProvider);
        final res = await dio.post(Ep.aiSessions, data: {'tone': _tone});
        _sessionId = (res.data as Map<String, dynamic>)['id'] as String;
      } catch (_) {
        setState(() => _sending = false);
        return;
      }
    }

    // Tambah pesan optimistik
    final userMsg = AiMessage(
      id: 'tmp-${DateTime.now().millisecondsSinceEpoch}',
      role: 'user',
      text: text,
      createdAt: DateTime.now(),
    );
    final loadingMsg = AiMessage(
      id: 'loading',
      role: 'ai',
      text: '',
      createdAt: DateTime.now(),
      loading: true,
    );
    setState(() {
      _messages = [..._messages, userMsg, loadingMsg];
    });
    _scrollToBottom();

    try {
      final dio = ref.read(dioProvider);
      final res = await dio.post(Ep.aiChat(_sessionId!), data: {'text': text});
      final reply = AiMessage(
        id: res.data['id'] as String? ??
            'ai-${DateTime.now().millisecondsSinceEpoch}',
        role: 'ai',
        text: res.data['reply'] as String? ??
            res.data['content'] as String? ??
            '',
        createdAt: DateTime.now(),
      );
      setState(() {
        _messages = [
          ..._messages.where((m) => m.id != 'loading' && m.id != userMsg.id),
          userMsg
              .copyWithId(res.data['userMessageId'] as String? ?? userMsg.id),
          reply,
        ];
      });
    } catch (_) {
      setState(() {
        _messages = _messages.where((m) => m.id != 'loading').toList();
      });
    } finally {
      if (mounted) setState(() => _sending = false);
      _scrollToBottom();
    }
  }

  Future<void> _changeTone(String tone) async {
    setState(() => _tone = tone);
    if (_sessionId == null) return;
    try {
      final dio = ref.read(dioProvider);
      await dio.patch(Ep.aiTone(_sessionId!), data: {'tone': tone});
    } catch (_) {}
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _openBreathing() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const BreathingModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [kAccent, kAccent2],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.spa, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Sahabat AI',
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: kText,
                  ),
                ),
                Text(
                  'Siap mendengarkan',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 11,
                    color: kMuted,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Tombol Napas
          IconButton(
            onPressed: _openBreathing,
            tooltip: 'Napas Tenang',
            icon: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFFE0F2FE),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.air, color: Color(0xFF0284C7), size: 18),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Mood Tabs ───────────────────────────────────────────────────
          _MoodTabs(
            current: _tone,
            tones: _tones,
            onSelect: _changeTone,
          ),

          // ── Chat List ───────────────────────────────────────────────────
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: kAccent,
                      strokeWidth: 2,
                    ),
                  )
                : _messages.isEmpty
                    ? _EmptyState(onChip: _send)
                    : ListView.builder(
                        controller: _scroll,
                        padding: EdgeInsets.fromLTRB(
                            13, 13, 13, mq.viewInsets.bottom + 8),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) => _ChatBubble(msg: _messages[i]),
                      ),
          ),

          // ── Chips (hanya kalau belum ada pesan) ────────────────────────
          if (_messages.isEmpty) _ChipBar(chips: _chips, onTap: _send),

          // ── Composer ────────────────────────────────────────────────────
          _Composer(
            ctrl: _inputCtrl,
            focus: _inputFocus,
            sending: _sending,
            onSend: _send,
          ),
        ],
      ),
    );
  }
}

extension on AiMessage {
  AiMessage copyWithId(String newId) => AiMessage(
        id: newId,
        role: role,
        text: text,
        createdAt: createdAt,
        loading: loading,
      );
}

// ─── Mood Tabs ───────────────────────────────────────────────────────────────
class _MoodTabs extends StatelessWidget {
  final String current;
  final List<(String, String, IconData)> tones;
  final ValueChanged<String> onSelect;

  const _MoodTabs({
    required this.current,
    required this.tones,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: kLine, width: 0.5)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
      child: Row(
        children: tones.map((t) {
          final (key, label, icon) = t;
          final active = current == key;
          return Expanded(
            child: GestureDetector(
              onTap: () => onSelect(key),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: active ? kAccentSoft : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      icon,
                      size: 15,
                      color: active ? kAccentInk : kMuted,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      label,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 13,
                        fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                        color: active ? kAccentInk : kMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ─── Empty State ─────────────────────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  final ValueChanged<String> onChip;
  const _EmptyState({required this.onChip});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 21),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [kAccentSoft, Color(0xFFFFD0A6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.spa, color: kAccent, size: 32),
          ),
          const SizedBox(height: 16),
          const Text(
            'Hei, apa yang lagi\nkamu rasakan?',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: kText,
              height: 1.3,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Cerita apa saja, aku siap mendengarkan',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              color: kText2,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Suggestion Chips ─────────────────────────────────────────────────────────
class _ChipBar extends StatelessWidget {
  final List<String> chips;
  final ValueChanged<String> onTap;
  const _ChipBar({required this.chips, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 13),
        itemCount: chips.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) => ActionChip(
          label: Text(chips[i]),
          labelStyle: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 12,
            color: kText2,
          ),
          backgroundColor: kSurface2,
          side: const BorderSide(color: kLine),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          onPressed: () => onTap(chips[i]),
          padding: const EdgeInsets.symmetric(horizontal: 4),
        ),
      ),
    );
  }
}

// ─── Chat Bubble ─────────────────────────────────────────────────────────────
class _ChatBubble extends StatelessWidget {
  final AiMessage msg;
  const _ChatBubble({required this.msg});

  @override
  Widget build(BuildContext context) {
    final isUser = msg.role == 'user';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [kAccent, kAccent2],
                ),
                borderRadius: BorderRadius.circular(9),
              ),
              child: const Icon(Icons.spa, color: Colors.white, size: 15),
            ),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.72,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
              decoration: BoxDecoration(
                color: isUser ? kAccent : kSurface,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                border: isUser ? null : Border.all(color: kLine, width: 0.5),
              ),
              child: msg.loading
                  ? SizedBox(
                      width: 40,
                      child: Row(
                        children: List.generate(
                          3,
                          (i) => _TypingDot(delay: i * 150),
                        ),
                      ),
                    )
                  : Text(
                      msg.text,
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 14,
                        color: isUser ? Colors.white : kText,
                        height: 1.5,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TypingDot extends StatefulWidget {
  final int delay;
  const _TypingDot({required this.delay});

  @override
  State<_TypingDot> createState() => _TypingDotState();
}

class _TypingDotState extends State<_TypingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _anim = Tween<double>(begin: 0, end: -6).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _ctrl.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Transform.translate(
        offset: Offset(0, _anim.value),
        child: Container(
          width: 6,
          height: 6,
          margin: const EdgeInsets.symmetric(horizontal: 2),
          decoration: BoxDecoration(
            color: kMuted,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
    );
  }
}

// ─── Composer ────────────────────────────────────────────────────────────────
class _Composer extends StatefulWidget {
  final TextEditingController ctrl;
  final FocusNode focus;
  final bool sending;
  final VoidCallback onSend;

  const _Composer({
    required this.ctrl,
    required this.focus,
    required this.sending,
    required this.onSend,
  });

  @override
  State<_Composer> createState() => _ComposerState();
}

class _ComposerState extends State<_Composer> {
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    widget.ctrl.addListener(() {
      final has = widget.ctrl.text.trim().isNotEmpty;
      if (has != _hasText) setState(() => _hasText = has);
    });
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);

    return Container(
      padding: EdgeInsets.fromLTRB(13, 8, 13, mq.padding.bottom + 8),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: kLine, width: 0.5)),
        color: kSurface,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: widget.ctrl,
              focusNode: widget.focus,
              maxLines: 5,
              minLines: 1,
              textCapitalization: TextCapitalization.sentences,
              style: const TextStyle(
                fontFamily: 'Inter',
                fontSize: 14,
                color: kText,
              ),
              decoration: const InputDecoration(
                hintText: 'Cerita apa saja...',
                hintStyle: TextStyle(color: kMuted),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 0, vertical: 8),
                filled: false,
              ),
            ),
          ),
          const SizedBox(width: 8),
          AnimatedOpacity(
            opacity: _hasText ? 1.0 : 0.4,
            duration: const Duration(milliseconds: 150),
            child: GestureDetector(
              onTap: _hasText && !widget.sending ? widget.onSend : null,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: _hasText ? kAccent : kSurface2,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: widget.sending
                    ? const Center(
                        child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        ),
                      )
                    : Icon(
                        Icons.arrow_upward,
                        size: 18,
                        color: _hasText ? Colors.white : kMuted,
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
