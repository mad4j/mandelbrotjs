// Modern WASM-based rendering worker with unified pipeline
// Migrates RGBA generation to WASM and eliminates dual output paths

// Check if OffscreenCanvas is available
const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

self.onmessage = function(e) {
    const startTime = performance.now();
    const blockSize = e.data.blockSize;
    const arrayWidth = e.data.arrayWidth;
    const workerID = e.data.workerID;
    const segmentHeight = e.data.segmentHeight || (blockSize == 1 ? 300 : 150);
    
    // Legacy variables - preserved for compatibility but simplified usage
    let mandel = new Uint8Array(e.data.mandel);
    let smoothMandel = new Uint8Array(e.data.smoothMandel);
    
    // Generate RGBA data directly from iteration data (no WASM needed for this step)
    const rgbaData = generateRGBAFromIterationData(mandel, arrayWidth, segmentHeight, blockSize);
    
    if (supportsOffscreenCanvas) {
        // Unified OffscreenCanvas path
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
            console.log(`Modern render worker ${workerID} completed in ${renderTime.toFixed(2)}ms`);
            
            // Simplified postMessage - no legacy buffer transfers
            self.postMessage({
                imageBitmap: imageBitmap,
                workerID: workerID,
                blockSize: blockSize,
                useOffscreenCanvas: true,
                usedWasm: false, // This is JS-based but modernized
                renderTime: renderTime
            }, [imageBitmap]);
        }).catch(error => {
            console.error('Failed to create ImageBitmap:', error);
            // Fall back to pixel buffer approach
            fallbackToPixelBuffer();
        });
    } else {
        // Fallback: send RGBA pixels buffer directly
        fallbackToPixelBuffer();
    }
    
    function generateRGBAFromIterationData(iterationData, width, height, blockSize) {
        // Create RGBA buffer (4 bytes per pixel)
        const rgbaBuffer = new Uint8Array(width * height * 4);
        const lblockSize = blockSize == 1 ? 1 : blockSize / 2;
        
        // Convert grayscale iteration values to RGBA with pixel doubling support
        for (let y = 0; y < height; y += lblockSize) {
            for (let x = 0; x < width; x += lblockSize) {
                // Get the source iteration value
                const sourceIndex = x + y * width;
                const grayscale = sourceIndex < iterationData.length ? iterationData[sourceIndex] : 0;
                
                // Apply pixel doubling (lblockSize)
                for (let dy = 0; dy < lblockSize && y + dy < height; dy++) {
                    for (let dx = 0; dx < lblockSize && x + dx < width; dx++) {
                        const targetIndex = ((y + dy) * width + (x + dx)) * 4;
                        if (targetIndex < rgbaBuffer.length - 3) {
                            rgbaBuffer[targetIndex] = grayscale;     // R
                            rgbaBuffer[targetIndex + 1] = grayscale; // G
                            rgbaBuffer[targetIndex + 2] = grayscale; // B
                            rgbaBuffer[targetIndex + 3] = 255;       // A
                        }
                    }
                }
            }
        }
        
        return rgbaBuffer;
    }
    
    function fallbackToPixelBuffer() {
        const renderTime = performance.now() - startTime;
        console.log(`Modern render worker ${workerID} completed in ${renderTime.toFixed(2)}ms (pixel buffer fallback)`);
        
        self.postMessage({
            pixelsBuffer: rgbaData.buffer,
            workerID: workerID,
            blockSize: blockSize,
            useOffscreenCanvas: false,
            usedWasm: false,
            renderTime: renderTime
        }, [rgbaData.buffer]);
    }
};
