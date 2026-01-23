#!/bin/bash

# MindFlow Icon Generation Script
# This script generates application icons from a master SVG or PNG file

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}MindFlow Icon Generator${NC}"
echo "=============================="
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick is not installed${NC}"
    echo "Please install ImageMagick:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/"
    exit 1
fi

# Check if source icon exists
if [ ! -f "icon.svg" ] && [ ! -f "icon-master.png" ]; then
    echo -e "${YELLOW}Warning: No source icon found (icon.svg or icon-master.png)${NC}"
    echo "Please create a source icon first."
    echo ""
    echo "Creating a simple placeholder icon..."
    echo ""
    # Create a simple placeholder using ImageMagick
    convert -size 1024x1024 xc:none \
        -fill '#1890ff' \
        -draw 'circle 512,512 512,0' \
        -fill white \
        -font Helvetica-Bold \
        -pointsize 400 \
        -gravity center \
        -annotate +0+0 'MF' \
        -write icon.png \
        icon.png

    echo -e "${GREEN}Created placeholder icon: icon.png${NC}"
    echo "Please replace it with your designed icon."
fi

# Determine source file
if [ -f "icon.svg" ]; then
    SOURCE="icon.svg"
    echo "Using SVG source: icon.svg"
elif [ -f "icon-master.png" ]; then
    SOURCE="icon-master.png"
    echo "Using PNG source: icon-master.png"
else
    SOURCE="icon.png"
    echo "Using generated placeholder: icon.png"
fi

# Generate different sizes
echo ""
echo "Generating icons..."

SIZES=(32 128 256 512 1024)
for size in "${SIZES[@]}"; do
    echo -n "  ${size}x${size}... "
    convert "$SOURCE" -resize ${size}x${size} ${size}x${size}.png
    echo -e "${GREEN}✓${NC}"
done

# Generate @2x variants for macOS
echo ""
echo "Generating macOS @2x icons..."
convert "$SOURCE" -resize 64x64 32x32@2x.png
echo "  32x32@2x... ${GREEN}✓${NC}"
convert "$SOURCE" -resize 256x256 128x128@2x.png
echo "  128x128@2x... ${GREEN}✓${NC}"
convert "$SOURCE" -resize 512x512 256x256@2x.png
echo "  256x256@2x... ${GREEN}✓${NC}"
convert "$SOURCE" -resize 1024x1024 512x512@2x.png
echo "  512x512@2x... ${GREEN}✓${NC}"

# Generate Windows .ico if icoutils is available
if command -v icotool &> /dev/null; then
    echo ""
    echo "Generating Windows .ico..."
    icotool -c -o icon.ico 32x32.png 128x128.png 256x256.png 512x512.png
    echo "  icon.ico... ${GREEN}✓${NC}"
else
    echo ""
    echo -e "${YELLOW}Note: icotool not found, skipping .ico generation${NC}"
    echo "Install icoutils to generate Windows .ico files:"
    echo "  macOS: brew install icoutils"
    echo "  Ubuntu: sudo apt-get install icoutils"
fi

echo ""
echo -e "${GREEN}Icon generation complete!${NC}"
echo ""
echo "Generated files:"
ls -lh *.png *.ico 2>/dev/null || true
