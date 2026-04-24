import 'markdown_parser.dart';

/// 预览结果
class PreviewResult {
  final String html;
  final List<String> errors;
  final Duration parseTime;

  PreviewResult({
    required this.html,
    this.errors = const [],
    required this.parseTime,
  });
}

/// 预览服务 - 将 Markdown 渲染为 HTML
class PreviewService {
  PreviewService({MarkdownParser? parser}) : _parser = parser ?? MarkdownParser();

  final MarkdownParser _parser;

  /// 渲染 Markdown 为 HTML
  PreviewResult render(String markdown) {
    final stopwatch = Stopwatch()..start();
    try {
      final html = _parser.parseWithExtensions(markdown);
      stopwatch.stop();
      return PreviewResult(
        html: _wrapHtml(html),
        parseTime: stopwatch.elapsed,
      );
    } catch (e) {
      stopwatch.stop();
      return PreviewResult(
        html: '<p>解析错误: $e</p>',
        errors: [e.toString()],
        parseTime: stopwatch.elapsed,
      );
    }
  }

  /// 渲染为纯 HTML（不含完整文档包装）
  PreviewResult renderBody(String markdown) {
    final stopwatch = Stopwatch()..start();
    try {
      final html = _parser.parseWithExtensions(markdown);
      stopwatch.stop();
      return PreviewResult(
        html: html,
        parseTime: stopwatch.elapsed,
      );
    } catch (e) {
      stopwatch.stop();
      return PreviewResult(
        html: '<p>解析错误: $e</p>',
        errors: [e.toString()],
        parseTime: stopwatch.elapsed,
      );
    }
  }

  /// 包装 HTML 为完整文档
  String _wrapHtml(String body) {
    return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.0/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true });
    document.addEventListener('DOMContentLoaded', function() {
      hljs.highlightAll();
    });
  </script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
      color: #24292e;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 85%; }
    pre code { background: transparent; padding: 0; }
    blockquote { border-left: 4px solid #dfe2e5; margin: 0; padding-left: 16px; color: #6a737d; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #dfe2e5; padding: 8px 12px; }
    th { background: #f6f8fa; font-weight: 600; }
    img { max-width: 100%; height: auto; }
    hr { height: 0.25em; padding: 0; margin: 24px 0; background: #e1e4e8; border: 0; }
    .mermaid { background: #fff; text-align: center; padding: 20px; }
    .latex-inline { color: #d73a49; font-family: 'Times New Roman', serif; }
    .latex-block { text-align: center; padding: 16px; background: #f6f8fa; margin: 16px 0; border-radius: 6px; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul, ol { padding-left: 2em; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
$body
</body>
</html>
''';
  }
}
