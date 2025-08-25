// Worker state for persistent operation
let isRunning = false;
let currentJobId = 0;

self.onmessage=function(e)
{
// Handle control messages
if(e.data.cancel) {
    isRunning = false;
    return;
}

if(e.data.flush) {
    isRunning = false;
    currentJobId++;
    return;
}

// Start new computation
isRunning = true;
const jobId = ++currentJobId;

const zoom=200;const iter_max=e.data.iterations;const Cr=e.data.Cr;const Ci=e.data.Ci;var smooth=0;var escapeSquared=4;var firstIteration=-1;if(e.data.smooth==1){firstIteration=-3;escapeSquared=256;smooth=1;smoothOffset=0.0;var log2=Math.log2(2);}
var fractalData=new Uint8Array(e.data.juliaBuffer);var blockSize=1;const width=e.data.width;const height=e.data.height;const screenX=width/2;const screenY=height/2;var lblockSize=blockSize==1?1:blockSize/2;for(let y=0;y<height;y+=lblockSize){
    // Check if job was cancelled
    if(!isRunning || currentJobId !== jobId) {
        return;
    }
    let ynorm=(y-screenY)/zoom;for(let x=0;x<width;x+=lblockSize){let xnorm=(x-screenX)/zoom;let zr=xnorm;let zi=ynorm;let iteration=firstIteration;var zrSquared=0.0;var ziSquared=0.0;while((zrSquared+ziSquared<escapeSquared)&&(iteration<iter_max)){zrSquared=zr*zr;ziSquared=zi*zi;let zr_prev=zr;zr=zrSquared-ziSquared+Cr;zi=(zr_prev*2)*zi+Ci;iteration++;}
if(smooth==1){smoothOffset=(Math.log2(Math.log2(Math.sqrt(zrSquared+ziSquared))/log2)-2)*255;smoothFractal[x+y*width]=Math.floor(smoothOffset);}
if(iteration==iter_max)
iteration=255;else
iteration=iteration%255;fractalData[x+y*width]=iteration;}}
// Check if job was cancelled before sending result
if(!isRunning || currentJobId !== jobId) {
    return;
}
self.postMessage({finished:1,julia:fractalData.buffer});};
