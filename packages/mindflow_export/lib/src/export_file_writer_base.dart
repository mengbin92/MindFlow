/// Abstract interface for exporting documents to various file formats.
abstract class ExportFileWriter {
  const ExportFileWriter();

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
