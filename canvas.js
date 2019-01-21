var canvas = document.querySelector('canvas');
var cc = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const mouseDragError = 5; // alternatively a factor of Math.min(canvas.width,canvas.height)
function withinError(loc1, loc2){return Math.abs(loc1.x - loc2.x) < mouseDragError || Math.abs(loc1.y - loc2.y) < mouseDragError;}

var img;
const imgColors = [
            {r:0xe6,g:0x19,b:0x4b}, {r:0x3c,g:0xb4,b:0x4b}, {r:0xff,g:0xe1,b:0x19}, {r:0x43,g:0x63,b:0xd8}, {r:0xf5,g:0x82,b:0x31},
            {r:0x91,g:0x1e,b:0xb4}, {r:0x46,g:0xf0,b:0xf0}, {r:0xf0,g:0x32,b:0xe6}, {r:0xbc,g:0xf6,b:0x0c}, {r:0xfa,g:0xbe,b:0xbe},
            {r:0x00,g:0x80,b:0x80}, {r:0xe6,g:0xbe,b:0xff}, {r:0x9a,g:0x63,b:0x24}, {r:0xff,g:0xfa,b:0xc8}, {r:0x80,g:0x00,b:0x00}, 
            {r:0xaa,g:0xff,b:0xc3}, {r:0x80,g:0x80,b:0x00}, {r:0xff,g:0xd8,b:0xb1}, {r:0x00,g:0x00,b:0x75}, {r:0x80,g:0x80,b:0x80},
]; // https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/

const maxIterations = 100; // limited by both user's patience and js's accuracy

var offset = {};
var scale = {};
setStartingArrangement();


function setStartingArrangement(){
  const mandelbrot = {width:3,height:2.5,centerX:-0.55,centerY:0 };

  if(canvas.width/canvas.height > mandelbrot.width/mandelbrot.height){ // wide screen
    scale = { x:mandelbrot.height/canvas.height,
              y:mandelbrot.height/canvas.height };
    offset = { x:-scale.x * canvas.width/2 + mandelbrot.centerX,
               y:-mandelbrot.height/2 + mandelbrot.centerY };
  } else { // tall screen
    scale = { x:mandelbrot.width/canvas.width,
              y:mandelbrot.width/canvas.width };
    offset = { x:-mandelbrot.width/2 + mandelbrot.centerX,
               y:-scale.y * canvas.height/2 + mandelbrot.centerY };
  }
}

function setPixel(x,y,count){
  var i = (y*canvas.width + x)*4;
  color = imgColors[count%imgColors.length];
  img.data[i+0] = color.r;
  img.data[i+1] = color.g;
  img.data[i+2] = color.b;
  img.data[i+3] = 0xff;
}

function populateImg(){
  img = cc.createImageData(canvas.width,canvas.height);
  for (x = 0; x < canvas.width; x++){
    for (y = 0; y < canvas.height; y++){
      let c = { x:offset.x + x*scale.x, y:offset.y + y*scale.y };
      // does the point diverge?
      let z = { x:0, y:0 };
      for (count = 0; count < maxIterations; count++){
        // f(z) = z^2 + c
        z = { x: z.x * z.x - z.y*z.y + c.x, 
              y: 2*z.x*z.y + c.y };
        if(z.x*z.x + z.y*z.y >= 4){
          setPixel(x,y,count);
          break;
        }
      }
    }
  }
}

function recalculatePixels(lastPressLocation, currentReleaseLocation){
  offset = { x: offset.x + scale.x*Math.min(currentReleaseLocation.x,lastPressLocation.x),
             y: offset.y + scale.y*Math.min(currentReleaseLocation.y,lastPressLocation.y),
  };
  scale =  { x: scale.x*Math.abs(currentReleaseLocation.x-lastPressLocation.x)/canvas.width,
             y: scale.y*Math.abs(currentReleaseLocation.y-lastPressLocation.y)/canvas.height,
  };
  populateImg();
}

function draw(){
  cc.clearRect(0,0,canvas.width,canvas.height);
  cc.putImageData(img,0,0);
}


populateImg();
draw();


////////////////////////////////////////////////////////////////////////////////
///////////  CLICK & TOUCH HANDLING  ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

canvas.addEventListener("mousedown", onMousedown);
function onMousedown(){
  onPress({ x:event.offsetX, y:event.offsetY});
};
canvas.addEventListener("touchstart", onTouchstart);
function onTouchstart(){
  lastTouch = { x:event.targetTouches[0].pageX, y:event.targetTouches[0].pageY}
  onPress(lastTouch);
};

canvas.addEventListener("mouseup", onMouseup);
function onMouseup(){
  onRelease({ x:event.offsetX, y:event.offsetY});
};
canvas.addEventListener("touchend", onTouchend);
function onTouchend(){
  onRelease(lastTouch);
};

canvas.addEventListener("mousemove", onMousemove);
function onMousemove(){
  onMove({ x:event.offsetX, y:event.offsetY});
};
canvas.addEventListener("touchmove", onTouchmove);
function onTouchmove(){
  lastTouch = { x:event.targetTouches[0].pageX, y:event.targetTouches[0].pageY}
  onMove(lastTouch);
};

addEventListener('touchstart', function(){
  canvas.removeEventListener("mousedown", onMousedown);
  canvas.removeEventListener("mouseup", onMouseup);
  canvas.removeEventListener("mousemove", onMousemove);
});

var shouldDrawRect = false; // based on pairs of clicks
var pressing = false;
var dragging = false;
var lastPressLocation = {};
var lastTouch = {};


function onPress(currentPressLocation){
  pressing = true;
  if(!shouldDrawRect && !dragging){
    lastPressLocation = currentPressLocation;
  }
}

function onRelease(currentReleaseLocation){
  if(shouldDrawRect || dragging){
    shouldDrawRect = false;
    recalculatePixels(lastPressLocation, currentReleaseLocation);
    draw();
  } else if(pressing && !dragging){
    shouldDrawRect = true
  }
  pressing = false;
  dragging = false;
}

function onMove(currentLocation){
  if(pressing && !dragging && !withinError(lastPressLocation, currentLocation) ){
    dragging = true;
  }

  if(shouldDrawRect || dragging){
    draw();
    startX = Math.min(lastPressLocation.x, currentLocation.x)
    startY = Math.min(lastPressLocation.y, currentLocation.y)
    width = Math.abs(lastPressLocation.x - currentLocation.x)
    height = Math.abs(lastPressLocation.y - currentLocation.y)
    cc.strokeRect(startX, startY, width, height ) // should I really be drawing in this func?
  }
}
