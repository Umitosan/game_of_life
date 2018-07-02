/*jshint esversion: 6 */

var CANVAS,
    ctx,
    myGame;
var myColors = new Colors();

var defaultSimSpeed = 100;

var State = {
  myReq: undefined,
  loopRunning: false,
  gameStarted: false,
  lastFrameTimeMs: 0, // The last time the loop was run
  maxFPS: 60, // The maximum FPS allowed
  simSpeed: defaultSimSpeed, // speed of simulation loop
  playTime: 0,
  frameCounter: 0,
  lastKey: 'none',
  mouseX: 0,
  mouseY: 0,
  mouseLeftDown: false,
  mouseRightDown: false
};

function softReset() {
  console.log('soft reset!');
  myGame = undefined;
  State = {
    myReq: undefined,
    loopRunning: false,
    gameStarted: false,
    lastFrameTimeMs: 0, // The last time the loop was run
    maxFPS: 60, // The maximum FPS allowed
    simSpeed: defaultSimSpeed, // speed of simulation loop
    playTime: 0,
    frameCounter: 0,
    lastKey: 'none',
    mouseX: 0,
    mouseY: 0,
    mouseLeftDown: false,
    mouseRightDown: false
  };

}

function Colors() {
  this.black = 'rgba(0, 0, 0, 1)';
  this.darkGrey = 'rgba(50, 50, 50, 1)';
  this.lightGreyTrans = 'rgba(50, 50, 50, 0.3)';
  this.greyReset = 'rgb(211,211,211)';
  this.lighterGreyReset = 'rgb(240,240,240)';
  this.white = 'rgba(250, 250, 250, 1)';
  this.red = 'rgba(230, 0, 0, 1)';
  this.cherry = 'rgba(242,47,8,1)';
  this.green = 'rgba(0, 230, 0, 1)';
  this.blue = 'rgba(0, 0, 230, 1)';
  this.electricBlue = 'rgba(20, 30, 230, 1)';
}

function Box(x,y,color,size) {
  this.x = x;
  this.y = y;
  this.color = color;
  this.size =  size;
  this.prevStatus = 'off';
  this.curStatus = 'off';

  this.draw = function() {
    ctx.beginPath();
    ctx.rect(this.x,this.y,this.size,this.size);
    ctx.fillStyle = this.color;
    ctx.fill();
    // ctx.stroke();
  };
} // end box

