// lib/features/home/home_page.dart
// Feed utama — infinite scroll posts + stories

import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api/client.dart';
import '../../core/api/endpoints.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/colors.dart';
import '../../shared/widgets/avatar.dart';
import 'post_provider.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final _scroll = ScrollController();

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        controller: _scroll,
        slivers: [
          // ── App Bar ──────────────────────────────────────────────────────
          SliverAppBar(
            floating: true,
            snap: true,
            title: const Text(
              'Ruang Cerita',
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: kText,
                letterSpacing: -0.4,
              ),
            ),
            actions: [
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.search, color: kText2, size: 22),
              ),
            ],
          ),

          // ── Story Bar ────────────────────────────────────────────────────
          const SliverToBoxAdapter(child: _StoryBar()),

          // ── Divider ──────────────────────────────────────────────────────
          const SliverToBoxAdapter(
            child: Divider(height: 0.5, thickness: 0.5, color: kLine),
          ),

          // ── Posts ────────────────────────────────────────────────────────
          _FeedSliver(),
        ],
      ),
    );
  }
}

// ─── Story Bar: data nyata dari /api/rc/stories ─────────────────────────────
class _StoryBar extends ConsumerStatefulWidget {
  const _StoryBar();
  @override
  ConsumerState<_StoryBar> createState() => _StoryBarState();
}

class _StoryBarState extends ConsumerState<_StoryBar> {
  List<Map<String, dynamic>> items = [];
  bool loading = true;
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await ref.read(dioProvider).get(Ep.stories);
      final raw =
          (response.data as Map<String, dynamic>)['items'] as List<dynamic>? ??
              const [];
      if (mounted)
        setState(() {
          items = raw.whereType<Map<String, dynamic>>().toList();
          loading = false;
        });
    } catch (_) {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final mine = items.where((x) => x['self'] == true).firstOrNull;
    final others = items.where((x) => x['self'] != true).toList();
    return SizedBox(
      height: 96,
      child: loading
          ? const Center(
              child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                      color: kAccent, strokeWidth: 2)))
          : ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
              children: [
                _StoryAdd(
                    mine: mine,
                    onTap:
                        mine == null ? null : () => _openStory(context, mine)),
                ...others.map((x) =>
                    _StoryChip(group: x, onTap: () => _openStory(context, x))),
              ],
            ),
    );
  }

  void _openStory(BuildContext context, Map<String, dynamic> group) {
    final user = group['user'] as Map<String, dynamic>? ?? const {};
    final name = user['username'] as String?;
    if (name == null || name.isEmpty) return;
    showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Tutup cerita',
      barrierColor: Colors.black87,
      pageBuilder: (_, __, ___) =>
          _StoryViewer(username: name, isMine: group['self'] == true),
    );
  }
}

class _StoryAdd extends StatelessWidget {
  final Map<String, dynamic>? mine;
  final VoidCallback? onTap;
  const _StoryAdd({this.mine, this.onTap});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(right: 13),
        child: GestureDetector(
          onTap: onTap,
          child: Column(children: [
            Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                    color: kSurface2,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: kLine)),
                child: Icon(mine == null ? Icons.add : Icons.person,
                    color: kAccent)),
            const SizedBox(height: 4),
            Text(mine == null ? 'Buat' : 'Ceritamu',
                style: const TextStyle(
                    fontFamily: 'Inter', fontSize: 10, color: kText2)),
          ]),
        ),
      );
}

class _StoryChip extends StatelessWidget {
  final Map<String, dynamic> group;
  final VoidCallback onTap;
  const _StoryChip({required this.group, required this.onTap});
  @override
  Widget build(BuildContext context) {
    final user = group['user'] as Map<String, dynamic>? ?? const {};
    final name = user['username'] as String? ?? '?';
    final unseen = (group['unseen'] as num? ?? 0) > 0;
    return Padding(
      padding: const EdgeInsets.only(right: 13),
      child: GestureDetector(
        onTap: onTap,
        child: Column(children: [
          Container(
              width: 56,
              height: 56,
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  gradient: LinearGradient(
                      colors: unseen
                          ? const [kAccent, kAccent2]
                          : [kSurface3, kSurface3])),
              child: Container(
                  decoration: BoxDecoration(
                      color: kSurface, borderRadius: BorderRadius.circular(16)),
                  child: AvatarWidget(
                      url: _mediaUrl(user['photo'] as String?),
                      username: name,
                      size: 50))),
          const SizedBox(height: 4),
          Text(name.length > 9 ? name.substring(0, 9) + '…' : name,
              style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 10,
                  color: unseen ? kText2 : kMuted)),
        ]),
      ),
    );
  }
}

class _StoryViewer extends StatefulWidget {
  final String username;
  final bool isMine;
  const _StoryViewer({required this.username, required this.isMine});
  @override
  State<_StoryViewer> createState() => _StoryViewerState();
}

