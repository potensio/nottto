#!/bin/bash

# Install Tailwind CSS if not already installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the CSS
echo "Building Tailwind CSS..."
npx tailwindcss -i ./src/input.css -o ./overlay.css --minify

echo "✅ Build complete! The overlay.css file has been generated with Tailwind utilities."
echo "Your Chrome extension is now using Tailwind CSS instead of custom CSS."