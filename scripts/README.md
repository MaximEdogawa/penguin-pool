# Scripts Directory

This directory contains utility scripts for the Penguin Pool project.

## PWA Icon Generation

### `generate-pwa-icons.sh`

Generates all required PWA icons from a source SVG file using macOS built-in `sips` tool.

#### Usage

```bash
# Make executable (first time only)
chmod +x scripts/generate-pwa-icons.sh

# Generate icons
./scripts/generate-pwa-icons.sh
```

#### Requirements

- macOS (uses built-in `sips` command)
- Source SVG file at `src/assets/penguin-pool.svg`

#### Generated Icons

The script generates the following icon sizes:

- **16x16** - Favicon
- **32x32** - Favicon
- **72x72** - Android home screen
- **96x96** - Android home screen
- **128x128** - Android home screen
- **144x144** - Windows tiles
- **152x152** - iOS home screen
- **192x192** - Android home screen
- **384x384** - Android splash screen
- **512x512** - Android splash screen

#### Output

Icons are saved to `public/icons/` directory with naming convention:

- `icon-{size}x{size}.png`

#### Troubleshooting

**Error: Source SVG not found**

- Ensure `src/assets/penguin-pool.svg` exists
- Check file path is correct

**Error: Permission denied**

- Run `chmod +x scripts/generate-pwa-icons.sh`
- Ensure you have write permissions to `public/icons/`

**Error: sips command not found**

- This script requires macOS
- Use alternative methods on other platforms (see PWA_SETUP.md)

#### Alternative Methods

If you don't have macOS, use these alternatives:

1. **Online Tools**:
   - [PWA Builder](https://www.pwabuilder.com/imageGenerator)
   - [Favicon Generator](https://realfavicongenerator.net/)

2. **Design Tools**:
   - Figma, Sketch, Adobe Illustrator
   - Export as PNG in required sizes

3. **Command Line** (Linux/Windows):
   - ImageMagick: `convert source.svg -resize 192x192 icon-192x192.png`
   - Inkscape: `inkscape --export-png=icon-192x192.png --export-width=192 --export-height=192 source.svg`
