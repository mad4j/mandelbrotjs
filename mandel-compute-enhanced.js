// Enhanced Mandelbrot computation with unified Rust API
// This implements the refactored architecture as requested:
// - Rust handles complete image generation
// - JavaScript manages UI and worker coordination
// - Dynamic iteration calculation based on zoom
// - Aggressive multithreading optimization

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
                    console.log('Enhanced Rust WebAssembly module loaded successfully');
                    
                    // Process any pending messages
                    while (pendingMessages.length > 0) {
                        const e = pendingMessages.shift();
                        enhancedMandelCompute(e);
                    }
                    
                    resolve();
                }).catch(error => {
                    console.error('Failed to initialize enhanced WebAssembly module:', error);
                    wasmInitialized = false;
                    reject(error);
                });
            } else {
                throw new Error('wasm_bindgen not available');
            }
        } catch (error) {
            console.error('Failed to load enhanced WebAssembly module:', error);
            wasmInitialized = false;
            reject(error);
        }
    });
}

// Enhanced computation using new unified API
function enhancedMandelCompute(e) {
    if (!wasmInitialized) {
        pendingMessages.push(e);
        return;
    }
    
    const startTime = performance.now();
    
    // Extract parameters from message
    const screenX = e.data.screenX;
    const screenY = e.data.screenY;
    const zoom = e.data.zoom;
    const canvasWidth = e.data.canvasWidth;
    const canvasHeight = e.data.canvasHeight || e.data.segmentHeight;
    const maxIterations = e.data.iterations;
    const smoothRendering = e.data.smooth == 1;
    const blockSize = e.data.blockSize || 1;
    const workerID = e.data.workerID;
    
    // Handle one-shot computation
    if (e.data.oneShot == 1) {
        const x = e.data.x;
        const y = e.data.y;
        const xnorm = (x - screenX) / zoom;
        const ynorm = (y - screenY) / zoom;
        
        try {
            const result = wasmModule.mandel_one_shot(xnorm, ynorm, maxIterations, smoothRendering);
            const oneShotResult = result.iterations;
            self.postMessage({ oneShotResult: oneShotResult, usedWasm: true });
            return;
        } catch (error) {
            console.error('Enhanced WASM one-shot computation failed:', error);
            return;
        }
    }
    
    try {
        // Calculate complex plane bounds from screen coordinates and zoom
        const realRange = canvasWidth / zoom;
        const imagRange = canvasHeight / zoom;
        const centerReal = (screenX) / zoom;
        const centerImag = (screenY) / zoom;
        
        const minReal = centerReal - realRange / 2;
        const maxReal = centerReal + realRange / 2;
        const minImag = centerImag - imagRange / 2;
        const maxImag = centerImag + imagRange / 2;
        
        // Create parameters object for unified API
        const params = new wasmModule.MandelParameters(
            minReal, maxReal, minImag, maxImag,
            canvasWidth, canvasHeight,
            maxIterations, smoothRendering, blockSize
        );
        
        let result;
        
        // Choose appropriate computation method
        if (e.data.segmentHeight && e.data.startLine !== undefined) {
            // Segment-based computation for worker processing
            const startLine = e.data.startLine;
            const segmentHeight = e.data.segmentHeight;
            
            result = wasmModule.generate_mandelbrot_segment(params, startLine, segmentHeight);
            
            console.log(`Enhanced WASM segment computation (worker ${workerID}): ${result.computation_time_ms.toFixed(2)}ms`);
            
            // Return ready-to-display image data
            self.postMessage({
                finished: 1,
                imageData: result.image_data,
                workerID: workerID,
                segmentHeight: result.segment_height,
                computeTime: result.computation_time_ms,
                usedEnhancedWasm: true
            }, [result.image_data]);
            
        } else {
            // Full image computation
            result = wasmModule.generate_mandelbrot_image(params);
            
            console.log(`Enhanced WASM full image computation: ${result.computation_time_ms.toFixed(2)}ms`);
            
            self.postMessage({
                finished: 1,
                imageData: result.image_data,
                width: result.width,
                height: result.height,
                computeTime: result.computation_time_ms,
                usedEnhancedWasm: true
            }, [result.image_data]);
        }
        
    } catch (error) {
        console.error('Enhanced WASM computation failed:', error);
        // Fall back to original method if enhanced fails
        console.log('Falling back to original WASM method');
        wasmMandelComputeFallback(e);
    }
}

// Fallback to original computation method
function wasmMandelComputeFallback(e) {
    try {
        const screenX = e.data.screenX;
        const screenY = e.data.screenY;
        const zoom = e.data.zoom;
        const iter_max = e.data.iterations;
        const smooth = e.data.smooth == 1;
        const startLine = e.data.startLine;
        const workerID = e.data.workerID;
        const blockSize = e.data.blockSize;
        const canvasWidth = e.data.canvasWidth;
        const segmentHeight = e.data.segmentHeight;
        
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
            smoothMandel = new Uint8Array(1);
        }
        
        self.postMessage({
            finished: 1,
            mandel: mandelData.buffer,
            workerID: workerID,
            smooth: smooth ? 1 : 0,
            smoothMandel: smoothMandel.buffer,
            usedWasm: true,
            fallbackMode: true
        }, [mandelData.buffer, smoothMandel.buffer]);
        
    } catch (error) {
        console.error('Fallback WASM computation also failed:', error);
    }
}

// Dynamic iteration calculation using enhanced API
function calculateOptimalIterations(zoom, baseIterations = 128, maxIterations = 1500) {
    if (!wasmInitialized || !wasmModule.calculate_optimal_iterations) {
        // Fallback to JavaScript implementation
        const zoomFactor = Math.log10(Math.max(1, zoom));
        return Math.min(maxIterations, Math.max(baseIterations, Math.floor(baseIterations + zoomFactor * 32)));
    }
    
    return wasmModule.calculate_optimal_iterations(zoom, baseIterations, maxIterations);
}

// Main message handler
self.onmessage = function(e) {
    // Add dynamic iteration calculation if auto-tuning is enabled
    if (e.data.autoTuneIterations && e.data.zoom) {
        e.data.iterations = calculateOptimalIterations(e.data.zoom, e.data.baseIterations || 128, e.data.maxIterations || 1500);
    }
    
    enhancedMandelCompute(e);
};

// Initialize WASM on worker startup
initWasm().then(() => {
    console.log('Enhanced WASM worker ready - using refactored WebAssembly API');
}).catch(error => {
    console.error('Enhanced WASM worker initialization failed:', error);
});