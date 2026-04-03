import 'dart:typed_data';

import 'package:archive/archive.dart';

class ExportArchiveBuilder {
  const ExportArchiveBuilder();

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

    return Uint8List.fromList(ZipEncoder().encode(archive) ?? const <int>[]);
  }
}
