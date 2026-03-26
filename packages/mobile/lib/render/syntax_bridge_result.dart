class SyntaxBridgeResult {
  final String html;
  final bool usedBridge;
  final List<String> errors;

  const SyntaxBridgeResult({
    required this.html,
    required this.usedBridge,
    required this.errors,
  });
}
