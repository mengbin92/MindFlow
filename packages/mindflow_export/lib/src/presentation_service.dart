class PresentationSlide {
  final String content;
  final String? notes;
  PresentationSlide({required this.content, this.notes});
}

class PresentationResult {
  final bool success;
  final String? htmlPath;
  final String? error;
  final int slideCount;
  PresentationResult({required this.success, this.htmlPath, this.error, this.slideCount = 0});
}

abstract class PresentationService {
  Future<PresentationResult> generatePresentation(String markdown, {String? title});
  Future<String> getPresentationHtml(String path);
  Future<int> getSlideCount(String path);
}
