
//////////  Canvas  ////////////////////////////////////////////////////////////

var canvas = document.querySelector('canvas');
var context = canvas.getContext('2d');

var buffer = document.createElement('canvas')
var cc = buffer.getContext('2d')

canvas.width = buffer.width = 500;
canvas.height = buffer.height = 500;

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;    // for now assume it never resizes
const canvasCenter = {x:canvasWidth/2,y:canvasHeight/2};

//////////  Colors!  ///////////////////////////////////////////////////////////

const SimpleColor = {
  red: '#e6194b', green: '#3cb44b', yellow: '#ffe119', blue: '#4363d8', orange: '#f58231', purple: '#911eb4',
  cyan: '#42d4f4', magenta: '#f032e6', lime: '#bfef45', pink: '#fabebe', teal: '#469990', lavender: '#e6beff',
  brown: '#9a6324', beige: '#fffac8', maroon: '#800000', mint: '#aaffc3', olive: '#808000', apricot: '#ffd8b1',
  navy: '#000075', grey: '#a9a9a9', white: '#ffffff', black: '#000000',
}; // https://sashat.me/2017/01/11/list-of-20-simple-distinct-colors/

//////////  World  /////////////////////////////////////////////////////////////

const defaultSquare = {color: SimpleColor.cyan, number: 1, active: false}
const worldWidth = 1000
const worldArray = new Array(worldWidth*worldWidth).fill(defaultSquare);
function world(x,y){return worldArray[worldWidth*y + x];}

//////////  Globals  ///////////////////////////////////////////////////////////

const settings = {
  textOn: true,
  pipsInstead: false,
};

const global = {
  scale: {x:60,y:60}, // width and height of each cell
  pos: {x:500,y:500}, // index into world array
  offset: {x:43,y:43}, // distance from corner of canvas to corner of top-left cell
  moving: false, // save on updates
  lastClick: {x:0,y:0}, // as a pos ^
};

//////////  Other  /////////////////////////////////////////////////////////////

// used by drawPips
const whichPip = { 0:[], 1:[4], 2:[2,6], 3:[2,4,6], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8], 7:[0,2,3,4,5,6,8], 8:[0,1,2,3,5,6,7,8] };

const drawMargin = 1; // difference between scale and tile (gap will be background color by default)


//* Only temporary ;) Will be moved to a world file asap
worldArray[worldWidth*505 + 502] = {color: SimpleColor.blue, number: 0, active: true};
worldArray[worldWidth*505 + 503] = {color: SimpleColor.blue, number: 1, active: false};
worldArray[worldWidth*505 + 504] = {color: SimpleColor.blue, number: 2, active: false};
worldArray[worldWidth*506 + 502] = {color: SimpleColor.blue, number: 3, active: false};
worldArray[worldWidth*506 + 503] = {color: SimpleColor.blue, number: 4, active: false};
worldArray[worldWidth*506 + 504] = {color: SimpleColor.blue, number: 5, active: false};
worldArray[worldWidth*507 + 502] = {color: SimpleColor.blue, number: 6, active: false};
worldArray[worldWidth*507 + 503] = {color: SimpleColor.blue, number: 7, active: false};
worldArray[worldWidth*507 + 504] = {color: SimpleColor.blue, number: 8, active: false};

worldArray[worldWidth*505 + 507] = {color: SimpleColor.blue, number: 0, active: true};
worldArray[worldWidth*505 + 509] = {color: SimpleColor.blue, number: 1, active: false};
worldArray[worldWidth*505 + 511] = {color: SimpleColor.blue, number: 2, active: false};
worldArray[worldWidth*507 + 507] = {color: SimpleColor.blue, number: 3, active: false};
worldArray[worldWidth*507 + 509] = {color: SimpleColor.blue, number: 4, active: false};
worldArray[worldWidth*507 + 511] = {color: SimpleColor.blue, number: 5, active: false};
worldArray[worldWidth*509 + 507] = {color: SimpleColor.blue, number: 6, active: false};
worldArray[worldWidth*509 + 509] = {color: SimpleColor.blue, number: 7, active: false};
worldArray[worldWidth*509 + 511] = {color: SimpleColor.blue, number: 8, active: false};
//*/



////////////////////////////////////////////////////////////////////////////////
//////////  Top Level  /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function start(){
  const updateRate = 30; // per second
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
      drawCell(x, y);
    }
  }

  context.clearRect(0,0,canvasWidth,canvasHeight);
  context.drawImage(buffer, 0, 0, buffer.width, buffer.height, 0, 0, canvas.width, canvas.height);
  window.requestAnimationFrame(draw);
}

//////////  Start  /////////////////////////////////////////////////////////////

start();

////////////////////////////////////////////////////////////////////////////////
///////////  The Meat  /////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function drawCell(x, y) {
  offset = { x: (global.scale.x * x - global.offset.x), y: (global.scale.y * y - global.offset.y) };
  cell = world(global.pos.x+x,global.pos.y+y);
  if (!cell) {return;} // someday I will have a clever idea to handle this case
  if (!cell.active){
    drawEmptyCell(offset);
  } else {
    drawCellColor(offset,cell.number);
    if (settings.textOn){
      if (settings.pipsInstead) {
        drawPips(offset,cell.number);
      } else {
        drawText(offset,cell.number);
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


function drawCellColor(offset, number) {
  cc.fillStyle = Object.values(SimpleColor)[number];
  cc.fillRect(offset.x + drawMargin,
              offset.y + drawMargin,
              global.scale.x - drawMargin,
              global.scale.y - drawMargin)
}

function drawPips(offset, number) {
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
      default: console.log("~~Too many pips, too many pips~~"); drawText(offset,number);
    }
    cc.stroke();
    cc.fill();
    cc.closePath();
  }
}

function drawText(offset, number) {
  cc.fillStyle = SimpleColor.black;
  cc.font = global.scale.y + "px Georgia";
  cc.strokeStyle = SimpleColor.white;
  text = number;
  width = cc.measureText(text).width;
  cc.lineWidth = global.scale.y/40; // experimental, feels right
  cc.strokeText(text, offset.x + (global.scale.x - width)/2, offset.y + global.scale.y*7/9);
  cc.fillText(text, offset.x + (global.scale.x - width)/2, offset.y + global.scale.y*7/9);
}

function drawEmptyCell(offset) {
  cc.fillStyle = SimpleColor.black;
  cc.fillRect(offset.x + drawMargin,
              offset.y + drawMargin,
              global.scale.x - drawMargin,
              global.scale.y - drawMargin)
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

// this will need to be broken out further once there are other things to click on
function handleClick(pos){
  globalPos = findGlobal(pos);
  setActive(globalPos);

  global.lastClick = globalPos;
  global.moving = true;
}




//*/