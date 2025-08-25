// Check if OffscreenCanvas is available
const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

self.onmessage=function(e)
{const arrayWidth=e.data.arrayWidth;const arrayHeight=e.data.arrayHeight;const workerID=e.data.workerID;let julia=new Uint8Array(e.data.julia);let colours=e.data.colours;let pixelPos=0;let out=0;let packedColour=0;let r=0;let g=0;let b=0;

// Use OffscreenCanvas when available, fallback to pixel array
if (supportsOffscreenCanvas) {
    // Create OffscreenCanvas for Julia set
    const canvas = new OffscreenCanvas(arrayWidth, arrayHeight);
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(arrayWidth, arrayHeight);
    const pixels = imageData.data;
    
    // Render to imageData
    for(let y=0;y<arrayHeight;y++){var yOffset=y*arrayWidth;for(let x=0;x<arrayWidth;x++){out=julia[x+yOffset];if(out==255){r=0;g=0;b=0;}
    else{packedColour=colours[out];r=(packedColour>>24)&0xff;g=(packedColour>>16)&0xff;b=(packedColour>>8)&0xff;}
    pixelPos=(x+yOffset)<<2;pixels[pixelPos]=r;pixels[++pixelPos]=g;pixels[++pixelPos]=b;pixels[++pixelPos]=255;}}
    
    // Put imageData to canvas and convert to ImageBitmap
    ctx.putImageData(imageData, 0, 0);
    createImageBitmap(canvas).then(imageBitmap => {
        colours=null;
        self.postMessage({juliaBuffer:julia.buffer,imageBitmap:imageBitmap,useOffscreenCanvas:true},[julia.buffer]);
        julia=null;
    });
} else {
    // Fallback to original pixel array approach
    let pixels=new Uint8Array(e.data.canvasBuffer);
    for(let y=0;y<arrayHeight;y++){var yOffset=y*arrayWidth;for(let x=0;x<arrayWidth;x++){out=julia[x+yOffset];if(out==255){r=0;g=0;b=0;}
    else{packedColour=colours[out];r=(packedColour>>24)&0xff;g=(packedColour>>16)&0xff;b=(packedColour>>8)&0xff;}
    pixelPos=(x+yOffset)<<2;pixels[pixelPos]=r;pixels[++pixelPos]=g;pixels[++pixelPos]=b;}}
    colours=null;
    self.postMessage({juliaBuffer:julia.buffer,pixelsBuffer:pixels.buffer,useOffscreenCanvas:false},[julia.buffer],[pixels.buffer]);
    pixels=null;julia=null;
}
};