class _StoryViewerState extends State<_StoryViewer> {
  final dio = Dio(BaseOptions(baseUrl: 'https://pikr-manseku.my.id/api'));
  List<Map<String, dynamic>> items = [];
  Map<String, dynamic>? user;
  int index = 0;
  bool loading = true;
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final response = await dio.get(
          '/rc/users/' + Uri.encodeComponent(widget.username) + '/stories');
      final data = response.data as Map<String, dynamic>;
      if (mounted)
        setState(() {
          user = data['user'] as Map<String, dynamic>?;
          items = (data['items'] as List<dynamic>? ?? const [])
              .whereType<Map<String, dynamic>>()
              .toList();
          loading = false;
        });
      if (items.isNotEmpty && !widget.isMine) _view(items.first);
    } catch (_) {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _view(Map<String, dynamic> item) async {
    try {
      await dio.post('/rc/stories/' + (item['id'] as String) + '/view');
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final item = items.isEmpty ? null : items[index.clamp(0, items.length - 1)];
    final name = user?['username'] as String? ?? widget.username;
    return Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
            child: loading
                ? const Center(child: CircularProgressIndicator(color: kAccent))
                : item == null
                    ? const Center(
                        child: Text('Cerita sudah tidak tersedia',
                            style: TextStyle(color: Colors.white)))
                    : Stack(children: [
                        Center(child: _content(item)),
                        Positioned(
                            top: 12,
                            left: 13,
                            right: 13,
                            child: Row(children: [
                              AvatarWidget(
                                  url: _mediaUrl(user?['photo'] as String?),
                                  username: name,
                                  size: 38),
                              const SizedBox(width: 10),
                              Text(name,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700)),
                              const Spacer(),
                              IconButton(
                                  onPressed: () => Navigator.pop(context),
                                  icon: const Icon(Icons.close,
                                      color: Colors.white))
                            ])),
                        Positioned(
                            left: 0,
                            top: 80,
                            bottom: 80,
                            width: 90,
                            child: GestureDetector(onTap: _previous)),
                        Positioned(
                            right: 0,
                            top: 80,
                            bottom: 80,
                            width: 90,
                            child: GestureDetector(onTap: _next)),
                      ])));
  }

  Widget _content(Map<String, dynamic> item) {
    final kind = item['kind'] as String?;
    final url = _mediaUrl(item['url'] as String?);
    if (kind == 'IMAGE' && url != null)
      return Image.network(url, fit: BoxFit.contain);
    if (kind == 'TEXT') {
      return Container(
        width: double.infinity,
        height: double.infinity,
        alignment: Alignment.center,
        padding: const EdgeInsets.all(34),
        decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [kAccent, kAccent2])),
        child: Text(item['text'] as String? ?? '',
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: Colors.white,
                fontFamily: 'Outfit',
                fontSize: 28,
                fontWeight: FontWeight.w700)),
      );
    }
    return const Icon(Icons.videocam, size: 64, color: Colors.white);
  }

  void _previous() {
    if (index > 0) setState(() => index--);
  }

  void _next() {
    if (index < items.length - 1) {
      setState(() => index++);
      if (!widget.isMine) _view(items[index]);
    } else
      Navigator.pop(context);
  }
}

String? _mediaUrl(String? value) => value == null || value.isEmpty
    ? null
    : value.startsWith('http')
        ? value
        : 'https://pikr-manseku.my.id' + value;

// ─── Feed Sliver (Real data dari provider) ───────────────────────────────────
class _FeedSliver extends ConsumerStatefulWidget {
  @override
  ConsumerState<_FeedSliver> createState() => _FeedSliverState();
}

class _FeedSliverState extends ConsumerState<_FeedSliver> {
  @override
  void initState() {
    super.initState();
    // Load feed
    Future.microtask(() => ref.read(feedProvider.notifier).refresh());
  }

  @override
  Widget build(BuildContext context) {
    final feedAsync = ref.watch(feedProvider);

    return feedAsync.when(
      loading: () => SliverList(
        delegate: SliverChildBuilderDelegate(
          (_, i) => _ShimmerCard(),
          childCount: 5,
        ),
      ),
      error: (e, _) => SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.all(34),
          child: Center(
            child: Column(
              children: [
                const Icon(Icons.wifi_off, color: kMuted, size: 32),
                const SizedBox(height: 8),
                const Text('Gagal memuat',
                    style: TextStyle(fontFamily: 'Outfit', color: kMuted)),
                const SizedBox(height: 13),
                FilledButton.tonal(
                  onPressed: () => ref.read(feedProvider.notifier).refresh(),
                  child: const Text('Coba lagi'),
                ),
              ],
            ),
          ),
        ),
      ),
      data: (feed) => SliverList.separated(
        itemCount: feed.posts.length + (feed.hasMore ? 1 : 0),
        separatorBuilder: (_, __) =>
            const Divider(height: 0.5, thickness: 0.5, color: kLine),
        itemBuilder: (_, i) {
          if (i == feed.posts.length) {
            // Load more trigger
            ref.read(feedProvider.notifier).loadMore();
            return const Padding(
              padding: EdgeInsets.all(21),
              child: Center(
                  child: CircularProgressIndicator(
                      color: kAccent, strokeWidth: 2)),
            );
          }
          return _PostCard(
            post: feed.posts[i],
            onLike: () =>
                ref.read(feedProvider.notifier).toggleLike(feed.posts[i].id),
          );
        },
      ),
    );
  }
}

