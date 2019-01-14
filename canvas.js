var canvas = document.querySelector('canvas');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var cc = canvas.getContext('2d');

var img
const imgColors = [
            {r:0xe6,g:0x19,b:0x4b}, {r:0x3c,g:0xb4,b:0x4b}, {r:0xff,g:0xe1,b:0x19}, {r:0x43,g:0x63,b:0xd8}, {r:0xf5,g:0x82,b:0x31},
            {r:0x91,g:0x1e,b:0xb4}, {r:0x46,g:0xf0,b:0xf0}, {r:0xf0,g:0x32,b:0xe6}, {r:0xbc,g:0xf6,b:0x0c}, {r:0xfa,g:0xbe,b:0xbe},
            {r:0x00,g:0x80,b:0x80}, {r:0xe6,g:0xbe,b:0xff}, {r:0x9a,g:0x63,b:0x24}, {r:0xff,g:0xfa,b:0xc8}, {r:0x80,g:0x00,b:0x00}, 
            {r:0xaa,g:0xff,b:0xc3}, {r:0x80,g:0x80,b:0x00}, {r:0xff,g:0xd8,b:0xb1}, {r:0x00,g:0x00,b:0x75}, {r:0x80,g:0x80,b:0x80},
]; // https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/

const maxIterations = 100 // limited by both user's patience and js's accuracy

var offset = {x:-2.15, y:-1.25};
var scale = {x:3/canvas.width, y:2.5/canvas.height};
var parity = true; // track pairs of clicks
var lastClick = {}

function setPixel(x,y,count){
  var i = (y*canvas.width + x)*4
  color = imgColors[count%imgColors.length]
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
      let z = {x:0,y:0};
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

function draw(){
  populateImg();
  cc.putImageData(img,0,0)
}

function logCoords(event){
  var x = event.clientX;
  var y = event.clientY;
  if(!parity){
    offset = {x: offset.x + scale.x*Math.min(x,lastClick.x),
              y: offset.y + scale.y*Math.min(y,lastClick.y),
    };
    scale =  {x: scale.x*Math.abs(x-lastClick.x)/canvas.width,
              y: scale.y*Math.abs(y-lastClick.y)/canvas.height,
    };
    draw();
  }
  lastClick = {x:x,y:y};
  parity = !parity;
}

draw();