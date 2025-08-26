// Build configuration for mandelbrotjs with Rust WASM implementation

// Configuration - WASM is the only supported implementation
const BUILD_CONFIG = {
    wasmWorkerScript: 'mandel-compute-wasm.js'
};

console.log('Using WASM worker:', BUILD_CONFIG.wasmWorkerScript);

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BUILD_CONFIG;
} else if (typeof window !== 'undefined') {
    window.BUILD_CONFIG = BUILD_CONFIG;
}