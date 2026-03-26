import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

import 'preview_render_result.dart';

class PreviewBridgeView extends StatelessWidget {
  final PreviewRenderResult result;

  const PreviewBridgeView({
    super.key,
    required this.result,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          child: Text(
            result.usedBridge
                ? 'Preview Bridge 已启用 LaTeX 渲染桥接。'
                : (result.fallbackUsed
                    ? 'Preview Bridge 当前已回退到本地 Markdown 渲染。'
                    : 'Preview Bridge 已通过 HTML 编排层生成预览内容。'),
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
        Expanded(
          child: Markdown(
            data: result.markdown.isEmpty ? '无内容' : result.markdown,
            padding: const EdgeInsets.all(16),
            selectable: true,
            styleSheet:
                MarkdownStyleSheet.fromTheme(Theme.of(context)).copyWith(
              p: const TextStyle(fontSize: 16, height: 1.6),
              h1: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              h2: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              h3: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              codeblockDecoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        ExpansionTile(
          title: const Text('HTML 输出'),
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              child: SelectableText(
                result.html,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontFamily: 'monospace',
                    ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
