#!/bin/bash

# Build script for mandelbrotjs with Rust WebAssembly support

set -e

echo "🦀 Building Rust WebAssembly module..."

# Navigate to the wasm directory
cd wasm

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Installing..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
fi

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "📦 Installing wasm-pack..."
    cargo install wasm-pack
fi

# Add wasm32 target if not already added
rustup target add wasm32-unknown-unknown

# Build the WebAssembly module
echo "🔨 Compiling Rust to WebAssembly..."
wasm-pack build --target web --out-dir pkg

# Copy the built package to the root directory
echo "📋 Copying WASM package to root directory..."
cd ..
cp -r wasm/pkg .

echo "✅ Build complete! WebAssembly module is ready."
echo ""
echo "📂 Generated files:"
echo "  - pkg/mandel_wasm.js (JavaScript bindings)"
echo "  - pkg/mandel_wasm_bg.wasm (WebAssembly binary)"
echo "  - mandel-compute-wasm.js (Worker wrapper)"
echo ""
echo "🚀 The application will automatically use WebAssembly if supported by the browser."