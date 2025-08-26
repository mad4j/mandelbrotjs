// Check if OffscreenCanvas is available
const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

self.onmessage=function(e)
{const blockSize=e.data.blockSize;const arrayWidth=e.data.arrayWidth;const workerID=e.data.workerID;let mandel=new Uint8Array(e.data.mandel);let colours=e.data.colours;let pixelPos=0;const larrayWidth=arrayWidth;let out=0;let packedColour=0;let packedColour1=0;let r=0;let g=0;let b=0;let r1=0;let g1=0;let b1=0;if((e.data.smooth==1)&&(blockSize==1))
smooth=1;else
smooth=0;let smoothMandel=new Uint8Array(e.data.smoothMandel);let segmentHeight=e.data.segmentHeight || (blockSize==1?300:150);let lblockSize=blockSize==1?1:blockSize/2;

// Use OffscreenCanvas when available, fallback to pixel array
if (supportsOffscreenCanvas) {
    // Create OffscreenCanvas for this segment
    const canvas = new OffscreenCanvas(arrayWidth, segmentHeight);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(arrayWidth, segmentHeight);
    const pixels = imageData.data;
    
    // Render to imageData - use values directly as grayscale
    for(let y=0;y<segmentHeight;y+=lblockSize){for(let x=0;x<arrayWidth;x+=lblockSize){out=mandel[x+y*arrayWidth];
    // Use the value directly as grayscale (r=g=b=out)
    r=out;g=out;b=out;
    for(let j=0;j<lblockSize;j++){let yOffset=(y+j)*arrayWidth;for(let i=0;i<lblockSize;i++){pixelPos=((x+i)+yOffset)<<2;pixels[pixelPos]=r;pixels[++pixelPos]=g;pixels[++pixelPos]=b;pixels[++pixelPos]=255;}}}}
    
    // Put imageData to canvas and convert to ImageBitmap
    ctx.putImageData(imageData, 0, 0);
    createImageBitmap(canvas).then(imageBitmap => {
        colours=null;
        self.postMessage({mandelBuffer:mandel.buffer,imageBitmap:imageBitmap,smoothMandel:smoothMandel.buffer,workerID:workerID,blockSize:blockSize,useOffscreenCanvas:true},[mandel.buffer],[smoothMandel.buffer]);
        mandel=null;
    });
} else {
    // Fallback to original pixel array approach - use values directly as grayscale
    let pixels=new Uint8Array(e.data.canvasBuffer);
    for(let y=0;y<segmentHeight;y+=lblockSize){for(let x=0;x<arrayWidth;x+=lblockSize){out=mandel[x+y*arrayWidth];
    // Use the value directly as grayscale (r=g=b=out)
    r=out;g=out;b=out;
    for(let j=0;j<lblockSize;j++){let yOffset=(y+j)*arrayWidth;for(let i=0;i<lblockSize;i++){pixelPos=((x+i)+yOffset)<<2;pixels[pixelPos]=r;pixels[++pixelPos]=g;pixels[++pixelPos]=b;}}}}
    colours=null;
    self.postMessage({mandelBuffer:mandel.buffer,pixelsBuffer:pixels.buffer,smoothMandel:smoothMandel.buffer,workerID:workerID,blockSize:blockSize,useOffscreenCanvas:false},[mandel.buffer],[pixels.buffer],[smoothMandel.buffer]);
    pixels=null;mandel=null;
}
};
