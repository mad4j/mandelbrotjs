// High-performance Rust WebAssembly implementation for mandel-compute
// This module uses Rust+WASM as the only computation engine

let wasmModule = null;
let wasmInitialized = false;

// Initialize WebAssembly module
function initWasm() {
    if (wasmInitialized) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
        try {
            // Use importScripts for better worker compatibility
            importScripts('./pkg/mandel_wasm.js');
            
            // Initialize the WASM module
            if (typeof wasm_bindgen !== 'undefined') {
                wasm_bindgen('./pkg/mandel_wasm_bg.wasm').then(() => {
                    wasmModule = wasm_bindgen;
                    wasmInitialized = true;
                    console.log('Rust WebAssembly module loaded successfully');
                    resolve();
                }).catch(error => {
                    console.error('Failed to initialize WebAssembly module:', error);
                    wasmInitialized = false;
                    reject(error);
                });
            } else {
                throw new Error('wasm_bindgen not available');
            }
        } catch (error) {
            console.error('Failed to load WebAssembly module:', error);
            wasmInitialized = false;
            reject(error);
        }
    });
}

// WebAssembly implementation
function wasmMandelCompute(e) {
    if (!wasmInitialized || !wasmModule) {
        console.error('WASM not initialized - cannot compute');
        return;
    }
    
    const oneShot = e.data.oneShot;
    const screenX = e.data.screenX;
    const screenY = e.data.screenY;
    const zoom = e.data.zoom;
    const iter_max = e.data.iterations;
    const smooth = e.data.smooth == 1;
    
    if (oneShot == 1) {
        const x = e.data.x;
        const y = e.data.y;
        const xnorm = (x - screenX) / zoom;
        const ynorm = (y - screenY) / zoom;
        
        try {
            const result = wasmModule.mandel_one_shot(xnorm, ynorm, iter_max, smooth);
            const oneShotResult = result.iterations;
            self.postMessage({ oneShotResult: oneShotResult, usedWasm: true });
            return;
        } catch (error) {
            console.error('WASM one-shot computation failed:', error);
            return;
        }
    }
    
    // Full segment computation
    const startLine = e.data.startLine;
    const workerID = e.data.workerID;
    const blockSize = e.data.blockSize;
    const canvasWidth = e.data.canvasWidth;
    const segmentHeight = e.data.segmentHeight;
    
    try {
        const startTime = performance.now();
        let mandelData, smoothMandel;
        
        if (smooth) {
            const result = wasmModule.mandel_compute_segment_with_smooth_optimized(
                startLine, segmentHeight, canvasWidth,
                screenX, screenY, zoom, iter_max, blockSize
            );
            mandelData = new Uint8Array(result.mandel_data);
            smoothMandel = new Uint8Array(result.smooth_data);
        } else {
            const resultData = wasmModule.mandel_compute_segment_optimized(
                startLine, segmentHeight, canvasWidth,
                screenX, screenY, zoom, iter_max, smooth, blockSize
            );
            mandelData = new Uint8Array(resultData);
            smoothMandel = new Uint8Array(1); // Empty for non-smooth
        }
        
        const computeTime = performance.now() - startTime;
        console.log(`WASM computation took ${computeTime.toFixed(2)}ms for worker ${workerID}`);
        
        self.postMessage({
            finished: 1,
            mandel: mandelData.buffer,
            workerID: workerID,
            smooth: smooth ? 1 : 0,
            smoothMandel: smoothMandel.buffer,
            usedWasm: true,
            computeTime: computeTime
        }, [mandelData.buffer, smoothMandel.buffer]);
        
    } catch (error) {
        console.error('WASM segment computation failed:', error);
    }
}

// Main message handler
self.onmessage = function(e) {
    wasmMandelCompute(e);
};

// Initialize WASM on worker startup
initWasm().then(() => {
    console.log('WASM worker ready - using WebAssembly for computations');
}).catch(error => {
    console.error('WASM worker initialization failed:', error);
});