function Game(updateDur) {
  this.timeGap = 0;
  this.lastUpdate = 0;
  this.updateDuration = updateDur; // milliseconds duration between update()
  this.paused = false;
  this.bg = new Image();
  this.lastKey = 0;
  this.pausedTxt = undefined;
  this.grid = undefined;
  this.boxSize = 9;
  this.gridWidth = 81;
  this.gridHeight = 60;
  this.curBoxC = 0;
  this.curBoxR = 0;
  this.mode = 'init';
  this.boxColorOn = myColors.electricBlue;
  this.boxColorOff = myColors.white;

  this.init = function() {
    this.bg.src = 'bg1.png';
    this.grid = [];
    for (let r = 0; r < this.gridHeight; r++) {
      let tmpRow = [];
      for (let c = 0; c < this.gridWidth; c++) {
        tmpRow.push( new Box((c*9)+(c+1),(r*9)+(r+1),this.boxColorOff,this.boxSize)); // +1 is for 1 pixel gap between boxes
      }
      this.grid.push(tmpRow);
    }
    this.lastUpdate = performance.now();
  };

  // this.moveBox = function() {
  //   if (this.curBoxC === (this.gridWidth-1)) {
  //     this.grid[this.curBoxR][this.curBoxC].color = this.boxColorOff;
  //     this.curBoxC = 0;
  //     this.curBoxR += 1;
  //     this.grid[this.curBoxR][this.curBoxC].color = this.boxColorOn;
  //   } else {
  //     this.grid[this.curBoxR][this.curBoxC].color = this.boxColorOff;
  //     this.curBoxC += 1;
  //     this.grid[this.curBoxR][this.curBoxC].color =  this.boxColorOn;
  //   }
  // };

  this.getOnList = function() {
    let list = [];
    for (let c = 0; c < this.gridWidth-1; c++) {
      for (let r = 0; r < this.gridHeight-1; r++) {
        if (this.grid[r][c].curStatus === 'on') {
          list.push( {"row":r, "col":c});
        }
      }
    }
    // console.log("{'row':"+r+", 'col':"+c+"}");
    for (let i = 0; i < list.length; i++) {
        console.log(list[i]);
    }
    return list;
  };

  this.loadExample = function(name) {
    this.clearGrid();  // reset boxes to white before example load up
    if (examples[name] !== undefined) {
      let e = examples[name];
      for (let i = 0; i < e.length; i++) {
        let r = e[i].row;
        let c = e[i].col;
        this.grid[r][c].curStatus = 'on';
      }
    } else {
      console.log('example not found');
    }
    this.colorNextGen(); // color the board after status updated
  };

  this.paintBox = function() {
    let c = Math.floor( (State.mouseX-2) / (this.boxSize+1) ); // small offsets are for... 1.canvas border  2.the divider lines between boxes
    let r = Math.floor( (State.mouseY-2) / (this.boxSize+1) );
    // console.log('box clicked: Col='+c+"  Row="+r);
    this.grid[r][c].color = this.boxColorOn;
    this.grid[r][c].curStatus = 'on';
    this.grid[r][c].prevStatus = 'on';
  };
  this.eraseBox = function() {
    let c = Math.floor( (State.mouseX-2) / (this.boxSize+1) ); // small offsets are for... 1.canvas border  2.the divider lines between boxes
    let r = Math.floor( (State.mouseY-2) / (this.boxSize+1) );
    this.grid[r][c].color = this.boxColorOff;
    this.grid[r][c].curStatus = 'off';
    this.grid[r][c].prevStatus = 'off';
  };

  this.nextGen = function() {
    this.cellFate(); // calculate life and death of each cell
    this.colorNextGen(); // update the colors of each cell
    // console.log('nextGen');
    // console.log('grid = ', this.grid);
  }; // end sim

  this.cellFate = function() {
    // Any live cell with fewer than two live neighbors dies, as if by under population.
    // Any live cell with two or three live neighbors lives on to the next generation.
    // Any live cell with more than three live neighbors dies, as if by overpopulation.
    // Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.

    for (let c = 0; c < this.gridWidth-1; c++) {
      for (let r = 0; r < this.gridHeight-1; r++) {
        this.grid[r][c].prevStatus = this.grid[r][c].curStatus;
      }
    }
    for (let c = 0; c < this.gridWidth-1; c++) {
      for (let r = 0; r < this.gridHeight-1; r++) {
        let count = this.countAdjacentCellStatus(r,c);

        if (this.grid[r][c].prevStatus === 'on') { // die
          if (count < 2) {
            this.grid[r][c].curStatus = 'off';
          } else if ((count === 2) || (count === 3)) { // live
            this.grid[r][c].curStatus = 'on';
          } else if (count > 3) { // die
            this.grid[r][c].curStatus = 'off';
          } else {
            // nothin
          }
        } else if ( (count === 3) && (this.grid[r][c].curStatus === 'off') ) { // live
          this.grid[r][c].curStatus = 'on';
        } else  {
          // nothin
        }

      } // for
    } // for
  };

  this.countAdjacentCellStatus = function(row,col) {
    let r = row;
    let c = col;
    let count = 0; // set to random for visual static getRandomIntInclusive(0,3)

    // up left
    if ((r !== 0) && (c !== 0)) {
      if (this.grid[r-1][c-1].prevStatus === 'on') { count += 1; }
    }
    // up
    if (r !== 0) {
      if (this.grid[r-1][c].prevStatus === 'on') { count += 1; }
    }
    // up right
    if ((r !== 0) && (c < this.gridWidth-1)) {
      if (this.grid[r-1][c+1].prevStatus === 'on') { count += 1; }
    }

    // left
    if (c !== 0) {
      if (this.grid[r][c-1].prevStatus === 'on') { count += 1; }
    }
    // right
    if (c < this.gridWidth-1) {
      if (this.grid[r][c+1].prevStatus === 'on') { count += 1; }
    }

    // down right
    if ((r < this.gridHeight-1) && (c < this.gridWidth-1)) {
      if (this.grid[r+1][c+1].prevStatus === 'on') { count += 1; }
    }
    // down
    if (r < this.gridHeight-1) {
      if (this.grid[r+1][c].prevStatus === 'on') { count += 1; }
    }
    // down left
    if ((r < this.gridHeight-1) && (c !== 0)) {
      if (this.grid[r+1][c-1].prevStatus === 'on') { count += 1; }
    }
    return count;
  };

  this.colorNextGen = function() {
    // console.log('colorNextGen run');
    for (let c = 0; c < this.gridWidth-1; c++) {
      for (let r = 0; r < this.gridHeight-1; r++) {
        if (this.grid[r][c].curStatus === "on") {
          this.grid[r][c].color = this.boxColorOn;
        } else if (this.grid[r][c].curStatus === "off") {
          this.grid[r][c].color = this.boxColorOff;
        } else {
          console.log('colorNextGen prob');
        }
      }
    }
  };

  this.pauseIt = function() {
    // console.log('GAME paused');
    myGame.paused = true;
    // this.pausedTxt.show = true;
  };
  this.unpauseIt = function() {
    // console.log('GAME un-paused');
    myGame.paused = false;
    // this.pausedTxt.show = false;
    // this prevents pac from updating many times after UNpausing
    this.lastUpdate = performance.now();
    this.timeGap = 0;
  };

  this.clearGrid = function() {
    console.log('clearGrid');
    for (let c = 0; c < this.gridWidth-1; c++) {
      for (let r = 0; r < this.gridHeight-1; r++) {
        this.grid[r][c].color = this.boxColorOff;
        this.grid[r][c].curStatus = 'off';
        this.grid[r][c].prevStatus = 'off';
      }
    }
  };

  this.drawBG = function() { // display background over canvas
    ctx.imageSmoothingEnabled = false;  // turns off AntiAliasing
    ctx.drawImage(this.bg,4,4,CANVAS.width-9,CANVAS.height-9);
  };

  this.draw = function() {
    for (let c = 0; c < this.gridWidth-1; c++) {
      for (let r = 0; r < this.gridHeight-1; r++) {
        this.grid[r][c].draw();
      }
    }
  }; // end draw

  this.update = function() {
      if (this.paused === false) { // performance based update: myGame.update() runs every myGame.updateDuration milliseconds
            this.timeGap = performance.now() - this.lastUpdate;

            if ( this.timeGap >= this.updateDuration ) { // this update is restricted to updateDuration
              let timesToUpdate = this.timeGap / this.updateDuration;
              for (let i=1; i < timesToUpdate; i++) { // update children objects
                if (this.mode === 'sim') {
                  this.nextGen();
                }
              }
              this.lastUpdate = performance.now();
            } // end if

            if (this.mode === "draw") { // run this every update cycle regardless of timing
              if (State.mouseLeftDown) {
                // console.log('painting');
                this.paintBox();
              } else if (State.mouseRightDown) {
                // console.log('erasing');
                this.eraseBox();
              }
            } else {
              // mode is none
            }

      } else if (this.paused === true) {
        // PAUSED! do nothin
      } else {
        console.log('game pause issue');
      }

  }; // end update

} // end myGame


