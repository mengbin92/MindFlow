import 'package:markdown/markdown.dart' as md;

/// Markdown 解析器，支持标准 Markdown 和扩展语法（LaTeX、Mermaid）。
class MarkdownParser {
  /// 解析标准 Markdown 为 HTML。
  String parse(String markdown) {
    return md.markdownToHtml(
      markdown,
      extensionSet: md.ExtensionSet.gitHubWeb,
    );
  }

  /// 解析带扩展语法的 Markdown，包括 LaTeX 公式和 Mermaid 图表。
  String parseWithExtensions(String markdown) {
    var result = markdown;

    // 处理 LaTeX
    result = _processLatex(result);

    // 处理 Mermaid
    result = _processMermaid(result);

    return md.markdownToHtml(
      result,
      extensionSet: md.ExtensionSet.gitHubWeb,
    );
  }

  /// 处理 LaTeX 公式语法。
  ///
  /// - 行内公式: $...$
  /// - 块公式: $$...$$
  String _processLatex(String input) {
    // 行内公式 $...$
    input = input.replaceAllMapped(
      RegExp(r'\$([^\$]+)\$'),
      (m) => '<span class="latex-inline">${m.group(1)}</span>',
    );

    // 块公式 $$...$$
    input = input.replaceAllMapped(
      RegExp(r'\$\$([^\$]+)\$\$', multiLine: true),
      (m) => '<div class="latex-block">${m.group(1)}</div>',
    );

    return input;
  }

  /// 处理 Mermaid 图表语法。
  ///
  /// 语法: ```mermaid\n...\n```
  String _processMermaid(String input) {
    return input.replaceAllMapped(
      RegExp(r'```mermaid\n([\s\S]*?)```'),
      (m) => '<div class="mermaid">${m.group(1)}</div>',
    );
  }
}
