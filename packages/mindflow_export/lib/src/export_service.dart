import 'dart:typed_data';

enum ExportFormat { html, pdf, image }

class ExportRequest {
  final String title;
  final String content;
  final ExportFormat format;
  final Map<String, dynamic>? options;

  ExportRequest({
    required this.title,
    required this.content,
    required this.format,
    this.options,
  });
}

class ExportResult {
  final bool success;
  final String? filePath;
  final Uint8List? bytes;
  final String? error;
  final Duration duration;

  ExportResult({
    required this.success,
    this.filePath,
    this.bytes,
    this.error,
    required this.duration,
  });
}

abstract class ExportService {
  Future<ExportResult> export(ExportRequest request);
  Future<ExportResult> exportHtml(String title, String html);
  Future<ExportResult> exportPdf(String title, String html);
  Future<ExportResult> exportImage(String title, String html);
}
