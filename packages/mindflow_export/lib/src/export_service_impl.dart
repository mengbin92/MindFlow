import 'dart:typed_data';
import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'export_service.dart';

class ExportServiceImpl implements ExportService {
  @override
  Future<ExportResult> export(ExportRequest request) async {
    final stopwatch = Stopwatch()..start();
    try {
      switch (request.format) {
        case ExportFormat.html:
          return await exportHtml(request.title, request.content);
        case ExportFormat.pdf:
          return await exportPdf(request.title, request.content);
        case ExportFormat.image:
          return await exportImage(request.title, request.content);
      }
    } catch (e) {
      stopwatch.stop();
      return ExportResult(
        success: false,
        error: e.toString(),
        duration: stopwatch.elapsed,
      );
    }
  }

  @override
  Future<ExportResult> exportHtml(String title, String html) async {
    final stopwatch = Stopwatch()..start();
    try {
      final dir = await _getExportDirectory();
      final fileName = _sanitizeFileName(title);
      final file = File('${dir.path}/$fileName.html');
      final fullHtml = _wrapHtml(title, html);
      await file.writeAsString(fullHtml);
      stopwatch.stop();
      return ExportResult(success: true, filePath: file.path, duration: stopwatch.elapsed);
    } catch (e) {
      stopwatch.stop();
      return ExportResult(success: false, error: e.toString(), duration: stopwatch.elapsed);
    }
  }

  @override
  Future<ExportResult> exportPdf(String title, String html) async {
    final stopwatch = Stopwatch()..start();
    try {
      final pdf = pw.Document();
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          build: (context) => [
            pw.Header(level: 0, child: pw.Text(title, style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold))),
            pw.SizedBox(height: 20),
            pw.Text(_stripHtml(html), style: const pw.TextStyle(fontSize: 12)),
          ],
        ),
      );
      final bytes = await pdf.save();
      final dir = await _getExportDirectory();
      final fileName = _sanitizeFileName(title);
      final file = File('${dir.path}/$fileName.pdf');
      await file.writeAsBytes(bytes);
      stopwatch.stop();
      return ExportResult(success: true, filePath: file.path, bytes: bytes, duration: stopwatch.elapsed);
    } catch (e) {
      stopwatch.stop();
      return ExportResult(success: false, error: e.toString(), duration: stopwatch.elapsed);
    }
  }

  @override
  Future<ExportResult> exportImage(String title, String html) async {
    return ExportResult(success: false, error: '图片导出暂不支持', duration: Duration.zero);
  }

  Future<Directory> _getExportDirectory() async {
    final dir = await getApplicationDocumentsDirectory();
    final exportDir = Directory('${dir.path}/mindflow_exports');
    if (!await exportDir.exists()) await exportDir.create(recursive: true);
    return exportDir;
  }

  String _sanitizeFileName(String name) => name.replaceAll(RegExp(r'[^\w\s-]'), '').replaceAll(' ', '_');

  String _wrapHtml(String title, String body) => '''<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>$title</title><style>
body { font-family: -apple-system, sans-serif; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
h1, h2, h3 { margin-top: 24px; }
pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
code { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; }
blockquote { border-left: 4px solid #dfe2e5; margin: 0; padding-left: 16px; color: #6a737d; }
</style></head><body>$body</body></html>''';

  String _stripHtml(String html) => html.replaceAll(RegExp(r'<[^>]*>'), ' ').replaceAll(RegExp(r'\s+'), ' ').trim();
}

ExportService createExportService() => ExportServiceImpl();
