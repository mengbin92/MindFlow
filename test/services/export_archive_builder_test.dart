import 'dart:typed_data';

import 'package:archive/archive.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mindflow/services/export_archive_builder.dart';

void main() {
  test('builds a zip archive with ordered page png files', () {
    const builder = ExportArchiveBuilder();

    final zipBytes = builder.buildImagesZip(
      baseName: 'roadmap',
      pageImages: [
        Uint8List.fromList([1, 2, 3]),
        Uint8List.fromList([4, 5, 6]),
      ],
    );

    final archive = ZipDecoder().decodeBytes(zipBytes);
    final names =
        archive.files.map((file) => file.name).toList(growable: false);

    expect(names, ['roadmap_001.png', 'roadmap_002.png']);
    expect(archive.files[0].content, [1, 2, 3]);
    expect(archive.files[1].content, [4, 5, 6]);
  });
}
