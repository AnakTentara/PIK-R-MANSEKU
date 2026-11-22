// lib/features/home/post_provider.dart
// Riverpod provider untuk feed posts dengan infinite scroll

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/client.dart';
import '../../core/api/endpoints.dart';

// ─── Model ───────────────────────────────────────────────────────────────────
class Post {
  final String id;
  final String authorId;
  final String authorUsername;
  final String? authorAvatar;
  final String? authorDisplayName;
  final String? text;
  final String? mediaUrl;
  final int likeCount;
  final int commentCount;
  final bool liked;
  final DateTime createdAt;

  const Post({
    required this.id,
    required this.authorId,
    required this.authorUsername,
    this.authorAvatar,
    this.authorDisplayName,
    this.text,
    this.mediaUrl,
    required this.likeCount,
    required this.commentCount,
    required this.liked,
    required this.createdAt,
  });

  factory Post.fromJson(Map<String, dynamic> j) {
    final author = j['author'] as Map<String, dynamic>? ?? {};
    return Post(
      id: j['id'] as String,
      authorId: author['id'] as String? ?? '',
      authorUsername: author['username'] as String? ?? '',
      authorAvatar: author['photo'] as String? ?? author['avatar'] as String?,
      authorDisplayName:
          author['name'] as String? ?? author['displayName'] as String?,
      text: j['caption'] as String? ?? j['text'] as String?,
      mediaUrl: ((j['media'] as List<dynamic>?)?.isNotEmpty ?? false)
          ? (((j['media'] as List<dynamic>).first
              as Map<String, dynamic>)['url'] as String?)
          : j['mediaUrl'] as String?,
      likeCount: j['_count']?['likes'] as int? ?? j['likeCount'] as int? ?? 0,
      commentCount:
          j['_count']?['comments'] as int? ?? j['commentCount'] as int? ?? 0,
      liked: j['liked'] as bool? ?? false,
      createdAt:
          DateTime.tryParse(j['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }

  Post copyWith({bool? liked, int? likeCount}) => Post(
        id: id,
        authorId: authorId,
        authorUsername: authorUsername,
        authorAvatar: authorAvatar,
        authorDisplayName: authorDisplayName,
        text: text,
        mediaUrl: mediaUrl,
        likeCount: likeCount ?? this.likeCount,
        commentCount: commentCount,
        liked: liked ?? this.liked,
        createdAt: createdAt,
      );
}

// ─── Feed State ───────────────────────────────────────────────────────────────
class FeedState {
  final List<Post> posts;
  final bool loading;
  final bool hasMore;
  final String? cursor;
  final String? error;

  const FeedState({
    this.posts = const [],
    this.loading = false,
    this.hasMore = true,
    this.cursor,
    this.error,
  });

  FeedState copyWith({
    List<Post>? posts,
    bool? loading,
    bool? hasMore,
    String? cursor,
    String? error,
  }) =>
      FeedState(
        posts: posts ?? this.posts,
        loading: loading ?? this.loading,
        hasMore: hasMore ?? this.hasMore,
        cursor: cursor ?? this.cursor,
        error: error ?? this.error,
      );
}

// ─── Notifier ─────────────────────────────────────────────────────────────────
class FeedNotifier extends AsyncNotifier<FeedState> {
  @override
  Future<FeedState> build() async {
    return _fetch();
  }

  Future<FeedState> _fetch({String? cursor}) async {
    final dio = ref.read(dioProvider);
    final params = <String, dynamic>{};
    if (cursor != null) params['cursor'] = cursor;

    final res = await dio.get(Ep.feed, queryParameters: params);
    final data = res.data as Map<String, dynamic>;
    final posts = (data['items'] as List<dynamic>? ?? [])
        .map((p) => Post.fromJson(p as Map<String, dynamic>))
        .toList();

    return FeedState(
      posts: posts,
      loading: false,
      hasMore: data['nextCursor'] != null,
      cursor: data['nextCursor'] as String?,
    );
  }

  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null || current.loading || !current.hasMore) return;

    state = AsyncData(current.copyWith(loading: true));
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get(Ep.feed, queryParameters: {
        if (current.cursor != null) 'cursor': current.cursor,
      });
      final data = res.data as Map<String, dynamic>;
      final newPosts = (data['items'] as List<dynamic>? ?? [])
          .map((p) => Post.fromJson(p as Map<String, dynamic>))
          .toList();

      state = AsyncData(current.copyWith(
        posts: [...current.posts, ...newPosts],
        loading: false,
        hasMore: data['nextCursor'] != null,
        cursor: data['nextCursor'] as String?,
      ));
    } catch (e) {
      state = AsyncData(current.copyWith(loading: false, error: e.toString()));
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    try {
      state = AsyncData(await _fetch());
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> toggleLike(String postId) async {
    final current = state.valueOrNull;
    if (current == null) return;

    // Optimistic update
    final idx = current.posts.indexWhere((p) => p.id == postId);
    if (idx == -1) return;
    final post = current.posts[idx];
    final newPosts = List<Post>.from(current.posts);
    newPosts[idx] = post.copyWith(
      liked: !post.liked,
      likeCount: post.liked ? post.likeCount - 1 : post.likeCount + 1,
    );
    state = AsyncData(current.copyWith(posts: newPosts));

    try {
      final dio = ref.read(dioProvider);
      await dio.post(Ep.postLike(postId), data: {'like': !post.liked});
    } catch (_) {
      // Revert
      newPosts[idx] = post;
      state = AsyncData(current.copyWith(posts: newPosts));
    }
  }
}

final feedProvider =
    AsyncNotifierProvider<FeedNotifier, FeedState>(FeedNotifier.new);
