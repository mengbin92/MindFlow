import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/render/syntax_bridge_service.dart';

void main() {
  group('SyntaxBridgeService', () {
    test('renders inline latex into bridge html', () async {
      const service = CompositeSyntaxBridgeService();

      final result = await service.render('Energy: \$E=mc^2\$');

      expect(result.usedBridge, isTrue);
      expect(result.html, contains('mf-latex-inline'));
      expect(result.html, contains('E=mc^2'));
      expect(result.html, isNot(contains('\$E=mc^2\$')));
    });

    test('renders block latex into bridge html', () async {
      const service = CompositeSyntaxBridgeService();

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

    test('renders mermaid fenced block into bridge placeholder html', () async {
      const service = CompositeSyntaxBridgeService();

      final result = await service.render(
        '```mermaid\ngraph TD;\nA-->B;\n```',
        isDarkMode: false,
      );

      expect(result.usedBridge, isTrue);
      expect(result.html, contains('mf-mermaid'));
      expect(result.html, contains('graph TD;'));
      expect(result.html, contains('A--&gt;B;'));
      expect(result.html, contains('data-mermaid-theme="default"'));
      expect(result.html, isNot(contains('```mermaid')));
    });

    test('renders mermaid fenced block with dark theme metadata', () async {
      const service = CompositeSyntaxBridgeService();

      final result = await service.render(
        '```mermaid\ngraph TD;\nA-->B;\n```',
        isDarkMode: true,
      );

      expect(result.html, contains('data-mermaid-theme="dark"'));
    });

    test('renders plantuml fenced block into bridge placeholder html', () async {
      const service = CompositeSyntaxBridgeService();

      final result = await service.render(
        '```plantuml\n@startuml\nAlice -> Bob: Hello\n@enduml\n```',
      );

      expect(result.usedBridge, isTrue);
      expect(result.html, contains('mf-plantuml'));
      expect(result.html, contains('data-plantuml-code'));
      expect(result.html, contains('@startuml'));
      expect(result.html, isNot(contains('```plantuml')));
    });

    test('renders puml fenced block into bridge placeholder html', () async {
      const service = CompositeSyntaxBridgeService();

      final result = await service.render(
        '```puml\n@startuml\nAlice -> Bob\n@enduml\n```',
      );

      expect(result.usedBridge, isTrue);
      expect(result.html, contains('mf-plantuml'));
      expect(result.html, contains('data-plantuml-code'));
    });

    test('renders markmap fenced block into bridge placeholder html', () async {
      const service = CompositeSyntaxBridgeService();

      final result = await service.render(
        '```markmap\n# Root\n## Child 1\n## Child 2\n```',
      );

      expect(result.usedBridge, isTrue);
      expect(result.html, contains('mf-markmap'));
      expect(result.html, contains('data-markmap-code'));
      expect(result.html, contains('# Root'));
      expect(result.html, isNot(contains('```markmap')));
    });

    test('handles mixed syntax in a single document', () async {
      const service = CompositeSyntaxBridgeService();

      final result = await service.render(r'''
# Title

Energy: $E=mc^2$

```mermaid
graph TD; A-->B;
```

```plantuml
@startuml
Alice -> Bob
@enduml
```

```markmap
# Root
## Child
```
''');

      expect(result.usedBridge, isTrue);
      expect(result.html, contains('mf-latex-inline'));
      expect(result.html, contains('mf-mermaid'));
      expect(result.html, contains('mf-plantuml'));
      expect(result.html, contains('mf-markmap'));
    });
  });
}
