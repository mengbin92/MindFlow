import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/render/preview_render_service.dart';
import 'package:mindflow/render/syntax_bridge_result.dart';
import 'package:mindflow/render/syntax_bridge_service.dart';

class SuccessfulBridgeService implements SyntaxBridgeService {
  @override
  Future<SyntaxBridgeResult> render(String markdown,
      {bool isDarkMode = false}) async {
    return const SyntaxBridgeResult(
      html: '<p>bridge html</p>',
      usedBridge: true,
      errors: [],
    );
  }
}

class FailingBridgeService implements SyntaxBridgeService {
  @override
  Future<SyntaxBridgeResult> render(String markdown,
      {bool isDarkMode = false}) async {
    throw Exception('bridge unavailable');
  }
}

void main() {
  group('PreviewRenderService', () {
    test('renders markdown into html through bridge when available', () async {
      final service = PreviewRenderService(
        syntaxBridgeService: SuccessfulBridgeService(),
      );

      final result = await service.render('# Title');

      expect(result.markdown, '# Title');
      expect(result.html, '<p>bridge html</p>');
      expect(result.usedBridge, isTrue);
      expect(result.fallbackUsed, isFalse);
    });

    test('falls back to markdown html when bridge fails', () async {
      final service = PreviewRenderService(
        syntaxBridgeService: FailingBridgeService(),
      );

      final result = await service.render('# Title');

      expect(result.markdown, '# Title');
      expect(result.html, contains('Title</h1>'));
      expect(result.usedBridge, isFalse);
      expect(result.fallbackUsed, isTrue);
      expect(result.errors, isNotEmpty);
    });

    test('builds a complete html document for export', () {
      const service = PreviewRenderService();

      final document = service.buildHtmlDocument(
        title: 'Roadmap',
        bodyHtml: '<h1>Title</h1><p>Body</p>',
      );

      expect(document, contains('<!DOCTYPE html>'));
      expect(document, contains('<meta charset="utf-8">'));
      expect(document, contains('<title>Roadmap</title>'));
      expect(document, contains('<body>'));
      expect(document, contains('<main class="mf-document">'));
      expect(document, contains('<h1>Title</h1><p>Body</p>'));
    });

    test('injects mermaid runtime into export html when mermaid bridge html exists',
        () {
      const service = PreviewRenderService();

      final document = service.buildHtmlDocument(
        title: 'Flow',
        bodyHtml:
            '<pre class="mf-mermaid" data-mermaid-theme="dark">graph TD;A-->B;</pre>',
      );

      expect(document, contains('mermaid.min.js'));
      expect(document, contains('querySelectorAll(\'.mf-mermaid\')'));
      expect(document, contains('data-mermaid-theme'));
    });

    test('buildHtmlDocument includes plantuml CDN when mf-plantuml present', () {
      const service = PreviewRenderService();
      final html = service.buildHtmlDocument(
        title: 'Test',
        bodyHtml: '<pre class="mf-plantuml" data-plantuml-code="test">test</pre>',
      );

      expect(html, contains('plantuml-encoder'));
      expect(html, contains('plantuml.com'));
    });

    test('buildHtmlDocument includes markmap CDN when mf-markmap present', () {
      const service = PreviewRenderService();
      final html = service.buildHtmlDocument(
        title: 'Test',
        bodyHtml: '<pre class="mf-markmap" data-markmap-code="# Root"># Root</pre>',
      );

      expect(html, contains('markmap'));
      expect(html, contains('d3'));
    });

    test('buildHtmlDocument omits all CDN when no extensions present', () {
      const service = PreviewRenderService();
      final html = service.buildHtmlDocument(
        title: 'Test',
        bodyHtml: '<p>Hello world</p>',
      );

      expect(html, isNot(contains('mermaid')));
      expect(html, isNot(contains('plantuml-encoder')));
      expect(html, isNot(contains('markmap')));
    });

    test('buildHtmlDocument includes all CDN when all extensions present', () {
      const service = PreviewRenderService();
      final html = service.buildHtmlDocument(
        title: 'Test',
        bodyHtml: '''
<pre class="mf-mermaid">graph TD;</pre>
<pre class="mf-plantuml" data-plantuml-code="test">test</pre>
<pre class="mf-markmap" data-markmap-code="# Root"># Root</pre>
''',
      );

      expect(html, contains('mermaid'));
      expect(html, contains('plantuml-encoder'));
      expect(html, contains('markmap'));
    });
  });
}
