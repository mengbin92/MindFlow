import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:mindflow/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App Integration Tests', () {
    testWidgets('app starts and shows workspace', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // App should render without crashing
      expect(find.byType(MaterialApp), findsOneWidget);
    });
  });
}
