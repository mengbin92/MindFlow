# LaTeX Bridge Design

## Goal

Add a LaTeX preview bridge to the Flutter app so that:

- preview renders LaTeX formulas correctly
- HTML export contains rendered LaTeX output
- PDF export contains rendered LaTeX output
- image export and multi-page image ZIP export contain rendered LaTeX output

The first implementation only covers LaTeX. Mermaid, PlantUML, and Markmap remain out of scope.

## Scope

In scope:

- inline LaTeX: `$...$`
- block LaTeX: `$$...$$`
- one shared HTML output for preview and all export flows
- fallback behavior when the bridge is unavailable or fails

Out of scope:

- editor-side syntax highlighting
- Mermaid bridge
- PlantUML bridge
- Markmap bridge
- remote CDN-based rendering

## Recommended Approach

Use the existing TypeScript extended-syntax capability as the rendering source of truth and introduce a thin Flutter-side bridge orchestration layer.

Flutter remains responsible for:

- document editing
- preview state updates
- export actions
- fallback rendering

The bridge layer becomes responsible for:

- taking Markdown input
- producing final HTML with LaTeX already rendered
- reporting whether the bridge was used successfully

## Architecture

### New Units

`packages/mobile/lib/render/syntax_bridge_service.dart`

- accepts raw Markdown
- returns rendered HTML from the bridge
- hides bridge-specific details from preview/export code

`packages/mobile/lib/render/syntax_bridge_result.dart`

- carries:
  - `html`
  - `usedBridge`
  - `errors`

`packages/mobile/lib/render/preview_render_service.dart`

- continues to be the orchestration point
- first tries `SyntaxBridgeService`
- falls back to current Dart Markdown HTML generation when bridge fails

### Existing Units Updated

`packages/mobile/lib/ui/screens/editor_screen.dart`

- continues to call `PreviewRenderService.render()`
- uses the rendered HTML result for:
  - preview display
  - HTML export
  - PDF export
  - image export
  - multi-page image ZIP export

`packages/mobile/lib/render/preview_render_result.dart`

- should be extended so preview/export consumers can tell whether bridge rendering succeeded

## Data Flow

1. User edits Markdown in the editor.
2. `DocumentEditorView` requests a preview refresh.
3. `PreviewRenderService.render(markdown)` runs.
4. `PreviewRenderService` calls `SyntaxBridgeService`.
5. If bridge rendering succeeds:
   - returned HTML becomes the canonical rendered output
   - preview uses it
   - export flows reuse the same HTML
6. If bridge rendering fails:
   - service falls back to current `markdownToHtml`
   - preview still works
   - export still works with fallback HTML

This guarantees that preview and export share one HTML source whenever the bridge is available.

## Bridge Strategy

The Flutter layer should not reimplement LaTeX rendering rules in Dart.

Instead, it should consume the existing repository capability already present in:

`packages/core/src/extended-syntax.ts`

The initial bridge can be narrow:

- only expose Markdown-in to rendered-HTML-out
- only guarantee LaTeX support
- treat every other extended syntax as pass-through or unsupported for now

## Failure Handling

The bridge must degrade gracefully.

Rules:

- full bridge success:
  - use bridge HTML
- full bridge failure:
  - use fallback Dart HTML
- partial LaTeX failure:
  - preserve visible error placeholders inside HTML
  - do not fail the whole document render
- export while bridge fails:
  - export fallback HTML rather than block the user

The UI should remain usable even if the bridge is unavailable.

## Testing Strategy

### Unit Tests

Add tests for:

- inline LaTeX rendering path
- block LaTeX rendering path
- fallback path when bridge fails
- rendered HTML being reused by export calls

### Widget Tests

Add tests proving that editor export actions use bridge-rendered HTML for:

- HTML export
- PDF export
- image export
- multi-page image ZIP export

### Verification Target

A rendered document containing LaTeX should:

- display formulas in preview
- export without raw `$...$` delimiters when bridge succeeds
- still export valid output when bridge fails

## Acceptance Criteria

- preview supports inline and block LaTeX through the bridge
- HTML export uses bridge-rendered HTML
- PDF export uses bridge-rendered HTML
- image export uses bridge-rendered HTML
- multi-page image ZIP export uses bridge-rendered HTML
- fallback rendering still works when the bridge is unavailable
