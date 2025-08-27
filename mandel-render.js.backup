// Legacy JavaScript renderer - deprecated in favor of WASM unified rendering
// This file is kept for compatibility but should not be used when unified WASM rendering is enabled

console.warn('mandel-render.js: Legacy JavaScript renderer loaded - this should not be used with WASM unified rendering');

self.onmessage = function(e) {
    console.warn('mandel-render.js: JavaScript rendering called - this indicates a fallback from WASM unified rendering');
    
    const startTime = performance.now();
    const blockSize = e.data.blockSize;
    const arrayWidth = e.data.arrayWidth;
    const workerID = e.data.workerID;
    const segmentHeight = e.data.segmentHeight || (blockSize == 1 ? 300 : 150);
    
    // Legacy variables - simplified for fallback usage
    let mandel = new Uint8Array(e.data.mandel);
    
    // Simplified RGBA generation (single path, no dual OffscreenCanvas vs pixelsBuffer)
    const rgbaData = new Uint8Array(arrayWidth * segmentHeight * 4);
    const lblockSize = blockSize == 1 ? 1 : blockSize / 2;
    
    // Simple grayscale rendering with pixel doubling
    for (let y = 0; y < segmentHeight; y += lblockSize) {
        for (let x = 0; x < arrayWidth; x += lblockSize) {
            const sourceIndex = x + y * arrayWidth;
            const grayscale = sourceIndex < mandel.length ? mandel[sourceIndex] : 0;
            
            for (let dy = 0; dy < lblockSize && y + dy < segmentHeight; dy++) {
                for (let dx = 0; dx < lblockSize && x + dx < arrayWidth; dx++) {
                    const targetIndex = ((y + dy) * arrayWidth + (x + dx)) * 4;
                    if (targetIndex < rgbaData.length - 3) {
                        rgbaData[targetIndex] = grayscale;     // R
                        rgbaData[targetIndex + 1] = grayscale; // G
                        rgbaData[targetIndex + 2] = grayscale; // B
                        rgbaData[targetIndex + 3] = 255;       // A
                    }
                }
            }
        }
    }
    
    const renderTime = performance.now() - startTime;
    console.log(`Legacy JS render worker ${workerID} completed in ${renderTime.toFixed(2)}ms`);
    
    // Return simplified format (single path)
    self.postMessage({
        pixelsBuffer: rgbaData.buffer,
        workerID: workerID,
        blockSize: blockSize,
        useOffscreenCanvas: false,
        usedWasm: false,
        renderTime: renderTime
    }, [rgbaData.buffer]);
};
