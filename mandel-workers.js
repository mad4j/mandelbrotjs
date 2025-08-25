var firstPinchDistance=0;var mousePressed=0;var start=performance.now();var rotationFrameStart=performance.now();var eventTime=0;var posterTime=0;var zoomTime=0;var iterations=50;var juliaIterations=50;var startLine=0;var lastPointer="canvas";const maxIterations=1500;var autotuneIterations=true;var maxBlockSize=16;zoom=10;var startupTick=0;var startupAnim=1;const startZoom=300;const minZoom=100;const maxZoom=2000000000000000;const canvasWidth=600*2;const canvasHeight=600*2;const scaleFactor=2;const juliaCanvasWidth=400*2;const juliaCanvasHeight=300*2;const coarseWidth=canvasWidth/scaleFactor;const coarseHeight=canvasHeight/scaleFactor;var eventOccurred=0;var screenX=canvasWidth/2+400;var screenY=canvasHeight/2;const xnormMin=-8;const xnormMax=8;const ynormMin=-8;const ynormMax=8;var xnorm=0.0;var ynorm=0.0;var xmouse=0.0;var ymouse=0.0;var dLink;// Detect optimal worker count based on hardware capabilities
var workers = (function() {
    // Use hardware concurrency if available, with reasonable bounds
    if (navigator.hardwareConcurrency) {
        return Math.max(2, Math.min(navigator.hardwareConcurrency, 16));
    }
    // Fallback to 4 workers for older browsers
    return 4;
})();

