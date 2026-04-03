import 'package:markdown/markdown.dart' as md;

import 'preview_render_result.dart';
import 'syntax_bridge_result.dart';
import 'syntax_bridge_service.dart';

class PreviewRenderService {
  const PreviewRenderService({
    SyntaxBridgeService? syntaxBridgeService,
  }) : syntaxBridgeService = syntaxBridgeService ?? const _DefaultBridge();

  final SyntaxBridgeService? syntaxBridgeService;

  Future<PreviewRenderResult> render(String markdown,
      {bool isDarkMode = false}) async {
    if (syntaxBridgeService != null) {
      try {
        final bridgeResult = await syntaxBridgeService!.render(
          markdown,
          isDarkMode: isDarkMode,
        );
        return PreviewRenderResult(
          markdown: markdown,
          html: bridgeResult.html,
          usedBridge: bridgeResult.usedBridge,
          fallbackUsed: false,
          errors: bridgeResult.errors,
        );
      } catch (error) {
        final fallbackResult = _buildFallback(markdown);
        return PreviewRenderResult(
          markdown: markdown,
          html: fallbackResult.html,
          usedBridge: false,
          fallbackUsed: true,
          errors: [error.toString()],
        );
      }
    }

    final fallbackResult = _buildFallback(markdown);
    return PreviewRenderResult(
      markdown: markdown,
      html: fallbackResult.html,
      usedBridge: false,
      fallbackUsed: false,
      errors: const [],
    );
  }

  SyntaxBridgeResult _buildFallback(String markdown) {
    final html = md.markdownToHtml(
      markdown.isEmpty ? '无内容' : markdown,
      extensionSet: md.ExtensionSet.gitHubWeb,
    );
    return SyntaxBridgeResult(
      html: html,
      usedBridge: false,
      errors: const [],
    );
  }

  String buildHtmlDocument({
    required String title,
    required String bodyHtml,
  }) {
    final safeTitle = _escapeHtml(title.isEmpty ? 'Untitled' : title);
    final hasMermaid = bodyHtml.contains('mf-mermaid');
    final mermaidBootstrap = hasMermaid
        ? '''
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.mf-mermaid').forEach((element, index) => {
        const source = element.textContent ?? '';
        const theme = element.getAttribute('data-mermaid-theme') ?? 'default';
        const id = `mf-mermaid-\${index}`;
        try {
          mermaid.initialize({ startOnLoad: false, theme });
          mermaid.render(id, source).then(({ svg }) => {
            element.outerHTML = `<div class="mf-mermaid-rendered" data-mermaid-theme="\${theme}">\${svg}</div>`;
          });
        } catch (error) {
          element.outerHTML = `<div class="mf-mermaid-error">\${String(error)}</div>`;
        }
      });
    });
  </script>
'''
        : '';

    final hasPlantuml = bodyHtml.contains('mf-plantuml');
    final plantumlBootstrap = hasPlantuml
        ? '''
  <script src="https://cdn.jsdelivr.net/npm/plantuml-encoder@1.4.0/dist/plantuml-encoder.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.mf-plantuml').forEach((element) => {
        const code = element.getAttribute('data-plantuml-code') ?? '';
        try {
          const encoded = plantumlEncoder.encode(code);
          element.outerHTML = '<img src="https://www.plantuml.com/plantuml/svg/' + encoded + '" alt="PlantUML Diagram" style="max-width:100%">';
        } catch (error) {
          element.outerHTML = '<div class="mf-plantuml-error">' + String(error) + '</div>';
        }
      });
    });
  </script>
'''
        : '';

    final hasMarkmap = bodyHtml.contains('mf-markmap');
    final markmapBootstrap = hasMarkmap
        ? '''
  <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
  <script src="https://cdn.jsdelivr.net/npm/markmap-view@0.15.4"></script>
  <script src="https://cdn.jsdelivr.net/npm/markmap-lib@0.15.4/dist/browser/index.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.mf-markmap').forEach((element, index) => {
        const code = element.getAttribute('data-markmap-code') ?? '';
        try {
          const { Transformer } = window.markmap;
          const transformer = new Transformer();
          const { root } = transformer.transform(code);
          const id = 'mf-markmap-svg-' + index;
          element.outerHTML = '<div id="' + id + '" style="width:100%;min-height:300px"><svg style="width:100%;height:100%"></svg></div>';
          Markmap.create('#' + id + ' svg', null, root);
        } catch (error) {
          element.outerHTML = '<div class="mf-markmap-error">' + String(error) + '</div>';
        }
      });
    });
  </script>
'''
        : '';

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
$mermaidBootstrap$plantumlBootstrap$markmapBootstrap
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

class _DefaultBridge extends CompositeSyntaxBridgeService {
  const _DefaultBridge();
}
