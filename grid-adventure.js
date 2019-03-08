var canvas = document.querySelector('canvas');
var cc = canvas.getContext('2d');

canvas.width = 500;
canvas.height = 500;

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;    // for now assume it never resizes
const canvasCenter = {x:canvasWidth/2,y:canvasHeight/2};

const SimpleColor = {
  red: '#e6194b', green: '#3cb44b', yellow: '#ffe119', blue: '#4363d8', orange: '#f58231', purple: '#911eb4',
  cyan: '#42d4f4', magenta: '#f032e6', lime: '#bfef45', pink: '#fabebe', teal: '#469990', lavender: '#e6beff',
  brown: '#9a6324', beige: '#fffac8', maroon: '#800000', mint: '#aaffc3', olive: '#808000', apricot: '#ffd8b1',
  navy: '#000075', grey: '#a9a9a9', white: '#ffffff', black: '#000000',
}; // https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/

const defaultSquare = {color: SimpleColor.cyan, number: 1, active: false}

const worldWidth = 1000
const worldArray = new Array(worldWidth*worldWidth).fill(defaultSquare);
function world(x,y){return worldArray[worldWidth*y + x];}
worldArray[worldWidth*505 + 502] = {color: SimpleColor.blue, number: 0, active: true};
worldArray[worldWidth*505 + 503] = {color: SimpleColor.blue, number: 1, active: false};
worldArray[worldWidth*505 + 504] = {color: SimpleColor.blue, number: 2, active: false};
worldArray[worldWidth*505 + 505] = {color: SimpleColor.blue, number: 3, active: false};
worldArray[worldWidth*506 + 502] = {color: SimpleColor.blue, number: 4, active: false};
worldArray[worldWidth*506 + 503] = {color: SimpleColor.blue, number: 5, active: false};
worldArray[worldWidth*506 + 504] = {color: SimpleColor.blue, number: 6, active: false};
worldArray[worldWidth*506 + 505] = {color: SimpleColor.blue, number: 7, active: false};

const settings = {
  textOn: true,
  pipsInstead: false,
};

const global = {
  scale: {x:60,y:60}, // TODO: initialize based on canvas size
  pos: {x:500,y:500},
  offset: {x:63,y:63},
  moving: false,
  lastClick: {x:0,y:0},
};

// used by drawPips
const whichPip = { 0:[], 1:[4], 2:[2,6], 3:[2,4,6], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8], 7:[0,2,3,4,5,6,8], 8:[0,1,2,3,5,6,7,8] };

const drawMargin = 1;

function start(){
  const updateRate = 30; // ups
  window.setInterval(update, 1000/updateRate);
  update();
  draw();
}


function update() {
  if(global.moving) {moveTowardCenter();}
}

function draw() {
  cc.clearRect(0,0,canvasWidth,canvasHeight);

  for (x=0; x < (canvasWidth+global.offset.x)/global.scale.x; x++){
    for (y=0; y < (canvasHeight+global.offset.y)/global.scale.y; y++){
      cellDraw(x, y);
    }
  }

  window.requestAnimationFrame(draw);
}

//////////  Start  /////////////////////////////////////////////////////////////

start();

////////////////////////////////////////////////////////////////////////////////
///////////  The Meat  /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function cellDraw(x, y) {

  offset = {x:(global.scale.x * x - global.offset.x),
            y:(global.scale.y * y - global.offset.y)};
  cell = world(global.pos.x+x,global.pos.y+y);
  if (!cell.active){
    cc.fillStyle = SimpleColor.black;
    cc.fillRect(offset.x + drawMargin,
              offset.y + drawMargin,
              global.scale.x - drawMargin,
              global.scale.y - drawMargin)
  } else {
    cc.fillStyle = Object.values(SimpleColor)[cell.number];
    cc.fillRect(offset.x + drawMargin,
              offset.y + drawMargin,
              global.scale.x - drawMargin,
              global.scale.y - drawMargin)
    if (settings.textOn){
      if (settings.pipsInstead) {
        drawPips(offset,cell.number);
      } else {
        cc.fillStyle = SimpleColor.black;
        cc.font = global.scale.y + "px Georgia";
        cc.strokeStyle = SimpleColor.white;
        text = cell.number;
        width = cc.measureText(text).width;
        cc.lineWidth = global.scale.y/40; // experimental, feels right
        cc.strokeText(text, offset.x + (global.scale.x - width)/2, offset.y + global.scale.y*7/9);
        cc.fillText(text, offset.x + (global.scale.x - width)/2, offset.y + global.scale.y*7/9);
      }
    }
  }
}

function findGlobal(pos) {
  return {x:global.pos.x + Math.floor((global.offset.x + pos.x)/global.scale.x),
          y:global.pos.y + Math.floor((global.offset.y + pos.y)/global.scale.y) };
}

