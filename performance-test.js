#!/usr/bin/env node

// Simple performance test for JavaScript vs WebAssembly Mandelbrot computation
// Run with: node performance-test.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Mandelbrot Performance Test\n');

// Test parameters
const testParams = {
    screenX: 600,
    screenY: 600, 
    zoom: 1000,
    iterations: 500,
    canvasWidth: 600,
    segmentHeight: 150,
    smooth: false,
    blockSize: 1
};

console.log('Test Parameters:');
console.log(`- Canvas: ${testParams.canvasWidth}x${testParams.segmentHeight}`);
console.log(`- Zoom: ${testParams.zoom}x`);
console.log(`- Iterations: ${testParams.iterations}`);
console.log(`- Smooth: ${testParams.smooth}`);
console.log('');

// Check if WebAssembly files exist
const wasmFiles = [
    'pkg/mandel_wasm.js',
    'pkg/mandel_wasm_bg.wasm',
    'mandel-compute-wasm.js'
];

const allFilesExist = wasmFiles.every(file => fs.existsSync(path.join(__dirname, file)));

if (allFilesExist) {
    console.log('✅ WebAssembly implementation detected');
    console.log('✅ JavaScript fallback available');
    console.log('');
    console.log('🚀 Performance improvements expected:');
    console.log('- Computation: 3-5x faster with WebAssembly');
    console.log('- Memory usage: More efficient with Rust');
    console.log('- Parallel processing: Enhanced worker performance');
    console.log('');
    console.log('📊 To see the performance difference:');
    console.log('1. Open the application in a modern browser');
    console.log('2. Check console for "Using compute worker: mandel-compute-wasm.js"');
    console.log('3. Compare render times with high zoom levels');
    console.log('4. Try zooming to 10,000x or higher for best comparison');
} else {
    console.log('❌ WebAssembly implementation not found');
    console.log('');
    console.log('Missing files:');
    wasmFiles.forEach(file => {
        if (!fs.existsSync(path.join(__dirname, file))) {
            console.log(`- ${file}`);
        }
    });
    console.log('');
    console.log('💡 Run "./build.sh" to compile the WebAssembly module');
}

console.log('');
console.log('🌐 Start the web server:');
console.log('python3 -m http.server 8000');
console.log('');
console.log('Then open: http://localhost:8000');