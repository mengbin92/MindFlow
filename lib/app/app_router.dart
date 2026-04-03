import 'package:go_router/go_router.dart';

import '../ui/screens/app_shell_screen.dart';
import '../ui/screens/presentation_screen.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: AppShellSection.workspace.path,
    routes: [
      GoRoute(
        path: AppShellSection.workspace.path,
        builder: (context, state) =>
            const AppShellScreen(section: AppShellSection.workspace),
        routes: [
          GoRoute(
            path: ':documentId',
            builder: (context, state) => AppShellScreen(
              section: AppShellSection.workspace,
              selectedDocumentId: state.pathParameters['documentId'],
            ),
          ),
        ],
      ),
      GoRoute(
        path: AppShellSection.favorites.path,
        builder: (context, state) =>
            const AppShellScreen(section: AppShellSection.favorites),
        routes: [
          GoRoute(
            path: ':documentId',
            builder: (context, state) => AppShellScreen(
              section: AppShellSection.favorites,
              selectedDocumentId: state.pathParameters['documentId'],
            ),
          ),
        ],
      ),
      GoRoute(
        path: AppShellSection.settings.path,
        builder: (context, state) =>
            const AppShellScreen(section: AppShellSection.settings),
      ),
      GoRoute(
        path: '/presentation',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return PresentationScreen(
            markdown: extra['markdown'] as String? ?? '',
            title: extra['title'] as String? ?? '',
            theme: extra['theme'] as String? ?? 'black',
          );
        },
      ),
    ],
  );
}
