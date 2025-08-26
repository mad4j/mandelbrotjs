// Simplified Rust WebAssembly implementation for mandel-compute
// Single function API for Mandelbrot image generation

let wasmModule = null;
let wasmInitialized = false;
let pendingMessages = [];

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
                    console.log('Rust WebAssembly module loaded successfully - Simplified API');
                    
                    // Process any pending messages
                    while (pendingMessages.length > 0) {
                        const e = pendingMessages.shift();
                        wasmMandelCompute(e);
                    }
                    
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

// Simplified WebAssembly implementation using single function
function wasmMandelCompute(e) {
    if (!wasmInitialized || !wasmModule) {
        // Queue the message for when WASM is ready
        pendingMessages.push(e);
        return;
    }
    
    const oneShot = e.data.oneShot;
    
    if (oneShot == 1) {
        // For single point computation, convert screen to complex plane coordinates
        const x = e.data.x;
        const y = e.data.y;
        const screenX = e.data.screenX;
        const screenY = e.data.screenY;
        const zoom = e.data.zoom;
        const iter_max = e.data.iterations;
        
        // Convert screen coordinates to complex plane coordinates
        const x_norm = (x - screenX) / zoom;
        const y_norm = (y - screenY) / zoom;
        
        try {
            // Generate a 1x1 image for the single point
            const result = wasmModule.mandel_generate_image(x_norm, y_norm, zoom, iter_max, 1, 1, 0);
            const imageData = new Uint8Array(result);
            // Convert grayscale back to iteration count approximation
            const oneShotResult = imageData[0] === 255 ? iter_max : imageData[0];
            self.postMessage({ oneShotResult: oneShotResult, usedWasm: true });
            return;
        } catch (error) {
            console.error('WASM one-shot computation failed:', error);
            return;
        }
    }
    
    // Full image computation using new simplified API
    const startLine = e.data.startLine;
    const workerID = e.data.workerID;
    const canvasWidth = e.data.canvasWidth;
    const segmentHeight = e.data.segmentHeight;
    const screenX = e.data.screenX;
    const screenY = e.data.screenY;
    const zoom = e.data.zoom;
    const iter_max = e.data.iterations;
    
    try {
        const startTime = performance.now();
        
        // Calculate the center coordinates in complex plane for this segment
        // The segment spans from startLine to startLine + segmentHeight in canvas coordinates
        const centerX = (canvasWidth / 2 - screenX) / zoom;
        const centerY = (startLine + segmentHeight / 2 - screenY) / zoom;
        
        // Generate the entire image segment using the new single function
        const imageData = wasmModule.mandel_generate_image(centerX, centerY, zoom, iter_max, canvasWidth, segmentHeight, 0);
        const mandelData = new Uint8Array(imageData);
        
        // No smooth data in simplified implementation
        const smoothMandel = new Uint8Array(1);
        
        const computeTime = performance.now() - startTime;
        console.log(`WASM simplified computation took ${computeTime.toFixed(2)}ms for worker ${workerID}`);
        
        self.postMessage({
            finished: 1,
            mandel: mandelData.buffer,
            workerID: workerID,
            smooth: 0, // No smooth in simplified implementation
            smoothMandel: smoothMandel.buffer,
            usedWasm: true,
            computeTime: computeTime
        }, [mandelData.buffer, smoothMandel.buffer]);
        
    } catch (error) {
        console.error('WASM simplified computation failed:', error);
    }
}

// Main message handler
self.onmessage = function(e) {
    wasmMandelCompute(e);
};

// Initialize WASM on worker startup
initWasm().then(() => {
    console.log('WASM worker ready - using simplified API for computations');
}).catch(error => {
    console.error('WASM worker initialization failed:', error);
});