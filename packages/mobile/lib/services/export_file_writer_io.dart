import 'dart:io';
import 'dart:typed_data';

import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';

import 'export_archive_builder.dart';
import 'export_file_writer.dart';

class IoExportFileWriter implements ExportFileWriter {
  IoExportFileWriter({
    ExportArchiveBuilder? archiveBuilder,
  }) : _archiveBuilder = archiveBuilder ?? const ExportArchiveBuilder();

  final ExportArchiveBuilder _archiveBuilder;

  @override
  Future<String> writeMarkdownFile({
    required String fileName,
    required String content,
  }) async {
    return _writeTextFile(
      fileName: fileName,
      content: content,
    );
  }

  @override
  Future<String> writeHtmlFile({
    required String fileName,
    required String content,
  }) async {
    return _writeTextFile(
      fileName: fileName,
      content: content,
    );
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
    return _writeBinaryFile(
      fileName: fileName,
      bytes: pdfBytes,
    );
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
    final firstPage = await Printing.raster(
      pdfBytes,
      pages: const [0],
      dpi: 144,
    ).first;
    final pngBytes = await firstPage.toPng();

    return _writeBinaryFile(
      fileName: fileName,
      bytes: pngBytes,
    );
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
    final rasters = await Printing.raster(
      pdfBytes,
      dpi: 144,
    ).toList();

    final pageImages = <Uint8List>[];
    for (final raster in rasters) {
      pageImages.add(await raster.toPng());
    }

    final zipBytes = _archiveBuilder.buildImagesZip(
      baseName: path.basenameWithoutExtension(fileName),
      pageImages: pageImages,
    );

    return _writeBinaryFile(
      fileName: fileName,
      bytes: zipBytes,
    );
  }

  Future<String> _writeTextFile({
    required String fileName,
    required String content,
  }) async {
    final directory = await getApplicationDocumentsDirectory();
    final filePath = path.join(directory.path, 'exports', fileName);

    await Directory(path.dirname(filePath)).create(recursive: true);

    final file = File(filePath);
    await file.writeAsString(content, flush: true);

    return filePath;
  }

  Future<String> _writeBinaryFile({
    required String fileName,
    required Uint8List bytes,
  }) async {
    final directory = await getApplicationDocumentsDirectory();
    final filePath = path.join(directory.path, 'exports', fileName);

    await Directory(path.dirname(filePath)).create(recursive: true);

    final file = File(filePath);
    await file.writeAsBytes(bytes, flush: true);

    return filePath;
  }
}

ExportFileWriter createExportFileWriterImpl() => IoExportFileWriter();
