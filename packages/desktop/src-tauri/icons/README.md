# MindFlow Application Icons

## Icon Requirements

This directory should contain application icons for different platforms.

### Required Sizes

#### macOS
- `icon.png` - 1024x1024px (main icon)
- `32x32@2x.png` - 64x64px
- `128x128@2x.png` - 256x256px
- `256x256@2x.png` - 512x512px
- `512x512@2x.png` - 1024x1024px

#### Windows
- `icon.ico` - Contains multiple sizes (16x16, 32x32, 48x48, 256x256)
- `icon.png` - 512x512px (for Windows Store)

#### Linux
- `32x32.png` - 32x32px
- `128x128.png` - 128x128px
- `256x256.png` - 256x256px
- `512x512.png` - 512x512px
- `icon.svg` - Scalable vector icon

### Icon Design Guidelines

1. **Style**: Minimalist, modern, clean
2. **Colors**: Use brand colors (primary: #1890ff)
3. **Elements**: Could incorporate:
   - A flowing wave/curved line representing "flow"
   - Document/page icon
   - "M" or "MF" monogram
4. **Background**: Transparent or solid color
5. **Contrast**: Ensure good visibility on both light and dark backgrounds

### Generating Icons

You can use tools like:
- **Figma**: Design and export at multiple sizes
- **Sketch**: macOS design tool
- **GIMP**: Free image editor
- **ImageMagick**: Command-line tool to generate icons from a master

#### Example using ImageMagick:

```bash
# Generate different sizes from a master icon.png
convert icon.png -resize 32x32 32x32.png
convert icon.png -resize 128x128 128x128.png
convert icon.png -resize 256x256 256x256.png
convert icon.png -resize 512x512 512x512.png
```

### Temporary Icon

For development, you can use a placeholder icon. The build process will use `icon.png` as the main icon.

### Resources

- [Tauri Icon Guide](https://tauri.app/v1/guides/features/icons/)
- [Apple HIG - App Icons](https://developer.apple.com/design/human-interface-guidelines/macos/icons-and-images/app-icon/)
- [Windows Icon Design](https://docs.microsoft.com/en-us/windows/apps/design/style/iconography/)
- [Linux Icon Theme Specification](https://specifications.freedesktop.org/icon-theme-spec/icon-theme-spec-latest.html)
