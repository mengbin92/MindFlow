import 'dart:js_interop';
import 'dart:typed_data';

import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:web/web.dart' as web;

import 'export_archive_builder.dart';
import 'export_file_writer_base.dart';
export 'export_archive_builder.dart';
export 'export_file_writer_base.dart';

/// [ExportFileWriter] implementation for web platforms.
class WebExportFileWriter implements ExportFileWriter {
  WebExportFileWriter({
    ExportArchiveBuilder? archiveBuilder,
  }) : _archiveBuilder = archiveBuilder ?? const ExportArchiveBuilder();

  final ExportArchiveBuilder _archiveBuilder;

  bool _supportsShowSaveFilePicker() {
    try {
      return web.window['showSaveFilePicker'] != null;
    } catch (_) {
      return false;
    }
  }

  Future<void> _downloadFile({
    required String fileName,
    required Uint8List bytes,
  }) async {
    final hasSavePicker = _supportsShowSaveFilePicker();
    if (hasSavePicker) {
      try {
        final ok = await _saveFileWithPicker(fileName, bytes);
        if (ok) return;
      } catch (_) {
        // Fall through to blob download.
      }
    }

    // Fallback: trigger a download via Blob + <a download>.
    final jsArray = [bytes.buffer.asUint8List().toJS].toJS;
    final blob = web.Blob(
        jsArray, web.BlobPropertyBag(type: 'application/octet-stream'));
    final url = web.URL.createObjectURL(blob);

    final anchor = web.document.createElement('a') as web.HTMLAnchorElement;
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    web.document.body!.appendChild(anchor);
    anchor.click();
    web.document.body!.removeChild(anchor);
    web.URL.revokeObjectURL(url);
  }

  /// Attempts to save using the File System Access API showSaveFilePicker.
  /// Returns true if successful, false otherwise.
  Future<bool> _saveFileWithPicker(String fileName, Uint8List bytes) async {
    try {
      final fn = web.window['showSaveFilePicker'] as dynamic;
      // ignore: avoid_dynamic_calls
      final handle =
          await fn(<String, dynamic>{'suggestedName': fileName}).toDart;

      // ignore: avoid_dynamic_calls
      final writable = await (handle.createWritable as dynamic).toDart;

      final jsArray = [bytes.buffer.asUint8List().toJS].toJS;
      final blob = web.Blob(
          jsArray, web.BlobPropertyBag(type: 'application/octet-stream'));
      // ignore: avoid_dynamic_calls
      await (writable.write as dynamic).toDart(blob);
      // ignore: avoid_dynamic_calls
      await (writable.close as dynamic).toDart();
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<String> writeMarkdownFile({
    required String fileName,
    required String content,
  }) async {
    final bytes = Uint8List.fromList(content.codeUnits);
    await _downloadFile(fileName: fileName, bytes: bytes);
    return fileName;
  }

  @override
  Future<String> writeHtmlFile({
    required String fileName,
    required String content,
  }) async {
    final bytes = Uint8List.fromList(content.codeUnits);
    await _downloadFile(fileName: fileName, bytes: bytes);
    return fileName;
  }

  @override
  Future<String> writePdfFile({
    required String fileName,
    required String html,
  }) async {
    final pdfBytes = await Printing.convertHtml(
      html: html,
      format: PdfPageFormat.a4,
    );
    await _downloadFile(fileName: fileName, bytes: pdfBytes);
    return fileName;
  }

  @override
  Future<String> writeImageFile({
    required String fileName,
    required String html,
  }) async {
    final pdfBytes = await Printing.convertHtml(
      html: html,
      format: PdfPageFormat.a4,
    );
    final rasters = await Printing.raster(pdfBytes, dpi: 144).toList();
    if (rasters.isEmpty) {
      throw Exception('Failed to render HTML to image');
    }
    final pngBytes = await rasters.first.toPng();
    await _downloadFile(fileName: fileName, bytes: pngBytes);
    return fileName;
  }

  @override
  Future<String> writeImagesZip({
    required String fileName,
    required String html,
  }) async {
    final pdfBytes = await Printing.convertHtml(
      html: html,
      format: PdfPageFormat.a4,
    );
    final rasters = await Printing.raster(pdfBytes, dpi: 144).toList();
    final pageImages = <Uint8List>[];
    for (final raster in rasters) {
      pageImages.add(await raster.toPng());
    }
    final zipBytes = _archiveBuilder.buildImagesZip(
      baseName: fileName.replaceAll('.zip', ''),
      pageImages: pageImages,
    );
    await _downloadFile(fileName: fileName, bytes: zipBytes);
    return fileName;
  }
}

ExportFileWriter createExportFileWriterImpl() => WebExportFileWriter();