function setActive(pos) {
  newTile = Object.assign({}, world(pos.x,pos.y)); // this is dup.....
  newTile.active = true;
  worldArray[worldWidth*pos.y + pos.x] = newTile;
}

function moveTowardCenter() {

  clickCenter = {x:(global.lastClick.x - global.pos.x + 0.5)*global.scale.x - global.offset.x,
                 y:(global.lastClick.y - global.pos.y + 0.5)*global.scale.y - global.offset.y};

  DistanceToCenter = {x:clickCenter.x - canvasCenter.x,
                      y:clickCenter.y - canvasCenter.y};

  // adjust offset and click location
  global.offset.x += DistanceToCenter.x/10;
  global.offset.y += DistanceToCenter.y/10;

  correctOffsetAndPos()

  // turn off moving if at center
  if (DistanceToCenter.x*DistanceToCenter.x + DistanceToCenter.y*DistanceToCenter.y < 10){
    global.moving = false;
  }
}

function correctOffsetAndPos() {
  // adjust pos if needed
  if (global.offset.x > global.scale.x || global.offset.x < 0) {
    error = Math.floor(global.offset.x / global.scale.x);
    global.offset.x -= error * global.scale.x;
    global.pos.x += error;
  }
  if (global.offset.y > global.scale.y || global.offset.y < 0) {
    error = Math.floor(global.offset.y / global.scale.y);
    global.offset.y -= error * global.scale.y;
    global.pos.y += error;
  }
}


function drawPips(offset,number) {
  pipUnit = { x:global.scale.x / 10, y:global.scale.y / 10 };
  pipRadius = Math.min(pipUnit.x,pipUnit.y);
  cc.strokeStyle = SimpleColor.black;
  cc.fillStyle = SimpleColor.black;
  pips = whichPip[number];
  for (var loc of pips) {
    cc.beginPath();
    switch(loc) {
      case 0: cc.arc(offset.x + 2*pipUnit.x, offset.y + 2*pipUnit.y, pipRadius, 0, 2 * Math.PI); break;
      case 1: cc.arc(offset.x + 5*pipUnit.x, offset.y + 2*pipUnit.y, pipRadius, 0, 2 * Math.PI); break;
      case 2: cc.arc(offset.x + 8*pipUnit.x, offset.y + 2*pipUnit.y, pipRadius, 0, 2 * Math.PI); break;
      case 3: cc.arc(offset.x + 2*pipUnit.x, offset.y + 5*pipUnit.y, pipRadius, 0, 2 * Math.PI); break;
      case 4: cc.arc(offset.x + 5*pipUnit.x, offset.y + 5*pipUnit.y, pipRadius, 0, 2 * Math.PI); break;
      case 5: cc.arc(offset.x + 8*pipUnit.x, offset.y + 5*pipUnit.y, pipRadius, 0, 2 * Math.PI); break;
      case 6: cc.arc(offset.x + 2*pipUnit.x, offset.y + 8*pipUnit.y, pipRadius, 0, 2 * Math.PI); break;
      case 7: cc.arc(offset.x + 5*pipUnit.x, offset.y + 8*pipUnit.y, pipRadius, 0, 2 * Math.PI); break;
      case 8: cc.arc(offset.x + 8*pipUnit.x, offset.y + 8*pipUnit.y, pipRadius, 0, 2 * Math.PI); break;
      default: console.log("something has gone wrong!!!!")
    }
    cc.stroke();
    cc.fill();
    cc.closePath();
  }
}
////////////////////////////////////////////////////////////////////////////////
///////////  SETTING SETTINGS  /////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function textToggle() {
  settings.textOn = !settings.textOn;
}
function pipToggle() {
  settings.pipsInstead = !settings.pipsInstead;
}



////////////////////////////////////////////////////////////////////////////////
///////////  CLICK & TOUCH HANDLING  ///////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


canvas.addEventListener("wheel", function(e){
  e.preventDefault();
  oldScale = {x:global.scale.x,y:global.scale.y};
  dir = e.wheelDelta > 0 ? 1 : -1;
  amount = dir * Math.log10(Math.abs(e.wheelDelta)) ;
  global.scale.x += amount;
  global.scale.y += amount;

  global.offset.x += (1 - oldScale.x/global.scale.x)*canvasCenter.x;
  global.offset.y += (1 - oldScale.y/global.scale.y)*canvasCenter.y;
  correctOffsetAndPos();
});

canvas.addEventListener("click", onClick);
function onClick(){
  handleClick({ x:event.offsetX, y:event.offsetY});
};

// this will need to be broken out once there are other things to click on
function handleClick(pos){
  globalPos = findGlobal(pos);
  setActive(globalPos);

  global.lastClick = globalPos; // dup just in case
  global.moving = true;
}




//*/