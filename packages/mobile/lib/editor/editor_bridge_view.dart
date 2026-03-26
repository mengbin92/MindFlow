import 'package:flutter/material.dart';

import 'editor_bridge_controller.dart';

class EditorBridgeView extends StatelessWidget {
  final EditorBridgeController controller;

  const EditorBridgeView({
    super.key,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _BridgeStatusBanner(status: controller.status),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: controller.textController,
              maxLines: null,
              expands: true,
              textAlignVertical: TextAlignVertical.top,
              decoration: const InputDecoration(
                border: InputBorder.none,
                hintText: '开始写作...',
                contentPadding: EdgeInsets.zero,
              ),
              style: const TextStyle(
                fontSize: 16,
                height: 1.6,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _BridgeStatusBanner extends StatelessWidget {
  final EditorBridgeStatus status;

  const _BridgeStatusBanner({required this.status});

  @override
  Widget build(BuildContext context) {
    final message = switch (status) {
      EditorBridgeStatus.nativeFallback => '当前使用原生编辑器回退层，桥接接口已预留。',
      EditorBridgeStatus.bridgeReady => 'Bridge 已就绪。',
    };

    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: colorScheme.surfaceContainerHighest,
      child: Row(
        children: [
          Icon(Icons.developer_board, size: 16, color: colorScheme.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }
}
