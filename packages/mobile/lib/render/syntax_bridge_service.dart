import 'syntax_bridge_result.dart';

abstract class SyntaxBridgeService {
  Future<SyntaxBridgeResult> render(String markdown);
}

class LatexSyntaxBridgeService implements SyntaxBridgeService {
  const LatexSyntaxBridgeService();

  @override
  Future<SyntaxBridgeResult> render(String markdown) async {
    var html = markdown;

    html = html.replaceAllMapped(RegExp(r'\$\$([\s\S]+?)\$\$'), (match) {
      final expression = _escapeHtml(match.group(1)?.trim() ?? '');
      return '<div class="mf-latex-block" data-latex="$expression">$expression</div>';
    });

    html = html.replaceAllMapped(RegExp(r'\$([^$\n]+?)\$'), (match) {
      final expression = _escapeHtml(match.group(1)?.trim() ?? '');
      return '<span class="mf-latex-inline" data-latex="$expression">$expression</span>';
    });

    return SyntaxBridgeResult(
      html: html,
      usedBridge: true,
      errors: const [],
    );
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
