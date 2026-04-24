import 'export_file_writer_stub.dart'
    if (dart.library.io) 'export_file_writer_io.dart'
    if (dart.library.html) 'export_file_writer_web.dart';

abstract class ExportFileWriter {
  Future<String> writeMarkdownFile({
    required String fileName,
    required String content,
  });

  Future<String> writeHtmlFile({
    required String fileName,
    required String content,
  });

  Future<String> writePdfFile({
    required String fileName,
    required String html,
  });

  Future<String> writeImageFile({
    required String fileName,
    required String html,
  });

  Future<String> writeImagesZip({
    required String fileName,
    required String html,
  });
}

ExportFileWriter createExportFileWriter() => createExportFileWriterImpl();
