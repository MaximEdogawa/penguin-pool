#!/bin/bash

# Generate PWA icons from the existing SVG
# This script uses macOS built-in sips tool

echo "Generating PWA icons..."

# Source SVG file
SOURCE_SVG="/Users/leo-private/Projects/chia/penguin-pool/src/assets/penguin-pool.svg"

# Check if source exists
if [ ! -f "$SOURCE_SVG" ]; then
    echo "Source SVG not found: $SOURCE_SVG"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p /Users/leo-private/Projects/chia/penguin-pool/public/icons

# Icon sizes needed for PWA
declare -a sizes=(16 32 72 96 128 144 152 192 384 512)

# Generate PNG icons from SVG
for size in "${sizes[@]}"; do
    echo "Generating icon-${size}x${size}.png..."
    sips -s format png -z $size $size "$SOURCE_SVG" --out "/Users/leo-private/Projects/chia/penguin-pool/public/icons/icon-${size}x${size}.png"
done

echo "PWA icons generated successfully!"
echo "Icons are located in: /Users/leo-private/Projects/chia/penguin-pool/public/icons/"
