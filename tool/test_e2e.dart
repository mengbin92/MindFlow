import 'dart:io';
import 'package:markdown/markdown.dart' as md;

void main() async {
  // Test 1: Simple rendering
  print('=== Test 1: Basic Markdown Parsing ===');
  final testFile = File('test_e2e.md');
  if (!await testFile.exists()) {
    print('❌ test_e2e.md not found');
    exit(1);
  }

  final content = await testFile.readAsString();
  final html = md.markdownToHtml(
    content,
    extensionSet: md.ExtensionSet.gitHubWeb,
  );

  print('✅ Input file loaded: ${content.length} chars');
  print('✅ Markdown parsed: ${html.length} chars HTML');

  // Test 2: Check all feature elements
  print('\n=== Test 2: Feature Element Detection ===');
  final checks = [
    ('h1-h6 headers', RegExp(r'<h[1-6]')),
    ('bold text', RegExp(r'<strong>|<b>')),
    ('italic text', RegExp(r'<em>|<i>')),
    ('strikethrough', RegExp(r'<del>|<s>|<strike>')),
    ('links', RegExp(r'<a href=')),
    ('ordered lists', RegExp(r'<ol>')),
    ('unordered lists', RegExp(r'<ul>')),
    ('task lists', RegExp(r'class="task-list-item"')),
    ('code blocks', RegExp(r'<pre><code>')),
    ('inline code', RegExp(r'<code>')),
    ('tables', RegExp(r'<table>')),
    ('blockquotes', RegExp(r'<blockquote>')),
    ('horizontal rules', RegExp(r'<hr ?>')),
  ];

  int passed = 0;
  for (final (name, pattern) in checks) {
    if (pattern.hasMatch(html)) {
      print('✅ $name');
      passed++;
    } else {
      print('⚠️  $name not detected');
    }
  }
  print('\n📊 Score: $passed/${checks.length} features detected');

  // Test 3: Generate styled HTML document
  print('\n=== Test 3: HTML Document Generation ===');
  var docContent = buildFullHtmlDocument('MindFlow E2E Test', html);
  // Replace timestamp template with actual value
  docContent = docContent.replaceAll(
    r'${new DateTime.now().toIso8601String()}',
    new DateTime.now().toIso8601String(),
  );
  await File('test_e2e_output.html').writeAsString(docContent);
  print('✅ HTML document generated: test_e2e_output.html');
  print('   Total size: ${docContent.length} chars');

  // Test 4: Preview in browser
  print('\n=== Test 4: Browser Preview ===');
  print('📂 Opening test_e2e_output.html in browser...');
  await Process.run('open', ['test_e2e_output.html']);

  // Test 5: Verify dynamic timestamp
  print('\n=== Test 5: Dynamic Timestamp ===');
  final htmlContent = await File('test_e2e_output.html').readAsString();
  if (htmlContent.contains(RegExp(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'))) {
    print('✅ Dynamic timestamp verified in output');
  } else {
    print('❌ Timestamp not found');
  }

  print('\n✅ All tests completed!');
}

String buildFullHtmlDocument(String title, String bodyHtml) {
  return '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$title</title>
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top, rgba(159, 91, 45, 0.12), transparent 36%),
        linear-gradient(180deg, var(--bg) 0%, #efe7d8 100%);
      color: var(--text);
      line-height: 1.6;
    }

    .document {
      width: min(860px, 100%);
      margin: 0 auto;
      padding: 40px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      box-shadow: 0 24px 80px rgba(79, 55, 33, 0.12);
    }

    h1, h2, h3, h4, h5, h6 {
      line-height: 1.2;
      margin-top: 1.6em;
      margin-bottom: 0.6em;
    }

    h1 { font-size: 2rem; margin-top: 0; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }

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

    ul ul, ol ol, ul ol, ol ul {
      margin-bottom: 0;
    }
  </style>
</head>
<body>
  <main class="document">
    $bodyHtml
  </main>
</body>
</html>
''';
}
