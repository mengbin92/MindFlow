import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/main.dart';

void main() {
  testWidgets('App should build without errors', (WidgetTester tester) async {
    // Build our app
    await tester.pumpWidget(const MindFlowApp());

    // Wait for async initialization
    await tester.pumpAndSettle(const Duration(seconds: 2));

    // Verify the app built by checking for MaterialApp
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