// ─── Shimmer Loading Card ─────────────────────────────────────────────────────
class _ShimmerCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(13, 13, 13, 13),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _ShimmerBox(width: 36, height: 36, radius: 11),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _ShimmerBox(width: 100, height: 12, radius: 6),
                  const SizedBox(height: 4),
                  _ShimmerBox(width: 60, height: 10, radius: 5),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          _ShimmerBox(width: double.infinity, height: 14, radius: 7),
          const SizedBox(height: 6),
          _ShimmerBox(width: 200, height: 14, radius: 7),
        ],
      ),
    );
  }
}

class _ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double radius;
  const _ShimmerBox(
      {required this.width, required this.height, required this.radius});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: kSurface2,
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

// ─── Post Card (Real) ─────────────────────────────────────────────────────────
class _PostCard extends ConsumerWidget {
  final Post post;
  final VoidCallback onLike;
  const _PostCard({required this.post, required this.onLike});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(13, 13, 13, 8),
            child: Row(
              children: [
                AvatarWidget(
                    url: post.authorAvatar,
                    username: post.authorUsername,
                    size: 36),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post.authorDisplayName ?? post.authorUsername,
                        style: const TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: kText,
                        ),
                      ),
                      Text(
                        _timeAgo(post.createdAt),
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 11,
                          color: kMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.more_horiz, color: kMuted, size: 20),
              ],
            ),
          ),

          // Caption
          if (post.text != null && post.text!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 13),
              child: Text(
                post.text!,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: kText,
                  height: 1.5,
                ),
              ),
            ),

          // Actions
          Padding(
            padding: const EdgeInsets.fromLTRB(5, 8, 13, 8),
            child: Row(
              children: [
                _ActionBtn(
                  icon: post.liked ? Icons.favorite : Icons.favorite_border,
                  label: '${post.likeCount}',
                  color: post.liked ? const Color(0xFFEC4899) : null,
                  onTap: onLike,
                ),
                _ActionBtn(
                    icon: Icons.chat_bubble_outline,
                    label: '${post.commentCount}',
                    onTap: () {}),
                _ActionBtn(icon: Icons.send_outlined, label: '', onTap: () {}),
                const Spacer(),
                const Icon(Icons.bookmark_border, color: kMuted, size: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'baru saja';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m lalu';
    if (diff.inHours < 24) return '${diff.inHours}j lalu';
    return '${diff.inDays}h lalu';
  }
}

// ─── Post Card (Placeholder sampai provider selesai) ─────────────────────────
class _PostCardPlaceholder extends StatelessWidget {
  final int index;
  const _PostCardPlaceholder({required this.index});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(13, 13, 13, 8),
            child: Row(
              children: [
                AvatarWidget(username: 'user${index + 1}', size: 36),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'user${index + 1}',
                        style: const TextStyle(
                          fontFamily: 'Outfit',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: kText,
                        ),
                      ),
                      const Text(
                        '2 jam lalu',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 11,
                          color: kMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.more_horiz, color: kMuted, size: 20),
              ],
            ),
          ),

          // Caption
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 13),
            child: Text(
              'Ini adalah caption contoh postingan nomor ${index + 1} di feed Ruang Cerita 🌟',
              style: const TextStyle(
                fontFamily: 'Inter',
                fontSize: 14,
                color: kText,
                height: 1.5,
              ),
            ),
          ),

          // Actions
          Padding(
            padding: const EdgeInsets.fromLTRB(5, 8, 13, 8),
            child: Row(
              children: [
                _ActionBtn(
                    icon: Icons.favorite_border, label: '${(index + 1) * 7}'),
                _ActionBtn(
                    icon: Icons.chat_bubble_outline, label: '${index + 2}'),
                _ActionBtn(icon: Icons.send_outlined, label: ''),
                const Spacer(),
                const Icon(Icons.bookmark_border, color: kMuted, size: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final Color? color;
  const _ActionBtn({
    required this.icon,
    required this.label,
    this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 4),
      child: TextButton.icon(
        onPressed: onTap ?? () {},
        style: TextButton.styleFrom(
          foregroundColor: color ?? kText2,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          minimumSize: Size.zero,
        ),
        icon: Icon(icon, size: 20, color: color ?? kText2),
        label: label.isEmpty
            ? const SizedBox.shrink()
            : Text(
                label,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: color ?? kText2,
                ),
              ),
      ),
    );
  }
}
