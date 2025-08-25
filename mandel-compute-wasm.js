// High-performance Rust WebAssembly wrapper for mandel-compute.js
// This module provides the same interface as mandel-compute.js but uses Rust+WASM for better performance

let wasmModule = null;
let wasmInitialized = false;

// Initialize WebAssembly module
async function initWasm() {
    if (wasmInitialized) return;
    
    try {
        // Import the WASM module
        const wasmImport = await import('./pkg/mandel_wasm.js');
        await wasmImport.default();
        wasmModule = wasmImport;
        wasmInitialized = true;
        console.log('Rust WebAssembly module loaded successfully');
    } catch (error) {
        console.warn('Failed to load WebAssembly module, falling back to JavaScript:', error);
        wasmInitialized = false;
    }
}

// Fallback JavaScript implementation (same as original mandel-compute.js)
function jsMandelCompute(e) {
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
                self.postMessage({ oneShotResult: oneShotResult });
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
    
    self.postMessage({
        finished: 1,
        mandel: mandelData.buffer,
        workerID: workerID,
        smooth: smooth,
        smoothMandel: smoothMandel.buffer
    }, [mandelData.buffer], [smoothMandel.buffer]);
}

// WebAssembly-enhanced implementation
async function wasmMandelCompute(e) {
    if (!wasmInitialized) {
        await initWasm();
    }
    
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
            self.postMessage({ oneShotResult: oneShotResult });
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
            smoothMandel: smoothMandel.buffer
        }, [mandelData.buffer], [smoothMandel.buffer]);
        
    } catch (error) {
        console.warn('WASM segment computation failed, falling back to JS:', error);
        jsMandelCompute(e);
    }
}

// Main message handler
self.onmessage = async function(e) {
    await wasmMandelCompute(e);
};

// Initialize WASM on worker startup
initWasm();