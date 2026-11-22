// Daftar percakapan Ruang Cerita — terhubung ke /api/rc/inbox.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/client.dart';
import '../../core/api/endpoints.dart';
import '../../shared/theme/colors.dart';
import '../../shared/widgets/avatar.dart';

class InboxPage extends ConsumerStatefulWidget {
  const InboxPage({super.key});
  @override
  ConsumerState<InboxPage> createState() => _InboxPageState();
}

class _InboxPageState extends ConsumerState<InboxPage> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await ref.read(dioProvider).get(Ep.threads);
      final data = response.data as Map<String, dynamic>;
      final raw = data['items'] as List<dynamic>? ?? const [];
      if (mounted) {
        setState(() {
          _items = raw.whereType<Map<String, dynamic>>().toList();
          _loading = false;
          _error = null;
        });
      }
    } catch (_) {
      if (mounted)
        setState(() {
          _loading = false;
          _error = 'Pesan belum dapat dimuat';
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pesan'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh))
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: kAccent, strokeWidth: 2))
          : _error != null
              ? Center(
                  child: Text(_error!, style: const TextStyle(color: kMuted)))
              : _items.isEmpty
                  ? const Center(
                      child: Text('Belum ada pesan',
                          style: TextStyle(color: kMuted)))
                  : ListView.separated(
                      itemCount: _items.length,
                      separatorBuilder: (_, __) => const Divider(
                          indent: 68, height: .5, thickness: .5, color: kLine),
                      itemBuilder: (_, index) => _tile(context, _items[index]),
                    ),
    );
  }

  Widget _tile(BuildContext context, Map<String, dynamic> item) {
    final users = item['users'] as List<dynamic>? ?? const [];
    final first = users.isNotEmpty && users.first is Map<String, dynamic>
        ? users.first as Map<String, dynamic>
        : <String, dynamic>{};
    final title =
        item['title'] as String? ?? first['username'] as String? ?? 'Pesan';
    final last = item['last'] as Map<String, dynamic>? ?? const {};
    final unread = (item['unread'] as num? ?? 0) > 0;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 13, vertical: 5),
      leading: AvatarWidget(
          username: first['username'] as String? ?? title,
          url: first['photo'] as String?),
      title: Text(title,
          style: TextStyle(
              fontFamily: 'Outfit',
              fontWeight: unread ? FontWeight.w700 : FontWeight.w500,
              color: kText)),
      subtitle: Text(last['text'] as String? ?? '',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(color: unread ? kText2 : kMuted)),
      trailing: unread
          ? Container(
              width: 8,
              height: 8,
              decoration:
                  const BoxDecoration(color: kAccent, shape: BoxShape.circle))
          : null,
      onTap: () => context.push('/pesan/${item['id']}'),
    );
  }
}
