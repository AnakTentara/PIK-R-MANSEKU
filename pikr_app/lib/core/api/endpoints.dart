// lib/core/api/endpoints.dart
// Semua API endpoint constants

class Ep {
  Ep._();

  // Auth Ruang Cerita: login memakai NISN, token candidate 7 hari.
  static const login = '/candidates/login';
  static const me = '/rc/me';

  // Feed
  static const feed = '/rc/feed';
  static String post(String id) => '/rc/posts/$id';
  static String postLike(String id) => '/rc/posts/$id/like';
  static String postComment(String id) => '/rc/posts/$id/comments';
  static const stories = '/rc/stories';

  // Stories
  static String story(String id) => '/rc/stories/$id';
  static String userStories(String username) => '/rc/users/$username/stories';

  // Messages
  static const threads = '/rc/inbox';
  static String thread(String id) => '/rc/threads/$id';
  static String threadMessages(String id) => '/rc/threads/$id/messages';
  static String threadRead(String id) => '/rc/threads/$id/read';
  static String threadTyping(String id) => '/rc/threads/$id/typing';

  // Notifications
  static const notifications = '/rc/notifications';
  static const notifRead = '/rc/notifications/read';
  static const badges = '/rc/badges';

  // Profile
  static String profile(String username) => '/rc/users/$username';
  static String follow(String username) => '/rc/users/$username/follow';
  static const updateProfile = '/rc/me/settings';

  // AI Counsel
  static const aiSessions = '/rc/ai/sessions';
  static String aiSession(String id) => '/rc/ai/sessions/$id';
  static String aiChat(String id) => '/rc/ai/sessions/$id/chat';
  static String aiTone(String id) => '/rc/ai/sessions/$id/tone';

  // Bilik Konseling
  static const counselRooms = '/rc/counsel';
  static String counselRoom(String id) => '/rc/counsel/$id';
  static String counselMessages(String id) => '/rc/counsel/$id/messages';

  // Media
  static const upload = '/media/upload';

  // SSE: backend mengharuskan token query karena EventSource tidak kirim Authorization.
  static String liveEvents(String token) =>
      '/rc/stream?token=${Uri.encodeComponent(token)}';
}
