import 'dart:typed_data';

import 'package:archive/archive.dart';

/// Builds ZIP archives of page images for multi-page export.
class ExportArchiveBuilder {
  const ExportArchiveBuilder();

  /// Creates a ZIP file containing the given page images.
  ///
  /// Each image is named `{baseName}_{NNN}.png` where NNN is the 1-based
  /// page number zero-padded to 3 digits.
  Uint8List buildImagesZip({
    required String baseName,
    required List<Uint8List> pageImages,
  }) {
    final archive = Archive();

    for (var index = 0; index < pageImages.length; index++) {
      final pageNumber = (index + 1).toString().padLeft(3, '0');
      archive.addFile(
        ArchiveFile(
          '${baseName}_$pageNumber.png',
          pageImages[index].length,
          pageImages[index],
        ),
      );
    }

    final encoded = ZipEncoder().encode(archive);
    return Uint8List.fromList(encoded);
  }
}
