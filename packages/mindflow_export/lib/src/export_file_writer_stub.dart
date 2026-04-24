import 'export_archive_builder.dart';
import 'export_file_writer_base.dart';

export 'export_archive_builder.dart';
export 'export_file_writer_base.dart';

/// [ExportFileWriter] implementation for unsupported platforms.
/// All operations throw [UnsupportedError].
class UnsupportedExportFileWriter implements ExportFileWriter {
  const UnsupportedExportFileWriter();

  @override
  Future<String> writeMarkdownFile({
    required String fileName,
    required String content,
  }) {
    throw UnsupportedError(
        'Markdown export is not available on this platform');
  }

  @override
  Future<String> writeHtmlFile({
    required String fileName,
    required String content,
  }) {
    throw UnsupportedError('HTML export is not available on this platform');
  }

  @override
  Future<String> writePdfFile({
    required String fileName,
    required String html,
  }) {
    throw UnsupportedError('PDF export is not available on this platform');
  }

  @override
  Future<String> writeImageFile({
    required String fileName,
    required String html,
  }) {
    throw UnsupportedError('Image export is not available on this platform');
  }

  @override
  Future<String> writeImagesZip({
    required String fileName,
    required String html,
  }) {
    throw UnsupportedError(
        'Multi-page image ZIP export is not available on this platform');
  }
}

ExportFileWriter createExportFileWriterImpl() =>
    const UnsupportedExportFileWriter();
