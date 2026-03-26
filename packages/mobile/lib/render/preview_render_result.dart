class PreviewRenderResult {
  final String markdown;
  final String html;
  final bool usedBridge;
  final bool fallbackUsed;
  final List<String> errors;

  const PreviewRenderResult({
    required this.markdown,
    required this.html,
    this.usedBridge = false,
    this.fallbackUsed = false,
    this.errors = const [],
  });
}
