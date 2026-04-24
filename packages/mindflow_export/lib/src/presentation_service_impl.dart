import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'presentation_service.dart';

class PresentationServiceImpl implements PresentationService {
  @override
  Future<PresentationResult> generatePresentation(String markdown, {String? title}) async {
    try {
      final slides = _parseSlides(markdown);
      final html = _generateRevealJsHtml(title ?? '演示文稿', slides);
      final dir = await _getExportDirectory();
      final fileName = '${DateTime.now().millisecondsSinceEpoch}_presentation.html';
      final file = File('${dir.path}/$fileName');
      await file.writeAsString(html);
      return PresentationResult(success: true, htmlPath: file.path, slideCount: slides.length);
    } catch (e) {
      return PresentationResult(success: false, error: e.toString());
    }
  }

  @override
  Future<String> getPresentationHtml(String path) async => File(path).readAsString();

  @override
  Future<int> getSlideCount(String path) async => '<section'.allMatches(await getPresentationHtml(path)).length;

  List<String> _parseSlides(String markdown) => markdown.split(RegExp(r'\n---\n')).map((s) => s.trim()).where((s) => s.isNotEmpty).toList();

  String _generateRevealJsHtml(String title, List<String> slides) {
    final slidesHtml = slides.map((s) => '    <section>$s</section>').join('\n');
    return '''<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>$title</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/theme/white.min.css">
<style>.reveal { font-family: sans-serif; } .reveal h1, .reveal h2, .reveal h3 { text-transform: none; } .reveal pre { box-shadow: none; }</style>
</head><body><div class="reveal"><div class="slides">
$slidesHtml
  </div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"></script>
<script>Reveal.initialize({ hash: true, slideNumber: true, transition: 'slide' });</script>
</body></html>''';
  }

  Future<Directory> _getExportDirectory() async {
    final dir = await getApplicationDocumentsDirectory();
    final exportDir = Directory('${dir.path}/mindflow_presentations');
    if (!await exportDir.exists()) await exportDir.create(recursive: true);
    return exportDir;
  }
}

PresentationService createPresentationService() => PresentationServiceImpl();
