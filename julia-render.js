self.onmessage=function(e)
{const arrayWidth=e.data.arrayWidth;const arrayHeight=e.data.arrayHeight;let pixels=new Uint8Array(e.data.canvasBuffer);const workerID=e.data.workerID;let julia=new Uint8Array(e.data.julia);let colours=e.data.colours;let pixelPos=0;let out=0;let packedColour=0;let r=0;let g=0;let b=0;for(let y=0;y<arrayHeight;y++){var yOffset=y*arrayWidth;for(let x=0;x<arrayWidth;x++){out=julia[x+yOffset];if(out==255){r=0;g=0;b=0;}
else{packedColour=colours[out];r=(packedColour>>24)&0xff;g=(packedColour>>16)&0xff;b=(packedColour>>8)&0xff;}
pixelPos=(x+yOffset)<<2;pixels[pixelPos]=r;pixels[++pixelPos]=g;pixels[++pixelPos]=b;}}
colours=null;self.postMessage({juliaBuffer:julia.buffer,pixelsBuffer:pixels.buffer},[julia.buffer],[pixels.buffer]);pixels=null;julia=null;};
