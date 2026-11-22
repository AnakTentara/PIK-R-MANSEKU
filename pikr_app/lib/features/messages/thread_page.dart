// lib/features/messages/thread_page.dart
// Chat thread DM — bubble chat mirip Messages web

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/client.dart';
import '../../core/api/endpoints.dart';
import '../../shared/theme/colors.dart';
import '../../shared/widgets/avatar.dart';

class ThreadPage extends ConsumerStatefulWidget {
  final String threadId;
  final String? recipientUsername;

  const ThreadPage({
    super.key,
    required this.threadId,
    this.recipientUsername,
  });

  @override
  ConsumerState<ThreadPage> createState() => _ThreadPageState();
}

class _ThreadPageState extends ConsumerState<ThreadPage> {
  final _inputCtrl = TextEditingController();
  final _scroll = ScrollController();
  final _inputFocus = FocusNode();

  List<_Message> _messages = [];
  bool _loading = true;
  bool _sending = false;
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _inputCtrl.addListener(() {
      final has = _inputCtrl.text.trim().isNotEmpty;
      if (has != _hasText) setState(() => _hasText = has);
    });
    _loadMessages();
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scroll.dispose();
    _inputFocus.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get(Ep.threadMessages(widget.threadId));
      final data = res.data as Map<String, dynamic>;
      final msgs = (data['items'] as List<dynamic>? ?? [])
          .map((m) => _Message.fromJson(m as Map<String, dynamic>))
          .toList();
      if (mounted) {
        setState(() {
          _messages = msgs;
          _loading = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    final text = _inputCtrl.text.trim();
    if (text.isEmpty || _sending) return;
    _inputCtrl.clear();
    setState(() => _sending = true);

    final tmp = _Message(
      id: 'tmp-${DateTime.now().millisecondsSinceEpoch}',
      text: text,
      isMine: true,
      createdAt: DateTime.now(),
      status: 'sending',
    );
    setState(() => _messages = [..._messages, tmp]);
    _scrollToBottom();

    try {
      final dio = ref.read(dioProvider);
      final res = await dio.post(
        Ep.threadMessages(widget.threadId),
        data: {'text': text},
      );
      final sent = _Message.fromJson((res.data
          as Map<String, dynamic>)['message'] as Map<String, dynamic>);
      setState(() {
        _messages = [
          ..._messages.where((m) => m.id != tmp.id),
          sent,
        ];
      });
    } catch (_) {
      setState(() {
        _messages = _messages
            .map((m) => m.id == tmp.id ? m.copyWith(status: 'failed') : m)
            .toList();
      });
    } finally {
      if (mounted) setState(() => _sending = false);
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Row(
          children: [
            AvatarWidget(username: widget.recipientUsername, size: 34),
            const SizedBox(width: 10),
            Text(
              widget.recipientUsername ?? 'Pesan',
              style: const TextStyle(
                fontFamily: 'Outfit',
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: kText,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.info_outline, size: 22, color: kText2),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Chat List ──────────────────────────────────────────────────
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: kAccent, strokeWidth: 2))
                : _messages.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            AvatarWidget(
                                username: widget.recipientUsername, size: 64),
                            const SizedBox(height: 13),
                            Text(
                              widget.recipientUsername ?? '',
                              style: const TextStyle(
                                fontFamily: 'Outfit',
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: kText,
                              ),
                            ),
                            const SizedBox(height: 5),
                            const Text(
                              'Mulai percakapan',
                              style: TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize: 13,
                                  color: kMuted),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scroll,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 13, vertical: 13),
                        itemCount: _messages.length,
                        itemBuilder: (_, i) {
                          final msg = _messages[i];
                          final prev = i > 0 ? _messages[i - 1] : null;
                          final showDate = prev == null ||
                              !_sameDay(prev.createdAt, msg.createdAt);
                          return Column(
                            children: [
                              if (showDate) _DateSep(date: msg.createdAt),
                              _BubbleTile(msg: msg),
                            ],
                          );
                        },
                      ),
          ),

          // ── Composer ──────────────────────────────────────────────────
          Container(
            padding: EdgeInsets.fromLTRB(13, 8, 13, mq.padding.bottom + 8),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: kLine, width: 0.5)),
              color: kSurface,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Attachment
                IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.add_circle_outline,
                      color: kMuted, size: 24),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 8),
                // Input
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: kSurface2,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: TextField(
                      controller: _inputCtrl,
                      focusNode: _inputFocus,
                      maxLines: 5,
                      minLines: 1,
                      textCapitalization: TextCapitalization.sentences,
                      style: const TextStyle(
                          fontFamily: 'Inter', fontSize: 14, color: kText),
                      decoration: const InputDecoration(
                        hintText: 'Pesan...',
                        hintStyle: TextStyle(color: kMuted),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        filled: false,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Send
                GestureDetector(
                  onTap: _hasText && !_sending ? _send : null,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: _hasText ? kAccent : kSurface2,
                      shape: BoxShape.circle,
                    ),
                    child: _sending
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
              ],
            ),
          ),
        ],
      ),
    );
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}

// ─── Message model ────────────────────────────────────────────────────────────
class _Message {
  final String id;
  final String text;
  final bool isMine;
  final DateTime createdAt;
  final String? status; // 'sending' | 'sent' | 'read' | 'failed'

  const _Message({
    required this.id,
    required this.text,
    required this.isMine,
    required this.createdAt,
    this.status,
  });

  factory _Message.fromJson(Map<String, dynamic> j) => _Message(
        id: j['id'] as String,
        text: j['text'] as String? ?? '',
        isMine: j['mine'] as bool? ?? j['isMine'] as bool? ?? false,
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ??
            DateTime.now(),
        status: j['status'] as String?,
      );

  _Message copyWith({String? status}) => _Message(
        id: id,
        text: text,
        isMine: isMine,
        createdAt: createdAt,
        status: status ?? this.status,
      );
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
class _BubbleTile extends StatelessWidget {
  final _Message msg;
  const _BubbleTile({super.key, required this.msg});

  @override
  Widget build(BuildContext context) {
    final isMine = msg.isMine;
    final failed = msg.status == 'failed';

    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        mainAxisAlignment:
            isMine ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.72,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
              decoration: BoxDecoration(
                color: isMine
                    ? (failed ? const Color(0xFFFFE4E4) : kAccent)
                    : kSurface,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isMine ? 16 : 4),
                  bottomRight: Radius.circular(isMine ? 4 : 16),
                ),
                border: isMine
                    ? (failed
                        ? Border.all(color: const Color(0xFFDC2626), width: 1)
                        : null)
                    : Border.all(color: kLine, width: 0.5),
              ),
              child: Text(
                msg.text,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: isMine
                      ? (failed ? const Color(0xFFDC2626) : Colors.white)
                      : kText,
                  height: 1.4,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Date Separator ───────────────────────────────────────────────────────────
class _DateSep extends StatelessWidget {
  final DateTime date;
  const _DateSep({required this.date});

  String _format() {
    final now = DateTime.now();
    final diff = now.difference(date).inDays;
    if (diff == 0) return 'Hari ini';
    if (diff == 1) return 'Kemarin';
    return '${date.day}/${date.month}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 13),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 4),
          decoration: BoxDecoration(
            color: kSurface2,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            _format(),
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 11,
              color: kMuted,
            ),
          ),
        ),
      ),
    );
  }
}
