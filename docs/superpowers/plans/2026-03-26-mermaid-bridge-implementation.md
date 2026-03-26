# Mermaid Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Mermaid preview bridge support with theme-aware rendering so preview and all export flows share the same Mermaid-capable HTML.

**Architecture:** Extend the existing syntax bridge to detect Mermaid fenced code blocks and emit Mermaid placeholders plus theme metadata. Use the resulting bridge HTML for preview and all export flows, and inject Mermaid runtime/bootstrap only when Mermaid placeholders are present.

**Tech Stack:** Flutter, Dart, existing render/export pipeline, syntax bridge service, widget/unit tests

---

### Task 1: Extend Syntax Bridge for Mermaid Blocks

**Files:**
- Modify: `packages/mobile/lib/render/syntax_bridge_service.dart`
- Modify: `packages/mobile/lib/render/syntax_bridge_result.dart`
- Test: `packages/mobile/test/render/syntax_bridge_service_test.dart`

- [ ] Step 1: Write the failing unit tests for Mermaid fenced block conversion and theme metadata
- [ ] Step 2: Run `flutter test test/render/syntax_bridge_service_test.dart` and verify it fails for the expected missing Mermaid behavior
- [ ] Step 3: Add Mermaid block parsing to the syntax bridge and emit placeholder HTML with theme markers
- [ ] Step 4: Preserve graceful fallback/error placeholders for malformed Mermaid blocks
- [ ] Step 5: Run `flutter test test/render/syntax_bridge_service_test.dart` and verify it passes

### Task 2: Make Preview Rendering Theme-Aware

**Files:**
- Modify: `packages/mobile/lib/render/preview_render_service.dart`
- Modify: `packages/mobile/lib/render/preview_render_result.dart`
- Modify: `packages/mobile/lib/ui/screens/editor_screen.dart`
- Test: `packages/mobile/test/render/preview_render_service_test.dart`

- [ ] Step 1: Write the failing tests for theme-aware bridge output
- [ ] Step 2: Run `flutter test test/render/preview_render_service_test.dart` and verify it fails for the expected theme propagation gap
- [ ] Step 3: Pass light/dark theme information into the preview render pipeline
- [ ] Step 4: Ensure preview refreshes still remain race-safe and bridge metadata is preserved
- [ ] Step 5: Run `flutter test test/render/preview_render_service_test.dart` and verify it passes

### Task 3: Reuse Mermaid Bridge HTML in Export Flows

**Files:**
- Modify: `packages/mobile/lib/render/preview_render_service.dart`
- Modify: `packages/mobile/lib/ui/screens/editor_screen.dart`
- Test: `packages/mobile/test/ui/screens/editor_screen_test.dart`

- [ ] Step 1: Write the failing widget assertions for Mermaid bridge markers and theme data in HTML/PDF/image/ZIP exports
- [ ] Step 2: Run `flutter test test/ui/screens/editor_screen_test.dart` and verify it fails for the expected export mismatch
- [ ] Step 3: Inject Mermaid runtime/bootstrap into exported HTML only when Mermaid placeholders exist
- [ ] Step 4: Ensure HTML/PDF/image/ZIP exports all reuse the same Mermaid bridge HTML
- [ ] Step 5: Run `flutter test test/ui/screens/editor_screen_test.dart` and verify it passes

### Task 4: Final Verification

**Files:**
- Verify only

- [ ] Step 1: Run `flutter test test/render/syntax_bridge_service_test.dart`
- [ ] Step 2: Run `flutter test test/render/preview_render_service_test.dart`
- [ ] Step 3: Run `flutter test test/ui/screens/editor_screen_test.dart`
- [ ] Step 4: Run `flutter test`
