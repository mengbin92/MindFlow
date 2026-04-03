import 'package:markdown/markdown.dart' as md;

class PresentationService {
  const PresentationService();

  String buildPresentationHtml({
    required String markdown,
    String theme = 'black',
    String transition = 'slide',
    bool showControls = true,
    bool showProgress = true,
    bool showSlideNumber = true,
  }) {
    final slides = _splitSlides(markdown);
    final slidesHtml = slides.map((slide) {
      final noteHtml = slide.note != null
          ? '<aside class="notes">${slide.note}</aside>'
          : '';
      return '<section>${slide.html}$noteHtml</section>';
    }).join('\n');

    final safeTitle = _escapeHtml(_extractTitle(markdown));

    return '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$safeTitle - MindFlow Presentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/theme/$theme.css">
  <style>
    .reveal h1, .reveal h2, .reveal h3, .reveal h4, .reveal h5, .reveal h6 {
      text-transform: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .reveal pre { box-shadow: none; }
    .reveal code {
      font-family: 'SF Mono', Monaco, Consolas, 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
$slidesHtml
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/notes/notes.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/zoom/zoom.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      transition: '$transition',
      controls: $showControls,
      progress: $showProgress,
      slideNumber: $showSlideNumber,
      keyboard: true,
      touch: true,
      overview: true,
      center: true,
      plugins: [ RevealNotes, RevealZoom ],
    });

    Reveal.on('slidechanged', function(event) {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'presentation-slide-changed',
          currentSlide: event.indexh,
          totalSlides: Reveal.getTotalSlides()
        }, '*');
      }
    });

    Reveal.on('ready', function(event) {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'presentation-ready',
          totalSlides: Reveal.getTotalSlides()
        }, '*');
      }
    });
  </script>
</body>
</html>''';
  }

  List<_SlideContent> _splitSlides(String markdown) {
    if (markdown.trim().isEmpty) {
      return [_SlideContent(html: '<p>无内容</p>')];
    }

    final rawSlides = markdown.split(RegExp(r'\n---\n'));
    return rawSlides.map((rawSlide) {
      var slideContent = rawSlide;
      String? note;

      final noteMatch = RegExp(r'Note:\s*(.+?)(?:\n|$)', caseSensitive: false)
          .firstMatch(slideContent);
      if (noteMatch != null) {
        note = noteMatch.group(1)?.trim();
        slideContent = slideContent.replaceFirst(
          RegExp(r'Note:\s*.+?(?:\n|$)', caseSensitive: false),
          '',
        );
      }

      final html = md.markdownToHtml(
        slideContent.trim(),
        extensionSet: md.ExtensionSet.gitHubWeb,
      );

      return _SlideContent(html: html, note: note);
    }).toList();
  }

  String _extractTitle(String markdown) {
    final match = RegExp(r'^#\s+(.+)$', multiLine: true).firstMatch(markdown);
    if (match != null) {
      return match.group(1)?.trim() ?? 'Untitled';
    }
    final text = markdown.replaceAll(RegExp(r'[#*_`\[\]()]'), '').trim();
    if (text.isEmpty) return 'Untitled';
    return text.length > 50 ? '${text.substring(0, 50)}...' : text;
  }

  String _escapeHtml(String value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
  }
}

class _SlideContent {
  final String html;
  final String? note;

  const _SlideContent({required this.html, this.note});
}