var blockSize=new Uint8Array(workers);
for(var i=0; i<workers; i++) { blockSize[i]=16; }
var colours=new Uint32Array(256);var juliaColours=new Uint32Array(256);var lockJuliaColours=0;var vga=new Uint32Array(256);const paletteCount=13;var currentPalette=-1;var currentRotation=0;var rotating=0;var renderCount=0;var travelling=0;var movingToSaved=0;var destX=0;var destY=0;var destZoom=0;var destIters=0;var juliaWorker;var juliaRenderWorker;var computeWorker=new Array();var computeWorkerRunning=new Uint8Array(workers);var renderWorker=new Array();var renderWorkerRunning=new Uint8Array(workers);var needToRun=new Uint8Array(workers);var finished=new Uint8Array(workers);var timesTaken=new Array(20);var timesTakenSorted=new Array(20);var benchmarkTime=2;var drawingJulia=0;
for(var i=0; i<workers; i++) { needToRun[i]=0; finished[i]=0; }var workersRunning=0;const chunkHeight=canvasHeight/workers;var needRedraw=0;var needRecompute=1;var showAxes=0;var showJulia=1;var smooth=1;var mc=document.getElementById("mandelCanvas");var viewportTag=document.getElementById("viewport");var mctx=mc.getContext("2d",{alpha:false});var jc=document.getElementById("juliaCanvas");var jctx=jc.getContext("2d",{alpha:false});var logText=document.getElementById("logText");var cycleText=document.getElementById("cycle");var workingText=document.getElementById("workingText");var zoomText=document.getElementById("zoomText");var iterSlider=document.getElementById("iterSlider");var mandelText=document.getElementById("mandelText");var itersInput=document.getElementById("itersInput");var xPosText=document.getElementById("xPosText");var yPosText=document.getElementById("yPosText");var paletteText=document.getElementById("currentPalette");var nextPalette=document.getElementById("nextPalette");var prevPalette=document.getElementById("prevPalette");var showAxesBox=document.getElementById("showAxes");var showJuliaBox=document.getElementById("showJulia");var juliaParamsArea=document.getElementById("juliaParamsArea");var lockJuliaColoursBox=document.getElementById("lockJuliaColours");var juliaIterSlider=document.getElementById("juliaIterSlider");var juliaItersText=document.getElementById("juliaItersText");var smoothBox=document.getElementById("smooth");var juliaArea=document.getElementById("juliaArea");var coordSourceText=document.getElementById("coordSource");var coordSource2Text=document.getElementById("coordSource2");var posterDialog=document.getElementById("posterDialog");var posterDialogBody=document.getElementById("posterDialogBody");var linkDialog=document.getElementById("linkDialog");var posterClose=document.getElementById("posterClose");var linkClose=document.getElementById("linkClose");var permalinkURL=document.getElementById("permalinkURL");var permalinkAnchor=document.getElementById("permalinkAnchor");var aboutBox=document.getElementById("aboutBox");var aboutBoxContent=document.getElementById("aboutBoxContent");var aboutClose=document.getElementById("aboutClose");var showInstructionsBtn=document.getElementById("showInstructionsBtn");var showMathematicsBtn=document.getElementById("showMathematicsBtn");var showFractalsBtn=document.getElementById("showFractalsBtn");var jumpSelect=document.getElementById("jumpTo");var ultraWidth=4000*2;var ultraHeight=3000*2;var ultraCanvas;var ultraCanvasCtx;var ultraScaledCanvas;var ultraScaledCanvasCtx;var ultraSegment;var offScreen=document.createElement('canvas');var offScreenCtx=offScreen.getContext("2d",{alpha:false});offScreen.width=canvasWidth;offScreen.height=canvasHeight;var coarse=document.createElement('canvas');var coarseCtx=coarse.getContext("2d",{alpha:false});coarse.width=coarseWidth;coarse.height=coarseHeight;var juliaOffScreen=document.createElement('canvas');var juliaOffScreenCtx=juliaOffScreen.getContext("2d",{alpha:false});juliaOffScreen.width=juliaCanvasWidth;juliaOffScreen.height=juliaCanvasHeight;var mjuliaOffScreenCtx=juliaOffScreenCtx.getImageData(0,0,juliaCanvasWidth,juliaCanvasHeight);var offScreenSegment=new Array();var offScreenSegmentCtx=new Array();var mSegment=new Array();var mdSegment=new Array();var mJulia=new Array();var mdJulia=new Array();var coarseSegment=new Array();var coarseSegmentCtx=new Array();var mCoarseSegment=new Array();var mdCoarseSegment=new Array();var mandel=new Array();var julia=new Uint8Array(juliaCanvasWidth*juliaCanvasHeight);var smoothMandel=new Array();var percentDone=new Array();for(i=0;i<workers;i++){computeWorkerRunning[i]=0;renderWorkerRunning[i]=0;offScreenSegment[i]=document.createElement('canvas');offScreenSegmentCtx[i]=offScreenSegment[i].getContext("2d",{alpha:false});offScreenSegment[i].width=canvasWidth;offScreenSegment[i].height=canvasHeight/workers;mSegment[i]=offScreenSegmentCtx[i].getImageData(0,0,canvasWidth,canvasHeight/workers);mdSegment[i]=new Uint8ClampedArray(canvasWidth*canvasHeight/workers*4);mdSegment[i].set(mSegment[i].data);coarseSegment[i]=document.createElement('canvas');coarseSegmentCtx[i]=coarseSegment[i].getContext("2d",{alpha:false});coarseSegment[i].width=coarseWidth;coarseSegment[i].height=coarseHeight/workers;mCoarseSegment[i]=coarseSegmentCtx[i].getImageData(0,0,coarseWidth,coarseHeight/workers);mdCoarseSegment[i]=mCoarseSegment[i].data;mandel[i]=new Uint8Array(canvasWidth*(canvasHeight/workers));smoothMandel[i]=new Uint8Array(canvasWidth*(canvasHeight/workers));}
mJulia=juliaOffScreenCtx.getImageData(0,0,juliaCanvasWidth,juliaCanvasHeight);mdJulia=new Uint8ClampedArray(juliaCanvasWidth*juliaCanvasHeight*4);mdJulia.set(mJulia.data);var zoomSlider;var oldMouseX=-1;var oldMouseX=-1;var worker=0;mc.addEventListener("touchstart",touchStart,false);mc.addEventListener("touchmove",touchMove,false);mc.addEventListener("touchend",touchEnd,false);window.addEventListener("resize",setViewport,false);function setViewport()
{var ww=window.screen.width;var cw=canvasWidth/2+50;if(ww<cw){var ratio=ww/cw;viewportTag.setAttribute("content","width="+ww+",initial-scale="+ratio);document.body.style.fontSize=Math.floor(70/ratio)+"%";var checkBoxes=document.querySelectorAll("input[type=checkbox]");var checkBoxCount=checkBoxes.length;for(var i=0;i<checkBoxCount;i++)
checkBoxes[i].style.transform="scale("+0.7/ratio+")";}
else{viewportTag.setAttribute("content","width="+ww+",initial-scale=1.0");}}
function calculateAdaptiveIterations(currentZoom)
{if(!autotuneIterations)return iterations;const baseIterations=128;const adaptiveIterations=Math.min(maxIterations,Math.max(baseIterations,Math.floor(baseIterations+Math.log10(Math.max(1,currentZoom))*32)));return adaptiveIterations;}
function showInstructions()
{showInstructionsBtn.classList.add("linkSelectedBtn");showMathematicsBtn.classList.remove("linkSelectedBtn");showFractalsBtn.classList.remove("linkSelectedBtn");aboutBoxContent.src="instructions.html";}
function showMathematics()
{showInstructionsBtn.classList.remove("linkSelectedBtn");showMathematicsBtn.classList.add("linkSelectedBtn");showFractalsBtn.classList.remove("linkSelectedBtn");aboutBoxContent.src="mathematics.html";}
function showFractals()
{showInstructionsBtn.classList.remove("linkSelectedBtn");showMathematicsBtn.classList.remove("linkSelectedBtn");showFractalsBtn.classList.add("linkSelectedBtn");aboutBoxContent.src="fractals.html";}
function jumpTo()
{var destination=jumpSelect.options[jumpSelect.selectedIndex].value;switch(destination){case"home":destX=-1.34228;destY=0.0;destZoom=300;destIters=200;break;case"flower":destX=-1.9999858812;destY=0;destZoom=276637121362;destIters=200;break;case"julia":destX=-1.768778832;destY=0.001738995;destZoom=1585714676;destIters=800;break;case"elephant":destX=-0.071875677;destY=0.649981301;destZoom=203212;destIters=400;break;case"seahorse":destX=-0.743517833;destY=0.127094578;destZoom=113388;destIters=400;break;case"spirals":destX=-0.343806077;destY=-0.61127804;destZoom=2097031;destIters=1500;break;case"starfish":destX=-0.374004139;destY=-0.659792175
destZoom=484254;destIters=160;break;case"sun":destX=-0.776592852;destY=0.13664085;destZoom=58282440;destIters=400;break;case"tendrils":destX=-0.226266647;destY=-1.11617444;destZoom=743786806;destIters=300;break;case"tree":destX=-1.940157342;destY=0.0000008;destZoom=799366122;destIters=300;break;default:return 0;}
jumpSelect.selectedIndex=0;destY=-destY;travelling=2;startRender(1,1);}
function newCoords()
{xPosText.reportValidity();yPosText.reportValidity();if((isNaN(xPosText.value))||(isNaN(yPosText.value)))
return;destX=xPosText.value;destY=-yPosText.value;destZoom=zoom;destIters=iterations;travelling=2;startRender(1,1);}
function showAboutBox()
{aboutBoxContent.innerHTML="";showInstructions();aboutBox.style.display="block";}
aboutClose.onclick=function(){aboutBox.style.display="none";}
linkClose.onclick=function(){linkDialog.style.display="none";}
posterClose.onclick=function(){posterDialog.style.display="none";posterDialogBody.removeChild(dLink);}
function changeIters(){if((itersInput.value>0)&&(itersInput.value<=maxIterations)){iterSlider.value=Math.floor(itersInput.value);if(!travelling)
startRender(1,1);}else
itersInput.value=iterSlider.value;}
function toggleLockJuliaColours()
{if(lockJuliaColoursBox.checked==true)
lockJuliaColours=1;else
lockJuliaColours=0;if(!lockJuliaColours){for(i=0;i<255;i++)
juliaColours[i]=colours[i];startJulia(0,null,null);}}
function toggleJulia()
{if(showJuliaBox.checked==true)
showJulia=1;else
showJulia=0;if(showJulia){juliaArea.style.display="block";juliaParamsArea.style.display="block";juliaSwitchArea.style.background="#efc";juliaSwitchArea.style.border="1px solid black";juliaIterations=Math.floor(juliaIterSlider.value);updateCoords(canvasWidth/2,canvasHeight/2,"centre");}
else{juliaArea.style.display="none";juliaParamsArea.style.display="none";juliaSwitchArea.style.background="#cef";juliaSwitchArea.style.border="1px solid transparent";drawingJulia=0;}}
function toggleAxes()
{if(showAxesBox.checked==true)
showAxes=1;else
showAxes=0;startRender(0,0);}
function toggleSmooth()
{if(smoothBox.checked==true)
smooth=1;else
smooth=0;if(smooth==1){for(i=0;i<workers;i++)
smoothMandel[i]=new Uint8Array(canvasWidth*(canvasHeight/workers));}
else{for(i=0;i<workers;i++)
smoothMandel[i]=0;}
startRender(1,0);}
function pad(n)
{return n<10?'0'+n:n;}
function saveState()
{var lxnorm=Math.floor((canvasWidth/2-screenX)/zoom*10000000000000)/10000000000000;var lynorm=-Math.floor((canvasHeight/2-screenY)/zoom*10000000000000)/10000000000000;permalinkURL.innerHTML=""+window.location.protocol+"//"+window.location.hostname+window.location.pathname+"?Re="+lxnorm+"&Im="+lynorm+"&iters="+iterations+"&zoom="+zoom+"&colourmap="+currentPalette+"&maprotation="+currentRotation+"&axes="+showAxes+"&smooth="+smooth;permalinkAnchor.innerHTML="<a href=\""+window.location.protocol+"//"+window.location.hostname+window.location.pathname+"?Re="+lxnorm+"&Im="+lynorm+"&iters="+iterations+"&zoom="+zoom+"&colourmap="+currentPalette+"&maprotation="+currentRotation+"&axes="+showAxes+"&smooth="+smooth+"\">Link</a>";linkDialog.style.display="block";}
function loadState()
{const urlVars=new URLSearchParams(window.location.search);var lxnorm=parseFloat(urlVars.get('Re'));var lynorm=parseFloat(urlVars.get('Im'));var literations=parseInt(urlVars.get('iters'));var lzoom=parseInt(urlVars.get('zoom'));var lcurrentPalette=parseInt(urlVars.get('colourmap'));var lcurrentRotation=parseInt(urlVars.get('maprotation'));var lshowAxes=parseInt(urlVars.get('axes'));var lsmooth=parseInt(urlVars.get('smooth'));if((literations>=0)&&(literations<=maxIterations)){destIters=literations;}
if((lzoom>=minZoom)&&(lzoom<=maxZoom)){destZoom=lzoom;destX=-1.34228;destY=0.0;movingToSaved=1;}
if((lxnorm<xnormMax)&&(lxnorm>xnormMin))
destX=lxnorm;if((lynorm<ynormMax)&&(lynorm>ynormMin))
destY=-lynorm;if((lcurrentPalette>=0)&&(lcurrentPalette<=paletteCount)){currentPalette=lcurrentPalette-1;incrPalette();}
needRedraw=0;if((lcurrentRotation>0)&&(lcurrentRotation<=254))
rotatePalette(lcurrentRotation);if(lshowAxes>0){showAxes=1;showAxesBox.checked=true;}else
showAxes=0;if(lsmooth>0){smooth=1;smoothBox.checked=true;}else
smooth=0;}
function killWorkers()
{for(var i=0;i<workers;i++){if((blockSize[i]<4)&&(computeWorkerRunning[i]==1)){computeWorker[i].terminate();computeWorker[i]=null;computeWorkerRunning[i]=0;workersRunning--;mandel[i]=new Uint8Array(canvasWidth*(canvasHeight/workers));smoothMandel[i]=new Uint8Array(canvasWidth*(canvasHeight/workers));}}}
function drawAxes()
{var canvasWidthScaled=canvasWidth/scaleFactor;var canvasHeightScaled=canvasHeight/scaleFactor;var originX=Math.round(screenX/scaleFactor);var originY=Math.round(screenY/scaleFactor);mctx.translate(0.5,0.5);mctx.strokeStyle="#DDDDDD";mctx.font="10px Sans-serif";mctx.lineWidth=1.0;mctx.beginPath();mctx.moveTo(0,originY);mctx.lineTo(canvasWidthScaled,originY);mctx.stroke();mctx.beginPath();mctx.moveTo(originX,0);mctx.lineTo(originX,canvasHeightScaled);mctx.stroke();mctx.beginPath();mctx.arc(originX,originY,5,0,2*Math.PI);mctx.stroke();var step=1.0;if(zoom>250)
step=0.5;if(zoom>600)
step=0.25;if(zoom>5000)
step=0.05;if(zoom>10000)
step=0.025;if(zoom>20000)
step=0.005;if(zoom>140000)
step=0.0025;if(zoom>400000)
step=0.0005;for(i=-6.0;i<=6;i+=step){if(Math.abs(i)>0.001){if(i%1.0==0)
tickSize=4;else
tickSize=3;tickX=Math.round((screenX+i*zoom)/scaleFactor);tickY=Math.round((screenY+i*zoom)/scaleFactor);if((tickX<0)||(tickX>canvasWidthScaled))
continue;mctx.beginPath();mctx.moveTo(originX-tickSize,tickY);mctx.lineTo(originX+tickSize,tickY);mctx.stroke();mctx.strokeText(Math.round(i*10000)/10000,tickX-3,originY+12);}}
for(i=-6.0;i<=6;i+=step){if(Math.abs(i)>0.001){if(i%1.0==0)
tickSize=4;else
tickSize=3;tickX=Math.round((screenX+i*zoom)/scaleFactor);tickY=Math.round((screenY+i*zoom)/scaleFactor);if((tickY<0)||(tickY>canvasHeightScaled))
continue;mctx.beginPath();mctx.moveTo(tickX,originY-tickSize);mctx.lineTo(tickX,originY+tickSize);mctx.stroke();mctx.strokeText(-Math.round(i*10000)/10000,originX+6,tickY+4);}}
mctx.translate(-0.5,-0.5);}
var onJuliaComputeEnded=function(e)
{julia=new Uint8Array(e.data.julia);if(!juliaRenderWorker){juliaRenderWorker=new Worker("julia-render.js");juliaRenderWorker.onmessage=onJuliaRenderEnded;}
juliaRenderWorker.postMessage({colours:juliaColours,julia:julia.buffer,canvasBuffer:mdJulia.buffer,arrayWidth:juliaCanvasWidth,arrayHeight:juliaCanvasHeight},[julia.buffer],[mdJulia.buffer]);}
var onJuliaRenderEnded=function(e)
{julia=new Uint8Array(e.data.juliaBuffer);mdJulia=new Uint8ClampedArray(e.data.pixelsBuffer);mJulia.data.set(mdJulia);juliaOffScreenCtx.putImageData(mJulia,0,0);jctx.drawImage(juliaOffScreen,0,0,juliaCanvasWidth/2,juliaCanvasHeight/2);var x=xmouse*juliaCanvasWidth/8+juliaCanvasWidth/4;var y=ymouse*juliaCanvasHeight/6+juliaCanvasHeight/4;jctx.strokeStyle="#FFFFFF";jctx.lineWidth=2.0;jctx.beginPath();jctx.moveTo(x-5,y);jctx.lineTo(x+5,y);jctx.stroke();jctx.beginPath();jctx.moveTo(x,y-5);jctx.lineTo(x,y+5);jctx.stroke();if(showAxes){var originX=Math.round(juliaCanvasWidth/4);var originY=Math.round(juliaCanvasHeight/4);jctx.translate(0.5,0.5);jctx.strokeStyle="#DDDDDD";jctx.font="10px Sans-serif";jctx.lineWidth=1.0;jctx.beginPath();jctx.moveTo(0,originY);jctx.lineTo(juliaCanvasWidth/2,originY);jctx.stroke();jctx.beginPath();jctx.moveTo(originX,0);jctx.lineTo(originX,juliaCanvasHeight/2);jctx.stroke();jctx.beginPath();jctx.arc(originX,originY,5,0,2*Math.PI);jctx.stroke();var step=0.5;for(i=-3;i<=3;i+=step){if(i!=0){if(i%1.0==0)
tickSize=4;else
tickSize=3;tickX=Math.round((juliaCanvasWidth/2+i*200)/2);tickY=Math.round((juliaCanvasHeight/2+i*200)/2);jctx.beginPath();jctx.moveTo(originX-tickSize,tickY);jctx.lineTo(originX+tickSize,tickY);jctx.stroke();jctx.beginPath();jctx.moveTo(tickX,originY-tickSize);jctx.lineTo(tickX,originY+tickSize);jctx.stroke();jctx.strokeText(i,tickX-3,originY+12);jctx.strokeText(-i,originX+6,tickY+4);}}
jctx.translate(-0.5,-0.5);}
drawingJulia=0;juliaWorker.terminate();juliaWorker=null;juliaWorker=new Worker("julia-compute.js");juliaWorker.onmessage=onJuliaComputeEnded;}
var onUltraComputeEnded=function(e)
{if(!e.data.finished){if(blockSize[e.data.workerID]==1){percentDone[e.data.workerID]=Math.round(e.data.lineCount/(ultraHeight/workers)*100);var totalProgress=0;for(var j=0;j<workers;j++){totalProgress+=percentDone[j];}progress=Math.floor(totalProgress/workers);workingText.innerHTML="<i>"+progress+"%</i>";var lineStart=Math.floor(e.data.workerID*(canvasHeight/scaleFactor/workers));var lineEnd=Math.floor(e.data.workerID*(canvasHeight/scaleFactor/workers))+e.data.lineCount/(ultraHeight/canvasHeight)/scaleFactor;var lineLength=e.data.lineCount/(ultraHeight/canvasHeight)/scaleFactor;mctx.fillStyle="#FFFFFF";mctx.fillRect(0,lineStart,2,lineLength);mctx.fillRect(canvasWidth/scaleFactor-2,lineStart,2,lineLength);mctx.fillStyle="#000000";mctx.fillRect(0,lineEnd-2,2,2);mctx.fillRect(canvasWidth/scaleFactor-2,lineEnd-2,2,2);}
return 1;}
var workerID=e.data.workerID;var ultraMandel=new Uint8Array(e.data.mandel);var ultraSmoothMandel=new Uint8Array(e.data.smoothMandel);computeWorker[workerID].terminate();computeWorker[workerID]=null;ultraSegment=document.createElement('canvas');ultraSegment.width=ultraWidth;ultraSegment.height=ultraHeight/workers;var ultraSegmentCtx=ultraSegment.getContext("2d",{alpha:false});var multraSegment=ultraSegmentCtx.getImageData(0,0,ultraSegment.width,ultraSegment.height);var pixels=multraSegment.data;for(let y=0;y<ultraSegment.height;y++){var yOffset=y*ultraSegment.width;for(let x=0;x<ultraSegment.width;x++){out=ultraMandel[x+y*ultraSegment.width];if(out==255){r=0;g=0;b=0;}else{packedColour=colours[out];r=(packedColour>>24)&0xff;g=(packedColour>>16)&0xff;b=(packedColour>>8)&0xff;if(smooth==1){smoothOffset=ultraSmoothMandel[x+y*ultraSegment.width];if(out<254)
packedColour1=colours[out+1];else
packedColour1=colours[0];r1=(packedColour1>>24)&0xff;g1=(packedColour1>>16)&0xff;b1=(packedColour1>>8)&0xff;r=r1-((r1-r)*smoothOffset)/255;g=g1-((g1-g)*smoothOffset)/255;b=b1-((b1-b)*smoothOffset)/255;}}
pixelPos=(x+yOffset)<<2;pixels[pixelPos]=r;pixels[++pixelPos]=g;pixels[++pixelPos]=b;pixels[++pixelPos]=255;}}
lstartLine=Math.floor(workerID*(ultraHeight/workers));ultraCanvasCtx.putImageData(multraSegment,0,lstartLine);workersRunning--;ultraSegment=null;if(workersRunning==0){ultraScaledCanvasCtx.drawImage(ultraCanvas,0,0,ultraWidth/2,ultraHeight/2);document.getElementById("poster").innerHTML="Poster";document.getElementById("save").disabled=false;document.getElementById("cycle").disabled=false;nextPalette.disabled=false;prevPalette.disabled=false;iterSlider.disabled=false;itersInput.disabled=false;juliaIterSlider.disabled=false;showAxesBox.disabled=false;showJuliaBox.disabled=false;lockJuliaColoursBox.disabled=false;smoothBox.disabled=false;jumpSelect.disabled=false;needRedraw=0;var now=new Date();var timeStamp=""+now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+"-"+pad(now.getHours())+pad(now.getMinutes())+pad(now.getSeconds());dLink=document.createElement('a');dLink.setAttribute('download',"mandel-"+timeStamp+".png");dLink.innerHTML="Poster created "+timeStamp+"<br><br>";var thePNG=ultraScaledCanvas.toDataURL("image/png");var byteString=atob(thePNG.split(',')[1]);var mimeString=thePNG.split(',')[0].split(':')[1].split(';')[0];var ab=new ArrayBuffer(byteString.length);var ia=new Uint8Array(ab);for(var i=0;i<byteString.length;i++){ia[i]=byteString.charCodeAt(i);}
var theBlob=new Blob([ab],{type:mimeString});dLink.setAttribute('href',URL.createObjectURL(theBlob));posterDialogBody.appendChild(dLink);posterDialog.style.display="block";ultraScaledCanvas=null;ultraCanvas=null;startRender(0,0);}}
function makePoster()
{if(posterTime!=0){for(i=0;i<workers;i++){if(computeWorker[i]){computeWorker[i].terminate();computeWorker[i]=null;}
workersRunning=0;}
document.getElementById("poster").innerHTML="Poster";document.getElementById("save").disabled=false;document.getElementById("cycle").disabled=false;nextPalette.disabled=false;prevPalette.disabled=false;iterSlider.disabled=false;itersInput.disabled=false;juliaIterSlider.disabled=false;showAxesBox.disabled=false;showJuliaBox.disabled=false;lockJuliaColoursBox.disabled=false;smoothBox.disabled=false;jumpSelect.disabled=false;workingText.innerHTML="";posterTime=0;startRender(0,0);return 1;}
if(needRedraw)
return 1;posterTime=performance.now();mctx.drawImage(offScreen,0,0,canvasWidth/scaleFactor,canvasHeight/scaleFactor);needRedraw=1;document.getElementById("poster").innerHTML="Cancel";document.getElementById("save").disabled=true;document.getElementById("cycle").disabled=true;nextPalette.disabled=true;prevPalette.disabled=true;iterSlider.disabled=true;itersInput.disabled=true;juliaIterSlider.disabled=true;showAxesBox.disabled=true;showJuliaBox.disabled=true;lockJuliaColoursBox.disabled=true;smoothBox.disabled=true;jumpSelect.disabled=true;workingText.innerHTML="";workingText.style.visibility="visible";mc.style.borderColor="black";mc.style.outline="5px solid gray";logText.innerHTML="<i>Rendering poster...</i>";ultraCanvas=document.createElement('canvas');ultraCanvasCtx=ultraCanvas.getContext("2d",{alpha:false});ultraCanvas.width=ultraWidth;ultraCanvas.height=ultraHeight;ultraScaledCanvas=document.createElement('canvas');ultraScaledCanvasCtx=ultraScaledCanvas.getContext("2d",{alpha:false});ultraScaledCanvas.width=Math.floor(ultraWidth/2);ultraScaledCanvas.height=Math.floor(ultraHeight/2);var ultraMandel=new Array();var ultraSmoothMandel=new Array();var lscreenX=screenX*ultraWidth/canvasWidth;var lscreenY=screenY*ultraHeight/canvasHeight;var lzoom=zoom*ultraHeight/canvasHeight;for(var i=0;i<workers;i++){ultraMandel[i]=new Uint8Array(Math.floor(ultraWidth*ultraHeight/workers));}if(smooth==1){for(var i=0;i<workers;i++){ultraSmoothMandel[i]=new Uint8Array(Math.floor(ultraWidth*ultraHeight/workers));}}
else{for(var i=0;i<workers;i++){ultraSmoothMandel[i]=new Uint8Array(1);}}
workersRunning=0;for(i=0;i<workers;i++){percentDone[i]=0;workersRunning++;startLine=Math.floor(ultraHeight/workers)*i;computeWorker[i]=new Worker("mandel-compute.js");computeWorker[i].onmessage=onUltraComputeEnded;computeWorker[i].postMessage({mandelBuffer:ultraMandel[i].buffer,smoothMandel:ultraSmoothMandel[i].buffer,workerID:i,startLine:startLine,blockSize:1,canvasWidth:ultraWidth,segmentHeight:ultraHeight/workers,screenX:lscreenX,screenY:lscreenY,zoom:lzoom,iterations:iterations,smooth:smooth},[ultraMandel[i].buffer],[ultraSmoothMandel[i].buffer]);}}
vga=[0,43520,11141120,11184640,2852126720,2852170240,2857697280,2863311360,1431655680,1431699200,1442796800,1442840320,4283782400,4283825920,4294923520,4294967040,0,336860160,538976256,741092352,943208448,1162167552,1364283648,1633771776,1903259904,2189591040,2459079168,2728567296,3065427456,3419130624,3823362816,4294967040,65280,1090584320,2097217280,3187736320,4278255360,4278238720,4278222080,4278206720,4278190080,4282449920,4286382080,4290641920,4294901760,3204382720,2113863680,1107230720,16711680,16728320,16743680,16760320,16776960,12517120,8257280,4325120,2105409280,2659057408,3195928320,3749576448,4286447360,4286439168,4286430720,4286422528,4286414080,4288576768,4290673920,4292836608,4294933760,3758062848,3204414720,2667543808,2113895680,2113904128,2113912320,2113920768,2113928960,2111831808,2109669120,2107571968,3065446144,3350658816,3686203136,3954638592,4290182912,4290177792,4290173696,4290168576,4290164224,4291278336,4292589056,4293637632,4294948352,3959404032,3690968576,3355424256,3070211584,3070215936,3070221056,3070225152,3070230272,3068919552,3067870976,3066560256,28928,469790976,939553024,1426092288,1895854336,1895847168,1895839744,1895832576,1895825408,1897660416,1899495424,1901395968,1903230976,1433468928,946929664,477167616,7405568,7412736,7419904,7427328,7434496,5599488,3698944,1863936,943223040,1161326848,1429762304,1631088896,1899524352,1899520256,1899517184,1899513088,1899509760,1900361728,1901410304,1902196736,1903245312,1634809856,1433483264,1165047808,946944000,946947328,946951424,946954496,946958592,945910016,945123584,944075008,1364291840,1498509568,1632727296,1766945024,1901162752,1901160704,1901158656,1901156608,1901154560,1901678848,1902203136,1902727424,1903251712,1769033984,1634816256,1500598528,1366380800,1366382848,1366384896,1366386944,1366388992,1365864704,1365340416,1364816128,16640,268452096,536887552,805323008,1090535680,1090531328,1090527232,1090523136,1090519040,1091567616,1092616192,1093664768,1094778880,809566208,541130752,272695296,4259840,4263936,4268032,4272128,4276480,3162368,2113792,1065216,538984704,673202432,807420160,941637888,1092632832,1092630528,1092628480,1092626432,1092624384,1093148672,1093672960,1094197248,1094787072,943792128,809574400,675356672,541138944,541140992,541143040,541145088,541147392,540557568,540033280,539508992,741097728,808206592,875315456,1009533184,1093419264,1093417984,1093415936,1093414912,1093413888,1093676032,1093938176,1094462464,1094790144,1010904064,876686336,809577472,742468608,742469632,742470656,742472704,742473984,742146304,741622016,741359872,0,0,0,0,0,0,0,0,];function toggleRotatePalette()
{if(travelling>0)
return;rotating=1-rotating;if(rotating){cycleText.innerHTML="Stop";}else{cycleText.innerHTML="Animate";startRender(0,0);}}
function rotatePalette(steps)
{if(needRedraw)
return 1;var i;var j;var lsteps;if(steps==-1)
lsteps=1;else
lsteps=steps;for(j=0;j<lsteps;j++){colours[254]=Math.floor(colours[0]);if(!lockJuliaColours)
juliaColours[254]=Math.floor(juliaColours[0]);for(i=0;i<254;i++){colours[i]=Math.floor(colours[i+1]);if(!lockJuliaColours)
juliaColours[i]=Math.floor(juliaColours[i+1]);}
currentRotation++;if(currentRotation>254)
currentRotation=0;}
if(!drawingJulia)
startJulia(0,null,null);if(steps==-1)
startRender(0,0);}
function decrPalette(event)
{if(travelling>0)
return;currentPalette--;if(currentPalette<0)
currentPalette=paletteCount;changePalette();}
function incrPalette(event)
{if(travelling>0)
return;currentPalette++;if(currentPalette>paletteCount)
currentPalette=0;changePalette();}
function changePalette()
{if(travelling>0)
return;var i;var r;var g;var b;currentRotation=0;switch(currentPalette){case 0:paletteText.textContent="Original";for(i=0;i<255;i++){if(i<32){r=i*8;g=i*8;b=127-i*4;}else if(i<128){r=255;g=255-(i-32)*8/3;b=(i-32)*4/3;}else if(i<192){r=255-(i-128)*4;g=0+(i-128)*3;b=127-(i-128);}else{r=0;g=192-(i-192)*3;b=64+(i-192);}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;case 1:paletteText.textContent="Fire";for(i=0;i<255;i++){if(i<64){r=i*4;g=0;b=0;}else if(i<128){r=255;g=(i-64)*2;b=0;}else if(i<192){r=255;g=128-((i-128)*2);b=0;}else{r=255-(i-192)*4;g=0;b=0;}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;case 2:paletteText.textContent="Black & white";for(i=0;i<255;i++){if(i<128){r=255-i*2;g=255-i*2;b=255-i*2;}
else{r=(i-128)*2;g=(i-128)*2;b=(i-128)*2;}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;case 3:paletteText.textContent="Electric blue";for(i=0;i<255;i++){if(i<32){r=0;g=0;b=i*4;}else if(i<64){r=(i-32)*8;g=(i-32)*8;b=127+(i-32)*4;}else if(i<96){r=255-(i-64)*8;g=255-(i-64)*8;b=255-(i-64)*4;}else if(i<128){r=0;g=0;b=127-(i-96)*4;}else if(i<192){r=0;g=0;b=(i-128);}else{r=0;g=0;b=63-(i-192);}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;case 4:paletteText.textContent="Toon";for(i=0;i<255;i++){if(i%4==0){r=100;g=20;b=200;}
else if(i%4==1){r=220;g=112;b=0;}
else if(i%4==2){r=230;g=120;b=0;}
else{r=255;g=128;b=0;}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;case 5:paletteText.textContent="Gold";for(i=0;i<255;i++){if(i<32){r=54+Math.floor((i)*(224-54)/32);g=11+Math.floor((i)*(115-11)/32);b=2+Math.floor((i)*(10-2)/32);}
else if(i<64){r=224+Math.floor((i-32)*(255-224)/32);g=115+Math.floor((i-32)*(192-115)/32);b=10+Math.floor((i-32)*(49-10)/32);}
else if(i<192){r=255;g=192+Math.floor((i-64)*(255-192)/128);b=49+Math.floor((i-64)*(166-49)/128);}
else if(i<224){r=255;g=255+Math.floor((i-192)*(192-255)/32);b=166+Math.floor((i-192)*(49-166)/32);}
else{r=255+Math.floor((i-224)*(54-255)/32);g=192+Math.floor((i-224)*(11-192)/32);b=49+Math.floor((i-224)*(2-49)/32);}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;case 6:paletteText.textContent="Classic VGA";for(i=0;i<255;i++){colours[i]=vga[i%256];}
break;case 7:paletteText.textContent="CGA 1";for(i=0;i<255;i++){if(i%4==0)
colours[i]=0;else if(i%4==1)
colours[i]=1442840320;else if(i%4==2)
colours[i]=4283825920;else if(i%4==3)
colours[i]=4294967040;}
break;case 8:paletteText.textContent="CGA 2";for(i=0;i<255;i++){if(i%4==0)
colours[i]=0;else if(i%4==1)
colours[i]=1442796800;else if(i%4==2)
colours[i]=4283782400;else if(i%4==3)
colours[i]=4294923520;}
break;case 9:paletteText.textContent="Primary (RGB)";for(i=0;i<255;i++){if(i<85){r=255-i*3;g=0+i*3;b=0;}else if(i<170){r=0;g=255-(i-85)*3;b=0+(i-85)*3;}else{r=0+(i-170)*3;g=0;b=255-(i-170)*3;}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;case 10:paletteText.textContent="Secondary (CMY)";for(i=0;i<255;i++){if(i<85){r=0+i*3;g=255-i*3;b=255;}else if(i<170){r=255;g=0+(i-85)*3;b=255-(i-85)*3;}else{r=255-(i-170)*3;g=255;b=0+(i-170)*3;}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;case 11:paletteText.textContent="Tertiary 1";for(i=0;i<255;i++){if(i<85){r=255-i*3/2;g=127-i*3/2;b=0+i*3;}else if(i<170){r=127-(i-85)*3/2;g=0+(i-85)*3;b=255-(i-85)*3/2;}else{r=0+(i-170)*3;g=255-(i-170)*3/2;b=127-(i-170)*3/2;}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;case 12:paletteText.textContent="Tertiary 2";for(i=0;i<255;i++){if(i<85){r=255-i*3;g=0+i*3/2;b=127+i*3/2;}else if(i<170){r=0+(i-85)*3/2;g=127+(i-85)*3/2;b=255-(i-85)*3;}else{r=127+(i-170)*3/2;g=255-(i-170)*3;b=0+(i-170)*3/2;}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;case 13:paletteText.textContent="Neon";for(i=0;i<255;i++){if(i<32){r=i*4;g=0;b=i*8;}else if(i<64){r=124-(i-32)*4;g=0;b=248-(i-32)*8;}else if(i<96){r=(i-64)*8;g=(i-64)*4;b=0;}else if(i<128){r=248-(i-96)*8;g=124-(i-96)*4;b=0;}else if(i<160){r=0;g=(i-128)*4;b=(i-128)*8;}else if(i<192){r=0;g=124-(i-160)*4;b=248-(i-160)*8;}else if(i<224){r=(i-192)*4;g=(i-192)*8;b=(i-192)*4;}else{r=124-(i-224)*4;g=248-(i-224)*8;b=124-(i-224)*4;}
colours[i]=(r<<24)+(g<<16)+(b<<8);}
break;}
if(!lockJuliaColours)
for(i=0;i<255;i++)
juliaColours[i]=colours[i];startRender(0,0);}
document.body.onmousedown=function(e)
{mousePressed=1;eventTime=performance.now();}
document.body.onmousemove=mouseMove;
document.body.onmouseup=function()
{mousePressed=0;oldMouseX=-1;oldMouseY=-1;for(i=0;i<workers;i++)
if(blockSize[i]>1)
startRender(1,1);}
function pointOnScreen(x,y)
{var destXscreen=x*zoom+screenX;var destYscreen=y*zoom+screenY;if((destXscreen>0)&&(destXscreen<canvasWidth)&&(destYscreen>0)&&(destYscreen<canvasHeight))
return 1;else
return 0;}
var onOneShotComputeEnded=function(e)
{var itersToPrint=e.data.oneShotResult;if(itersToPrint==iterations)
itersToPrint="n/a";mandelText.textContent=itersToPrint;}
var onComputeEnded=function(e)
{if(!e.data.finished){if(blockSize[e.data.workerID]==1){percentDone[e.data.workerID]=Math.round(e.data.lineCount/(canvasHeight/workers)*100);var totalProgress=0;for(var j=0;j<workers;j++){totalProgress+=percentDone[j];}progress=Math.floor(totalProgress/workers);workingText.innerHTML="<i>"+progress+"%</i>";}
return 1;}
var workerID=e.data.workerID;computeWorkerRunning[workerID]=0;mandel[workerID]=new Uint8Array(e.data.mandel);smoothMandel[workerID]=new Uint8Array(e.data.smoothMandel);while(renderWorkerRunning[workerID]!=0){console.log("Waiting for worker to end");}
if(!renderWorker[workerID]){renderWorker[workerID]=new Worker("mandel-render.js");renderWorker[workerID].onmessage=onRenderEnded;}
renderWorkerRunning[workerID]=1;if(blockSize[workerID]==1)
renderWorker[workerID].postMessage({colours:colours,mandel:mandel[workerID].buffer,canvasBuffer:mdSegment[workerID].buffer,workerID:workerID,blockSize:blockSize[workerID],arrayWidth:canvasWidth,smooth:smooth,smoothMandel:smoothMandel[workerID].buffer},[mandel[workerID].buffer],[smoothMandel[workerID].buffer],[mdSegment[workerID].buffer]);else
renderWorker[workerID].postMessage({colours:colours,mandel:mandel[workerID].buffer,canvasBuffer:mdCoarseSegment[workerID].buffer,workerID:workerID,blockSize:blockSize[workerID],arrayWidth:coarseWidth,smooth:smooth,smoothMandel:smoothMandel[workerID]},[mandel[workerID].buffer],[mdCoarseSegment[workerID].buffer],[smoothMandel[workerID].buffer]);}
var onRenderEnded=function(e)
{var workerID=e.data.workerID;mandel[workerID]=new Uint8Array(e.data.mandelBuffer);smoothMandel[workerID]=new Uint8Array(e.data.smoothMandel);if(e.data.blockSize==1)
mdSegment[workerID]=new Uint8ClampedArray(e.data.pixelsBuffer);else
mdCoarseSegment[workerID]=new Uint8ClampedArray(e.data.pixelsBuffer);renderWorkerRunning[workerID]=0;workersRunning--;if(renderCount++>=20){renderCount=0;renderWorker[workerID].terminate();renderWorker[workerID]=null;renderWorker[workerID]=new Worker("mandel-render.js");renderWorker[workerID].onmessage=onRenderEnded;var zoomTmp=Math.floor(zoom);delete zoom;window.zoom=zoomTmp;}
var lstartLine;if(e.data.blockSize==1){finished[workerID]=1;mSegment[workerID].data.set(mdSegment[workerID]);lstartLine=Math.floor(workerID*chunkHeight);offScreenCtx.putImageData(mSegment[workerID],0,lstartLine);}else{mCoarseSegment[workerID].data.set(mdCoarseSegment[workerID]);lstartLine=Math.floor(workerID*chunkHeight/scaleFactor);coarseCtx.putImageData(mCoarseSegment[workerID],0,lstartLine);mctx.drawImage(coarse,0,0);}
if(workersRunning==0){var allFinished=true;for(var i=0;i<workers;i++){if(!finished[i]){allFinished=false;break;}}if((!eventOccurred)&&(allFinished)){needRedraw=0;mctx.drawImage(offScreen,0,0,canvasWidth/scaleFactor,canvasHeight/scaleFactor);if(!rotating){workingText.style.visibility="hidden";mc.style.borderColor="black";mc.style.outline="5px solid #FFFFFF";if(posterTime!=0){diff=Math.floor((performance.now()-posterTime)/10)/100;posterTime=0;logText.innerHTML="Poster rendered in "+diff+" s";}
else{diff=Math.floor((performance.now()-start)/10)/100;logText.innerHTML="Rendered in "+diff+" s";if(typeof showInfoAfterRender==='function'){showInfoAfterRender(diff*1000);}}
updateCoords(canvasWidth/2,canvasHeight/2,"centre");}
}}
if(showAxes)
drawAxes();if(startupAnim){if(startupTick<50){startupTick++;zoom=Math.ceil(Math.sin((startupTick/70)*Math.PI)*(startZoom+80));zoomText.textContent=Math.floor(zoom);if(startupTick>29){if(startupTick>30)
timesTaken[startupTick-31]=performance.now()-timer;timer=performance.now();}}
else{timesTakenSorted=timesTaken.sort(function(a,b){return a-b});benchmarkTime=Math.min(Math.max((timesTakenSorted[5]+timesTakenSorted[6]+timesTakenSorted[7])/3,2),20);if(benchmarkTime<7)
maxBlockSize=8;else
maxBlockSize=16;for(var i=0;i<workers;i++){blockSize[i]=maxBlockSize;}startupAnim=0;zoomText.textContent=Math.floor(zoom);if(iterations!=iterSlider.value){iterations=Math.floor(iterSlider.value);itersInput.value=iterations;}
xnorm=(canvasWidth/2*1.0-screenX)/zoom;ynorm=(canvasHeight/2*1.0-screenY)/zoom;if(movingToSaved){travelling=1;travelDirX=Math.sign(destX-xnorm);travelDirY=Math.sign(destY-ynorm);travelDirZoom=Math.sign(destZoom-zoom);}}}
else if(travelling>0){updateCoords(canvasWidth/2,canvasHeight/2,"centre");zoomText.textContent=Math.floor(zoom);if(travelling==2){ldestX=-1.0;ldestY=0.0;ldestZoom=300;if((zoom>Math.floor(ldestZoom))&&((!pointOnScreen(destX,destY))||(zoom>destZoom))){zoom+=Math.ceil((ldestZoom-zoom)/10*(benchmarkTime/4+2));if(Math.abs(zoom-ldestZoom)<5)
zoom=Math.floor(ldestZoom);screenX=Math.round(-xnorm*zoom+canvasWidth/2);screenY=Math.round(-ynorm*zoom+canvasHeight/2);}
else{travelling=1;travelDirX=Math.sign(destX-xnorm);travelDirY=Math.sign(destY-ynorm);travelDirZoom=Math.sign(destZoom-zoom);}}
else{ldestX=destX;ldestY=destY;ldestZoom=destZoom;if((xnorm!=ldestX)||(ynorm!=ldestY)||(zoom!=ldestZoom)||(iterations!=destIters)){if(iterations<destIters){iterations+=benchmarkTime;if(iterations>destIters)
iterations=destIters;iterSlider.value=iterations;itersInput.value=iterations;}
if(iterations>destIters){iterations-=benchmarkTime*2;if(iterations<destIters)
iterations=destIters;iterSlider.value=iterations;itersInput.value=iterations;}
if((Math.abs((xnorm-ldestX)*zoom)<1)||(Math.sign(ldestX-xnorm)!=travelDirX))
xnorm=ldestX;else
xnorm+=(ldestX-xnorm)/Math.log(zoom)/4*benchmarkTime*(movingToSaved*2+1);if((Math.abs((ynorm-ldestY)*zoom)<1)||(Math.sign(ldestY-ynorm)!=travelDirY))
ynorm=ldestY;else
ynorm+=(ldestY-ynorm)/Math.log(zoom)/4*benchmarkTime*(movingToSaved*2+1);if((Math.abs((zoom-ldestZoom)/ldestZoom*100)<3)||(Math.sign(ldestZoom-zoom)!=travelDirZoom))
zoom=Math.floor(ldestZoom);else
zoom+=Math.max(Math.ceil(Math.log(ldestZoom-zoom)*(zoom/2000)*benchmarkTime*(movingToSaved*4+1)),1);screenX=Math.round(-xnorm*zoom+canvasWidth/2);screenY=Math.round(-ynorm*zoom+canvasHeight/2);}
else{travelling=0;movingToSaved=0;start=performance.now();zoom=Math.floor(zoom);}}}
else if((blockSize[workerID]>=2)&&(!eventOccurred)&&(!mousePressed)){if(performance.now()>zoomTime+200){needToRun[workerID]=1;blockSize[workerID]/=2;}}else
needToRun[workerID]=0;};function wheelMoved(event)
{event.preventDefault();if(posterTime!=0)
return 1;if(typeof hideInfo==='function'){hideInfo();}zoomTime=performance.now();eventTime=performance.now();var rect=mc.getBoundingClientRect();var mx=(event.clientX-rect.left)/(rect.width)*rect.width*scaleFactor-4;var my=(event.clientY-rect.top)/(rect.height)*rect.height*scaleFactor-4;if((mx<=0)||(mx>canvasWidth)||(my<=0)||(my>canvasHeight))
return 1;var xnorm=(mx*1.0-screenX)/zoom;var ynorm=(my*1.0-screenY)/zoom;if(((zoom==maxZoom)&&(event.deltaY<0))||((zoom==minZoom)&&(event.deltaY>0)))
return 1;if(event.deltaY<0)
zoom+=zoom/5;else
zoom-=zoom/5;if(zoom>maxZoom)
zoom=maxZoom;if(zoom<minZoom)
zoom=minZoom;zoom=Math.floor(zoom);if(autotuneIterations){iterations=calculateAdaptiveIterations(zoom);iterSlider.value=iterations;itersInput.value=iterations;}screenX=Math.round(-xnorm*zoom+mx);screenY=Math.round(-ynorm*zoom+my);eventOccurred=1;killWorkers();startRender(1,1);}
function mouseMove(event)
{if((posterTime!=0)||(linkDialog.style.display=="block")||(posterDialog.style.display=="block"))
return 1;var rect=mc.getBoundingClientRect();var mx=(event.clientX-rect.left)/(rect.right-rect.left)*rect.width*scaleFactor-6;var my=(event.clientY-rect.top)/(rect.bottom-rect.top)*rect.height*scaleFactor-6;
if((mx<=0)||(mx>canvasWidth)||(my<=0)||(my>canvasHeight)){centerX=canvasWidth/2;centerY=canvasHeight/2;if((showJulia)&&(!drawingJulia)){var xnorm=Math.floor((centerX-screenX)/zoom*1000000000)/1000000000;var ynorm=Math.floor((centerY-screenY)/zoom*1000000000)/1000000000;startJulia(1,xnorm,ynorm);}
if(lastPointer=="canvas"){updateCoords(centerX,centerY,"centre");lastPointer="offcanvas";}
return 1;}
if(mousePressed<1){lastPointer="canvas";updateCoords(mx,my,"pointer");return 1;}
eventTime=performance.now();if(oldMouseX!=-1){if(typeof hideInfo==='function'){hideInfo();}var xOffset=(event.clientX-oldMouseX)*scaleFactor;var yOffset=(event.clientY-oldMouseY)*scaleFactor;screenX+=xOffset;screenY+=yOffset;var xnorm=(canvasWidth/2-screenX)/zoom;var ynorm=(canvasHeight/2-screenY)/zoom;if(xnorm<xnormMin)
screenX=Math.round(-xnormMin*zoom+canvasWidth/2);if(xnorm>xnormMax)
screenX=Math.round(-xnormMax*zoom+canvasWidth/2);if(ynorm<ynormMin)
screenY=Math.round(-ynormMin*zoom+canvasHeight/2);if(ynorm>ynormMax)
screenY=Math.round(-ynormMax*zoom+canvasHeight/2);}
oldMouseX=event.clientX;oldMouseY=event.clientY;eventOccurred=1;killWorkers();startRender(1,1);}
function touchStart(event)
{if(posterTime!=0)
return 1;mousePressed=0;var rect=mc.getBoundingClientRect();var m1x=(event.targetTouches[0].clientX-rect.left)/(rect.right-rect.left)*rect.width*scaleFactor-4;var m1y=(event.targetTouches[0].clientY-rect.top)/(rect.bottom-rect.top)*rect.height*scaleFactor-4;}
function touchMove(event)
{if(posterTime!=0)
return 1;if(event.targetTouches.length>=2){event.preventDefault();if(typeof hideInfo==='function'){hideInfo();}var rect=mc.getBoundingClientRect();var m1x=(event.targetTouches[0].clientX-rect.left)/(rect.right-rect.left)*rect.width*scaleFactor-4;var m1y=(event.targetTouches[0].clientY-rect.top)/(rect.bottom-rect.top)*rect.height*scaleFactor-4;var m2x=(event.targetTouches[1].clientX-rect.left)/(rect.right-rect.left)*rect.width*scaleFactor-4;var m2y=(event.targetTouches[1].clientY-rect.top)/(rect.bottom-rect.top)*rect.height*scaleFactor-4;if((m1x<=0)||(m1x>canvasWidth)||(m1y<=0)||(m1y>canvasHeight)||(m2x<=0)||(m2x>canvasWidth)||(m2y<=0)||(m2y>canvasHeight))
return 1;var canvasCenterX=canvasWidth/2;var canvasCenterY=canvasHeight/2;centerX=Math.min(m1x,m2x)+Math.abs(m1x-m2x)/2;centerY=Math.min(m1y,m2y)+Math.abs(m1y-m2y)/2;distanceBetween=Math.sqrt(Math.pow(m1x-m2x,2)+Math.pow(m1y-m2y,2));if(firstPinchDistance!=0){pinchRatio=distanceBetween/firstPinchDistance;var xnorm=(centerX*1.0-screenX)/zoom;var ynorm=(centerY*1.0-screenY)/zoom;if(((zoom==maxZoom)&&(pinchRatio>1))||((zoom==minZoom)&&(pinchRatio<1)))
return 1;if(pinchRatio>1.0)
zoom+=Math.floor((pinchRatio*zoom)/50);else
zoom-=Math.floor((pinchRatio*zoom)/50);if(zoom>maxZoom)
zoom=maxZoom;if(zoom<minZoom)
zoom=minZoom;screenX=Math.floor(-xnorm*zoom+centerX);screenY=Math.floor(-ynorm*zoom+centerY);if(autotuneIterations){iterations=calculateAdaptiveIterations(zoom);iterSlider.value=iterations;itersInput.value=iterations;}eventOccurred=1;startRender(1,1);}else
firstPinchDistance=distanceBetween;}else{var rect=mc.getBoundingClientRect();var mx=(event.targetTouches[0].clientX-rect.left)/(rect.right-rect.left)*rect.width*scaleFactor-4;var my=(event.targetTouches[0].clientY-rect.top)/(rect.bottom-rect.top)*rect.height*scaleFactor-4;if((mx<=0)||(mx>canvasWidth)||(my<=0)||(my>canvasHeight))
return 1;event.preventDefault();if(oldMouseX!=-1){if(typeof hideInfo==='function'){hideInfo();}var xOffset=(event.targetTouches[0].clientX-oldMouseX)*scaleFactor;var yOffset=(event.targetTouches[0].clientY-oldMouseY)*scaleFactor;screenX+=xOffset;screenY+=yOffset;}
oldMouseX=event.targetTouches[0].clientX;oldMouseY=event.targetTouches[0].clientY;eventOccurred=1;killWorkers();startRender(1,1);}}
function touchEnd(event)
{firstPinchDistance=0;mousePressed=0;oldMouseX=-1;oldMouseY=-1;}

function updateCoords(x,y,source)
{var xnorm=Math.floor((x-screenX)/zoom*1000000000)/1000000000;var ynorm=Math.floor((y-screenY)/zoom*1000000000)/1000000000;xmouse=xnorm;ymouse=ynorm;xPosText.value=''+xnorm;yPosText.value=''+-ynorm;coordSourceText.textContent=" "+source;coordSource2Text.textContent=" "+source;oneShotWorker.postMessage({oneShot:1,x:x,y:y,screenX:screenX,screenY:screenY,zoom:zoom,iterations:iterations,smooth:0});if((showJulia)&&(!drawingJulia))
startJulia(1,xnorm,ynorm);}
function startJulia(compute,xnorm,ynorm)
{if(drawingJulia)
return 0;drawingJulia=1;if(compute){if(!juliaWorker){juliaWorker=new Worker("julia-compute.js");juliaWorker.onmessage=onJuliaComputeEnded;}
juliaWorker.postMessage({juliaBuffer:julia.buffer,Cr:xnorm,Ci:ynorm,width:juliaCanvasWidth,height:juliaCanvasHeight,iterations:juliaIterations},[julia.buffer]);}
else{if(!juliaRenderWorker){juliaRenderWorker=new Worker("julia-render.js");juliaRenderWorker.onmessage=onJuliaRenderEnded;}
juliaRenderWorker.postMessage({colours:juliaColours,julia:julia.buffer,canvasBuffer:mdJulia.buffer,arrayWidth:juliaCanvasWidth,arrayHeight:juliaCanvasHeight},[julia.buffer],[mdJulia.buffer]);}}
function setup()
{setViewport();showAxesBox.checked=false;showJuliaBox.checked=true;lockJuliaColoursBox.checked=false;smoothBox.checked=true;juliaArea.style.display="none";juliaParamsArea.style.display="none";incrPalette();needRedraw=0;loadState();zoomText.textContent=Math.floor(zoom);oneShotWorker=new Worker("mandel-compute.js");oneShotWorker.onmessage=onOneShotComputeEnded;for(let i=0;i<workers;i++){for(let y=0;y<canvasHeight/workers;y++){for(let x=0;x<canvasWidth;x++){let pixelPos=(x+y*canvasWidth)*4;mdSegment[i][pixelPos+3]=255;}}
for(let y=0;y<coarseHeight/workers;y++){for(let x=0;x<coarseWidth;x++){let pixelPos=(x+y*coarseWidth)*4;mdCoarseSegment[i][pixelPos+3]=255;}}}
eventTime=performance.now();needRedraw=1;toggleJulia();toggleSmooth();startRender(1,1);}
function startRender(lneedRecompute,blocky)
{workingText.innerHTML="";workingText.style.visibility="visible";if(rotating)
logText.innerHTML="<i>Cycling colours...</i>";else
logText.innerHTML="<i>Working...</i>";itersInput.value=iterations;juliaItersText.textContent=juliaIterations;zoomText.textContent=Math.floor(zoom);mc.style.borderColor="black";mc.style.outline="5px solid gray";if(lneedRecompute){rotating=0;cycleText.innerHTML="Animate";}
for(i=0;i<workers;i++){needToRun[i]=1;finished[i]=0;percentDone[i]=0;if((lneedRecompute==1)&&(blocky==1))
blockSize[i]=maxBlockSize;else
blockSize[i]=1;}
needRedraw=1;needRecompute=lneedRecompute;eventOccurred=0;start=performance.now();rotationFrameStart=start;requestAnimationFrame(drawMandel);}
function drawMandel()
{const iter_max=iterations;const lcanvasWidth=canvasWidth;const lcanvasHeight=canvasHeight;const lscreenX=screenX;const lscreenY=screenY;const lzoom=zoom;if((rotating)&&(performance.now()<rotationFrameStart+15)){requestAnimationFrame(drawMandel);return 1;}
rotationFrameStart=performance.now();if((!startupAnim)&&(!autotuneIterations)&&(iterations!=iterSlider.value)){iterations=Math.floor(iterSlider.value);startRender(1,1);needRedraw=1;}
if((showJulia)&&(juliaIterations!=juliaIterSlider.value)){juliaIterations=Math.floor(juliaIterSlider.value);juliaItersText.textContent=juliaIterations;updateCoords(canvasWidth/2,canvasHeight/2,"centre");}
for(i=0;i<workers;i++)
if((blockSize[i]>1)&&(performance.now()>zoomTime+500))
needRedraw=1;if(needRedraw){for(i=0;i<workers;i++){startLine=chunkHeight*i;if((needToRun[i]==1)&&(!eventOccurred)){if(renderWorkerRunning[i]){continue;}
if(computeWorkerRunning[i]){continue;}
if(needRecompute){if(!computeWorker[i]){computeWorker[i]=new Worker("mandel-compute.js");computeWorker[i].onmessage=onComputeEnded;}
workersRunning++;computeWorkerRunning[i]=1;if(blockSize[i]==1)
computeWorker[i].postMessage({mandelBuffer:mandel[i].buffer,workerID:i,startLine:startLine,blockSize:blockSize[i],canvasWidth:canvasWidth,segmentHeight:chunkHeight,screenX:screenX,screenY:screenY,zoom:zoom,iterations:iterations,oneShot:0,smooth:smooth,smoothMandel:smoothMandel[i].buffer},[mandel[i].buffer],[smoothMandel[i].buffer]);else
computeWorker[i].postMessage({mandelBuffer:mandel[i].buffer,workerID:i,startLine:startLine/scaleFactor,blockSize:blockSize[i],canvasWidth:coarseWidth,segmentHeight:chunkHeight/2,screenX:screenX/scaleFactor,screenY:screenY/scaleFactor,zoom:zoom/scaleFactor,iterations:iterations,oneShot:0,smooth:smooth,smoothMandel:smoothMandel[i].buffer},[mandel[i].buffer],[smoothMandel[i].buffer]);}
else{workersRunning++;if(!renderWorker[i]){renderWorker[i]=new Worker("mandel-render.js");renderWorker[i].onmessage=onRenderEnded;}
renderWorkerRunning[i]=1;renderWorker[i].postMessage({colours:colours,mandel:mandel[i].buffer,canvasBuffer:mdSegment[i].buffer,workerID:i,blockSize:blockSize[i],arrayWidth:canvasWidth,smooth:smooth,smoothMandel:smoothMandel[i].buffer},[mandel[i].buffer],[smoothMandel[i].buffer],[mdSegment[i].buffer]);}}}}
if((workersRunning==0)&&(rotating==1))
rotatePalette(-1);else
requestAnimationFrame(drawMandel);}
setup();drawMandel();
