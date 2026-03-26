# LaTeX Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a LaTeX preview bridge so preview and all export flows share the same rendered LaTeX HTML.

**Architecture:** Introduce a small syntax bridge service in Flutter that attempts LaTeX-aware HTML rendering first and falls back to the existing Dart Markdown renderer when unavailable. Use the resulting HTML everywhere: preview, HTML export, PDF export, image export, and multi-page image ZIP export.

**Tech Stack:** Flutter, Dart, existing render/export pipeline, lightweight bridge service, widget/unit tests

---

### Task 1: Add Render Result Types and Fallback-Aware Preview Service

**Files:**
- Create: `packages/mobile/lib/render/syntax_bridge_result.dart`
- Create: `packages/mobile/lib/render/syntax_bridge_service.dart`
- Modify: `packages/mobile/lib/render/preview_render_result.dart`
- Modify: `packages/mobile/lib/render/preview_render_service.dart`
- Test: `packages/mobile/test/render/preview_render_service_test.dart`

- [ ] Step 1: Write the failing unit tests for bridge success metadata and fallback behavior
- [ ] Step 2: Run `flutter test test/render/preview_render_service_test.dart` and verify it fails for the expected missing API/behavior
- [ ] Step 3: Add `SyntaxBridgeResult` and `SyntaxBridgeService` abstractions
- [ ] Step 4: Extend `PreviewRenderResult` with bridge/fallback metadata and wire `PreviewRenderService` to use bridge-first rendering
- [ ] Step 5: Run `flutter test test/render/preview_render_service_test.dart` and verify it passes

### Task 2: Implement Initial LaTeX Bridge Rendering

**Files:**
- Modify: `packages/mobile/lib/render/syntax_bridge_service.dart`
- Test: `packages/mobile/test/render/syntax_bridge_service_test.dart`

- [ ] Step 1: Write the failing unit tests for inline LaTeX and block LaTeX rendering
- [ ] Step 2: Run `flutter test test/render/syntax_bridge_service_test.dart` and verify it fails because the service does not render LaTeX yet
- [ ] Step 3: Implement the minimal LaTeX bridge logic that converts `$...$` and `$$...$$` into rendered HTML placeholders/results
- [ ] Step 4: Preserve visible error/fallback behavior for malformed formulas
- [ ] Step 5: Run `flutter test test/render/syntax_bridge_service_test.dart` and verify it passes

### Task 3: Route Bridge HTML Through Export Flows

**Files:**
- Modify: `packages/mobile/lib/ui/screens/editor_screen.dart`
- Test: `packages/mobile/test/ui/screens/editor_screen_test.dart`

- [ ] Step 1: Write the failing widget assertions proving HTML/PDF/image/ZIP exports receive bridge-rendered HTML instead of raw LaTeX delimiters
- [ ] Step 2: Run `flutter test test/ui/screens/editor_screen_test.dart` and verify it fails for the expected raw-output mismatch
- [ ] Step 3: Ensure the editor export actions always use the bridge-produced HTML from the preview state
- [ ] Step 4: Keep fallback export behavior when the bridge cannot render
- [ ] Step 5: Run `flutter test test/ui/screens/editor_screen_test.dart` and verify it passes

### Task 4: Preview Surface and Verification

**Files:**
- Modify: `packages/mobile/lib/render/preview_bridge_view.dart`
- Test: `packages/mobile/test/render/preview_render_service_test.dart`
- Test: `packages/mobile/test/ui/screens/editor_screen_test.dart`

- [ ] Step 1: Add minimal preview-state visibility for whether bridge rendering was used
- [ ] Step 2: Verify preview still works when bridge falls back
- [ ] Step 3: Run `flutter test test/render/preview_render_service_test.dart`
- [ ] Step 4: Run `flutter test test/ui/screens/editor_screen_test.dart`
- [ ] Step 5: Run `flutter test`

