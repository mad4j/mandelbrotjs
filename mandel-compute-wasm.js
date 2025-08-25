// High-performance Rust WebAssembly wrapper for mandel-compute.js
// This module provides the same interface as mandel-compute.js but uses Rust+WASM for better performance

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
                    console.warn('Failed to initialize WebAssembly module:', error);
                    wasmInitialized = false;
                    reject(error);
                });
            } else {
                throw new Error('wasm_bindgen not available');
            }
        } catch (error) {
            console.warn('Failed to load WebAssembly module, falling back to JavaScript:', error);
            wasmInitialized = false;
            reject(error);
        }
    });
}

// Fallback JavaScript implementation (same as original mandel-compute.js)
function jsMandelCompute(e) {
    const startTime = performance.now();
    const oneShot = e.data.oneShot;
    const screenX = e.data.screenX;
    const screenY = e.data.screenY;
    const zoom = e.data.zoom;
    const iter_max = e.data.iterations;
    var smooth = 0;
    var escapeSquared = 4;
    var firstIteration = -1;
    
    if (e.data.smooth == 1) {
        firstIteration = -3;
        escapeSquared = 256;
        smooth = 1;
        smoothOffset = 0.0;
        var log2 = Math.log2(2);
    }
    
    if (oneShot == 1) {
        var xStart = e.data.x;
        var yStart = e.data.y;
        var segmentHeight = yStart + 1;
        var canvasWidth = xStart + 1;
        var startLine = 0;
        var lblockSize = 1;
    } else {
        var mandelData = new Uint8Array(e.data.mandelBuffer);
        var smoothMandel = new Uint8Array(e.data.smoothMandel);
        var startLine = e.data.startLine;
        var workerID = e.data.workerID;
        var blockSize = e.data.blockSize;
        var canvasWidth = e.data.canvasWidth;
        var segmentHeight = e.data.segmentHeight;
        var lblockSize = blockSize == 1 ? 1 : blockSize / 2;
        var lineCounter = 0;
        var xStart = 0;
        var yStart = 0;
    }
    
    for (let y = yStart; y < segmentHeight; y += lblockSize) {
        let ynorm = (y + startLine - screenY) / zoom;
        for (let x = xStart; x < canvasWidth; x += lblockSize) {
            let xnorm = (x - screenX) / zoom;
            let iteration = firstIteration;
            
            if ((xnorm > -0.5) && (xnorm < 0.25) && (ynorm > -0.5) && (ynorm < 0.5))
                iteration = iter_max;
            else {
                let zr = 0.0;
                let zi = 0.0;
                var zrSquared = 0.0;
                var ziSquared = 0.0;
                while ((zrSquared + ziSquared < escapeSquared) && (iteration < iter_max)) {
                    zrSquared = zr * zr;
                    ziSquared = zi * zi;
                    let zr_prev = zr;
                    zr = zrSquared - ziSquared + xnorm;
                    zi = (zr_prev * 2) * zi + ynorm;
                    iteration++;
                }
            }
            
            if (oneShot) {
                oneShotResult = iteration;
                self.postMessage({ oneShotResult: oneShotResult, usedWasm: false });
                return 1;
            }
            
            if (smooth == 1) {
                smoothOffset = (Math.log2(Math.log2(Math.sqrt(zrSquared + ziSquared)) / log2) - 2) * 255;
                smoothMandel[x + y * canvasWidth] = Math.floor(smoothOffset);
            }
            
            if (iteration == iter_max)
                iteration = 255;
            else
                iteration = iteration % 255;
            mandelData[x + y * canvasWidth] = iteration;
        }
        lineCounter++;
        if ((blockSize == 1) && (lineCounter == 20)) {
            self.postMessage({ lineCount: y, workerID: workerID });
            lineCounter = 0;
        }
    }
    
    const computeTime = performance.now() - startTime;
    console.log(`JS computation took ${computeTime.toFixed(2)}ms for worker ${workerID}`);
    
    self.postMessage({
        finished: 1,
        mandel: mandelData.buffer,
        workerID: workerID,
        smooth: smooth,
        smoothMandel: smoothMandel.buffer,
        usedWasm: false,
        computeTime: computeTime
    }, [mandelData.buffer], [smoothMandel.buffer]);
}

// WebAssembly-enhanced implementation
function wasmMandelCompute(e) {
    if (!wasmInitialized || !wasmModule) {
        // Fallback to JavaScript implementation
        jsMandelCompute(e);
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
            console.warn('WASM one-shot computation failed, falling back to JS:', error);
            jsMandelCompute(e);
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
            const result = wasmModule.mandel_compute_segment_with_smooth(
                startLine, segmentHeight, canvasWidth,
                screenX, screenY, zoom, iter_max, blockSize
            );
            mandelData = new Uint8Array(result.mandel_data);
            smoothMandel = new Uint8Array(result.smooth_data);
        } else {
            const resultData = wasmModule.mandel_compute_segment(
                startLine, segmentHeight, canvasWidth,
                screenX, screenY, zoom, iter_max, smooth, blockSize
            );
            mandelData = new Uint8Array(resultData);
            smoothMandel = new Uint8Array(1); // Empty for non-smooth
        }
        
        const computeTime = performance.now() - startTime;
        console.log(`WASM computation took ${computeTime.toFixed(2)}ms for worker ${workerID}`);
        
        // Send periodic progress updates for fine rendering
        if (blockSize == 1) {
            // For now, we'll send the full result since WASM computes the entire segment at once
            // In the future, we could modify the Rust code to send incremental updates
        }
        
        self.postMessage({
            finished: 1,
            mandel: mandelData.buffer,
            workerID: workerID,
            smooth: smooth ? 1 : 0,
            smoothMandel: smoothMandel.buffer,
            usedWasm: true,
            computeTime: computeTime
        }, [mandelData.buffer], [smoothMandel.buffer]);
        
    } catch (error) {
        console.warn('WASM segment computation failed, falling back to JS:', error);
        jsMandelCompute(e);
    }
}

// Global variable to track actual usage
let actuallyUsingWasm = false;

// Main message handler
self.onmessage = function(e) {
    wasmMandelCompute(e);
};

// Initialize WASM on worker startup and report status
initWasm().then(() => {
    if (wasmInitialized) {
        actuallyUsingWasm = true;
        console.log('WASM worker ready - will use WebAssembly for computations');
    } else {
        actuallyUsingWasm = false;
        console.log('WASM worker ready - will use JavaScript fallback for computations');
    }
}).catch(error => {
    actuallyUsingWasm = false;
    console.warn('WASM worker initialization failed, using JavaScript fallback:', error);
});