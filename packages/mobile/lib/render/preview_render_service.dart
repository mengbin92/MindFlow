import 'package:markdown/markdown.dart' as md;

import 'preview_render_result.dart';

class PreviewRenderService {
  const PreviewRenderService();

  PreviewRenderResult render(String markdown) {
    final html = md.markdownToHtml(
      markdown.isEmpty ? '无内容' : markdown,
      extensionSet: md.ExtensionSet.gitHubWeb,
    );
    return PreviewRenderResult(
      markdown: markdown,
      html: html,
    );
  }

  String buildHtmlDocument({
    required String title,
    required String bodyHtml,
  }) {
    final safeTitle = _escapeHtml(title.isEmpty ? 'Untitled' : title);

    return '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$safeTitle</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f1e8;
      --surface: #fffdf8;
      --text: #1f2328;
      --muted: #5f6b76;
      --border: #ded6c4;
      --code-bg: #f1ebdd;
      --accent: #9f5b2d;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 32px 20px;
      font-family: "Georgia", "Times New Roman", serif;
      background:
        radial-gradient(circle at top, rgba(159, 91, 45, 0.12), transparent 36%),
        linear-gradient(180deg, var(--bg) 0%, #efe7d8 100%);
      color: var(--text);
    }

    .mf-document {
      width: min(860px, 100%);
      margin: 0 auto;
      padding: 40px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      box-shadow: 0 24px 80px rgba(79, 55, 33, 0.12);
      line-height: 1.75;
    }

    h1, h2, h3, h4, h5, h6 {
      line-height: 1.2;
      margin-top: 1.6em;
      margin-bottom: 0.6em;
    }

    h1 { font-size: 2.4rem; margin-top: 0; }
    h2 { font-size: 1.8rem; }
    h3 { font-size: 1.4rem; }

    p, ul, ol, blockquote, pre, table {
      margin: 0 0 1rem;
    }

    a { color: var(--accent); }

    blockquote {
      margin-left: 0;
      padding: 12px 16px;
      border-left: 4px solid var(--accent);
      background: rgba(159, 91, 45, 0.08);
      color: var(--muted);
    }

    code {
      padding: 0.15em 0.35em;
      border-radius: 6px;
      background: var(--code-bg);
      font-family: "SFMono-Regular", "Menlo", monospace;
      font-size: 0.92em;
    }

    pre {
      overflow-x: auto;
      padding: 16px;
      border-radius: 16px;
      background: var(--code-bg);
      border: 1px solid var(--border);
    }

    pre code {
      padding: 0;
      background: transparent;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 10px 12px;
      border: 1px solid var(--border);
      text-align: left;
    }

    th {
      background: #f7f2e7;
    }
  </style>
</head>
<body>
  <main class="mf-document">
    $bodyHtml
  </main>
</body>
</html>
''';
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
