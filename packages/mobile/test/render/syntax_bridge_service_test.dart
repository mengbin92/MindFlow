import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/render/syntax_bridge_service.dart';

void main() {
  group('SyntaxBridgeService', () {
    test('renders inline latex into bridge html', () async {
      final service = LatexSyntaxBridgeService();

      final result = await service.render('Energy: \$E=mc^2\$');

      expect(result.usedBridge, isTrue);
      expect(result.html, contains('mf-latex-inline'));
      expect(result.html, contains('E=mc^2'));
      expect(result.html, isNot(contains('\$E=mc^2\$')));
    });

    test('renders block latex into bridge html', () async {
      final service = LatexSyntaxBridgeService();

      final result = await service.render(r'''
$$
\int_0^1 x^2 dx
$$
''');

      expect(result.usedBridge, isTrue);
      expect(result.html, contains('mf-latex-block'));
      expect(result.html, contains(r'\int_0^1 x^2 dx'));
      expect(result.html, isNot(contains(r'$$')));
    });
  });
}
