// WASM-based rendering worker for direct RGBA generation
// Unified pipeline: WASM -> ImageBitmap -> postMessage

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
                    console.log('WASM render worker initialized successfully');
                    resolve();
                }).catch(error => {
                    console.error('Failed to initialize WASM render module:', error);
                    wasmInitialized = false;
                    reject(error);
                });
            } else {
                throw new Error('wasm_bindgen not available');
            }
        } catch (error) {
            console.error('Failed to load WASM render module:', error);
            wasmInitialized = false;
            reject(error);
        }
    });
}

// Check if OffscreenCanvas is available
const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

self.onmessage = function(e) {
    if (!wasmInitialized || !wasmModule) {
        console.error('WASM render worker not initialized');
        return;
    }

    const startTime = performance.now();
    const workerID = e.data.workerID;
    const arrayWidth = e.data.arrayWidth;
    const segmentHeight = e.data.segmentHeight || 300;
    const startLine = e.data.startLine || 0;
    const screenX = e.data.screenX;
    const screenY = e.data.screenY;
    const zoom = e.data.zoom;
    const iterations = e.data.iterations;

    try {
        // Calculate complex plane center coordinates from pixel coordinates
        const canvasHeight = e.data.canvasHeight || arrayWidth; // Assume square canvas if not provided
        const center_x = (arrayWidth/2 - screenX) / zoom;
        const center_y = (canvasHeight/2 - screenY) / zoom;

        console.log(`WASM Render Worker ${workerID}: center_x=${center_x}, center_y=${center_y}, zoom=${zoom}, startLine=${startLine}, segmentHeight=${segmentHeight}, arrayWidth=${arrayWidth}`);

        // Generate RGBA data directly from WASM
        const rgbaData = wasmModule.mandel_generate_rgba_image(
            center_x, center_y, zoom, iterations, 
            arrayWidth, segmentHeight, startLine
        );

        if (supportsOffscreenCanvas) {
            // Use OffscreenCanvas to create ImageBitmap
            const canvas = new OffscreenCanvas(arrayWidth, segmentHeight);
            const ctx = canvas.getContext('2d');
            
            // Create ImageData from RGBA buffer
            const imageData = new ImageData(
                new Uint8ClampedArray(rgbaData), 
                arrayWidth, 
                segmentHeight
            );
            
            // Put imageData to canvas and convert to ImageBitmap
            ctx.putImageData(imageData, 0, 0);
            
            createImageBitmap(canvas).then(imageBitmap => {
                const renderTime = performance.now() - startTime;
                console.log(`WASM render worker ${workerID} completed in ${renderTime.toFixed(2)}ms`);
                
                self.postMessage({
                    imageBitmap: imageBitmap,
                    workerID: workerID,
                    useOffscreenCanvas: true,
                    usedWasm: true,
                    renderTime: renderTime
                }, [imageBitmap]);
            }).catch(error => {
                console.error('Failed to create ImageBitmap:', error);
            });
        } else {
            // Fallback: send RGBA pixels buffer for legacy path
            const renderTime = performance.now() - startTime;
            console.log(`WASM render worker ${workerID} completed in ${renderTime.toFixed(2)}ms (fallback)`);
            
            self.postMessage({
                pixelsBuffer: rgbaData.buffer,
                workerID: workerID,
                useOffscreenCanvas: false,
                usedWasm: true,
                renderTime: renderTime
            }, [rgbaData.buffer]);
        }

    } catch (error) {
        console.error('WASM render worker error:', error);
        // In case of error, don't send anything - main thread will handle timeout
    }
};

// Initialize WASM on worker startup
initWasm().then(() => {
    console.log('WASM render worker ready');
}).catch(error => {
    console.error('WASM render worker initialization failed:', error);
});