#!/bin/bash

# Setup script for MindFlow development environment

echo "Setting up MindFlow development environment..."

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Check npm version
echo "Checking npm version..."
NPM_VERSION=$(npm -v)
echo "npm version: $NPM_VERSION"

# Install dependencies
echo "Installing dependencies..."
npm install

# Install desktop dependencies
echo "Installing desktop dependencies..."
cd packages/desktop
npm install
cd ../..

# Install web dependencies
echo "Installing web dependencies..."
cd packages/web
npm install
cd ../..

# Check if Rust is installed for Tauri
echo "Checking Rust installation..."
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo "Rust version: $RUST_VERSION"
else
    echo "Warning: Rust is not installed. You'll need Rust to build the desktop app."
    echo "Visit https://www.rust-lang.org/tools/install for installation instructions."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run desktop:dev  - Start desktop development server"
echo "  npm run web:dev      - Start web development server"
echo "  npm run build        - Build all packages"
echo "  npm run lint         - Lint all packages"
echo "  npm run format       - Format all packages"
