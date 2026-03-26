# Multi-Page Image ZIP Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single export action that renders the current document as page-by-page PNG images and packages them into one ZIP archive.

**Architecture:** Reuse the existing full-HTML export pipeline, convert HTML to PDF with `printing`, raster each page to PNG, and archive the page images into one ZIP file. Keep the UI change small by extending the editor export sheet with one additional action and route the work through `DocumentRepository` and `ExportFileWriter`.

**Tech Stack:** Flutter, `printing`, `archive`, existing `DocumentRepository` and `ExportFileWriter`

---

### Task 1: Extend Export Contract

**Files:**
- Modify: `packages/mobile/lib/domain/repositories/document_repository.dart`
- Modify: `packages/mobile/lib/repositories/file_repository.dart`
- Modify: `packages/mobile/lib/services/export_file_writer.dart`
- Test: `packages/mobile/test/ui/screens/editor_screen_test.dart`

- [ ] Step 1: Write the failing widget test for the new export menu action
- [ ] Step 2: Run `flutter test test/ui/screens/editor_screen_test.dart` and verify it fails because the new action does not exist
- [ ] Step 3: Add `exportImagesZip()` to the repository contract and route it through `FileRepository`
- [ ] Step 4: Add the new export action to the editor export sheet
- [ ] Step 5: Run `flutter test test/ui/screens/editor_screen_test.dart` and verify the new interaction passes

### Task 2: Build ZIP Packaging Support

**Files:**
- Modify: `packages/mobile/pubspec.yaml`
- Modify: `packages/mobile/lib/services/export_file_writer.dart`
- Modify: `packages/mobile/lib/services/export_file_writer_io.dart`
- Modify: `packages/mobile/lib/services/export_file_writer_stub.dart`
- Create: `packages/mobile/test/services/export_archive_builder_test.dart`

- [ ] Step 1: Write a failing unit test for ZIP page naming and archive contents
- [ ] Step 2: Run `flutter test test/services/export_archive_builder_test.dart` and verify it fails because the builder does not exist
- [ ] Step 3: Add the `archive` dependency and implement a focused ZIP builder for ordered page PNGs
- [ ] Step 4: Use the ZIP builder from the IO writer and add a stub implementation on unsupported platforms
- [ ] Step 5: Run `flutter test test/services/export_archive_builder_test.dart` and verify it passes

### Task 3: Generate Multi-Page PNG ZIP from HTML

**Files:**
- Modify: `packages/mobile/lib/services/export_file_writer_io.dart`
- Modify: `packages/mobile/lib/ui/screens/editor_screen.dart`
- Test: `packages/mobile/test/ui/screens/editor_screen_test.dart`

- [ ] Step 1: Write the failing widget test for `导出多页图片 ZIP`
- [ ] Step 2: Run `flutter test test/ui/screens/editor_screen_test.dart` and verify it fails for the expected missing action/behavior
- [ ] Step 3: Convert HTML to PDF, raster all pages to PNG, and pass the ordered PNG list into the ZIP builder
- [ ] Step 4: Add the new editor export menu item and wire it to the repository call
- [ ] Step 5: Run `flutter test test/ui/screens/editor_screen_test.dart` and verify the interaction passes

### Task 4: Final Verification

**Files:**
- Verify only

- [ ] Step 1: Run `flutter test test/services/export_archive_builder_test.dart`
- [ ] Step 2: Run `flutter test test/ui/screens/editor_screen_test.dart`
- [ ] Step 3: Run `flutter test`
- [ ] Step 4: Confirm the output contains zero test failures and report the exact passing test count
