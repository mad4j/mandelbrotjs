// Build configuration and utilities for mandelbrotjs with Rust WASM support

// Check if WebAssembly is supported
const WASM_SUPPORTED = (() => {
    try {
        if (typeof WebAssembly === "object" &&
            typeof WebAssembly.instantiate === "function") {
            const module = new WebAssembly.Module(
                Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
            );
            if (module instanceof WebAssembly.Module)
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
        }
    } catch (e) {}
    return false;
})();

// Configuration
const BUILD_CONFIG = {
    useWasm: WASM_SUPPORTED && true, // Set to false to force JavaScript fallback
    wasmWorkerScript: 'mandel-compute-wasm.js',
    jsWorkerScript: 'mandel-compute.js'
};

console.log('WebAssembly support:', WASM_SUPPORTED ? 'YES' : 'NO');
console.log('Using worker:', BUILD_CONFIG.useWasm ? BUILD_CONFIG.wasmWorkerScript : BUILD_CONFIG.jsWorkerScript);

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BUILD_CONFIG;
} else if (typeof window !== 'undefined') {
    window.BUILD_CONFIG = BUILD_CONFIG;
}