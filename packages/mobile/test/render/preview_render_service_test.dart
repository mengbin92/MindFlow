import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/render/preview_render_service.dart';

void main() {
  group('PreviewRenderService', () {
    test('renders markdown into html', () {
      const service = PreviewRenderService();

      final result = service.render('# Title');

      expect(result.markdown, '# Title');
      expect(result.html, contains('Title</h1>'));
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
  });
}
