// Build configuration for mandelbrotjs with enhanced Rust WASM implementation
// Updated for substantial refactoring with unified API

// Configuration - Enhanced WASM is the primary implementation
const BUILD_CONFIG = {
    wasmWorkerScript: 'mandel-compute-enhanced.js',
    fallbackWorkerScript: 'mandel-compute-wasm.js',
    useEnhancedAPI: true
};

console.log('Using enhanced WASM worker:', BUILD_CONFIG.wasmWorkerScript);

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BUILD_CONFIG;
} else if (typeof window !== 'undefined') {
    window.BUILD_CONFIG = BUILD_CONFIG;
}