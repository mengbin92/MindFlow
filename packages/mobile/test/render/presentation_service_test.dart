import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/render/presentation_service.dart';

void main() {
  group('PresentationService', () {
    const service = PresentationService();

    test('splits slides by horizontal rule separator', () {
      final html = service.buildPresentationHtml(
        markdown: '# Slide 1\n\nContent 1\n\n---\n\n# Slide 2\n\nContent 2',
      );

      expect(html, contains('<section>'));
      expect(html, contains('Slide 1'));
      expect(html, contains('Slide 2'));
      expect(html, contains('reveal.js'));
    });

    test('generates reveal.js HTML with default theme', () {
      final html = service.buildPresentationHtml(
        markdown: '# Hello\n\nWorld',
      );

      expect(html, contains('reveal.css'));
      expect(html, contains('black.css'));
      expect(html, contains('Reveal.initialize'));
    });

    test('generates reveal.js HTML with custom theme', () {
      final html = service.buildPresentationHtml(
        markdown: '# Hello',
        theme: 'white',
      );

      expect(html, contains('white.css'));
    });

    test('generates reveal.js HTML with custom transition', () {
      final html = service.buildPresentationHtml(
        markdown: '# Hello',
        transition: 'fade',
      );

      expect(html, contains("transition: 'fade'"));
    });

    test('hides controls when showControls is false', () {
      final html = service.buildPresentationHtml(
        markdown: '# Hello',
        showControls: false,
      );

      expect(html, contains('controls: false'));
    });

    test('handles speaker notes with Note: syntax', () {
      final html = service.buildPresentationHtml(
        markdown: '# Slide 1\n\nContent\n\nNote: This is a speaker note',
      );

      expect(html, contains('aside class="notes"'));
      expect(html, contains('This is a speaker note'));
    });

    test('escapes HTML in title', () {
      final html = service.buildPresentationHtml(
        markdown: '# <script>alert("xss")</script>',
      );

      expect(html, contains('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'));
    });

    test('handles empty markdown', () {
      final html = service.buildPresentationHtml(
        markdown: '',
      );

      expect(html, contains('reveal.css'));
      expect(html, contains('<section>'));
    });

    test('includes postMessage for slide state tracking', () {
      final html = service.buildPresentationHtml(
        markdown: '# Slide 1\n\n---\n\n# Slide 2',
      );

      expect(html, contains('postMessage'));
      expect(html, contains('presentation-slide-changed'));
      expect(html, contains('presentation-ready'));
    });
  });
}
