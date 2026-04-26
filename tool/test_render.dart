import 'dart:io';
import 'package:markdown/markdown.dart' as md;

void main() async {
  final testFile = File('test_rendering.md');
  if (!await testFile.exists()) {
    print('❌ test_rendering.md not found');
    exit(1);
  }

  final content = await testFile.readAsString();
  final html = md.markdownToHtml(
    content,
    extensionSet: md.ExtensionSet.gitHubWeb,
  );

  print('✅ Markdown Parsing: OK');
  print('Input length: ${content.length} chars');
  print('Output HTML length: ${html.length} chars\n');

  // Test the HTML document builder
  final doc = _buildHtmlDocument('Test Document', html);
  print('✅ HTML Document Builder: OK');
  print('Document size: ${doc.length} chars\n');

  // Save output
  final outputFile = File('test_rendering_output.html');
  await outputFile.writeAsString(doc);
  print('✅ Output saved to: test_rendering_output.html');

  // Preview first 500 chars
  print('\n--- HTML Preview (first 500 chars) ---');
  print(doc.substring(0, min(500, doc.length)));
}

String _buildHtmlDocument(String title, String bodyHtml) {
  return '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>$title</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.6;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1, h2, h3 { margin-top: 24px; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; }
    blockquote { border-left: 4px solid #dfe2e5; margin: 0; padding-left: 16px; color: #6a737d; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #dfe2e5; padding: 8px 12px; }
    th { background: #f6f8fa; }
  </style>
</head>
<body>
  $bodyHtml
</body>
</html>
''';
}

int min(int a, int b) => a < b ? a : b;