//////////////////////////////////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////////////////////////////////
function clearCanvas() {
  ctx.clearRect(-1, -1, canvas.width+1, canvas.height+1); // offset by 1 px because the whole canvas is offset initially (for better pixel accuracy)
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function generalLoopReset() {
  if (State.myReq !== undefined) {  // reset game loop if already started
    cancelAnimationFrame(State.myReq);
    softReset();
  }
  myGame = new Game(State.simSpeed); // ms per update()
  myGame.init();
  State.myReq = requestAnimationFrame(gameLoop);
}

//////////////////////////////////////////////////////////////////////////////////
// MOUSE INPUT
//////////////////////////////////////////////////////////////////////////////////
function mDown(evt) {
  if (myGame.mode === "draw") {
    if (evt.button === 0) {  // left-click
      // console.log('MOUSE: left down');
      if (State.mouseRightDown === false) { State.mouseLeftDown = true; } // only allow one mouse button down at a time, ignore change if both are down
    } else if (evt.button === 2) { // right-click
      // console.log('MOUSE: right down');
      if (State.mouseLeftDown === false) { State.mouseRightDown = true; }
    }
  } else {
    console.log('game not in draw mode');
  }
}

function mUp(evt) {
  if (myGame.mode === "draw") {
    if (evt.button === 0) {  // left-click
      // console.log('MOUSE: left up');
      State.mouseLeftDown = false;
    } else if (evt.button === 2) { // right-click
      // console.log('MOUSE: left up');
      State.mouseRightDown = false;
    }
  } else {
    console.log('game not in draw mode');
  }
}


//////////////////////////////////////////////////////////////////////////////////
// GAME LOOP
//////////////////////////////////////////////////////////////////////////////////
function gameLoop(timestamp) {
  // timestamp is automatically returnd from requestAnimationFrame
  // timestamp uses performance.now() to compute the time
  State.myReq = requestAnimationFrame(gameLoop);

  if ( (State.loopRunning === true) && (State.gameStarted === true) ) { myGame.update(); }

  clearCanvas();
  if (State.gameStarted === false) {
    myGame.drawBG();
  } else {
    myGame.draw();
  }

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).ready(function() {

  CANVAS =  $('#canvas')[0];
  ctx =  CANVAS.getContext('2d');
  // CANVAS.addEventListener('keydown',keyDown,false);
  canvas.addEventListener("mousedown", mDown, false);
  canvas.addEventListener("mouseup", mUp, false);
  $('body').on('contextmenu', '#canvas', function(e){ return false; }); // prevent right click context menu default action
  canvas.addEventListener('mousemove', function(evt) {
      let rect = CANVAS.getBoundingClientRect();
      State.mouseX = evt.clientX - rect.left;
      State.mouseY = evt.clientY - rect.top;
      $("#coords-x").text(State.mouseX);
      $("#coords-y").text(State.mouseY);
  }, false);

  //INPUT
  var leftMouseDown = false;

  // this is to correct for canvas blurryness on single pixel wide lines etc
  // important when animating to reduce rendering artifacts and other oddities
  // ctx.translate(0.5, 0.5);
  ctx.translate(1, 1);

  // start things up!
  generalLoopReset();
  State.loopRunning = true;
  State.gameStarted = true;
  myGame.mode = 'draw';
  myGame.loadExample("custom1");

  $('#start-btn').click(function() {
    console.log("start button clicked");
    if (myGame.mode === 'draw') {
      myGame.simStart = performance.now();
      myGame.mode = 'sim';
      let v = $('#speed-slider').val();
      $('#speed-input').prop("value", v);
      myGame.updateDuration = (1000/v);
    } else {
      console.log('must reset before starting again');
    }
  });

  $('#reset-btn').click(function() {
    console.log("reset button clicked");
    generalLoopReset();
    State.loopRunning = true;
    State.gameStarted = true;
    myGame.mode = 'draw';
  });

  $('#pause-btn').click(function() {
    console.log("pause button clicked");
    if (myGame.paused === false) {
      myGame.pauseIt();
    } else if (myGame.paused === true) {
      myGame.unpauseIt();
    }
  });

  //INPUT
  $('#speed-slider').mousedown(function(e1) {
    leftMouseDown = true;
  }).mouseup(function(e2) {
    leftMouseDown = false;
  });

  $('#speed-slider').mousemove(function(e) {
    if (leftMouseDown === true) {
      let v = this.value;
      $('#speed-input').prop("value", v);
      if (myGame.mode === 'sim') {
        myGame.updateDuration = (1000/v);
      }
    }
  });

  // examples
  $('#glider-gun').click(function(e) {
    myGame.loadExample("gliderGun");
  });
  $('#koks-galexy').click(function(e) {
    myGame.loadExample("koksGalexy");
  });

});
