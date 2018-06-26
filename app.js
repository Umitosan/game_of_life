/*jshint esversion: 6 */

var CANVAS,
    ctx,
    myGame;
var myColors = new Colors();

var State = {
  myReq: undefined,
  loopRunning: false,
  gameStarted: false,
  lastFrameTimeMs: 0, // The last time the loop was run
  maxFPS: 60, // The maximum FPS allowed
  playTime: 0,
  frameCounter: 0,
  lastKey: 'none',
  mouseX: 0,
  mouseY: 0
};

function Colors() {
  this.black = 'rgba(0, 0, 0, 1)';
  this.darkGrey = 'rgba(50, 50, 50, 1)';
  this.lightGreyTrans = 'rgba(50, 50, 50, 0.3)';
  this.greyReset = 'rgb(211,211,211)';
  this.lighterGreyReset = 'rgb(240,240,240)';
  this.white = 'rgba(250, 250, 250, 1)';
  this.red = 'rgba(230, 0, 0, 1)';
  this.green = 'rgba(0, 230, 0, 1)';
  this.blue = 'rgba(0, 0, 230, 0.7)';
}

function softReset() {
  console.log('soft reset run');
  myGame = undefined;
  State = {
    myReq: undefined,
    loopRunning: false,
    gameStarted: false,
    lastFrameTimeMs: 0, // The last time the loop was run
    maxFPS: 60, // The maximum FPS allowed
    playTime: 0,
    frameCounter: 0,
    lastKey: 'none'
  };
}

function Box(x,y,color,size) {
  this.x = x;
  this.y = y;
  this.color = color;
  this.size =  size;

  this.draw = function() {
    // console.log('box draw');
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
  this.simSpeed = 500; // milliseconds duration between game generations

  this.init = function() {
    this.bg.src = 'bg1.png';
    this.grid = [];
    for (let r = 0; r < this.gridHeight; r++) {
      let tmpRow = [];
      for (let c = 0; c < this.gridWidth; c++) {
        tmpRow.push( new Box((c*9)+(c+1),(r*9)+(r+1),myColors.white,this.boxSize)); // +1 is for 1 pixel gap between boxes
      }
      this.grid.push(tmpRow);
    }
    this.grid[0][0].color = myColors.blue;
    this.lastUpdate = performance.now();
  };

  this.moveBox = function() {
    if (this.curBoxC === (this.gridWidth-1)) {
      this.grid[this.curBoxR][this.curBoxC].color = myColors.white;
      this.curBoxC = 0;
      this.curBoxR += 1;
      this.grid[this.curBoxR][this.curBoxC].color = myColors.blue;
    } else {
      this.grid[this.curBoxR][this.curBoxC].color = myColors.white;
      this.curBoxC += 1;
      this.grid[this.curBoxR][this.curBoxC].color = myColors.blue;
    }
  };

  this.paintBox = function() {
    let c = Math.floor(State.mouseX / (this.boxSize+1));
    let r = Math.floor(State.mouseY / (this.boxSize+1));
    // console.log('box clicked: Col='+c+"  Row="+r);
    this.grid[r][c].color = myColors.blue;
  };
  this.eraseBox = function() {
    let c = Math.floor(State.mouseX / (this.boxSize+1));
    let r = Math.floor(State.mouseY / (this.boxSize+1));
    // console.log('box clicked: Col='+c+"  Row="+r);
    this.grid[r][c].color = myColors.white;
  };

  this.nextGen = function() {
    // update board colors for next generation of sim
  };

  this.pauseIt = function() {
    console.log('GAME paused');
    myGame.paused = true;
    // this.pausedTxt.show = true;
  };

  this.unpauseIt = function() {
    console.log('GAME un-paused');
    myGame.paused = false;
    // this.pausedTxt.show = false;
    // this prevents pac from updating many times after UNpausing
    this.lastUpdate = performance.now();
    this.timeGap = 0;
  };

  this.drawBG = function() {
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

        // if (State.playTime < 1) { // make sure on first update() only run once
        //   this.lastUpdate = performance.now();
        //   this.timeGap = 0;
        // } else {
        //   this.timeGap = performance.now() - this.lastUpdate;
        // }

            this.timeGap = performance.now() - this.lastUpdate;

            if ( this.timeGap >= this.updateDuration ) {
                  // console.log('update run');
              let timesToUpdate = this.timeGap / this.updateDuration;
                // console.log('times to update = ', timesToUpdate);
              for (let i=1; i < timesToUpdate; i++) {
                // update children objects
                // this.moveBox();
                if (this.mode === 'sim') { this.nextGen(); }
              }
              this.lastUpdate = performance.now();
            }

      } else if (this.paused === true) {
        // do nothin
      } else {
        console.log('game pause issue');
      }

  }; // end update

} // end myGame

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
  myGame = new Game(500); // ms per update()
  myGame.init();
  State.myReq = requestAnimationFrame(gameLoop);
}

function mDown(evt) {
  if (myGame.mode === "draw") {
    console.log('mouse down and drawing box');
    if (evt.button === 0) {  // left-click
      myGame.paintBox();
    } else if (evt.button === 2) { // right-click
      myGame.eraseBox();
    }
  } else {
    console.log('game not in draw mode');
  }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).ready(function() {

  CANVAS =  $('#canvas')[0];
  ctx =  CANVAS.getContext('2d');
  // CANVAS.addEventListener('keydown',keyDown,false);
  canvas.addEventListener("mousedown", mDown, false);
  $('body').on('contextmenu', '#canvas', function(e){ return false; }); // prevent right click context menu default action

  // this is to correct for canvas blurryness on single pixel wide lines etc
  // this is extremely important when animating to reduce rendering artifacts and other oddities
  ctx.translate(0.5, 0.5);

  // start things up so that the background image can be drawn
  myGame = new Game(500);
  myGame.init();
  State.loopRunning = true;
  myGame.drawBG();
  State.myReq = requestAnimationFrame(gameLoop);

  // mouse move on canvas event
  canvas.addEventListener('mousemove', function(evt) {
    let rect = CANVAS.getBoundingClientRect();
      State.mouseX = evt.clientX - rect.left;
      State.mouseY = evt.clientY - rect.top;
      $("#coords-x").text(State.mouseX);
      $("#coords-y").text(State.mouseY);
  }, false);

  $('#init-btn').click(function() {
    console.log("init button clicked");
    generalLoopReset();
    State.loopRunning = true;
    State.gameStarted = true;
    myGame.mode = 'draw';
  });

  $('#start-btn').click(function() {
    console.log("start button clicked");
    myGame.mode = 'sim';
  });

  $('#reset-btn').click(function() {
    console.log("reset button clicked");
    generalLoopReset();
    State.loopRunning = true;
    State.gameStarted = false;
  });

  $('#pause-btn').click(function() {
    console.log("pause button clicked");
    if (myGame.paused === false) {
      myGame.pauseIt();
    } else if (myGame.paused === true) {
      myGame.unpauseIt();
    }
  });

});
